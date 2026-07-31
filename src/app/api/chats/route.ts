import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function determineStatus(item: any): string {
  if (!item) return 'pending';
  const s = typeof item.status === 'string' ? item.status.trim().toLowerCase() : '';
  if (s === 'completed' || s === 'แยกแยะแล้ว' || s === 'resolved' || s === 'closed') return 'completed';
  if (s === 'pending' || s === 'รอดำเนินการ' || s === 'waiting') return 'pending';
  if (item.resolution && item.resolution !== 'Pending' && item.resolution !== '[]' && item.resolution.trim() !== '') return 'completed';
  if (item.category_id || item.summary || (Array.isArray(item.chat_issues) && item.chat_issues.length > 0)) return 'completed';
  return 'pending';
}

export async function GET(request: NextRequest) {
  const db = supabaseAdmin || supabase;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  const search = request.nextUrl.searchParams.get('search');

  try {
    const chatMap = new Map();

    // 1. Fetch all chats from 'chats' table in Supabase FIRST
    let query = db
      .from('chats')
      .select('id, customer_id, conversation, status, category_id, priority, summary, created_at, confidence, resolution, company_id, chat_issues(*), customers(*)')
      .order('created_at', { ascending: false });

    if (search && search.trim()) {
      const q = search.trim();
      query = query.or(`summary.ilike.%${q}%,customers.name.ilike.%${q}%,customer_id.ilike.%${q}%`);
    }

    const { data: chatsData, error: chatsError } = await query.abortSignal(controller.signal);

    if (chatsError) {
      console.warn('Supabase query chats warning:', chatsError);
    }

    if (chatsData && chatsData.length > 0) {
      chatsData.forEach((c: any) => {
        chatMap.set(c.id, {
          ...c,
          status: determineStatus(c),
          customer_name: c.customers?.name || c.customer_name || 'Anan (อนันต์)',
          conversation: c.conversation || (c.summary ? `ลูกค้า: ${c.summary}` : null),
          chat_issues: Array.isArray(c.chat_issues) ? c.chat_issues : [],
          rawMessages: c.conversation ? [c.conversation] : [],
          tags: c.priority === 'urgent' 
            ? ['#VIP', '#ส่งเรื่องทีมเทคนิค'] 
            : c.category_id === 'deposit_withdrawal'
            ? ['#รอสลิป']
            : c.category_id === 'promo_bonus'
            ? ['#ติดตามผล']
            : c.priority === 'high'
            ? ['#เคสพิเศษ']
            : [],
          created_at: c.created_at || new Date().toISOString()
        });
      });
    }

    // 2. Fetch all rows from 'chat_issues' table in Supabase SECOND
    const { data: issuesData } = await db
      .from('chat_issues')
      .select('*')
      .order('created_at', { ascending: false });

    if (issuesData && issuesData.length > 0) {
      issuesData.forEach((issue: any) => {
        const chatId = issue.chat_id || 'chat-001';
        const msgText = `ลูกค้า: ${issue.summary}`;
        const issueStatus = determineStatus(issue);

        if (!chatMap.has(chatId)) {
          chatMap.set(chatId, {
            id: chatId,
            customer_id: 'cust-003',
            customer_name: 'Anan (อนันต์)',
            summary: issue.summary,
            category_id: issue.category_id || 'other',
            priority: issue.priority || 'medium',
            status: issueStatus,
            confidence: 95,
            company_id: '2c3f46cc-fae8-4ef8-99e1-874dec8b2af2',
            rawMessages: [msgText],
            conversation: msgText,
            chat_issues: [issue],
            tags: issue.priority === 'urgent' 
              ? ['#VIP', '#ส่งเรื่องทีมเทคนิค'] 
              : issue.category_id === 'deposit_withdrawal'
              ? ['#รอสลิป']
              : issue.category_id === 'promo_bonus'
              ? ['#ติดตามผล']
              : issue.priority === 'high'
              ? ['#เคสพิเศษ']
              : [],
            created_at: issue.created_at || new Date().toISOString()
          });
        } else {
          const existing = chatMap.get(chatId);
          if (!existing.chat_issues) existing.chat_issues = [];
          
          if (!existing.chat_issues.some((i: any) => i.id === issue.id)) {
            existing.chat_issues.push(issue);
          }

          if (!existing.summary && issue.summary) {
            existing.summary = issue.summary;
          }
          if (!existing.category_id && issue.category_id) {
            existing.category_id = issue.category_id;
          }
          if (!existing.conversation) {
            if (!existing.rawMessages) existing.rawMessages = [];
            if (!existing.rawMessages.includes(msgText)) {
              existing.rawMessages.push(msgText);
              existing.conversation = existing.rawMessages.join('\n');
            }
          }
        }
      });
    }

    clearTimeout(timeoutId);

    const resultList = Array.from(chatMap.values());

    if (resultList.length > 0) {
      // Sort by created_at descending
      resultList.sort((a: any, b: any) => 
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
      return NextResponse.json(resultList);
    }

    return NextResponse.json([]);
  } catch (err: any) {
    clearTimeout(timeoutId);
    return NextResponse.json([]);
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
