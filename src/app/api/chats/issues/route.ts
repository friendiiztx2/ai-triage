import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chat_id');

  if (!chatId) {
    return NextResponse.json({ error: 'chat_id query parameter is required' }, { status: 400 });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const { data, error } = await supabase
      .from('chat_issues')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })
      .abortSignal(controller.signal);

    clearTimeout(timeoutId);
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    clearTimeout(timeoutId);
    const errMsg = err.name === 'AbortError' ? 'Supabase connection timed out (30s)' : err.message;
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
