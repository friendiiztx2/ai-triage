'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { RefreshCw, ClipboardList, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import SortHeader from '@/components/ui/SortHeader';

interface AuditLogTableProps {
  logs: any[];
  loading: boolean;
  language: string;
  emptyMessage?: string;
}

type AuditSortColumn = 'actor' | 'action' | 'detail' | 'timestamp';

export default function AuditLogTable({
  logs,
  loading,
  language,
  emptyMessage,
}: AuditLogTableProps) {
  const { t } = useLanguage();
  const [sortColumn, setSortColumn] = useState<AuditSortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [logs]);

  const handleSort = (col: AuditSortColumn) => {
    if (sortColumn !== col) {
      setSortColumn(col);
      setSortDirection('asc');
    } else if (sortDirection === 'asc') {
      setSortDirection('desc');
    } else {
      setSortColumn(null);
      setSortDirection('asc');
    }
  };

  const sortedLogs = useMemo(() => {
    if (!sortColumn) return logs;
    return [...logs].sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      if (sortColumn === 'actor') {
        valA = (a.admin_name || a.admin_email || '').toLowerCase();
        valB = (b.admin_name || b.admin_email || '').toLowerCase();
      } else if (sortColumn === 'action') {
        valA = (a.action || '').toLowerCase();
        valB = (b.action || '').toLowerCase();
      } else if (sortColumn === 'detail') {
        valA = (a.details || '').toLowerCase();
        valB = (b.details || '').toLowerCase();
      } else if (sortColumn === 'timestamp') {
        valA = new Date(a.created_at || 0).getTime();
        valB = new Date(b.created_at || 0).getTime();
      }

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
      return sortDirection === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [logs, sortColumn, sortDirection]);

  const totalPages = Math.ceil(sortedLogs.length / pageSize) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedLogs = sortedLogs.slice(startIndex, startIndex + pageSize);

  const fromRecord = sortedLogs.length > 0 ? startIndex + 1 : 0;
  const toRecord = Math.min(startIndex + pageSize, sortedLogs.length);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (safeCurrentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (safeCurrentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30';
      case 'UPDATE':
        return 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30';
      case 'DELETE':
        return 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30';
      case 'LOGIN':
        return 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30';
      default:
        return 'bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700';
    }
  };

  return (
    <div className="backdrop-blur-xl bg-white/70 dark:bg-neutral-900/70 border border-neutral-200/80 dark:border-neutral-800/80 rounded-[22px] shadow-xs overflow-hidden">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-3 text-neutral-400 dark:text-neutral-500">
          <RefreshCw size={28} className="animate-spin text-sky-500" />
          <span className="text-xs font-semibold">
            {language === 'th' ? 'กำลังดึงข้อมูลบันทึกกิจกรรม...' : 'Retrieving audit logs...'}
          </span>
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 gap-3 text-neutral-400 dark:text-neutral-500 text-center">
          <ClipboardList size={36} className="text-neutral-300 dark:text-neutral-700" />
          <span className="text-xs font-medium">{emptyMessage || t('auditNoData')}</span>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs text-neutral-700 dark:text-neutral-200">
            <thead>
              <tr className="border-b border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/70 dark:bg-neutral-900/60">
                <th className="px-6 py-3.5">
                  <SortHeader
                    label={language === 'th' ? 'ผู้ดำเนินการ (Admin)' : 'Actor (Admin)'}
                    active={sortColumn === 'actor'}
                    direction={sortDirection}
                    onSort={() => handleSort('actor')}
                  />
                </th>
                <th className="px-6 py-3.5">
                  <SortHeader
                    label={language === 'th' ? 'ประเภทกิจกรรม' : 'Action Type'}
                    active={sortColumn === 'action'}
                    direction={sortDirection}
                    onSort={() => handleSort('action')}
                  />
                </th>
                <th className="px-6 py-3.5">
                  <SortHeader
                    label={language === 'th' ? 'ประวัติการดำเนินการ' : 'Activity Detail'}
                    active={sortColumn === 'detail'}
                    direction={sortDirection}
                    onSort={() => handleSort('detail')}
                  />
                </th>
                <th className="px-6 py-3.5">
                  <SortHeader
                    label={language === 'th' ? 'เวลาดำเนินการ' : 'Timestamp'}
                    active={sortColumn === 'timestamp'}
                    direction={sortDirection}
                    onSort={() => handleSort('timestamp')}
                  />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
              {paginatedLogs.map((log) => (
                <tr 
                  key={log.id} 
                  className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition-[background-color] duration-150"
                >
                  {/* Admin Name & Email */}
                  <td className="px-6 py-4">
                    <div>
                      <span className="block font-bold text-neutral-800 dark:text-neutral-100 text-[11px]">
                        {log.admin_name}
                      </span>
                      <span className="block text-[9.5px] text-neutral-400 dark:text-neutral-500 font-medium">
                        {log.admin_email}
                      </span>
                    </div>
                  </td>

                  {/* Action Badge */}
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-extrabold tracking-wide uppercase select-none ${getActionBadge(log.action)}`}>
                      {log.action}
                    </span>
                  </td>

                  {/* Details */}
                  <td className="px-6 py-4 font-semibold text-neutral-700 dark:text-neutral-300">
                    {log.details}
                  </td>

                  {/* Timestamp */}
                  <td className="px-6 py-4 text-neutral-400 dark:text-neutral-500 font-mono font-medium whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('th-TH')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {sortedLogs.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3.5 border-t border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/50 select-none">
            <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
              {language === 'th'
                ? `แสดง ${fromRecord.toLocaleString()} - ${toRecord.toLocaleString()} จาก ${sortedLogs.length.toLocaleString()} รายการ`
                : `Showing ${fromRecord.toLocaleString()} - ${toRecord.toLocaleString()} of ${sortedLogs.length.toLocaleString()} entries`}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage === 1}
                  className="h-8 px-2.5 rounded-lg border border-neutral-200/80 dark:border-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
                  title={language === 'th' ? 'หน้าก่อนหน้า' : 'Previous page'}
                >
                  <ChevronLeft size={14} />
                  <span className="hidden sm:inline">{language === 'th' ? 'ก่อนหน้า' : 'Previous'}</span>
                </button>

                <div className="flex items-center gap-1">
                  {getPageNumbers().map((p, idx) =>
                    typeof p === 'number' ? (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setCurrentPage(p)}
                        className={`h-8 min-w-[32px] px-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          safeCurrentPage === p
                            ? 'bg-[#1a73e8] text-white font-bold shadow-xs'
                            : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        {p}
                      </button>
                    ) : (
                      <span key={`dots-${idx}`} className="h-8 min-w-[24px] px-1 text-xs text-neutral-400 dark:text-neutral-500 flex items-center justify-center">
                        ...
                      </span>
                    )
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className="h-8 px-2.5 rounded-lg border border-neutral-200/80 dark:border-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
                  title={language === 'th' ? 'หน้าถัดไป' : 'Next page'}
                >
                  <span className="hidden sm:inline">{language === 'th' ? 'ถัดไป' : 'Next'}</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </>
    )}
    </div>
  );
}
