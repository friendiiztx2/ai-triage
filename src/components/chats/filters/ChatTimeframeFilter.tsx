import React from 'react';
import { RotateCcw, Calendar } from 'lucide-react';
import SelectDropdown from '@/components/ui/SelectDropdown';
import DatePicker from '@/components/ui/DatePicker';

interface ChatTimeframeFilterProps {
  dateFilter: string;
  onDateChange: (val: string) => void;
  startDate: string;
  onStartDateChange: (val: string) => void;
  endDate: string;
  onEndDateChange: (val: string) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  language?: 'th' | 'en';
}

export default function ChatTimeframeFilter({
  dateFilter,
  onDateChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  hasActiveFilters,
  onClearFilters,
  language = 'th',
}: ChatTimeframeFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800/60">
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-48">
          <SelectDropdown
            value={dateFilter}
            onChange={onDateChange}
            icon={<Calendar size={13} />}
            options={[
              { value: 'today', label: language === 'th' ? 'ช่วงเวลา: วันนี้' : 'Timeframe: Today' },
              { value: '7days', label: language === 'th' ? 'ช่วงเวลา: 7 วันล่าสุด' : 'Past 7 Days' },
              { value: '30days', label: language === 'th' ? 'ช่วงเวลา: 30 วันล่าสุด' : 'Past 30 Days' },
              { value: 'custom', label: language === 'th' ? 'กำหนดเอง...' : 'Custom Range...' },
            ]}
          />
        </div>

        {dateFilter === 'custom' && (
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <DatePicker
              value={startDate}
              onChange={onStartDateChange}
              language={language}
              placeholder={language === 'th' ? 'วันที่เริ่ม' : 'Start date'}
            />
            <span className="text-neutral-400 font-sans">-</span>
            <DatePicker
              value={endDate}
              onChange={onEndDateChange}
              language={language}
              placeholder={language === 'th' ? 'วันที่สิ้นสุด' : 'End date'}
            />
          </div>
        )}
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="inline-flex items-center gap-1.5 text-[11px] font-mono text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 px-2.5 py-1 rounded-md transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <RotateCcw size={11} />
          <span>{language === 'th' ? 'ล้างตัวกรอง' : 'Reset filters'}</span>
        </button>
      )}
    </div>
  );
}
