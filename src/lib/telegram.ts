/**
 * Telegram Notification Utility
 * Sends real-time alerts to the developer team when users/agents report AI triage inaccuracy.
 */

interface SendReportNotificationParams {
  chatId: string;
  customerName?: string;
  reportedBy: string;
  reasons: string[];
  comment: string;
  aiSnapshot?: {
    category_name?: string;
    priority?: string;
    summary?: string;
    recommended_reply?: string;
  };
  appUrl?: string;
}

const REASON_LABELS: Record<string, string> = {
  wrong_category: '🏷️ จัดหมวดหมู่ผิด',
  inaccurate_summary: '📝 สรุปประเด็นผิด',
  bad_reply: '💬 คำแนะนำตอบกลับไม่เหมาะ',
  wrong_priority: '⚡ ประเมินความสำคัญผิด',
  hallucination: '🧠 AI เข้าใจเจตนาผิด',
  other: '📌 อื่นๆ',
};

export async function sendTelegramReportNotification({
  chatId,
  customerName,
  reportedBy,
  reasons,
  comment,
  aiSnapshot,
  appUrl,
}: SendReportNotificationParams): Promise<{ success: boolean; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const targetChatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !targetChatId) {
    console.warn(
      '[Telegram] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured in environment variables. Skipping Telegram notification.'
    );
    return { success: false, error: 'Telegram credentials not configured' };
  }

  try {
    const formattedReasons = reasons
      .map((r) => REASON_LABELS[r] || r)
      .join(', ');

    const baseUrl = appUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://sift-ai-demo.vercel.app';
    const chatLink = `${baseUrl}/chats?q=${encodeURIComponent(chatId)}`;

    const lines: string[] = [
      `🚨 <b>แจ้งเตือน: AI วิเคราะห์ไม่ถูกต้อง</b>`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `👤 <b>ลูกค้า:</b> ${escapeHtml(customerName || 'ไม่ระบุ')} <i>(ผู้แจ้ง: ${escapeHtml(reportedBy || 'เจ้าหน้าที่')})</i>`,
      `⚠️ <b>ปัญหา:</b> ${escapeHtml(formattedReasons || 'ไม่ได้ระบุ')}`,
      `🤖 <b>AI เดิม:</b> ${escapeHtml(aiSnapshot?.category_name || 'ไม่ระบุ')} • ความสำคัญ: <code>${escapeHtml(aiSnapshot?.priority || 'medium')}</code>`,
    ];

    if (comment && comment.trim()) {
      lines.push(`💬 <b>ข้อความ:</b> <blockquote>${escapeHtml(comment.trim())}</blockquote>`);
    }

    lines.push(`━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`👉 <a href="${chatLink}">คลิกเพื่อเปิดดูแชตนี้บนระบบ</a>`);

    const messageHtml = lines.join('\n');

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: messageHtml,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      const errData = await response.text();
      console.error('[Telegram] Failed to send message:', errData);
      return { success: false, error: errData };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[Telegram] Exception while sending notification:', err);
    return { success: false, error: err.message };
  }
}

function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
