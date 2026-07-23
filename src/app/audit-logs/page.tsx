'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  History, Search, RefreshCw, ClipboardList, 
  Calendar, ShieldAlert
} from 'lucide-react';
import Link from 'next/link';
import { saveAuditLog } from '@/lib/audit';
import { useLanguage } from '@/components/LanguageContext';

export default function AuditLogsPage() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('7days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const savedSession = localStorage.getItem('user_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setUserProfile(parsed);
        // Only system_admin or super_admin are allowed to view audit logs
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
        setFilteredLogs(data);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter logs on search / type select / date select
  useEffect(() => {
    let result = [...logs];

    // Search query filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(l => 
        l.admin_name?.toLowerCase().includes(q) ||
        l.admin_email?.toLowerCase().includes(q) ||
        l.details?.toLowerCase().includes(q)
      );
    }

    // Action filter
    if (actionFilter !== 'all') {
      result = result.filter(l => l.action === actionFilter);
    }

    // Date range filter
    const now = new Date();
    if (dateFilter === 'today') {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      result = result.filter(l => new Date(l.created_at) >= startOfToday);
    } else if (dateFilter === '7days') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      result = result.filter(l => new Date(l.created_at) >= sevenDaysAgo);
    } else if (dateFilter === '30days') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      result = result.filter(l => new Date(l.created_at) >= thirtyDaysAgo);
    } else if (dateFilter === 'custom' && startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      let end = now;
      if (endDate) {
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
      }
      result = result.filter(l => {
        const itemDate = new Date(l.created_at);
        return itemDate >= start && itemDate <= end;
      });
    }

    setFilteredLogs(result);
  }, [searchQuery, actionFilter, dateFilter, startDate, endDate, logs]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-emerald-50 dark:bg-emerald-955/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30';
      case 'UPDATE':
        return 'bg-amber-50 dark:bg-amber-955/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30';
      case 'DELETE':
        return 'bg-rose-50 dark:bg-rose-955/30 text-rose-600 dark:text-rose-455 border border-rose-100 dark:border-rose-900/30';
      case 'LOGIN':
        return 'bg-blue-50 dark:bg-blue-955/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30';
      default:
        return 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 text-slate-400 dark:text-slate-500">
        <RefreshCw size={32} className="animate-spin text-indigo-600 dark:text-indigo-400" />
        <span className="text-sm font-semibold">{t('auditLoading')}</span>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400 dark:text-slate-500 gap-3">
        <ShieldAlert size={44} className="text-rose-500 animate-bounce" />
        <span className="font-bold text-sm">{language === 'th' ? 'โปรดล็อกอินเข้าใช้งานระบบเพื่อเข้าถึงข้อมูลนี้' : 'Please log in to access this system information.'}</span>
        <Link href="/login" className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-xl text-xs transition">
          {language === 'th' ? 'ไปยังหน้าล็อกอิน' : 'Go to Login Page'}
        </Link>
      </div>
    );
  }

  if (userProfile.role !== 'system_admin' && userProfile.role !== 'super_admin') {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400 dark:text-slate-500 gap-3">
        <ShieldAlert size={44} className="text-amber-500" />
        <span className="font-bold text-sm">{language === 'th' ? '🔒 ขออภัย เฉพาะสิทธิ์แอดมินเท่านั้นที่จะสามารถดูหน้านี้ได้' : '🔒 Sorry, only administrators are allowed to view this page.'}</span>
        <Link href="/" className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-xl text-xs transition">
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
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight font-display flex items-center gap-2">
            <History className="text-indigo-600 dark:text-indigo-400" size={24} /> 
            {t('auditLogsTitle')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {t('auditLogsSub')}
          </p>
        </div>

        <button 
          onClick={fetchLogs}
          className="flex items-center gap-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-855 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all cursor-pointer w-fit"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> 
          {language === 'th' ? 'อัปเดตประวัติ' : 'Update Logs'}
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4 transition-all duration-250">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
          {/* Search Input */}
          <div className="relative text-slate-800 dark:text-slate-100">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
            <input
              type="text"
              placeholder={t('auditSearchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl pl-10 pr-4 py-2 text-xs focus:border-indigo-600 focus:outline-none transition font-semibold text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Action Type Selector */}
          <div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-3.5 py-2 text-xs font-semibold focus:border-indigo-600 focus:outline-none transition text-slate-805 dark:text-slate-100 cursor-pointer"
            >
              <option value="all">{t('auditFilterAll')}</option>
              <option value="CREATE">{language === 'th' ? 'สร้าง (CREATE)' : 'Create (CREATE)'}</option>
              <option value="UPDATE">{language === 'th' ? 'แก้ไข (UPDATE)' : 'Update (UPDATE)'}</option>
              <option value="DELETE">{language === 'th' ? 'ลบ (DELETE)' : 'Delete (DELETE)'}</option>
              <option value="LOGIN">{language === 'th' ? 'เข้าสู่ระบบ (LOGIN)' : 'Login (LOGIN)'}</option>
            </select>
          </div>

          {/* Date Filter Selector */}
          <div>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-3.5 py-2 text-xs font-semibold focus:border-indigo-600 focus:outline-none transition text-slate-805 dark:text-slate-100 cursor-pointer"
            >
              <option value="7days">{language === 'th' ? 'ช่วงเวลา: 7 วันล่าสุด (เริ่มต้น)' : 'Timeframe: Last 7 Days (Default)'}</option>
              <option value="today">{language === 'th' ? 'ช่วงเวลา: วันนี้' : 'Timeframe: Today'}</option>
              <option value="30days">{language === 'th' ? 'ช่วงเวลา: 30 วันล่าสุด' : 'Timeframe: Last 30 Days'}</option>
              <option value="all">{language === 'th' ? 'ช่วงเวลา: ทั้งหมด' : 'Timeframe: All'}</option>
              <option value="custom">{language === 'th' ? 'ระบุช่วงวันที่เอง...' : 'Custom Range...'}</option>
            </select>
          </div>

          <div className="text-slate-400 dark:text-slate-505 text-[11px] font-bold text-right pt-2.5 md:pr-2 select-none">
            {language === 'th' ? `พบประวัติทั้งหมด ${filteredLogs.length} รายการ` : `Found ${filteredLogs.length} total logs`}
          </div>
        </div>

        {/* Custom Date Pickers Drawer */}
        {dateFilter === 'custom' && (
          <div className="flex flex-wrap items-center gap-4 bg-slate-50 dark:bg-slate-855 border border-slate-200/50 dark:border-slate-800 p-3.5 rounded-2xl transition-all">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-350">
              <Calendar size={14} className="text-indigo-500" />
              <span>{language === 'th' ? 'ระบุช่วงวันที่:' : 'Select Range:'}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">{language === 'th' ? 'จาก:' : 'From:'}</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none text-slate-800 dark:text-slate-100 cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">{language === 'th' ? 'ถึง:' : 'To:'}</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none text-slate-800 dark:text-slate-100 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Logs Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden transition-all duration-250">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3 text-slate-400 dark:text-slate-500">
            <RefreshCw size={32} className="animate-spin text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-semibold">{language === 'th' ? 'กำลังดึงข้อมูลบันทึกกิจกรรม...' : 'Retrieving audit logs...'}</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 gap-3 text-slate-400 dark:text-slate-500 text-center">
            <ClipboardList size={40} className="text-slate-300 dark:text-slate-750" />
            <span className="text-sm font-semibold">{t('auditNoData')}</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs text-slate-700 dark:text-slate-200">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-855/20 text-slate-450 dark:text-slate-500 uppercase tracking-wider font-extrabold text-[9.5px]">
                  <th className="px-6 py-4">{language === 'th' ? 'ผู้ดำเนินการ (Admin)' : 'Actor (Admin)'}</th>
                  <th className="px-6 py-4">{language === 'th' ? 'ประเภทกิจกรรม' : 'Action Type'}</th>
                  <th className="px-6 py-4">{language === 'th' ? 'ประวัติการดำเนินการ' : 'Activity Detail'}</th>
                  <th className="px-6 py-4">{language === 'th' ? 'เวลาดำเนินการ' : 'Timestamp'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {filteredLogs.map((log) => (
                  <tr 
                    key={log.id} 
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-855/10 transition-colors"
                  >
                    {/* Admin Name & Email */}
                    <td className="px-6 py-4">
                      <div>
                        <span className="block font-bold text-slate-800 dark:text-slate-100 text-[11px]">
                          {log.admin_name}
                        </span>
                        <span className="block text-[9.5px] text-slate-400 dark:text-slate-500 font-medium">
                          {log.admin_email}
                        </span>
                      </div>
                    </td>

                    {/* Action Badge */}
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-extrabold tracking-wide uppercase select-none ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>

                    {/* Details */}
                    <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">
                      {log.details}
                    </td>

                    {/* Timestamp */}
                    <td className="px-6 py-4 text-slate-400 dark:text-slate-500 font-mono font-medium whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('th-TH')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
