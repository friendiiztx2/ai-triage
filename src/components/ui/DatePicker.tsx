'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

export interface DatePickerProps {
  value: string; // 'YYYY-MM-DD'
  onChange: (dateStr: string) => void;
  placeholder?: string;
  language?: 'th' | 'en';
  disabled?: boolean;
  className?: string;
  minDate?: string;
  maxDate?: string;
  align?: 'left' | 'right';
}

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const ENG_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

const ENG_MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const WEEKDAYS_TH = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const WEEKDAYS_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function DatePicker({
  value,
  onChange,
  placeholder,
  language = 'th',
  disabled = false,
  className = '',
  minDate,
  maxDate,
  align = 'left',
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize view year/month based on current value or today
  const initialDate = value ? new Date(value) : new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear() || new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(
    !isNaN(initialDate.getMonth()) ? initialDate.getMonth() : new Date().getMonth()
  );

  // Synchronize view when value changes
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Build 6 weeks calendar grid (42 days)
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const calendarDays: Array<{
    day: number;
    month: number;
    year: number;
    isCurrentMonth: boolean;
    dateStr: string;
  }> = [];

  // Previous month trailing days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const m = viewMonth === 0 ? 11 : viewMonth - 1;
    const y = viewMonth === 0 ? viewYear - 1 : viewYear;
    const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({ day: d, month: m, year: y, isCurrentMonth: false, dateStr });
  }

  // Current month days
  for (let i = 1; i <= daysInCurrentMonth; i++) {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    calendarDays.push({ day: i, month: viewMonth, year: viewYear, isCurrentMonth: true, dateStr });
  }

  // Next month leading days
  const remainingCells = 42 - calendarDays.length;
  for (let i = 1; i <= remainingCells; i++) {
    const m = viewMonth === 11 ? 0 : viewMonth + 1;
    const y = viewMonth === 11 ? viewYear + 1 : viewYear;
    const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    calendarDays.push({ day: i, month: m, year: y, isCurrentMonth: false, dateStr });
  }

  // Today representation
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Formatted trigger label
  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return null;
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;

    const day = d.getDate();
    const month = d.getMonth();
    const year = d.getFullYear();

    if (language === 'th') {
      const thaiYear = year + 543;
      return `${day} ${THAI_MONTHS_SHORT[month]} ${thaiYear}`;
    }
    return `${day} ${ENG_MONTHS_SHORT[month]} ${year}`;
  };

  const displayLabel = formatDisplayDate(value);
  const defaultPlaceholder = language === 'th' ? 'วว/ดด/ปปปป' : 'DD/MM/YYYY';

  const monthTitle = language === 'th'
    ? `${THAI_MONTHS[viewMonth]} ${viewYear + 543}`
    : `${ENG_MONTHS[viewMonth]} ${viewYear}`;

  const weekdays = language === 'th' ? WEEKDAYS_TH : WEEKDAYS_EN;

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800/80 focus:outline-none focus:border-[#1a73e8]/70 dark:focus:border-[#8ab4f8]/70 shadow-2xs transition-all cursor-pointer text-xs font-mono disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        <div className="flex items-center gap-1.5 truncate">
          <CalendarIcon size={13} className="text-neutral-400 dark:text-neutral-500 shrink-0" />
          {displayLabel ? (
            <span className="font-semibold text-neutral-900 dark:text-white truncate">
              {displayLabel}
            </span>
          ) : (
            <span className="text-neutral-400 dark:text-neutral-500 font-normal truncate">
              {placeholder || defaultPlaceholder}
            </span>
          )}
        </div>

        {value ? (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            className="p-0.5 rounded hover:bg-neutral-200/70 dark:hover:bg-neutral-700/70 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors cursor-pointer shrink-0 ml-1"
            title={language === 'th' ? 'ล้างค่าวันที่' : 'Clear date'}
          >
            <X size={12} />
          </span>
        ) : null}
      </button>

      {/* Modern Frosted Calendar Popover */}
      {isOpen && (
        <div
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-1.5 z-[9999] w-64 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-neutral-200/90 dark:border-neutral-800 rounded-2xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.3)] p-3 animate-scale-in select-none`}
        >
          {/* Header Month / Year Navigation */}
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-neutral-100 dark:border-neutral-800/70">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title={language === 'th' ? 'เดือนก่อนหน้า' : 'Previous month'}
            >
              <ChevronLeft size={15} />
            </button>

            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-100 tracking-tight">
              {monthTitle}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title={language === 'th' ? 'เดือนถัดไป' : 'Next month'}
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Weekday Row */}
          <div className="grid grid-cols-7 text-center mb-1">
            {weekdays.map((wd, idx) => (
              <span
                key={wd}
                className={`text-[10px] font-semibold py-1 ${
                  idx === 0
                    ? 'text-rose-500/80'
                    : 'text-neutral-400 dark:text-neutral-500'
                }`}
              >
                {wd}
              </span>
            ))}
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {calendarDays.map((c) => {
              const isSelected = value === c.dateStr;
              const isToday = todayStr === c.dateStr;
              const isDisabled = Boolean(
                (minDate && c.dateStr < minDate) ||
                (maxDate && c.dateStr > maxDate)
              );

              return (
                <button
                  key={c.dateStr}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => {
                    onChange(c.dateStr);
                    setIsOpen(false);
                  }}
                  className={`h-7 w-7 mx-auto rounded-lg text-xs flex items-center justify-center transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-[#1a73e8] text-white font-bold shadow-xs hover:bg-[#1557b0]'
                      : isToday
                      ? 'border border-[#1a73e8] text-[#1a73e8] dark:text-blue-300 font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      : !c.isCurrentMonth
                      ? 'text-neutral-300 dark:text-neutral-600 hover:text-neutral-500 dark:hover:text-neutral-400 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 font-normal'
                      : 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-medium'
                  } ${isDisabled ? 'opacity-30 cursor-not-allowed hover:bg-transparent' : ''}`}
                >
                  {c.day}
                </button>
              );
            })}
          </div>

          {/* Quick Actions Footer */}
          <div className="flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800/80 pt-2 mt-2">
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className="text-[11px] font-medium text-neutral-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors cursor-pointer px-1.5 py-0.5 rounded hover:bg-rose-500/[0.08]"
            >
              {language === 'th' ? 'ล้างค่า' : 'Clear'}
            </button>

            <button
              type="button"
              onClick={() => {
                onChange(todayStr);
                setIsOpen(false);
              }}
              className="text-[11px] font-semibold text-[#1a73e8] dark:text-blue-400 hover:underline transition-colors cursor-pointer px-1.5 py-0.5 rounded hover:bg-[#1a73e8]/10"
            >
              {language === 'th' ? 'วันนี้' : 'Today'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
