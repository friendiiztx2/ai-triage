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
            className={`flex items-center rounded-lg text-[13px] font-medium transition-all duration-150 group ${
              isActive
                ? 'bg-[#e8f0fe] dark:bg-blue-950/50 text-[#1a73e8] dark:text-blue-200 font-semibold'
                : 'text-neutral-600 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
            } ${isCollapsed ? 'justify-center p-2' : 'gap-2.5 px-2.5 py-1.5'}`}
            title={isCollapsed ? item.label : ''}
          >
            <Icon
              size={15}
              className={`shrink-0 transition-colors ${
                isActive
                  ? 'text-[#1a73e8] dark:text-blue-300'
                  : 'text-neutral-400 dark:text-neutral-300 group-hover:text-neutral-800 dark:group-hover:text-white'
              }`}
            />
            {!isCollapsed && <span className="truncate">{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
