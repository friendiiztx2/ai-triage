'use client';

import React from 'react';
import { Check, X } from 'lucide-react';
import { getCategoryLabel } from '@/lib/categories';
import SelectDropdown from '@/components/ui/SelectDropdown';

export interface BulkActionsToolbarProps {
  selectedCount: number;
  onDeselectAll: () => void;
  onMarkCompleted?: () => void;
  onBatchMoveCategory: (categoryId: string) => void;
  categories: any[];
  language?: 'th' | 'en';
}

export default function BulkActionsToolbar({
  selectedCount,
  onDeselectAll,
  onBatchMoveCategory,
  categories,
  language = 'th',
}: BulkActionsToolbarProps) {
  if (selectedCount === 0) return null;

  const moveOptions = [
    ...categories.map((cat) => {
      const label =
        language === 'en'
          ? cat.name_en || getCategoryLabel(cat, 'en')
          : cat.name_th || cat.name || getCategoryLabel(cat, 'th');
      return {
        value: cat.id,
        label,
      };
    }),
    {
      value: 'other',
      label: language === 'th' ? 'เรื่องอื่นๆ' : 'Other Inquiries',
    },
  ];

  return (
    <div className="relative z-20 bg-[#e8f0fe] dark:bg-blue-950/70 border border-[#1a73e8]/30 px-4 py-2.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs select-none backdrop-blur-md mb-3 animate-fade-in text-xs">
      <div className="flex items-center gap-3">
        <span className="font-mono font-semibold text-[#1a73e8] dark:text-blue-300">
          {language === 'th' ? `เลือกอยู่ ${selectedCount} รายการ` : `${selectedCount} selected`}
        </span>
        <button
          onClick={onDeselectAll}
          className="inline-flex items-center gap-1 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors cursor-pointer text-[11px]"
        >
          <X size={11} />
          <span>{language === 'th' ? 'ยกเลิก' : 'Deselect'}</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="w-48">
          <SelectDropdown
            value=""
            placeholder={language === 'th' ? 'ย้ายหมวดหมู่...' : 'Batch Move Intent...'}
            onChange={(val) => {
              if (val) onBatchMoveCategory(val);
            }}
            options={moveOptions}
          />
        </div>
      </div>
    </div>
  );
}
