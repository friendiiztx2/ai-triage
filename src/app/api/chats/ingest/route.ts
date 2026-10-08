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
    // Detect if this is an image-only message (customer sent image without typed text)
    const genericUrlRegex = /(https?:\/\/[^\s\n"']+)/gi;
    const urlMatches = conversationStr.match(genericUrlRegex) || [];
    let textWithoutUrls = conversationStr;
    urlMatches.forEach(u => { textWithoutUrls = textWithoutUrls.replace(u, '').trim(); });
    // Strip common image placeholder tags if any
    textWithoutUrls = textWithoutUrls.replace(/\(📷[^\)]*\)/g, '').replace(/📷[^\n]*/g, '').trim();

    const isImageOnly = (urlMatches.length > 0 || (Array.isArray(rawMedia) && rawMedia.length > 0)) && !textWithoutUrls.trim();

    // 1. Smart AI Auto-Categorization & Priority inference if not provided
    let finalCat = body.category_id || null;
    let finalPri = body.priority || 'low';
    let summaryText = body.summary || null;
    let recommendedReply = body.recommended_reply || null;
    let deptName = body.department || 'ฝ่ายบริการลูกค้า';

    if (isImageOnly) {
      const lowerUrls = (conversationStr + ' ' + (Array.isArray(rawMedia) ? rawMedia.join(' ') : '') + ' ' + (body.summary || '')).toLowerCase();
      
      if (lowerUrls.includes('502') || lowerUrls.includes('500') || lowerUrls.includes('error') || lowerUrls.includes('bad_gateway') || lowerUrls.includes('crash') || lowerUrls.includes('freeze') || lowerUrls.includes('เว็บค้าง')) {
        finalCat = finalCat || 'page_load_freeze';
        finalPri = finalPri === 'low' ? 'urgent' : finalPri;
        summaryText = summaryText || '[รูปภาพล้วน] ลูกค้าแนบภาพแคปหน้าจอระบบขัดข้อง/Error (ไม่ระบุข้อความพิมพ์)';
        recommendedReply = recommendedReply || 'กราบขออภัยในความไม่สะดวกค่ะ ขณะนี้ทางทีมเทคนิคกำลังเร่งตรวจสอบและแก้ไขระบบให้อย่างเร่งด่วนค่ะ';
        deptName = 'ทีมวิศวกรและเทคนิค (IT)';
      } else if (lowerUrls.includes('game') || lowerUrls.includes('slot') || lowerUrls.includes('spin') || lowerUrls.includes('casino') || lowerUrls.includes('baccarat') || lowerUrls.includes('คาสิโน') || lowerUrls.includes('สล็อต')) {
        finalCat = finalCat || 'game_issue';
        finalPri = finalPri === 'low' ? 'urgent' : finalPri;
        summaryText = summaryText || '[รูปภาพล้วน] ลูกค้าแนบภาพแคปหน้าจอขัดข้องในหน้าเกม (ไม่ระบุข้อความพิมพ์)';
        recommendedReply = recommendedReply || 'แอดมินรับทราบปัญหาหน้าเกมตามภาพที่แนบมาแล้วค่ะ กำลังประสานงานทีมเกมมิ่งตรวจสอบ Log รอบเล่นให้นะคะ';
        deptName = 'เกมมิ่งและเทคนิค';
      } else if (lowerUrls.includes('login') || lowerUrls.includes('password') || lowerUrls.includes('auth') || lowerUrls.includes('รหัสผ่าน') || lowerUrls.includes('ล็อกอิน')) {
        finalCat = finalCat || 'login_issue';
        finalPri = finalPri === 'low' ? 'medium' : finalPri;
        summaryText = summaryText || '[รูปภาพล้วน] ลูกค้าแนบภาพแจ้งเตือนเข้าสู่ระบบขัดข้อง (ไม่ระบุข้อความพิมพ์)';
        recommendedReply = recommendedReply || 'ลูกค้าสามารถกดปุ่มลืมรหัสผ่านเพื่อตั้งรหัสใหม่ หรือแจ้งยูสเซอร์เพื่อให้แอดมินช่วยรีเซ็ตได้เลยนะคะ';
        deptName = 'ฝ่ายบริการลูกค้า';
      } else {
        // Default to deposit / transfer slip analysis (most frequent image-only chat)
        finalCat = finalCat || 'deposit_withdrawal';
        finalPri = finalPri === 'low' ? 'high' : finalPri;
        summaryText = summaryText || '[รูปภาพล้วน] ลูกค้าแนบสลิปการโอนเงิน (ไม่ระบุข้อความพิมพ์)';
        recommendedReply = recommendedReply || 'แอดมินได้รับสลิปโอนเงินเรียบร้อยแล้วค่ะ กำลังตรวจสอบและปรับยอดเครดิตเข้าสู่ระบบให้นะคะ';
        deptName = 'การเงินและการชำระเงิน';
      }
    } else {
      if (!finalCat) {
        if (conversationStr.includes('ถอน') || conversationStr.includes('ฝาก') || conversationStr.includes('โอน') || conversationStr.includes('บัญชี')) {
          finalCat = 'deposit_withdrawal';
          finalPri = 'high';
          recommendedReply = 'แอดมินตรวจสอบข้อมูลการเงินให้เรียบร้อยแล้วค่ะ กำลังดำเนินการปรับยอดให้นะคะ';
        } else if (conversationStr.includes('ค้าง') || conversationStr.includes('หมุน') || conversationStr.includes('หน้าเว็บ') || conversationStr.includes('error')) {
          finalCat = 'page_load_freeze';
          finalPri = 'high';
          recommendedReply = 'ขออภัยในความไม่สะดวกค่ะ ทีมเทคนิคกำลังเร่งดูแลและแก้ไขระบบหน้าเว็บให้ค่ะ';
        } else if (conversationStr.includes('เข้าไม่ได้') || conversationStr.includes('เข้าสู่ระบบ') || conversationStr.includes('รหัส')) {
          finalCat = 'login_issue';
          finalPri = 'medium';
          recommendedReply = 'ลูกค้าสามารถแจ้งยูสเซอร์เนมเพื่อให้แอดมินช่วยรีเซ็ตรหัสผ่านได้เลยนะคะ';
        } else if (conversationStr.includes('เกม') || conversationStr.includes('สล็อต') || conversationStr.includes('หลุด')) {
          finalCat = 'game_issue';
          finalPri = 'high';
          recommendedReply = 'แอดมินกำลังประสานงานค่ายเกมเพื่อตรวจสอบสถานะห้องเกมให้นะคะ';
        }
      }
      summaryText = summaryText || conversationStr.split('\n')[0] || 'ลูกค้าสอบถามปัญหาผ่านแชท';
    }

    const autoTags: string[] = [];
    if (isImageOnly) {
      autoTags.push('#รูปภาพ', '#รูปภาพล้วน');
    } else if (urlMatches.length > 0 || (Array.isArray(rawMedia) && rawMedia.length > 0)) {
      autoTags.push('#รูปภาพ');
    }

    if (finalCat === 'deposit_withdrawal') autoTags.push('#ฝากถอนเงิน');
    else if (finalCat === 'page_load_freeze') autoTags.push('#ปัญหาเข้าเว็บ');
    else if (finalCat === 'game_issue') autoTags.push('#ปัญหาเกี่ยวกับเกม');
    else if (finalCat === 'login_issue') autoTags.push('#ปัญหาเข้าสู่ระบบ');

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

    const isUrgentCase = finalPri === 'urgent' || (body.urgency || '').toLowerCase() === 'urgent';
    let newChatRow: any = {
      id: chatId,
      customer_id: custId,
      customer_name: custName,
      conversation: conversationStr,
      summary: summaryText,
      category_id: finalCat,
      priority: isUrgentCase ? 'urgent' : finalPri,
      urgency: isUrgentCase ? 'urgent' : (body.urgency || 'low'),
      status: body.status ? body.status : (isUrgentCase ? 'pending' : 'completed'),
      resolution: body.resolution || 'Pending',
      company_id: compId,
      tags: autoTags,
      recommended_reply: recommendedReply,
      department: deptName,
      confidence: 97,
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
      await db.from('chat_issues').delete().eq('chat_id', chatId);
      await db
        .from('chat_issues')
        .insert([{
          id: crypto.randomUUID(),
          chat_id: chatId,
          summary: summaryText,
          category_id: finalCat,
          priority: finalPri,
          department: deptName,
          recommended_reply: recommendedReply,
          created_at: new Date().toISOString()
        }]);
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
