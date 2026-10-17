import React from 'react';
import Link from 'next/link';
import { Activity, ArrowUpRight, Cpu, ShieldAlert, CheckCircle2 } from 'lucide-react';

export interface DashboardInsightBannerProps {
  highPriority: number;
  highOnlyCount: number;
  totalChats: number;
  pendingTriage: number;
  topCategoryName?: string;
  topCategoryValue?: number;
}

export default function DashboardInsightBanner({
  highPriority,
  highOnlyCount,
  totalChats,
  pendingTriage,
  topCategoryName = 'ทั่วไป',
  topCategoryValue = 0,
}: DashboardInsightBannerProps) {
  const hasUrgent = highPriority > 0;

  return (
    <div className={`rounded-xl border transition-all backdrop-blur-md px-4 py-3 sm:px-5 sm:py-3.5 shadow-xs ${
      hasUrgent
        ? 'bg-rose-500/[0.03] dark:bg-rose-500/[0.05] border-rose-500/30 dark:border-rose-500/30'
        : 'bg-white/70 dark:bg-neutral-900/70 border-neutral-200/80 dark:border-neutral-800/80'
    }`}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
        {/* Left: Engine & Health Telemetry */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 pr-3 border-r border-neutral-200 dark:border-neutral-800">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${
                hasUrgent ? 'bg-rose-400' : 'bg-emerald-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                hasUrgent ? 'bg-rose-500' : 'bg-emerald-500'
              }`}></span>
            </span>
            <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
              {hasUrgent ? 'Attention Required' : 'Pipeline Healthy'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 font-mono text-[11px]">
            <Cpu size={13} className="text-neutral-400" />
            <span>Sift AI v2.4</span>
            <span className="text-neutral-300 dark:text-neutral-700">•</span>
            <span>Gemini 1.5 Flash</span>
          </div>
        </div>

        {/* Center / Right: Executive Summary & Action */}
        <div className="flex items-center justify-between lg:justify-end gap-4 flex-1">
          <div className="text-neutral-700 dark:text-neutral-300 truncate">
            {hasUrgent ? (
              <span className="flex items-center gap-1.5 font-medium text-rose-600 dark:text-rose-400">
                <ShieldAlert size={14} className="shrink-0" />
                <span>
                  {highPriority} เคสด่วนที่สุด
                  {highOnlyCount > 0 ? ` (+${highOnlyCount} เคสด่วนสูง)` : ''} ต้องเข้าจัดการทันที
                </span>
              </span>
            ) : totalChats > 0 && topCategoryValue > 0 ? (
              <span className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                <span>
                  คัดแยกแล้ว <strong className="font-semibold text-neutral-900 dark:text-neutral-100">{totalChats}</strong> เคส — หมวดหมู่นำ: <strong className="font-semibold text-neutral-900 dark:text-neutral-100">{topCategoryName}</strong> ({topCategoryValue} เคส)
                </span>
              </span>
            ) : (
              <span className="text-neutral-500 dark:text-neutral-400">
                ระบบพร้อมทำงาน 24/7 ไม่มีเคสคั่งค้างในคิว
              </span>
            )}
          </div>

          {hasUrgent ? (
            <Link
              href="/chats?priority=urgent"
              className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-[11px] font-semibold font-mono uppercase bg-rose-500 text-white hover:bg-rose-600 transition-colors shadow-xs shrink-0 cursor-pointer"
            >
              <span>Queue</span>
              <ArrowUpRight size={12} />
            </Link>
          ) : pendingTriage > 0 ? (
            <Link
              href="/chats?status=pending"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium font-mono text-neutral-700 dark:text-neutral-300 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition-colors shrink-0 cursor-pointer"
            >
              <span>ตรวจทาน {pendingTriage} เคส</span>
              <ArrowUpRight size={11} />
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
