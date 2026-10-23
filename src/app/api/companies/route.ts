import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { verifyApiAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { session, errorResponse } = await verifyApiAuth(request);
  if (errorResponse || !session) return errorResponse!;

  const db = supabaseAdmin || supabase;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    let query = db
      .from('companies')
      .select('id, name, created_at, status, quota, monthly_quota')
      .order('created_at', { ascending: false });

    // Multi-tenant Isolation: non-system_admin users only see their own assigned companies
    if (session.role !== 'system_admin' && session.role !== 'super_admin') {
      const allowedIds = (session.company_id || '').split(',').map((id: string) => id.trim()).filter(Boolean);
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
    console.error('Error fetching companies:', err);
    return NextResponse.json([], { status: 500 });
  }
}
