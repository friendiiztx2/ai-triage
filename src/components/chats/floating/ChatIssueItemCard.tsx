'use client';

import React, { useState } from 'react';
import { Sparkles, Check, Copy, Building2, Tag, ShieldAlert } from 'lucide-react';
import { getCategoryLabel, getBaseCatId } from '@/lib/categories';
import SelectDropdown from '@/components/ui/SelectDropdown';

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
    <div className="p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/90 dark:border-neutral-800 shadow-xs space-y-3 min-w-0 relative transition-all hover:border-neutral-300 dark:hover:border-neutral-700">
      {/* 1. Card Header: Issue Index & Summary */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-lg border border-blue-200/80 dark:border-blue-900/60 shrink-0">
            #{idx + 1}
          </span>
          <div className="space-y-1.5 min-w-0 flex-1">
            <h4 className="font-bold text-neutral-900 dark:text-neutral-100 text-sm leading-snug break-words">
              {issueTitle}
            </h4>
            {issueItem.department && (
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-[11px] font-medium text-neutral-600 dark:text-neutral-300 border border-neutral-200/80 dark:border-neutral-700">
                <Building2 size={12} className="text-neutral-400" />
                <span>แผนก: {issueItem.department}</span>
              </div>
            )}
          </div>
        </div>
        <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono shrink-0">
          ID: {issueKey.substring(0, 8)}
        </span>
      </div>

      {/* 2. Category Dropdown & Priority Selector */}
      <div className="flex flex-wrap items-center gap-2 pt-1 min-w-0">
        <div className="flex-1 min-w-[160px]">
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

        {/* Priority Segmented Control */}
        <div className="flex items-center gap-0.5 bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-xl shrink-0 border border-neutral-200/60 dark:border-neutral-700/60">
          {[
            { id: 'low', label: 'ปกติ', activeClass: 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-white font-bold shadow-2xs border border-neutral-200/80 dark:border-neutral-700' },
            { id: 'medium', label: 'ปานกลาง', activeClass: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold shadow-2xs border border-blue-200 dark:border-blue-900/60' },
            { id: 'high', label: 'ด่วนสูง', activeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold shadow-2xs border border-amber-200 dark:border-amber-900/60' },
            { id: 'urgent', label: 'ด่วนวิกฤต', activeClass: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold shadow-2xs border border-rose-200 dark:border-rose-900/60' },
          ].map((p) => {
            const isActive = currentPri === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onUpdatePriority(p.id)}
                disabled={userProfile?.role === 'agent'}
                className={`px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer shrink-0 select-none ${
                  isActive
                    ? p.activeClass
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Recommended Reply Box with High-Contrast One-Click Copy */}
      {issueItem.recommended_reply && (
        <div className="rounded-xl border border-blue-200/80 dark:border-blue-900/50 bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/30 dark:from-neutral-900 dark:via-neutral-900 dark:to-blue-950/20 p-3.5 space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-xs font-bold text-blue-900 dark:text-blue-300">
              <Sparkles size={14} className="text-blue-600 dark:text-blue-400" />
              <span>{language === 'th' ? 'ข้อความตอบกลับแนะนำจาก AI' : 'AI Recommended Reply'}</span>
            </span>

            {/* One-Click Copy Button */}
            <button
              type="button"
              onClick={() => onCopyText(issueItem.recommended_reply, `reply-${issueKey}`)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95 ${
                isCopied
                  ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
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
