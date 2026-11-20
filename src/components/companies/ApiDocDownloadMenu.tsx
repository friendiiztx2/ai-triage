'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, FileDown } from 'lucide-react';

const FORMATS = [
  { id: 'html', label: 'HTML (.html)', hint: { th: 'เปิดในเบราว์เซอร์ อ่านง่ายที่สุด', en: 'Opens in a browser' } },
  { id: 'md', label: 'Markdown (.md)', hint: { th: 'สำหรับ GitHub หรือ Notion', en: 'For GitHub or Notion' } },
  { id: 'txt', label: 'ข้อความ (.txt)', hint: { th: 'เปิดได้ทุกโปรแกรม', en: 'Plain text, opens anywhere' } },
] as const;

/** "Download API guide" button with a choice of file format (the route serves system_admin only) */
export default function ApiDocDownloadMenu({ language = 'th' }: { language?: 'th' | 'en' }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs font-bold transition-colors cursor-pointer"
      >
        <FileDown size={15} />
        <span>{language === 'th' ? 'ดาวน์โหลดเอกสาร API' : 'Download API Guide'}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1.5 z-30 w-60 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-lg p-1"
        >
          {FORMATS.map((f) => (
            <a
              key={f.id}
              role="menuitem"
              href={`/api/api-doc?format=${f.id}`}
              download
              onClick={() => setOpen(false)}
              className="flex flex-col px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 focus-visible:bg-neutral-100 dark:focus-visible:bg-neutral-800 outline-none"
            >
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-100">{f.label}</span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">{f.hint[language]}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
