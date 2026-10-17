import React from 'react';
import { ArrowDownLeft, ArrowUpRight, UserPlus, Users } from 'lucide-react';

export interface ReportMetricsGridProps {
  filteredCount: number;
  pendingCount: number;
  completedCount: number;
  urgentCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  depositCount: number;
  withdrawalCount: number;
  newCustomerCount: number;
  returningCustomerCount: number;
  language?: 'th' | 'en';
}

export default function ReportMetricsGrid({
  filteredCount,
  pendingCount,
  completedCount,
  urgentCount,
  highCount,
  mediumCount,
  lowCount,
  depositCount,
  withdrawalCount,
  newCustomerCount,
  returningCustomerCount,
  language = 'th',
}: ReportMetricsGridProps) {
  return (
    <div className="rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/70 p-4 shadow-xs backdrop-blur-md space-y-4">
      {/* Overview Stat Counters */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
            {language === 'th' ? 'สถิติข้อมูลแชตตามตัวกรอง' : 'Export Queue Telemetry'}
          </span>
          <span className="text-[10px] font-mono text-neutral-400">
            {filteredCount.toLocaleString()} {language === 'th' ? 'รายการพร้อมส่งออก' : 'records selected'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <div className="p-2.5 bg-neutral-50/80 dark:bg-neutral-800/50 rounded-lg border border-neutral-200/60 dark:border-neutral-700/50 shadow-xs">
            <span className="text-[10px] text-neutral-400 font-mono block uppercase">{language === 'th' ? 'ทั้งหมด' : 'Total'}</span>
            <span className="text-xl font-semibold font-mono text-neutral-900 dark:text-neutral-100 tabular-nums">{filteredCount}</span>
          </div>

          <div className="p-2.5 bg-amber-500/[0.04] rounded-lg border border-amber-500/20">
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono block uppercase">{language === 'th' ? 'รอคัดแยก' : 'Pending'}</span>
            <span className="text-xl font-semibold font-mono text-amber-600 dark:text-amber-400 tabular-nums">{pendingCount}</span>
          </div>

          <div className="p-2.5 bg-emerald-500/[0.04] rounded-lg border border-emerald-500/20">
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono block uppercase">{language === 'th' ? 'ตรวจแล้ว' : 'Completed'}</span>
            <span className="text-xl font-semibold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">{completedCount}</span>
          </div>

          <div className="p-2.5 bg-rose-500/[0.04] rounded-lg border border-rose-500/20">
            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-mono block uppercase">Urgent SLA</span>
            <span className="text-xl font-semibold font-mono text-rose-600 dark:text-rose-400 tabular-nums">{urgentCount}</span>
          </div>

          <div className="p-2.5 bg-neutral-50/80 dark:bg-neutral-800/50 rounded-lg border border-neutral-200/60 dark:border-neutral-700/50">
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono block uppercase">High Priority</span>
            <span className="text-xl font-semibold font-mono text-neutral-800 dark:text-neutral-200 tabular-nums">{highCount}</span>
          </div>

          <div className="p-2.5 bg-neutral-50/80 dark:bg-neutral-800/50 rounded-lg border border-neutral-200/60 dark:border-neutral-700/50">
            <span className="text-[10px] text-neutral-400 font-mono block uppercase">Normal</span>
            <span className="text-xl font-semibold font-mono text-neutral-700 dark:text-neutral-300 tabular-nums">{mediumCount + lowCount}</span>
          </div>
        </div>
      </div>

      {/* Specialized Business Breakdown (Finance & Marketing Criteria) */}
      <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/60 space-y-2">
        <span className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
          {language === 'th' ? 'การจำแนกตามเป้าหมายธุรกิจ' : 'Domain Intent Breakdown'}
        </span>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="p-2.5 bg-neutral-50/70 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-700/50 rounded-lg flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
              <ArrowDownLeft size={13} className="text-emerald-500" />
              <span>{language === 'th' ? 'ธุรกรรมฝากเงิน' : 'Deposits'}</span>
            </span>
            <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">{depositCount}</span>
          </div>

          <div className="p-2.5 bg-neutral-50/70 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-700/50 rounded-lg flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
              <ArrowUpRight size={13} className="text-amber-500" />
              <span>{language === 'th' ? 'ธุรกรรมถอนเงิน' : 'Withdrawals'}</span>
            </span>
            <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">{withdrawalCount}</span>
          </div>

          <div className="p-2.5 bg-neutral-50/70 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-700/50 rounded-lg flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
              <UserPlus size={13} className="text-sky-500" />
              <span>{language === 'th' ? 'ลูกค้าใหม่' : 'New Leads'}</span>
            </span>
            <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">{newCustomerCount}</span>
          </div>

          <div className="p-2.5 bg-neutral-50/70 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-700/50 rounded-lg flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
              <Users size={13} className="text-violet-500" />
              <span>{language === 'th' ? 'ลูกค้าเดิมทักซ้ำ' : 'Returning'}</span>
            </span>
            <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">{returningCustomerCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
