import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { getCategoryLabel } from '@/lib/categories';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface CacheEntry {
  timestamp: number;
  data: any;
}
const serverCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 15000;

export async function GET(request: NextRequest) {
  const cacheKey = request.url;
  const now = Date.now();
  const cached = serverCache.get(cacheKey);

  if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
    return NextResponse.json(cached.data, {
      headers: {
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=45',
        'X-Cache': 'HIT'
      }
    });
  }

  const db = supabaseAdmin || supabase;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  const companyId = request.headers.get('x-company-id') || request.cookies.get('company_id')?.value || null;

  try {
    // 1. Try RPC query first
    const { data: rpcData, error: rpcErr } = await Promise.resolve(
      db.rpc('get_triage_dashboard_summary', { p_company_id: companyId }).abortSignal(controller.signal)
    ).catch(() => ({ data: null, error: true }));

    if (!rpcErr && rpcData) {
      clearTimeout(timeoutId);
      serverCache.set(cacheKey, { timestamp: now, data: rpcData });
      return NextResponse.json(rpcData);
    }

    // 2. If RPC is unavailable, query live chats table directly for 100% accurate real-time metrics
    let chatsQuery = db.from('chats').select('id, status, priority, category_id, company_id');
    if (companyId && companyId !== 'all') {
      chatsQuery = chatsQuery.eq('company_id', companyId);
    }

    const [chatsRes, catsRes] = await Promise.all([
      chatsQuery.abortSignal(controller.signal),
      db.from('categories').select('id, name, name_th, name_en').abortSignal(controller.signal)
    ]);

    const chatsData = chatsRes.data;
    const dbCategories = catsRes.data || [];
    const catNameLookup = new Map<string, string>();
    dbCategories.forEach((c: any) => {
      catNameLookup.set(c.id, c.name_th || c.name);
    });

    clearTimeout(timeoutId);

    if (chatsData && chatsData.length > 0) {
      const total_chats = chatsData.length;
      let pending_chats = 0;
      let completed_chats = 0;
      let urgent_chats = 0;

      const catBreakdownMap: Record<string, number> = {};

      chatsData.forEach((c: any) => {
        const s = (c.status || '').toLowerCase();
        if (s === 'pending' || s === 'รอดำเนินการ') {
          pending_chats++;
        } else {
          completed_chats++;
        }

        const p = (c.priority || '').toLowerCase();
        if (p === 'urgent' || p === 'high') {
          urgent_chats++;
        }

        const cat = c.category_id || 'other';
        catBreakdownMap[cat] = (catBreakdownMap[cat] || 0) + 1;
      });

      const categories_breakdown = Object.keys(catBreakdownMap).map(catKey => {
        const name = catNameLookup.get(catKey) || getCategoryLabel(catKey, 'th');
        return {
          category_id: catKey,
          name,
          count: catBreakdownMap[catKey]
        };
      });

      const liveSummary = {
        total_chats,
        pending_chats,
        urgent_chats,
        completed_chats,
        categories_breakdown
      };

      serverCache.set(cacheKey, { timestamp: now, data: liveSummary });
      return NextResponse.json(liveSummary);
    }

    // Return empty summary if DB has no chats
    const emptySummary = {
      total_chats: 0,
      pending_chats: 0,
      urgent_chats: 0,
      completed_chats: 0,
      categories_breakdown: []
    };

    serverCache.set(cacheKey, { timestamp: now, data: emptySummary });
    return NextResponse.json(emptySummary);
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.error('Summary API error:', err);
    return NextResponse.json({
      total_chats: 0,
      pending_chats: 0,
      urgent_chats: 0,
      completed_chats: 0,
      categories_breakdown: []
    });
  }
}
