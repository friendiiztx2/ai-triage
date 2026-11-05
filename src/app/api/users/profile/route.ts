import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { verifyApiAuth } from '@/lib/auth';
import { createAuthToken } from '@/lib/jwt';
import { verifyPassword, hashPassword } from '@/lib/password';

export async function PUT(request: NextRequest) {
  const db = supabaseAdmin || supabase;
  
  // 1. Verify user authentication
  const { session, errorResponse } = await verifyApiAuth(request);
  if (errorResponse || !session) {
    return errorResponse || NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อนทำรายการ' }, { status: 401 });
  }

  try {
    const { name, avatar, currentPassword, newPassword, userId, userEmail } = await request.json();

    const isUUID = (val: any) =>
      typeof val === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    let candidate: any = null;

    // 2. Fetch target user from DB by valid UUID first
    const targetUuid = [session.id, userId].find((id) => isUUID(id));
    if (targetUuid) {
      const { data } = await db.from('users').select('*').eq('id', targetUuid).limit(1);
      if (data && data.length > 0) {
        candidate = data[0];
      }
    }

    // 2b. Fallback: Search by email or username if ID is not a UUID or not found
    if (!candidate) {
      const searchTerms = [
        session.email,
        userEmail,
        !isUUID(session.id) ? session.id : null,
        !isUUID(userId) ? userId : null,
        session.name,
      ].filter(Boolean) as string[];

      for (const term of searchTerms) {
        if (!term || typeof term !== 'string') continue;
        const cleanTerm = term.trim();
        if (!cleanTerm) continue;

        const { data: byEmail } = await db.from('users').select('*').eq('email', cleanTerm).limit(1);
        if (byEmail && byEmail.length > 0) {
          candidate = byEmail[0];
          break;
        }

        const { data: byName } = await db.from('users').select('*').eq('name', cleanTerm).limit(1);
        if (byName && byName.length > 0) {
          candidate = byName[0];
          break;
        }
      }
    }

    if (!candidate) {
      return NextResponse.json({ error: 'ไม่พบบัญชีผู้ใช้งานในระบบ' }, { status: 404 });
    }

    const updateData: Record<string, any> = {};

    // 3. Handle password change if requested
    if (newPassword && newPassword.trim()) {
      const trimmedNewPass = newPassword.trim();
      if (trimmedNewPass.length < 4) {
        return NextResponse.json({ error: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร' }, { status: 400 });
      }

      // If user provided a current password, verify it first
      if (currentPassword && currentPassword.trim()) {
        const check = await verifyPassword(currentPassword.trim(), candidate.password);
        if (!check.valid) {
          return NextResponse.json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง' }, { status: 400 });
        }
      }

      // Hash with bcrypt (salt 10)
      updateData.password = await hashPassword(trimmedNewPass);
    }

    // 4. Handle name / nickname update
    if (name !== undefined) {
      const trimmedName = name.trim();
      if (trimmedName.length > 0) {
        updateData.name = trimmedName;
      }
    }

    // 5. Handle preferences (avatar and nickname)
    const existingPrefs = (candidate.preferences && typeof candidate.preferences === 'object')
      ? { ...candidate.preferences }
      : {};

    let prefsChanged = false;
    if (avatar !== undefined) {
      existingPrefs.avatar = avatar; // base64 string, url, or null
      prefsChanged = true;
      if (typeof avatar === 'string' && (avatar.startsWith('http') || avatar.startsWith('data:'))) {
        updateData.avatar_url = avatar;
      } else if (avatar === null) {
        updateData.avatar_url = null;
      }
    }
    if (name !== undefined && name.trim()) {
      existingPrefs.nickname = name.trim();
      prefsChanged = true;
    }

    if (prefsChanged) {
      updateData.preferences = existingPrefs;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'ไม่มีข้อมูลที่เปลี่ยนแปลง' }, { status: 400 });
    }

    // 6. Save update to Supabase using candidate's validated UUID
    const { data: updatedRows, error: updateErr } = await db
      .from('users')
      .update(updateData)
      .eq('id', candidate.id)
      .select();

    if (updateErr) {
      console.error('Profile update error:', updateErr);
      return NextResponse.json({ error: 'ไม่สามารถบันทึกข้อมูลได้: ' + updateErr.message }, { status: 500 });
    }

    const updatedUser = updatedRows?.[0] || { ...candidate, ...updateData };
    const { password: _pass, ...userWithoutPassword } = updatedUser;

    // 7. Log activity
    try {
      const isValidUUID = isUUID(candidate.id);
      await db.from('activity_logs').insert([
        {
          company_id: candidate.company_id || null,
          user_id: isValidUUID ? candidate.id : null,
          user_name: userWithoutPassword.name || userWithoutPassword.email || 'User',
          action_type: 'UPDATE_PROFILE',
          details: {
            info: 'อัปเดตข้อมูลส่วนตัว (โปรไฟล์)',
            changedFields: Object.keys(updateData).filter(k => k !== 'password'),
            passwordChanged: Boolean(updateData.password),
          },
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (logErr) {
      console.warn('Failed to record update_profile log:', logErr);
    }

    // 8. Re-issue signed cryptographic auth token with updated name/info and validated UUID
    const token = await createAuthToken({
      id: userWithoutPassword.id,
      email: userWithoutPassword.email,
      name: userWithoutPassword.name || userWithoutPassword.email,
      role: userWithoutPassword.role || 'staff',
      company_id: userWithoutPassword.company_id || null,
      permissions: userWithoutPassword.permissions || [],
    });

    const isProd = process.env.NODE_ENV === 'production';
    const response = NextResponse.json({
      success: true,
      user: {
        ...userWithoutPassword,
        avatar: existingPrefs.avatar || userWithoutPassword.avatar_url || null,
      },
      message: 'บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว',
    });

    // Update authentication cookies with sanitized updated user session
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    response.cookies.set('user_session', encodeURIComponent(JSON.stringify({
      ...userWithoutPassword,
      avatar: existingPrefs.avatar || userWithoutPassword.avatar_url || null,
    })), {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (err: any) {
    console.error('PUT /api/users/profile exception:', err);
    return NextResponse.json({ error: err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' }, { status: 500 });
  }
}
