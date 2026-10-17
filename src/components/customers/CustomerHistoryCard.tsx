'use client';

import React from 'react';
import Link from 'next/link';
import { X, RefreshCw, Inbox, Clock } from 'lucide-react';
import { getCategoryLabel } from '@/lib/categories';

interface CustomerHistoryCardProps {
  panelIndex: number;
  cust: any;
  chats: any[];
  isLoading: boolean;
  onClose: (custId: string) => void;
  language: 'th' | 'en';
}

export default function CustomerHistoryCard({
  panelIndex,
  cust,
  chats,
  isLoading,
  onClose,
  language,
}: CustomerHistoryCardProps) {
  return (
    <div className="backdrop-blur-xl bg-white/70 dark:bg-neutral-900/70 border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl shadow-xs overflow-hidden transition-all duration-250 flex flex-col hover:shadow-md">
      {/* Header */}
      <div className="p-4 border-b border-neutral-100 dark:border-neutral-800/60 bg-neutral-50/70 dark:bg-neutral-900/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#1a73e8] text-white font-medium text-[10px] flex items-center justify-center">
            #{panelIndex + 1}
          </span>
          <div>
            <h3 className="font-semibold text-neutral-800 dark:text-neutral-100 text-xs flex items-center gap-1.5">
              {cust.name}
            </h3>
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">
              {cust.phone || cust.email || cust.id}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onClose(cust.id)}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-955/40 transition cursor-pointer"
          title="ปิดแถบลูกค้ารายนี้"
        >
          <X size={16} />
        </button>
      </div>

      {/* Body: Chat History */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between text-xs border-b border-neutral-100 dark:border-neutral-800/60 pb-2">
          <span className="text-neutral-500 font-medium uppercase tracking-wider text-[10px]">
            {language === 'th' ? `ประวัติแชตสะสม (${chats.length} เคส)` : `Chat History (${chats.length} cases)`}
          </span>
          <Link
            href={`/chats?search=${encodeURIComponent(cust.name || cust.id)}`}
            className="text-[10px] font-semibold text-[#1a73e8] dark:text-blue-400 hover:underline"
          >
            {language === 'th' ? 'ค้นหาในหน้าแชต ➔' : 'Search in Chats ➔'}
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw size={22} className="animate-spin text-[#1a73e8]" />
          </div>
        ) : chats.length === 0 ? (
          <div className="text-neutral-400 dark:text-neutral-500 italic text-xs text-center py-8 flex flex-col items-center justify-center gap-2">
            <Inbox size={20} className="text-neutral-300 dark:text-neutral-700" />
            <span>{language === 'th' ? 'ไม่พบประวัติการแจ้งเรื่อง' : 'No chat history found'}</span>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
            {chats.map((chat) => {
              const pri = (chat.priority || 'low').toLowerCase();
              let color = 'text-neutral-400 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-400';
              if (pri === 'urgent') color = 'text-rose-600 bg-rose-50 dark:bg-rose-955/30 dark:text-rose-400';
              else if (pri === 'high') color = 'text-orange-600 bg-orange-50 dark:bg-orange-955/30 dark:text-orange-400';
              else if (pri === 'medium') color = 'text-amber-600 bg-amber-50 dark:bg-amber-955/30 dark:text-amber-400';
              else if (pri === 'low') color = 'text-blue-600 bg-blue-50 dark:bg-blue-955/30 dark:text-blue-400';

              return (
                <Link 
                  key={chat.id} 
                  href={`/chats?chat_id=${chat.id}`}
                  className="block border border-neutral-100 dark:border-neutral-800/60 rounded-xl p-3 hover:border-[#1a73e8]/40 transition-all bg-neutral-50/50 dark:bg-neutral-900/50 space-y-2 cursor-pointer group hover:shadow-xs"
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-[10px] font-bold px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-700">
                      {getCategoryLabel(chat.category_id, language)}
                    </span>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${color}`}>
                      {pri}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-600 dark:text-neutral-300 font-medium line-clamp-2 leading-relaxed group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {chat.summary || (language === 'th' ? 'ไม่มีบทสรุปเคส' : 'No case summary')}
                  </p>

                  <div className="flex justify-between items-center text-[10px] text-neutral-400 dark:text-neutral-500 pt-1.5 border-t border-neutral-100 dark:border-neutral-800/60">
                    <span className="flex items-center gap-1">
                      <Clock size={10} /> 
                      {chat.status === 'completed' 
                        ? (language === 'th' ? 'เสร็จสิ้น' : 'Completed') 
                        : (language === 'th' ? 'ค้างอยู่' : 'Pending')}
                    </span>
                    <span>{chat.created_at ? new Date(chat.created_at).toLocaleDateString('th-TH') : ''}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
