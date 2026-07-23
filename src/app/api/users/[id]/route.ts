import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

async function getRequesterProfile(request: NextRequest) {
  const email = request.headers.get('x-user-email') || request.cookies.get('user_email')?.value;
  const password = request.headers.get('x-user-password') || request.cookies.get('user_password')?.value;

  if (!email || !password) {
    const sessionCookie = request.cookies.get('user_session')?.value;
    if (sessionCookie) {
      try {
        const parsed = JSON.parse(decodeURIComponent(sessionCookie));
        const { data: user } = await supabase
          .from('users')
          .select('*')
          .eq('email', parsed.email.trim().toLowerCase())
          .eq('password', parsed.password || '')
          .maybeSingle();
        if (user) return user;
        return parsed;
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.trim().toLowerCase())
    .eq('password', password.trim())
    .maybeSingle();

  return user;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    if (!id) {
      return NextResponse.json({ error: 'ไม่พบรหัสผู้ใช้ที่ต้องการแก้ไข' }, { status: 400 });
    }

    const requester = await getRequesterProfile(request);
    if (!requester || (requester.role !== 'system_admin' && requester.role !== 'super_admin')) {
      return NextResponse.json({ error: 'ปฏิเสธการเข้าถึง' }, { status: 403 });
    }

    const { role, permissions } = await request.json();
    if (!role && !permissions) {
      return NextResponse.json({ error: 'กรุณาระบุข้อมูลที่ต้องการแก้ไข (role หรือ permissions)' }, { status: 400 });
    }

    const updateData: any = {};
    if (role) {
      updateData.role = role;
      if (role === 'system_admin') {
        updateData.company_id = null;
      }
    }
    if (Array.isArray(permissions)) {
      updateData.permissions = permissions;
    }

    // Verify company accessibility for super_admin
    if (requester.role === 'super_admin') {
      const { data: targetUser } = await supabase.from('users').select('company_id').eq('id', id).maybeSingle();
      const allowedIds = (requester.company_id || '').split(',').filter(Boolean);
      if (targetUser && allowedIds.length > 0 && !allowedIds.includes(targetUser.company_id)) {
        return NextResponse.json({ error: 'คุณไม่มีสิทธิ์แก้ไขผู้ใช้งานนอกเหนือจากบริษัทตนเอง' }, { status: 403 });
      }
    }

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
