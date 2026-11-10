'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/components/LanguageContext';
import ReportTypeSelector from '@/components/reports/ReportTypeSelector';
import ReportFilterBar from '@/components/reports/ReportFilterBar';
import ReportMetricsGrid from '@/components/reports/ReportMetricsGrid';
import ExportActionPanel, { ExportFormatMode } from '@/components/reports/ExportActionPanel';
import ExportHistoryLogs, { ExportHistoryItem } from '@/components/reports/ExportHistoryLogs';
import { exportMultiSheetXLSX, exportSingleCSV, exportToGoogleDocs } from '@/lib/reportExport';
import { useReportMetrics } from '@/hooks/useReportMetrics';
import { CheckCircle2, ExternalLink, Copy, X } from 'lucide-react';

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

  // Selected Export Format Mode: 'xlsx_multi_sheet' | 'csv_single' | 'google_docs'
  const [exportFormatMode, setExportFormatMode] = useState<ExportFormatMode>('xlsx_multi_sheet');

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

  // Google Docs Modal / Toast Notice
  const [googleDocsSuccessNotice, setGoogleDocsSuccessNotice] = useState<{
    open: boolean;
    itemCount: number;
    openUrl: string;
  } | null>(null);

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
  const handleExportMain = async (historyItem?: ExportHistoryItem) => {
    let exportResult: { filename: string; size: string; openUrl?: string; rowCount?: number } | null = null;

    if (exportFormatMode === 'google_docs') {
      exportResult = await exportToGoogleDocs(chats, reportType, currentFilterOptions, dateRange, userProfile, 'document');
      if (exportResult) {
        setGoogleDocsSuccessNotice({
          open: true,
          itemCount: exportResult.rowCount || metrics.filteredCount,
          openUrl: exportResult.openUrl || 'https://docs.google.com/document/create',
        });
      }
    } else if (exportFormatMode === 'xlsx_multi_sheet') {
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
        exportFormatMode === 'google_docs'
          ? `docs.google (${reportType})`
          : exportFormatMode === 'xlsx_multi_sheet'
          ? `Excel 3 แท็บชีต (${dateRange})`
          : `CSV (${reportType})`,
      date: new Date().toISOString(),
      size: exportResult.size,
      status: 'ready',
      user: userProfile?.name || 'Admin',
      openUrl: exportResult.openUrl,
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
            ? 'ส่งออกข้อมูลแชต สรุปประเด็นธุรกรรม และสถิติการสนทนาในรูปแบบ Excel (แยกแท็บชีต), CSV หรือ docs.google'
            : 'Export chat telemetry, transaction summaries, and conversation logs as multi-tab Excel, CSV or docs.google'}
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
        onExport={() => handleExportMain()}
        filteredCount={metrics.filteredCount}
        loading={loading}
        language={language}
      />

      {/* Google Docs Helpful Notification Banner */}
      {googleDocsSuccessNotice && googleDocsSuccessNotice.open && (
        <div className="rounded-xl border border-blue-200/90 dark:border-blue-900/80 bg-blue-50/80 dark:bg-blue-950/40 p-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-[#1a73e8] dark:text-blue-300 shrink-0">
                <CheckCircle2 size={18} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100">
                    {language === 'th' ? 'เปิดหน้า docs.google เรียบร้อยแล้ว!' : 'docs.google opened successfully!'}
                  </h4>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-blue-100 dark:bg-blue-900/50 text-[#1a73e8] dark:text-blue-300">
                    {googleDocsSuccessNotice.itemCount} {language === 'th' ? 'รายการ' : 'items'}
                  </span>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  {language === 'th' ? (
                    <>
                      ระบบได้เปิดหน้า <strong className="text-[#1a73e8] font-mono">docs.google.com</strong> ในแท็บใหม่ และคัดลอกตารางข้อมูลลงคลิปบอร์ดแล้ว
                      <br className="hidden sm:inline" /> เพียงกด <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-[11px] font-mono font-semibold shadow-2xs">Ctrl + V</kbd> หรือคลิกขวาแล้วเลือก <strong className="font-medium">วาง (Paste)</strong> ในหน้า Google Docs ตารางข้อมูลพร้อมหัวข้อจะปรากฏทันทีค่ะ ✨
                    </>
                  ) : (
                    <>
                      Opened <strong className="text-[#1a73e8] font-mono">docs.google.com</strong> in a new tab and copied report table to your clipboard.
                      <br className="hidden sm:inline" /> Press <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-[11px] font-mono font-semibold shadow-2xs">Ctrl + V</kbd> or right-click <strong className="font-medium">Paste</strong> in Google Docs to insert the table.
                    </>
                  )}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      exportToGoogleDocs(chats, reportType, currentFilterOptions, dateRange, userProfile, 'document');
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#1a73e8] hover:bg-[#1557b0] text-white transition-colors cursor-pointer select-none"
                  >
                    <Copy size={12} />
                    <span>{language === 'th' ? 'คัดลอกตารางใหม่อีกครั้ง' : 'Copy Table Again'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      exportToGoogleDocs(chats, reportType, currentFilterOptions, dateRange, userProfile, 'spreadsheets');
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer select-none"
                  >
                    <ExternalLink size={12} />
                    <span>{language === 'th' ? 'เปิดใน Google Sheets (ตารางคำนวณ)' : 'Open in Google Sheets'}</span>
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setGoogleDocsSuccessNotice(null)}
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* 5. Recent Export Logs */}
      <ExportHistoryLogs
        logs={exportHistory}
        onReDownload={(item) => {
          if (item?.openUrl) {
            exportToGoogleDocs(chats, reportType, currentFilterOptions, dateRange, userProfile, 'document');
          } else {
            handleExportMain(item);
          }
        }}
        language={language}
      />
    </div>
  );
}
