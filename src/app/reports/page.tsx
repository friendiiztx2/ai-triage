'use client';

import { useState, useEffect, useMemo } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import ReportTypeSelector from '@/components/reports/ReportTypeSelector';
import ReportFilterBar from '@/components/reports/ReportFilterBar';
import ReportMetricsGrid from '@/components/reports/ReportMetricsGrid';
import ExportActionPanel from '@/components/reports/ExportActionPanel';
import ExportHistoryLogs, { ExportHistoryItem } from '@/components/reports/ExportHistoryLogs';
import { exportMultiSheetXLSX, exportSingleCSV } from '@/lib/reportExport';
import { useReportMetrics } from '@/hooks/useReportMetrics';

export default function ReportsPage() {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [chats, setChats] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);

  // Active User session settings
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activeCompanyId, setActiveCompanyId] = useState('');

  // Selected Report Type State: 'overall' | 'finance' | 'marketing'
  const [reportType, setReportType] = useState<'overall' | 'finance' | 'marketing'>('overall');

  // Selected Export Format Mode: 'xlsx_multi_sheet' | 'csv_single'
  const [exportFormatMode, setExportFormatMode] = useState<'xlsx_multi_sheet' | 'csv_single'>('xlsx_multi_sheet');

  // Filter States
  const [dateRange, setDateRange] = useState('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState('all');

  // Dynamic Export History Logs
  const [exportHistory, setExportHistory] = useState<ExportHistoryItem[]>([]);

  // Initialize session & load dependencies
  useEffect(() => {
    const savedLogs = localStorage.getItem('ai_triage_export_history');
    if (savedLogs) {
      try {
        const parsed = JSON.parse(savedLogs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setExportHistory(parsed);
        }
      } catch (e) {}
    }

    const savedSession = localStorage.getItem('user_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setUserProfile(parsed);
        const rawCompId = localStorage.getItem('company_id') || parsed.companyId || parsed.company_id || '';
        const compId =
          rawCompId && rawCompId !== 'null' && rawCompId !== 'undefined' && rawCompId !== 'all'
            ? rawCompId
            : '';
        setActiveCompanyId(compId);
        setSelectedCompanyFilter(
          parsed.role === 'system_admin' || parsed.role === 'super_admin' || !compId ? 'all' : compId
        );
      } catch (e) {}
    }

    // Load category definitions
    fetch('/api/categories', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch((err) => console.error('Error loading categories:', err));

    // Load companies list
    fetch('/api/companies', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCompanies(data);
      })
      .catch((err) => console.error('Error loading companies:', err));
  }, []);

  // Fetch all chats
  useEffect(() => {
    fetchChatsData();
  }, [activeCompanyId]);

  const fetchChatsData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/chats?summary_only=true', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setChats(data);
          if (data.length > 0 && dateRange === 'today') {
            const todayLocalStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
            const hasToday = data.some((c: any) => {
              if (!c.created_at) return false;
              return new Date(c.created_at).toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' }) === todayLocalStr;
            });
            if (!hasToday) {
              setDateRange('30days');
            }
          }
        }
      }
    } catch (err) {
      console.error('Error loading chats for reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentFilterOptions = useMemo(
    () => ({
      selectedCompanyFilter,
      selectedStatus,
      selectedPriority,
      selectedCategory,
      dateRange,
      startDate,
      endDate,
      isSystemAdmin: userProfile?.role === 'system_admin',
    }),
    [selectedCompanyFilter, selectedStatus, selectedPriority, selectedCategory, dateRange, startDate, endDate, userProfile]
  );

  const metrics = useReportMetrics(chats, reportType, currentFilterOptions);

  // Unified Export Handler
  const handleExportMain = () => {
    let exportResult: { filename: string; size: string } | null = null;

    if (exportFormatMode === 'xlsx_multi_sheet') {
      exportResult = exportMultiSheetXLSX(chats, currentFilterOptions, dateRange, userProfile);
    } else {
      exportResult = exportSingleCSV(chats, reportType, currentFilterOptions, dateRange);
    }

    if (!exportResult) {
      alert(language === 'th' ? 'ไม่มีข้อมูลแชตที่สอดคล้องกับฟิลเตอร์การส่งออก' : 'No chat data matched your export filters.');
      return;
    }

    // Save Export Log
    const newId = `EXP-${Math.floor(1000 + Math.random() * 9000)}`;
    const newLogItem: ExportHistoryItem = {
      id: newId,
      name: exportResult.filename,
      type:
        exportFormatMode === 'xlsx_multi_sheet'
          ? `Excel 3 แท็บชีต (${dateRange})`
          : `CSV (${reportType})`,
      date: new Date().toISOString(),
      size: exportResult.size,
      status: 'ready',
      user: userProfile?.name || 'Admin',
    };

    setExportHistory((prev) => {
      const updated = [newLogItem, ...prev];
      try {
        localStorage.setItem('ai_triage_export_history', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pb-1">
        <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight font-display">
          {language === 'th' ? 'รายงานและส่งออกข้อมูล' : 'Reports & Data Export'}
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-xs sm:text-sm mt-0.5 font-normal">
          {language === 'th'
            ? 'ส่งออกข้อมูลแชต สรุปประเด็นธุรกรรม และสถิติการสนทนาในรูปแบบ Excel (แยกแท็บชีต) หรือ CSV'
            : 'Export chat telemetry, transaction summaries, and conversation logs as multi-tab Excel or CSV'}
        </p>
      </div>

      {/* 1. Report Type Selection Tabs */}
      <ReportTypeSelector
        reportType={reportType}
        onSelectType={setReportType}
        language={language}
      />

      {/* 2. Filter Bar */}
      <ReportFilterBar
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedPriority={selectedPriority}
        onPriorityChange={setSelectedPriority}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        selectedCompany={selectedCompanyFilter}
        onCompanyChange={setSelectedCompanyFilter}
        categories={categories}
        companies={companies}
        isSystemAdmin={userProfile?.role === 'system_admin'}
        language={language}
      />

      {/* 3. Metrics Summary Grid */}
      <ReportMetricsGrid
        filteredCount={metrics.filteredCount}
        pendingCount={metrics.pendingCount}
        completedCount={metrics.completedCount}
        urgentCount={metrics.urgentCount}
        highCount={metrics.highCount}
        mediumCount={metrics.mediumCount}
        lowCount={metrics.lowCount}
        depositCount={metrics.depositCount}
        withdrawalCount={metrics.withdrawalCount}
        newCustomerCount={metrics.newCustomerCount}
        returningCustomerCount={metrics.returningCustomerCount}
        language={language}
      />

      {/* 4. Action Export Panel */}
      <ExportActionPanel
        exportFormatMode={exportFormatMode}
        onFormatChange={setExportFormatMode}
        onExport={handleExportMain}
        filteredCount={metrics.filteredCount}
        loading={loading}
        language={language}
      />

      {/* 5. Recent Export Logs */}
      <ExportHistoryLogs
        logs={exportHistory}
        onReDownload={handleExportMain}
        language={language}
      />
    </div>
  );
}
