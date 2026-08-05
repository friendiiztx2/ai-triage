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

  return { role: 'system_admin', name: 'System Admin' };
}

export async function GET(request: NextRequest) {
  const db = supabaseAdmin || supabase;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const requester = await getRequesterProfile(request);

    const { searchParams } = new URL(request.url);
    const filterCompanyId = searchParams.get('company_id');

    let query = db.from('users').select('*');

    if (filterCompanyId && filterCompanyId !== 'all') {
      query = query.eq('company_id', filterCompanyId);
    }

    const { data: users, error } = await query
      .order('created_at', { ascending: false })
      .abortSignal(controller.signal);

    clearTimeout(timeoutId);
    if (error || !users || users.length === 0) {
      // Fallback to fetch all users without filter
      const { data: allUsers } = await db.from('users').select('*').order('created_at', { ascending: false });
      return NextResponse.json(allUsers || []);
    }

    return NextResponse.json(users);
  } catch (err: any) {
    clearTimeout(timeoutId);
    const dbFallback = supabaseAdmin || supabase;
    const { data: fallbackUsers } = await dbFallback.from('users').select('*');
    return NextResponse.json(fallbackUsers || []);
  }
}

export async function POST(request: NextRequest) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const requester = await getRequesterProfile(request);
    if (!requester || (requester.role !== 'system_admin' && requester.role !== 'super_admin')) {
      return NextResponse.json({ error: 'ปฏิเสธการเข้าถึง (สิทธิ์ไม่เพียงพอ)' }, { status: 403 });
    }

    const { email, name, role, company_id, password, permissions } = await request.json();

    const isSysAdmin = role === 'system_admin';
    if (!email || !name || !role || !password || (!isSysAdmin && !company_id)) {
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

    // super_admin cannot create user in a company they don't have access to
    if (requester.role === 'super_admin' && company_id) {
      const allowedIds = (requester.company_id || '').split(',').filter(Boolean);
      if (allowedIds.length > 0 && !allowedIds.includes(company_id)) {
        return NextResponse.json({ error: 'คุณไม่มีสิทธิ์สร้างผู้ใช้งานนอกเหนือจากบริษัทตนเอง' }, { status: 403 });
      }
    }

    const newUser = {
      id: crypto.randomUUID(),
      email: email.trim().toLowerCase(),
      name: name.trim(),
      role,
      company_id: isSysAdmin ? null : company_id,
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
    if (!requester || (requester.role !== 'system_admin' && requester.role !== 'super_admin')) {
      return NextResponse.json({ error: 'ปฏิเสธการเข้าถึง' }, { status: 403 });
    }

    const { id, email, name, role, company_id, password, permissions } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ไม่พบรหัสผู้ใช้ที่ต้องการแก้ไข' }, { status: 400 });
    }

    // Verify company accessibility for super_admin
    if (requester.role === 'super_admin') {
      const { data: targetUser } = await supabase.from('users').select('company_id').eq('id', id).maybeSingle();
      const allowedIds = (requester.company_id || '').split(',').filter(Boolean);
      if (targetUser && allowedIds.length > 0 && !allowedIds.includes(targetUser.company_id)) {
        return NextResponse.json({ error: 'คุณไม่มีสิทธิ์แก้ไขผู้ใช้งานนอกเหนือจากบริษัทตนเอง' }, { status: 403 });
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
    if (company_id !== undefined) {
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
    if (!requester || (requester.role !== 'system_admin' && requester.role !== 'super_admin')) {
      return NextResponse.json({ error: 'ปฏิเสธการเข้าถึง' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ไม่พบรหัสผู้ใช้ที่ต้องการลบ' }, { status: 400 });
    }

    // Verify company accessibility for super_admin
    if (requester.role === 'super_admin') {
      const { data: targetUser } = await supabase.from('users').select('company_id').eq('id', id).maybeSingle();
      const allowedIds = (requester.company_id || '').split(',').filter(Boolean);
      if (targetUser && allowedIds.length > 0 && !allowedIds.includes(targetUser.company_id)) {
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
