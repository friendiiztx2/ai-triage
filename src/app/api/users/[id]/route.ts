import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { verifyApiAuth } from '@/lib/auth';
import { hashPassword } from '@/lib/password';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, errorResponse } = await verifyApiAuth(request, ['system_admin', 'super_admin']);
  if (errorResponse || !session) return errorResponse!;

  const db = supabaseAdmin || supabase;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    if (!id) {
      clearTimeout(timeoutId);
      return NextResponse.json({ error: 'ไม่พบรหัสผู้ใช้ที่ต้องการแก้ไข' }, { status: 400 });
    }

    const { role, permissions, password, name, email, company_id } = await request.json();
    if (!role && !permissions && !password && !name && !email && company_id === undefined) {
      clearTimeout(timeoutId);
      return NextResponse.json({ error: 'กรุณาระบุข้อมูลที่ต้องการแก้ไข' }, { status: 400 });
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.trim().toLowerCase();
    if (role) {
      updateData.role = role;
      if (role === 'system_admin' || role === 'super_admin') {
        updateData.company_id = null;
      }
    }
    if (company_id !== undefined && (session.role === 'system_admin' || session.role === 'super_admin')) {
      updateData.company_id = (role === 'system_admin' || role === 'super_admin') ? null : company_id;
    }
    if (password && password.trim()) {
      updateData.password = await hashPassword(password.trim());
    }
    if (Array.isArray(permissions)) {
      updateData.permissions = permissions;
    }

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
