'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import GlobalNotifier from '@/components/GlobalNotifier';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname.startsWith('/login/');

  if (isAuthPage) {
    return (
      <main className="w-full h-screen overflow-hidden select-none relative">
        {children}
      </main>
    );
  }

  return (
    <div className="h-screen w-full overflow-hidden flex bg-[#f8fafc] dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 transition-colors duration-250 relative">
      {/* Subtle Ambient Glows for Frosted Glass Depth */}
      <div className="fixed -top-40 right-1/4 w-[500px] h-[500px] bg-sky-400/[0.04] dark:bg-sky-500/[0.03] rounded-full blur-[140px] pointer-events-none -z-0" />
      <div className="fixed -bottom-40 left-1/3 w-[500px] h-[500px] bg-indigo-500/[0.03] dark:bg-indigo-500/[0.03] rounded-full blur-[140px] pointer-events-none -z-0" />

      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Global Realtime Notifier */}
      <GlobalNotifier />

      {/* Main Content Area */}
      <div className="flex-1 h-screen overflow-y-auto relative z-10">
        <main className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
