'use client';

import React from 'react';
import { Volume2, VolumeX, Bell, BellOff, Tag, Download } from 'lucide-react';

interface ChatHeaderProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  desktopNotifyEnabled: boolean;
  onToggleDesktopNotify: () => void;
  onOpenTagManager: () => void;
  onExportCSV: () => void;
  language: string;
}

export default function ChatHeader({
  soundEnabled,
  onToggleSound,
  desktopNotifyEnabled,
  onToggleDesktopNotify,
  onOpenTagManager,
  onExportCSV,
  language,
}: ChatHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight font-display">
          {language === 'th' ? 'รายการแชตและคัดแยก' : 'Chat Triage Workspace'}
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-xs sm:text-sm mt-0.5 font-normal">
          {language === 'th'
            ? 'คัดแยกความเร่งด่วน หมวดหมู่ปัญหา และตรวจสอบผลการวิเคราะห์ของ AI'
            : 'Operational queue for priority routing, topic taxonomy, and AI triage review'}
        </p>
      </div>

      {/* Action Header Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Sound Toggle Button */}
        <button
          onClick={onToggleSound}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border backdrop-blur-md transition-colors cursor-pointer shadow-xs text-xs font-mono ${
            soundEnabled
              ? 'bg-[#e8f0fe] dark:bg-blue-950/60 text-[#1a73e8] dark:text-blue-300 border-[#1a73e8]/30 font-medium'
              : 'bg-white/70 dark:bg-neutral-900/70 border-neutral-200/80 dark:border-neutral-800/80 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
          }`}
          title={soundEnabled ? 'ปิดเสียงเตือนเคสด่วน' : 'เปิดเสียงเตือนเคสด่วน'}
        >
          {soundEnabled ? (
            <>
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <Volume2 size={13} />
            </>
          ) : (
            <VolumeX size={13} />
          )}
        </button>

        {/* Desktop Popup Notification Toggle */}
        <button
          onClick={onToggleDesktopNotify}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border backdrop-blur-md transition-colors cursor-pointer shadow-xs text-xs font-mono ${
            desktopNotifyEnabled
              ? 'bg-[#e8f0fe] dark:bg-blue-950/60 text-[#1a73e8] dark:text-blue-300 border-[#1a73e8]/30 font-medium'
              : 'bg-white/70 dark:bg-neutral-900/70 border-neutral-200/80 dark:border-neutral-800/80 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
          }`}
          title="การแจ้งเตือนหน้าจอ"
        >
          {desktopNotifyEnabled ? (
            <>
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <Bell size={13} />
            </>
          ) : (
            <BellOff size={13} />
          )}
        </button>

        {/* Tag Manager Button */}
        <button
          onClick={onOpenTagManager}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/70 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer shadow-xs backdrop-blur-md"
        >
          <Tag size={12} />
          <span>{language === 'th' ? 'แท็กระบบ' : 'Tags'}</span>
        </button>

        {/* Export CSV Button */}
        <button
          onClick={onExportCSV}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-medium transition-colors shadow-xs cursor-pointer"
        >
          <Download size={12} />
          <span>{language === 'th' ? 'ส่งออก CSV' : 'Export'}</span>
        </button>
      </div>
    </div>
  );
}
