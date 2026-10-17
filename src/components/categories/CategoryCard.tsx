'use client';

import React from 'react';
import Link from 'next/link';
import { Settings, Trash2, MessageSquare } from 'lucide-react';
import { getCategoryLabel, getBaseCatId } from '@/lib/categories';

export interface CategoryCardProps {
  category: any;
  ticketCount: number;
  canManage: boolean;
  onEdit: (category: any) => void;
  onDelete: (category: any) => void;
  language?: 'th' | 'en';
}

export default function CategoryCard({
  category,
  ticketCount,
  canManage,
  onEdit,
  onDelete,
  language = 'th',
}: CategoryCardProps) {
  const catId = category.id;
  const baseKey = getBaseCatId(catId);
  const catDesc =
    category.description ||
    category.desc ||
    (language === 'th' ? 'ไม่มีคำอธิบายเพิ่มเติมเกี่ยวกับหมวดหมู่นี้' : 'No description provided');

  return (
    <div className="backdrop-blur-xl bg-white/70 dark:bg-neutral-900/70 border border-neutral-200/80 dark:border-neutral-800/80 rounded-[22px] shadow-xs overflow-hidden flex flex-col justify-between hover:border-sky-300 dark:hover:border-sky-700 transition-all group">
      <div className="p-5 sm:p-6 space-y-3.5">
        {/* Header */}
        <div className="flex justify-between items-start gap-4">
          <div>
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono uppercase tracking-wider font-semibold">
              ID: {baseKey}
            </span>
            <h3 className="font-bold text-base text-neutral-800 dark:text-neutral-100 mt-0.5 font-display group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
              {getCategoryLabel(category, language)}
            </h3>
          </div>

          {/* Action buttons (Edit & Delete) */}
          {canManage && (
            <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => onEdit(category)}
                title={language === 'th' ? 'แก้ไขหมวดหมู่' : 'Edit category'}
                className="bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-400/20 p-2 rounded-xl transition-colors cursor-pointer"
              >
                <Settings size={13} />
              </button>
              <button
                type="button"
                onClick={() => onDelete(category)}
                title={language === 'th' ? 'ลบหมวดหมู่' : 'Delete category'}
                className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-400/20 p-2 rounded-xl transition-colors cursor-pointer"
              >
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-normal leading-relaxed line-clamp-3">
          {catDesc}
        </p>
      </div>

      {/* Stat Footer (Clickable to view chats list) */}
      <Link
        href={`/chats?category=${baseKey}`}
        className="bg-neutral-50/60 dark:bg-neutral-900/60 hover:bg-neutral-100/60 dark:hover:bg-neutral-800/70 border-t border-neutral-200/60 dark:border-neutral-800/60 px-5 py-3 flex justify-between items-center text-xs font-semibold text-neutral-700 dark:text-neutral-200 transition-all cursor-pointer group/footer select-none"
      >
        <span className="text-neutral-400 dark:text-neutral-500 group-hover/footer:text-sky-600 dark:group-hover/footer:text-sky-400 flex items-center gap-1.5 transition-colors font-medium">
          <MessageSquare size={13} /> {language === 'th' ? 'เคสสะสมทั้งหมด' : 'Total Accumulated'}
        </span>
        <span className="text-sky-600 dark:text-sky-400 bg-sky-500/10 border border-sky-400/20 px-2 py-0.5 rounded-lg font-semibold group-hover/footer:scale-105 transition-transform flex items-center gap-1">
          {ticketCount} {language === 'th' ? 'เคส' : 'Cases'} →
        </span>
      </Link>
    </div>
  );
}
