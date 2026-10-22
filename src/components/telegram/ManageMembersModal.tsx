'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Send, 
  Search, 
  Star, 
  User, 
  ShieldCheck, 
  Clock, 
  Copy, 
  Check, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Users,
  Calendar
} from 'lucide-react';

interface MemberItem {
  id?: string;
  group_id: string;
  telegram_user_id: string | number;
  first_name?: string;
  last_name?: string;
  username?: string;
  role: 'executive' | 'member';
  joined_at?: string;
  last_seen_at?: string;
}

interface ManageMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: any;
  onMemberUpdated?: () => void;
}

export default function ManageMembersModal({
  isOpen,
  onClose,
  group,
  onMemberUpdated,
}: ManageMembersModalProps) {
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'executive' | 'member'>('all');
  
  const [updatingUserId, setUpdatingUserId] = useState<string | number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (isOpen && group?.chat_id) {
      setSearchQuery('');
      setRoleFilter('all');
      setToastMsg(null);
      fetchMembers();
    }
  }, [isOpen, group]);

  const fetchMembers = async () => {
    if (!group?.chat_id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/telegram-groups/${encodeURIComponent(group.chat_id)}/members`);
      const data = await res.json();
      if (res.ok && data.members) {
        setMembers(data.members);
      } else {
        setMembers([]);
      }
    } catch (err) {
      console.error('Failed to fetch members:', err);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (member: MemberItem, newRole: 'executive' | 'member') => {
    if (member.role === newRole) return;
    const userId = member.telegram_user_id;
    setUpdatingUserId(userId);
    setToastMsg(null);

    // Optimistic UI update
    const previousMembers = [...members];
    setMembers((prev) =>
      prev.map((m) =>
        m.telegram_user_id === userId ? { ...m, role: newRole } : m
      )
    );

    try {
      const res = await fetch(
        `/api/telegram-groups/${encodeURIComponent(group.chat_id)}/members`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telegram_user_id: userId,
            role: newRole,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'ไม่สามารถอัปเดตสิทธิ์ได้');
      }

      setToastMsg({
        text: `อัปเดตสิทธิ์ของ ${member.first_name || member.username || 'สมาชิก'} เป็น ${
          newRole === 'executive' ? '⭐️ ผู้บริหาร (Executive)' : '👤 สมาชิกทั่วไป (Member)'
        } สำเร็จ`,
        type: 'success',
      });

      if (onMemberUpdated) {
        onMemberUpdated();
      }
    } catch (err: any) {
      // Revert optimistic update on failure
      setMembers(previousMembers);
      setToastMsg({
        text: err.message || 'เกิดข้อผิดพลาดในการอัปเดตสิทธิ์',
        type: 'error',
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('th-TH', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      // Role filter
      if (roleFilter !== 'all' && m.role !== roleFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const fullName = `${m.first_name || ''} ${m.last_name || ''}`.toLowerCase();
        const username = (m.username || '').toLowerCase();
        const userId = String(m.telegram_user_id || '').toLowerCase();
        return fullName.includes(q) || username.includes(q) || userId.includes(q);
      }

      return true;
    });
  }, [members, roleFilter, searchQuery]);

  const executiveCount = useMemo(() => {
    return members.filter((m) => m.role === 'executive').length;
  }, [members]);

  if (!isOpen || !group) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in select-none">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl max-w-4xl w-full h-[90vh] max-h-[800px] flex flex-col overflow-hidden transition-all duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Send size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-semibold text-neutral-900 dark:text-white">
                  {group.group_name || 'กลุ่ม Telegram'}
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-neutral-200/70 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                  ID: {group.chat_id}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(group.chat_id)}
                  className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition"
                  title="คัดลอก Chat ID"
                >
                  {copiedId === group.chat_id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                </button>
              </div>
              <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                จัดการสิทธิ์สมาชิก • บริษัท {group.company_name || 'ไม่ระบุ'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stats & Filters Bar */}
        <div className="px-6 py-3.5 border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shrink-0 space-y-3">
          {/* Quick Stats Badges */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {/* Total Members */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-[12px] font-medium">
                <Users size={13} className="text-neutral-500" />
                <span>สมาชิกทั้งหมด:</span>
                <span className="font-semibold text-neutral-900 dark:text-white">{members.length}</span>
              </div>

              {/* Executives Count */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-[12px] font-medium">
                <Star size={13} className="text-amber-500 fill-amber-500" />
                <span>ผู้บริหาร (สั่งการ AI ได้):</span>
                <span className="font-bold text-amber-900 dark:text-amber-200">{executiveCount}</span>
              </div>

              {/* Members Count */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 text-[12px] font-medium">
                <User size={13} className="text-neutral-400" />
                <span>สมาชิกทั่วไป (ห้ามถาม):</span>
                <span>{members.length - executiveCount}</span>
              </div>
            </div>

            {/* Role Filter Pills */}
            <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl text-[12px]">
              <button
                type="button"
                onClick={() => setRoleFilter('all')}
                className={`px-3 py-1 rounded-lg transition font-medium ${
                  roleFilter === 'all'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                ทั้งหมด ({members.length})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('executive')}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg transition font-medium ${
                  roleFilter === 'executive'
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'text-neutral-500 hover:text-amber-600 dark:hover:text-amber-400'
                }`}
              >
                <Star size={12} className={roleFilter === 'executive' ? 'fill-white' : ''} />
                <span>ผู้บริหาร ({executiveCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('member')}
                className={`px-3 py-1 rounded-lg transition font-medium ${
                  roleFilter === 'member'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                สมาชิกทั่วไป ({members.length - executiveCount})
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-3 text-neutral-400" />
            <input
              type="text"
              placeholder="ค้นหาสมาชิกด้วยชื่อ, นามสกุล, @username หรือ Contact ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-[12.5px] rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/40 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 text-[11px]"
              >
                ล้าง
              </button>
            )}
          </div>

          {/* Toast Notification */}
          {toastMsg && (
            <div
              className={`p-2.5 rounded-xl border flex items-center gap-2 text-[12px] animate-fade-in ${
                toastMsg.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300'
              }`}
            >
              {toastMsg.type === 'success' ? (
                <CheckCircle2 size={14} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle size={14} className="shrink-0 text-rose-600 dark:text-rose-400" />
              )}
              <span>{toastMsg.text}</span>
            </div>
          )}
        </div>

        {/* Members Table */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-3">
              <Loader2 size={24} className="animate-spin text-blue-500" />
              <p className="text-[13px] text-neutral-500">กำลังโหลดรายชื่อสมาชิกจาก Telegram...</p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-6 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center">
                <Users size={22} />
              </div>
              <p className="text-[14px] font-medium text-neutral-700 dark:text-neutral-300">
                {searchQuery ? 'ไม่พบสมาชิกที่ตรงกับการค้นหา' : 'ยังไม่มีสมาชิกในกลุ่มนี้'}
              </p>
              <p className="text-[12px] text-neutral-500 dark:text-neutral-400 max-w-sm">
                เมื่อสมาชิกส่งข้อความในกลุ่ม Telegram บอทจะบันทึกรายชื่อลงฐานข้อมูลและปรากฏที่นี่โดยอัตโนมัติ
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-neutral-50 dark:bg-neutral-800/90 backdrop-blur-xs text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-800 z-10">
                <tr>
                  <th className="py-2.5 px-6">สมาชิก (Member)</th>
                  <th className="py-2.5 px-4">Telegram ID</th>
                  <th className="py-2.5 px-4">ใช้งานล่าสุด</th>
                  <th className="py-2.5 px-6 text-right">สิทธิ์การสั่งการ (RBAC Role)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-[12.5px]">
                {filteredMembers.map((member) => {
                  const isExecutive = member.role === 'executive';
                  const isUpdating = updatingUserId === member.telegram_user_id;
                  const fullName = `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'ไม่ระบุชื่อ';
                  const initials = (member.first_name?.[0] || member.username?.[0] || 'U').toUpperCase();

                  return (
                    <tr
                      key={String(member.telegram_user_id)}
                      className={`hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition ${
                        isExecutive ? 'bg-amber-50/20 dark:bg-amber-950/10' : ''
                      }`}
                    >
                      {/* Name & Username */}
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-semibold text-[13px] shrink-0 ${
                              isExecutive
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 ring-2 ring-amber-400/40'
                                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                            }`}
                          >
                            {isExecutive ? <Star size={14} className="fill-amber-500 text-amber-500" /> : initials}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-neutral-900 dark:text-white truncate">
                                {fullName}
                              </span>
                              {isExecutive && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                                  ผู้บริหาร
                                </span>
                              )}
                            </div>
                            <div className="text-[11.5px] text-neutral-500 dark:text-neutral-400">
                              {member.username ? `@${member.username}` : 'ไม่มี username'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Telegram User ID */}
                      <td className="py-3 px-4 font-mono text-[11.5px] text-neutral-600 dark:text-neutral-400">
                        <div className="flex items-center gap-1.5">
                          <span>{member.telegram_user_id}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(String(member.telegram_user_id))}
                            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition"
                            title="คัดลอก Contact ID"
                          >
                            {copiedId === String(member.telegram_user_id) ? (
                              <Check size={11} className="text-emerald-500" />
                            ) : (
                              <Copy size={11} />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Last Seen / Joined */}
                      <td className="py-3 px-4 text-[11.5px] text-neutral-500 dark:text-neutral-400">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Clock size={11} className="text-neutral-400" />
                          <span>{formatDate(member.last_seen_at || member.joined_at)}</span>
                        </div>
                      </td>

                      {/* Interactive Role Switcher */}
                      <td className="py-3 px-6 text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          {isUpdating ? (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-[11px] text-neutral-500">
                              <Loader2 size={12} className="animate-spin" />
                              <span>กำลังบันทึก...</span>
                            </div>
                          ) : (
                            <div className="inline-flex p-0.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100/60 dark:bg-neutral-800/60 shadow-2xs">
                              {/* Executive Button */}
                              <button
                                type="button"
                                onClick={() => handleRoleChange(member, 'executive')}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                                  isExecutive
                                    ? 'bg-amber-500 text-white shadow-xs'
                                    : 'text-neutral-500 dark:text-neutral-400 hover:text-amber-700 dark:hover:text-amber-300'
                                }`}
                                title="อนุญาตให้สั่งการและถามข้อมูลบอท AI ได้ทั้งหมด"
                              >
                                <Star size={11} className={isExecutive ? 'fill-white' : ''} />
                                <span>ผู้บริหาร</span>
                              </button>

                              {/* Member Button */}
                              <button
                                type="button"
                                onClick={() => handleRoleChange(member, 'member')}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                                  !isExecutive
                                    ? 'bg-white dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 shadow-xs'
                                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-white'
                                }`}
                                title="ไม่มีสิทธิ์สั่งการหรือถามบอทในทุกกรณี"
                              >
                                <User size={11} />
                                <span>สมาชิกทั่วไป</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer RBAC Policy Explainer */}
        <div className="p-4 px-6 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/70 flex flex-wrap items-center justify-between gap-3 text-[11.5px] text-neutral-500 dark:text-neutral-400 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
            <span>
              <strong>เงื่อนไขสิทธิ์ (RBAC Policy):</strong> เฉพาะสิทธิ์{' '}
              <strong className="text-amber-600 dark:text-amber-400 font-semibold">ผู้บริหาร (Executive)</strong>{' '}
              เท่านั้นที่สามารถสั่งการและพิมพ์ถามบอท AI ได้
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-neutral-200/80 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium text-[12px] transition cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
