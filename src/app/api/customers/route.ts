import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

interface CacheEntry {
  timestamp: number;
  data: any;
}
const serverCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30000; // 30 Seconds TTL for customers

export async function GET(request: NextRequest) {
  const cacheKey = request.url;
  const now = Date.now();
  const cached = serverCache.get(cacheKey);

  if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
    return NextResponse.json(cached.data, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        'X-Cache': 'HIT'
      }
    });
  }

  const db = supabaseAdmin || supabase;
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get('customer_id');
  const customerName = searchParams.get('customer_name');
  const search = searchParams.get('search');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    // 1. Fetch customers table and chats list in parallel (using admin client to bypass RLS)
    const [custRes, chatsRes] = await Promise.all([
      Promise.resolve(db.from('customers').select('*').abortSignal(controller.signal)).catch(() => ({ data: null })),
      Promise.resolve(db.from('chats').select('customer_id').abortSignal(controller.signal)).catch(() => ({ data: null }))
    ]);

    clearTimeout(timeoutId);

    const dbCusts = custRes?.data || [];
    const chatsData = chatsRes?.data || [];

    // 2. Count real-time chats per customer_id
    const chatCounts: Record<string, number> = {};
    chatsData.forEach((c: any) => {
      if (c.customer_id) {
        chatCounts[c.customer_id] = (chatCounts[c.customer_id] || 0) + 1;
      }
    });

    const customerMap = new Map<string, any>();

    // Add DB customers
    dbCusts.forEach((c: any) => {
      const cid = c.id;
      const count = chatCounts[cid] || c.total_chats || 0;
      customerMap.set(cid, {
        ...c,
        total_chats: count
      });
    });

    // Ensure all customer_ids found in chats table are included
    Object.keys(chatCounts).forEach((cid) => {
      if (!customerMap.has(cid)) {
        customerMap.set(cid, {
          id: cid,
          name: `ลูกค้า #${cid}`,
          email: '',
          phone: '',
          tier: 'Regular',
          risk_level: 'low',
          created_at: new Date().toISOString(),
          total_chats: chatCounts[cid]
        });
      }
    });

    let result = Array.from(customerMap.values());

    // Sort by total_chats descending
    result.sort((a, b) => (b.total_chats || 0) - (a.total_chats || 0));

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

    serverCache.set(cacheKey, { timestamp: now, data: result });
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
      }
    });
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.error('Customers API error:', err);
    return NextResponse.json([]);
  }
}
