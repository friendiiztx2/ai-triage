import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tableName = searchParams.get('table') || 'chats';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1)
      .abortSignal(controller.signal);
      
    clearTimeout(timeoutId);
    if (error) throw error;
    
    const row = data && data.length > 0 ? data[0] : null;
    return NextResponse.json(row);
  } catch (err: any) {
    clearTimeout(timeoutId);
    const errMsg = err.name === 'AbortError' ? 'Supabase connection timed out (30s)' : err.message;
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
