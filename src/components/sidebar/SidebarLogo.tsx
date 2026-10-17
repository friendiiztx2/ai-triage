'use client';

import React from 'react';

interface SidebarLogoProps {
  isCollapsed: boolean;
}

export default function SidebarLogo({ isCollapsed }: SidebarLogoProps) {
  return (
    <div className={`flex items-center mb-7 ${isCollapsed ? 'justify-center gap-0' : 'gap-3'}`}>
      <div className="relative group cursor-pointer shrink-0">
        <div className="relative flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
          <img
            src="/sift-ai-logo.png"
            alt="Sift AI Logo"
            className="w-9 h-9 object-contain drop-shadow-md select-none"
          />
        </div>
      </div>

      {!isCollapsed && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-neutral-900 dark:text-white text-base leading-none tracking-tight font-sans">
              Sift AI
            </h1>
            <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-[#e8f0fe] text-[#1a73e8] dark:bg-blue-950/60 dark:text-blue-300 border border-[#1a73e8]/20 tracking-wider uppercase">
              Back Office
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
