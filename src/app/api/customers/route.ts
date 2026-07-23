import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get('customer_id');
  const customerName = searchParams.get('customer_name');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  const companyId = request.headers.get('x-company-id') || request.cookies.get('company_id')?.value;

  try {
    if (customerId) {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .abortSignal(controller.signal)
        .single();
      
      clearTimeout(timeoutId);
      if (error) throw error;
      return NextResponse.json(data);
    }

    if (customerName) {
      let query = supabase.from('chats').select('*').eq('customer_name', customerName);
      if (companyId) {
        query = query.eq('company_id', companyId);
      }
      
      const { data, error } = await query.abortSignal(controller.signal);
      
      clearTimeout(timeoutId);
      if (error) throw error;
      return NextResponse.json(data);
    }

    // Default: fetch all customers. If companyId is provided, filter customers associated with company chats
    if (companyId) {
      const { data: companyChats, error: chatsErr } = await supabase
        .from('chats')
        .select('customer_id')
        .eq('company_id', companyId);
      
      if (chatsErr) throw chatsErr;

      const customerIds = Array.from(new Set((companyChats || []).map(c => c.customer_id).filter(Boolean)));
      
      if (customerIds.length === 0) {
        clearTimeout(timeoutId);
        return NextResponse.json([]);
      }

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .in('id', customerIds)
        .abortSignal(controller.signal);
      
      clearTimeout(timeoutId);
      if (error) throw error;
      return NextResponse.json(data);
    }

    const { data, error } = await supabase
      .from('customers')
      .select('*')
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
