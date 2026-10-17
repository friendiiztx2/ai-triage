'use client';

import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export interface SortHeaderProps {
  label: React.ReactNode;
  active: boolean;
  direction: 'asc' | 'desc';
  onSort: () => void;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export default function SortHeader({
  label,
  active,
  direction,
  onSort,
  align = 'left',
  className = '',
}: SortHeaderProps) {
  const justifyClass = 
    align === 'right' ? 'justify-end' :
    align === 'center' ? 'justify-center' : 'justify-start';

  return (
    <button
      type="button"
      onClick={onSort}
      className={`group w-full inline-flex items-center gap-1.5 font-semibold text-xs text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 outline-none focus:outline-none focus-visible:outline-none focus:ring-0 transition-colors cursor-pointer select-none ${justifyClass} ${className}`}
    >
      <span className="truncate">{label}</span>
      <span className="shrink-0 transition-colors">
        {active ? (
          direction === 'asc' ? (
            <ArrowUp size={13} className="text-[#1a73e8] dark:text-[#8ab4f8] stroke-[2.5]" />
          ) : (
            <ArrowDown size={13} className="text-[#1a73e8] dark:text-[#8ab4f8] stroke-[2.5]" />
          )
        ) : (
          <ArrowUpDown size={13} className="text-neutral-400/60 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors" />
        )}
      </span>
    </button>
  );
}
