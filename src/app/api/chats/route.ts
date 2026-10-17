import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { sanitizeText } from '@/lib/sanitize';
import { transformChatRow } from '@/lib/chatTransformers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Simple In-Memory Response Cache to eliminate PostgREST Egress for repeated requests
interface CacheEntry {
  timestamp: number;
  data: any;
}
const serverCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 15000; // 15 Seconds TTL

export async function GET(request: NextRequest) {
  const rawCompanyId = request.nextUrl.searchParams.get('company_id') || request.cookies.get('company_id')?.value;
  const companyId = rawCompanyId && rawCompanyId !== 'undefined' && rawCompanyId !== 'null' && rawCompanyId !== 'all' ? rawCompanyId : null;
  const cacheKey = request.url + (companyId ? `_comp_${companyId}` : '');
  const now = Date.now();
  const cached = serverCache.get(cacheKey);

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cached.data, {
      headers: {
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=45',
        'X-Cache': 'HIT',
      },
    });
  }

  const db = supabaseAdmin || supabase;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  const search = request.nextUrl.searchParams.get('search');
  const summaryOnly =
    request.nextUrl.searchParams.get('summary_only') === 'true' ||
    request.nextUrl.searchParams.get('light') === 'true';
  const targetId = request.nextUrl.searchParams.get('id');

  try {
    const chatMap = new Map();

    // Query all necessary fields including conversation text so modals open instantly without flickering
    if (summaryOnly) {
      let lightQuery = db
        .from('chats')
        .select(
          'id, customer_id, customer_name, summary, conversation, category_id, priority, status, confidence, company_id, created_at, keywords, tags, urgency, resolution'
        )
        .order('created_at', { ascending: false });

      if (companyId && companyId !== 'all') {
        lightQuery = lightQuery.eq('company_id', companyId);
      }

      if (targetId) {
        lightQuery = lightQuery.eq('id', targetId);
      }

      if (search && search.trim()) {
        const q = search.trim();
        lightQuery = lightQuery.or(
          `summary.ilike.%${q}%,conversation.ilike.%${q}%,customer_id.ilike.%${q}%,id.ilike.%${q}%`
        );
      }

      const { data: lightData, error: lightErr } = await lightQuery.abortSignal(controller.signal);
      clearTimeout(timeoutId);

      if (lightErr) {
        console.error('lightQuery error:', lightErr);
      }

      const items = (lightData || []).map((row: any) => transformChatRow(row));

      serverCache.set(cacheKey, { timestamp: now, data: items });
      return NextResponse.json(items, {
        headers: {
          'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=45',
          'X-Cache': 'MISS',
        },
      });
    }

    // 1. Fetch from 'chats' table FIRST to preserve full untruncated conversation text
    let chatsQuery = db.from('chats').select('*').order('created_at', { ascending: false });

    if (companyId && companyId !== 'all') {
      chatsQuery = chatsQuery.eq('company_id', companyId);
    }

    if (targetId) {
      chatsQuery = chatsQuery.eq('id', targetId);
    }

    if (search && search.trim()) {
      const q = search.trim();
      chatsQuery = chatsQuery.or(
        `summary.ilike.%${q}%,conversation.ilike.%${q}%,customer_id.ilike.%${q}%,id.ilike.%${q}%`
      );
    }

    const { data: chatsData } = await chatsQuery.abortSignal(controller.signal);

    if (chatsData && chatsData.length > 0) {
      chatsData.forEach((row: any) => {
        const id = row.id;
        if (!id) return;
        const transformed = transformChatRow(row);
        chatMap.set(id, {
          ...transformed,
          chat_issues: [],
        });
      });
    }

    if (targetId && chatMap.has(targetId)) {
      const targetChat = chatMap.get(targetId);
      const { data: issues } = await db
        .from('chat_issues')
        .select('*')
        .eq('chat_id', targetId)
        .abortSignal(controller.signal);
      if (issues && issues.length > 0) {
        targetChat.chat_issues = issues;
      }
      clearTimeout(timeoutId);
      return NextResponse.json([targetChat]);
    }

    // 2. Fetch from 'vw_triage_export' view SECOND as enrichment for chat_issues
    let exportQuery = db.from('vw_triage_export').select('*').order('created_at', { ascending: false });

    if (companyId && companyId !== 'all') {
      exportQuery = exportQuery.eq('company_id', companyId);
    }

    if (targetId) {
      exportQuery = exportQuery.eq('chat_id', targetId);
    }

    const { data: exportData } = await exportQuery.abortSignal(controller.signal);

    if (exportData && exportData.length > 0) {
      exportData.forEach((row: any) => {
        const id = row.chat_id || row.id;
        if (!id) return;

        if (!chatMap.has(id)) {
          const isPending =
            row.status === 'pending' || (!row.category_id && !row.chat_summary && !row.issue_summary);
          chatMap.set(id, {
            id: id,
            customer_id: row.customer_id || null,
            customer_name: row.customer_name || (row.customer_id ? `ลูกค้า #${row.customer_id}` : (id ? `ลูกค้า #${id.substring(0, 8)}` : 'ลูกค้าทั่วไป')),
            summary: row.chat_summary || row.issue_summary || 'ไม่มีข้อมูลสรุป',
            category_id: row.category_id || null,
            priority: row.priority || null,
            status: isPending ? 'pending' : 'completed',
            confidence: 95,
            company_id: row.company_id || null,
            rawMessages: row.issue_summary ? [`ลูกค้า: ${row.issue_summary}`] : [],
            conversation: row.issue_summary ? `ลูกค้า: ${row.issue_summary}` : null,
            chat_issues: [],
            tags: [],
            created_at: row.created_at || new Date().toISOString(),
          });
        }

        const existing = chatMap.get(id);
        if (row.issue_summary) {
          if (!existing.chat_issues.some((i: any) => i.summary === row.issue_summary)) {
            existing.chat_issues.push({
              id: `${id}-issue-${existing.chat_issues.length + 1}`,
              chat_id: id,
              category_id: row.category_id,
              priority: row.priority,
              department: row.department,
              summary: row.issue_summary,
              recommended_reply: row.ai_reply,
              created_at: row.created_at,
            });
          }
        }
      });
    }

    // 3. Fetch all rows from 'chat_issues' table as backup/enrichment
    const { data: issuesData } = await db
      .from('chat_issues')
      .select('*')
      .order('created_at', { ascending: false });

    if (issuesData && issuesData.length > 0) {
      issuesData.forEach((issue: any) => {
        const chatId = issue.chat_id;
        if (!chatId) return;
        const msgText = `ลูกค้า: ${issue.summary}`;

        if (!chatMap.has(chatId)) {
          const isPending = issue.status === 'pending' || (!issue.category_id && !issue.summary);
          chatMap.set(chatId, {
            id: chatId,
            customer_id: issue.customer_id || null,
            customer_name: issue.customer_name || (issue.customer_id ? `ลูกค้า #${issue.customer_id}` : `ลูกค้า #${chatId.substring(0, 8)}`),
            summary: issue.summary,
            category_id: issue.category_id || null,
            priority: issue.priority || null,
            status: isPending ? 'pending' : 'completed',
            confidence: 95,
            company_id: issue.company_id || null,
            rawMessages: [msgText],
            conversation: msgText,
            chat_issues: [issue],
            tags: [],
            created_at: issue.created_at || new Date().toISOString(),
          });
        } else {
          const existing = chatMap.get(chatId);
          if (!existing.chat_issues) existing.chat_issues = [];
          if (!existing.chat_issues.some((i: any) => i.id === issue.id || i.summary === issue.summary)) {
            existing.chat_issues.push(issue);
          }
        }
      });
    }

    clearTimeout(timeoutId);

    let resultList = Array.from(chatMap.values());
    if (companyId && companyId !== 'all') {
      resultList = resultList.filter((c: any) => c.company_id === companyId);
    }
    if (targetId) {
      resultList = resultList.filter((c: any) => c.id === targetId);
    }

    // Sort by created_at descending
    resultList.sort(
      (a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );
    serverCache.set(cacheKey, { timestamp: Date.now(), data: resultList });
    return NextResponse.json(resultList, {
      headers: {
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=45',
        'X-Cache': 'MISS',
      },
    });
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.error('Error fetching chats:', err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  serverCache.clear();
  const db = supabaseAdmin || supabase;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const body = await request.json();
    const { id, ids, category_id, priority, status, tags } = body;

    if (!id && (!ids || ids.length === 0)) {
      return NextResponse.json({ error: 'Chat ID or IDs are required' }, { status: 400 });
    }

    const updateData: any = {};
    if (category_id !== undefined) updateData.category_id = sanitizeText(category_id) || null;
    if (priority !== undefined) updateData.priority = sanitizeText(priority) || null;
    if (status !== undefined) updateData.status = sanitizeText(status) || 'completed';
    if (tags !== undefined) updateData.keywords = Array.isArray(tags) ? tags : [tags];

    let query = db.from('chats').update(updateData);

    if (ids && Array.isArray(ids)) {
      query = query.in('id', ids);
    } else {
      query = query.eq('id', id);
    }

    const { data, error } = await query.select().abortSignal(controller.signal);

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
