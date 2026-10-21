'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  AlertTriangle, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  SearchCode, 
  ExternalLink, 
  MessageSquare, 
  Filter, 
  Copy, 
  Check, 
  FileEdit, 
  ShieldAlert,
  X,
  Save,
  Loader2
} from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

interface ReportItem {
  id: string;
  chat_id: string;
  company_id?: string;
  customer_name?: string;
  reported_by: string;
  reasons: string[];
  comment: string;
  ai_snapshot: {
    category_name?: string;
    priority?: string;
    summary?: string;
    recommended_reply?: string;
  };
  status: 'pending' | 'investigating' | 'resolved' | 'ignored';
  developer_notes?: string;
  created_at: string;
}

const REASON_MAP: Record<string, { label: string; icon: string; color: string }> = {
  wrong_category: { label: 'จัดหมวดหมู่ผิด', icon: '🏷️', color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20' },
  inaccurate_summary: { label: 'สรุปประเด็นผิด', icon: '📝', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20' },
  bad_reply: { label: 'คำตอบไม่เหมาะสม', icon: '💬', color: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20' },
  wrong_priority: { label: 'ความสำคัญผิด', icon: '⚡', color: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20' },
  hallucination: { label: 'AI เข้าใจผิด/ข้อมูลเท็จ', icon: '🧠', color: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20' },
  other: { label: 'อื่นๆ', icon: '📌', color: 'bg-neutral-500/10 text-neutral-700 dark:text-neutral-400 border-neutral-500/20' },
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; icon: React.ElementType }> = {
  pending: { label: 'รอดำเนินการ', bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-900/50', icon: Clock },
  investigating: { label: 'กำลังตรวจสอบ', bg: 'bg-sky-50 dark:bg-sky-950/40', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-200 dark:border-sky-900/50', icon: SearchCode },
  resolved: { label: 'แก้ไขแล้ว', bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-900/50', icon: CheckCircle2 },
  ignored: { label: 'ไม่ใช่ปัญหา', bg: 'bg-neutral-100 dark:bg-neutral-800', text: 'text-neutral-600 dark:text-neutral-400', border: 'border-neutral-200 dark:border-neutral-700', icon: X },
};

export default function UserIssuesPage() {
  const { language } = useLanguage();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  // Interactive Notes Modal
  const [editingNotesItem, setEditingNotesItem] = useState<ReportItem | null>(null);
  const [notesText, setNotesText] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Copy Feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const savedSession = localStorage.getItem('user_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setUserProfile(parsed);
      } catch (e) {}
    }
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/chats/reports');
      if (res.ok) {
        const data = await res.json();
        if (data.reports && Array.isArray(data.reports)) {
          setReports(data.reports);
        }
      }
    } catch (err) {
      console.error('Error fetching AI reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (reportId: string, newStatus: string) => {
    try {
      // Optimistic UI update
      setReports((prev) =>
        prev.map((item) => (item.id === reportId ? { ...item, status: newStatus as any } : item))
      );

      await fetch('/api/chats/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reportId, status: newStatus }),
      });
    } catch (err) {
      console.error('Failed to update status:', err);
      fetchReports();
    }
  };

  const handleSaveDeveloperNotes = async () => {
    if (!editingNotesItem) return;
    setSavingNotes(true);
    try {
      setReports((prev) =>
        prev.map((item) =>
          item.id === editingNotesItem.id ? { ...item, developer_notes: notesText } : item
        )
      );

      await fetch('/api/chats/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingNotesItem.id, developer_notes: notesText }),
      });

      setEditingNotesItem(null);
    } catch (err) {
      console.error('Failed to save developer notes:', err);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // KPIs
  const kpis = useMemo(() => {
    const total = reports.length;
    const pending = reports.filter((r) => r.status === 'pending').length;
    const investigating = reports.filter((r) => r.status === 'investigating').length;
    const resolved = reports.filter((r) => r.status === 'resolved').length;
    return { total, pending, investigating, resolved };
  }, [reports]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    let result = [...reports];

    if (statusFilter !== 'all') {
      result = result.filter((r) => r.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.chat_id?.toLowerCase().includes(q) ||
          r.reported_by?.toLowerCase().includes(q) ||
          r.comment?.toLowerCase().includes(q) ||
          r.ai_snapshot?.category_name?.toLowerCase().includes(q) ||
          r.developer_notes?.toLowerCase().includes(q)
      );
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      result = result.filter((r) => {
        const itemDate = new Date(r.created_at);
        if (dateFilter === 'today') {
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          return itemDate >= startOfToday;
        } else if (dateFilter === '7days') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return itemDate >= sevenDaysAgo;
        } else if (dateFilter === '30days') {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return itemDate >= thirtyDaysAgo;
        }
        return true;
      });
    }

    return result;
  }, [reports, statusFilter, searchQuery, dateFilter]);

  // Permission Guard
  const isSystemAdmin = userProfile?.role === 'system_admin' || userProfile?.role === 'super_admin';
  if (userProfile && !isSystemAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-3">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
          <ShieldAlert size={24} />
        </div>
        <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-100">
          จำกัดสิทธิ์การเข้าถึง (System Admin Only)
        </h2>
        <p className="text-xs text-neutral-500 max-w-sm">
          หน้านี้สงวนไว้สำหรับผู้ดูแลระบบระดับ System Admin เท่านั้นเพื่อใช้ตรวจสอบและปรับปรุงคุณภาพการวิเคราะห์ของ AI
        </p>
        <Link
          href="/"
          className="mt-2 px-4 py-2 bg-[#1a73e8] text-white text-xs font-medium rounded-xl hover:bg-[#1557b0] transition"
        >
          กลับสู่หน้าหลัก
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200/80 dark:border-neutral-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2.5">
            <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <AlertTriangle size={20} />
            </span>
            <span>{language === 'th' ? 'ปัญหาจากผู้ใช้งาน' : 'User Reported Issues'}</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 font-normal">
              AI Feedback Hub
            </span>
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            {language === 'th'
              ? 'รายการแจ้งเตือนเคสที่ AI วิเคราะห์ผิดพลาดจากลูกค้าและเจ้าหน้าที่ สำหรับใช้ปรับปรุง Prompt และประเมินความแม่นยำ'
              : 'Review and manage AI triage errors reported by users to continuously refine prompts and model accuracy.'}
          </p>
        </div>

        <button
          onClick={fetchReports}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 text-xs font-medium text-neutral-700 dark:text-neutral-200 shadow-2xs transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin text-sky-600' : ''} />
          <span>{language === 'th' ? 'รีเฟรชข้อมูล' : 'Refresh'}</span>
        </button>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
              {language === 'th' ? 'รายงานทั้งหมด' : 'Total Reports'}
            </div>
            <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1 font-mono">
              {kpis.total}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-400">
            <MessageSquare size={18} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-amber-200/80 dark:border-amber-900/40 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
              {language === 'th' ? 'รอดำเนินการ' : 'Pending'}
            </div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 font-mono">
              {kpis.pending}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
            <Clock size={18} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-sky-200/80 dark:border-sky-900/40 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-sky-600 dark:text-sky-400">
              {language === 'th' ? 'กำลังตรวจสอบ' : 'Investigating'}
            </div>
            <div className="text-2xl font-bold text-sky-600 dark:text-sky-400 mt-1 font-mono">
              {kpis.investigating}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-600">
            <SearchCode size={18} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-emerald-200/80 dark:border-emerald-900/40 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              {language === 'th' ? 'แก้ไข/ปรับปรุงแล้ว' : 'Resolved'}
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
              {kpis.resolved}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <CheckCircle2 size={18} />
          </div>
        </div>
      </div>

      {/* 3. Filter & Search Toolbar */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 p-3 sm:p-4 rounded-2xl shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'th' ? 'ค้นหารหัสแชต, ผู้รายงาน, ข้อความ หรือสิ่งที่ AI ตอบ...' : 'Search chat ID, reporter, comment...'}
            className="w-full text-xs pl-9 pr-4 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950/50 border border-neutral-200/80 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl text-xs">
            {[
              { id: 'all', label: 'ทั้งหมด' },
              { id: 'pending', label: 'รอดำเนินการ' },
              { id: 'investigating', label: 'กำลังตรวจ' },
              { id: 'resolved', label: 'แก้ไขแล้ว' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Date Range Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950/50 border border-neutral-200/80 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 focus:outline-none cursor-pointer"
          >
            <option value="all">ทุกช่วงเวลา</option>
            <option value="today">วันนี้</option>
            <option value="7days">7 วันล่าสุด</option>
            <option value="30days">30 วันล่าสุด</option>
          </select>
        </div>
      </div>

      {/* 4. Reports Table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-neutral-200/80 dark:divide-neutral-800">
            <thead className="bg-neutral-50/75 dark:bg-neutral-950/60 text-neutral-500 dark:text-neutral-400 font-medium">
              <tr>
                <th className="px-4 py-3.5">วัน-เวลา</th>
                <th className="px-4 py-3.5">แชต / ลูกค้า</th>
                <th className="px-4 py-3.5">ปัญหาที่พบ</th>
                <th className="px-4 py-3.5">AI วิเคราะห์ไว้เดิม</th>
                <th className="px-4 py-3.5">ข้อความจากผู้แจ้ง</th>
                <th className="px-4 py-3.5">ผู้รายงาน</th>
                <th className="px-4 py-3.5">สถานะ</th>
                <th className="px-4 py-3.5 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-neutral-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Loader2 size={24} className="animate-spin text-sky-500" />
                      <span>กำลังโหลดข้อมูลรายงานปัญหา...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-neutral-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <CheckCircle2 size={30} className="text-emerald-500/60" />
                      <span className="font-medium text-neutral-700 dark:text-neutral-300">
                        ไม่พบรายงานปัญหาที่ตรงตามเงื่อนไข
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        {reports.length === 0
                          ? 'ยังไม่มีรายงานปัญหา AI ถูกส่งเข้ามาในระบบ'
                          : 'ลองเปลี่ยนคำค้นหาหรือตัวกรองด้านบนเพื่อดูข้อมูลเพิ่มเติม'}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => {
                  const statusConf = STATUS_CONFIG[report.status] || STATUS_CONFIG.pending;
                  const StatusIcon = statusConf.icon;

                  return (
                    <tr
                      key={report.id}
                      className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 transition-colors"
                    >
                      {/* 1. Date */}
                      <td className="px-4 py-3.5 text-neutral-500 font-mono whitespace-nowrap text-[11px]">
                        {new Date(report.created_at).toLocaleString('th-TH', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* 2. Chat ID & Customer */}
                      <td className="px-4 py-3.5 max-w-[170px]">
                        <div className="space-y-1">
                          <div className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                            {report.customer_name || 'ลูกค้า'}
                          </div>
                          <div className="flex items-center gap-1 font-mono text-[10px] text-neutral-500">
                            <span className="truncate max-w-[100px]" title={report.chat_id}>
                              #{report.chat_id.slice(-8)}
                            </span>
                            <button
                              onClick={() => handleCopy(report.chat_id, report.id)}
                              className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                              title="คัดลอก Chat ID เต็ม"
                            >
                              {copiedId === report.id ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* 3. Reason Tags */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {(report.reasons || []).map((reasonKey) => {
                            const info = REASON_MAP[reasonKey] || { label: reasonKey, icon: '📌', color: 'bg-neutral-100 text-neutral-600' };
                            return (
                              <span
                                key={reasonKey}
                                className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md border ${info.color}`}
                              >
                                <span>{info.icon}</span>
                                <span>{info.label}</span>
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      {/* 4. AI Snapshot */}
                      <td className="px-4 py-3.5 max-w-[190px]">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium text-[11px] truncate max-w-[130px]">
                              {report.ai_snapshot?.category_name || 'ไม่ระบุหมวด'}
                            </span>
                            <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800">
                              {report.ai_snapshot?.priority || 'med'}
                            </span>
                          </div>
                          {report.ai_snapshot?.summary && (
                            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1 truncate" title={report.ai_snapshot.summary}>
                              {report.ai_snapshot.summary}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* 5. User Comment */}
                      <td className="px-4 py-3.5 max-w-[210px]">
                        {report.comment ? (
                          <div className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-950/40 border border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-700 dark:text-neutral-300 line-clamp-2">
                            &ldquo;{report.comment}&rdquo;
                          </div>
                        ) : (
                          <span className="text-neutral-400 text-[11px] italic">ไม่มีข้อความ</span>
                        )}
                      </td>

                      {/* 6. Reporter */}
                      <td className="px-4 py-3.5 text-neutral-600 dark:text-neutral-300 whitespace-nowrap text-[11px]">
                        <span className="font-medium">{report.reported_by}</span>
                      </td>

                      {/* 7. Status Selector */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <select
                          value={report.status}
                          onChange={(e) => handleUpdateStatus(report.id, e.target.value)}
                          className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border focus:outline-none cursor-pointer ${statusConf.bg} ${statusConf.text} ${statusConf.border}`}
                        >
                          <option value="pending">⏳ รอดำเนินการ</option>
                          <option value="investigating">🔍 กำลังตรวจสอบ</option>
                          <option value="resolved">✅ แก้ไขแล้ว</option>
                          <option value="ignored">⚪ ไม่ใช่ปัญหา</option>
                        </select>
                      </td>

                      {/* 8. Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Dev Notes Button */}
                          <button
                            onClick={() => {
                              setEditingNotesItem(report);
                              setNotesText(report.developer_notes || '');
                            }}
                            className={`p-1.5 rounded-lg border transition cursor-pointer ${
                              report.developer_notes
                                ? 'bg-sky-50 border-sky-200 text-sky-700 dark:bg-sky-950/40 dark:border-sky-800 dark:text-sky-300'
                                : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
                            }`}
                            title={report.developer_notes ? `โน้ต Dev: ${report.developer_notes}` : 'เพิ่มโน้ตการแก้ไขของ Dev'}
                          >
                            <FileEdit size={13} />
                          </button>

                          {/* Open Chat Link */}
                          <Link
                            href={`/chats?open=${encodeURIComponent(report.chat_id)}&date=all`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1a73e8] hover:bg-[#1557b0] text-white text-[11px] font-medium transition shadow-2xs"
                            title="เปิดดูบทสนทนานี้ในหน้าแชต"
                          >
                            <span>เปิดแชต</span>
                            <ExternalLink size={10} />
                          </Link>
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

      {/* 5. Developer Notes Modal */}
      {editingNotesItem && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <FileEdit size={16} className="text-sky-600" />
                <span>บันทึกการแก้ไขของ Developer</span>
              </h3>
              <button
                onClick={() => setEditingNotesItem(null)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1 rounded-lg"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-neutral-500 dark:text-neutral-400 block">
                บันทึกว่าได้แก้ไขอะไรไปบ้าง (เช่น ปรับปรุง Prompt, เพิ่มคีย์เวิร์ด, หรือปรับกฎเกณฑ์):
              </label>
              <textarea
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                rows={4}
                placeholder="เช่น: ปรับ Prompt ให้ดักจับคีย์เวิร์ด 'จำนำทะเบียนรถ' เป็นหมวดหมู่สินเชื่อเรียบร้อยแล้ว..."
                className="w-full text-xs p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition resize-none leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setEditingNotesItem(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveDeveloperNotes}
                disabled={savingNotes}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-medium shadow-2xs transition cursor-pointer disabled:opacity-50"
              >
                {savingNotes ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                <span>บันทึกโน้ต</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
