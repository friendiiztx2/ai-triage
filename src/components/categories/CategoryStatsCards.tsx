'use client';

import React from 'react';
import { Database, TrendingUp, BarChart3 } from 'lucide-react';
import { getCategoryLabel, getBaseCatId, KNOWN_CATEGORY_NAMES } from '@/lib/categories';

export interface CategoryStatsCardsProps {
  categories: any[];
  totalChatsCount: number;
  categoryStats: Record<string, number>;
  language?: 'th' | 'en';
}

function getCategoryDisplayName(catKey: string, categories: any[] = [], lang: 'th' | 'en' = 'th'): string {
  const baseKey = getBaseCatId(catKey);
  const found = categories.find(c => c.id === catKey || getBaseCatId(c.id) === baseKey);
  if (found) {
    return getCategoryLabel(found, lang);
  }
  if (KNOWN_CATEGORY_NAMES[baseKey]) {
    return KNOWN_CATEGORY_NAMES[baseKey][lang] || KNOWN_CATEGORY_NAMES[baseKey].th;
  }
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(baseKey)) {
    return lang === 'th' ? 'เรื่องอื่นๆ' : 'Other Inquiries';
  }
  return baseKey || (lang === 'th' ? 'เรื่องอื่นๆ' : 'Other Inquiries');
}

export default function CategoryStatsCards({
  categories,
  totalChatsCount,
  categoryStats,
  language = 'th',
}: CategoryStatsCardsProps) {
  const sorted = Object.entries(categoryStats)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  const topKey = sorted.length > 0 ? sorted[0][0] : null;
  const topCount = sorted.length > 0 ? sorted[0][1] : 0;
  const topDisplayName = topKey ? getCategoryDisplayName(topKey, categories, language) : null;
  const topPercent = totalChatsCount > 0 ? ((topCount / totalChatsCount) * 100).toFixed(1) : '0';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {/* 1. Mapped Categories */}
      <div className="rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md p-4 shadow-xs">
        <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
          <span className="text-[11px] font-mono uppercase tracking-wider font-medium">
            {language === 'th' ? 'หมวดหมู่ที่เปิดใช้งาน' : 'Mapped Intents'}
          </span>
          <Database size={13} className="text-neutral-400" />
        </div>
        <div className="text-2xl font-semibold font-mono tracking-tight text-neutral-900 dark:text-neutral-100 tabular-nums">
          {categories.length}
        </div>
        <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-2">
          {language === 'th' ? 'หัวข้อที่ใช้จำแนกโดย AI' : 'Active classification topics'}
        </p>
      </div>

      {/* 2. Historical Total Cases */}
      <div className="rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md p-4 shadow-xs">
        <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
          <span className="text-[11px] font-mono uppercase tracking-wider font-medium">
            {language === 'th' ? 'เคสสะสมทั้งหมด' : 'Accumulated Volume'}
          </span>
          <TrendingUp size={13} className="text-neutral-400" />
        </div>
        <div className="text-2xl font-semibold font-mono tracking-tight text-neutral-900 dark:text-neutral-100 tabular-nums">
          {totalChatsCount.toLocaleString()}
        </div>
        <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-2">
          {language === 'th' ? 'ประวัติเคสที่จัดกลุ่มเรียบร้อย' : 'Classified customer sessions'}
        </p>
      </div>

      {/* 3. Dominant Category */}
      <div className="rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md p-4 shadow-xs">
        <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
          <span className="text-[11px] font-mono uppercase tracking-wider font-medium">
            {language === 'th' ? 'หมวดหมู่อันดับ 1' : 'Dominant Topic'}
          </span>
          <BarChart3 size={13} className="text-neutral-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-base font-semibold text-neutral-900 dark:text-neutral-100 truncate max-w-[180px]">
            {topDisplayName || (language === 'th' ? 'ยังไม่มีเคส' : 'No cases')}
          </div>
          {topKey && (
            <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
              ({topPercent}%)
            </span>
          )}
        </div>
        <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-2">
          {topKey ? `${topCount.toLocaleString()} เคสสะสม` : (language === 'th' ? 'รอเคสเข้าระบบ' : 'Awaiting data')}
        </p>
      </div>
    </div>
  );
}
