'use client';

import React from 'react';
import { Minus, Square, X, User, ChevronLeft, ChevronRight } from 'lucide-react';

interface FloatingChatHeaderProps {
  chat: any;
  customerInfo: any;
  isMinimized: boolean;
  setIsMinimized: (val: boolean) => void;
  isMaximized: boolean;
  setIsMaximized: (val: boolean) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onClose: () => void;
  currentIndex?: number;
  totalChatsCount?: number;
  onNavigatePrev?: () => void;
  onNavigateNext?: () => void;
}

export default function FloatingChatHeader({
  chat,
  customerInfo,
  isMinimized,
  setIsMinimized,
  isMaximized,
  setIsMaximized,
  onMouseDown,
  onClose,
  currentIndex,
  totalChatsCount,
  onNavigatePrev,
  onNavigateNext,
}: FloatingChatHeaderProps) {
  const customerDisplayName =
    customerInfo?.name ||
    chat.customer_name ||
    (`ลูกค้า #${chat.customer_id || chat.id?.substring(0, 8)}`);

  return (
    <div 
      onMouseDown={onMouseDown}
      className="px-3.5 py-2.5 bg-white dark:bg-neutral-900 border-b border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between cursor-move select-none shrink-0"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 flex items-center justify-center shrink-0 border border-neutral-200/80 dark:border-neutral-700">
          <User size={12} />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs truncate">
            {customerDisplayName}
          </h3>
        </div>
        <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500 shrink-0">
          #{chat.id?.substring(0, 8)}
        </span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {/* Next / Prev Chat Navigation */}
        {totalChatsCount !== undefined && totalChatsCount > 1 && (
          <div className="flex items-center gap-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5 border border-neutral-200/80 dark:border-neutral-700/80 font-mono text-[10px]">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNavigatePrev?.();
              }}
              disabled={!onNavigatePrev}
              className="w-5 h-5 rounded hover:bg-white dark:hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
              title="แชตก่อนหน้า"
            >
              <ChevronLeft size={12} />
            </button>
            {currentIndex !== undefined && currentIndex >= 0 && (
              <span className="text-neutral-500 dark:text-neutral-400 px-1 font-medium select-none">
                {currentIndex + 1} / {totalChatsCount}
              </span>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNavigateNext?.();
              }}
              disabled={!onNavigateNext}
              className="w-5 h-5 rounded hover:bg-white dark:hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
              title="แชตถัดไป"
            >
              <ChevronRight size={12} />
            </button>
          </div>
        )}
        {/* Minimize button */}
        <button 
          type="button"
          onClick={() => {
            setIsMinimized(!isMinimized);
            if (isMaximized) setIsMaximized(false);
          }}
          className="w-6 h-6 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 flex items-center justify-center transition cursor-pointer"
          title={isMinimized ? 'ขยายหน้าต่าง' : 'ย่อหน้าต่าง'}
        >
          <Minus size={12} />
        </button>

        {/* Maximize button */}
        <button 
          type="button"
          onClick={() => {
            setIsMaximized(!isMaximized);
            setIsMinimized(false);
          }}
          className="w-6 h-6 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 flex items-center justify-center transition cursor-pointer"
          title={isMaximized ? 'ย่อกลับขนาดปกติ' : 'ขยายเต็มหน้าจอ'}
        >
          <Square size={10} />
        </button>
        
        {/* Close button */}
        <button 
          type="button"
          onClick={onClose}
          className="w-6 h-6 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center transition cursor-pointer"
          title="ปิด"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}
