import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  const companyId = request.headers.get('x-company-id') || request.cookies.get('company_id')?.value || null;

  try {
    const { data, error } = await supabase
      .rpc('get_triage_dashboard_summary', {
        p_company_id: companyId
      })
      .abortSignal(controller.signal);

    clearTimeout(timeoutId);

    if (error) {
      return NextResponse.json({ error: error.message, isFallback: true }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    clearTimeout(timeoutId);
    const errMsg = err.name === 'AbortError' ? 'Supabase RPC summary timed out (10s)' : err.message;
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
