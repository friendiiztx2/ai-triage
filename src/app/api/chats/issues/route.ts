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
    let query = db
      .from('chat_issues')
      .select('id, chat_id, category_id, priority, department, summary, recommended_reply, created_at, is_human_verified')
      .order('created_at', { ascending: true });

    if (chatIdsParam) {
      const ids = chatIdsParam.split(',').map((s: string) => s.trim()).filter(Boolean);
      query = query.in('chat_id', ids);
    } else {
      query = query.eq('chat_id', chatId);
    }

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
