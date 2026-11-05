'use client';

import React from 'react';
import Link from 'next/link';

interface MenuItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface SidebarNavMenuProps {
  items: MenuItem[];
  pathname: string;
  isCollapsed: boolean;
}

export default function SidebarNavMenu({
  items,
  pathname,
  isCollapsed,
}: SidebarNavMenuProps) {
  return (
    <nav className="space-y-0.5">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex items-center rounded-lg text-[13px] font-medium transition-all duration-150 group ${
              isActive
                ? 'bg-[#e8f0fe] dark:bg-blue-950/50 text-[#1a73e8] dark:text-blue-200 font-semibold shadow-2xs'
                : 'text-neutral-600 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60'
            } ${isCollapsed ? 'justify-center p-2.5' : 'gap-2.5 px-2.5 py-1.5'}`}
          >
            <Icon
              size={16}
              className={`shrink-0 transition-colors ${
                isActive
                  ? 'text-[#1a73e8] dark:text-blue-300'
                  : 'text-neutral-400 dark:text-neutral-400 group-hover:text-neutral-800 dark:group-hover:text-white'
              }`}
            />
            {!isCollapsed && <span className="truncate">{item.label}</span>}

            {/* Modern Floating Tooltip on Hover when Sidebar is Collapsed */}
            {isCollapsed && (
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-[9999] pointer-events-none">
                <div className="bg-neutral-900/95 dark:bg-neutral-800/95 text-white text-[12px] font-medium px-2.5 py-1.5 rounded-lg shadow-xl backdrop-blur-md border border-white/10 whitespace-nowrap animate-in fade-in zoom-in-95 duration-150 relative">
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-neutral-900/95 dark:border-r-neutral-800/95" />
                  {item.label}
                </div>
              </div>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
