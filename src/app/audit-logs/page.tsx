'use client';

import { useState, useEffect, useMemo } from 'react';
import { RefreshCw, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/components/LanguageContext';
import AuditFilterBar from '@/components/audit/AuditFilterBar';
import AuditLogTable from '@/components/audit/AuditLogTable';

export default function AuditLogsPage() {
  const { t, language } = useLanguage();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const savedSession = localStorage.getItem('user_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setUserProfile(parsed);
        if (parsed.role === 'system_admin' || parsed.role === 'super_admin') {
          fetchLogs();
        } else {
          setLoading(false);
        }
      } catch (e) {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/audit-logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Synchronously compute filtered logs via useMemo to eliminate 1-frame flash of unfiltered logs
  const filteredLogs = useMemo(() => {
    let result = [...logs];

    // Search query filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.admin_name?.toLowerCase().includes(q) ||
          l.admin_email?.toLowerCase().includes(q) ||
          l.details?.toLowerCase().includes(q)
      );
    }

    // Action filter
    if (actionFilter !== 'all') {
      result = result.filter((l) => l.action === actionFilter);
    }

    // Date range filter
    const now = new Date();
    if (dateFilter === 'today') {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      result = result.filter((l) => new Date(l.created_at) >= startOfToday);
    } else if (dateFilter === '7days') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      result = result.filter((l) => new Date(l.created_at) >= sevenDaysAgo);
    } else if (dateFilter === '30days') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      result = result.filter((l) => new Date(l.created_at) >= thirtyDaysAgo);
    } else if (dateFilter === 'custom') {
      if (!startDate && !endDate) {
        result = [];
      } else {
        const start = startDate ? new Date(startDate) : null;
        if (start) start.setHours(0, 0, 0, 0);

        const end = endDate ? new Date(endDate) : null;
        if (end) end.setHours(23, 59, 59, 999);

        result = result.filter((l) => {
          const itemDate = new Date(l.created_at);
          if (start && itemDate < start) return false;
          if (end && itemDate > end) return false;
          return true;
        });
      }
    }

    return result;
  }, [logs, searchQuery, actionFilter, dateFilter, startDate, endDate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 text-neutral-400 dark:text-neutral-500">
        <RefreshCw size={32} className="animate-spin text-indigo-600 dark:text-indigo-400" />
        <span className="text-sm font-semibold">{t('auditLoading')}</span>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-neutral-400 dark:text-neutral-500 gap-3">
        <ShieldAlert size={44} className="text-rose-500 animate-bounce" />
        <span className="font-bold text-sm">
          {language === 'th' ? 'โปรดล็อกอินเข้าใช้งานระบบเพื่อเข้าถึงข้อมูลนี้' : 'Please log in to access this system information.'}
        </span>
        <Link href="/login" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-xl text-xs transition">
          {language === 'th' ? 'ไปยังหน้าล็อกอิน' : 'Go to Login Page'}
        </Link>
      </div>
    );
  }

  if (userProfile.role !== 'system_admin' && userProfile.role !== 'super_admin') {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-neutral-400 dark:text-neutral-500 gap-3">
        <ShieldAlert size={44} className="text-amber-500" />
        <span className="font-bold text-sm">
          {language === 'th' ? '🔒 ขออภัย เฉพาะสิทธิ์แอดมินเท่านั้นที่จะสามารถดูหน้านี้ได้' : '🔒 Sorry, only administrators are allowed to view this page.'}
        </span>
        <Link href="/" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-xl text-xs transition">
          {language === 'th' ? 'กลับสู่แดชบอร์ดหลัก' : 'Back to Dashboard'}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight font-display">
            {t('auditLogsTitle')}
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-xs sm:text-sm mt-0.5 font-normal">
            {t('auditLogsSub')}
          </p>
        </div>

        <button 
          onClick={fetchLogs}
          className="flex items-center gap-2 backdrop-blur-md bg-white/70 dark:bg-neutral-900/70 hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-800/80 text-neutral-700 dark:text-neutral-200 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer w-fit"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> 
          {language === 'th' ? 'อัปเดตประวัติ' : 'Update Logs'}
        </button>
      </div>

      {/* Filter Bar */}
      <AuditFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        actionFilter={actionFilter}
        onActionChange={setActionFilter}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        totalResults={filteredLogs.length}
      />

      {/* Logs Table */}
      <AuditLogTable
        logs={filteredLogs}
        loading={loading}
        language={language}
        emptyMessage={
          dateFilter === 'custom' && !startDate && !endDate
            ? (language === 'th' ? 'โปรดระบุช่วงวันที่เพื่อค้นหาประวัติกิจกรรม' : 'Please select a date range to view audit logs')
            : undefined
        }
      />
    </div>
  );
}
