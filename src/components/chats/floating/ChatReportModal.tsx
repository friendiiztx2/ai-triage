'use client';

import React, { useState } from 'react';
import { 
  AlertTriangle, 
  X, 
  Send, 
  Loader2, 
  CheckCircle2, 
  Bot, 
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { getCategoryLabel } from '@/lib/categories';

interface ChatReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  chat: any;
  categories: any[];
  userProfile: any;
  language: string;
  chatIssues?: any[];
  onReportSuccess?: () => void;
}

const REPORT_REASONS = [
  { id: 'wrong_category', label_th: 'จัดหมวดหมู่ผิดพลาด', label_en: 'Wrong Category', icon: '🏷️' },
  { id: 'inaccurate_summary', label_th: 'สรุปประเด็นไม่ตรงกับแชต', label_en: 'Inaccurate Summary', icon: '📝' },
  { id: 'bad_reply', label_th: 'ข้อความแนะนำตอบกลับไม่เหมาะสม', label_en: 'Inappropriate Reply', icon: '💬' },
  { id: 'wrong_priority', label_th: 'ประเมินระดับความสำคัญผิด', label_en: 'Wrong Priority', icon: '⚡' },
  { id: 'hallucination', label_th: 'AI เข้าใจเจตนาผิด / มีข้อมูลเท็จ', label_en: 'Misunderstood Intent', icon: '🧠' },
  { id: 'other', label_th: 'อื่นๆ', label_en: 'Other', icon: '📌' },
];

export default function ChatReportModal({
  isOpen,
  onClose,
  chat,
  categories,
  userProfile,
  language,
  chatIssues = [],
  onReportSuccess,
}: ChatReportModalProps) {
  const [selectedReasons, setSelectedReasons] = useState<string[]>(['wrong_category']);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !chat) return null;

  // Determine current category label for snapshot
  const currentCatObj = categories.find((c) => c.id === chat.category_id);
  const currentCatLabel = currentCatObj 
    ? getCategoryLabel(currentCatObj, language as any) 
    : (chat.category_id || 'ไม่ระบุ');

  const toggleReason = (id: string) => {
    setSelectedReasons((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedReasons.length === 0 && !comment.trim()) {
      setErrorMsg(language === 'th' ? 'กรุณาเลือกสาเหตุหรือระบุข้อความถึงผู้พัฒนา' : 'Please select a reason or provide a comment');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const primaryIssue = chatIssues.length > 0 ? chatIssues[0] : null;

    try {
      const res = await fetch('/api/chats/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chat.id,
          company_id: chat.company_id || userProfile?.company_id || undefined,
          customer_name: chat.customer_name || chat.customer_id || 'ลูกค้า',
          reported_by: userProfile?.name || 'เจ้าหน้าที่',
          reasons: selectedReasons,
          comment: comment.trim(),
          ai_snapshot: {
            category_name: currentCatLabel,
            priority: chat.priority || primaryIssue?.priority || 'medium',
            summary: primaryIssue?.summary || chat.summary || '',
            recommended_reply: primaryIssue?.recommended_reply || chat.recommended_reply || '',
          },
          app_url: typeof window !== 'undefined' ? window.location.origin : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to submit report');
      }

      setIsSuccess(true);
      if (onReportSuccess) onReportSuccess();
      setTimeout(() => {
        setIsSuccess(false);
        setComment('');
        setSelectedReasons(['wrong_category']);
        onClose();
      }, 1800);
    } catch (err: any) {
      console.error('Error reporting AI issue:', err);
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการส่งรายงาน');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
      <div 
        className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <AlertTriangle size={17} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <span>{language === 'th' ? 'รายงานผลการวิเคราะห์ AI' : 'Report AI Inaccuracy'}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-normal">
                  Feedback to Dev
                </span>
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                {language === 'th'
                  ? 'ส่งความคิดเห็นและข้อมูลข้อผิดพลาดถึงทีมผู้พัฒนาเพื่อปรับปรุง AI'
                  : 'Send feedback and error context directly to the development team'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        {isSuccess ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center animate-bounce">
              <CheckCircle2 size={26} />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {language === 'th' ? 'ส่งรายงานถึงผู้พัฒนาเรียบร้อยแล้ว' : 'Report sent successfully'}
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {language === 'th' 
                  ? 'ระบบได้ส่งการแจ้งเตือนไปยัง Telegram ของทีมพัฒนาแล้ว ขอบคุณสำหรับข้อมูลครับ'
                  : 'The notification has been dispatched to Telegram. Thank you for your feedback!'}
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[75vh]">
            {/* Context Box */}
            <div className="bg-neutral-50 dark:bg-neutral-950/50 p-3 rounded-xl border border-neutral-200/80 dark:border-neutral-800 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-[11px]">
                <span className="flex items-center gap-1 font-mono">
                  <MessageSquare size={12} />
                  <span>แชต: #{chat.id.substring(0, 10)}</span>
                </span>
                <span>ลูกค้า: <strong className="text-neutral-800 dark:text-neutral-200">{chat.customer_name || 'ไม่ระบุ'}</strong></span>
              </div>
              <div className="pt-1 flex items-center gap-2 text-[11px] text-neutral-600 dark:text-neutral-300">
                <span className="text-neutral-400">AI ปัจจุบัน:</span>
                <span className="px-2 py-0.5 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-medium text-neutral-800 dark:text-neutral-200">
                  {currentCatLabel}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded uppercase bg-neutral-200 dark:bg-neutral-800">
                  {chat.priority || 'medium'}
                </span>
              </div>
            </div>

            {/* Reasons Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block">
                {language === 'th' ? 'เลือกปัญหาที่พบ (เลือกได้มากกว่า 1 ข้อ):' : 'Select issue types:'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {REPORT_REASONS.map((r) => {
                  const isChecked = selectedReasons.includes(r.id);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => toggleReason(r.id)}
                      className={`text-left p-2.5 rounded-xl border text-xs transition flex items-center gap-2 cursor-pointer ${
                        isChecked
                          ? 'border-amber-500/60 bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 font-medium'
                          : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                      }`}
                    >
                      <span className="text-sm shrink-0">{r.icon}</span>
                      <span className="truncate">{language === 'th' ? r.label_th : r.label_en}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comment to Developers */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center justify-between">
                <span>{language === 'th' ? 'ข้อความถึงผู้พัฒนา / คำอธิบายเพิ่มเติม:' : 'Message to Developers:'}</span>
                <span className="text-[10px] text-neutral-400 font-normal">
                  {comment.length}/500
                </span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 500))}
                rows={3}
                placeholder={
                  language === 'th'
                    ? 'เช่น: ลูกค้าแจ้งเรื่องยอดเงินไม่เข้า ควรเป็นหมวดหมู่การเงิน แต่ AI ตอบเป็นสอบถามทั่วไป...'
                    : 'e.g. Customer was inquiring about payment refund, but AI classified as general inquiry...'
                }
                className="w-full text-xs p-3 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition resize-none leading-relaxed"
              />
            </div>

            {/* Telegram Alert Note */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-900/40 text-[11px] text-sky-700 dark:text-sky-300">
              <Bot size={14} className="shrink-0 text-sky-600 dark:text-sky-400" />
              <span>
                {language === 'th'
                  ? 'ระบบจะส่งข้อความแจ้งเตือนเข้า Telegram ของทีมพัฒนาโดยอัตโนมัติ'
                  : 'A notification will be automatically dispatched to the developers Telegram channel.'}
              </span>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300">
                {errorMsg}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              >
                {language === 'th' ? 'ยกเลิก' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-medium shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>{language === 'th' ? 'กำลังส่งรายงาน...' : 'Sending...'}</span>
                  </>
                ) : (
                  <>
                    <Send size={13} />
                    <span>{language === 'th' ? 'ส่งรายงานถึงผู้พัฒนา' : 'Submit Report'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
