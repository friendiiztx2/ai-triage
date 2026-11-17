import React from 'react';
import { useLanguage } from '@/components/LanguageContext';
import { priorityLabel } from '@/lib/priority';

interface ChatPriorityBadgeProps {
  priority: string;
}

export default function ChatPriorityBadge({ priority }: ChatPriorityBadgeProps) {
  const pri = priority?.toLowerCase() || 'low';
  const { language } = useLanguage();
  const label = priorityLabel(pri, language);
  // English keeps the compact monospace capitals; Thai reads better in the normal font
  const caseClass = language === 'en' ? 'font-mono uppercase tracking-wider' : '';

  if (pri === 'urgent') {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${caseClass} bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20`}>
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-60"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
        </span>
        {label}
      </span>
    );
  }

  if (pri === 'high') {
    return (
      <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${caseClass} bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20`}>
        {label}
      </span>
    );
  }

  if (pri === 'medium') {
    return (
      <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${caseClass} bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700`}>
        {label}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center text-xs text-neutral-400 dark:text-neutral-500 whitespace-nowrap ${caseClass}`}>
      {label}
    </span>
  );
}
