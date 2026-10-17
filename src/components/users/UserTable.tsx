import React, { useState, useMemo } from 'react';
import { Users, RefreshCw } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import UserTableRow from './UserTableRow';
import SortHeader from '@/components/ui/SortHeader';

export interface UserTableProps {
  users: any[];
  loading: boolean;
  userProfile: any;
  companies: any[];
  expandedPatchUserId: string | null;
  visiblePasswordUserIds: string[];
  language?: 'th' | 'en';
  onTogglePatch: (user: any) => void;
  onDelete: (user: any) => void;
  onTogglePassword: (userId: string) => void;
  onSavePatch: (updatedData: any) => Promise<boolean>;
  onCancelPatch: () => void;
  onOpenAddModal: () => void;
}

type UserSortColumn = 'user' | 'company' | 'role';

export default function UserTable({
  users,
  loading,
  userProfile,
  companies,
  expandedPatchUserId,
  visiblePasswordUserIds,
  language = 'th',
  onTogglePatch,
  onDelete,
  onTogglePassword,
  onSavePatch,
  onCancelPatch,
  onOpenAddModal,
}: UserTableProps) {
  const [sortColumn, setSortColumn] = useState<UserSortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (col: UserSortColumn) => {
    if (sortColumn !== col) {
      setSortColumn(col);
      setSortDirection('asc');
    } else if (sortDirection === 'asc') {
      setSortDirection('desc');
    } else {
      setSortColumn(null);
      setSortDirection('asc');
    }
  };

  const sortedUsers = useMemo(() => {
    if (!sortColumn) return users;
    return [...users].sort((a, b) => {
      let valA = '';
      let valB = '';

      if (sortColumn === 'user') {
        valA = (a.name || a.email || '').toLowerCase();
        valB = (b.name || b.email || '').toLowerCase();
      } else if (sortColumn === 'company') {
        const compA = companies.find((c) => c.id === a.company_id)?.name || a.company_id || '';
        const compB = companies.find((c) => c.id === b.company_id)?.name || b.company_id || '';
        valA = compA.toLowerCase();
        valB = compB.toLowerCase();
      } else if (sortColumn === 'role') {
        valA = (a.role || '').toLowerCase();
        valB = (b.role || '').toLowerCase();
      }

      return sortDirection === 'asc'
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    });
  }, [users, sortColumn, sortDirection, companies]);

  if (loading) {
    return (
      <div className="rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/70 p-24 text-center shadow-xs backdrop-blur-md flex flex-col items-center justify-center gap-2.5 font-mono text-xs text-neutral-400">
        <RefreshCw size={18} className="animate-spin text-neutral-400 dark:text-neutral-600" />
        <p>{language === 'th' ? 'กำลังโหลดข้อมูลสมาชิก...' : 'Loading accounts...'}</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/70 p-12 shadow-xs backdrop-blur-md">
        <EmptyState
          icon={<Users size={28} className="text-neutral-400" />}
          title={language === 'th' ? 'ไม่พบข้อมูลผู้ใช้งาน' : 'No users found'}
          description={
            language === 'th'
              ? 'ไม่พบสมาชิกที่ตรงกับเงื่อนไขการค้นหา คุณสามารถกดปุ่มเพิ่มผู้ใช้งานใหม่ได้'
              : 'No team members matching your filter criteria. You can register a new user.'
          }
          action={
            <button
              onClick={onOpenAddModal}
              className="px-3.5 py-1.5 rounded-lg bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-medium transition-colors shadow-xs cursor-pointer"
            >
              {language === 'th' ? 'เพิ่มผู้ใช้งานใหม่' : 'Add New User'}
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/70 overflow-hidden shadow-xs backdrop-blur-md">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-neutral-50/70 dark:bg-neutral-900/60 border-b border-neutral-200/80 dark:border-neutral-800/80">
              <th className="px-4 py-3">
                <SortHeader
                  label={language === 'th' ? 'ผู้ใช้งาน & อีเมล' : 'User & Email'}
                  active={sortColumn === 'user'}
                  direction={sortDirection}
                  onSort={() => handleSort('user')}
                />
              </th>
              <th className="px-4 py-3">
                <SortHeader
                  label={language === 'th' ? 'สังกัดบริษัท' : 'Tenant Company'}
                  active={sortColumn === 'company'}
                  direction={sortDirection}
                  onSort={() => handleSort('company')}
                />
              </th>
              <th className="px-4 py-3">
                <SortHeader
                  label={language === 'th' ? 'บทบาท' : 'Role'}
                  active={sortColumn === 'role'}
                  direction={sortDirection}
                  onSort={() => handleSort('role')}
                />
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                {language === 'th' ? 'ขอบเขตสิทธิ์' : 'Privileges'}
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                {language === 'th' ? 'รหัสผ่าน' : 'Credentials'}
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                {language === 'th' ? 'จัดการ' : 'Actions'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 text-neutral-700 dark:text-neutral-300">
            {sortedUsers.map((u) => (
              <UserTableRow
                key={u.id}
                user={u}
                userProfile={userProfile}
                companies={companies}
                isPatchActive={expandedPatchUserId === u.id}
                isPasswordVisible={visiblePasswordUserIds.includes(u.id)}
                language={language}
                onTogglePatch={onTogglePatch}
                onDelete={onDelete}
                onTogglePassword={onTogglePassword}
                onSavePatch={onSavePatch}
                onCancelPatch={onCancelPatch}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
