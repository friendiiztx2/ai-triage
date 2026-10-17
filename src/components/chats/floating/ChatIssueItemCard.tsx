'use client';

import React from 'react';
import { Sparkles, Check, Copy } from 'lucide-react';
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

  return (
    <div className="p-3.5 bg-neutral-50/70 dark:bg-neutral-900/50 rounded-xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xs space-y-2.5 min-w-0 relative">
      {/* Card Title */}
      <div className="flex items-start justify-between gap-2 text-xs text-neutral-800 dark:text-neutral-200">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <span className="font-mono text-[11px] font-medium text-neutral-600 dark:text-neutral-400 bg-white dark:bg-neutral-800 px-1.5 py-0.5 rounded border border-neutral-200/80 dark:border-neutral-700 shrink-0">
            #{idx + 1}
          </span>
          <div className="space-y-1 min-w-0">
            <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs leading-snug">
              {issueTitle}
            </div>
            {issueItem.department && (
              <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded-md bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200/80 dark:border-neutral-700">
                {issueItem.department}
              </span>
            )}
          </div>
        </div>
        <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono shrink-0">
          ID: {issueKey.substring(0, 8)}
        </span>
      </div>

      {/* Category Dropdown and Priority Segmented Control */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 pt-0.5 min-w-0">
        <div className="flex-1 min-w-0">
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
        <div className="flex items-center gap-0.5 bg-neutral-200/60 dark:bg-neutral-800 p-0.5 rounded-lg shrink-0">
          {[
            { id: 'low', label: 'Low', activeClass: 'bg-[#e8f0fe] text-[#1a73e8] font-semibold shadow-2xs' },
            { id: 'medium', label: 'Med', activeClass: 'bg-[#f3e8fd] text-[#9334e6] font-semibold shadow-2xs' },
            { id: 'high', label: 'High', activeClass: 'bg-[#fef7e0] text-[#b06000] font-semibold shadow-2xs' },
            { id: 'urgent', label: 'Urgent', activeClass: 'bg-[#fce8e6] text-[#c5221f] font-semibold shadow-2xs' },
          ].map((p) => {
            const isActive = currentPri === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onUpdatePriority(p.id)}
                disabled={userProfile?.role === 'agent'}
                className={`px-2 py-1 rounded-md text-[10px] font-mono uppercase transition cursor-pointer shrink-0 ${
                  isActive
                    ? p.activeClass
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recommended Reply Box */}
      {issueItem.recommended_reply && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 p-3 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-[11px] font-medium text-neutral-700 dark:text-neutral-300">
            <span className="flex items-center gap-1.5">
              <Sparkles size={12} className="text-neutral-500" />
              <span>{language === 'th' ? 'คำแนะนำการตอบกลับ' : 'Recommended Reply'}</span>
            </span>
            <button
              type="button"
              onClick={() => onCopyText(issueItem.recommended_reply, `reply-${issueKey}`)}
              className="text-[10px] font-mono text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded border border-neutral-200/80 dark:border-neutral-700 cursor-pointer transition"
            >
              {copiedId === `reply-${issueKey}` ? (
                <>
                  <Check size={11} className="text-emerald-600" />
                  <span>{language === 'th' ? 'คัดลอกแล้ว' : 'Copied'}</span>
                </>
              ) : (
                <>
                  <Copy size={11} />
                  <span>{language === 'th' ? 'คัดลอก' : 'Copy'}</span>
                </>
              )}
            </button>
          </div>
          <div className="text-xs text-neutral-700 dark:text-neutral-300 font-normal leading-relaxed bg-neutral-50/70 dark:bg-neutral-950/40 p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-800 select-text">
            &ldquo;{issueItem.recommended_reply}&rdquo;
          </div>
        </div>
      )}
    </div>
  );
}
