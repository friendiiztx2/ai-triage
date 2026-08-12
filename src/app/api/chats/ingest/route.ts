import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const db = supabaseAdmin || supabase;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const body = await request.json();

    // Robust Payload Extraction for Onebox & Third-Party Webhooks
    const rawConv = body.conversation || body.messages || body.message || body.text || body.content || body.dialogue;
    const rawCustId = body.customer_id || body.customerId || body.sender_id || body.senderId || body.user_id || body.userId;
    const rawCustName = body.customer_name || body.customerName || body.name || body.sender_name || body.senderName || (body.customer && body.customer.name);
    const rawMedia = body.media_urls || body.attachments || body.files || body.images;

    let conversationStr = '';
    if (Array.isArray(rawConv)) {
      conversationStr = rawConv.map(item => typeof item === 'string' ? item : (item.text || item.content || item.message || JSON.stringify(item))).join('\n');
    } else if (typeof rawConv === 'string') {
      conversationStr = rawConv;
    } else if (body.summary) {
      conversationStr = `ลูกค้า: ${body.summary}`;
    }

    // Attach rawMedia URLs to conversationStr if provided
    if (Array.isArray(rawMedia) && rawMedia.length > 0) {
      const mediaLinksStr = rawMedia.map((m: any) => typeof m === 'string' ? m : (m.url || m.link || m.src)).filter(Boolean).join('\n');
      if (mediaLinksStr && !conversationStr.includes(mediaLinksStr)) {
        conversationStr += `\n${mediaLinksStr}`;
      }
    }

    if (!conversationStr && !body.summary) {
      return NextResponse.json({ error: 'โปรดระบุบทสนทนา (conversation / text / messages) หรือสรุป (summary)' }, { status: 400 });
    }

    const chatId = body.id || body.chat_id || body.chatId || `chat-${Date.now()}`;
    const custId = rawCustId || 'cust-001';
    const compId = body.company_id || '2c3f46cc-fae8-4ef8-99e1-874dec8b2af2';
    const summaryText = body.summary || conversationStr.split('\n')[0] || 'ลูกค้าสอบถามปัญหาผ่านแชท';

    // 1. Smart AI Auto-Categorization & Priority inference if not provided
    let finalCat = body.category_id || null;
    let finalPri = body.priority || 'low';

    if (!finalCat) {
      if (conversationStr.includes('ถอน') || conversationStr.includes('ฝาก') || conversationStr.includes('โอน') || conversationStr.includes('บัญชี')) {
        finalCat = 'deposit_withdrawal';
        finalPri = 'high';
      } else if (conversationStr.includes('ค้าง') || conversationStr.includes('หมุน') || conversationStr.includes('หน้าเว็บ')) {
        finalCat = 'page_load_freeze';
        finalPri = 'high';
      } else if (conversationStr.includes('เข้าไม่ได้') || conversationStr.includes('เข้าสู่ระบบ') || conversationStr.includes('รหัส')) {
        finalCat = 'login_issue';
        finalPri = 'medium';
      }
    }

    // 2. Ensure Customer Record exists in customers table (Auto-Registration for Live Chats)
    try {
      const custName = rawCustName || `ลูกค้า #${custId}`;
      await db
        .from('customers')
        .upsert([{
          id: custId,
          name: custName,
          company_id: compId,
          created_at: new Date().toISOString()
        }], { onConflict: 'id' });
    } catch (custErr) {
      console.warn('Non-blocking customer upsert notice:', custErr);
    }

    const newChatRow = {
      id: chatId,
      customer_id: custId,
      conversation: conversationStr,
      summary: summaryText,
      category_id: finalCat,
      priority: finalPri,
      status: status || 'completed',
      company_id: compId,
      created_at: new Date().toISOString()
    };

    const { data, error } = await db
      .from('chats')
      .upsert([newChatRow], { onConflict: 'id' })
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
