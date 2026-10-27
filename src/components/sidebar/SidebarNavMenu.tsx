'use client';

import React from 'react';
import Link from 'next/link';

export interface MenuItem {
  href: string;
  label: string;
  icon: React.ElementType;
  group?: string;
  badge?: string | number;
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
  // Group items by their group label while preserving order
  const groups: { title: string; items: MenuItem[] }[] = [];
  items.forEach((item) => {
    const groupTitle = item.group || '';
    const existing = groups.find((g) => g.title === groupTitle);
    if (existing) {
      existing.items.push(item);
    } else {
      groups.push({ title: groupTitle, items: [item] });
    }
  });

  return (
    <nav className="space-y-3.5">
      {groups.map((group, gIdx) => (
        <div key={group.title || gIdx} className="space-y-0.5">
          {!isCollapsed && group.title && (
            <div className="px-2.5 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 select-none">
              {group.title}
            </div>
          )}
          {isCollapsed && gIdx > 0 && (
            <div className="my-1.5 border-t border-neutral-200/70 dark:border-neutral-800/70" />
          )}

          {group.items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between rounded-lg text-[13px] font-medium transition-all duration-150 group ${
                  isActive
                    ? 'bg-[#e8f0fe] dark:bg-blue-950/50 text-[#1a73e8] dark:text-blue-200 font-semibold shadow-2xs'
                    : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60'
                } ${isCollapsed ? 'justify-center p-2' : 'px-2.5 py-1.5'}`}
                title={isCollapsed ? item.label : ''}
              >
                <div className={`flex items-center min-w-0 ${isCollapsed ? '' : 'gap-2.5'}`}>
                  <Icon
                    size={15}
                    className={`shrink-0 transition-colors ${
                      isActive
                        ? 'text-[#1a73e8] dark:text-blue-300'
                        : 'text-neutral-400 dark:text-neutral-400 group-hover:text-neutral-800 dark:group-hover:text-white'
                    }`}
                  />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!isCollapsed && item.badge !== undefined && (
                  <span
                    className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                      isActive
                        ? 'bg-[#1a73e8] text-white'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
