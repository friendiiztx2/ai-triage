import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyApiAuth } from '@/lib/auth';
import { sendTelegramReportNotification } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  const { session, errorResponse } = await verifyApiAuth(request);
  if (errorResponse || !session) return errorResponse!;

  try {
    const body = await request.json();
    const {
      chat_id,
      customer_name,
      reported_by,
      reasons = [],
      comment = '',
      ai_snapshot = {},
      app_url,
    } = body;

    if (!chat_id) {
      return NextResponse.json({ error: 'chat_id is required' }, { status: 400 });
    }

    const reporterName = reported_by || session.name || 'เจ้าหน้าที่';
    const companyId = session.company_id || null;

    // 1. Insert report record into Supabase table `ai_feedback_reports`
    let dbSuccess = false;
    try {
      const { error: dbError } = await supabase.from('ai_feedback_reports').insert([
        {
          chat_id,
          company_id: companyId,
          reported_by: reporterName,
          reporter_id: session.id || null,
          reasons: Array.isArray(reasons) ? reasons : [reasons],
          comment: comment || '',
          ai_snapshot: ai_snapshot || {},
          status: 'pending',
          created_at: new Date().toISOString(),
        },
      ]);

      if (!dbError) {
        dbSuccess = true;
      } else {
        console.warn('[Report] ai_feedback_reports insert returned error, falling back:', dbError.message);
      }
    } catch (dbErr: any) {
      console.warn('[Report] Non-blocking DB insert exception:', dbErr.message);
    }

    // 2. Fallback record into activity_logs if ai_feedback_reports isn't created yet
    if (!dbSuccess) {
      try {
        await supabase.from('activity_logs').insert([
          {
            company_id: companyId,
            user_id: session.id || 'system',
            user_name: reporterName,
            action_type: 'REPORT_AI_INACCURACY',
            details: {
              chat_id,
              reasons,
              comment,
              ai_snapshot,
            },
            created_at: new Date().toISOString(),
          },
        ]);
      } catch (logErr) {
        console.warn('[Report] activity_logs fallback insert exception:', logErr);
      }
    }

    // 3. Send Real-time notification to Telegram Bot
    const telegramResult = await sendTelegramReportNotification({
      chatId: chat_id,
      customerName: customer_name,
      reportedBy: reporterName,
      reasons,
      comment,
      aiSnapshot: ai_snapshot,
      appUrl: app_url,
    });

    return NextResponse.json({
      success: true,
      message: 'ส่งรายงานถึงทีมผู้พัฒนาเรียบร้อยแล้ว',
      telegram_sent: telegramResult.success,
    });
  } catch (err: any) {
    console.error('[Report API] Exception:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
