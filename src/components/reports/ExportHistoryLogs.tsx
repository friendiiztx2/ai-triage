import React from 'react';
import { History, FileText, Download } from 'lucide-react';

export interface ExportHistoryItem {
  id: string;
  name: string;
  type: string;
  date: string;
  size: string;
  status?: string;
  user?: string;
}

export interface ExportHistoryLogsProps {
  logs: ExportHistoryItem[];
  onReDownload: () => void;
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
                <FileText size={13} />
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
              <button
                type="button"
                onClick={onReDownload}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer select-none"
              >
                <Download size={11} />
                <span>{language === 'th' ? 'ดาวน์โหลด' : 'Download'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
