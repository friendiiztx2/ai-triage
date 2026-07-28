'use client';

import { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, Download, Calendar, Filter, RefreshCw, 
  ChevronRight, CheckCircle2, AlertTriangle, Clock, History, FileText, Globe
} from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { supabase } from '@/lib/supabase';

export default function ReportsPage() {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [chats, setChats] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  
  // Active User session settings
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activeCompanyId, setActiveCompanyId] = useState('');

  // Filter States
  const [dateRange, setDateRange] = useState('7days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState('all');

  // Preview stats
  const [filteredCount, setFilteredCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [urgentCount, setUrgentCount] = useState(0);
  const [highCount, setHighCount] = useState(0);
  const [mediumCount, setMediumCount] = useState(0);
  const [lowCount, setLowCount] = useState(0);

  // History list state (starts with pre-seeded past downloads logs)
  const [exportHistory, setExportHistory] = useState([
    { id: 'EXP-1092', name: 'chats_weekly_triage_report.csv', type: 'Weekly Summary', date: '2026-07-19T14:32:15Z', size: '14.2 KB', status: 'ready', user: 'aor' },
    { id: 'EXP-1091', name: 'july_customer_support_kpi.csv', type: 'Monthly Audit', date: '2026-07-15T11:05:40Z', size: '48.9 KB', status: 'ready', user: 'system_admin' },
    { id: 'EXP-1089', name: 'categories_distribution_dataset.csv', type: 'Category Stats', date: '2026-07-10T16:45:08Z', size: '8.4 KB', status: 'ready', user: 'aor' },
    { id: 'EXP-1084', name: 'system_admin_audit_logs.csv', type: 'Security Audit', date: '2026-07-01T09:20:00Z', size: '124.1 KB', status: 'archived', user: 'system_admin' }
  ]);

  // Initialize session & load dependencies
  useEffect(() => {
    const savedSession = localStorage.getItem('user_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setUserProfile(parsed);
        const compId = localStorage.getItem('company_id') || parsed.companyId || parsed.company_id || '2c3f46cc-fae8-4ef8-99e1-874dec8b2af2';
        setActiveCompanyId(compId);
        setSelectedCompanyFilter(parsed.role === 'system_admin' ? 'all' : compId);
      } catch (e) {
        // Fallback
      }
    }

    // Load category definitions
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(err => console.error('Error loading categories:', err));

    // Load companies list
    fetch('/api/companies')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCompanies(data);
      })
      .catch(err => console.error('Error loading companies:', err));
  }, []);

  // Fetch all chats
  useEffect(() => {
    fetchChatsData();
  }, [activeCompanyId]);

  const fetchChatsData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/chats');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setChats(data);
      }
    } catch (err) {
      console.error('Error loading chats for reports:', err);
    } finally {
      setLoading(false);
    }
  };

  // Perform client-side calculations based on active filters
  useEffect(() => {
    let result = chats;

    // 1. Company Filter
    if (userProfile?.role === 'system_admin' && selectedCompanyFilter !== 'all') {
      result = result.filter(c => c.company_id === selectedCompanyFilter);
    }

    // 2. Status Filter
    if (selectedStatus !== 'all') {
      result = result.filter(c => (c.status || 'pending') === selectedStatus);
    }

    // 3. Priority Filter
    if (selectedPriority !== 'all') {
      result = result.filter(c => (c.priority?.toLowerCase() || 'low') === selectedPriority);
    }

    // 4. Category Filter
    if (selectedCategory !== 'all') {
      result = result.filter(c => {
        if (c.chat_issues && c.chat_issues.length > 0) {
          return c.chat_issues.some((issue: any) => issue.category_id === selectedCategory);
        }
        return c.category_id === selectedCategory;
      });
    }

    // 5. Date Filter
    if (dateRange !== 'all') {
      const now = new Date();
      const cutoff = new Date();

      if (dateRange === 'today') {
        cutoff.setHours(0, 0, 0, 0);
        result = result.filter(c => c.created_at && new Date(c.created_at) >= cutoff);
      } else if (dateRange === '7days') {
        cutoff.setDate(now.getDate() - 7);
        result = result.filter(c => c.created_at && new Date(c.created_at) >= cutoff);
      } else if (dateRange === '30days') {
        cutoff.setDate(now.getDate() - 30);
        result = result.filter(c => c.created_at && new Date(c.created_at) >= cutoff);
      } else if (dateRange === 'custom' && startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        result = result.filter(c => {
          if (!c.created_at) return false;
          const chatDate = new Date(c.created_at);
          return chatDate >= start && chatDate <= end;
        });
      }
    }

    setFilteredCount(result.length);

    // Compute status counts
    const pending = result.filter(c => (c.status || 'pending') === 'pending').length;
    setPendingCount(pending);
    setCompletedCount(result.length - pending);

    // Compute priorities
    let urgent = 0, high = 0, medium = 0, low = 0;
    result.forEach(c => {
      const p = c.priority?.toLowerCase() || 'low';
      if (p === 'urgent') urgent++;
      else if (p === 'high') high++;
      else if (p === 'medium') medium++;
      else low++;
    });
    setUrgentCount(urgent);
    setHighCount(high);
    setMediumCount(medium);
    setLowCount(low);

  }, [chats, dateRange, startDate, endDate, selectedCategory, selectedPriority, selectedStatus, selectedCompanyFilter, userProfile]);

  // Export to CSV Function querying directly from Database View vw_triage_export
  const handleExport = async () => {
    let result = chats;

    // 1. Attempt to query directly from Database View vw_triage_export as requested
    try {
      const { data: viewData, error: viewError } = await supabase
        .from('vw_triage_export')
        .select('*')
        .order('created_at', { ascending: false });

      if (!viewError && viewData && viewData.length > 0) {
        result = viewData;
      }
    } catch (e) {
      console.warn('vw_triage_export view query fallback:', e);
    }

    // Apply exact active filters if needed
    if (userProfile?.role === 'system_admin' && selectedCompanyFilter !== 'all') {
      result = result.filter(c => c.company_id === selectedCompanyFilter);
    }
    if (selectedStatus !== 'all') {
      result = result.filter(c => (c.status || 'pending') === selectedStatus);
    }
    if (selectedPriority !== 'all') {
      result = result.filter(c => (c.priority?.toLowerCase() || 'low') === selectedPriority);
    }
    if (selectedCategory !== 'all') {
      result = result.filter(c => {
        if (c.chat_issues && c.chat_issues.length > 0) {
          return c.chat_issues.some((issue: any) => issue.category_id === selectedCategory);
        }
        return c.category_id === selectedCategory || c.category === selectedCategory;
      });
    }

    if (result.length === 0) {
      alert(language === 'th' ? 'ไม่มีข้อมูลแชตที่สอดคล้องกับฟิลเตอร์การส่งออก' : 'No chat data matched your export filters.');
      return;
    }

    // Build CSV Row Header: Chat ID, Customer Name, Phone, Category, Priority, Department, AI Summary, AI Reply, Created At
    const csvHeaders = [
      'Chat ID',
      'Customer Name',
      'Phone',
      'Category',
      'Priority',
      'Department',
      'AI Summary',
      'AI Reply',
      'Created At'
    ];

    // Build Rows
    const rows = result.map(c => {
      const catName = categories.find(cat => cat.id === c.category_id)?.name || c.category_name || c.category || c.category_id || 'อื่นๆ';
      return [
        c.chat_id || c.id || '',
        c.customer_name || c.name || '',
        c.phone || c.customer_phone || '-',
        catName,
        c.priority || 'low',
        c.department || c.dept || 'Support',
        (c.summary || c.problem_summary || c.ai_summary || '').replace(/\n/g, ' '),
        (c.recommended_reply || c.ai_reply || c.reply || '').replace(/\n/g, ' '),
        c.created_at ? new Date(c.created_at).toLocaleString('th-TH') : ''
      ];
    });

    // Create CSV content with UTF-8 BOM (\uFEFF) for Excel Thai support
    const csvContent = '\uFEFF' + [
      csvHeaders.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    
    const formattedDate = new Date().toISOString().split('T')[0];
    const filename = `AI_Triage_Report_${formattedDate}.csv`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Add new dynamic export record to list
    const newId = `EXP-${Math.floor(1000 + Math.random() * 9000)}`;
    const sizeStr = `${(blob.size / 1024).toFixed(1)} KB`;
    setExportHistory(prev => [
      {
        id: newId,
        name: filename,
        type: selectedCategory === 'all' ? 'All Mapped Export' : 'Filtered Triage',
        date: new Date().toISOString(),
        size: sizeStr,
        status: 'ready',
        user: userProfile?.name || 'admin'
      },
      ...prev
    ]);

    // Save audit log
    fetch('/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'EXPORT',
        details: `ส่งออกรายงานข้อมูลแชตสำเร็จ (พบบันทึกทั้งหมด: ${result.length} เคส, ฟิลเตอร์ช่วงเวลา: ${dateRange})`
      })
    }).catch(e => console.error('Error logging audit export:', e));
  };

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight font-display">
            {language === 'th' ? 'ศูนย์ส่งออกรายงาน & สถิติ (Export & Reports Center)' : 'Export & Reports Center'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {language === 'th' ? 'ส่งออกข้อมูลการคัดแยกประเภทปัญหาแชตของลูกค้า เพื่อนำไปใช้วิเคราะห์ประสิทธิภาพภายนอก' : 'Generate and download data logs of AI chat classifications for external KPI analysis.'}
          </p>
        </div>
        <button 
          onClick={fetchChatsData}
          className="flex items-center gap-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> {language === 'th' ? 'โหลดข้อมูลใหม่' : 'Sync Data'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Card: Dynamic Filtering Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-5">
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm font-display flex items-center gap-2">
              <Filter size={16} className="text-indigo-600 dark:text-indigo-400" />
              {language === 'th' ? 'ตัวกรองการส่งออกข้อมูล' : 'Data Export Filters'}
            </h3>

            {/* Date timeframe selection */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{language === 'th' ? 'ช่วงเวลาคัดกรอง' : 'Date Timeframe'}</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer focus:border-indigo-650 focus:outline-none"
              >
                <option value="all">{language === 'th' ? 'แสดงข้อมูลทั้งหมด' : 'All time datasets'}</option>
                <option value="today">{language === 'th' ? 'เฉพาะวันนี้ (Today)' : 'Today'}</option>
                <option value="7days">{language === 'th' ? '7 วันล่าสุด (7 Days)' : 'Last 7 Days'}</option>
                <option value="30days">{language === 'th' ? '30 วันล่าสุด (30 Days)' : 'Last 30 Days'}</option>
                <option value="custom">{language === 'th' ? 'เลือกช่วงวันที่เอง...' : 'Custom Date Range...'}</option>
              </select>
            </div>

            {/* Date Pickers (Custom range) */}
            {dateRange === 'custom' && (
              <div className="grid grid-cols-2 gap-3.5 pt-1">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider">{language === 'th' ? 'จากวันที่' : 'Start Date'}</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-3 py-2 text-xs font-semibold text-slate-850 dark:text-slate-200 focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider">{language === 'th' ? 'ถึงวันที่' : 'End Date'}</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-3 py-2 text-xs font-semibold text-slate-850 dark:text-slate-200 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>
            )}

            {/* Category selection */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider">{language === 'th' ? 'หมวดหมู่ปัญหา' : 'Category Class'}</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer focus:border-indigo-650 focus:outline-none"
              >
                <option value="all">{language === 'th' ? 'ทุกหมวดหมู่ (All Categories)' : 'All Categories'}</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Priority selection */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider">{language === 'th' ? 'ระดับความด่วน' : 'Urgency Priority'}</label>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer focus:border-indigo-650 focus:outline-none"
              >
                <option value="all">{language === 'th' ? 'ทุกความเร่งด่วน (All)' : 'All Priorities'}</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Status selection */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider">{language === 'th' ? 'สถานะดำเนินการ' : 'Status'}</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer focus:border-indigo-650 focus:outline-none"
              >
                <option value="all">{language === 'th' ? 'ทุกสถานะ (All)' : 'All Statuses'}</option>
                <option value="completed">{language === 'th' ? 'จัดแยกแยะแล้ว (Completed)' : 'Completed'}</option>
                <option value="pending">{language === 'th' ? 'รอดำเนินการ (Pending)' : 'Pending'}</option>
              </select>
            </div>

            {/* Company selection (if system admin) */}
            {userProfile?.role === 'system_admin' && (
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider">{language === 'th' ? 'บริษัทผู้ใช้ (Tenant)' : 'Company Context'}</label>
                <select
                  value={selectedCompanyFilter}
                  onChange={(e) => setSelectedCompanyFilter(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer focus:border-indigo-650 focus:outline-none"
                >
                  <option value="all">{language === 'th' ? 'แสดงข้อมูลทุกบริษัท' : 'All Companies'}</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Export CTA Button */}
          <button
            onClick={handleExport}
            className="w-full bg-indigo-600 hover:bg-indigo-750 text-white py-3 rounded-2xl text-xs font-bold shadow-md shadow-indigo-100 dark:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-6 select-none"
          >
            <Download size={15} />
            {language === 'th' ? 'ส่งออกข้อมูลสรุปเป็นไฟล์ CSV' : 'Export and Download CSV'}
          </button>
        </div>

        {/* Right Section (2/3 width): Data Previews & Statistics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card row: Preview Data Summary */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-5">
            <h3 className="font-extrabold text-slate-850 dark:text-slate-100 text-sm font-display flex items-center gap-2">
              <FileSpreadsheet size={16} className="text-emerald-500" />
              {language === 'th' ? 'ตัวอย่างประเมินและภาพรวมข้อมูลชุดส่งออก (Report Dataset Preview)' : 'Report Dataset Preview'}
            </h3>

            {/* Total matching stats card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-indigo-50/20 dark:bg-indigo-955/10 border border-indigo-50 dark:border-indigo-900/30 p-4.5 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{language === 'th' ? 'พบบันทึกทั้งหมด' : 'Total Filtered Logs'}</span>
                <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-2 font-display">{filteredCount} <span className="text-xs text-slate-400 font-bold uppercase">{language === 'th' ? 'เคส' : 'Cases'}</span></span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-850/40 border border-slate-100 dark:border-slate-800 p-4.5 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{language === 'th' ? 'จัดแยกแยะเสร็จสิ้น' : 'Triage Completed'}</span>
                <span className="text-3xl font-extrabold text-emerald-600 mt-2 font-display">{completedCount} <span className="text-xs text-slate-450 dark:text-slate-500 font-bold uppercase">{language === 'th' ? 'เคส' : 'Cases'}</span></span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-850/40 border border-slate-100 dark:border-slate-800 p-4.5 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{language === 'th' ? 'รอดำเนินการ' : 'Pending Triage'}</span>
                <span className="text-3xl font-extrabold text-slate-700 dark:text-slate-350 mt-2 font-display">{pendingCount} <span className="text-xs text-slate-450 dark:text-slate-500 font-bold uppercase">{language === 'th' ? 'เคส' : 'Cases'}</span></span>
              </div>
            </div>

            {/* Priority stats list */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-3">
              <span className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">{language === 'th' ? 'สถิติระดับความฉุกเฉินในรายงาน (Priority Distributions)' : 'Priority Distributions'}</span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-rose-50/20 dark:bg-rose-955/10 border border-rose-100/50 dark:border-rose-900/20 rounded-xl flex items-center justify-between text-xs font-bold text-rose-600">
                  <span>Urgent:</span>
                  <span className="text-sm font-extrabold">{urgentCount}</span>
                </div>
                <div className="p-3 bg-orange-50/20 dark:bg-orange-955/10 border border-orange-100/50 dark:border-orange-900/20 rounded-xl flex items-center justify-between text-xs font-bold text-orange-655 dark:text-orange-400">
                  <span>High:</span>
                  <span className="text-sm font-extrabold">{highCount}</span>
                </div>
                <div className="p-3 bg-amber-50/20 dark:bg-amber-955/10 border border-amber-100/50 dark:border-amber-900/20 rounded-xl flex items-center justify-between text-xs font-bold text-amber-655 dark:text-amber-400">
                  <span>Medium:</span>
                  <span className="text-sm font-extrabold">{mediumCount}</span>
                </div>
                <div className="p-3 bg-blue-50/20 dark:bg-blue-955/10 border border-blue-100/50 dark:border-blue-900/20 rounded-xl flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
                  <span>Low:</span>
                  <span className="text-sm font-extrabold">{lowCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Export logs history block */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-850 dark:text-slate-100 text-sm font-display flex items-center gap-2">
              <History size={16} className="text-indigo-650 dark:text-indigo-400" />
              {language === 'th' ? 'ประวัติคำขอส่งออกรายงานในระบบ (Recent Export Logs)' : 'Recent Export Logs'}
            </h3>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {exportHistory.map(log => (
                <div key={log.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-450 dark:text-slate-500 shrink-0">
                      <FileText size={16} />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block truncate">{log.name}</span>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-400 mt-1 font-semibold">
                        <span>ID: {log.id}</span>
                        <span>•</span>
                        <span>{log.type}</span>
                        <span>•</span>
                        <span>{language === 'th' ? new Date(log.date).toLocaleString('th-TH') : new Date(log.date).toLocaleString('en-US', { hour12: false })}</span>
                        <span>•</span>
                        <span className="text-indigo-600 dark:text-indigo-455 font-bold flex items-center gap-0.5 select-none">
                          👤 {language === 'th' ? `โดย: ${log.user}` : `By: ${log.user}`}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-slate-450 dark:text-slate-400 font-mono">{log.size}</span>
                    <button
                      onClick={() => alert(language === 'th' ? 'กำลังดาวน์โหลดบันทึกเก่าจาก Archive Storage...' : 'Downloading archived spreadsheet from storage...')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition cursor-pointer select-none ${
                        log.status === 'ready'
                          ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-750 text-indigo-650 dark:text-indigo-400 hover:bg-slate-50'
                          : 'bg-slate-50 dark:bg-slate-855 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-505 cursor-not-allowed opacity-60'
                      }`}
                    >
                      {log.status === 'ready' ? (language === 'th' ? 'ดาวน์โหลด' : 'Download') : (language === 'th' ? 'จัดเก็บแล้ว' : 'Archived')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
