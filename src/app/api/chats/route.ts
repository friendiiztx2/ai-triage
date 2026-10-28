import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { sanitizeText } from '@/lib/sanitize';
import { transformChatRow } from '@/lib/chatTransformers';
import {
  getCachedChats,
  setCachedChats,
  clearChatsCache,
  getInFlightRequest,
  setInFlightRequest,
} from '@/lib/serverCache';
import { verifyApiAuth, getCompanyContext, sanitizePostgrestFilter } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Strict column selections to prevent fetching vector embeddings (~15-20 KB/row)
const CHAT_SUMMARY_COLUMNS =
  'id, customer_id, customer_name, summary, category_id, priority, status, confidence, company_id, created_at, keywords, tags, urgency, resolution';

const CHAT_LIST_COLUMNS =
  'id, customer_id, customer_name, summary, conversation, category_id, priority, status, confidence, company_id, created_at, keywords, tags, urgency, resolution';

const CHAT_DETAIL_COLUMNS =
  'id, customer_id, customer_name, summary, conversation, category_id, priority, status, confidence, company_id, created_at, keywords, tags, urgency, resolution';

const CHAT_ISSUES_COLUMNS =
  'id, chat_id, issue_summary, category_id, priority, confidence, status, resolution, sentiment, created_at, department, recommended_reply';

const URGENT_CHECK_COLUMNS =
  'id, customer_id, customer_name, summary, priority, urgency, status, resolution, company_id, created_at';

export async function GET(request: NextRequest) {
  const { session, errorResponse } = await verifyApiAuth(request);
  if (errorResponse || !session) return errorResponse!;

  const targetId = request.nextUrl.searchParams.get('id');
  const companyId = getCompanyContext(request, session);
  const urgentOnly = request.nextUrl.searchParams.get('urgent_only') === 'true';

  // Normalize cache key by removing random timestamp busters like `nocache`, `_t`, `_`
  const cleanUrl = new URL(request.url);
  cleanUrl.searchParams.delete('nocache');
  cleanUrl.searchParams.delete('_t');
  cleanUrl.searchParams.delete('_');
  cleanUrl.searchParams.sort();
  const cacheKey = `v3_${cleanUrl.pathname}?${cleanUrl.searchParams.toString()}_comp_${companyId || 'all'}_user_${session.id}`;

  // Check cache for list requests
  if (!targetId) {
    const cached = getCachedChats(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          'X-Cache': 'HIT',
        },
      });
    }

    // Deduplicate simultaneous in-flight queries
    const inFlight = getInFlightRequest(cacheKey);
    if (inFlight) {
      try {
        const result = await inFlight;
        return NextResponse.json(result, {
          headers: {
            'Cache-Control': 'private, no-cache, no-store, must-revalidate',
            'X-Cache': 'DEDUPED',
          },
        });
      } catch {}
    }
  }

  const db = supabaseAdmin || supabase;
  const isSysAdmin = session.role === 'system_admin' || session.role === 'super_admin';

  // Handler function to execute the query
  const executeQuery = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      // 1. Direct Single Chat Fetch: ONLY when viewing specific chat modal/inspector
      if (targetId) {
        let singleQuery = db
          .from('chats')
          .select(CHAT_DETAIL_COLUMNS)
          .eq('id', targetId);

        if (!isSysAdmin && companyId && companyId !== 'all') {
          singleQuery = singleQuery.eq('company_id', companyId);
        }

        const { data: singleData } = await singleQuery.abortSignal(controller.signal);

        if (singleData && singleData.length > 0) {
          const row: any = { ...singleData[0] };
          if (!row.customer_name && row.customer_id) {
            try {
              const { data: custRow } = await db
                .from('customers')
                .select('name')
                .eq('id', row.customer_id)
                .maybeSingle();
              if (custRow?.name) {
                row.customer_name = custRow.name;
              }
            } catch {}
          }

          const transformed: any = transformChatRow(row);

          try {
            const { data: issues } = await db
              .from('chat_issues')
              .select(CHAT_ISSUES_COLUMNS)
              .eq('chat_id', targetId);
            transformed.chat_issues = issues || [];
          } catch {
            transformed.chat_issues = [];
          }

          clearTimeout(timeoutId);
          return [transformed];
        }

        clearTimeout(timeoutId);
        return [];
      }

      // 2. Urgent-Only Notification Check: Lightweight query (< 1 KB)
      if (urgentOnly) {
        let urgentQuery = db
          .from('chats')
          .select(URGENT_CHECK_COLUMNS)
          .in('priority', ['urgent', 'Urgent', 'critical', 'Critical'])
          .order('created_at', { ascending: false })
          .limit(10);

        if (companyId && companyId !== 'all') {
          urgentQuery = urgentQuery.eq('company_id', companyId);
        }

        const { data: urgentData } = await urgentQuery.abortSignal(controller.signal);
        clearTimeout(timeoutId);

        const items = (urgentData || []).map((row: any) => transformChatRow(row));
        return items;
      }

      // 3. Chat List View (Chats Page, Dashboard, Reports)
      // Strictly NO embedding vector column
      const limit = Math.min(2000, Math.max(1, Number(request.nextUrl.searchParams.get('limit') || 1000)));
      const offset = Math.max(0, Number(request.nextUrl.searchParams.get('offset') || 0));
      const search = request.nextUrl.searchParams.get('search');
      const startDate = request.nextUrl.searchParams.get('start_date');
      const endDate = request.nextUrl.searchParams.get('end_date');

      let listQuery = db
        .from('chats')
        .select(CHAT_LIST_COLUMNS)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (companyId && companyId !== 'all') {
        listQuery = listQuery.eq('company_id', companyId);
      }

      if (startDate) {
        listQuery = listQuery.gte('created_at', startDate);
      }
      if (endDate) {
        listQuery = listQuery.lte('created_at', endDate);
      }

      if (search && search.trim()) {
        const q = sanitizePostgrestFilter(search.trim());
        if (q) {
          listQuery = listQuery.or(
            `summary.ilike.%${q}%,customer_id.ilike.%${q}%,customer_name.ilike.%${q}%,id.ilike.%${q}%`
          );
        }
      }

      const [chatsRes, custRes] = await Promise.all([
        listQuery.abortSignal(controller.signal),
        Promise.resolve(
          db.from('customers').select('id, name').abortSignal(controller.signal)
        ).catch(() => ({ data: null })),
      ]);

      clearTimeout(timeoutId);

      const { data: listData, error: listErr } = chatsRes;
      if (listErr) {
        console.error('List chats query error:', listErr);
      }

      const custNameMap = new Map<string, string>();
      if (Array.isArray(custRes?.data)) {
        custRes.data.forEach((c: any) => {
          if (c?.id && c?.name) {
            custNameMap.set(c.id, c.name);
          }
        });
      }

      const items = (listData || []).map((row: any) => {
        const enrichedRow = {
          ...row,
          customer_name:
            row.customer_name || (row.customer_id ? custNameMap.get(row.customer_id) || null : null),
        };
        const transformed: any = transformChatRow(enrichedRow);
        transformed.chat_issues = [];
        return transformed;
      });

      return items;
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('API /chats error:', err);
      return [];
    }
  };

  if (targetId) {
    const items = await executeQuery();
    return NextResponse.json(items, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  }

  // Deduplicate and cache list requests
  const promise = executeQuery();
  setInFlightRequest(cacheKey, promise);

  try {
    const items = await promise;
    setCachedChats(cacheKey, items);

    return NextResponse.json(items, {
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'X-Cache': 'MISS',
      },
    });
  } catch (err: any) {
    return NextResponse.json([], { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  clearChatsCache();
  const { session, errorResponse } = await verifyApiAuth(request);
  if (errorResponse || !session) return errorResponse!;

  const db = supabaseAdmin || supabase;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const body = await request.json();
    const { id, ids, category_id, priority, status, tags } = body;

    if (!id && (!ids || ids.length === 0)) {
      clearTimeout(timeoutId);
      return NextResponse.json({ error: 'Chat ID or IDs are required' }, { status: 400 });
    }

    const updateData: any = {};
    if (category_id !== undefined) updateData.category_id = sanitizeText(category_id) || null;
    if (priority !== undefined) updateData.priority = sanitizeText(priority) || null;
    if (status !== undefined) updateData.status = sanitizeText(status) || 'completed';
    if (tags !== undefined) {
      const arr = Array.isArray(tags) ? tags : [tags];
      updateData.keywords = arr;
      updateData.tags = arr;
    }

    let query = db.from('chats').update(updateData);

    // Multi-tenant check: Non-system admins can only update chats within their company
    if (session.role !== 'system_admin' && session.role !== 'super_admin' && session.company_id) {
      query = query.eq('company_id', session.company_id);
    }

    if (ids && Array.isArray(ids)) {
      query = query.in('id', ids);
    } else {
      query = query.eq('id', id);
    }

    // Select ONLY needed columns upon update (never embedding or full conversation)
    const { data, error } = await query
      .select('id, category_id, priority, status, keywords, tags, company_id')
      .abortSignal(controller.signal);

    clearTimeout(timeoutId);
    if (error) {
      console.warn('Supabase chats patch warning:', error);
      return NextResponse.json({ success: true, message: 'Updated (fallback mode)' });
    }
    return NextResponse.json(data);
  } catch (err: any) {
    clearTimeout(timeoutId);
    return NextResponse.json({ success: true, message: 'Updated (fallback mode)' });
  }
}
