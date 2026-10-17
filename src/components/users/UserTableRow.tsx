import React from 'react';
import { Edit2, Trash2, Eye, EyeOff, Building } from 'lucide-react';
import { getPermissionLabel } from '@/lib/permissions';
import UserInlineEditForm from './UserInlineEditForm';

export interface UserTableRowProps {
  user: any;
  userProfile: any;
  companies: any[];
  isPatchActive: boolean;
  isPasswordVisible: boolean;
  language?: 'th' | 'en';
  onTogglePatch: (user: any) => void;
  onDelete: (user: any) => void;
  onTogglePassword: (userId: string) => void;
  onSavePatch: (updatedData: any) => Promise<boolean>;
  onCancelPatch: () => void;
}

export default function UserTableRow({
  user,
  userProfile,
  companies,
  isPatchActive,
  isPasswordVisible,
  language = 'th',
  onTogglePatch,
  onDelete,
  onTogglePassword,
  onSavePatch,
  onCancelPatch,
}: UserTableRowProps) {
  // Resolve company label
  const getCompanyLabel = () => {
    if (user.role === 'system_admin') {
      return language === 'th' ? 'ดูแลระบบทั้งหมด (Global)' : 'All Companies (Global)';
    }
    if (user.company_name) return user.company_name;
    const found = companies.find((c) => c.id === user.company_id);
    if (found) return found.name;
    return language === 'th' ? 'ไม่ระบุสังกัด' : 'Unassigned';
  };

  // Google-inspired deterministic avatar background color
  const getGoogleAvatarColor = (str: string) => {
    const palette = [
      'bg-[#1a73e8] text-white', // Google Blue
      'bg-[#00796b] text-white', // Google Teal
      'bg-[#188038] text-white', // Google Green
      'bg-[#8e24aa] text-white', // Google Purple
      'bg-[#e65100] text-white', // Google Deep Orange
      'bg-[#0b57d0] text-white', // Google Dark Blue
      'bg-[#d93025] text-white', // Google Red
    ];
    let hash = 0;
    const key = str || 'Admin';
    for (let i = 0; i < key.length; i++) {
      hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }
    return palette[Math.abs(hash) % palette.length];
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'system_admin':
        return (
          <span className="inline-flex items-center text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded font-medium bg-[#e8f0fe] text-[#1a73e8] border border-[#d2e3fc] dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800">
            system_admin
          </span>
        );
      case 'super_admin':
        return (
          <span className="inline-flex items-center text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded font-medium bg-[#f3e8fd] text-[#8430ce] border border-[#e1c5fb] dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800">
            super_admin
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded font-medium bg-[#e0f2f1] text-[#00695c] border border-[#b2dfdb] dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800">
            admin
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded font-medium bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
            {role || 'agent'}
          </span>
        );
    }
  };

  const initial = (user.name || user.email || 'U').charAt(0).toUpperCase();
  const avatarBg = getGoogleAvatarColor(user.name || user.email || 'U');

  return (
    <React.Fragment>
      <tr className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-[background-color] duration-150 text-xs">
        {/* User Identity */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-full ${avatarBg} flex items-center justify-center font-mono font-semibold text-xs shrink-0 shadow-2xs`}>
              {initial}
            </div>
            <div className="min-w-0">
              <span className="font-medium text-neutral-900 dark:text-neutral-100 block truncate">
                {user.name}
              </span>
              <span className="text-[11px] font-mono text-neutral-400 block truncate">
                {user.email}
              </span>
            </div>
          </div>
        </td>

        {/* Company */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
            <Building size={12} className="text-neutral-400 shrink-0" />
            <span className="truncate max-w-[150px]">{getCompanyLabel()}</span>
          </div>
        </td>

        {/* Role */}
        <td className="px-4 py-3 whitespace-nowrap">
          {getRoleBadge(user.role)}
        </td>

        {/* Permissions */}
        <td className="px-4 py-3">
          <div className="flex flex-wrap items-center gap-1 max-w-[200px]">
            {Array.isArray(user.permissions) && user.permissions.length > 0 ? (
              <>
                {user.permissions.slice(0, 2).map((perm: string) => (
                  <span
                    key={perm}
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200/60 dark:border-neutral-700/60"
                  >
                    {getPermissionLabel(perm, true)}
                  </span>
                ))}
                {user.permissions.length > 2 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                    +{user.permissions.length - 2}
                  </span>
                )}
              </>
            ) : (
              <span className="text-[10px] text-neutral-400 italic">
                {language === 'th' ? 'ไม่มีสิทธิ์พิเศษ' : 'Default access'}
              </span>
            )}
          </div>
        </td>

        {/* Password */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5 font-mono text-xs text-neutral-500 dark:text-neutral-400">
            <span>{isPasswordVisible ? user.password || '••••••' : '••••••'}</span>
            <button
              type="button"
              onClick={() => onTogglePassword(user.id)}
              className="p-1 rounded text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors cursor-pointer"
              title={isPasswordVisible ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
            >
              {isPasswordVisible ? <EyeOff size={12} /> : <Eye size={12} />}
            </button>
          </div>
        </td>

        {/* Actions */}
        <td className="px-4 py-3 text-right whitespace-nowrap">
          <div className="inline-flex items-center gap-1 justify-end">
            <button
              type="button"
              onClick={() => onTogglePatch(user)}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                isPatchActive
                  ? 'bg-[#e8f0fe] text-[#1a73e8] dark:bg-blue-950/60 dark:text-blue-300'
                  : 'text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
              title="แก้ไขข้อมูล"
            >
              <Edit2 size={13} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(user)}
              className="p-1.5 rounded-md text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-955/20 transition-colors cursor-pointer"
              title="ลบผู้ใช้งาน"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </td>
      </tr>

      {/* Inline Collapsible Edit Form */}
      {isPatchActive && (
        <tr className="bg-neutral-50/60 dark:bg-neutral-900/60 border-b border-neutral-200 dark:border-neutral-800">
          <td colSpan={6} className="px-4 py-4">
            <UserInlineEditForm
              user={user}
              userProfile={userProfile}
              companies={companies}
              language={language}
              onSave={onSavePatch}
              onCancel={onCancelPatch}
            />
          </td>
        </tr>
      )}
    </React.Fragment>
  );
}
