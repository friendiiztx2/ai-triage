import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { createAuthToken } from '@/lib/jwt';
import { verifyPassword, hashPassword } from '@/lib/password';
import { sanitizePostgrestFilter } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const db = supabaseAdmin || supabase;
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'กรุณากรอกชื่อบัญชีและรหัสผ่าน' }, { status: 400 });
    }

    const inputVal = email.trim();
    const passVal = password.trim();
    const safeSearch = sanitizePostgrestFilter(inputVal);

    if (!safeSearch) {
      return NextResponse.json({ error: 'ชื่อบัญชีหรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
    }

    const orClauses = [
      `email.ilike.${safeSearch}`,
      `name.ilike.%${safeSearch}%`
    ];
    const lower = safeSearch.toLowerCase();
    if (lower === 'system' || lower === 'admin' || lower === 'sysadmin' || lower.includes('system admin')) {
      orClauses.push('role.eq.system_admin');
    }

    // Query matching user by email, name, or role using safe sanitized filter
    const { data: dbUsers, error } = await db
      .from('users')
      .select('*')
      .or(orClauses.join(','))
      .limit(10);

    if (error) {
      console.error('Login DB query error:', error);
      return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบบัญชี' }, { status: 500 });
    }

    if (!dbUsers || dbUsers.length === 0) {
      return NextResponse.json({ error: 'ชื่อบัญชีหรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
    }

    // Find the user with matching password (supports bcrypt hash and legacy plaintext)
    let matchedUser: any = null;
    let needsRehash = false;

    for (const candidate of dbUsers) {
      const result = await verifyPassword(passVal, candidate.password);
      if (result.valid) {
        matchedUser = candidate;
        needsRehash = result.needsRehash;
        break;
      }
    }

    if (!matchedUser) {
      return NextResponse.json({ error: 'ชื่อบัญชีหรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
    }

    if (matchedUser.is_active === false) {
      return NextResponse.json({ error: 'บัญชีผู้ใช้นี้ถูกระงับการใช้งาน' }, { status: 403 });
    }

    // Auto-migrate legacy plaintext password to bcrypt hash in the database
    if (needsRehash) {
      try {
        const hashedPassword = await hashPassword(passVal);
        await db.from('users').update({ password: hashedPassword }).eq('id', matchedUser.id);
        console.log(`[Security] Auto-migrated user ${matchedUser.email} password to bcrypt.`);
      } catch (hashErr) {
        console.warn('Failed to auto-migrate password hash:', hashErr);
      }
    }

    // Record successful login in activity_logs
    try {
      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(matchedUser.id);
      await db.from('activity_logs').insert([
        {
          company_id: matchedUser.company_id || null,
          user_id: isValidUUID ? matchedUser.id : null,
          user_name: matchedUser.name || matchedUser.email || 'User',
          action_type: 'LOGIN',
          details: { info: `เข้าสู่ระบบสำเร็จ (สิทธิ์: ${matchedUser.role || 'user'})` },
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (logErr) {
      console.warn('Failed to record login activity log:', logErr);
    }

    const { password: _pass, ...userWithoutPassword } = matchedUser;

    // Issue cryptographically signed HMAC token (valid for 7 days)
    const token = await createAuthToken({
      id: matchedUser.id,
      email: matchedUser.email,
      name: matchedUser.name || matchedUser.email,
      role: matchedUser.role || 'staff',
      company_id: matchedUser.company_id || null,
      permissions: matchedUser.permissions || [],
    });

    const isProd = process.env.NODE_ENV === 'production';
    const response = NextResponse.json({
      user: userWithoutPassword,
      token,
    });

    // 1. HttpOnly, Secure, SameSite=Lax Cookie for backend authentication (tamper-proof)
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    // 2. Client-readable user_session cookie for UI rendering
    response.cookies.set('user_session', encodeURIComponent(JSON.stringify(userWithoutPassword)), {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    if (matchedUser.company_id) {
      response.cookies.set('company_id', matchedUser.company_id, {
        httpOnly: false,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      });
    }

    return response;
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
