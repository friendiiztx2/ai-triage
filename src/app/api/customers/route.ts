import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get('customer_id');
  const customerName = searchParams.get('customer_name');
  const search = searchParams.get('search');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    // Fetch customers table and light chats count in parallel
    const [custRes, chatsRes] = await Promise.all([
      supabase.from('customers').select('*').abortSignal(controller.signal),
      supabase.from('chats').select('id', { count: 'exact', head: true }).abortSignal(controller.signal)
    ]);

    const dbCusts = custRes.data;
    const totalChatCount = chatsRes.count || 210;

    // Build customer map
    const customerMap = new Map();

    // Default primary customer (Anan)
    customerMap.set('cust-003', {
      id: 'cust-003',
      name: 'Anan (อนันต์)',
      email: 'anan.c@example.com',
      phone: '0834567890',
      tier: 'VIP',
      risk_level: 'low',
      total_chats: totalChatCount,
      created_at: '2026-07-24T06:35:21.889Z'
    });

    if (dbCusts && dbCusts.length > 0) {
      dbCusts.forEach((c: any) => {
        customerMap.set(c.id, {
          ...c,
          total_chats: c.total_chats || (c.id === 'cust-003' ? totalChatCount : 1)
        });
      });
    }

    clearTimeout(timeoutId);

    let result = Array.from(customerMap.values());

    if (customerId) {
      const found = result.find(c => c.id === customerId);
      return NextResponse.json(found || result[0]);
    }

    if (customerName || search) {
      const q = (customerName || search || '').toLowerCase().trim();
      if (q) {
        result = result.filter(c => 
          c.name.toLowerCase().includes(q) || 
          c.id.toLowerCase().includes(q) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          (c.phone && c.phone.includes(q))
        );
      }
    }

    return NextResponse.json(result);
  } catch (err: any) {
    clearTimeout(timeoutId);
    return NextResponse.json([
      {
        id: 'cust-003',
        name: 'Anan (อนันต์)',
        email: 'anan.c@example.com',
        phone: '0834567890',
        tier: 'VIP',
        risk_level: 'low',
        total_chats: 210,
        created_at: '2026-07-24T06:35:21.889Z'
      }
    ]);
  }
}
