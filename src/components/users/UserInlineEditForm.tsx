'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Shield, X, Mail } from 'lucide-react';
import SelectDropdown from '@/components/ui/SelectDropdown';
import CompanyAccessChecklist from '@/components/users/CompanyAccessChecklist';
import PermissionsMultiSelect from '@/components/users/PermissionsMultiSelect';

export interface UserInlineEditFormProps {
  user: any;
  userProfile: any;
  companies: any[];
  language?: 'th' | 'en';
  onSave: (updatedData: any) => Promise<boolean>;
  onCancel: () => void;
}

export default function UserInlineEditForm({
  user,
  userProfile,
  companies,
  language = 'th',
  onSave,
  onCancel,
}: UserInlineEditFormProps) {
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [role, setRole] = useState(user.role || 'agent');
  const [password, setPassword] = useState('');
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>(
    Array.isArray(user.company_ids)
      ? user.company_ids
      : user.company_id
      ? [user.company_id]
      : []
  );
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    Array.isArray(user.permissions)
      ? user.permissions
      : ['view_dashboard', 'view_chats']
  );
  const [showDropdown, setShowDropdown] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleCompany = (companyId: string) => {
    setSelectedCompanies((prev) =>
      prev.includes(companyId)
        ? prev.filter((id) => id !== companyId)
        : [...prev, companyId]
    );
  };

  const handleTogglePermission = (permId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId)
        ? prev.filter((id) => id !== permId)
        : [...prev, permId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(language === 'th' ? 'กรุณากรอกชื่อผู้ใช้งาน' : 'Please enter user name');
      return;
    }

    setSaving(true);
    setError(null);

    const payload: any = {
      id: user.id,
      name: name.trim(),
      email: email.trim(),
      role,
      permissions: selectedPermissions,
      company_ids: role === 'system_admin' ? [] : selectedCompanies,
      company_id: role === 'system_admin' ? null : selectedCompanies[0] || null,
    };

    if (password.trim()) {
      payload.password = password.trim();
    }

    const success = await onSave(payload);
    setSaving(false);
    if (!success) {
      setError(language === 'th' ? 'เกิดข้อผิดพลาดในการบันทึก' : 'Failed to save changes');
    }
  };

  const isSuper = userProfile?.role === 'super_admin' || userProfile?.role === 'system_admin';
  const modalCompanyOptions = isSuper
    ? companies
    : companies.filter((c) =>
        (userProfile?.company_id || '').split(',').map((id: string) => id.trim()).includes(c.id)
      );

  return (
    <div className="max-w-xl mx-auto bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-xl">
      <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400">
            <Shield size={16} />
          </div>
          <div>
            <h4 className="font-extrabold text-neutral-800 dark:text-neutral-200 text-xs">
              {language === 'th' ? 'แก้ไขข้อมูลผู้ใช้ & สิทธิ์การเข้าถึง' : 'Edit User & Permissions'}
            </h4>
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">
              ID: {user.id}
            </span>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-955/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold p-3 rounded-xl border border-rose-200/50 dark:border-rose-900/30">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs mt-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider text-[9px]">
              {language === 'th' ? 'ชื่อผู้ใช้งาน' : 'User Name'}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-800 dark:text-neutral-100 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="space-y-1">
            <label className="block font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider text-[9px]">
              {language === 'th' ? 'อีเมล / บัญชีล็อกอิน' : 'Email / Login'}
            </label>
            <div className="relative">
              <Mail className="absolute left-2.5 top-2 text-neutral-400" size={13} />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-neutral-800 dark:text-neutral-100 focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider text-[9px]">
              {language === 'th' ? 'บทบาทหลัก' : 'Role'}
            </label>
            <SelectDropdown
              value={role}
              onChange={setRole}
              size="sm"
              options={[
                ...(userProfile?.role === 'system_admin'
                  ? [{ value: 'system_admin', label: 'System Admin' }]
                  : []),
                { value: 'super_admin', label: 'Super Admin' },
                { value: 'admin', label: 'Admin' },
                { value: 'agent', label: 'Agent / Support' },
              ]}
            />
          </div>

          <div className="space-y-1">
            <label className="block font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider text-[9px]">
              {language === 'th' ? 'เปลี่ยนรหัสผ่าน' : 'Reset Password'}
              <span className="text-[8px] text-neutral-400 normal-case">
                {language === 'th' ? ' (ใช้รหัสเดิมเว้นไว้)' : ' (leave blank to keep)'}
              </span>
            </label>
            <input
              type="password"
              placeholder={language === 'th' ? 'รหัสผ่านใหม่' : 'New password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-800 dark:text-neutral-100 focus:outline-none focus:border-indigo-600"
            />
          </div>
        </div>

        {/* Company Assignment */}
        <CompanyAccessChecklist
          role={role}
          companies={modalCompanyOptions}
          selectedCompanies={selectedCompanies}
          onToggleCompany={handleToggleCompany}
        />

        {/* Permissions multi-select dropdown */}
        <PermissionsMultiSelect
          role={role}
          selectedPermissions={selectedPermissions}
          onTogglePermission={handleTogglePermission}
          showDropdown={showDropdown}
          setShowDropdown={setShowDropdown}
          dropdownRef={dropdownRef}
        />

        {/* Form Actions */}
        <div className="flex gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 mt-1">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-[#1a73e8] hover:bg-[#1557b0] text-white disabled:opacity-40 py-2.5 rounded-lg font-medium shadow-xs transition cursor-pointer text-center text-xs"
          >
            {saving
              ? language === 'th' ? 'กำลังบันทึก...' : 'Saving...'
              : language === 'th' ? 'บันทึกการเปลี่ยนแปลง' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-200 py-2.5 rounded-lg font-medium transition cursor-pointer text-center text-xs"
          >
            {language === 'th' ? 'ยกเลิก' : 'Cancel'}
          </button>
        </div>
      </form>
    </div>
  );
}
