import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { createAuthToken } from '@/lib/jwt';
import { verifyPassword, hashPassword } from '@/lib/password';
import { sanitizePostgrestFilter } from '@/lib/auth';

// ---- Simple in-memory login rate limiter -------------------------------------
// Note: per server instance only. For multi-instance production, back this with a
// shared store (e.g. a Supabase table or Upstash Redis).
const MAX_FAILED_ATTEMPTS = 8;
const LOCK_WINDOW_MS = 15 * 60 * 1000;
const loginFailures = new Map<string, { count: number; firstAt: number }>();

function getLoginLockSeconds(key: string): number {
  const entry = loginFailures.get(key);
  if (!entry) return 0;
  const elapsed = Date.now() - entry.firstAt;
  if (elapsed > LOCK_WINDOW_MS) {
    loginFailures.delete(key);
    return 0;
  }
  return entry.count >= MAX_FAILED_ATTEMPTS ? Math.ceil((LOCK_WINDOW_MS - elapsed) / 1000) : 0;
}

function recordLoginFailure(key: string) {
  const now = Date.now();
  const entry = loginFailures.get(key);
  if (!entry || now - entry.firstAt > LOCK_WINDOW_MS) {
    loginFailures.set(key, { count: 1, firstAt: now });
  } else {
    entry.count += 1;
  }
  if (loginFailures.size > 5000) {
    // prevent unbounded growth
    const oldest = loginFailures.keys().next().value;
    if (oldest) loginFailures.delete(oldest);
  }
}

function clearLoginFailures(key: string) {
  loginFailures.delete(key);
}

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

    // SECURITY: basic brute-force protection (per server instance)
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const rateKey = `${clientIp}|${inputVal.toLowerCase()}`;
    const retryAfter = getLoginLockSeconds(rateKey);
    if (retryAfter > 0) {
      return NextResponse.json(
        { error: `พยายามเข้าสู่ระบบผิดหลายครั้งเกินไป กรุณารอ ${Math.ceil(retryAfter / 60)} นาทีแล้วลองใหม่` },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      );
    }

    // SECURITY: exact match only — by email (case-insensitive) or by exact account name.
    // No partial/wildcard matching and no role-keyword shortcuts (e.g. typing "admin").
    const lowerInput = inputVal.toLowerCase();
    const escapedName = inputVal.replace(/[\\%_]/g, (ch: string) => `\\${ch}`);

    const [byEmailRes, byNameRes] = await Promise.all([
      db.from('users').select('*').eq('email', lowerInput).limit(5),
      db.from('users').select('*').ilike('name', escapedName).limit(5),
    ]);

    const error = byEmailRes.error || byNameRes.error;
    if (error) {
      console.error('Login DB query error:', error);
      return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบบัญชี' }, { status: 500 });
    }

    const seen = new Set<string>();
    const dbUsers = [...(byEmailRes.data || []), ...(byNameRes.data || [])].filter((u: any) => {
      const exact =
        (typeof u.email === 'string' && u.email.toLowerCase() === lowerInput) ||
        (typeof u.name === 'string' && u.name.trim().toLowerCase() === lowerInput);
      if (!exact || seen.has(u.id)) return false;
      seen.add(u.id);
      return true;
    });

    if (dbUsers.length === 0) {
      recordLoginFailure(rateKey);
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
      recordLoginFailure(rateKey);
      return NextResponse.json({ error: 'ชื่อบัญชีหรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
    }
    clearLoginFailures(rateKey);

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
    // Don't leak internal error details on the public login endpoint
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดของระบบ กรุณาลองใหม่อีกครั้ง' }, { status: 500 });
  }
}
