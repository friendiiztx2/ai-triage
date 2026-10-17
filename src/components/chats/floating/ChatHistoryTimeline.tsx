'use client';

import React from 'react';
import { History } from 'lucide-react';
import { getCategoryLabel, getBaseCatId } from '@/lib/categories';

interface ChatHistoryTimelineProps {
  chat: any;
  categories: any[];
  language: 'th' | 'en';
}

export default function ChatHistoryTimeline({
  chat,
  categories,
  language,
}: ChatHistoryTimelineProps) {
  let history: any[] = [];
  try {
    if (chat.resolution && chat.resolution !== 'Pending' && chat.resolution !== 'Solved') {
      const parsed = JSON.parse(chat.resolution);
      if (Array.isArray(parsed)) {
        history = parsed;
      }
    }
  } catch (e) {}

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-xl p-3.5 shadow-2xs space-y-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
        <History size={13} className="text-neutral-400" />
        <span>ประวัติการแก้ไข</span>
      </div>

      <div className="relative border-l border-neutral-200 dark:border-neutral-800 pl-3.5 ml-1.5 space-y-3.5">
        {history.map((log: any, idx: number) => {
          const oldCatObj = categories.find((c: any) => c.id === log.old_category || getBaseCatId(c.id) === getBaseCatId(log.old_category));
          const newCatObj = categories.find((c: any) => c.id === log.new_category || getBaseCatId(c.id) === getBaseCatId(log.new_category));
          const oldCatLabel = getCategoryLabel(oldCatObj || log.old_category, language);
          const newCatLabel = getCategoryLabel(newCatObj || log.new_category, language);

          return (
            <div key={idx} className="relative text-xs">
              <div className="absolute -left-[18px] top-1.5 w-2 h-2 rounded-full bg-neutral-900 dark:bg-neutral-100 ring-2 ring-white dark:ring-neutral-900" />
              <div className="text-[10px] font-mono text-neutral-400">
                {new Date(log.timestamp).toLocaleString('th-TH')}
              </div>
              <div className="text-neutral-800 dark:text-neutral-200 font-medium text-xs mt-0.5">
                {language === 'th' ? 'โดย:' : 'By:'} <span className="font-mono text-neutral-600 dark:text-neutral-400">{log.actor}</span>
              </div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                {language === 'th' ? 'หมวดหมู่:' : 'Category:'}{' '}
                <span className="line-through text-neutral-400">{oldCatLabel}</span>
                <span className="mx-1 text-neutral-400">→</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">{newCatLabel}</span>
              </div>
            </div>
          );
        })}
        
        {/* Initial AI Creation */}
        <div className="relative text-xs">
          <div className="absolute -left-[18px] top-1.5 w-2 h-2 rounded-full bg-neutral-300 dark:bg-neutral-700 ring-2 ring-white dark:ring-neutral-900" />
          <div className="text-[10px] font-mono text-neutral-400">
            {chat.created_at ? new Date(chat.created_at).toLocaleString('th-TH') : '-'}
          </div>
          <div className="text-neutral-600 dark:text-neutral-400 font-medium text-xs mt-0.5">
            {language === 'th' ? 'โดย: Sift AI Engine' : 'By: Sift AI Engine'}
          </div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
            {language === 'th' ? 'หมวดหมู่เริ่มต้น:' : 'Initial Category:'}{' '}
            <span className="font-medium text-neutral-700 dark:text-neutral-300">
              {getCategoryLabel(categories.find((c: any) => c.id === chat.category_id || getBaseCatId(c.id) === getBaseCatId(chat.category_id)) || chat.category_id, language)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
