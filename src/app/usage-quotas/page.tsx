'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  MessageSquare,
  Cpu,
  Calendar,
  CalendarClock,
  Building2,
  Search,
  Download,
  Sliders,
  RefreshCw,
  BarChart3,
  Clock,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from 'recharts';
import EditQuotaModal from '@/components/quotas/EditQuotaModal';

interface CompanyOverviewItem {
  id: string;
  name: string;
  monthly_quota: number;
  used_messages: number;
  percent_used: number;
  status: 'normal' | 'warning_80' | 'critical_90';
}

export default function UsageQuotasPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [targetEditCompany, setTargetEditCompany] = useState<{
    id: string;
    name: string;
    monthly_quota?: number;
  } | null>(null);

  // Search filter for system admin table
  const [companySearch, setCompanySearch] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch Usage Quotas Data
  const fetchData = async () => {
    setLoading(true);
    try {
      let url = `/api/usage-quotas?month=${selectedMonth}`;
      if (selectedCompanyId) {
        url += `&company_id=${selectedCompanyId}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        if (!selectedCompanyId && json.targetCompany?.id) {
          setSelectedCompanyId(json.targetCompany.id);
        }
      }
    } catch (err) {
      console.error('Error fetching usage quotas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCompanyId, selectedMonth]);

  // Handle Export Historical CSV
  const handleExportCSV = () => {
    if (!data?.history || data.history.length === 0) return;

    const headers = ['รอบเดือน,โควต้าที่จัดสรร (ข้อความ),ข้อความที่ใช้จริง,ร้อยละการใช้งาน (%),สถานะ'];
    const rows = data.history.map((h: any) =>
      `"${h.label}","${h.quota.toLocaleString()}","${h.used.toLocaleString()}","${h.percent}%","${
        h.status === 'critical' ? 'วิกฤต (เกิน 90%)' : h.status === 'warning' ? 'เฝ้าระวัง (เกิน 80%)' : 'ปกติ'
      }"`
    );

    const csvContent = '\uFEFF' + [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `usage_quota_${data?.targetCompany?.name || 'company'}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Overview Companies for System Admin
  const filteredCompanies = useMemo(() => {
    if (!data?.allCompaniesOverview) return [];
    if (!companySearch.trim()) return data.allCompaniesOverview;
    const term = companySearch.toLowerCase();
    return data.allCompaniesOverview.filter((c: CompanyOverviewItem) =>
      c.name.toLowerCase().includes(term)
    );
  }, [data?.allCompaniesOverview, companySearch]);

  const targetComp = data?.targetCompany;
  const percentUsed = data?.percentUsed || 0;
  const alertLevel = data?.alertLevel || 'normal';
  const monthlyQuota = data?.monthlyQuota || 50000;
  const usedMessages = data?.usedMessages || 0;
  const remainingMessages = Math.max(0, monthlyQuota - usedMessages);

  // Status Color Logic
  const getProgressColor = (percent: number) => {
    if (percent >= 90) return 'from-rose-500 to-red-600';
    if (percent >= 80) return 'from-amber-500 to-orange-500';
    return 'from-emerald-500 to-teal-500';
  };

  const getBadgeStyle = (status: string) => {
    if (status === 'critical_90' || status === 'critical') {
      return 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-900';
    }
    if (status === 'warning_80' || status === 'warning') {
      return 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-900';
    }
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900';
  };

  const getBadgeLabel = (status: string) => {
    if (status === 'critical_90' || status === 'critical') return 'วิกฤต (≥90%)';
    if (status === 'warning_80' || status === 'warning') return 'เฝ้าระวัง (≥80%)';
    return 'ปกติ (<80%)';
  };

  return (
    <div className="min-h-screen bg-neutral-50/60 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 p-4 md:p-6 lg:p-8 space-y-6">
      {/* 1. Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Activity size={22} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">
                ระบบติดตามการใช้งานและโควต้า
              </h1>
              <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400">
                ตรวจสอบปริมาณข้อความ, โทเคน AI และระบบแจ้งเตือนอัตโนมัติ 80% / 90%
              </p>
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month Picker */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-medium shadow-xs">
            <Calendar size={14} className="text-neutral-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent border-none text-xs focus:outline-hidden font-mono text-neutral-700 dark:text-neutral-300 cursor-pointer"
            />
          </div>

          {/* Company Switcher (if System Admin) */}
          {data?.isSystemAdmin && data?.companies?.length > 1 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs shadow-xs">
              <Building2 size={14} className="text-neutral-400" />
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="bg-transparent border-none text-xs focus:outline-hidden text-neutral-700 dark:text-neutral-300 font-medium cursor-pointer max-w-[180px] truncate"
              >
                {data.companies.map((c: any) => (
                  <option key={c.id} value={c.id} className="dark:bg-neutral-900">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition shadow-xs cursor-pointer"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-blue-500' : ''} />
          </button>

          {/* System Admin Edit Current Company Quota */}
          {data?.isSystemAdmin && targetComp && (
            <button
              onClick={() => {
                setTargetEditCompany({
                  id: targetComp.id,
                  name: targetComp.name,
                  monthly_quota: monthlyQuota,
                });
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition cursor-pointer"
            >
              <Sliders size={13} />
              <span>ปรับแต่งโควต้า</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Automated Alert Banners (80% & 90% Thresholds) */}
      {alertLevel === 'critical_90' && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border-2 border-rose-500/40 text-rose-800 dark:text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500 text-white shrink-0">
              <ShieldAlert size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-wide text-rose-700 dark:text-rose-300 uppercase">
                  วิกฤต: โควต้าใกล้เต็ม 90% (Critical Alert)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500 text-white">
                  {percentUsed}% แล้ว
                </span>
              </div>
              <p className="text-xs text-rose-700/90 dark:text-rose-300/90 mt-0.5">
                บริษัท <strong>{targetComp?.name}</strong> ใช้งานไปแล้ว{' '}
                <strong>{usedMessages.toLocaleString()}</strong> จาก{' '}
                <strong>{monthlyQuota.toLocaleString()}</strong> ข้อความ (เหลืออีกเพียง{' '}
                {remainingMessages.toLocaleString()} ข้อความ) เสี่ยงต่อการระงับข้อความอัตโนมัติหากเกิน 100%
              </p>
            </div>
          </div>
          {data?.isSystemAdmin && (
            <button
              onClick={() => {
                setTargetEditCompany({
                  id: targetComp?.id,
                  name: targetComp?.name,
                  monthly_quota: monthlyQuota,
                });
                setModalOpen(true);
              }}
              className="shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition cursor-pointer"
            >
              เพิ่มโควต้าทันที
            </button>
          )}
        </div>
      )}

      {alertLevel === 'warning_80' && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-800 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-amber-800 dark:text-amber-300 uppercase">
                  แจ้งเตือนเฝ้าระวัง: ใช้โควต้าถึง 80% (Warning Alert)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500 text-white">
                  {percentUsed}%
                </span>
              </div>
              <p className="text-xs text-amber-700/90 dark:text-amber-300/90 mt-0.5">
                บริษัท <strong>{targetComp?.name}</strong> ใช้งานถึง 80% ของโควต้าประจำเดือนแล้ว (เหลืออีก{' '}
                {remainingMessages.toLocaleString()} ข้อความ ในอีก {data?.daysRemaining || 0} วัน)
                กรุณาวางแผนขยายแพ็กเกจล่วงหน้า
              </p>
            </div>
          </div>
          {data?.isSystemAdmin && (
            <button
              onClick={() => {
                setTargetEditCompany({
                  id: targetComp?.id,
                  name: targetComp?.name,
                  monthly_quota: monthlyQuota,
                });
                setModalOpen(true);
              }}
              className="shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition cursor-pointer"
            >
              ปรับแต่งโควต้า
            </button>
          )}
        </div>
      )}

      {alertLevel === 'normal' && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-200 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              สถานะการใช้งานของ <strong>{targetComp?.name}</strong> อยู่ในเกณฑ์ปกติ (ใช้ไป {percentUsed}%)
              พร้อมใช้งานได้อีก <strong>{remainingMessages.toLocaleString()}</strong> ข้อความในรอบเดือนนี้
            </span>
          </div>
          <span className="hidden sm:inline-block font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
            {data?.currentMonthLabel}
          </span>
        </div>
      )}

      {/* 3. Hero Monthly Quota Progress Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Quota Progress */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  โควต้าประจำเดือน ({data?.currentMonthLabel || selectedMonth})
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl md:text-3xl font-extrabold font-mono text-neutral-900 dark:text-white">
                    {usedMessages.toLocaleString()}
                  </span>
                  <span className="text-sm md:text-base font-semibold text-neutral-400 font-mono">
                    / {monthlyQuota.toLocaleString()} ข้อความ
                  </span>
                </div>
              </div>

              {/* Percent Badge */}
              <div className="text-right">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold font-mono border ${getBadgeStyle(
                    alertLevel
                  )}`}
                >
                  {percentUsed}% {getBadgeLabel(alertLevel)}
                </span>
                <p className="text-[11px] text-neutral-400 mt-1">
                  คงเหลือ {remainingMessages.toLocaleString()} ข้อความ
                </p>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full h-3.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden p-0.5 border border-neutral-200/50 dark:border-neutral-700/50">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(
                  percentUsed
                )} transition-all duration-700 ease-out`}
                style={{ width: `${Math.min(100, Math.max(2, percentUsed))}%` }}
              />
            </div>

            {/* Threshold Markers Note */}
            <div className="flex justify-between items-center text-[10px] text-neutral-400 font-mono pt-0.5">
              <span>0%</span>
              <span className="text-amber-500 font-medium">▲ เตือน 80% ({Math.round(monthlyQuota * 0.8).toLocaleString()})</span>
              <span className="text-rose-500 font-medium">▲ วิกฤต 90% ({Math.round(monthlyQuota * 0.9).toLocaleString()})</span>
              <span>100% ({monthlyQuota.toLocaleString()})</span>
            </div>
          </div>

          {/* Right: Cycle Days Box */}
          <div className="lg:w-72 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-800 flex flex-col justify-center space-y-1.5 shrink-0">
            <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 text-xs">
              <Clock size={14} />
              <span>รอบระยะเวลาการใช้งาน</span>
            </div>
            <div className="text-lg font-bold text-neutral-800 dark:text-neutral-200">
              เหลืออีก {data?.daysRemaining || 0} วัน
            </div>
            <p className="text-[11px] text-neutral-400">
              ผ่านไปแล้ว {data?.daysElapsed || 0} จากทั้งหมด {data?.totalDaysInMonth || 30} วัน ในรอบเดือนนี้
            </p>
          </div>
        </div>
      </div>

      {/* 4. 4 Key KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Used Messages */}
        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">ข้อความที่ใช้ในเดือนนี้</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <MessageSquare size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
            {usedMessages.toLocaleString()}
          </div>
          <p className="text-[11px] text-neutral-400">
            คิดเป็น {percentUsed}% ของโควต้าเดือนนี้
          </p>
        </div>

        {/* Card 2: Estimated Tokens */}
        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">โทเคน AI ประมาณการ</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Cpu size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400">
            ~{(Number(data?.tokensEstimated || 0) / 1000000).toFixed(2)}M
          </div>
          <p className="text-[11px] text-neutral-400 font-mono">
            {Number(data?.tokensEstimated || 0).toLocaleString()} Tokens
          </p>
        </div>

        {/* Card 3: Daily Average */}
        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">เฉลี่ยต่อวัน (Daily Avg)</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
            {Number(data?.dailyAverage || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-neutral-400">
            เกณฑ์แนะนำ: ~{Math.round(monthlyQuota / (data?.totalDaysInMonth || 30)).toLocaleString()} ข้อความ/วัน
          </p>
        </div>

        {/* Card 4: Month-end Forecast */}
        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">พยากรณ์สิ้นเดือน</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <CalendarClock size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
            {Number(data?.projectedMonthEnd || 0).toLocaleString()}
          </div>
          <p
            className={`text-[11px] font-medium ${
              Number(data?.projectedMonthEnd || 0) > monthlyQuota
                ? 'text-rose-500'
                : 'text-emerald-500'
            }`}
          >
            {Number(data?.projectedMonthEnd || 0) > monthlyQuota
              ? `⚠️ เสี่ยงเกินโควต้า (${Math.round(
                  (Number(data?.projectedMonthEnd || 0) / monthlyQuota) * 100
                )}%)`
              : '✓ ปลอดภัย อยู่ในกรอบโควต้า'}
          </p>
        </div>
      </div>

      {/* 5. Charts Section (Daily Usage & Peak Hours) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Usage Chart (2 Cols) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-blue-500" />
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                ปริมาณการใช้งานรายวัน (Daily Usage Trend)
              </h3>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-neutral-400">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-blue-500 inline-block" />
                ข้อความที่ใช้
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 border-b-2 border-dashed border-rose-400 inline-block" />
                เกณฑ์แนะนำต่อวัน
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            {isMounted && data?.dailyChart?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.dailyChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                  <XAxis
                    dataKey="day"
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(23, 23, 23, 0.9)',
                      borderColor: '#404040',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`${val.toLocaleString()} ข้อความ`, 'การใช้งาน']}
                    labelFormatter={(label: any) => `วันที่ ${label} ของเดือน`}
                  />
                  {data.dailyChart[0]?.benchmark && (
                    <ReferenceLine
                      y={data.dailyChart[0].benchmark}
                      stroke="#f43f5e"
                      strokeDasharray="4 4"
                      label={{
                        value: 'เกณฑ์เฉลี่ย',
                        fill: '#f43f5e',
                        fontSize: 10,
                        position: 'insideTopRight',
                      }}
                    />
                  )}
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={32}>
                    {data.dailyChart.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.count > (entry.benchmark || 0) * 1.5
                            ? '#f43f5e'
                            : entry.count > (entry.benchmark || 0)
                            ? '#f59e0b'
                            : '#3b82f6'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-neutral-400">
                ยังไม่มีข้อมูลการใช้งานรายวันในเดือนนี้
              </div>
            )}
          </div>
        </div>

        {/* Peak Hours Chart (1 Col) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-purple-500" />
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                ช่วงเวลาการใช้งานสูงสุด (Peak Hours)
              </h3>
            </div>
            <span className="text-[11px] text-neutral-400">00:00 - 23:00</span>
          </div>

          <div className="h-64 w-full">
            {isMounted && data?.peakHours?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.peakHours} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                  <XAxis
                    dataKey="hour"
                    stroke="#888888"
                    fontSize={10}
                    interval={3}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(23, 23, 23, 0.9)',
                      borderColor: '#404040',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`${val.toLocaleString()} ข้อความ`, 'ปริมาณแชท']}
                    labelFormatter={(label: any) => `เวลา ${label}`}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-neutral-400">
                ยังไม่มีข้อมูลชั่วโมงสนทนา
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6. Historical Monthly Usage Table */}
      <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              ประวัติการใช้งานย้อนหลัง (Historical Usage Cycles)
            </h3>
            <p className="text-xs text-neutral-400">
              เปรียบเทียบโควต้าและการใช้งานจริงในรอบ 4 เดือนล่าสุดของ {targetComp?.name}
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-medium transition cursor-pointer self-start sm:self-auto"
          >
            <Download size={13} />
            <span>ส่งออก CSV</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 uppercase text-[11px] font-semibold">
                <th className="pb-3 pl-2">รอบเดือน</th>
                <th className="pb-3">โควต้าที่จัดสรร</th>
                <th className="pb-3">ข้อความที่ใช้จริง</th>
                <th className="pb-3 min-w-[160px]">สัดส่วนการใช้งาน (%)</th>
                <th className="pb-3 pr-2 text-right">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 font-mono">
              {data?.history?.map((item: any, idx: number) => (
                <tr key={idx} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition">
                  <td className="py-3.5 pl-2 font-sans font-medium text-neutral-900 dark:text-neutral-100">
                    {item.label}
                  </td>
                  <td className="py-3.5 text-neutral-600 dark:text-neutral-300">
                    {item.quota.toLocaleString()}
                  </td>
                  <td className="py-3.5 font-bold text-neutral-900 dark:text-neutral-100">
                    {item.used.toLocaleString()}
                  </td>
                  <td className="py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(
                            item.percent
                          )}`}
                          style={{ width: `${Math.min(100, item.percent)}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 w-10 text-right">
                        {item.percent}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 pr-2 text-right">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-sans font-semibold border ${getBadgeStyle(
                        item.status
                      )}`}
                    >
                      {getBadgeLabel(item.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. System Admin: Multi-Company Quotas Overview Table */}
      {data?.isSystemAdmin && (
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-blue-500" />
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  ภาพรวมโควต้าของทุกบริษัท (Multi-Tenant Quotas Overview)
                </h3>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                เฉพาะ System Admin: ดูแลโควต้า ปรับแต่งขีดจำกัด และเฝ้าระวังบริษัทที่ใช้เกิน 80% หรือ 90%
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-2.5 text-neutral-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อบริษัท..."
                value={companySearch}
                onChange={(e) => setCompanySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 uppercase text-[11px] font-semibold">
                  <th className="pb-3 pl-2">ชื่อบริษัท</th>
                  <th className="pb-3">โควต้าต่อเดือน</th>
                  <th className="pb-3">ใช้ไปแล้ว</th>
                  <th className="pb-3 min-w-[150px]">สัดส่วน (%)</th>
                  <th className="pb-3">สถานะ</th>
                  <th className="pb-3 pr-2 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 font-mono">
                {filteredCompanies.map((comp: CompanyOverviewItem) => (
                  <tr
                    key={comp.id}
                    className={`hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition ${
                      selectedCompanyId === comp.id ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                    }`}
                  >
                    <td className="py-3.5 pl-2 font-sans font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                      <span>{comp.name}</span>
                      {selectedCompanyId === comp.id && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-xs bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                          เปิดอยู่
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 text-neutral-600 dark:text-neutral-300">
                      {comp.monthly_quota.toLocaleString()}
                    </td>
                    <td className="py-3.5 font-bold text-neutral-900 dark:text-neutral-100">
                      {comp.used_messages.toLocaleString()}
                    </td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex-1 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(
                              comp.percent_used
                            )}`}
                            style={{ width: `${Math.min(100, comp.percent_used)}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 w-10 text-right">
                          {comp.percent_used}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-sans font-semibold border ${getBadgeStyle(
                          comp.status
                        )}`}
                      >
                        {getBadgeLabel(comp.status)}
                      </span>
                    </td>
                    <td className="py-3.5 pr-2 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedCompanyId(comp.id)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-sans font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition cursor-pointer"
                        >
                          ดูกราฟ
                        </button>
                        <button
                          onClick={() => {
                            setTargetEditCompany({
                              id: comp.id,
                              name: comp.name,
                              monthly_quota: comp.monthly_quota,
                            });
                            setModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                          title="ปรับแต่งโควต้า"
                        >
                          <Sliders size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Quota Modal */}
      <EditQuotaModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          fetchData();
        }}
        company={targetEditCompany}
      />
    </div>
  );
}