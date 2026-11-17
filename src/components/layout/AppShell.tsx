'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import Sidebar from '@/components/sidebar/Sidebar';
import GlobalNotifier from '@/components/GlobalNotifier';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname.startsWith('/login/');
  // Phones and small tablets: the sidebar is a drawer opened from the top bar
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close the drawer after navigating to another page
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileMenuOpen]);

  if (isAuthPage) {
    return (
      <main className="w-full h-dvh overflow-hidden select-none relative">
        {children}
      </main>
    );
  }

  return (
    <div className="h-dvh w-full overflow-hidden flex bg-[#f8fafc] dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 transition-colors duration-250 relative">
      {/* Subtle Ambient Glows for Frosted Glass Depth */}
      <div className="fixed -top-40 right-1/4 w-[500px] h-[500px] bg-sky-400/[0.04] dark:bg-sky-500/[0.03] rounded-full blur-[140px] pointer-events-none -z-0" />
      <div className="fixed -bottom-40 left-1/3 w-[500px] h-[500px] bg-indigo-500/[0.03] dark:bg-indigo-500/[0.03] rounded-full blur-[140px] pointer-events-none -z-0" />

      {/* Dimmed backdrop behind the mobile drawer; tapping it closes the menu */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-neutral-950/40 backdrop-blur-[2px] md:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />

      {/* Global Realtime Notifier */}
      <GlobalNotifier />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 h-dvh overflow-y-auto overscroll-contain relative z-10 pt-14 md:pt-0">
        {/* Mobile top bar, fixed to the screen so it stays put while the page scrolls.
            z-[45]: above page parts that use z-30/z-40 (e.g. the dashboard filter header),
            below modals (z-50) and the floating chat windows (z-index 100+). */}
        <header className="md:hidden fixed top-0 inset-x-0 z-[45] flex items-center gap-3 h-14 px-4 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="-ml-1.5 p-1.5 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
            aria-label="เปิดเมนู"
            aria-expanded={mobileMenuOpen}
          >
            <Menu size={22} />
          </button>
          <img src="/sift-ai-icon.png" alt="" className="w-7 h-7 object-contain select-none" />
          <span className="font-bold text-neutral-900 dark:text-neutral-100">Sift AI</span>
        </header>

        <main className="p-4 sm:p-6 md:p-8 lg:p-10 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
