import React from 'react';
import { Search, X, RotateCcw } from 'lucide-react';
import { getCategoryLabel, getBaseCatId } from '@/lib/categories';
import SelectDropdown from '@/components/ui/SelectDropdown';

export interface ChatFilterBarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusChange: (val: string) => void;
  priorityFilter: string;
  onPriorityChange: (val: string) => void;
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
  pendingCount: number;
  completedCount: number;
  urgentCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  filteredCount?: number;
  totalCount?: number;
  onClearFilters: () => void;
  language?: 'th' | 'en';
  className?: string;
}

export default function ChatFilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  priorityFilter,
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
  urgentCount,
  highCount,
  mediumCount,
  lowCount,
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
      auditFilter !== 'all' ||
      dateFilter !== 'today'
  );

  return (
    <div
      className={`relative z-30 p-2 sm:p-2.5 flex flex-wrap items-center gap-2 ${
        className ||
        'rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/70 shadow-xs backdrop-blur-md'
      }`}
    >
      {/* 1. Spacious Search Box */}
      <div className="relative flex-1 min-w-[200px] sm:min-w-[260px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" size={13} />
        <input
          type="text"
          placeholder={
            language === 'th'
              ? 'ค้นหาชื่อลูกค้า, รหัสแชต, หรือคำในสรุป AI...'
              : 'Search customer, session ID, or AI summary...'
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

      {/* 2. Category Dropdown */}
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

      {/* 3. Priority Dropdown */}
      <div className="w-36 sm:w-40">
        <SelectDropdown
          value={priorityFilter}
          onChange={onPriorityChange}
          options={[
            { value: 'all', label: language === 'th' ? 'ความด่วน: ทั้งหมด' : 'Priority: All' },
            { value: 'urgent', label: `${language === 'th' ? 'ด่วนวิกฤต' : 'Urgent'} (${urgentCount})` },
            { value: 'high', label: `${language === 'th' ? 'ด่วนสูง' : 'High'} (${highCount})` },
            { value: 'medium', label: `${language === 'th' ? 'ปานกลาง' : 'Medium'} (${mediumCount})` },
            { value: 'low', label: `${language === 'th' ? 'ทั่วไป' : 'Low'} (${lowCount})` },
          ]}
        />
      </div>

      {/* 4. AI Audit Dropdown */}
      <div className="w-36 sm:w-40">
        <SelectDropdown
          value={auditFilter}
          onChange={onAuditChange}
          options={[
            { value: 'all', label: language === 'th' ? 'การตรวจทาน: ทั้งหมด' : 'Review: All' },
            { value: 'unverified', label: language === 'th' ? '⏳ รอตรวจทาน' : 'Needs Review' },
            { value: 'confirmed', label: language === 'th' ? '✓ ยืนยันตาม AI' : 'Confirmed AI' },
            { value: 'corrected', label: language === 'th' ? '✎ แก้ไขหมวดแล้ว' : 'Corrected' },
          ]}
        />
      </div>

      {/* 5. Tag Dropdown */}
      <div className="w-32 sm:w-36">
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

      {/* 6. Active Result Count Badge & Reset Filters Button */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 shrink-0 animate-in fade-in duration-150">
          {filteredCount !== undefined && totalCount !== undefined && (
            <span className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs">
              {language === 'th'
                ? `${filteredCount.toLocaleString()} / ${totalCount.toLocaleString()} รายการ`
                : `${filteredCount.toLocaleString()} / ${totalCount.toLocaleString()}`}
            </span>
          )}
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono text-[#d93025] hover:text-[#b31412] bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 transition-all cursor-pointer shadow-2xs select-none"
            title={language === 'th' ? 'ล้างตัวกรองทั้งหมดกลับเป็นค่าเริ่มต้น' : 'Reset all active filters'}
          >
            <RotateCcw size={11} />
            <span>{language === 'th' ? 'ล้างค่า' : 'Reset'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
