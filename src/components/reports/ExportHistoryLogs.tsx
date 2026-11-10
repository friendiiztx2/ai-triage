import React from 'react';
import { History, FileText, Download, ExternalLink } from 'lucide-react';

export interface ExportHistoryItem {
  id: string;
  name: string;
  type: string;
  date: string;
  size: string;
  status?: string;
  user?: string;
  openUrl?: string;
}

export interface ExportHistoryLogsProps {
  logs: ExportHistoryItem[];
  onReDownload: (item?: ExportHistoryItem) => void;
  language?: 'th' | 'en';
}

export default function ExportHistoryLogs({
  logs,
  onReDownload,
  language = 'th',
}: ExportHistoryLogsProps) {
  if (logs.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/70 p-4 shadow-xs backdrop-blur-md space-y-2">
        <h3 className="font-medium text-neutral-900 dark:text-neutral-100 text-xs flex items-center gap-2">
          <History size={13} className="text-neutral-400" />
          <span>{language === 'th' ? 'ประวัติการส่งออกล่าสุด' : 'Recent Export Logs'}</span>
        </h3>
        <p className="text-xs text-neutral-400 py-6 text-center font-mono">
          {language === 'th' ? 'ยังไม่มีประวัติการส่งออกในเซสชันนี้' : 'No export archives recorded'}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/70 p-4 shadow-xs backdrop-blur-md space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800/60">
        <h3 className="font-medium text-neutral-900 dark:text-neutral-100 text-xs flex items-center gap-1.5">
          <History size={13} className="text-neutral-400" />
          <span>{language === 'th' ? 'ประวัติการส่งออกล่าสุด' : 'Recent Export Archive'}</span>
        </h3>
        <span className="font-mono text-[10px] text-neutral-400">
          {logs.length} files
        </span>
      </div>

      <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
        {logs.map((log) => (
          <div key={log.id} className="py-2.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-500 shrink-0">
                {log.openUrl ? (
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                    <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="#4285F4"/>
                    <path d="M14 2V8H20L14 2Z" fill="#A1C2FA"/>
                    <line x1="8" y1="13" x2="16" y2="13" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="8" y1="17" x2="14" y2="17" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="8" y1="9" x2="11" y2="9" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <FileText size={13} />
                )}
              </div>
              <div className="min-w-0">
                <span className="font-medium text-xs text-neutral-900 dark:text-neutral-100 block truncate">
                  {log.name}
                </span>
                <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400 mt-0.5">
                  <span>{log.id}</span>
                  <span>•</span>
                  <span>{log.type}</span>
                  <span>•</span>
                  <span>
                    {language === 'th'
                      ? new Date(log.date).toLocaleDateString('th-TH')
                      : new Date(log.date).toLocaleDateString('en-US')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-[11px] font-mono text-neutral-400 tabular-nums">{log.size}</span>
              {log.openUrl ? (
                <button
                  type="button"
                  onClick={() => {
                    window.open(log.openUrl, '_blank', 'noopener,noreferrer');
                    onReDownload(log);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono border border-blue-200 dark:border-blue-900/60 text-[#1a73e8] dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer select-none"
                >
                  <ExternalLink size={11} />
                  <span>{language === 'th' ? 'เปิดเอกสาร' : 'Open'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onReDownload(log)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer select-none"
                >
                  <Download size={11} />
                  <span>{language === 'th' ? 'ดาวน์โหลด' : 'Download'}</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
