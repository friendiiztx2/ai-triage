import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

async function verifySystemAdmin(request: NextRequest): Promise<boolean> {
  const email = request.headers.get('x-user-email') || request.cookies.get('user_email')?.value;
  const password = request.headers.get('x-user-password') || request.cookies.get('user_password')?.value;

  if (!email || !password) {
    // Check if session cookie exists as fallback
    const sessionCookie = request.cookies.get('user_session')?.value;
    if (sessionCookie) {
      try {
        const parsed = JSON.parse(decodeURIComponent(sessionCookie));
        return parsed.role === 'system_admin' || parsed.role === 'super_admin';
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  const { data: users, error } = await supabase
    .from('users')
    .select('role')
    .eq('email', email.trim().toLowerCase())
    .eq('password', password.trim());

  if (error || !users || users.length === 0) return false;
  return users.some((u: any) => u.role === 'system_admin' || u.role === 'super_admin');
}

export async function GET(request: NextRequest) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const isAuthorized = await verifySystemAdmin(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'ปฏิเสธการเข้าถึง (สิทธิ์เฉพาะ System Admin)' }, { status: 403 });
    }

    const { data: companies, error } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false })
      .abortSignal(controller.signal);

    clearTimeout(timeoutId);
    if (error) throw error;

    return NextResponse.json(companies || []);
  } catch (err: any) {
    clearTimeout(timeoutId);
    const errMsg = err.name === 'AbortError' ? 'Supabase connection timed out (30s)' : err.message;
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
