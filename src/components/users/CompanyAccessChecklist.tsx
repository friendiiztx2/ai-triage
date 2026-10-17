'use client';

import React from 'react';
import { Building } from 'lucide-react';

interface CompanyAccessChecklistProps {
  role: string;
  companies: any[];
  selectedCompanies: string[];
  onToggleCompany: (companyId: string) => void;
}

export default function CompanyAccessChecklist({
  role,
  companies,
  selectedCompanies,
  onToggleCompany,
}: CompanyAccessChecklistProps) {
  return (
    <div className="space-y-1.5">
      <label className="block font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
        บริษัทสังกัด (Tenant Access)
      </label>
      {role === 'system_admin' ? (
        <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-3.5 font-bold text-neutral-500 dark:text-neutral-400 select-none flex items-center gap-2">
          <Building size={14} className="text-indigo-500" />
          เข้าถึงข้อมูลได้ทุกบริษัท (Global Admin Context)
        </div>
      ) : (
        <div className="space-y-2 border border-neutral-200 dark:border-neutral-700 rounded-xl p-3 bg-neutral-50 dark:bg-neutral-800 max-h-28 overflow-y-auto">
          {companies.map((c) => (
            <label
              key={c.id}
              className="flex items-center gap-2.5 font-semibold text-neutral-700 dark:text-neutral-200 cursor-pointer text-[10px] select-none hover:text-indigo-600 transition"
            >
              <input
                type="checkbox"
                checked={selectedCompanies.includes(c.id)}
                onChange={() => onToggleCompany(c.id)}
                className="w-3.5 h-3.5 text-indigo-600 border-neutral-300 rounded cursor-pointer"
              />
              <span>{c.name}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
