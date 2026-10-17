import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

async function getRequesterProfile(request: NextRequest) {
  const db = supabaseAdmin || supabase;
  const email = request.headers.get('x-user-email') || request.cookies.get('user_email')?.value;

  const sessionCookie = request.cookies.get('user_session')?.value;
  if (sessionCookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(sessionCookie));
      if (parsed && parsed.email) {
        const { data: user } = await db
          .from('users')
          .select('*')
          .eq('email', parsed.email.trim().toLowerCase())
          .maybeSingle();
        if (user) return user;
        return parsed;
      }
    } catch (e) {}
  }

  if (email) {
    const { data: user } = await db
      .from('users')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();
    if (user) return user;
  }

  return null;
}

export async function GET(request: NextRequest) {
  const db = supabaseAdmin || supabase;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const requester = await getRequesterProfile(request);
    if (!requester) {
      clearTimeout(timeoutId);
      return NextResponse.json({ error: 'Unauthorized: กรุณาเข้าสู่ระบบก่อนทำรายการ' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filterCompanyId = searchParams.get('company_id');

    let query = db.from('users').select('*');

    // Multi-tenant isolation: non-system_admin can ONLY see users in their own company
    if (requester.role !== 'system_admin') {
      const allowedIds = (requester.company_id || '').split(',').map((id: string) => id.trim()).filter(Boolean);
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

    return NextResponse.json(users);
  } catch (err: any) {
    clearTimeout(timeoutId);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const requester = await getRequesterProfile(request);
    if (!requester) {
      clearTimeout(timeoutId);
      return NextResponse.json({ error: 'Unauthorized: กรุณาเข้าสู่ระบบก่อนทำรายการ' }, { status: 401 });
    }
    if (requester.role !== 'system_admin' && requester.role !== 'super_admin') {
      clearTimeout(timeoutId);
      return NextResponse.json({ error: 'ปฏิเสธการเข้าถึง (สิทธิ์ไม่เพียงพอ)' }, { status: 403 });
    }

    const { email, name, role, company_id, password, permissions } = await request.json();

    const isSysAdmin = role === 'system_admin';
    if (isSysAdmin && requester.role !== 'system_admin') {
      return NextResponse.json({ error: 'ปฏิเสธการเข้าถึง (เฉพาะ System Admin เท่านั้นที่สามารถสร้าง System Admin ได้)' }, { status: 403 });
    }

    const assignedCompanyId = requester.role === 'system_admin' 
      ? (isSysAdmin ? null : company_id) 
      : requester.company_id;

    if (!email || !name || !role || !password || (!isSysAdmin && !assignedCompanyId)) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 });
    }

    // Check if user already exists
    const { data: existing, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .abortSignal(controller.signal)
      .maybeSingle();

    if (checkError) throw checkError;
    if (existing) {
      return NextResponse.json({ error: 'ชื่อบัญชี/อีเมลนี้ถูกใช้งานในระบบแล้ว' }, { status: 400 });
    }

    const newUser = {
      id: crypto.randomUUID(),
      email: email.trim().toLowerCase(),
      name: name.trim(),
      role,
      company_id: assignedCompanyId,
      password: password.trim(),
      permissions: permissions || [],
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('users')
      .insert([newUser])
      .select()
      .abortSignal(controller.signal);

    clearTimeout(timeoutId);
    if (error) throw error;

    return NextResponse.json(data?.[0] || { success: true });
  } catch (err: any) {
    clearTimeout(timeoutId);
    const errMsg = err.name === 'AbortError' ? 'Supabase connection timed out (30s)' : err.message;
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const requester = await getRequesterProfile(request);
    if (!requester) {
      clearTimeout(timeoutId);
      return NextResponse.json({ error: 'Unauthorized: กรุณาเข้าสู่ระบบก่อนทำรายการ' }, { status: 401 });
    }
    if (requester.role !== 'system_admin' && requester.role !== 'super_admin') {
      clearTimeout(timeoutId);
      return NextResponse.json({ error: 'ปฏิเสธการเข้าถึง (สิทธิ์ไม่เพียงพอ)' }, { status: 403 });
    }

    const { id, email, name, role, company_id, password, permissions } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ไม่พบรหัสผู้ใช้ที่ต้องการแก้ไข' }, { status: 400 });
    }

    // Verify company accessibility for non-system_admin
    if (requester.role !== 'system_admin') {
      const { data: targetUser } = await supabase.from('users').select('company_id, role').eq('id', id).maybeSingle();
      if (!targetUser) {
        return NextResponse.json({ error: 'ไม่พบผู้ใช้ที่ต้องการแก้ไข' }, { status: 404 });
      }
      if (targetUser.role === 'system_admin') {
        return NextResponse.json({ error: 'คุณไม่มีสิทธิ์แก้ไข System Admin' }, { status: 403 });
      }
      const allowedIds = (requester.company_id || '').split(',').map((s: string) => s.trim()).filter(Boolean);
      if (targetUser.company_id && !allowedIds.includes(targetUser.company_id)) {
        return NextResponse.json({ error: 'คุณไม่มีสิทธิ์แก้ไขผู้ใช้งานนอกเหนือจากบริษัทตนเอง' }, { status: 403 });
      }
      if (role === 'system_admin') {
        return NextResponse.json({ error: 'คุณไม่มีสิทธิ์กำหนดบทบาทเป็น System Admin' }, { status: 403 });
      }
    }

    const updateData: any = {};
    if (email) updateData.email = email.trim().toLowerCase();
    if (name) updateData.name = name.trim();
    if (role) {
      updateData.role = role;
      if (role === 'system_admin') {
        updateData.company_id = null;
      }
    }
    if (company_id !== undefined && requester.role === 'system_admin') {
      updateData.company_id = role === 'system_admin' ? null : company_id;
    }
    if (password && password.trim()) updateData.password = password.trim();
    if (Array.isArray(permissions)) updateData.permissions = permissions;

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .abortSignal(controller.signal);

    clearTimeout(timeoutId);
    if (error) throw error;

    return NextResponse.json(data?.[0] || { success: true });
  } catch (err: any) {
    clearTimeout(timeoutId);
    const errMsg = err.name === 'AbortError' ? 'Supabase connection timed out (30s)' : err.message;
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const requester = await getRequesterProfile(request);
    if (!requester) {
      clearTimeout(timeoutId);
      return NextResponse.json({ error: 'Unauthorized: กรุณาเข้าสู่ระบบก่อนทำรายการ' }, { status: 401 });
    }
    if (requester.role !== 'system_admin' && requester.role !== 'super_admin') {
      clearTimeout(timeoutId);
      return NextResponse.json({ error: 'ปฏิเสธการเข้าถึง (สิทธิ์ไม่เพียงพอ)' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ไม่พบรหัสผู้ใช้ที่ต้องการลบ' }, { status: 400 });
    }

    // Verify company accessibility for non-system_admin
    if (requester.role !== 'system_admin') {
      const { data: targetUser } = await supabase.from('users').select('company_id, role').eq('id', id).maybeSingle();
      if (!targetUser) {
        return NextResponse.json({ error: 'ไม่พบผู้ใช้ที่ต้องการลบ' }, { status: 404 });
      }
      if (targetUser.role === 'system_admin') {
        return NextResponse.json({ error: 'คุณไม่มีสิทธิ์ลบ System Admin' }, { status: 403 });
      }
      const allowedIds = (requester.company_id || '').split(',').map((s: string) => s.trim()).filter(Boolean);
      if (targetUser.company_id && !allowedIds.includes(targetUser.company_id)) {
        return NextResponse.json({ error: 'คุณไม่มีสิทธิ์ลบผู้ใช้งานนอกเหนือจากบริษัทตนเอง' }, { status: 403 });
      }
    }

    const { error } = await supabase
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
