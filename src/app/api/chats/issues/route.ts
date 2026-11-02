import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { verifyApiAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { session, errorResponse } = await verifyApiAuth(request);
  if (errorResponse || !session) return errorResponse!;

  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chat_id');

  if (!chatId) {
    return NextResponse.json({ error: 'chat_id query parameter is required' }, { status: 400 });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const db = supabaseAdmin || supabase;
    const { data, error } = await db
      .from('chat_issues')
      .select('id, chat_id, category_id, priority, department, summary, recommended_reply, created_at, is_human_verified')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })
      .abortSignal(controller.signal);

    clearTimeout(timeoutId);
    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (err: any) {
    clearTimeout(timeoutId);
    const errMsg = err.name === 'AbortError' ? 'Supabase connection timed out (30s)' : err.message;
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
