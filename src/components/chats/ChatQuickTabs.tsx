import React from 'react';
import { Inbox, AlertTriangle, Image as ImageIcon, Calendar } from 'lucide-react';
import DatePicker from '@/components/ui/DatePicker';

export interface ChatQuickTabsProps {
  totalCount: number;
  urgentCount: number;
  imageCount?: number;
  imageWithTextCount?: number;
  imageOnlyCount?: number;
  pendingCount?: number;
  completedCount?: number;
  statusFilter: string;
  priorityFilter: string;
  tagFilter: string;
  onSelectTab: (type: 'all' | 'urgent' | 'has-image' | 'image-with-text' | 'image-only' | 'image' | string) => void;
  dateFilter?: string;
  onDateFilterChange?: (val: string) => void;
  startDate?: string;
  onStartDateChange?: (val: string) => void;
  endDate?: string;
  onEndDateChange?: (val: string) => void;
  language?: 'th' | 'en';
  className?: string;
}

export default function ChatQuickTabs({
  totalCount,
  urgentCount,
  imageCount,
  imageWithTextCount,
  imageOnlyCount,
  statusFilter,
  priorityFilter,
  tagFilter,
  onSelectTab,
  dateFilter = 'today',
  onDateFilterChange,
  startDate = '',
  onStartDateChange,
  endDate = '',
  onEndDateChange,
  language = 'th',
  className = '',
}: ChatQuickTabsProps) {
  const resolvedImageWithTextCount = imageWithTextCount ?? 0;
  const resolvedImageOnlyCount = imageOnlyCount ?? 0;
  const resolvedImageCount =
    imageCount !== undefined ? imageCount : resolvedImageWithTextCount + resolvedImageOnlyCount;

  const isAllImagesActive =
    tagFilter === '#รูปภาพ' ||
    tagFilter === '#รูปภาพทั้งหมด' ||
    tagFilter === 'has-image' ||
    tagFilter === 'image';
  const isImageWithTextActive =
    tagFilter === '#รูปภาพแนบ' ||
    tagFilter === '#รูปภาพพร้อมข้อความ' ||
    tagFilter === 'image-with-text';
  const isImageOnlyActive = tagFilter === '#รูปภาพล้วน' || tagFilter === 'image-only';

  const tabs = [
    {
      id: 'all' as const,
      label: language === 'th' ? 'ทั้งหมด' : 'All Sessions',
      icon: Inbox,
      count: totalCount,
      isActive: statusFilter === 'all' && priorityFilter === 'all' && (tagFilter === 'all' || !tagFilter),
      activeClass: 'bg-[#1a73e8] text-white shadow-xs font-medium',
      inactiveIconColor: 'text-neutral-400 dark:text-neutral-500',
      countClass: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400',
    },
    {
      id: 'urgent' as const,
      label: language === 'th' ? 'เคสด่วนวิกฤต' : 'Critical SLA',
      icon: AlertTriangle,
      count: urgentCount,
      isActive: priorityFilter === 'urgent',
      isUrgent: urgentCount > 0,
      activeClass: 'bg-[#d93025] text-white shadow-xs font-medium',
      inactiveIconColor: urgentCount > 0 ? 'text-[#d93025]' : 'text-neutral-400',
      countClass:
        urgentCount > 0
          ? 'bg-[#fce8e6] text-[#c5221f] dark:bg-rose-950/60 dark:text-rose-300 font-semibold'
          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500',
    },
    {
      id: 'image-with-text' as const,
      label: language === 'th' ? 'ดูรูป' : 'Attached Img',
      icon: ImageIcon,
      count: resolvedImageWithTextCount,
      isActive: isImageWithTextActive,
      activeClass: 'bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900 shadow-xs font-medium',
      inactiveIconColor: resolvedImageWithTextCount > 0 ? 'text-neutral-600 dark:text-neutral-300' : 'text-neutral-400',
      countClass:
        resolvedImageWithTextCount > 0
          ? 'bg-neutral-200/90 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200 font-semibold'
          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500',
    },
    {
      id: 'image-only' as const,
      label: language === 'th' ? 'รูปภาพล้วน' : 'Img Only',
      icon: ImageIcon,
      count: resolvedImageOnlyCount,
      isActive: isImageOnlyActive,
      activeClass: 'bg-[#8430ce] text-white shadow-xs font-medium',
      inactiveIconColor: resolvedImageOnlyCount > 0 ? 'text-[#8430ce]' : 'text-neutral-400',
      countClass:
        resolvedImageOnlyCount > 0
          ? 'bg-[#f3e8fd] text-[#8430ce] dark:bg-purple-950/60 dark:text-purple-300 font-semibold'
          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500',
    },
  ];

  const datePresets = [
    { id: 'today', label: language === 'th' ? 'วันนี้' : 'Today' },
    { id: '7days', label: language === 'th' ? '7 วันล่าสุด' : '7 Days' },
    { id: '30days', label: language === 'th' ? '30 วันล่าสุด' : '30 Days' },
    { id: 'custom', label: language === 'th' ? 'กำหนดเอง' : 'Custom' },
  ];

  return (
    <div
      className={`flex flex-col xl:flex-row xl:items-center justify-between gap-2 p-1.5 ${
        className || 'bg-white/70 dark:bg-neutral-900/70 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs backdrop-blur-md'
      }`}
    >
      {/* 1. Status & Priority Tabs (Left) */}
      <div className="flex flex-wrap items-center gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer select-none ${
                tab.isActive
                  ? tab.activeClass
                  : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60'
              }`}
            >
              <Icon size={13} className={tab.isActive ? 'text-white' : tab.inactiveIconColor} />
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono tabular-nums ${
                  tab.isActive ? 'bg-white/20 text-white font-medium' : tab.countClass
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 2. Timeframe Filter Buttons (Right) */}
      {onDateFilterChange && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1.5 xl:pt-0 border-t xl:border-t-0 xl:border-l border-neutral-200/80 dark:border-neutral-800/80 xl:pl-2.5">
          <div className="inline-flex items-center gap-0.5 bg-neutral-100/80 dark:bg-neutral-800/80 p-0.5 rounded-lg border border-neutral-200/70 dark:border-neutral-700/60 shadow-2xs">
            <span className="pl-1.5 pr-1 text-neutral-400 dark:text-neutral-500 select-none">
              <Calendar size={12} />
            </span>
            {datePresets.map((preset) => {
              const isSelected = dateFilter === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onDateFilterChange(preset.id)}
                  className={`px-2.5 py-1 rounded-md text-xs transition-all cursor-pointer select-none font-medium ${
                    isSelected
                      ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs font-semibold'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-white/40 dark:hover:bg-neutral-700/40'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {/* Custom DatePickers when 'custom' is active */}
          {dateFilter === 'custom' && onStartDateChange && onEndDateChange && (
            <div className="flex items-center gap-1.5 text-xs font-mono animate-in fade-in duration-200">
              <DatePicker
                value={startDate}
                onChange={onStartDateChange}
                language={language}
                placeholder={language === 'th' ? 'วันที่เริ่ม' : 'Start date'}
                align="right"
              />
              <span className="text-neutral-400 font-sans">-</span>
              <DatePicker
                value={endDate}
                onChange={onEndDateChange}
                language={language}
                placeholder={language === 'th' ? 'วันที่สิ้นสุด' : 'End date'}
                align="right"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
