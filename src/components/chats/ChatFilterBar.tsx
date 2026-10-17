import React from 'react';
import { Search } from 'lucide-react';
import { getCategoryLabel, getBaseCatId } from '@/lib/categories';
import ChatTimeframeFilter from './filters/ChatTimeframeFilter';
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
  dateFilter: string;
  onDateChange: (val: string) => void;
  startDate: string;
  onStartDateChange: (val: string) => void;
  endDate: string;
  onEndDateChange: (val: string) => void;
  categories: any[];
  allAvailableTags: any[];
  pendingCount: number;
  completedCount: number;
  urgentCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  onClearFilters: () => void;
  language?: 'th' | 'en';
}

export default function ChatFilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
  categoryFilter,
  onCategoryChange,
  tagFilter,
  onTagChange,
  auditFilter,
  onAuditChange,
  dateFilter,
  onDateChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  categories,
  allAvailableTags,
  pendingCount,
  completedCount,
  urgentCount,
  highCount,
  mediumCount,
  lowCount,
  onClearFilters,
  language = 'th',
}: ChatFilterBarProps) {
  const hasActiveFilters =
    searchQuery ||
    statusFilter !== 'all' ||
    priorityFilter !== 'all' ||
    categoryFilter !== 'all' ||
    tagFilter !== 'all' ||
    dateFilter !== 'today';

  return (
    <div className="relative z-30 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/70 p-3 sm:p-4 shadow-xs backdrop-blur-md flex flex-col gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 items-center">
        {/* Search */}
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" size={13} />
          <input
            type="text"
            placeholder={
              language === 'th' ? 'ค้นหาแชต, ลูกค้า, สรุป...' : 'Search chats, customer...'
            }
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors shadow-xs"
          />
        </div>

        {/* Status */}
        <div className="w-full">
          <SelectDropdown
            value={statusFilter}
            onChange={onStatusChange}
            options={[
              { value: 'all', label: language === 'th' ? 'สถานะ: ทั้งหมด' : 'Status: All' },
              {
                value: 'completed',
                label: `${language === 'th' ? 'วิเคราะห์แล้ว' : 'Analyzed'} (${completedCount})`,
              },
              {
                value: 'pending',
                label: `${language === 'th' ? 'รอวิเคราะห์' : 'Pending'} (${pendingCount})`,
              },
            ]}
          />
        </div>

        {/* Priority */}
        <div className="w-full">
          <SelectDropdown
            value={priorityFilter}
            onChange={onPriorityChange}
            options={[
              { value: 'all', label: language === 'th' ? 'ความด่วน: ทั้งหมด' : 'Priority: All' },
              { value: 'urgent', label: `Urgent (${urgentCount})` },
              { value: 'high', label: `High (${highCount})` },
              { value: 'medium', label: `Medium (${mediumCount})` },
              { value: 'low', label: `Low (${lowCount})` },
            ]}
          />
        </div>

        {/* Category */}
        <div className="w-full">
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

        {/* Tag Filter */}
        <div className="w-full">
          <SelectDropdown
            value={tagFilter}
            onChange={onTagChange}
            options={[
              { value: 'all', label: language === 'th' ? 'แท็ก: ทั้งหมด' : 'Tags: All' },
              {
                value: '#รูปภาพแนบ',
                label: language === 'th' ? '📎 รูปภาพแนบมากับข้อความ (ดูรูป)' : '📎 Images with Text',
              },
              {
                value: '#รูปภาพล้วน',
                label: language === 'th' ? '📷 รูปภาพล้วน (ไม่มีข้อความ)' : '📷 Image Only',
              },
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

        {/* Audit Filter */}
        <div className="w-full">
          <SelectDropdown
            value={auditFilter}
            onChange={onAuditChange}
            options={[
              { value: 'all', label: language === 'th' ? 'ผลตรวจ AI: ทั้งหมด' : 'AI Audit: All' },
              { value: 'confirmed', label: language === 'th' ? 'ตรงกับ AI' : 'Confirmed' },
              { value: 'corrected', label: language === 'th' ? 'แก้ไขหมวดหมู่' : 'Corrected' },
            ]}
          />
        </div>
      </div>

      {/* Row 2: Date Timeframe Filter */}
      <ChatTimeframeFilter
        dateFilter={dateFilter}
        onDateChange={onDateChange}
        startDate={startDate}
        onStartDateChange={onStartDateChange}
        endDate={endDate}
        onEndDateChange={onEndDateChange}
        hasActiveFilters={Boolean(hasActiveFilters)}
        onClearFilters={onClearFilters}
        language={language}
      />
    </div>
  );
}
