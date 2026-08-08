import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const db = supabaseAdmin || supabase;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const body = await request.json();
    let { id, customer_id, conversation, summary, category_id, priority, status, company_id } = body;

    // Normalize conversation format (support both String and Array of strings)
    let conversationStr = '';
    if (Array.isArray(conversation)) {
      conversationStr = conversation.join('\n');
    } else if (typeof conversation === 'string') {
      conversationStr = conversation;
    } else if (summary) {
      conversationStr = `ลูกค้า: ${summary}`;
    }

    if (!conversationStr && !summary) {
      return NextResponse.json({ error: 'โปรดระบุบทสนทนา (conversation) หรือสรุป (summary)' }, { status: 400 });
    }

    const chatId = id || `chat-${Date.now()}`;
    const custId = customer_id || 'cust-001';
    const compId = company_id || '2c3f46cc-fae8-4ef8-99e1-874dec8b2af2';
    const summaryText = summary || conversationStr.split('\n')[0] || 'ลูกค้าสอบถามปัญหาผ่านแชท';

    const newChatRow = {
      id: chatId,
      customer_id: custId,
      conversation: conversationStr,
      summary: summaryText,
      category_id: category_id || null,
      priority: priority || 'low',
      status: status || 'pending',
      company_id: compId,
      created_at: new Date().toISOString()
    };

    const { data, error } = await db
      .from('chats')
      .upsert([newChatRow])
      .select()
      .abortSignal(controller.signal);

    clearTimeout(timeoutId);

    if (error) {
      console.error('Error inserting chat via ingest API:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Ingested chat successfully',
      data: data?.[0] || newChatRow
    }, { status: 201 });
  } catch (err: any) {
    clearTimeout(timeoutId);
    return NextResponse.json({ error: err.message || 'เกิดข้อผิดพลาดในการเพิ่มข้อมูลแชท' }, { status: 500 });
  }
}
