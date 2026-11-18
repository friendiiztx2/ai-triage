'use client';

import React, { useState } from 'react';
import { Sparkles, Check, Copy, Building2, Tag, ShieldAlert } from 'lucide-react';
import { getCategoryLabel, getBaseCatId } from '@/lib/categories';
import SelectDropdown from '@/components/ui/SelectDropdown';

const PRIORITY_OPTIONS = [
  { id: 'low', label: 'ปกติ', textClass: 'text-emerald-700 dark:text-emerald-300', color: 'var(--color-emerald-500)' },
  { id: 'medium', label: 'ปานกลาง', textClass: 'text-brand-700 dark:text-brand-300', color: 'var(--color-brand-500)' },
  { id: 'high', label: 'ด่วนสูง', textClass: 'text-amber-700 dark:text-amber-300', color: 'var(--color-amber-500)' },
  { id: 'urgent', label: 'ด่วนวิกฤต', textClass: 'text-rose-700 dark:text-rose-300', color: 'var(--color-rose-500)' },
];

/** Dot size and halo as inline styles, so the selected dot never depends on a utility class being generated */
function priorityDotStyle(color: string, isActive: boolean): React.CSSProperties {
  return isActive
    ? { width: 12, height: 12, backgroundColor: color, boxShadow: `0 0 0 3px color-mix(in srgb, ${color} 28%, transparent)` }
    : { width: 8, height: 8, backgroundColor: color };
}

interface ChatIssueItemCardProps {
  idx: number;
  issueItem: any;
  categories: any[];
  userProfile: any;
  language: string;
  currentVal: { category_id: string; priority: string };
  onUpdateCategory: (newCategory: string) => void;
  onUpdatePriority: (newPriority: string) => void;
  copiedId: any;
  onCopyText: (text: string, id: string) => void;
}

export default function ChatIssueItemCard({
  idx,
  issueItem,
  categories,
  userProfile,
  language,
  currentVal,
  onUpdateCategory,
  onUpdatePriority,
  copiedId,
  onCopyText,
}: ChatIssueItemCardProps) {
  const issueKey = issueItem.id || 'issue-' + idx;
  const issueTitle = issueItem.summary || issueItem.issue_summary || `ประเด็นที่ ${idx + 1}`;
  const selectedCategoryVal = getBaseCatId(currentVal.category_id || issueItem.category_id || '');
  const currentPri = (currentVal.priority || issueItem.priority || 'medium').toLowerCase();

  const isCopied = copiedId === `reply-${issueKey}`;

  return (
    <div className="p-3 md:p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200/90 dark:border-neutral-800 shadow-xs space-y-2.5 md:space-y-3 min-w-0 relative transition-all hover:border-neutral-300 dark:hover:border-neutral-700">
      {/* 1. Card Header: index + summary on the left, a small department tag on the right */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-2 md:gap-2.5 min-w-0 flex-1">
          <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/50 px-1.5 md:px-2 py-0.5 rounded-lg border border-brand-200/80 dark:border-brand-900/60 shrink-0">
            #{idx + 1}
          </span>
          <h4 className="font-medium text-neutral-800 dark:text-neutral-100 text-sm leading-relaxed break-words min-w-0 flex-1 pt-0.5">
            {issueTitle}
          </h4>
        </div>
        {issueItem.department && (
          <span
            title={`แผนก: ${issueItem.department}`}
            className="inline-flex items-center gap-1 px-1.5 py-px mt-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 border border-neutral-200/80 dark:border-neutral-700 shrink-0 max-w-[40%]"
          >
            <Building2 size={11} className="text-neutral-400 shrink-0" />
            <span className="truncate">{issueItem.department}</span>
          </span>
        )}
      </div>

      {/* 2. Category Dropdown & Priority Selector (phones: two dropdowns side by side on one row) */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] md:flex md:flex-wrap items-center gap-2 md:pt-1 min-w-0">
        <div className="min-w-0 md:flex-1 md:min-w-[160px]">
          <SelectDropdown
            value={selectedCategoryVal}
            onChange={onUpdateCategory}
            disabled={userProfile?.role === 'agent'}
            placeholder={language === 'th' ? '-- เลือกหมวดหมู่ --' : '-- Select Category --'}
            options={[
              { value: '', label: language === 'th' ? '-- เลือกหมวดหมู่ --' : '-- Select Category --' },
              ...categories.map((cat: any) => {
                const optionVal = getBaseCatId(cat.id);
                const label =
                  language === 'en'
                    ? cat.name_en || getCategoryLabel(cat, 'en')
                    : cat.name_th || cat.name || getCategoryLabel(cat, 'th');
                return {
                  value: optionVal,
                  label,
                };
              }),
            ]}
          />
        </div>

        {/* Priority as a compact dropdown on phones */}
        <div className="md:hidden w-[118px]">
          <SelectDropdown
            value={currentPri}
            onChange={onUpdatePriority}
            disabled={userProfile?.role === 'agent'}
            align="right"
            aria-label={language === 'th' ? 'ความเร่งด่วน' : 'Priority'}
            options={PRIORITY_OPTIONS.map((p) => ({
              value: p.id,
              label: <span className={p.textClass}>{p.label}</span>,
            }))}
          />
        </div>

        {/* Priority as four colour dots; the name shows on hover or keyboard focus */}
        <div
          role="radiogroup"
          aria-label={language === 'th' ? 'ความเร่งด่วน' : 'Priority'}
          className="hidden md:flex items-center gap-0.5 shrink-0 h-8 px-1 rounded-full bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60"
        >
          {PRIORITY_OPTIONS.map((p) => {
            const isActive = currentPri === p.id;
            return (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={isActive}
                aria-label={p.label}
                onClick={() => onUpdatePriority(p.id)}
                disabled={userProfile?.role === 'agent'}
                className="group/pri relative w-6 h-6 flex items-center justify-center rounded-full cursor-pointer disabled:cursor-default focus-visible:outline-2 focus-visible:outline-brand-500 transition"
              >
                <span
                  style={priorityDotStyle(p.color, isActive)}
                  className={`block rounded-full transition-all duration-150 ${
                    isActive ? '' : 'opacity-40 group-hover/pri:opacity-100'
                  }`}
                />
                <span className="pointer-events-none absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-neutral-900 dark:bg-neutral-100 px-2 py-1 text-xs font-medium text-white dark:text-neutral-900 opacity-0 group-hover/pri:opacity-100 group-focus-visible/pri:opacity-100 transition-opacity z-20 shadow-md">
                  {p.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Recommended Reply Box with High-Contrast One-Click Copy */}
      {issueItem.recommended_reply && (
        <div className="rounded-xl border border-brand-200/80 dark:border-brand-900/50 bg-gradient-to-br from-brand-50/50 via-white to-indigo-50/30 dark:from-neutral-900 dark:via-neutral-900 dark:to-brand-950/20 p-3.5 space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-xs font-bold text-brand-900 dark:text-brand-300">
              <Sparkles size={14} className="text-brand-600 dark:text-brand-400" />
              <span>{language === 'th' ? 'ข้อความตอบกลับแนะนำจาก AI' : 'AI Recommended Reply'}</span>
            </span>

            {/* One-Click Copy Button */}
            <button
              type="button"
              onClick={() => onCopyText(issueItem.recommended_reply, `reply-${issueKey}`)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95 ${
                isCopied
                  ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                  : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/20'
              }`}
              title={language === 'th' ? 'คลิกเพื่อคัดลอกข้อความไปตอบลูกค้า' : 'Copy recommended reply'}
            >
              {isCopied ? (
                <>
                  <Check size={12} strokeWidth={2.5} />
                  <span>{language === 'th' ? 'คัดลอกสำเร็จ!' : 'Copied!'}</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span>{language === 'th' ? 'คัดลอกคำตอบ' : 'Copy Reply'}</span>
                </>
              )}
            </button>
          </div>

          <div className="text-xs text-neutral-800 dark:text-neutral-200 font-normal leading-relaxed bg-white/80 dark:bg-neutral-950/60 p-3 rounded-lg border border-neutral-200/60 dark:border-neutral-800 select-text">
            &ldquo;{issueItem.recommended_reply}&rdquo;
          </div>
        </div>
      )}
    </div>
  );
}
