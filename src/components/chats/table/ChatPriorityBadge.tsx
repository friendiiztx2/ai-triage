import React from 'react';

interface ChatPriorityBadgeProps {
  priority: string;
}

export default function ChatPriorityBadge({ priority }: ChatPriorityBadgeProps) {
  const pri = priority?.toLowerCase() || 'low';

  if (pri === 'urgent') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold px-2 py-0.5 rounded uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-60"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
        </span>
        urgent
      </span>
    );
  }

  if (pri === 'high') {
    return (
      <span className="inline-flex items-center text-[10px] font-mono font-semibold px-2 py-0.5 rounded uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
        high
      </span>
    );
  }

  if (pri === 'medium') {
    return (
      <span className="inline-flex items-center text-[10px] font-mono font-medium px-2 py-0.5 rounded uppercase tracking-wider bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
        medium
      </span>
    );
  }

  return (
    <span className="inline-flex items-center text-[10px] font-mono text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
      low
    </span>
  );
}
