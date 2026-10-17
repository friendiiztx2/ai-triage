import React from 'react';
import Link from 'next/link';
import { Cpu, ArrowUpRight, Check, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

interface AiPerformanceAuditCardProps {
  aiMetrics: {
    accuracyRate: string;
    totalAudited: number;
    confirmedCount: number;
    correctedCount: number;
  };
  language?: 'th' | 'en';
}

export default function AiPerformanceAuditCard({
  aiMetrics,
  language = 'th',
}: AiPerformanceAuditCardProps) {
  const { t } = useLanguage();

  const rateNum = parseFloat(aiMetrics.accuracyRate || '0');
  const isHealthy = rateNum >= 85;

  return (
    <div className="rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md p-5 shadow-xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200/60 dark:border-neutral-800/60">
          <div className="flex items-center gap-2">
            <Cpu size={14} className="text-neutral-500 dark:text-neutral-400" />
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
              {t('aiAccuracyTitle')}
            </h2>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700/60">
            Audit Mode
          </span>
        </div>

        {/* Big Precision Metric */}
        <div className="my-5 p-4 rounded-lg bg-neutral-50/80 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-800/60">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">
              {t('accuracyRate')}
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium ${
              isHealthy
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
            }`}>
              {isHealthy ? 'Optimal' : 'Needs Review'}
            </span>
          </div>

          <div className="text-3xl font-semibold font-mono tracking-tight text-neutral-900 dark:text-neutral-100 tabular-nums">
            {aiMetrics.accuracyRate}%
          </div>

          {/* Micro Progress Bar */}
          <div className="w-full bg-neutral-200/60 dark:bg-neutral-700/60 h-1.5 rounded-full overflow-hidden mt-3">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isHealthy ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, rateNum))}%` }}
            />
          </div>
        </div>

        {/* Detailed Breakdown Rows */}
        <div className="space-y-1 divide-y divide-neutral-100 dark:divide-neutral-800/60 text-xs">
          <Link
            href="/chats?status=completed"
            className="group flex items-center justify-between py-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors cursor-pointer"
          >
            <span className="text-neutral-500">{t('auditedCases')}</span>
            <span className="font-mono font-medium text-neutral-900 dark:text-neutral-100 tabular-nums flex items-center gap-1">
              {aiMetrics.totalAudited} {language === 'th' ? 'เคส' : 'cases'}
              <ArrowUpRight size={11} className="text-neutral-300 dark:text-neutral-700 group-hover:text-neutral-500 transition-colors" />
            </span>
          </Link>

          <Link
            href="/chats?status=completed&audit=confirmed"
            className="group flex items-center justify-between py-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5 text-neutral-500">
              <Check size={12} className="text-emerald-500" />
              <span>{t('confirmedByAi')}</span>
            </span>
            <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
              {aiMetrics.confirmedCount}
            </span>
          </Link>

          <Link
            href="/chats?status=completed&audit=corrected"
            className="group flex items-center justify-between py-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5 text-neutral-500">
              <AlertCircle size={12} className="text-amber-500" />
              <span>{t('overrideByAdmin')}</span>
            </span>
            <span className="font-mono font-medium text-amber-600 dark:text-amber-400 tabular-nums">
              {aiMetrics.correctedCount}
            </span>
          </Link>
        </div>
      </div>

      <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/60 mt-4 text-[10px] font-mono text-neutral-400 dark:text-neutral-500 text-center">
        {language === 'th' ? 'คำนวณจากประวัติการยืนยันเคสจริง' : 'Calculated against human verification'}
      </div>
    </div>
  );
}
