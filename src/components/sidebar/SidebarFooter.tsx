'use client';

import React, { useState } from 'react';
import { Sun, Moon, LogOut, Languages, Pencil } from 'lucide-react';
import EditProfileModal from '@/components/profile/EditProfileModal';

interface SidebarFooterProps {
  isCollapsed: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  userProfile: any;
  language: string;
  onToggleLanguage: () => void;
  onLogout: () => void;
  t: (key: string) => string;
  onProfileUpdated?: (updatedUser: any) => void;
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
  onProfileUpdated,
}: SidebarFooterProps) {
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  const displayName = userProfile?.name || 'Administrator';
  const initial = displayName.charAt(0).toUpperCase() || 'A';
  const roleDisplay = userProfile?.role?.replace('_', ' ') || 'admin';
  const avatarUrl = userProfile?.avatar || userProfile?.preferences?.avatar || userProfile?.avatar_url || null;

  return (
    <>
      <div className={`border-t border-neutral-200/80 dark:border-neutral-800/80 ${isCollapsed ? 'p-2 flex flex-col items-center gap-2' : 'p-3 flex flex-col gap-2.5'}`}>
        {/* 1. Profile Section (Clickable to open Edit Profile Modal) */}
        <div 
          onClick={() => setIsEditProfileOpen(true)}
          className={`relative group flex items-center gap-2.5 min-w-0 p-1.5 -mx-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-all cursor-pointer ${isCollapsed ? 'justify-center' : 'w-full'}`}
          title={!isCollapsed ? 'คลิกเพื่อแก้ไขรูปโปรไฟล์ / เปลี่ยนชื่อเล่น / เปลี่ยนรหัสผ่าน' : ''}
        >
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-[#1a73e8] text-white flex items-center justify-center text-xs font-semibold shadow-xs border border-neutral-200/60 dark:border-neutral-700/60">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{initial}</span>
              )}
            </div>
            {/* Live Supabase connection indicator */}
            <span 
              className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-neutral-900" 
              title="Connected to Supabase"
            />
          </div>

          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" title={displayName}>
                  {displayName}
                </p>
                <Pencil size={11} className="text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0" />
              </div>
              <p className="text-[10px] font-medium text-neutral-400 dark:text-neutral-300 capitalize truncate leading-tight mt-0.5">
                {roleDisplay}
              </p>
            </div>
          )}

          {/* Floating Tooltip when Collapsed */}
          {isCollapsed && (
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-[9999] pointer-events-none">
              <div className="bg-neutral-900/95 dark:bg-neutral-800/95 text-white text-[12px] font-medium px-2.5 py-1.5 rounded-lg shadow-xl backdrop-blur-md border border-white/10 whitespace-nowrap animate-in fade-in zoom-in-95 duration-150 relative">
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-neutral-900/95 dark:border-r-neutral-800/95" />
                {displayName} (จัดการข้อมูลส่วนตัว)
              </div>
            </div>
          )}
        </div>

        {/* 2. Action Icons (Bottom) */}
        <div className={`w-full flex items-center ${isCollapsed ? 'flex-col gap-1.5' : 'justify-between gap-1 pt-2 border-t border-neutral-200/60 dark:border-neutral-800/60'}`}>
          <div className="relative group">
            <button
              onClick={onToggleLanguage}
              className={`h-7 px-1.5 rounded-lg flex items-center justify-center gap-1 text-[11px] font-mono font-medium text-neutral-400 dark:text-neutral-300 hover:text-neutral-800 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${!isCollapsed ? 'flex-1' : 'w-7'}`}
              title={!isCollapsed ? (language === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย') : ''}
            >
              <Languages size={13} className="shrink-0" />
              {!isCollapsed && (
                <span className="uppercase text-[10px] font-bold tracking-wider">{language}</span>
              )}
            </button>
            {isCollapsed && (
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-[9999] pointer-events-none">
                <div className="bg-neutral-900/95 dark:bg-neutral-800/95 text-white text-[12px] font-medium px-2.5 py-1.5 rounded-lg shadow-xl backdrop-blur-md border border-white/10 whitespace-nowrap animate-in fade-in zoom-in-95 duration-150 relative">
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-neutral-900/95 dark:border-r-neutral-800/95" />
                  {language === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}
                </div>
              </div>
            )}
          </div>

          <div className="relative group">
            <button
              onClick={onToggleTheme}
              className={`h-7 px-1.5 rounded-lg flex items-center justify-center text-neutral-400 dark:text-neutral-300 hover:text-neutral-800 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${!isCollapsed ? 'flex-1' : 'w-7'}`}
              title={!isCollapsed ? (theme === 'light' ? t('themeLight') : t('themeDark')) : ''}
            >
              {theme === 'light' ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            {isCollapsed && (
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-[9999] pointer-events-none">
                <div className="bg-neutral-900/95 dark:bg-neutral-800/95 text-white text-[12px] font-medium px-2.5 py-1.5 rounded-lg shadow-xl backdrop-blur-md border border-white/10 whitespace-nowrap animate-in fade-in zoom-in-95 duration-150 relative">
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-neutral-900/95 dark:border-r-neutral-800/95" />
                  {theme === 'light' ? t('themeLight') : t('themeDark')}
                </div>
              </div>
            )}
          </div>

          <div className="relative group">
            <button
              onClick={onLogout}
              className={`h-7 px-1.5 rounded-lg flex items-center justify-center text-neutral-400 dark:text-neutral-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/[0.08] transition-colors cursor-pointer ${!isCollapsed ? 'flex-1' : 'w-7'}`}
              title={!isCollapsed ? t('logout') : ''}
            >
              <LogOut size={14} />
            </button>
            {isCollapsed && (
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-[9999] pointer-events-none">
                <div className="bg-neutral-900/95 dark:bg-neutral-800/95 text-white text-[12px] font-medium px-2.5 py-1.5 rounded-lg shadow-xl backdrop-blur-md border border-white/10 whitespace-nowrap animate-in fade-in zoom-in-95 duration-150 relative">
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-neutral-900/95 dark:border-r-neutral-800/95" />
                  {t('logout')}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Developer Attribution Footer */}
        {!isCollapsed && (
          <div className="pt-1 flex flex-col items-center justify-center gap-0.5 text-center select-none border-t border-neutral-200/40 dark:border-neutral-800/40">
            <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500">
              {t('systemDeveloper')}
            </span>
            <span className="text-[9px] text-neutral-400/60 dark:text-neutral-600 font-mono tracking-wider">
              v3.0 • Sift AI Backoffice
            </span>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        userProfile={userProfile}
        onProfileUpdated={(updated) => {
          if (onProfileUpdated) onProfileUpdated(updated);
        }}
      />
    </>
  );
}
