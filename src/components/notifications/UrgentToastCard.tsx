'use client';

import React from 'react';
import { AlertTriangle, X, ArrowRight, Volume2 } from 'lucide-react';
import { playAlertTone, getAudioContext } from '@/lib/audio';

export interface UrgentToastData {
  id: string;
  customerName: string;
  summary: string;
  priority: string;
  companyId?: string;
}

interface UrgentToastCardProps {
  toast: UrgentToastData;
  timeLeft: number;
  isPaused: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onDismiss: () => void;
  onViewChat: (e: React.MouseEvent) => void;
}

export default function UrgentToastCard({
  toast,
  timeLeft,
  isPaused,
  onMouseEnter,
  onMouseLeave,
  onDismiss,
  onViewChat,
}: UrgentToastCardProps) {
  return (
    <div 
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white dark:bg-neutral-900 border-2 border-rose-500 rounded-2xl shadow-2xl p-4 animate-slideIn select-none transition-all duration-200"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-955/30 text-rose-600 dark:text-rose-400 shrink-0 animate-bounce">
          <AlertTriangle size={20} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              🔴 เคสเร่งด่วนที่สุด! (URGENT)
            </span>
            <div className="flex items-center gap-1.5">
              <span 
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md transition-colors ${
                  isPaused 
                    ? 'bg-amber-100 dark:bg-amber-955/50 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700' 
                    : 'bg-rose-50 dark:bg-rose-955/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40'
                }`}
                title={isPaused ? 'หยุดนับเวลาชั่วคราวขณะชี้เมาส์' : `จะปิดอัตโนมัติในอีก ${timeLeft} วินาที`}
              >
                ⏱️ {isPaused ? 'หยุดเวลา' : `${timeLeft}s`}
              </span>
              <button 
                onClick={onDismiss}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition p-0.5 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer"
                title="ปิดการแจ้งเตือน"
              >
                <X size={14} />
              </button>
            </div>
          </div>
          
          <h4 className="font-bold text-neutral-800 dark:text-neutral-100 text-xs mt-1.5 truncate">
            คุณ {toast.customerName}
          </h4>
          
          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1 leading-normal line-clamp-2">
            {toast.summary}
          </p>

          {/* Animated Countdown Progress Bar */}
          <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ease-linear rounded-full ${isPaused ? 'bg-amber-500' : 'bg-rose-500'}`} 
              style={{ width: `${(timeLeft / 60) * 100}%` }} 
            />
          </div>

          <div className="flex items-center gap-2 pt-3 mt-3 border-t border-neutral-100 dark:border-neutral-800">
            <button
              onClick={() => {
                getAudioContext();
                playAlertTone(undefined, undefined, true);
              }}
              className="flex items-center justify-center gap-1 bg-indigo-50 dark:bg-indigo-955/40 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/40 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition shadow-sm cursor-pointer"
              title="กดทดสอบเสียงสัญญาณเตือน"
            >
              <Volume2 size={11} />
              <span>ฟังเสียงเตือน</span>
            </button>

            <button
              onClick={onDismiss}
              className="flex-1 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 py-1.5 rounded-lg text-[10px] font-bold transition text-center cursor-pointer"
            >
              รับทราบ
            </button>
            
            <button
              onClick={onViewChat}
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-1.5 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 shadow-sm cursor-pointer"
            >
              ดูแชตนี้ <ArrowRight size={10} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
