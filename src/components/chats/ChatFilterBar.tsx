import React from 'react';
import { Search, X, RotateCcw, Filter, AlertTriangle, Flame, Clock, CheckCircle2, Tag, Layers } from 'lucide-react';
import { getCategoryLabel, getBaseCatId } from '@/lib/categories';
import SelectDropdown from '@/components/ui/SelectDropdown';

export interface ChatFilterBarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  statusFilter?: string;
  onStatusChange?: (val: string) => void;
  priorityFilter?: string;
  onPriorityChange?: (val: string) => void;
  categoryFilter: string;
  onCategoryChange: (val: string) => void;
  tagFilter: string;
  onTagChange: (val: string) => void;
  auditFilter: string;
  onAuditChange: (val: string) => void;
  dateFilter?: string;
  onDateChange?: (val: string) => void;
  startDate?: string;
  onStartDateChange?: (val: string) => void;
  endDate?: string;
  onEndDateChange?: (val: string) => void;
  categories: any[];
  allAvailableTags: any[];
  pendingCount?: number;
  completedCount?: number;
  urgentCount?: number;
  highCount?: number;
  mediumCount?: number;
  lowCount?: number;
  filteredCount?: number;
  totalCount?: number;
  onClearFilters: () => void;
  language?: 'th' | 'en';
  className?: string;
}

export default function ChatFilterBar({
  searchQuery,
  onSearchChange,
  statusFilter = 'all',
  onStatusChange,
  priorityFilter = 'all',
  onPriorityChange,
  categoryFilter,
  onCategoryChange,
  tagFilter,
  onTagChange,
  auditFilter,
  onAuditChange,
  dateFilter = 'today',
  categories,
  allAvailableTags,
  pendingCount = 0,
  completedCount = 0,
  urgentCount = 0,
  highCount = 0,
  filteredCount,
  totalCount,
  onClearFilters,
  language = 'th',
  className = '',
}: ChatFilterBarProps) {
  const hasActiveFilters = Boolean(
    searchQuery ||
    statusFilter !== 'all' ||
    priorityFilter !== 'all' ||
    categoryFilter !== 'all' ||
    tagFilter !== 'all' ||
    auditFilter !== 'all'
  );

  // Helper to find category name
  const getCatName = (catId: string) => {
    const found = categories.find((c) => getBaseCatId(c.id) === catId || c.id === catId);
    if (!found) return catId;
    return language === 'en'
      ? found.name_en || getCategoryLabel(found, 'en')
      : found.name_th || found.name || getCategoryLabel(found, 'th');
  };

  const getPriorityName = (pri: string) => {
    switch (pri) {
      case 'urgent':
        return language === 'th' ? '🚨 ด่วนที่สุด' : '🚨 Urgent';
      case 'high':
        return language === 'th' ? '🔥 ด่วนสูง' : '🔥 High';
      case 'medium':
        return language === 'th' ? '⚡ ปานกลาง' : '⚡ Medium';
      case 'low':
        return language === 'th' ? '⚪ ปกติ' : '⚪ Low';
      default:
        return pri;
    }
  };

  const getStatusName = (st: string) => {
    switch (st) {
      case 'pending':
        return language === 'th' ? '⏳ รอดำเนินการ' : '⏳ Pending';
      case 'completed':
        return language === 'th' ? '✓ ดำเนินการแล้ว' : '✓ Completed';
      default:
        return st;
    }
  };

  const getAuditName = (aud: string) => {
    switch (aud) {
      case 'unverified':
        return language === 'th' ? '⏳ รอตรวจทาน' : '⏳ Pending Review';
      case 'confirmed':
        return language === 'th' ? '✓ ยืนยันตาม AI' : '✓ Confirmed AI';
      case 'corrected':
        return language === 'th' ? '✎ แก้ไขหมวดแล้ว' : '✎ Corrected';
      default:
        return aud;
    }
  };

  return (
    <div className={`p-2.5 space-y-2.5 ${className || 'rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/70 shadow-xs backdrop-blur-md'}`}>
      {/* 1. Filter Control Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search Box */}
        <div className="relative flex-1 min-w-[200px] sm:min-w-[240px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" size={13} />
          <input
            type="text"
            placeholder={
              language === 'th'
                ? 'ค้นหาชื่อลูกค้า, แชตไอดี, หรือสรุปประเด็น AI...'
                : 'Search customer name, chat ID, or AI summary...'
            }
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-neutral-50/70 dark:bg-neutral-800/60 hover:bg-white dark:hover:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 rounded-lg pl-8 pr-7 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:bg-white dark:focus:bg-neutral-900 focus:border-[#1a73e8] dark:focus:border-blue-500 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-0.5 rounded cursor-pointer transition-colors"
              title={language === 'th' ? 'ล้างคำค้นหา' : 'Clear search'}
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Priority Dropdown */}
        {onPriorityChange && (
          <div className="w-36 sm:w-40">
            <SelectDropdown
              value={priorityFilter}
              onChange={onPriorityChange}
              options={[
                { value: 'all', label: language === 'th' ? 'ความเร่งด่วน: ทั้งหมด' : 'Priority: All' },
                { value: 'urgent', label: language === 'th' ? '🚨 ด่วนวิกฤต' : '🚨 Urgent' },
                { value: 'high', label: language === 'th' ? '🔥 ด่วนสูง' : '🔥 High' },
                { value: 'medium', label: language === 'th' ? '⚡ ปานกลาง' : '⚡ Medium' },
                { value: 'low', label: language === 'th' ? '⚪ ปกติ' : '⚪ Low' },
              ]}
            />
          </div>
        )}

        {/* Status Dropdown */}
        {onStatusChange && (
          <div className="w-36 sm:w-40">
            <SelectDropdown
              value={statusFilter}
              onChange={onStatusChange}
              options={[
                { value: 'all', label: language === 'th' ? 'สถานะ: ทั้งหมด' : 'Status: All' },
                { value: 'pending', label: language === 'th' ? '⏳ รอดำเนินการ' : '⏳ Pending' },
                { value: 'completed', label: language === 'th' ? '✓ ดำเนินการแล้ว' : '✓ Completed' },
              ]}
            />
          </div>
        )}

        {/* Category Dropdown */}
        <div className="w-40 sm:w-48">
          <SelectDropdown
            value={categoryFilter}
            onChange={onCategoryChange}
            options={[
              { value: 'all', label: language === 'th' ? 'หมวดหมู่: ทั้งหมด' : 'Category: All' },
              ...categories.map((cat) => {
                const label =
                  language === 'en'
                    ? cat.name_en || getCategoryLabel(cat, 'en')
                    : cat.name_th || cat.name || getCategoryLabel(cat, 'th');
                return {
                  value: getBaseCatId(cat.id),
                  label,
                };
              }),
            ]}
          />
        </div>

        {/* AI Audit & Triage State Dropdown */}
        <div className="w-36 sm:w-42">
          <SelectDropdown
            value={auditFilter}
            onChange={onAuditChange}
            options={[
              { value: 'all', label: language === 'th' ? 'การตรวจทาน: ทั้งหมด' : 'Audit: All' },
              { value: 'unverified', label: language === 'th' ? '⏳ รอตรวจทาน' : '⏳ Pending Review' },
              { value: 'confirmed', label: language === 'th' ? '✓ ยืนยันตาม AI' : '✓ Confirmed AI' },
              { value: 'corrected', label: language === 'th' ? '✎ แก้ไขหมวดแล้ว' : '✎ Corrected' },
            ]}
          />
        </div>

        {/* Tag Dropdown */}
        <div className="w-36 sm:w-40">
          <SelectDropdown
            value={tagFilter}
            onChange={onTagChange}
            options={[
              { value: 'all', label: language === 'th' ? 'แท็ก: ทั้งหมด' : 'Tags: All' },
              ...allAvailableTags
                .filter(
                  (tagObj) =>
                    tagObj.name !== '#รูปภาพ' &&
                    tagObj.name !== '#รูปภาพล้วน' &&
                    tagObj.name !== '#รูปภาพทั้งหมด' &&
                    tagObj.name !== '#รูปภาพแนบ'
                )
                .map((tagObj) => ({
                  value: tagObj.name,
                  label: `${tagObj.name} (${tagObj.desc})`,
                })),
            ]}
          />
        </div>
      </div>

      {/* 2. Active Filter Chips & Live Result Counts */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-neutral-100 dark:border-neutral-800/80 animate-in fade-in duration-150">
          <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500 mr-1 flex items-center gap-1">
            <Filter size={11} />
            <span>{language === 'th' ? 'ตัวกรองที่เลือก:' : 'Active filters:'}</span>
          </span>

          {/* Search Query Chip */}
          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 shadow-2xs">
              <Search size={10} />
              <span className="truncate max-w-[150px]">&ldquo;{searchQuery}&rdquo;</span>
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="hover:text-blue-900 dark:hover:text-white transition cursor-pointer ml-0.5"
              >
                <X size={10} />
              </button>
            </span>
          )}

          {/* Priority Chip */}
          {priorityFilter !== 'all' && onPriorityChange && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 shadow-2xs">
              <span>{getPriorityName(priorityFilter)}</span>
              <button
                type="button"
                onClick={() => onPriorityChange('all')}
                className="hover:text-amber-900 dark:hover:text-white transition cursor-pointer ml-0.5"
              >
                <X size={10} />
              </button>
            </span>
          )}

          {/* Status Chip */}
          {statusFilter !== 'all' && onStatusChange && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/60 shadow-2xs">
              <span>{getStatusName(statusFilter)}</span>
              <button
                type="button"
                onClick={() => onStatusChange('all')}
                className="hover:text-purple-900 dark:hover:text-white transition cursor-pointer ml-0.5"
              >
                <X size={10} />
              </button>
            </span>
          )}

          {/* Category Chip */}
          {categoryFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/60 shadow-2xs">
              <Layers size={10} />
              <span>{getCatName(categoryFilter)}</span>
              <button
                type="button"
                onClick={() => onCategoryChange('all')}
                className="hover:text-indigo-900 dark:hover:text-white transition cursor-pointer ml-0.5"
              >
                <X size={10} />
              </button>
            </span>
          )}

          {/* Audit Chip */}
          {auditFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 shadow-2xs">
              <span>{getAuditName(auditFilter)}</span>
              <button
                type="button"
                onClick={() => onAuditChange('all')}
                className="hover:text-emerald-900 dark:hover:text-white transition cursor-pointer ml-0.5"
              >
                <X size={10} />
              </button>
            </span>
          )}

          {/* Tag Chip */}
          {tagFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200/80 dark:border-neutral-700 shadow-2xs">
              <Tag size={10} />
              <span>{tagFilter}</span>
              <button
                type="button"
                onClick={() => onTagChange('all')}
                className="hover:text-neutral-900 dark:hover:text-white transition cursor-pointer ml-0.5"
              >
                <X size={10} />
              </button>
            </span>
          )}

          {/* Clear All Filters Button */}
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] text-[#d93025] hover:text-[#b31412] bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 transition-all cursor-pointer shadow-2xs ml-auto"
            title={language === 'th' ? 'ล้างตัวกรองทั้งหมด' : 'Clear all filters'}
          >
            <RotateCcw size={10} />
            <span>{language === 'th' ? 'ล้างตัวกรองทั้งหมด' : 'Clear all'}</span>
          </button>

          {/* Result Count Badge */}
          {filteredCount !== undefined && totalCount !== undefined && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200/60 dark:border-neutral-700/60">
              {filteredCount.toLocaleString()} / {totalCount.toLocaleString()}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
