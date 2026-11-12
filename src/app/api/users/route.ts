import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import {
  verifyApiAuth,
  isGlobalAdmin,
  getAllowedCompanyIds,
  canManageRole,
  VALID_ROLES,
} from '@/lib/auth';

/** Removes the password field before a user row is sent to the browser. */
function stripPassword(row: any): any {
  if (!row || typeof row !== 'object') return row;
  const { password: _pw, ...rest } = row;
  return rest;
}
import { hashPassword } from '@/lib/password';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const { session, errorResponse } = await verifyApiAuth(request);
  if (errorResponse || !session) return errorResponse!;

  const db = supabaseAdmin || supabase;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const { searchParams } = new URL(request.url);
    const filterCompanyId = searchParams.get('company_id');

    let query = db.from('users').select('id, name, email, role, company_id, permissions, created_at, password');

    // Multi-tenant isolation: non-system_admin can ONLY see users in their own company
    if (session.role !== 'system_admin' && session.role !== 'super_admin') {
      const allowedIds = (session.company_id || '').split(',').map((id: string) => id.trim()).filter(Boolean);
      if (allowedIds.length === 0) {
        clearTimeout(timeoutId);
        return NextResponse.json([]);
      }
      query = query.in('company_id', allowedIds);
    } else if (filterCompanyId && filterCompanyId !== 'all') {
      query = query.eq('company_id', filterCompanyId);
    }

    const { data: users, error } = await query
      .order('created_at', { ascending: false })
      .abortSignal(controller.signal);

    clearTimeout(timeoutId);
    if (error || !users) {
      return NextResponse.json([]);
    }

    // SECURITY: never send password values (hash or legacy plaintext) to the browser.
    // Expose only a status so the UI can show whether the password is secured.
    const safeUsers = users.map(({ password, ...rest }: any) => ({
      ...rest,
      password_status: !password
        ? 'none'
        : typeof password === 'string' && password.startsWith('$2')
          ? 'hashed'
          : 'legacy',
    }));

    return NextResponse.json(safeUsers);
  } catch (err: any) {
    clearTimeout(timeoutId);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  const { session, errorResponse } = await verifyApiAuth(request, ['system_admin', 'super_admin', 'admin']);
  if (errorResponse || !session) return errorResponse!;

  const db = supabaseAdmin || supabase;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const { email, name, role, company_id, password, permissions } = await request.json();

    // SECURITY: only known roles, and never a role above the creator's own
    if (!VALID_ROLES.includes(role)) {
      clearTimeout(timeoutId);
      return NextResponse.json({ error: 'บทบาทผู้ใช้ไม่ถูกต้อง' }, { status: 400 });
    }
    if (!canManageRole(session, role)) {
      clearTimeout(timeoutId);
      return NextResponse.json({ error: 'ปฏิเสธการเข้าถึง: คุณไม่สามารถสร้างผู้ใช้ที่มีสิทธิ์สูงกว่าตนเองได้' }, { status: 403 });
    }

    const isSysAdmin = role === 'system_admin' || role === 'super_admin';

    // Non-global admins may only place users into one of their own companies
    let assignedCompanyId: string | null;
    if (isGlobalAdmin(session)) {
      assignedCompanyId = isSysAdmin ? null : company_id;
    } else {
      const allowed = getAllowedCompanyIds(session);
      assignedCompanyId = allowed.includes(company_id) ? company_id : allowed[0] || null;
    }

    if (!email || !name || !role || !password || (!isSysAdmin && !assignedCompanyId)) {
      clearTimeout(timeoutId);
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 });
    }

    // Check if user already exists
    const { data: existing, error: checkError } = await db
      .from('users')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .abortSignal(controller.signal)
      .maybeSingle();

    if (checkError) throw checkError;
    if (existing) {
      clearTimeout(timeoutId);
      return NextResponse.json({ error: 'ชื่อบัญชี/อีเมลนี้ถูกใช้งานในระบบแล้ว' }, { status: 400 });
    }

    // Securely hash password with bcrypt before database insertion
    const hashedPassword = await hashPassword(password.trim());

    const newUser = {
      id: crypto.randomUUID(),
      email: email.trim().toLowerCase(),
      name: name.trim(),
      role,
      company_id: assignedCompanyId,
      password: hashedPassword,
      permissions: permissions || [],
      created_at: new Date().toISOString()
    };

    const { data, error } = await db
      .from('users')
      .insert([newUser])
      .select()
      .abortSignal(controller.signal);

    clearTimeout(timeoutId);
    if (error) throw error;

    const created = data?.[0] || newUser;
    return NextResponse.json(stripPassword(created));
  } catch (err: any) {
    clearTimeout(timeoutId);
    const errMsg = err.name === 'AbortError' ? 'Supabase connection timed out (30s)' : err.message;
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const { session, errorResponse } = await verifyApiAuth(request, ['system_admin', 'super_admin', 'admin']);
  if (errorResponse || !session) return errorResponse!;

  const db = supabaseAdmin || supabase;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const { id, email, name, role, company_id, password, permissions } = await request.json();

    if (!id) {
      clearTimeout(timeoutId);
      return NextResponse.json({ error: 'ไม่พบรหัสผู้ใช้ที่ต้องการแก้ไข' }, { status: 400 });
    }

    // SECURITY: role hierarchy + company isolation for every caller
    const isSysAdmin = isGlobalAdmin(session);
    const { data: targetUser } = await db.from('users').select('company_id, role').eq('id', id).maybeSingle();
    if (!targetUser) {
      clearTimeout(timeoutId);
      return NextResponse.json({ error: 'ไม่พบผู้ใช้ที่ต้องการแก้ไข' }, { status: 404 });
    }
    if (!canManageRole(session, targetUser.role)) {
      clearTimeout(timeoutId);
      return NextResponse.json({ error: 'คุณไม่มีสิทธิ์แก้ไขผู้ใช้ที่มีสิทธิ์สูงกว่าตนเอง' }, { status: 403 });
    }
    if (role && (!VALID_ROLES.includes(role) || !canManageRole(session, role))) {
      clearTimeout(timeoutId);
      return NextResponse.json({ error: 'คุณไม่มีสิทธิ์กำหนดบทบาทนี้' }, { status: 403 });
    }
    if (!isSysAdmin) {
      const allowedIds = getAllowedCompanyIds(session);
      if (!targetUser.company_id || !allowedIds.includes(targetUser.company_id)) {
        clearTimeout(timeoutId);
        return NextResponse.json({ error: 'คุณไม่มีสิทธิ์แก้ไขผู้ใช้งานนอกเหนือจากบริษัทตนเอง' }, { status: 403 });
      }
    }

    const updateData: any = {};
    if (email) updateData.email = email.trim().toLowerCase();
    if (name) updateData.name = name.trim();
    if (role) {
      updateData.role = role;
      if (role === 'system_admin' || role === 'super_admin') {
        updateData.company_id = null;
      }
    }
    if (company_id !== undefined && isSysAdmin) {
      updateData.company_id = (role === 'system_admin' || role === 'super_admin') ? null : company_id;
    }
    if (password && password.trim()) {
      updateData.password = await hashPassword(password.trim());
    }
    if (Array.isArray(permissions)) updateData.permissions = permissions;

    const { data, error } = await db
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .abortSignal(controller.signal);

    clearTimeout(timeoutId);
    if (error) throw error;

    const updated = data?.[0] || { success: true };
    return NextResponse.json(stripPassword(updated));
  } catch (err: any) {
    clearTimeout(timeoutId);
    const errMsg = err.name === 'AbortError' ? 'Supabase connection timed out (30s)' : err.message;
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { session, errorResponse } = await verifyApiAuth(request, ['system_admin', 'super_admin', 'admin']);
  if (errorResponse || !session) return errorResponse!;

  const db = supabaseAdmin || supabase;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      clearTimeout(timeoutId);
      return NextResponse.json({ error: 'ไม่พบรหัสผู้ใช้ที่ต้องการลบ' }, { status: 400 });
    }

    if (id === session.id) {
      clearTimeout(timeoutId);
      return NextResponse.json({ error: 'ไม่สามารถลบบัญชีของตนเองได้' }, { status: 400 });
    }

    // SECURITY: role hierarchy + company isolation for every caller
    const isSysAdmin = isGlobalAdmin(session);
    const { data: targetUser } = await db.from('users').select('company_id, role').eq('id', id).maybeSingle();
    if (!targetUser) {
      clearTimeout(timeoutId);
      return NextResponse.json({ error: 'ไม่พบผู้ใช้ที่ต้องการลบ' }, { status: 404 });
    }
    if (!canManageRole(session, targetUser.role)) {
      clearTimeout(timeoutId);
      return NextResponse.json({ error: 'คุณไม่มีสิทธิ์ลบผู้ใช้ที่มีสิทธิ์สูงกว่าตนเอง' }, { status: 403 });
    }
    if (!isSysAdmin) {
      const allowedIds = getAllowedCompanyIds(session);
      if (!targetUser.company_id || !allowedIds.includes(targetUser.company_id)) {
        clearTimeout(timeoutId);
        return NextResponse.json({ error: 'คุณไม่มีสิทธิ์ลบผู้ใช้งานนอกเหนือจากบริษัทตนเอง' }, { status: 403 });
      }
    }

    const { error } = await db
      .from('users')
      .delete()
      .eq('id', id)
      .abortSignal(controller.signal);

    clearTimeout(timeoutId);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    clearTimeout(timeoutId);
    const errMsg = err.name === 'AbortError' ? 'Supabase connection timed out (30s)' : err.message;
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
