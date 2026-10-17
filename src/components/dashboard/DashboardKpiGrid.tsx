import React from 'react';
import Link from 'next/link';
import { MessageSquare, Clock, AlertTriangle, Sparkles, ArrowUpRight } from 'lucide-react';

export interface DashboardKpiGridProps {
  stats: {
    totalChats: number;
    pendingTriage: number;
    highPriority: number;
    highOnlyCount: number;
    totalCustomers: number;
  };
  aiMetrics: {
    accuracyRate: string;
    totalAudited: number;
    confirmedCount: number;
    correctedCount: number;
  };
  dateRange: string;
  language?: 'th' | 'en';
}

export default function DashboardKpiGrid({
  stats,
  aiMetrics,
  dateRange,
  language = 'th',
}: DashboardKpiGridProps) {
  const hasUrgent = stats.highPriority > 0;
  const hasPending = stats.pendingTriage > 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* 1. Total Volume */}
      <Link
        href={`/chats?timeframe=${dateRange}`}
        className="group relative rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md p-4 transition-all duration-200 hover:border-[#1a73e8]/40 dark:hover:border-[#8ab4f8]/40 hover:shadow-md hover:-translate-y-0.5 shadow-xs block"
      >
        <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
          <span className="text-[11px] font-mono uppercase tracking-wider font-medium">
            {language === 'th' ? 'ปริมาณเคสรวม' : 'Total Volume'}
          </span>
          <MessageSquare size={13} className="text-neutral-400 group-hover:text-[#1a73e8] dark:group-hover:text-[#8ab4f8] transition-colors" />
        </div>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-semibold font-mono tracking-tight text-neutral-900 dark:text-neutral-100 tabular-nums">
            {stats.totalChats.toLocaleString()}
          </div>
          <ArrowUpRight size={13} className="text-neutral-300 dark:text-neutral-700 group-hover:text-[#1a73e8] dark:group-hover:text-[#8ab4f8] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </div>
        <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-2">
          {language === 'th' ? 'รวมทุกช่องทางที่เชื่อมต่อ' : 'All connected channels'}
        </p>
      </Link>

      {/* 2. Pending Triage Queue */}
      <Link
        href={`/chats?status=pending&timeframe=${dateRange}`}
        className={`group relative rounded-xl border p-4 transition-all duration-200 backdrop-blur-md shadow-xs block hover:shadow-md hover:-translate-y-0.5 ${
          hasPending
            ? 'border-amber-500/30 bg-amber-500/[0.02] dark:bg-amber-500/[0.04] hover:border-amber-500/60'
            : 'border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/70 hover:border-amber-500/40 dark:hover:border-amber-500/40'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className={`text-[11px] font-mono uppercase tracking-wider font-medium ${
            hasPending ? 'text-amber-600 dark:text-amber-400' : 'text-neutral-500 dark:text-neutral-400'
          }`}>
            {language === 'th' ? 'รอการคัดแยก' : 'Pending Triage'}
          </span>
          <Clock size={13} className={hasPending ? 'text-amber-500' : 'text-neutral-400'} />
        </div>
        <div className="flex items-baseline justify-between">
          <div className={`text-2xl font-semibold font-mono tracking-tight tabular-nums ${
            hasPending ? 'text-amber-600 dark:text-amber-400' : 'text-neutral-900 dark:text-neutral-100'
          }`}>
            {stats.pendingTriage}
          </div>
          <ArrowUpRight size={13} className="text-neutral-300 dark:text-neutral-700 group-hover:text-amber-500 dark:group-hover:text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </div>
        <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-2">
          {language === 'th' ? 'เคสรอเจ้าหน้าที่ยืนยัน' : 'Awaiting human review'}
        </p>
      </Link>

      {/* 3. Urgent / Critical Escalations */}
      <Link
        href={`/chats?priority=urgent&timeframe=${dateRange}`}
        className={`group relative rounded-xl border p-4 transition-all duration-200 backdrop-blur-md shadow-xs block hover:shadow-md hover:-translate-y-0.5 ${
          hasUrgent
            ? 'border-rose-500/40 bg-rose-500/[0.04] dark:bg-rose-500/[0.06] hover:border-rose-500/70'
            : 'border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/70 hover:border-rose-500/40 dark:hover:border-rose-500/40'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            {hasUrgent && (
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-60"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
              </span>
            )}
            <span className={`text-[11px] font-mono uppercase tracking-wider font-medium ${
              hasUrgent ? 'text-rose-600 dark:text-rose-400' : 'text-neutral-500 dark:text-neutral-400'
            }`}>
              {language === 'th' ? 'เคสด่วนวิกฤต' : 'Critical SLA'}
            </span>
          </div>
          <AlertTriangle size={13} className={hasUrgent ? 'text-rose-500' : 'text-neutral-400'} />
        </div>
        <div className="flex items-baseline justify-between">
          <div className={`text-2xl font-semibold font-mono tracking-tight tabular-nums ${
            hasUrgent ? 'text-rose-600 dark:text-rose-400' : 'text-neutral-900 dark:text-neutral-100'
          }`}>
            {stats.highPriority}
          </div>
          <ArrowUpRight size={13} className="text-neutral-300 dark:text-neutral-700 group-hover:text-rose-500 dark:group-hover:text-rose-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </div>
        <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-2">
          {hasUrgent
            ? (language === 'th' ? 'ต้องการตอบกลับทันที (<5m)' : 'Immediate SLA response')
            : (language === 'th' ? 'สถานะปกติ ไม่มีค้าง SLA' : 'SLA conditions nominal')}
        </p>
      </Link>

      {/* 4. Model Accuracy Rate */}
      <div className="relative rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md p-4 shadow-xs transition-all duration-200 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 hover:shadow-md hover:-translate-y-0.5">
        <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
          <span className="text-[11px] font-mono uppercase tracking-wider font-medium">
            {language === 'th' ? 'ความแม่นยำ AI' : 'Model Accuracy'}
          </span>
          <Sparkles size={13} className="text-neutral-400" />
        </div>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-semibold font-mono tracking-tight text-neutral-900 dark:text-neutral-100 tabular-nums">
            {aiMetrics.accuracyRate}%
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
            Nominal
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-neutral-400 dark:text-neutral-500 mt-2">
          <span>{language === 'th' ? `ตรวจแล้ว ${aiMetrics.totalAudited} เคส` : `Audited ${aiMetrics.totalAudited}`}</span>
          <span className="font-mono text-neutral-600 dark:text-neutral-400">✓ {aiMetrics.confirmedCount}</span>
        </div>
      </div>
    </div>
  );
}
