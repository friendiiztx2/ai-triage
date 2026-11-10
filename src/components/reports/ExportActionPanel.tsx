import React from 'react';
import { Download, FileSpreadsheet, FileText, ExternalLink } from 'lucide-react';

export type ExportFormatMode = 'xlsx_multi_sheet' | 'csv_single' | 'google_docs';

export interface ExportActionPanelProps {
  exportFormatMode: ExportFormatMode;
  onFormatChange: (mode: ExportFormatMode) => void;
  onExport: () => void;
  filteredCount: number;
  loading: boolean;
  language?: 'th' | 'en';
}

export default function ExportActionPanel({
  exportFormatMode,
  onFormatChange,
  onExport,
  filteredCount,
  loading,
  language = 'th',
}: ExportActionPanelProps) {
  return (
    <div className="rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/70 p-4 shadow-xs backdrop-blur-md">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Format Selector */}
        <div className="space-y-1">
          <span className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
            {language === 'th' ? 'รูปแบบไฟล์ส่งออก' : 'Export File Format'}
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => onFormatChange('xlsx_multi_sheet')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                exportFormatMode === 'xlsx_multi_sheet'
                  ? 'bg-[#e6f4ea] dark:bg-emerald-950/40 text-[#137333] dark:text-emerald-300 border border-[#137333]/30 shadow-xs font-semibold'
                  : 'bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60'
              }`}
            >
              <FileSpreadsheet size={13} />
              <span>Excel Workbook (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={() => onFormatChange('csv_single')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                exportFormatMode === 'csv_single'
                  ? 'bg-[#e8f0fe] dark:bg-blue-950/40 text-[#1a73e8] dark:text-blue-300 border border-[#1a73e8]/30 shadow-xs font-semibold'
                  : 'bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60'
              }`}
            >
              <FileText size={13} />
              <span>Flat File (.csv)</span>
            </button>

            <button
              type="button"
              onClick={() => onFormatChange('google_docs')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                exportFormatMode === 'google_docs'
                  ? 'bg-[#e8f0fe] dark:bg-blue-950/50 text-[#1a73e8] dark:text-blue-300 border border-[#1a73e8]/30 shadow-xs font-semibold'
                  : 'bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60'
              }`}
            >
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="#4285F4"/>
                <path d="M14 2V8H20L14 2Z" fill="#A1C2FA"/>
                <line x1="8" y1="13" x2="16" y2="13" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="8" y1="17" x2="14" y2="17" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="8" y1="9" x2="11" y2="9" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span>docs.google</span>
            </button>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onExport}
          disabled={loading || filteredCount === 0}
          className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-xs shadow-xs transition-colors cursor-pointer select-none self-end sm:self-center disabled:opacity-40 ${
            exportFormatMode === 'google_docs'
              ? 'bg-[#1a73e8] hover:bg-[#1557b0] text-white'
              : 'bg-[#1a73e8] hover:bg-[#1557b0] text-white'
          }`}
        >
          {exportFormatMode === 'google_docs' ? (
            <>
              <ExternalLink size={13} />
              <span>
                {language === 'th'
                  ? `เปิดใน docs.google (${filteredCount.toLocaleString()} รายการ)`
                  : `Open in docs.google (${filteredCount.toLocaleString()})`}
              </span>
            </>
          ) : (
            <>
              <Download size={13} />
              <span>
                {language === 'th'
                  ? `ส่งออกข้อมูล (${filteredCount.toLocaleString()} รายการ)`
                  : `Export Dataset (${filteredCount.toLocaleString()})`}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
