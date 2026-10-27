import React, { useState, useMemo, useEffect } from 'react';
import { RefreshCw, MessageSquare, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import ChatTableRow from './ChatTableRow';
import { getCategoryLabel, getBaseCatId } from '@/lib/categories';
import { getChatAuditState } from '@/lib/chatFilters';
import SortHeader from '@/components/ui/SortHeader';

export interface ChatTableProps {
  chats: any[];
  loading: boolean;
  categories: any[];
  activeWindows: any[];
  onSelectChat: (chat: any) => void;
  onHoverImg: (imgUrl: string | null) => void;
  onQuickApprove?: (chat: any) => Promise<void> | void;
  onQuickCategoryChange?: (chat: any, newCatId: string) => Promise<void> | void;
  dateFilter?: string;
  onDateChange?: (val: string) => void;
  language?: 'th' | 'en';
}

type ChatSortColumn = 'priority' | 'customer' | 'summary' | 'category' | 'audit' | 'time';

const priorityWeight = (p: string) => {
  const norm = (p || '').toLowerCase();
  if (norm.includes('urgent') || norm.includes('ด่วนมาก') || norm.includes('critical')) return 4;
  if (norm.includes('high') || norm.includes('สูง')) return 3;
  if (norm.includes('med') || norm.includes('กลาง')) return 2;
  if (norm.includes('low') || norm.includes('ต่ำ')) return 1;
  return 0;
};

const auditWeight = (c: any) => {
  const st = getChatAuditState(c);
  if (st === 'unverified') return 3; // Unverified first when sorting
  if (st === 'corrected') return 2;
  return 1;
};

export default function ChatTable({
  chats,
  loading,
  categories,
  activeWindows,
  onSelectChat,
  onHoverImg,
  onQuickApprove,
  onQuickCategoryChange,
  dateFilter,
  onDateChange,
  language = 'th',
}: ChatTableProps) {
  const [sortColumn, setSortColumn] = useState<ChatSortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (col: ChatSortColumn) => {
    if (sortColumn !== col) {
      setSortColumn(col);
      setSortDirection('desc');
    } else if (sortDirection === 'desc') {
      setSortDirection('asc');
    } else {
      setSortColumn(null);
      setSortDirection('desc');
    }
  };

  const sortedChats = useMemo(() => {
    if (!sortColumn) return chats;
    return [...chats].sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      if (sortColumn === 'priority') {
        valA = priorityWeight(a.priority);
        valB = priorityWeight(b.priority);
      } else if (sortColumn === 'customer') {
        valA = (a.customer_name || a.customer_id || a.id || '').toLowerCase();
        valB = (b.customer_name || b.customer_id || b.id || '').toLowerCase();
      } else if (sortColumn === 'summary') {
        valA = (a.summary || '').toLowerCase();
        valB = (b.summary || '').toLowerCase();
      } else if (sortColumn === 'category') {
        const catA = categories.find(
          (c) => c.id === a.category_id || getBaseCatId(c.id) === getBaseCatId(a.category_id)
        );
        const catB = categories.find(
          (c) => c.id === b.category_id || getBaseCatId(c.id) === getBaseCatId(b.category_id)
        );
        valA = getCategoryLabel(catA || a.category_id, language).toLowerCase();
        valB = getCategoryLabel(catB || b.category_id, language).toLowerCase();
      } else if (sortColumn === 'audit') {
        valA = auditWeight(a);
        valB = auditWeight(b);
      } else if (sortColumn === 'time') {
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
  }, [chats, sortColumn, sortDirection, categories, language]);

  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState(1);

  // Restore saved page size preference from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chats_page_size');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && (parsed > 0 || parsed === -1)) {
          setPageSize(parsed === 60 ? 50 : parsed);
        }
      }
    }
  }, []);

  // Reset to page 1 whenever chats or pageSize change
  useEffect(() => {
    setCurrentPage(1);
  }, [chats, pageSize]);

  const isAll = pageSize === -1;
  const totalPages = isAll ? 1 : Math.ceil(sortedChats.length / pageSize) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = isAll ? 0 : (safeCurrentPage - 1) * pageSize;
  const paginatedChats = isAll ? sortedChats : sortedChats.slice(startIndex, startIndex + pageSize);

  const fromRecord = sortedChats.length > 0 ? (isAll ? 1 : startIndex + 1) : 0;
  const toRecord = isAll ? sortedChats.length : Math.min(startIndex + pageSize, sortedChats.length);

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
    if (typeof window !== 'undefined') {
      localStorage.setItem('chats_page_size', String(newSize));
    }
  };

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

  if (loading) {
    return (
      <div className="rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md shadow-xs p-24 flex flex-col items-center justify-center gap-2.5 text-neutral-400 font-mono text-xs">
        <RefreshCw size={18} className="animate-spin text-neutral-400 dark:text-neutral-600" />
        <span>{language === 'th' ? 'กำลังโหลดรายการแชต...' : 'Loading triage queue...'}</span>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md shadow-xs p-16 text-center text-neutral-400 text-xs flex flex-col items-center justify-center gap-3">
        <MessageSquare size={28} className="text-neutral-300 dark:text-neutral-700" />
        <div className="flex flex-col items-center gap-1">
          <span className="font-semibold text-neutral-700 dark:text-neutral-300 text-sm">
            {language === 'th' ? 'ไม่พบรายการแชตตามตัวกรองที่เลือก' : 'No chats matching active filter criteria'}
          </span>
          {dateFilter === 'today' && (
            <span className="text-neutral-400 dark:text-neutral-500 text-xs">
              {language === 'th' ? 'วันนี้ยังไม่มีแชตใหม่เข้ามาในระบบ' : 'No new chats recorded for today yet'}
            </span>
          )}
        </div>
        {dateFilter === 'today' && onDateChange && (
          <button
            type="button"
            onClick={() => onDateChange('30days')}
            className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-medium transition-colors shadow-xs cursor-pointer select-none"
          >
            <span>{language === 'th' ? '📅 สลับดูข้อมูลย้อนหลัง 30 วันล่าสุด' : '📅 View Past 30 Days'}</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-neutral-50/70 dark:bg-neutral-900/60 border-b border-neutral-200/80 dark:border-neutral-800/80">
              <th className="pl-3.5 pr-3 py-3 whitespace-nowrap w-[115px]">
                <SortHeader
                  label={language === 'th' ? 'ความด่วน & เวลา' : 'Priority & Time'}
                  active={sortColumn === 'priority'}
                  direction={sortDirection}
                  onSort={() => handleSort('priority')}
                />
              </th>
              <th className="px-3 py-3 whitespace-nowrap w-[195px]">
                <SortHeader
                  label={language === 'th' ? 'ลูกค้า & รหัสแชต' : 'Customer & ID'}
                  active={sortColumn === 'customer'}
                  direction={sortDirection}
                  onSort={() => handleSort('customer')}
                />
              </th>
              <th className="px-3 py-3 max-w-[460px]">
                <SortHeader
                  label={language === 'th' ? 'สรุปประเด็น AI & รูปแนบ' : 'AI Summary & Media'}
                  active={sortColumn === 'summary'}
                  direction={sortDirection}
                  onSort={() => handleSort('summary')}
                />
              </th>
              <th className="px-3 py-3 whitespace-nowrap w-[190px]">
                <SortHeader
                  label={language === 'th' ? 'หมวดหมู่' : 'Category'}
                  active={sortColumn === 'category'}
                  direction={sortDirection}
                  onSort={() => handleSort('category')}
                />
              </th>
              <th className="px-3 py-3 whitespace-nowrap text-right w-[150px]">
                <SortHeader
                  label={language === 'th' ? 'การคัดแยกเคส' : 'Triage Action'}
                  active={sortColumn === 'audit'}
                  direction={sortDirection}
                  onSort={() => handleSort('audit')}
                  align="right"
                />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 text-neutral-700 dark:text-neutral-300">
            {paginatedChats.map((chat) => (
              <ChatTableRow
                key={chat.id}
                chat={chat}
                categories={categories}
                isSelected={activeWindows.some((w) => w.id === chat.id)}
                onSelectChat={onSelectChat}
                onHoverImg={onHoverImg}
                onQuickApprove={onQuickApprove}
                onQuickCategoryChange={onQuickCategoryChange}
                language={language}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {sortedChats.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/50 select-none">
          {/* Record Count & Page Size Selector */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-neutral-600 dark:text-neutral-400 font-medium">
            <span className="font-mono">
              {isAll
                ? language === 'th'
                  ? `แสดงทั้งหมด ${sortedChats.length.toLocaleString()} รายการ`
                  : `Showing all ${sortedChats.length.toLocaleString()} items`
                : language === 'th'
                ? `แสดง ${fromRecord.toLocaleString()} - ${toRecord.toLocaleString()} จากทั้งหมด ${sortedChats.length.toLocaleString()} รายการ`
                : `Showing ${fromRecord.toLocaleString()} - ${toRecord.toLocaleString()} of ${sortedChats.length.toLocaleString()} items`}
            </span>

            <span className="text-neutral-300 dark:text-neutral-700 hidden sm:inline">•</span>

            <div className="flex items-center gap-1.5 font-sans">
              <span className="text-neutral-500 dark:text-neutral-400 text-xs">
                {language === 'th' ? 'แสดงหน้าละ:' : 'Per page:'}
              </span>
              <div className="relative inline-flex items-center">
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="appearance-none bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200/90 dark:border-neutral-700 rounded-lg pl-2.5 pr-6 py-1 text-xs font-mono font-medium text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-[#1a73e8] focus:border-[#1a73e8] dark:focus:border-blue-500 cursor-pointer shadow-2xs transition-colors"
                >
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={-1}>{language === 'th' ? 'ทั้งหมด (All)' : 'All'}</option>
                </select>
                <ChevronDown
                  size={12}
                  className="pointer-events-none absolute right-2 text-neutral-400 dark:text-neutral-500"
                />
              </div>
              <span className="text-neutral-500 dark:text-neutral-400 text-xs">
                {language === 'th' ? 'รายการ' : 'rows'}
              </span>
            </div>
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
                    <span
                      key={`dots-${idx}`}
                      className="h-8 min-w-[24px] px-1 text-xs text-neutral-400 dark:text-neutral-500 flex items-center justify-center font-mono"
                    >
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
    </div>
  );
}
