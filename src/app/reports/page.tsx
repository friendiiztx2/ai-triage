'use client';

import { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, Download, Calendar, Filter, RefreshCw, 
  ChevronRight, CheckCircle2, AlertTriangle, Clock, History, FileText, Globe,
  DollarSign, Megaphone, BarChart3, Check
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

  // Selected Report Type State: 'overall' | 'finance' | 'marketing'
  const [reportType, setReportType] = useState<'overall' | 'finance' | 'marketing'>('overall');

  // Filter States
  const [dateRange, setDateRange] = useState('today');
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

  // Dynamic Export History Logs
  const [exportHistory, setExportHistory] = useState<any[]>([
    { id: 'EXP-8379', name: 'AI_Triage_Finance_Report_today.csv', type: 'รายงานการเงิน (Finance)', date: new Date().toISOString(), size: '4.8 KB', status: 'ready', user: 'aor (Super Admin)' },
    { id: 'EXP-5161', name: 'AI_Triage_Marketing_Report_7days.csv', type: 'รายงานการตลาด (Marketing)', date: new Date(Date.now() - 86400000).toISOString(), size: '12.4 KB', status: 'ready', user: 'aor (Super Admin)' }
  ]);

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
        const compId = localStorage.getItem('company_id') || parsed.companyId || parsed.company_id || '2c3f46cc-fae8-4ef8-99e1-874dec8b2af2';
        setActiveCompanyId(compId);
        setSelectedCompanyFilter(parsed.role === 'system_admin' ? 'all' : compId);
      } catch (e) {}
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
      const res = await fetch('/api/chats?summary_only=true');
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

  // Helper to apply active filters
  const applyActiveFilters = (sourceChats: any[]) => {
    let result = sourceChats;

    if (userProfile?.role === 'system_admin' && selectedCompanyFilter !== 'all') {
      result = result.filter(c => c.company_id === selectedCompanyFilter);
    }
    if (selectedStatus !== 'all') {
      result = result.filter(c => (c.status || 'pending') === selectedStatus);
    }
    if (selectedPriority !== 'all') {
      result = result.filter(c => (c.priority?.toLowerCase() || 'low') === selectedPriority);
    }

    // Report Type specific filtering
    if (reportType === 'finance') {
      result = result.filter(c => {
        const raw = ((c.conversation || '') + ' ' + (c.summary || '') + ' ' + (c.category_id || '')).toLowerCase();
        return raw.includes('ฝาก') || raw.includes('ถอน') || raw.includes('โอน') || raw.includes('สลิป') || raw.includes('ยอดไม่เข้า') || c.category_id === 'deposit_withdrawal';
      });
    } else if (reportType === 'marketing') {
      result = result.filter(c => {
        const raw = ((c.conversation || '') + ' ' + (c.summary || '') + ' ' + (c.category_id || '')).toLowerCase();
        const tags = c.tags || [];
        return tags.includes('#VIP') || tags.includes('#กิจกรรม') || raw.includes('โปร') || raw.includes('โบนัส') || raw.includes('เครดิตฟรี') || c.category_id === 'promo_bonus';
      });
    }

    if (selectedCategory !== 'all') {
      result = result.filter(c => {
        if (c.chat_issues && c.chat_issues.length > 0) {
          return c.chat_issues.some((issue: any) => issue.category_id === selectedCategory);
        }
        return c.category_id === selectedCategory || c.category === selectedCategory;
      });
    }

    // Date Filtering
    const todayLocalStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });

    if (dateRange === 'today') {
      result = result.filter(c => {
        if (!c.created_at) return false;
        const itemDateStr = new Date(c.created_at).toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
        return itemDateStr === todayLocalStr;
      });
    } else if (dateRange === '7days') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      const cutoffStr = cutoff.toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
      result = result.filter(c => {
        if (!c.created_at) return false;
        const itemDateStr = new Date(c.created_at).toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
        return itemDateStr >= cutoffStr;
      });
    } else if (dateRange === '30days') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      const cutoffStr = cutoff.toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
      result = result.filter(c => {
        if (!c.created_at) return false;
        const itemDateStr = new Date(c.created_at).toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
        return itemDateStr >= cutoffStr;
      });
    } else if (dateRange === 'custom') {
      if (startDate) {
        result = result.filter(c => {
          if (!c.created_at) return false;
          const itemDateStr = new Date(c.created_at).toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
          return itemDateStr >= startDate;
        });
      }
      if (endDate) {
        result = result.filter(c => {
          if (!c.created_at) return false;
          const itemDateStr = new Date(c.created_at).toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
          return itemDateStr <= endDate;
        });
      }
    }

    return result;
  };

  // Update Stats
  useEffect(() => {
    const result = applyActiveFilters(chats);

    setFilteredCount(result.length);
    const pending = result.filter(c => (c.status || 'pending') === 'pending').length;
    setPendingCount(pending);
    setCompletedCount(result.length - pending);

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

  }, [chats, reportType, dateRange, startDate, endDate, selectedCategory, selectedPriority, selectedStatus, selectedCompanyFilter, userProfile]);

  // Dedicated Export Handler supporting Overall, Finance, and Marketing
  const handleExport = (targetType: 'overall' | 'finance' | 'marketing' = reportType) => {
    const result = applyActiveFilters(chats);

    if (result.length === 0) {
      alert(language === 'th' ? 'ไม่มีข้อมูลแชตที่สอดคล้องกับฟิลเตอร์การส่งออก' : 'No chat data matched your export filters.');
      return;
    }

    let csvHeaders: string[] = [];
    let rows: any[] = [];
    let filePrefix = 'AI_Triage_Overall_Report';
    let typeNameTH = 'รายงานภาพรวมระบบ';

    if (targetType === 'finance') {
      filePrefix = 'AI_Triage_Finance_Report';
      typeNameTH = 'รายงานการเงิน';
      csvHeaders = [
        'Chat ID (รหัสแชต)',
        'Customer ID (รหัสลูกค้า)',
        'Customer Name (ชื่อลูกค้า)',
        'Transaction Type (ประเภทธุรกรรมการเงิน)',
        'Category (หมวดหมู่ภาษาไทย)',
        'Priority (ระดับความด่วนการเงิน)',
        'Status (สถานะดำเนินการ)',
        'Financial Summary (สรุปปัญหาการเงิน)',
        'Tags (ป้ายกำกับ)',
        'Created At (วันเวลาที่เกิดรายการ)'
      ];

      rows = result.map(c => {
        const raw = ((c.conversation || '') + ' ' + (c.summary || '') + ' ' + (c.category_id || '')).toLowerCase();
        let finType = 'ไม่ระบุ';
        if (raw.includes('ถอน')) finType = 'ถอนเงิน (Withdrawal)';
        else if (raw.includes('ฝาก') || raw.includes('โอน')) finType = 'ฝากเงิน / โอนเงิน (Deposit)';
        else if (raw.includes('สลิป') || raw.includes('ยอดไม่เข้า')) finType = 'ตรวจสอบสลิป (Slip Verification)';

        const customerId = c.customer_id || c.cust_id || '';
        const custName = c.customer_name || c.name || `ลูกค้า #${customerId || (c.id || '').substring(0, 8)}`;
        const formattedDate = c.created_at ? new Date(c.created_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }) : '';

        return [
          c.id || '',
          customerId,
          custName,
          finType,
          'ฝากถอนเงิน / โอนเงิน',
          (c.priority || 'low').toUpperCase(),
          c.status === 'completed' ? 'แยกแยะแล้ว (Completed)' : 'รอดำเนินการ (Pending)',
          (c.summary || '').replace(/\n/g, ' '),
          (c.tags || []).join(' '),
          formattedDate
        ];
      });
    } else if (targetType === 'marketing') {
      filePrefix = 'AI_Triage_Marketing_Report';
      typeNameTH = 'รายงานการตลาด';
      csvHeaders = [
        'Chat ID (รหัสแชต)',
        'Customer ID (รหัสลูกค้า)',
        'Customer Name (ชื่อลูกค้า)',
        'Marketing Segment (กลุ่มลูกค้า)',
        'Campaign Category (หมวดหมู่ความสนใจการตลาด)',
        'Campaign Tags (ป้ายกำกับแคมเปญ)',
        'Status (สถานะการตอบรับ)',
        'Full Customer Message (ข้อความสอบถามจากลูกค้า)',
        'Created At (วันเวลาที่ทัก)'
      ];

      rows = result.map(c => {
        const tags = c.tags || [];
        let mktSeg = 'ลูกค้าทั่วไป';
        if (tags.includes('#VIP')) mktSeg = 'ลูกค้า VIP';
        else if (tags.includes('#กิจกรรม')) mktSeg = 'ลูกค้าเข้าร่วมกิจกรรม';

        const raw = ((c.conversation || '') + ' ' + (c.summary || '') + ' ' + (c.category_id || '')).toLowerCase();
        let mktCat = 'สอบถามข้อมูลทั่วไป';
        if (raw.includes('โปร') || raw.includes('โบนัส') || raw.includes('เครดิตฟรี')) mktCat = 'โปรโมชั่น & โบนัสพิเศษ';
        else if (raw.includes('กิจกรรม')) mktCat = 'กิจกรรมแจกของรางวัล';

        const customerId = c.customer_id || c.cust_id || '';
        const custName = c.customer_name || c.name || `ลูกค้า #${customerId || (c.id || '').substring(0, 8)}`;
        const formattedDate = c.created_at ? new Date(c.created_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }) : '';

        return [
          c.id || '',
          customerId,
          custName,
          mktSeg,
          mktCat,
          tags.join(' '),
          c.status === 'completed' ? 'ตอบแล้ว (Responded)' : 'รอดำเนินการ (Pending)',
          (c.conversation || c.summary || '').replace(/\n/g, ' '),
          formattedDate
        ];
      });
    } else {
      // Overall standard export
      csvHeaders = [
        'Chat ID',
        'Customer ID',
        'Customer Name (ชื่อลูกค้า)',
        'Category (หมวดหมู่ภาษาไทย)',
        'Priority (ระดับความด่วน)',
        'Status (สถานะ)',
        'AI Summary (ข้อสรุปปัญหา)',
        'AI Reply (คำตอบแนะนำจาก AI)',
        'Tags (ป้ายกำกับ)',
        'Full Conversation (บทสนทนา)',
        'Created At (วันเวลา)'
      ];

      rows = result.map(c => {
        const foundCat = categories.find((cat: any) => cat.id === c.category_id || cat.id?.endsWith(`:${c.category_id}`));
        let catName = foundCat ? foundCat.name : (c.category_name || c.category);
        if (!catName || catName === c.category_id) {
          const catIdStr = c.category_id || '';
          if (catIdStr.includes('page_load_freeze')) catName = 'หน้าเว็บค้าง / โหลดหมุน';
          else if (catIdStr.includes('deposit_withdrawal')) catName = 'ฝากถอนเงิน / โอนเงิน';
          else if (catIdStr.includes('login_issue')) catName = 'เข้าใช้งาน / เข้าสู่ระบบ';
          else if (catIdStr.includes('promo_bonus')) catName = 'โปรโมชั่น / โบนัส';
          else catName = catIdStr || 'อื่นๆ';
        }

        const customerId = c.customer_id || c.cust_id || '';
        const custName = c.customer_name || c.name || `ลูกค้า #${customerId || (c.id || '').substring(0, 8)}`;
        const formattedDate = c.created_at ? new Date(c.created_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }) : '';

        return [
          c.id || '',
          customerId,
          custName,
          catName,
          (c.priority || 'low').toUpperCase(),
          c.status === 'completed' ? 'แยกแยะแล้ว (Completed)' : 'รอดำเนินการ (Pending)',
          (c.summary || '').replace(/\n/g, ' '),
          (c.recommended_reply || c.ai_reply || '').replace(/\n/g, ' '),
          (c.tags || []).join(' '),
          (c.conversation || '').replace(/\n/g, ' '),
          formattedDate
        ];
      });
    }

    // Build CSV with UTF-8 BOM
    const csvContent = '\uFEFF' + [
      csvHeaders.join(','),
      ...rows.map((row: any[]) => row.map((val: any) => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const formattedDate = new Date().toISOString().split('T')[0];
    const filename = `${filePrefix}_${dateRange}_${formattedDate}.csv`;
    link.setAttribute('download', filename);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 500);

    // Record export history item
    const newId = `EXP-${Math.floor(1000 + Math.random() * 9000)}`;
    const sizeStr = `${(blob.size / 1024).toFixed(1)} KB`;
    const newLogItem = {
      id: newId,
      name: filename,
      type: `${typeNameTH} (${dateRange})`,
      date: new Date().toISOString(),
      size: sizeStr,
      status: 'ready',
      user: userProfile?.name || 'aor (Super Admin)'
    };

    setExportHistory(prev => {
      const updated = [newLogItem, ...prev];
      try {
        localStorage.setItem('ai_triage_export_history', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight font-display">
            {language === 'th' ? 'ศูนย์ส่งออกรายงานการเงิน การตลาด & ภาพรวมระบบ' : 'Export Reports Center (Finance, Marketing & Executive)'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {language === 'th' ? 'จำแนกและส่งออกรายงานเจาะลึกเฉพาะทางสำหรับการเงิน การตลาด และสรุปภาพรวมผู้บริหาร' : 'Generate specialized CSV reports tailored for Financial, Marketing, and Executive teams.'}
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
              {language === 'th' ? 'ตัวเลือกประเภทรายงาน & ตัวกรอง' : 'Report Type & Export Filters'}
            </h3>

            {/* Report Type Switcher Selector */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {language === 'th' ? 'เลือกรูปแบบรายงานส่งออก' : 'Select Export Report Type'}
              </label>
              <div className="grid grid-cols-1 gap-2 select-none">
                <button
                  type="button"
                  onClick={() => setReportType('overall')}
                  className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                    reportType === 'overall' 
                      ? 'bg-indigo-50/90 text-indigo-750 border-indigo-300 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800 shadow-sm ring-2 ring-indigo-500/20' 
                      : 'bg-slate-50 dark:bg-slate-850/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-750 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <BarChart3 size={15} className="text-indigo-600 dark:text-indigo-400" />
                    <span>📊 รายงานภาพรวมระบบ (Overall)</span>
                  </div>
                  {reportType === 'overall' && <CheckCircle2 size={14} className="text-indigo-600 dark:text-indigo-400" />}
                </button>

                <button
                  type="button"
                  onClick={() => setReportType('finance')}
                  className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                    reportType === 'finance' 
                      ? 'bg-emerald-50/90 text-emerald-750 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 shadow-sm ring-2 ring-emerald-500/20' 
                      : 'bg-slate-50 dark:bg-slate-850/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-750 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <DollarSign size={15} className="text-emerald-600 dark:text-emerald-400" />
                    <span>💵 รายงานการเงิน (Finance)</span>
                  </div>
                  {reportType === 'finance' && <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />}
                </button>

                <button
                  type="button"
                  onClick={() => setReportType('marketing')}
                  className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                    reportType === 'marketing' 
                      ? 'bg-rose-50/90 text-rose-750 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800 shadow-sm ring-2 ring-rose-500/20' 
                      : 'bg-slate-50 dark:bg-slate-850/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-750 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Megaphone size={15} className="text-rose-600 dark:text-rose-400" />
                    <span>📣 รายงานการตลาด (Marketing)</span>
                  </div>
                  {reportType === 'marketing' && <CheckCircle2 size={14} className="text-rose-600 dark:text-rose-400" />}
                </button>
              </div>
            </div>

            {/* Date timeframe selection */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{language === 'th' ? 'ช่วงเวลาคัดกรอง' : 'Date Timeframe'}</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer focus:border-indigo-650 focus:outline-none"
              >
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
          </div>

          {/* Dynamic Export Action Button matching Report Type */}
          {reportType === 'finance' ? (
            <button
              onClick={() => handleExport('finance')}
              className="w-full bg-emerald-600 hover:bg-emerald-750 text-white py-3.5 rounded-2xl text-xs font-bold shadow-md shadow-emerald-100 dark:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer mt-6 select-none"
            >
              <Download size={16} />
              {language === 'th' ? '📥 ส่งออกรายงานการเงิน (CSV)' : 'Export Financial Report (CSV)'}
            </button>
          ) : reportType === 'marketing' ? (
            <button
              onClick={() => handleExport('marketing')}
              className="w-full bg-rose-600 hover:bg-rose-750 text-white py-3.5 rounded-2xl text-xs font-bold shadow-md shadow-rose-100 dark:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer mt-6 select-none"
            >
              <Download size={16} />
              {language === 'th' ? '📥 ส่งออกรายงานการตลาด (CSV)' : 'Export Marketing Report (CSV)'}
            </button>
          ) : (
            <button
              onClick={() => handleExport('overall')}
              className="w-full bg-indigo-600 hover:bg-indigo-750 text-white py-3.5 rounded-2xl text-xs font-bold shadow-md shadow-indigo-100 dark:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer mt-6 select-none"
            >
              <Download size={16} />
              {language === 'th' ? '📥 ส่งออกรายงานภาพรวม (CSV)' : 'Export Overall Report (CSV)'}
            </button>
          )}
        </div>

        {/* Right Section (2/3 width): Data Previews & Dynamic Statistics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card row: Preview Data Summary */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="font-extrabold text-slate-850 dark:text-slate-100 text-sm font-display flex items-center gap-2">
                <FileSpreadsheet size={16} className={reportType === 'finance' ? 'text-emerald-500' : reportType === 'marketing' ? 'text-rose-500' : 'text-indigo-500'} />
                {language === 'th' ? `ภาพรวมตัวอย่างข้อมูล: ${reportType === 'finance' ? 'รายงานการเงิน' : reportType === 'marketing' ? 'รายงานการตลาด' : 'รายงานภาพรวมระบบ'}` : `Dataset Preview: ${reportType.toUpperCase()}`}
              </h3>
              <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${reportType === 'finance' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : reportType === 'marketing' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'}`}>
                {reportType === 'finance' ? '💵 ธุรกรรมการเงิน' : reportType === 'marketing' ? '📣 แคมเปญ & การตลาด' : '📊 ภาพรวมระบบ'}
              </span>
            </div>

            {/* Total matching stats card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 dark:bg-slate-850/40 border border-slate-150 dark:border-slate-800 p-4.5 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{language === 'th' ? 'รายการตรงตามตัวกรอง' : 'Filtered Cases'}</span>
                <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-2 font-display">{filteredCount} <span className="text-xs text-slate-400 font-bold uppercase">{language === 'th' ? 'เคส' : 'Cases'}</span></span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-850/40 border border-slate-150 dark:border-slate-800 p-4.5 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{language === 'th' ? 'ดำเนินการสำเร็จ' : 'Completed'}</span>
                <span className="text-3xl font-extrabold text-emerald-600 mt-2 font-display">{completedCount} <span className="text-xs text-slate-450 dark:text-slate-500 font-bold uppercase">{language === 'th' ? 'เคส' : 'Cases'}</span></span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-850/40 border border-slate-150 dark:border-slate-800 p-4.5 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{language === 'th' ? 'รอดำเนินการ' : 'Pending'}</span>
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
              {language === 'th' ? 'ประวัติการส่งออกรายงานล่าสุด (Recent Export Logs)' : 'Recent Export Logs'}
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
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">{log.type}</span>
                        <span>•</span>
                        <span>{language === 'th' ? new Date(log.date).toLocaleString('th-TH') : new Date(log.date).toLocaleString('en-US', { hour12: false })}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-slate-450 dark:text-slate-400 font-mono">{log.size}</span>
                    <button
                      onClick={() => handleExport(reportType)}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-bold border border-slate-200 dark:border-slate-750 text-indigo-650 dark:text-indigo-400 hover:bg-slate-50 transition cursor-pointer select-none bg-white dark:bg-slate-900"
                    >
                      {language === 'th' ? 'ดาวน์โหลดอีกครั้ง' : 'Re-download'}
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
