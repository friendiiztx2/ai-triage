'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Send, 
  Search, 
  RefreshCw, 
  Plus, 
  Users, 
  Star, 
  Building2, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  Check, 
  Link2, 
  Unlink, 
  AlertCircle, 
  Loader2, 
  ShieldCheck, 
  ExternalLink,
  MessageSquare,
  HelpCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import LinkGroupModal from '@/components/telegram/LinkGroupModal';
import ManageMembersModal from '@/components/telegram/ManageMembersModal';

interface TelegramGroupItem {
  id?: string;
  chat_id: string;
  group_name: string;
  company_id: string | null;
  company_name?: string;
  is_active: boolean;
  member_count?: number;
  executive_count?: number;
  created_at?: string;
  updated_at?: string;
}

export default function TelegramGroupsPage() {
  const { language } = useLanguage();
  const [groups, setGroups] = useState<TelegramGroupItem[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activeCompanyId, setActiveCompanyId] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [companyFilter, setCompanyFilter] = useState('all');

  // Modals
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectedGroupForMembers, setSelectedGroupForMembers] = useState<TelegramGroupItem | null>(null);

  // Row-level action states
  const [togglingChatId, setTogglingChatId] = useState<string | null>(null);
  const [unbindingChatId, setUnbindingChatId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Initialize session & load data
  useEffect(() => {
    const savedSession = localStorage.getItem('user_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setUserProfile(parsed);
      } catch (e) {}
    }

    const matchCookie = typeof document !== 'undefined' ? document.cookie.match(/(?:^|; )company_id=([^;]*)/) : null;
    const compId = matchCookie
      ? decodeURIComponent(matchCookie[1])
      : (typeof localStorage !== 'undefined' ? localStorage.getItem('company_id') || '' : '');
    setActiveCompanyId(compId);

    fetchInitialData(compId);
  }, []);

  const fetchInitialData = async (compId?: string) => {
    setLoading(true);
    try {
      const [groupsRes, companiesRes] = await Promise.all([
        fetch('/api/telegram-groups'),
        fetch('/api/companies'),
      ]);

      if (companiesRes.ok) {
        const compData = await companiesRes.json();
        setCompanies(Array.isArray(compData) ? compData : []);
      }

      if (groupsRes.ok) {
        const gData = await groupsRes.json();
        setGroups(gData.groups || []);
      }
    } catch (err) {
      console.error('Failed to fetch telegram groups:', err);
      setToastMsg({ text: 'ไม่สามารถโหลดข้อมูลกลุ่ม Telegram ได้', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleActive = async (group: TelegramGroupItem) => {
    const nextActive = !group.is_active;
    setTogglingChatId(group.chat_id);
    setToastMsg(null);

    // Optimistic UI update
    setGroups((prev) =>
      prev.map((g) => (g.chat_id === group.chat_id ? { ...g, is_active: nextActive } : g))
    );

    try {
      const res = await fetch('/api/telegram-groups', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: group.chat_id,
          action: 'toggle_active',
          is_active: nextActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');

      setToastMsg({
        text: `เปลี่ยนสถานะ ${group.group_name} เป็น ${nextActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'} เรียบร้อยแล้ว`,
        type: 'success',
      });
    } catch (err: any) {
      // Revert optimistic update
      setGroups((prev) =>
        prev.map((g) => (g.chat_id === group.chat_id ? { ...g, is_active: !nextActive } : g))
      );
      setToastMsg({ text: err.message || 'ไม่สามารถเปลี่ยนสถานะได้', type: 'error' });
    } finally {
      setTogglingChatId(null);
    }
  };

  const handleUnbindGroup = async (group: TelegramGroupItem) => {
    const confirmed = window.confirm(
      `คุณต้องการยกเลิกการผูกกลุ่ม "${group.group_name}" ออกจากบริษัทนี้ใช่หรือไม่?\n(เมื่อยกเลิกแล้ว บอทจะไม่ทำงานร่วมกับบริษัทนี้ จนกว่าจะมีการผูกใหม่)`
    );
    if (!confirmed) return;

    setUnbindingChatId(group.chat_id);
    setToastMsg(null);

    try {
      const res = await fetch('/api/telegram-groups', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: group.chat_id,
          action: 'unbind',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาดในการยกเลิกการผูกกลุ่ม');

      setToastMsg({ text: `ยกเลิกการผูกกลุ่ม "${group.group_name}" เรียบร้อยแล้ว`, type: 'success' });
      fetchInitialData();
    } catch (err: any) {
      setToastMsg({ text: err.message || 'ไม่สามารถยกเลิกการผูกกลุ่มได้', type: 'error' });
    } finally {
      setUnbindingChatId(null);
    }
  };

  const isSystemAdmin = userProfile?.role === 'system_admin' || userProfile?.role === 'super_admin';

  // KPI Calculations
  const stats = useMemo(() => {
    const total = groups.length;
    const active = groups.filter((g) => g.is_active).length;
    const totalMembers = groups.reduce((acc, curr) => acc + (curr.member_count || 0), 0);
    const totalExecutives = groups.reduce((acc, curr) => acc + (curr.executive_count || 0), 0);
    return { total, active, totalMembers, totalExecutives };
  }, [groups]);

  // Filtered Groups
  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      // Status filter
      if (statusFilter === 'active' && !g.is_active) return false;
      if (statusFilter === 'inactive' && g.is_active) return false;

      // Company filter (for system admins)
      if (companyFilter !== 'all' && g.company_id !== companyFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const gName = (g.group_name || '').toLowerCase();
        const chatId = String(g.chat_id || '').toLowerCase();
        const compName = (g.company_name || '').toLowerCase();
        return gName.includes(q) || chatId.includes(q) || compName.includes(q);
      }

      return true;
    });
  }, [groups, statusFilter, companyFilter, searchQuery]);

  return (
    <div className="space-y-6 animate-fade-in select-none">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Send size={18} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <span>จัดการกลุ่ม Telegram & สิทธิ์ผู้บริหาร</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                  Multi-Tenant Bot
                </span>
              </h1>
              <p className="text-[13px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                ผูกกลุ่ม Telegram กับบริษัท และกำหนดสิทธิ์สมาชิกที่สามารถสั่งการหรือถามข้อมูลจาก AI Bot ได้
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchInitialData()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-[12px] font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-750 transition shadow-2xs cursor-pointer disabled:opacity-50"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>รีเฟรช</span>
          </button>

          <button
            onClick={() => setIsLinkModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white text-[12px] font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus size={14} />
            <span>ผูกกลุ่มใหม่ (Link Group)</span>
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMsg && (
        <div
          className={`p-3 rounded-xl border flex items-center justify-between text-[12.5px] animate-fade-in ${
            toastMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMsg.type === 'success' ? (
              <CheckCircle2 size={15} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle size={15} className="shrink-0 text-rose-600 dark:text-rose-400" />
            )}
            <span>{toastMsg.text}</span>
          </div>
          <button
            onClick={() => setToastMsg(null)}
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
          >
            <XCircle size={14} />
          </button>
        </div>
      )}

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Groups */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-neutral-500 dark:text-neutral-400">กลุ่มที่ผูกแล้วทั้งหมด</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Send size={15} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.total}</span>
            <span className="text-[12px] text-neutral-500">กลุ่ม</span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">ที่เชื่อมต่อในระบบ</p>
        </div>

        {/* Active Groups */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-neutral-500 dark:text-neutral-400">กลุ่มที่เปิดใช้งาน</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={15} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.active}</span>
            <span className="text-[12px] text-neutral-500">กลุ่ม</span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">AI Bot พร้อมตอบคำถาม</p>
        </div>

        {/* Total Executives */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-neutral-500 dark:text-neutral-400">ผู้บริหาร (สิทธิ์ถาม AI)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Star size={15} className="fill-amber-500 text-amber-500" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.totalExecutives}</span>
            <span className="text-[12px] text-neutral-500">คน</span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">ได้รับสิทธิ์ Executive</p>
        </div>

        {/* Total Members */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-neutral-500 dark:text-neutral-400">สมาชิกทั้งหมดในกลุ่ม</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Users size={15} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.totalMembers}</span>
            <span className="text-[12px] text-neutral-500">คน</span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">บันทึกอัตโนมัติจาก Telegram</p>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search size={14} className="absolute left-3.5 top-3 text-neutral-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อกลุ่ม Telegram, Chat ID หรือชื่อบริษัท..."
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

          {/* Company Filter (for System Admins) */}
          {isSystemAdmin && companies.length > 0 && (
            <div className="w-full md:w-56 shrink-0">
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="w-full px-3 py-2 text-[12.5px] rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                <option value="all">ทุกบริษัท (All Companies)</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl text-[12px] w-full md:w-auto shrink-0 justify-center">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg transition font-medium ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              ทั้งหมด ({groups.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 rounded-lg transition font-medium ${
                statusFilter === 'active'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-neutral-500 hover:text-emerald-600 dark:hover:text-emerald-400'
              }`}
            >
              เปิดใช้งาน ({stats.active})
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1 rounded-lg transition font-medium ${
                statusFilter === 'inactive'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              ปิดใช้งาน ({stats.total - stats.active})
            </button>
          </div>
        </div>
      </div>

      {/* 4. Groups Table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/75 dark:bg-neutral-850 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                <th className="py-3 px-6">กลุ่ม Telegram</th>
                <th className="py-3 px-4">Chat ID</th>
                <th className="py-3 px-4">บริษัทที่ผูก</th>
                <th className="py-3 px-4">สมาชิกในกลุ่ม</th>
                <th className="py-3 px-4 text-center">สถานะ AI Bot</th>
                <th className="py-3 px-6 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-[12.5px]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-neutral-400">
                    <Loader2 size={24} className="animate-spin mx-auto text-blue-500 mb-2" />
                    <span>กำลังโหลดรายการกลุ่ม Telegram...</span>
                  </td>
                </tr>
              ) : filteredGroups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center">
                        <Send size={20} />
                      </div>
                      <p className="text-[14px] font-medium text-neutral-700 dark:text-neutral-300">
                        {searchQuery ? 'ไม่พบกลุ่มที่ตรงกับการค้นหา' : 'ยังไม่มีกลุ่ม Telegram ที่ผูกกับบริษัท'}
                      </p>
                      <p className="text-[12px] text-neutral-500 dark:text-neutral-400 max-w-sm">
                        เชิญบอท Telegram เข้ากลุ่ม จากนั้นกดปุ่ม &quot;ผูกกลุ่มใหม่&quot; เพื่อเชื่อมต่อเข้ากับระบบ
                      </p>
                      <button
                        onClick={() => setIsLinkModalOpen(true)}
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-medium transition cursor-pointer shadow-xs"
                      >
                        <Plus size={13} />
                        <span>กดผูกกลุ่มตอนนี้</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredGroups.map((group) => {
                  const isToggling = togglingChatId === group.chat_id;
                  const isUnbinding = unbindingChatId === group.chat_id;

                  return (
                    <tr
                      key={group.chat_id}
                      className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition"
                    >
                      {/* Group Name */}
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                            <Send size={16} />
                          </div>
                          <div>
                            <span className="font-semibold text-neutral-900 dark:text-white block">
                              {group.group_name || 'กลุ่มไม่มีชื่อ'}
                            </span>
                            <span className="text-[11px] text-neutral-400">
                              อัปเดต: {group.updated_at ? new Date(group.updated_at).toLocaleDateString('th-TH') : '-'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Chat ID */}
                      <td className="py-3.5 px-4 font-mono text-[11.5px] text-neutral-600 dark:text-neutral-400">
                        <div className="flex items-center gap-1.5">
                          <span>{group.chat_id}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(group.chat_id)}
                            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition"
                            title="คัดลอก Chat ID"
                          >
                            {copiedId === group.chat_id ? (
                              <Check size={11} className="text-emerald-500" />
                            ) : (
                              <Copy size={11} />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Company Name */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-[11.5px] font-medium">
                          <Building2 size={11} className="text-neutral-500" />
                          <span>{group.company_name || 'ไม่ระบุ'}</span>
                        </div>
                      </td>

                      {/* Member & Executive Count */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 text-[12px] font-semibold text-neutral-800 dark:text-neutral-200">
                            <Users size={12} className="text-neutral-500" />
                            <span>{group.member_count || 0} คน</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                            <Star size={11} className="fill-amber-500 text-amber-500" />
                            <span>ผู้บริหาร {group.executive_count || 0} คน</span>
                          </div>
                        </div>
                      </td>

                      {/* Active Status Toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(group)}
                          disabled={isToggling}
                          className="inline-flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                          title={group.is_active ? 'คลิกเพื่อปิดการทำงาน AI Bot ในกลุ่มนี้' : 'คลิกเพื่อเปิดใช้งาน AI Bot'}
                        >
                          {isToggling ? (
                            <Loader2 size={16} className="animate-spin text-blue-500" />
                          ) : group.is_active ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span>เปิดใช้งาน</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                              <span>ปิดใช้งาน</span>
                            </span>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-6 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {/* Manage Members Button */}
                          <button
                            onClick={() => setSelectedGroupForMembers(group)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-[11.5px] font-medium transition cursor-pointer border border-blue-200/60 dark:border-blue-800"
                            title="ดูรายชื่อสมาชิก และจัดการสิทธิ์ผู้บริหารในกลุ่ม"
                          >
                            <Users size={12} />
                            <span>จัดการสมาชิก & สิทธิ์</span>
                          </button>

                          {/* Unlink Button */}
                          <button
                            onClick={() => handleUnbindGroup(group)}
                            disabled={isUnbinding}
                            className="p-1 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                            title="ยกเลิกการผูกกลุ่มนี้ออกจากบริษัท"
                          >
                            {isUnbinding ? <Loader2 size={13} className="animate-spin text-rose-500" /> : <Unlink size={13} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Modals */}
      <LinkGroupModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onSuccess={() => {
          setToastMsg({ text: 'ผูกกลุ่มกับบริษัทสำเร็จแล้ว', type: 'success' });
          fetchInitialData();
        }}
        currentCompanyId={activeCompanyId}
        companies={companies}
        isSystemAdmin={isSystemAdmin}
      />

      {selectedGroupForMembers && (
        <ManageMembersModal
          isOpen={Boolean(selectedGroupForMembers)}
          onClose={() => setSelectedGroupForMembers(null)}
          group={selectedGroupForMembers}
          onMemberUpdated={() => {
            fetchInitialData();
          }}
        />
      )}
    </div>
  );
}
