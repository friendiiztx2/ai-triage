import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

async function getRequesterInfo(request: NextRequest): Promise<{ role: string; company_id: string } | null> {
  const email = request.headers.get('x-user-email') || request.cookies.get('user_email')?.value;
  const password = request.headers.get('x-user-password') || request.cookies.get('user_password')?.value;

  if (!email || !password) {
    const sessionCookie = request.cookies.get('user_session')?.value;
    if (sessionCookie) {
      try {
        const parsed = JSON.parse(decodeURIComponent(sessionCookie));
        return { role: parsed.role, company_id: parsed.company_id || '' };
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  const { data: user } = await supabase
    .from('users')
    .select('role, company_id')
    .eq('email', email.trim().toLowerCase())
    .eq('password', password.trim())
    .maybeSingle();

  if (!user) return null;
  return { role: user.role, company_id: user.company_id || '' };
}

export async function GET(request: NextRequest) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const requester = await getRequesterInfo(request);
    if (!requester) {
      return NextResponse.json({ error: 'ปฏิเสธการเข้าถึง' }, { status: 403 });
    }

    let query = supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });

    // Multi-tenant Isolation: non-system_admin users only see their own assigned companies
    if (requester.role !== 'system_admin') {
      const allowedIds = requester.company_id.split(',').map((id: string) => id.trim()).filter(Boolean);
      if (allowedIds.length === 0) {
        clearTimeout(timeoutId);
        return NextResponse.json([]);
      }
      query = query.in('id', allowedIds);
    }

    const { data: companies, error } = await query.abortSignal(controller.signal);

    clearTimeout(timeoutId);
    if (error) throw error;

    return NextResponse.json(companies || []);
  } catch (err: any) {
    clearTimeout(timeoutId);
    const errMsg = err.name === 'AbortError' ? 'Supabase connection timed out (30s)' : err.message;
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

