import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { verifyApiAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { session, errorResponse } = await verifyApiAuth(request);
  if (errorResponse || !session) return errorResponse!;

  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chat_id');
  const chatIdsParam = searchParams.get('chat_ids');

  if (!chatId && !chatIdsParam) {
    return NextResponse.json({ error: 'chat_id or chat_ids query parameter is required' }, { status: 400 });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const db = supabaseAdmin || supabase;

    let requestedIds = chatIdsParam
      ? chatIdsParam.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [chatId as string];

    // SECURITY: Multi-tenant isolation — non-global admins may only read issues
    // for chats that belong to their own company(ies).
    const isGlobalAdmin = session.role === 'system_admin' || session.role === 'super_admin';
    if (!isGlobalAdmin) {
      const allowedCompanyIds = (session.company_id || '')
        .split(',')
        .map((id: string) => id.trim())
        .filter(Boolean);

      if (allowedCompanyIds.length === 0) {
        clearTimeout(timeoutId);
        return NextResponse.json([]);
      }

      const { data: ownedChats, error: ownErr } = await db
        .from('chats')
        .select('id')
        .in('id', requestedIds)
        .in('company_id', allowedCompanyIds)
        .abortSignal(controller.signal);

      if (ownErr) throw ownErr;
      requestedIds = (ownedChats || []).map((c: any) => String(c.id));

      if (requestedIds.length === 0) {
        clearTimeout(timeoutId);
        return NextResponse.json([]);
      }
    }

    const query = db
      .from('chat_issues')
      .select('id, chat_id, category_id, priority, department, summary, recommended_reply, created_at, is_human_verified')
      .order('created_at', { ascending: true })
      .in('chat_id', requestedIds);

    const { data, error } = await query.abortSignal(controller.signal);

    clearTimeout(timeoutId);
    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (err: any) {
    clearTimeout(timeoutId);
    const errMsg = err.name === 'AbortError' ? 'Supabase connection timed out (30s)' : err.message;
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
