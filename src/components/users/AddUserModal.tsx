'use client';

import React, { useState, useEffect, useRef } from 'react';
import { UserPlus, Mail, Key, Shield } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import SelectDropdown from '@/components/ui/SelectDropdown';
import { saveAuditLog } from '@/lib/audit';

import RolePermissionExplainer from '@/components/users/RolePermissionExplainer';
import CompanyAccessChecklist from '@/components/users/CompanyAccessChecklist';
import PermissionsMultiSelect from '@/components/users/PermissionsMultiSelect';

export interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: any[];
  userProfile: any;
  language?: 'th' | 'en';
  onUserCreated: (newUser: any) => void;
}

export default function AddUserModal({
  isOpen,
  onClose,
  companies,
  userProfile,
  language = 'th',
  onUserCreated,
}: AddUserModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('agent');
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    'view_dashboard',
    'view_chats',
  ]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setEmail('');
      setPassword('');
      setRole('agent');
      setSelectedCompanies([]);
      setSelectedPermissions(['view_dashboard', 'view_chats']);
      setShowDropdown(false);
      setError(null);
      setSaving(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleCompany = (companyId: string) => {
    setSelectedCompanies((prev) =>
      prev.includes(companyId) ? prev.filter((id) => id !== companyId) : [...prev, companyId]
    );
  };

  const handleTogglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !role || !password) {
      setError('กรุณากรอกชื่อผู้ใช้ บทบาท และรหัสผ่าน');
      return;
    }
    if (password.length < 4 || !/[a-zA-Z]/.test(password)) {
      setError(
        language === 'th'
          ? 'รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร และต้องมีตัวอักษรภาษาอังกฤษอย่างน้อย 1 ตัว'
          : 'Password must be at least 4 characters and contain at least one English letter (a-z/A-Z)'
      );
      return;
    }
    if (role !== 'system_admin' && selectedCompanies.length === 0) {
      setError('กรุณาเลือกบริษัทสังกัด');
      return;
    }

    setSaving(true);
    setError(null);

    const submitEmail = email.trim() !== '' ? email.trim() : name.trim();
    const companyIdPayload = role === 'system_admin' ? null : selectedCompanies.join(',');

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: submitEmail,
          role,
          company_id: companyIdPayload,
          password,
          permissions: selectedPermissions,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add user');

      onUserCreated(data);
      await saveAuditLog('CREATE', `เพิ่มผู้ใช้งานใหม่: ${name.trim()} (บทบาท: ${role})`);
      alert('เพิ่มผู้ใช้งานใหม่สำเร็จ!');
      onClose();
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="เพิ่มบัญชีผู้ใช้งานใหม่"
      subtitle="กรอกประวัติข้อมูลผู้ใช้ พร้อมตั้งค่าสิทธิ์ Checklist ย่อยรายแผนก"
      icon={<UserPlus size={20} />}
      maxWidth="md"
    >
      <div className="p-6">
        {error && (
          <div className="bg-rose-50 dark:bg-rose-955/20 text-rose-600 dark:text-rose-500 text-[10px] font-bold p-3.5 rounded-xl border border-rose-200/50 dark:border-rose-900/30 mb-4 leading-normal">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                ชื่อผู้ใช้ (Name)
              </label>
              <input
                type="text"
                required
                placeholder="เช่น สมหมาย เจริญดี"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3.5 py-2.5 focus:border-indigo-600 focus:outline-none font-semibold text-neutral-800 dark:text-neutral-100"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                ชื่อบัญชีล็อกอิน / อีเมล
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 text-neutral-400" size={14} />
                <input
                  type="text"
                  placeholder="เช่น sommai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl pl-9 pr-3.5 py-2.5 focus:border-indigo-600 focus:outline-none font-semibold text-neutral-800 dark:text-neutral-100"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                รหัสผ่านเริ่มต้น
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-2.5 text-neutral-400" size={14} />
                <input
                  type="password"
                  required
                  placeholder={
                    language === 'th'
                      ? 'ขั้นต่ำ 4 ตัวอักษร (ต้องมีตัวอักษร)'
                      : 'Min 4 characters (must contain letters)'
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl pl-9 pr-3.5 py-2.5 focus:border-indigo-600 focus:outline-none font-semibold text-neutral-800 dark:text-neutral-100"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                บทบาทหลัก (Role)
              </label>
              <SelectDropdown
                value={role}
                onChange={setRole}
                icon={<Shield size={14} />}
                size="md"
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
          </div>

          {/* Dynamic Role Permission Explainer */}
          <RolePermissionExplainer role={role} />

          {/* Checklist of companies (select multiple) */}
          <CompanyAccessChecklist
            role={role}
            companies={companies}
            selectedCompanies={selectedCompanies}
            onToggleCompany={handleToggleCompany}
          />

          {/* Permissions Multi-Select Dropdown */}
          <PermissionsMultiSelect
            role={role}
            selectedPermissions={selectedPermissions}
            onTogglePermission={handleTogglePermission}
            showDropdown={showDropdown}
            setShowDropdown={setShowDropdown}
            dropdownRef={dropdownRef}
          />

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[#1a73e8] hover:bg-[#1557b0] text-white disabled:opacity-40 py-2.5 rounded-lg font-medium text-xs shadow-xs transition cursor-pointer text-center block mt-2"
          >
            {saving ? 'กำลังบันทึกข้อมูล...' : 'ยืนยันสร้างบัญชีใหม่'}
          </button>
        </form>
      </div>
    </Modal>
  );
}
