'use client';

import React from 'react';
import { Tag as TagIcon, X, Plus, Check } from 'lucide-react';

interface ChatTagsSectionProps {
  tags: string[];
  onRemoveTag: (tag: string) => void;
  onTogglePresetTag: (tag: string) => void;
}

export default function ChatTagsSection({
  tags,
  onRemoveTag,
  onTogglePresetTag,
}: ChatTagsSectionProps) {
  const PRESET_TAGS = [
    { name: '#VIP', style: 'bg-[#f3e8fd] text-[#8430ce] border-[#e1c5fb] dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800' },
    { name: '#ติดตามผล', style: 'bg-[#fef7e0] text-[#b06000] border-[#feefc3] dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800' },
    { name: '#รอสลิป', style: 'bg-[#e8f0fe] text-[#1a73e8] border-[#c2e7ff] dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800' },
    { name: '#ส่งเรื่องทีมเทคนิค', style: 'bg-[#fce8e6] text-[#c5221f] border-[#fad2cf] dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800' },
    { name: '#รอธนาคารแก้ไข', style: 'bg-[#e6f4ea] text-[#137333] border-[#ceead6] dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800' },
    { name: '#เคสพิเศษ', style: 'bg-[#e0f2f1] text-[#00695c] border-[#b2dfdb] dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800' },
  ];

  const currentTags = tags || [];

  const getTagStyle = (tagName: string) => {
    const found = PRESET_TAGS.find((p) => p.name === tagName);
    return found ? found.style : 'bg-neutral-100 text-neutral-800 border-neutral-200/80 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700';
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-xl p-3.5 space-y-3 shadow-2xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
          <TagIcon size={13} className="text-[#1a73e8]" />
          <span>ป้ายกำกับเคส</span>
        </div>
        <span className="text-[11px] font-mono text-neutral-400">
          {currentTags.length}
        </span>
      </div>

      {/* Current Active Tags */}
      <div className="flex flex-wrap items-center gap-1.5 min-h-[26px]">
        {currentTags.length > 0 ? (
          currentTags.map((t: string, idx: number) => (
            <span
              key={idx}
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md border font-mono transition shadow-2xs ${getTagStyle(t)}`}
            >
              <span>{t}</span>
              <button
                type="button"
                onClick={() => onRemoveTag(t)}
                className="opacity-60 hover:opacity-100 transition cursor-pointer p-0.5 rounded"
                title="ลบแท็กนี้"
              >
                <X size={11} />
              </button>
            </span>
          ))
        ) : (
          <span className="text-neutral-400 dark:text-neutral-500 text-xs">
            ยังไม่มีป้ายกำกับ — เลือกจากรายการด้านล่าง
          </span>
        )}
      </div>

      {/* Preset Quick Tags */}
      <div className="space-y-1.5 pt-2.5 border-t border-neutral-100 dark:border-neutral-800/80">
        <span className="text-[10px] font-mono font-medium text-neutral-400 uppercase tracking-wider block">
          แท็กด่วนที่แนะนำ:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_TAGS.map((ptag) => {
            const isSelected = currentTags.includes(ptag.name);
            return (
              <button
                key={ptag.name}
                type="button"
                onClick={() => onTogglePresetTag(ptag.name)}
                className={`text-xs font-mono px-2.5 py-1 rounded-md border transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs ${
                  isSelected
                    ? `${ptag.style} ring-1.5 ring-current font-semibold scale-102`
                    : `${ptag.style} opacity-80 hover:opacity-100 hover:scale-101`
                }`}
              >
                {isSelected ? <Check size={11} className="stroke-[2.5]" /> : <Plus size={11} className="opacity-60" />}
                <span>{ptag.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
