'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

interface MonthPickerProps {
  value: string; // "YYYY-MM"
  onChange: (value: string) => void;
  language?: 'th' | 'en';
}

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const ENG_MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const ENG_MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function MonthPicker({ value, onChange, language = 'th' }: MonthPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current value
  const [yearStr, monthStr] = (value || '').split('-');
  const currentYear = parseInt(yearStr, 10) || new Date().getFullYear();
  const currentMonthIdx = (parseInt(monthStr, 10) || (new Date().getMonth() + 1)) - 1;

  // View year inside the picker popover
  const [viewYear, setViewYear] = useState(currentYear);

  // Sync viewYear when value changes
  useEffect(() => {
    setViewYear(currentYear);
  }, [currentYear]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Quick 1-click prev / next month step
  const handleStepMonth = (step: number) => {
    const d = new Date(currentYear, currentMonthIdx + step, 1);
    const newY = d.getFullYear();
    const newM = String(d.getMonth() + 1).padStart(2, '0');
    onChange(`${newY}-${newM}`);
  };

  // Select month from grid
  const handleSelectMonth = (monthIndex: number) => {
    const newM = String(monthIndex + 1).padStart(2, '0');
    onChange(`${viewYear}-${newM}`);
    setIsOpen(false);
  };

  // Jump to current month
  const handleSelectCurrentMonth = () => {
    const now = new Date();
    const newY = now.getFullYear();
    const newM = String(now.getMonth() + 1).padStart(2, '0');
    onChange(`${newY}-${newM}`);
    setViewYear(newY);
    setIsOpen(false);
  };

  // Jump to last month
  const handleSelectLastMonth = () => {
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const newY = d.getFullYear();
    const newM = String(d.getMonth() + 1).padStart(2, '0');
    onChange(`${newY}-${newM}`);
    setViewYear(newY);
    setIsOpen(false);
  };

  // Formatted Label
  const formatDisplayLabel = () => {
    if (language === 'th') {
      const mName = THAI_MONTHS_FULL[currentMonthIdx] || '';
      const thaiYear = currentYear + 543;
      return `${mName} ${thaiYear}`;
    }
    const mName = ENG_MONTHS_FULL[currentMonthIdx] || '';
    return `${mName} ${currentYear}`;
  };

  const isTodayMonth = (mIdx: number) => {
    const now = new Date();
    return now.getFullYear() === viewYear && now.getMonth() === mIdx;
  };

  const isSelectedMonth = (mIdx: number) => {
    return currentYear === viewYear && currentMonthIdx === mIdx;
  };

  const monthsShort = language === 'th' ? THAI_MONTHS_SHORT : ENG_MONTHS_SHORT;

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Trigger Control: Pill with Prev, Month Label, Next */}
      <div className="inline-flex items-center rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
        {/* Step Prev Month */}
        <button
          type="button"
          onClick={() => handleStepMonth(-1)}
          className="p-1.5 pl-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60 rounded-l-xl transition-colors cursor-pointer"
          title={language === 'th' ? 'เดือนก่อนหน้า' : 'Previous month'}
        >
          <ChevronLeft size={14} />
        </button>

        {/* Month Display & Popover Trigger */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-800 dark:text-neutral-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer select-none"
        >
          <Calendar size={13} className="text-indigo-500 shrink-0" />
          <span className="font-semibold tracking-tight">{formatDisplayLabel()}</span>
          <ChevronDown
            size={12}
            className={`text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Step Next Month */}
        <button
          type="button"
          onClick={() => handleStepMonth(1)}
          className="p-1.5 pr-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60 rounded-r-xl transition-colors cursor-pointer"
          title={language === 'th' ? 'เดือนถัดไป' : 'Next month'}
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 z-50 w-64 p-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          {/* Year Navigation Bar */}
          <div className="flex items-center justify-between pb-3 mb-2.5 border-b border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={() => setViewYear((y) => y - 1)}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="ปีก่อนหน้า"
            >
              <ChevronLeft size={14} />
            </button>

            <div className="text-center font-bold text-xs text-neutral-800 dark:text-neutral-200 tracking-tight">
              <span>{viewYear}</span>
              {language === 'th' && (
                <span className="text-neutral-400 text-[11px] font-normal ml-1">
                  (พ.ศ. {viewYear + 543})
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setViewYear((y) => y + 1)}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="ปีถัดไป"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* 3x4 Months Grid */}
          <div className="grid grid-cols-3 gap-1.5">
            {monthsShort.map((mName, idx) => {
              const selected = isSelectedMonth(idx);
              const today = isTodayMonth(idx);

              return (
                <button
                  key={mName}
                  type="button"
                  onClick={() => handleSelectMonth(idx)}
                  className={`py-2 px-1 rounded-xl text-xs font-semibold transition-all cursor-pointer relative ${
                    selected
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-indigo-600 dark:hover:text-indigo-400'
                  } ${today && !selected ? 'border border-indigo-400/50 text-indigo-600 dark:text-indigo-400' : ''}`}
                >
                  {mName}
                  {today && !selected && (
                    <span className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Preset Buttons */}
          <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={handleSelectLastMonth}
              className="text-neutral-500 hover:text-indigo-600 dark:text-neutral-400 dark:hover:text-indigo-400 font-medium hover:underline cursor-pointer"
            >
              {language === 'th' ? '← เดือนก่อนหน้า' : '← Last month'}
            </button>
            <button
              type="button"
              onClick={handleSelectCurrentMonth}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-bold hover:underline cursor-pointer"
            >
              {language === 'th' ? 'เดือนปัจจุบัน •' : 'This month •'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
