import React, { useState } from 'react';
import Link from 'next/link';
import { Layers, ArrowUpRight, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import AiPerformanceAuditCard from './AiPerformanceAuditCard';

export interface DashboardCategoryBreakdownProps {
  sortedChartData: Array<{ name: string; value: number; id: string }>;
  otherCount: number;
  aiMetrics: {
    accuracyRate: string;
    totalAudited: number;
    confirmedCount: number;
    correctedCount: number;
  };
  dateRange: string;
  language?: 'th' | 'en';
}

export default function DashboardCategoryBreakdown({
  sortedChartData,
  aiMetrics,
  dateRange,
  language = 'th',
}: DashboardCategoryBreakdownProps) {
  const { t } = useLanguage();
  const [showAllCategories, setShowAllCategories] = useState(false);

  const totalVolume = sortedChartData.reduce((acc, curr) => acc + curr.value, 0);

  const displayLimit = 6;
  const itemsToRender = showAllCategories
    ? sortedChartData
    : sortedChartData.slice(0, displayLimit);
  const hasMore = sortedChartData.length > displayLimit;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Category Distribution Panel */}
      <div className="lg:col-span-2 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200/60 dark:border-neutral-800/60">
            <div className="flex items-center gap-2">
              <Layers size={14} className="text-neutral-500 dark:text-neutral-400" />
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
                {t('casesByCategory')}
              </h2>
            </div>
            <span className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500">
              {sortedChartData.length} {language === 'th' ? 'หมวดหมู่ที่มีเคส' : 'active topics'}
            </span>
          </div>

          {sortedChartData.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-400 font-mono">
              {language === 'th' ? 'ไม่มีข้อมูลเคสในช่วงเวลานี้' : 'No inquiry data for this timeframe'}
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60 mt-2">
              {itemsToRender.map((item, idx) => {
                const percentage = totalVolume > 0 ? ((item.value / totalVolume) * 100).toFixed(1) : '0';

                return (
                  <Link
                    key={item.id || item.name}
                    href={`/chats?category=${encodeURIComponent(item.id)}&timeframe=${dateRange}`}
                    className="group py-2.5 flex items-center justify-between gap-4 hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 px-2 rounded-lg transition-colors cursor-pointer"
                  >
                    {/* Rank & Name */}
                    <div className="flex items-center gap-2.5 min-w-0 max-w-[40%] sm:max-w-[45%]">
                      <span className="font-mono text-[11px] text-neutral-400 w-4 text-right shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200 truncate group-hover:text-neutral-950 dark:group-hover:text-white transition-colors">
                        {item.name}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex-1 hidden sm:flex items-center gap-2 max-w-xs">
                      <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#1a73e8] h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.max(4, Number(percentage)))}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] text-neutral-400 w-11 text-right shrink-0">
                        {percentage}%
                      </span>
                    </div>

                    {/* Count & Link */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-xs font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">
                        {item.value.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        {language === 'th' ? 'เคส' : 'cases'}
                      </span>
                      <ArrowUpRight size={12} className="text-neutral-300 dark:text-neutral-700 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {hasMore && (
          <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/60 mt-2 text-center">
            <button
              type="button"
              onClick={() => setShowAllCategories(!showAllCategories)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors cursor-pointer py-1 px-3 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <span>
                {showAllCategories
                  ? (language === 'th' ? 'ย่อหมวดหมู่' : 'Collapse')
                  : `${t('showAllCategories')} (+${sortedChartData.length - displayLimit})`}
              </span>
              {showAllCategories ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>
        )}
      </div>

      {/* AI Performance Audit (KPI metrics card) */}
      <AiPerformanceAuditCard aiMetrics={aiMetrics} language={language} />
    </div>
  );
}
