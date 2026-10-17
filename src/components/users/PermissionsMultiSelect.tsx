'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';
import { PERMISSIONS_LIST, getPermissionLabel } from '@/lib/permissions';

interface PermissionsMultiSelectProps {
  role: string;
  selectedPermissions: string[];
  onTogglePermission: (permissionId: string) => void;
  showDropdown: boolean;
  setShowDropdown: (val: boolean) => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
}

export default function PermissionsMultiSelect({
  role,
  selectedPermissions,
  onTogglePermission,
  showDropdown,
  setShowDropdown,
  dropdownRef,
}: PermissionsMultiSelectProps) {
  return (
    <div className="space-y-1 relative" ref={dropdownRef}>
      <label className="block font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
        กำหนดสิทธิ์เข้าใช้งานฟังก์ชันต่างๆ
      </label>
      <button
        type="button"
        onClick={() => setShowDropdown(!showDropdown)}
        className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-neutral-800 dark:text-neutral-100 focus:outline-none focus:border-indigo-600 transition"
      >
        <span className="truncate">
          {selectedPermissions.length === 0
            ? 'เลือกสิทธิ์การเข้าถึง...'
            : `เลือกแล้ว ${selectedPermissions.length} สิทธิ์ (${selectedPermissions.map((p) => getPermissionLabel(p)).join(', ')})`}
        </span>
        <ChevronDown size={14} className="text-neutral-400 shrink-0 ml-1" />
      </button>

      {showDropdown && (
        <div className="w-full mt-2 bg-white dark:bg-neutral-900 border-2 border-indigo-500/20 dark:border-indigo-500/40 rounded-xl p-2.5 space-y-2 max-h-56 overflow-y-auto shadow-xl">
          {PERMISSIONS_LIST.map((p) => {
            const isDisabled = p.requireSystemAdmin && role !== 'system_admin';
            const isChecked = selectedPermissions.includes(p.id);

            return (
              <label
                key={p.id}
                className={`flex items-start gap-3 p-2.5 rounded-lg transition text-xs font-semibold select-none ${
                  isDisabled
                    ? 'opacity-30 cursor-not-allowed bg-neutral-50 dark:bg-neutral-900/15'
                    : isChecked
                    ? 'bg-indigo-50/50 text-indigo-700 dark:bg-indigo-955/20 dark:text-indigo-400 cursor-pointer'
                    : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800 cursor-pointer'
                }`}
              >
                <input
                  type="checkbox"
                  disabled={isDisabled}
                  checked={isChecked}
                  onChange={() => onTogglePermission(p.id)}
                  className="w-4 h-4 mt-0.5 text-indigo-600 border-neutral-300 rounded cursor-pointer disabled:cursor-not-allowed shrink-0"
                />
                <div className="min-w-0">
                  <span className="block leading-normal font-extrabold">{p.label}</span>
                  <span className="block text-[9px] text-neutral-400 dark:text-neutral-500 font-medium leading-normal mt-0.5">
                    {p.description}
                  </span>
                </div>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
