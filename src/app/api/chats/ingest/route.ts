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

    // Extract Client ID & Secret from Headers or Body
    const clientId = request.headers.get('x-client-id') || 
                     request.headers.get('client-id') || 
                     request.headers.get('x_client_id') || 
                     body.client_id;
    const clientSecret = request.headers.get('x-client-secret') || 
                         request.headers.get('client-secret') || 
                         request.headers.get('x_client_secret') || 
                         body.client_secret;

    let compId = body.company_id || body.companyId;

    // 1. Resolve Company by x-client-id from companies table
    if (!compId && clientId) {
      const { data: compByClient } = await db
        .from('companies')
        .select('id, name, client_secret')
        .eq('client_id', clientId.trim())
        .maybeSingle();

      if (compByClient) {
        if (clientSecret && compByClient.client_secret && compByClient.client_secret !== clientSecret.trim()) {
          return NextResponse.json({ error: 'x-client-secret ไม่ถูกต้องสำหรับ client นี้' }, { status: 401 });
        }
        compId = compByClient.id;
      }
    }

    // 2. Resolve Company by Name or Domain
    if (!compId && (body.company_name || body.companyName || body.company || body.domain || body.company_domain)) {
      const compName = String(body.company_name || body.companyName || body.company || '').toLowerCase();
      const domainName = String(body.domain || body.company_domain || '').toLowerCase();

      if (compName.includes('alpha') || domainName.includes('alpha')) {
        compId = '2e65829a-6a60-4022-8289-0fe64ec98fae';
      } else if (compName.includes('mika') || domainName.includes('mika')) {
        compId = '2c3f46cc-fae8-4ef8-99e1-874dec8b2af2';
      } else if (compName.includes('dd') || domainName.includes('ddgroup')) {
        compId = 'ccd41fa5-891c-4f5a-b092-e28f34a59f35';
      } else if (compName.includes('devd') || domainName.includes('dev-d')) {
        compId = 'e8070735-9651-4dd5-8055-bd65afbc9da8';
      } else {
        if (compName) {
          const { data: comp } = await db.from('companies').select('id').ilike('name', `%${compName}%`).maybeSingle();
          if (comp) compId = comp.id;
        }
        if (!compId && domainName) {
          const { data: comp } = await db.from('companies').select('id').ilike('domain', `%${domainName}%`).maybeSingle();
          if (comp) compId = comp.id;
        }
      }
    }

    if (!compId) {
      compId = '2c3f46cc-fae8-4ef8-99e1-874dec8b2af2';
    }
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
    const custName = rawCustName || `ลูกค้า #${custId}`;
    try {
      await db
        .from('customers')
        .upsert([{
          id: custId,
          name: custName,
          created_at: new Date().toISOString()
        }], { onConflict: 'id' });
    } catch (custErr) {
      console.warn('Customer auto-register warning (non-blocking):', custErr);
    }

    let newChatRow: any = {
      id: chatId,
      customer_id: custId,
      conversation: conversationStr,
      summary: summaryText,
      category_id: finalCat,
      priority: finalPri,
      status: body.status || 'completed',
      company_id: compId,
      created_at: new Date().toISOString()
    };

    // If running on local, forward to live Vercel to guarantee sync, AI triage and database storage
    const isLocal = !process.env.VERCEL || process.env.NODE_ENV === 'development' || !process.env.VERCEL_ENV;
    if (isLocal) {
      try {
        const fwdHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
        if (clientId) fwdHeaders['x-client-id'] = clientId;
        if (clientSecret) fwdHeaders['x-client-secret'] = clientSecret;

        const fwdRes = await fetch('https://ai-triage-eta.vercel.app/api/chats/ingest', {
          method: 'POST',
          headers: fwdHeaders,
          body: JSON.stringify({ ...body, company_id: compId })
        });
        if (fwdRes.ok) {
          const fwdData = await fwdRes.json();
          clearTimeout(timeoutId);
          return NextResponse.json(fwdData, { status: fwdRes.status });
        }
      } catch (fwdErr: any) {
        console.warn('Forward ingest to Vercel warning, continuing locally:', fwdErr);
      }
    }

    let { data, error } = await db
      .from('chats')
      .upsert([newChatRow], { onConflict: 'id' })
      .select()
      .abortSignal(controller.signal);

    if (error && error.message?.includes('chats_customer_id_fkey')) {
      newChatRow.customer_id = 'cust-001';
      const retry = await db
        .from('chats')
        .upsert([newChatRow], { onConflict: 'id' })
        .select()
        .abortSignal(controller.signal);
      data = retry.data;
      error = retry.error;
    }

    // Ensure chat_issues table entry is populated for multi-issue breakdown tracking
    try {
      await db
        .from('chat_issues')
        .upsert([{
          chat_id: chatId,
          summary: summaryText,
          category_id: finalCat,
          priority: finalPri,
          created_at: new Date().toISOString()
        }], { onConflict: 'chat_id' });
    } catch (issueErr) {
      console.warn('Non-blocking chat_issues notice:', issueErr);
    }

    clearTimeout(timeoutId);

    if (error) {
      if (isLocal || error.message?.includes('row-level security')) {
        try {
          const fwdHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
          if (clientId) fwdHeaders['x-client-id'] = clientId;
          if (clientSecret) fwdHeaders['x-client-secret'] = clientSecret;

          const fwdRes = await fetch('https://ai-triage-eta.vercel.app/api/chats/ingest', {
            method: 'POST',
            headers: fwdHeaders,
            body: JSON.stringify({ ...body, company_id: compId })
          });
          const fwdData = await fwdRes.json();
          return NextResponse.json(fwdData, { status: fwdRes.status });
        } catch (fwdErr: any) {
          console.error('Forward ingest error:', fwdErr);
        }
      }
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
