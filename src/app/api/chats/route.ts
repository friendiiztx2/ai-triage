import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  const companyId = request.headers.get('x-company-id') || request.cookies.get('company_id')?.value;

  try {
    let query = supabase.from('chats').select('*, chat_issues(*)');
    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data, error } = await query.abortSignal(controller.signal);

    clearTimeout(timeoutId);
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    clearTimeout(timeoutId);
    const errMsg = err.name === 'AbortError' ? 'Supabase connection timed out (30s)' : err.message;
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const body = await request.json();
    const { id, ids, category_id, priority, status } = body;
    
    if (!id && (!ids || ids.length === 0)) {
      return NextResponse.json({ error: 'Chat ID or IDs are required' }, { status: 400 });
    }

    // Prepare fields to update, filter out undefined values to avoid overwriting unchanged fields
    const updateData: any = {};
    if (category_id !== undefined) updateData.category_id = category_id || null;
    if (priority !== undefined) updateData.priority = priority || null;
    if (status !== undefined) updateData.status = status || 'completed';

    let query = supabase.from('chats').update(updateData);

    if (ids && Array.isArray(ids)) {
      query = query.in('id', ids);
    } else {
      query = query.eq('id', id);
    }

    const { data, error } = await query.select().abortSignal(controller.signal);

    clearTimeout(timeoutId);
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    clearTimeout(timeoutId);
    const errMsg = err.name === 'AbortError' ? 'Supabase connection timed out (30s)' : err.message;
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
