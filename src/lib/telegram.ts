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
  wrong_category: '🏷️ จัดหมวดหมู่ผิดพลาด (Wrong Category)',
  inaccurate_summary: '📝 สรุปประเด็นไม่ตรงกับแชต (Inaccurate Summary)',
  bad_reply: '💬 ข้อความแนะนำตอบกลับไม่เหมาะสม (Inappropriate Reply)',
  wrong_priority: '⚡ ประเมินระดับความสำคัญผิด (Wrong Priority)',
  hallucination: '🧠 AI เข้าใจเจตนาผิด / มีข้อมูลเท็จ (Misunderstood Intent)',
  other: '📌 อื่นๆ (Other)',
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
      .map((r) => `  • ${REASON_LABELS[r] || r}`)
      .join('\n');

    const formattedComment = comment ? `<blockquote>${escapeHtml(comment)}</blockquote>` : '<i>(ไม่ได้ระบุข้อความเพิ่มเติม)</i>';

    const baseUrl = appUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://sift-ai-demo.vercel.app';
    const chatLink = `${baseUrl}/chats?q=${encodeURIComponent(chatId)}`;

    const messageHtml = [
      `🚨 <b>[Sift AI] รายงานปัญหาการวิเคราะห์ AI ไม่ถูกต้อง</b>`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `💬 <b>รหัสแชต:</b> <code>${escapeHtml(chatId)}</code>`,
      `👤 <b>ลูกค้า:</b> ${escapeHtml(customerName || 'ไม่ระบุ')}`,
      `🧑‍💻 <b>ผู้รายงาน:</b> <b>${escapeHtml(reportedBy || 'เจ้าหน้าที่')}</b>`,
      `⏰ <b>เวลา:</b> ${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}`,
      ``,
      `⚠️ <b>ปัญหาที่พบ:</b>\n${formattedReasons || '  • ไม่ได้ระบุ'}`,
      ``,
      `📝 <b>ข้อความถึงผู้พัฒนา:</b>\n${formattedComment}`,
      ``,
      `🤖 <b>สิ่งที่ AI วิเคราะห์ไว้เดิม:</b>`,
      `  • <b>หมวดหมู่:</b> ${escapeHtml(aiSnapshot?.category_name || 'ไม่ระบุ')}`,
      `  • <b>ความสำคัญ:</b> <code>${escapeHtml(aiSnapshot?.priority || 'medium')}</code>`,
      aiSnapshot?.summary ? `  • <b>สรุป:</b> ${escapeHtml(aiSnapshot.summary)}` : '',
      `━━━━━━━━━━━━━━━━━━━━`,
      `👉 <a href="${chatLink}">คลิกเพื่อตรวจสอบแชตบนระบบ</a>`,
    ]
      .filter(Boolean)
      .join('\n');

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
