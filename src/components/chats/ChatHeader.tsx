'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Bell, BellOff, Tag, Download, ChevronDown, FileText, ExternalLink } from 'lucide-react';

interface ChatHeaderProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  desktopNotifyEnabled: boolean;
  onToggleDesktopNotify: () => void;
  onOpenTagManager: () => void;
  onExportCSV: () => void;
  onExportGoogleSheets: () => void;
  language: string;
}

export default function ChatHeader({
  soundEnabled,
  onToggleSound,
  desktopNotifyEnabled,
  onToggleDesktopNotify,
  onOpenTagManager,
  onExportCSV,
  onExportGoogleSheets,
  language,
}: ChatHeaderProps) {
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setExportDropdownOpen(false);
      }
    }
    if (exportDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [exportDropdownOpen]);

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
          title={soundEnabled ? (language === 'th' ? 'ปิดเสียงเตือนเคสด่วน' : 'Mute sound alerts') : (language === 'th' ? 'เปิดเสียงเตือนเคสด่วน (คลิกเพื่อทดสอบเสียง)' : 'Enable sound alerts (test sound)')}
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
          title={desktopNotifyEnabled ? (language === 'th' ? 'ปิดการแจ้งเตือนหน้าจอ' : 'Disable desktop alerts') : (language === 'th' ? 'เปิดการแจ้งเตือนหน้าจอ' : 'Enable desktop alerts')}
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

        {/* Compact Export Dropdown Button */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-medium transition-colors shadow-xs cursor-pointer select-none"
          >
            <Download size={12} />
            <span>{language === 'th' ? 'ส่งออก' : 'Export'}</span>
            <ChevronDown size={12} className={`transition-transform duration-200 ${exportDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {exportDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-56 rounded-xl border border-neutral-200/90 dark:border-neutral-800/90 bg-white dark:bg-neutral-900 shadow-xl py-1.5 z-50 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-neutral-400 border-b border-neutral-100 dark:border-neutral-800/80 mb-1">
                {language === 'th' ? 'รูปแบบการส่งออก' : 'Export Format'}
              </div>

              {/* Google Sheets Option */}
              <button
                type="button"
                onClick={() => {
                  setExportDropdownOpen(false);
                  onExportGoogleSheets();
                }}
                className="w-full text-left px-3 py-2 text-xs flex items-center gap-2.5 text-neutral-700 dark:text-neutral-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer group"
              >
                <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-[#0f9d58] dark:text-emerald-300 shrink-0 group-hover:scale-105 transition-transform">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                    <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="#0F9D58"/>
                    <path d="M14 2V8H20L14 2Z" fill="#87CEAC"/>
                    <path d="M8 12H16M8 15H16M8 9H11M12 9V18" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-xs flex items-center gap-1">
                    <span>Google Sheets</span>
                    <ExternalLink size={10} className="text-neutral-400 group-hover:text-emerald-600" />
                  </div>
                  <div className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate">
                    {language === 'th' ? 'เปิดสเปรดชีตออนไลน์ทันที' : 'Open in Google Sheets'}
                  </div>
                </div>
              </button>

              {/* CSV Flat File Option */}
              <button
                type="button"
                onClick={() => {
                  setExportDropdownOpen(false);
                  onExportCSV();
                }}
                className="w-full text-left px-3 py-2 text-xs flex items-center gap-2.5 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer group"
              >
                <div className="p-1.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 shrink-0 group-hover:scale-105 transition-transform">
                  <FileText size={14} />
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-xs">
                    {language === 'th' ? 'ไฟล์ CSV (.csv)' : 'CSV Flat File (.csv)'}
                  </div>
                  <div className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate">
                    {language === 'th' ? 'ดาวน์โหลดลงเครื่อง' : 'Download to device'}
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
