'use client';

import React from 'react';
import { Search, Calendar, Activity } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import SelectDropdown from '@/components/ui/SelectDropdown';
import DatePicker from '@/components/ui/DatePicker';

interface AuditFilterBarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  actionFilter: string;
  onActionChange: (val: string) => void;
  dateFilter: string;
  onDateFilterChange: (val: string) => void;
  startDate: string;
  onStartDateChange: (val: string) => void;
  endDate: string;
  onEndDateChange: (val: string) => void;
  totalResults: number;
}

export default function AuditFilterBar({
  searchQuery,
  onSearchChange,
  actionFilter,
  onActionChange,
  dateFilter,
  onDateFilterChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  totalResults,
}: AuditFilterBarProps) {
  const { t, language } = useLanguage();

  return (
    <div className="relative z-30 backdrop-blur-xl bg-white/70 dark:bg-neutral-900/70 border border-neutral-200/80 dark:border-neutral-800/80 p-5 rounded-[22px] shadow-xs space-y-4 transition-all duration-250">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-start">
        {/* Search Input */}
        <div className="relative text-neutral-800 dark:text-neutral-100">
          <Search className="absolute left-3 top-2.5 text-neutral-400" size={14} />
          <input
            type="text"
            placeholder={t('auditSearchPlaceholder')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-neutral-50/80 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-400 transition-all font-medium text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 shadow-xs"
          />
        </div>

        {/* Action Type Selector */}
        <div>
          <SelectDropdown
            value={actionFilter}
            onChange={onActionChange}
            icon={<Activity size={13} />}
            size="md"
            options={[
              { value: 'all', label: t('auditFilterAll') },
              { value: 'CREATE', label: language === 'th' ? 'สร้าง (Create)' : 'Create' },
              { value: 'UPDATE', label: language === 'th' ? 'แก้ไข (Update)' : 'Update' },
              { value: 'DELETE', label: language === 'th' ? 'ลบ (Delete)' : 'Delete' },
              { value: 'LOGIN', label: language === 'th' ? 'เข้าสู่ระบบ (Login)' : 'Login' },
            ]}
          />
        </div>

        {/* Date Filter Selector */}
        <div>
          <SelectDropdown
            value={dateFilter}
            onChange={onDateFilterChange}
            icon={<Calendar size={13} />}
            size="md"
            options={[
              { value: 'today', label: language === 'th' ? 'ช่วงเวลา: วันนี้' : 'Timeframe: Today' },
              { value: '7days', label: language === 'th' ? 'ช่วงเวลา: 7 วันล่าสุด' : 'Timeframe: Last 7 Days' },
              { value: '30days', label: language === 'th' ? 'ช่วงเวลา: 30 วันล่าสุด' : 'Timeframe: Last 30 Days' },
              { value: 'custom', label: language === 'th' ? 'ระบุช่วงวันที่เอง...' : 'Custom Range...' },
            ]}
          />
        </div>

        <div className="text-neutral-400 dark:text-neutral-500 text-[11px] font-bold text-right pt-2.5 md:pr-2 select-none">
          {language === 'th' ? `พบประวัติทั้งหมด ${totalResults} รายการ` : `Found ${totalResults} total logs`}
        </div>
      </div>

      {/* Custom Date Pickers Drawer */}
      {dateFilter === 'custom' && (
        <div className="flex flex-wrap items-center gap-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 p-3.5 rounded-2xl transition-all">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-600 dark:text-neutral-300">
            <Calendar size={14} className="text-indigo-500" />
            <span>{language === 'th' ? 'ระบุช่วงวันที่:' : 'Select Range:'}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-neutral-400 uppercase">{language === 'th' ? 'จาก:' : 'From:'}</span>
            <DatePicker
              value={startDate}
              onChange={onStartDateChange}
              language={language as 'th' | 'en'}
              placeholder={language === 'th' ? 'วันที่เริ่มต้น' : 'Start date'}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-neutral-400 uppercase">{language === 'th' ? 'ถึง:' : 'To:'}</span>
            <DatePicker
              value={endDate}
              onChange={onEndDateChange}
              language={language as 'th' | 'en'}
              placeholder={language === 'th' ? 'วันที่สิ้นสุด' : 'End date'}
            />
          </div>
        </div>
      )}
    </div>
  );
}
