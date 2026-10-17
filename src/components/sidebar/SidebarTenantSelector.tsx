'use client';

import React from 'react';
import SelectDropdown from '@/components/ui/SelectDropdown';

interface SidebarTenantSelectorProps {
  companies: any[];
  activeCompany: string;
  onCompanyChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  userProfile: any;
  tenantLabel: string;
  language: string;
}

export default function SidebarTenantSelector({
  companies,
  activeCompany,
  onCompanyChange,
  userProfile,
  tenantLabel,
  language,
}: SidebarTenantSelectorProps) {
  const isSystemAdmin = userProfile?.role === 'system_admin';
  const allowedIds = isSystemAdmin 
    ? companies.map((c) => c.id)
    : (userProfile?.company_id || '').split(',').map((id: string) => id.trim()).filter(Boolean);

  const showDropdown = isSystemAdmin || allowedIds.length > 1;
  const filteredCompanies = isSystemAdmin 
    ? companies 
    : companies.filter((c) => allowedIds.includes(c.id));

  const options = filteredCompanies.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  return (
    <div className="mb-6 px-1">
      <label className="block text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1.5">
        {tenantLabel}
      </label>
      {showDropdown ? (
        companies.length > 0 ? (
          <SelectDropdown
            value={activeCompany}
            onChange={(val) => onCompanyChange({ target: { value: val } } as any)}
            options={options}
            placeholder={language === 'th' ? 'เลือกบริษัท...' : 'Select company...'}
          />
        ) : (
          <div className="w-full bg-neutral-50/50 dark:bg-neutral-900/40 border border-neutral-200/60 dark:border-neutral-800/60 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-400">
            {language === 'th' ? 'กำลังโหลดบริษัท...' : 'Loading companies...'}
          </div>
        )
      ) : (
        <div className="bg-neutral-50/80 dark:bg-neutral-900/50 border border-neutral-200/60 dark:border-neutral-800/60 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-200 select-none">
          {companies.find((c) => c.id === activeCompany)?.name || userProfile?.company_name || 'บริษัท'}
        </div>
      )}
    </div>
  );
}
