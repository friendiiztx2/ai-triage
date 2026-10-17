'use client';

import React from 'react';
import { Sun, Moon, LogOut, Languages } from 'lucide-react';

interface SidebarFooterProps {
  isCollapsed: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  userProfile: any;
  language: string;
  onToggleLanguage: () => void;
  onLogout: () => void;
  t: (key: string) => string;
}

export default function SidebarFooter({
  isCollapsed,
  theme,
  onToggleTheme,
  userProfile,
  language,
  onToggleLanguage,
  onLogout,
  t,
}: SidebarFooterProps) {
  const initial = userProfile?.name?.charAt(0).toUpperCase() || 'A';
  const roleDisplay = userProfile?.role?.replace('_', ' ') || 'admin';

  return (
    <div className={`border-t border-neutral-200/80 dark:border-neutral-800/80 ${isCollapsed ? 'p-2 flex flex-col items-center gap-2' : 'p-3 flex flex-col gap-2.5'}`}>
      {/* 1. Profile Section (Top) */}
      <div className={`flex items-center gap-2.5 min-w-0 ${isCollapsed ? 'justify-center' : 'w-full'}`}>
        <div className="relative shrink-0">
          <div className="w-8 h-8 rounded-full bg-[#1a73e8] text-white flex items-center justify-center text-xs font-semibold shadow-xs">
            {initial}
          </div>
          {/* Subtle Live Supabase connection indicator */}
          <span 
            className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-neutral-900" 
            title="Connected to Supabase"
          />
        </div>

        {!isCollapsed && (
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate leading-tight" title={userProfile?.name || 'Administrator'}>
              {userProfile?.name || 'Administrator'}
            </p>
            <p className="text-[10px] font-medium text-neutral-400 dark:text-neutral-300 capitalize truncate leading-tight mt-0.5">
              {roleDisplay}
            </p>
          </div>
        )}
      </div>

      {/* 2. Action Icons (Bottom) */}
      <div className={`w-full flex items-center ${isCollapsed ? 'flex-col gap-1.5' : 'justify-between gap-1 pt-2 border-t border-neutral-200/60 dark:border-neutral-800/60'}`}>
        <button
          onClick={onToggleLanguage}
          className={`h-7 px-1.5 rounded-lg flex items-center justify-center gap-1 text-[11px] font-mono font-medium text-neutral-400 dark:text-neutral-300 hover:text-neutral-800 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${!isCollapsed ? 'flex-1' : ''}`}
          title={language === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}
        >
          <Languages size={13} className="shrink-0" />
          {!isCollapsed && (
            <span className="uppercase text-[10px] font-bold tracking-wider">{language}</span>
          )}
        </button>

        <button
          onClick={onToggleTheme}
          className={`h-7 px-1.5 rounded-lg flex items-center justify-center text-neutral-400 dark:text-neutral-300 hover:text-neutral-800 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${!isCollapsed ? 'flex-1' : ''}`}
          title={theme === 'light' ? t('themeLight') : t('themeDark')}
        >
          {theme === 'light' ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        <button
          onClick={onLogout}
          className={`h-7 px-1.5 rounded-lg flex items-center justify-center text-neutral-400 dark:text-neutral-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/[0.08] transition-colors cursor-pointer ${!isCollapsed ? 'flex-1' : ''}`}
          title={t('logout')}
        >
          <LogOut size={14} />
        </button>
      </div>
    </div>
  );
}
