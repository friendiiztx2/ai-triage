import React from 'react';
import { Search, Plus, RefreshCw, Building } from 'lucide-react';
import SelectDropdown from '@/components/ui/SelectDropdown';

export interface UserFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCompany: string;
  onCompanyChange: (value: string) => void;
  companies: any[];
  userProfile: any;
  onRefresh: () => void;
  onOpenAddModal: () => void;
  loading: boolean;
  language?: 'th' | 'en';
}

export default function UserFilterBar({
  searchQuery,
  onSearchChange,
  selectedCompany,
  onCompanyChange,
  companies,
  userProfile,
  onRefresh,
  onOpenAddModal,
  loading,
  language = 'th',
}: UserFilterBarProps) {
  const isSystemAdmin = userProfile?.role === 'system_admin';

  return (
    <div className="relative z-30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/70 p-3 shadow-xs backdrop-blur-md">
      <div className="flex flex-1 items-center gap-2">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" size={13} />
          <input
            type="text"
            placeholder={
              language === 'th'
                ? 'ค้นหาชื่อผู้ใช้, อีเมล หรือสังกัด...'
                : 'Search users, email, tenant...'
            }
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors shadow-xs"
          />
        </div>

        {/* Company Filter (for System Admin) */}
        {isSystemAdmin && companies.length > 0 && (
          <div className="w-44">
            <SelectDropdown
              value={selectedCompany}
              onChange={onCompanyChange}
              icon={<Building size={12} />}
              options={[
                { value: 'all', label: language === 'th' ? 'ทุกบริษัท' : 'All Companies' },
                ...companies.map((c) => ({
                  value: c.id,
                  label: c.name,
                })),
              ]}
            />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 self-end sm:self-center">
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-1.5 border border-neutral-200/80 dark:border-neutral-800/80 rounded-lg bg-white/70 dark:bg-neutral-900/70 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60 transition-colors disabled:opacity-40 cursor-pointer shadow-xs"
          title={language === 'th' ? 'รีเฟรช' : 'Refresh'}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>

        <button
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-medium shadow-xs transition-colors cursor-pointer select-none"
        >
          <Plus size={13} />
          <span>{language === 'th' ? 'เพิ่มผู้ใช้ใหม่' : 'Add User'}</span>
        </button>
      </div>
    </div>
  );
}
