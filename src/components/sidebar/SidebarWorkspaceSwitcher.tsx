'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronsUpDown, Check } from 'lucide-react';

interface SidebarWorkspaceSwitcherProps {
  companies: any[];
  activeCompany: string;
  onCompanyChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  userProfile: any;
  isCollapsed: boolean;
}

export default function SidebarWorkspaceSwitcher({
  companies,
  activeCompany,
  onCompanyChange,
  userProfile,
  isCollapsed,
}: SidebarWorkspaceSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isSystemAdmin = userProfile?.role === 'system_admin';
  const allowedIds = isSystemAdmin
    ? companies.map((c) => c.id)
    : (userProfile?.company_id || '').split(',').map((id: string) => id.trim()).filter(Boolean);

  const availableCompanies = isSystemAdmin
    ? [{ id: 'all', name: 'ทุกบริษัท' }, ...companies]
    : companies.filter((c) => allowedIds.includes(c.id));

  const showDropdown = isSystemAdmin || allowedIds.length > 1;
  const currentCompany =
    !activeCompany || activeCompany === 'all' || activeCompany === 'null'
      ? isSystemAdmin
        ? 'ทุกบริษัท'
        : userProfile?.company_name || 'Enterprise'
      : companies.find((c) => c.id === activeCompany)?.name || userProfile?.company_name || 'Enterprise';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (isCollapsed) {
    return (
      <div className="flex items-center justify-center mb-6">
        <img
          src="/sift-ai-icon.png"
          alt="Sift AI"
          className="w-10 h-10 object-contain select-none hover:scale-105 transition-transform"
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`mb-6 relative ${isOpen ? 'z-50' : 'z-10'}`}>
      <div 
        onClick={() => {
          if (showDropdown) setIsOpen((prev) => !prev);
        }}
        className={`flex items-center justify-between p-2 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/80 dark:bg-neutral-800/50 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/80 transition-all group shadow-2xs ${
          showDropdown ? 'cursor-pointer' : 'cursor-default'
        } ${isOpen ? 'ring-2 ring-brand-600/20 border-brand-600/50' : ''}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src="/sift-ai-icon.png"
            alt="Sift AI"
            className="w-11 h-11 object-contain select-none shrink-0 drop-shadow-xs transition-transform group-hover:scale-105"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-xs text-neutral-900 dark:text-white leading-tight tracking-tight">
                Sift AI
              </span>
              <span className="text-xs font-semibold px-1.5 py-0.2 rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-600/20">
                Pro
              </span>
            </div>
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-300 truncate leading-tight mt-0.5">
              {currentCompany}
            </p>
          </div>
        </div>

        {showDropdown && (
          <ChevronsUpDown size={14} className={`text-neutral-400 group-hover:text-neutral-600 dark:text-neutral-300 dark:group-hover:text-white shrink-0 ml-1 transition-all ${isOpen ? 'text-brand-600' : ''}`} />
        )}
      </div>

      {/* Google Workspace Styled Custom Popover Dropdown */}
      {showDropdown && isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-[9999] bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200/90 dark:border-neutral-800 shadow-[0_16px_40px_-4px_rgba(0,0,0,0.3)] p-1.5 space-y-1 animate-scale-in">
          <div className="px-2.5 py-1 text-xs font-semibold text-neutral-400 dark:text-neutral-400 uppercase tracking-wider">
            พื้นที่ทำงาน
          </div>
          <div className="max-h-56 overflow-y-auto space-y-0.5">
            {availableCompanies.map((c) => {
              const isSelected = c.id === activeCompany;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onCompanyChange({ target: { value: c.id } } as any);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                    isSelected
                      ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/70 dark:text-brand-300 font-semibold'
                      : 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100/80 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white font-medium'
                  }`}
                >
                  <span className="truncate">{c.name}</span>
                  {isSelected && (
                    <Check size={14} className="text-brand-600 dark:text-brand-300 shrink-0 ml-2 stroke-[2.5]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
