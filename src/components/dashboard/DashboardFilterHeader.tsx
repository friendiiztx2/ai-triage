import React from 'react';
import { Calendar, RefreshCw, Bell, BellOff, SlidersHorizontal } from 'lucide-react';
import SoundSettingsModal from '@/components/SoundSettingsModal';
import SelectDropdown from '@/components/ui/SelectDropdown';
import DatePicker from '@/components/ui/DatePicker';
import { playAlertTone } from '@/lib/audio';

export interface DashboardFilterHeaderProps {
  dateRange: string;
  onDateRangeChange: (range: string) => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  showSoundModal: boolean;
  onOpenSoundModal: () => void;
  onCloseSoundModal: () => void;
  onReload: () => void;
  loading: boolean;
  language?: 'th' | 'en';
}

export default function DashboardFilterHeader({
  dateRange,
  onDateRangeChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  soundEnabled,
  onToggleSound,
  showSoundModal,
  onOpenSoundModal,
  onCloseSoundModal,
  onReload,
  loading,
  language = 'th',
}: DashboardFilterHeaderProps) {
  return (
    <div className="relative z-30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight font-display">
          {language === 'th' ? 'แดชบอร์ดสรุปภาพรวม' : 'Executive Overview'}
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-xs sm:text-sm mt-0.5 font-normal">
          {language === 'th'
            ? 'วิเคราะห์ปริมาณแชต สรุปประเด็นปัญหา และวัดผลความแม่นยำ AI'
            : 'Chat volume analytics, issue breakdown and AI accuracy metrics'}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Sound Alert Toggle & Settings */}
        <div className="inline-flex items-center rounded-lg bg-white/70 dark:bg-neutral-900/70 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs divide-x divide-neutral-200/80 dark:divide-neutral-800/80 backdrop-blur-md">
          <button
            onClick={() => {
              onToggleSound();
              if (!soundEnabled) {
                playAlertTone(undefined, undefined, true);
              }
            }}
            className={`flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium transition-all cursor-pointer ${
              soundEnabled
                ? 'text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60'
                : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60'
            }`}
            title={soundEnabled ? 'ปิดเสียงแจ้งเตือนเคสด่วน' : 'เปิดเสียงแจ้งเตือนเคสด่วน'}
          >
            {soundEnabled ? (
              <>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <Bell size={13} className="text-neutral-700 dark:text-neutral-200" />
                <span className="text-[11px] font-mono">{language === 'th' ? 'เตือนเสียง' : 'Sound'}</span>
              </>
            ) : (
              <>
                <BellOff size={13} className="text-neutral-400" />
                <span className="text-[11px] font-mono text-neutral-400">{language === 'th' ? 'ปิดเสียง' : 'Muted'}</span>
              </>
            )}
          </button>
          <button
            onClick={onOpenSoundModal}
            className="px-2 py-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60 transition-all cursor-pointer"
            title="ตั้งค่ารูปแบบเสียง"
          >
            <SlidersHorizontal size={12} />
          </button>
        </div>

        <SoundSettingsModal
          isOpen={showSoundModal}
          onClose={onCloseSoundModal}
        />

        {/* Timeframe Dropdown */}
        <div className="w-36">
          <SelectDropdown
            value={dateRange}
            onChange={onDateRangeChange}
            icon={<Calendar size={13} />}
            align="right"
            options={[
              { value: 'today', label: language === 'th' ? 'วันนี้' : 'Today' },
              { value: '7days', label: language === 'th' ? '7 วันล่าสุด' : 'Past 7 Days' },
              { value: '30days', label: language === 'th' ? '30 วันล่าสุด' : 'Past 30 Days' },
              { value: 'custom', label: language === 'th' ? 'กำหนดเอง...' : 'Custom...' },
            ]}
          />
        </div>

        {/* Custom Date Pickers */}
        {dateRange === 'custom' && (
          <div className="flex items-center gap-1.5 font-mono">
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

        {/* Refresh Button */}
        <button
          onClick={onReload}
          disabled={loading}
          className="p-2 rounded-lg border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/70 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60 transition-all disabled:opacity-40 cursor-pointer shadow-xs backdrop-blur-md"
          title="รีเฟรชข้อมูล"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
    </div>
  );
}
