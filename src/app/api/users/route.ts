import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { verifyApiAuth } from '@/lib/auth';
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

    let query = db.from('users').select('*');

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

    // Never expose password hashes or plaintext passwords to the frontend
    const sanitizedUsers = users.map(({ password: _pass, ...rest }: any) => rest);
    return NextResponse.json(sanitizedUsers);
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

    const isSysAdmin = role === 'system_admin';
    if (isSysAdmin && session.role !== 'system_admin' && session.role !== 'super_admin') {
      clearTimeout(timeoutId);
      return NextResponse.json({ error: 'ปฏิเสธการเข้าถึง (เฉพาะ System Admin เท่านั้นที่สามารถสร้าง System Admin ได้)' }, { status: 403 });
    }

    const assignedCompanyId = (session.role === 'system_admin' || session.role === 'super_admin')
      ? (isSysAdmin ? null : company_id) 
      : session.company_id;

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
    const { password: _pass, ...userWithoutPassword } = created;
    return NextResponse.json(userWithoutPassword);
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

    // Verify company accessibility for non-system_admin
    const isSysAdmin = session.role === 'system_admin' || session.role === 'super_admin';
    if (!isSysAdmin) {
      const { data: targetUser } = await db.from('users').select('company_id, role').eq('id', id).maybeSingle();
      if (!targetUser) {
        clearTimeout(timeoutId);
        return NextResponse.json({ error: 'ไม่พบผู้ใช้ที่ต้องการแก้ไข' }, { status: 404 });
      }
      if (targetUser.role === 'system_admin' || targetUser.role === 'super_admin') {
        clearTimeout(timeoutId);
        return NextResponse.json({ error: 'คุณไม่มีสิทธิ์แก้ไข System Admin' }, { status: 403 });
      }
      const allowedIds = (session.company_id || '').split(',').map((s: string) => s.trim()).filter(Boolean);
      if (targetUser.company_id && !allowedIds.includes(targetUser.company_id)) {
        clearTimeout(timeoutId);
        return NextResponse.json({ error: 'คุณไม่มีสิทธิ์แก้ไขผู้ใช้งานนอกเหนือจากบริษัทตนเอง' }, { status: 403 });
      }
      if (role === 'system_admin' || role === 'super_admin') {
        clearTimeout(timeoutId);
        return NextResponse.json({ error: 'คุณไม่มีสิทธิ์กำหนดบทบาทเป็น System Admin' }, { status: 403 });
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
    const { password: _pass, ...userWithoutPassword } = updated;
    return NextResponse.json(userWithoutPassword);
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

    // Verify company accessibility for non-system_admin
    const isSysAdmin = session.role === 'system_admin' || session.role === 'super_admin';
    if (!isSysAdmin) {
      const { data: targetUser } = await db.from('users').select('company_id, role').eq('id', id).maybeSingle();
      if (!targetUser) {
        clearTimeout(timeoutId);
        return NextResponse.json({ error: 'ไม่พบผู้ใช้ที่ต้องการลบ' }, { status: 404 });
      }
      if (targetUser.role === 'system_admin' || targetUser.role === 'super_admin') {
        clearTimeout(timeoutId);
        return NextResponse.json({ error: 'คุณไม่มีสิทธิ์ลบ System Admin' }, { status: 403 });
      }
      const allowedIds = (session.company_id || '').split(',').map((s: string) => s.trim()).filter(Boolean);
      if (targetUser.company_id && !allowedIds.includes(targetUser.company_id)) {
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
