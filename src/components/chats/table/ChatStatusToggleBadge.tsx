import React from 'react';
import { CheckCircle2, Clock, Loader2 } from 'lucide-react';

interface ChatStatusToggleBadgeProps {
  status: string;
  onToggle?: (e: React.MouseEvent) => void;
  language?: 'th' | 'en';
}

export default function ChatStatusToggleBadge({
  status,
  language = 'th',
}: ChatStatusToggleBadgeProps) {
  const normStatus = (status || '').toLowerCase().trim();
  const isCompleted = normStatus === 'completed' || normStatus === 'วิเคราะห์แล้ว' || normStatus === 'resolved';
  const isProcessing = normStatus === 'processing' || normStatus === 'กำลังวิเคราะห์';

  if (isCompleted) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 select-none"
        title={language === 'th' ? 'AI วิเคราะห์เสร็จสิ้น' : 'AI Analysis Completed'}
      >
        <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
        <span>{language === 'th' ? 'วิเคราะห์แล้ว' : 'Analyzed'}</span>
      </span>
    );
  }

  if (isProcessing) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20 select-none"
        title={language === 'th' ? 'AI กำลังประมวลผล' : 'AI Processing'}
      >
        <Loader2 size={11} className="text-sky-500 shrink-0 animate-spin" />
        <span>{language === 'th' ? 'กำลังวิเคราะห์' : 'Processing'}</span>
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 select-none"
      title={language === 'th' ? 'รอ AI ประมวลผล' : 'Pending Analysis'}
    >
      <Clock size={11} className="text-amber-500 shrink-0" />
      <span>{language === 'th' ? 'รอวิเคราะห์' : 'Pending'}</span>
    </span>
  );
}
