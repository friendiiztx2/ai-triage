'use client';

import { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, Download, Calendar, Filter, RefreshCw, 
  ChevronRight, CheckCircle2, AlertTriangle, Clock, History, FileText, Globe,
  DollarSign, Megaphone, BarChart3, Check, Layers, Users, UserPlus, ArrowUpRight
} from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import * as XLSX from 'xlsx';

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

  // Selected Export Format Mode: 'xlsx_multi_sheet' (รวมไฟล์เดียวแยกแท็บชีต) | 'csv_single' (แยกไฟล์ CSV)
  const [exportFormatMode, setExportFormatMode] = useState<'xlsx_multi_sheet' | 'csv_single'>('xlsx_multi_sheet');

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

  // Specialized Business Stats (Finance & Marketing Criteria)
  const [depositCount, setDepositCount] = useState(0);
  const [withdrawalCount, setWithdrawalCount] = useState(0);
  const [newCustomerCount, setNewCustomerCount] = useState(0);
  const [returningCustomerCount, setReturningCustomerCount] = useState(0);

  // Dynamic Export History Logs
  const [exportHistory, setExportHistory] = useState<any[]>([
    { id: 'EXP-9920', name: 'AI_Triage_Master_Report_today.xlsx', type: 'Excel 3 แท็บชีต (ภาพรวม/การเงิน/การตลาด)', date: new Date().toISOString(), size: '28.4 KB', status: 'ready', user: 'aor (Super Admin)' },
    { id: 'EXP-8379', name: 'AI_Triage_Finance_Report_today.csv', type: 'รายงานการเงิน (รายการฝาก-ถอน)', date: new Date(Date.now() - 3600000).toISOString(), size: '5.2 KB', status: 'ready', user: 'aor (Super Admin)' },
    { id: 'EXP-5161', name: 'AI_Triage_Marketing_Report_7days.csv', type: 'รายงานการตลาด (ยอดลูกค้าใหม่)', date: new Date(Date.now() - 86400000).toISOString(), size: '14.1 KB', status: 'ready', user: 'aor (Super Admin)' }
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
  const applyActiveFilters = (sourceChats: any[], targetType: 'overall' | 'finance' | 'marketing' = reportType) => {
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

    // Specific Report Filtering
    if (targetType === 'finance') {
      result = result.filter(c => {
        const raw = ((c.conversation || '') + ' ' + (c.summary || '') + ' ' + (c.category_id || '')).toLowerCase();
        return raw.includes('ฝาก') || raw.includes('ถอน') || raw.includes('โอน') || raw.includes('สลิป') || raw.includes('ยอดไม่เข้า') || c.category_id === 'deposit_withdrawal';
      });
    } else if (targetType === 'marketing') {
      result = result.filter(c => {
        const customerId = c.customer_id || c.cust_id || '';
        const custName = c.customer_name || c.name || '';
        const historyCount = chats.filter(item => 
          (customerId && (item.customer_id === customerId || item.cust_id === customerId)) ||
          (custName && item.customer_name === custName) ||
          item.id === c.id
        ).length;
        const tags = c.tags || [];
        const raw = ((c.conversation || '') + ' ' + (c.summary || '') + ' ' + (c.category_id || '')).toLowerCase();

        // Marketing report focuses on New Customers (First-time Inbound) or Promo inquiries
        return historyCount === 1 || tags.includes('#VIP') || raw.includes('โปร') || raw.includes('โบนัส') || raw.includes('เครดิตฟรี') || c.category_id === 'promo_bonus';
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

  // Update Preview Stats
  useEffect(() => {
    const result = applyActiveFilters(chats, reportType);

    setFilteredCount(result.length);
    const pending = result.filter(c => (c.status || 'pending') === 'pending').length;
    setPendingCount(pending);
    setCompletedCount(result.length - pending);

    let urgent = 0, high = 0, medium = 0, low = 0;
    let dep = 0, wdr = 0;
    let newCust = 0, retCust = 0;

    result.forEach(c => {
      const p = c.priority?.toLowerCase() || 'low';
      if (p === 'urgent') urgent++;
      else if (p === 'high') high++;
      else if (p === 'medium') medium++;
      else low++;

      const raw = ((c.conversation || '') + ' ' + (c.summary || '') + ' ' + (c.category_id || '')).toLowerCase();
      if (raw.includes('ถอน')) wdr++;
      if (raw.includes('ฝาก') || raw.includes('โอน') || raw.includes('สลิป')) dep++;

      const customerId = c.customer_id || c.cust_id || '';
      const custName = c.customer_name || c.name || '';
      const historyCount = chats.filter(item => 
        (customerId && (item.customer_id === customerId || item.cust_id === customerId)) ||
        (custName && item.customer_name === custName) ||
        item.id === c.id
      ).length;

      if (historyCount === 1) newCust++;
      else retCust++;
    });

    setUrgentCount(urgent);
    setHighCount(high);
    setMediumCount(medium);
    setLowCount(low);
    setDepositCount(dep);
    setWithdrawalCount(wdr);
    setNewCustomerCount(newCust);
    setReturningCustomerCount(retCust);

  }, [chats, reportType, dateRange, startDate, endDate, selectedCategory, selectedPriority, selectedStatus, selectedCompanyFilter, userProfile]);

  // Helper to extract Bank Provider from text
  const extractBankProvider = (text: string) => {
    const raw = text.toLowerCase();
    if (raw.includes('กสิกร') || raw.includes('kbank')) return 'ธนาคารกสิกรไทย (KBANK)';
    if (raw.includes('ไทยพาณิชย์') || raw.includes('scb')) return 'ธนาคารไทยพาณิชย์ (SCB)';
    if (raw.includes('กรุงเทพ') || raw.includes('bbl')) return 'ธนาคารกรุงเทพ (BBL)';
    if (raw.includes('กรุงไทย') || raw.includes('ktb')) return 'ธนาคารกรุงไทย (KTB)';
    if (raw.includes('ทรูวอลเล็ท') || raw.includes('truemoney') || raw.includes('true wallet')) return 'TrueMoney Wallet';
    if (raw.includes('พร้อมเพย์') || raw.includes('promptpay')) return 'ระบบพร้อมเพย์ (PromptPay)';
    return 'ระบบเพย์เมนต์หลัก / ธนาคารพานิชย์';
  };

  // Helper to extract Amount from text
  const extractAmount = (text: string) => {
    const match = text.match(/(\d[\d,]*\b)\s*(บาท|baht|฿)?/i);
    if (match && match[1] && parseInt(match[1].replace(/,/g, '')) > 10) {
      return `${match[1]} บาท`;
    }
    return 'ไม่ระบุยอดเงิน';
  };

  // Unified Export Handler (Supports Multi-Sheet XLSX & CSV Single File)
  const handleExportMain = () => {
    if (exportFormatMode === 'xlsx_multi_sheet') {
      handleExportMultiSheetXLSX();
    } else {
      handleExportCSV(reportType);
    }
  };

  // Export 1: Multi-Tab Excel Workbook (.xlsx)
  const handleExportMultiSheetXLSX = () => {
    const overallData = applyActiveFilters(chats, 'overall');
    const financeData = applyActiveFilters(chats, 'finance');
    const marketingData = applyActiveFilters(chats, 'marketing');

    if (overallData.length === 0 && financeData.length === 0 && marketingData.length === 0) {
      alert(language === 'th' ? 'ไม่มีข้อมูลแชตที่สอดคล้องกับฟิลเตอร์การส่งออก' : 'No chat data matched your export filters.');
      return;
    }

    const workbook = XLSX.utils.book_new();

    // Sheet 1: ภาพรวมระบบ (Overall)
    const overallRows = overallData.map(c => {
      const customerId = c.customer_id || c.cust_id || '';
      const custName = c.customer_name || c.name || `ลูกค้า #${customerId || (c.id || '').substring(0, 8)}`;
      const formattedDate = c.created_at ? new Date(c.created_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }) : '';
      return {
        'รหัสแชต (Chat ID)': c.id || '',
        'รหัสลูกค้า (Customer ID)': customerId,
        'ชื่อลูกค้า (Customer Name)': custName,
        'หมวดหมู่ปัญหา': c.category_name || c.category_id || 'ฝากถอนเงิน / โอนเงิน',
        'ระดับความด่วน': (c.priority || 'low').toUpperCase(),
        'สถานะการดำเนินการ': c.status === 'completed' ? 'แยกแยะแล้ว (Completed)' : 'รอดำเนินการ (Pending)',
        'ข้อสรุปปัญหา (AI Summary)': c.summary || '',
        'ป้ายกำกับ (Tags)': (c.tags || []).join(' '),
        'วันเวลาที่เกิดรายการ': formattedDate
      };
    });
    const wsOverall = XLSX.utils.json_to_sheet(overallRows.length > 0 ? overallRows : [{ 'สถานะ': 'ไม่มีข้อมูลในหมวดนี้' }]);
    XLSX.utils.book_append_sheet(workbook, wsOverall, 'ภาพรวมระบบ (Overall)');

    // Sheet 2: รายงานการเงิน (Finance)
    const financeRows = financeData.map(c => {
      const raw = ((c.conversation || '') + ' ' + (c.summary || '') + ' ' + (c.category_id || '')).toLowerCase();
      let finType = 'รายการทั่วไป';
      if (raw.includes('ถอน')) finType = '💸 รายการถอนเงิน (Withdrawal)';
      else if (raw.includes('ฝาก') || raw.includes('โอน')) finType = '💵 รายการฝากเงิน (Deposit)';
      else if (raw.includes('สลิป') || raw.includes('ยอดไม่เข้า')) finType = '💳 ตรวจสอบสลิปโอนเงิน';

      const bank = extractBankProvider(c.conversation || c.summary || '');
      const amount = extractAmount(c.conversation || c.summary || '');
      const customerId = c.customer_id || c.cust_id || '';
      const custName = c.customer_name || c.name || `ลูกค้า #${customerId || (c.id || '').substring(0, 8)}`;
      const formattedDate = c.created_at ? new Date(c.created_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }) : '';

      return {
        'รหัสแชต (Chat ID)': c.id || '',
        'รหัสลูกค้า (Customer ID)': customerId,
        'ชื่อลูกค้า (Customer Name)': custName,
        'ประเภทรายการการเงิน': finType,
        'ระบบเพย์เมนต์ / บัญชีธนาคาร': bank,
        'ยอดเงินในสลิป/เพย์เมนต์': amount,
        'ความด่วนทางการเงิน': (c.priority || 'low').toUpperCase(),
        'สถานะการเคลียร์ยอด': c.status === 'completed' ? 'แยกแยะแล้ว (Completed)' : 'รอดำเนินการ (Pending)',
        'รายละเอียดปัญหาธุรกรรม': c.summary || '',
        'วันเวลาที่เกิดรายการ': formattedDate
      };
    });
    const wsFinance = XLSX.utils.json_to_sheet(financeRows.length > 0 ? financeRows : [{ 'สถานะ': 'ไม่มีรายการการเงินในช่วงนี้' }]);
    XLSX.utils.book_append_sheet(workbook, wsFinance, 'รายงานการเงิน (Finance)');

    // Sheet 3: รายงานการตลาด (Marketing)
    const marketingRows = marketingData.map(c => {
      const customerId = c.customer_id || c.cust_id || '';
      const custName = c.customer_name || c.name || `ลูกค้า #${customerId || (c.id || '').substring(0, 8)}`;
      const historyCount = chats.filter(item => 
        (customerId && (item.customer_id === customerId || item.cust_id === customerId)) ||
        (custName && item.customer_name === custName) ||
        item.id === c.id
      ).length;

      const isNewCustomer = historyCount === 1;
      const formattedDate = c.created_at ? new Date(c.created_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }) : '';
      const tags = c.tags || [];

      return {
        'รหัสแชต (Chat ID)': c.id || '',
        'รหัสลูกค้า (Customer ID)': customerId,
        'ชื่อลูกค้า (Customer Name)': custName,
        'ประเภทลูกค้า (Customer Status)': isNewCustomer ? '✨ ลูกค้าใหม่ทักครั้งแรก' : '🔁 ลูกค้าเดิมทักซ้ำ',
        'วันเวลาที่ลูกค้าทักเข้ามา': formattedDate,
        'ประเด็นแรกที่ลูกค้าทักถาม': c.summary || '',
        'ป้ายกำกับแคมเปญ / VIP': tags.join(' '),
        'สถานะการดูแลลูกค้า': c.status === 'completed' ? 'ดูแลเรียบร้อย (Completed)' : 'รอดำเนินการ (Pending)'
      };
    });
    const wsMarketing = XLSX.utils.json_to_sheet(marketingRows.length > 0 ? marketingRows : [{ 'สถานะ': 'ไม่มีรายการการตลาดในช่วงนี้' }]);
    XLSX.utils.book_append_sheet(workbook, wsMarketing, 'รายงานการตลาด (Marketing)');

    // Export Workbook File (.xlsx)
    const formattedDate = new Date().toISOString().split('T')[0];
    const filename = `AI_Triage_Master_Report_${dateRange}_${formattedDate}.xlsx`;
    XLSX.writeFile(workbook, filename);

    // Save Export Log
    const newId = `EXP-${Math.floor(1000 + Math.random() * 9000)}`;
    const newLogItem = {
      id: newId,
      name: filename,
      type: `Excel 3 แท็บชีต (${dateRange})`,
      date: new Date().toISOString(),
      size: '28.5 KB',
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

  // Export 2: Single CSV File Download
  const handleExportCSV = (targetType: 'overall' | 'finance' | 'marketing' = reportType) => {
    const result = applyActiveFilters(chats, targetType);

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
      typeNameTH = 'รายงานการเงิน (รายการฝาก-ถอน)';
      csvHeaders = [
        'Chat ID (รหัสแชต)',
        'Customer ID (รหัสลูกค้า)',
        'Customer Name (ชื่อลูกค้า)',
        'Transaction Type (ประเภทรายการการเงิน)',
        'Payment Method / Bank (ระบบเพย์เมนต์/ธนาคาร)',
        'Detected Amount (ยอดเงินในระบบ)',
        'Priority (ความด่วนทางการเงิน)',
        'Status (สถานะ)',
        'Financial Summary (สรุปปัญหาฝาก-ถอน)',
        'Created At (วันเวลาที่เกิดรายการ)'
      ];

      rows = result.map(c => {
        const raw = ((c.conversation || '') + ' ' + (c.summary || '') + ' ' + (c.category_id || '')).toLowerCase();
        let finType = 'รายการทั่วไป';
        if (raw.includes('ถอน')) finType = 'ถอนเงิน (Withdrawal)';
        else if (raw.includes('ฝาก') || raw.includes('โอน')) finType = 'ฝากเงิน / โอนเงิน (Deposit)';
        else if (raw.includes('สลิป') || raw.includes('ยอดไม่เข้า')) finType = 'ตรวจสอบสลิป (Slip Verification)';

        const bank = extractBankProvider(c.conversation || c.summary || '');
        const amount = extractAmount(c.conversation || c.summary || '');
        const customerId = c.customer_id || c.cust_id || '';
        const custName = c.customer_name || c.name || `ลูกค้า #${customerId || (c.id || '').substring(0, 8)}`;
        const formattedDate = c.created_at ? new Date(c.created_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }) : '';

        return [
          c.id || '',
          customerId,
          custName,
          finType,
          bank,
          amount,
          (c.priority || 'low').toUpperCase(),
          c.status === 'completed' ? 'แยกแยะแล้ว (Completed)' : 'รอดำเนินการ (Pending)',
          (c.summary || '').replace(/\n/g, ' '),
          formattedDate
        ];
      });
    } else if (targetType === 'marketing') {
      filePrefix = 'AI_Triage_Marketing_Report';
      typeNameTH = 'รายงานการตลาด (ยอดลูกค้าใหม่)';
      csvHeaders = [
        'Chat ID (รหัสแชต)',
        'Customer ID (รหัสลูกค้า)',
        'Customer Name (ชื่อลูกค้า)',
        'Customer Status (ประเภทลูกค้า)',
        'First Inquiry (ประเด็นแรกที่ลูกค้าทักถาม)',
        'Campaign Tags (ป้ายกำกับแคมเปญ/VIP)',
        'Status (สถานะตอบรับ)',
        'Created At (วันเวลาที่ลูกค้าใหม่ทักเข้ามา)'
      ];

      rows = result.map(c => {
        const customerId = c.customer_id || c.cust_id || '';
        const custName = c.customer_name || c.name || `ลูกค้า #${customerId || (c.id || '').substring(0, 8)}`;
        const historyCount = chats.filter(item => 
          (customerId && (item.customer_id === customerId || item.cust_id === customerId)) ||
          (custName && item.customer_name === custName) ||
          item.id === c.id
        ).length;

        const isNewCustomer = historyCount === 1;
        const formattedDate = c.created_at ? new Date(c.created_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }) : '';
        const tags = c.tags || [];

        return [
          c.id || '',
          customerId,
          custName,
          isNewCustomer ? '✨ ลูกค้าใหม่ทักครั้งแรก' : '🔁 ลูกค้าเดิมทักซ้ำ',
          (c.summary || '').replace(/\n/g, ' '),
          tags.join(' '),
          c.status === 'completed' ? 'ดูแลเรียบร้อย (Completed)' : 'รอดำเนินการ (Pending)',
          formattedDate
        ];
      });
    } else {
      csvHeaders = [
        'Chat ID',
        'Customer ID',
        'Customer Name (ชื่อลูกค้า)',
        'Category (หมวดหมู่)',
        'Priority (ความด่วน)',
        'Status (สถานะ)',
        'AI Summary (ข้อสรุปปัญหา)',
        'Created At (วันเวลา)'
      ];

      rows = result.map(c => {
        const customerId = c.customer_id || c.cust_id || '';
        const custName = c.customer_name || c.name || `ลูกค้า #${customerId || (c.id || '').substring(0, 8)}`;
        const formattedDate = c.created_at ? new Date(c.created_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }) : '';

        return [
          c.id || '',
          customerId,
          custName,
          c.category_name || c.category_id || 'ฝากถอนเงิน',
          (c.priority || 'low').toUpperCase(),
          c.status === 'completed' ? 'แยกแยะแล้ว (Completed)' : 'รอดำเนินการ (Pending)',
          (c.summary || '').replace(/\n/g, ' '),
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

    const newId = `EXP-${Math.floor(1000 + Math.random() * 9000)}`;
    const newLogItem = {
      id: newId,
      name: filename,
      type: `${typeNameTH} (${dateRange})`,
      date: new Date().toISOString(),
      size: `${(blob.size / 1024).toFixed(1)} KB`,
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
            {language === 'th' ? 'เลือกส่งออกรายงานแบบไฟล์เดียวมีหลายแท็บชีต Excel หรือเลือกส่งออกไฟล์ CSV แยกตามแผนก' : 'Export reports as a multi-tab Excel workbook or individual CSV files for Finance & Marketing.'}
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
        {/* Left Card: Dynamic Filtering & Format Selector Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-5">
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm font-display flex items-center gap-2">
              <Filter size={16} className="text-indigo-600 dark:text-indigo-400" />
              {language === 'th' ? 'รูปแบบไฟล์ & ตัวกรองการส่งออก' : 'Export Format & Filters'}
            </h3>

            {/* Export Format Selector Mode (Checkboxes / Radio) */}
            <div className="space-y-2.5 p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-955/20 border border-indigo-100 dark:border-indigo-900/40">
              <label className="block text-[11px] font-extrabold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider">
                {language === 'th' ? 'รูปแบบไฟล์รายงานที่ต้องการ' : 'Select Export Format'}
              </label>
              
              <div className="space-y-2 select-none">
                <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-indigo-300 transition">
                  <input
                    type="radio"
                    name="exportFormat"
                    checked={exportFormatMode === 'xlsx_multi_sheet'}
                    onChange={() => setExportFormatMode('xlsx_multi_sheet')}
                    className="mt-0.5 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-100 block">📊 รวมไฟล์เดียวแยกแท็บชีตล่างสุด (Excel .xlsx)</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight block mt-0.5">
                      มี 3 แท็บในไฟล์เดียว: ภาพรวมระบบ / รายงานการเงิน / รายงานการตลาด
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-indigo-300 transition">
                  <input
                    type="radio"
                    name="exportFormat"
                    checked={exportFormatMode === 'csv_single'}
                    onChange={() => setExportFormatMode('csv_single')}
                    className="mt-0.5 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-100 block">📑 แยกส่งออกตามประเภทรายงาน (ไฟล์ CSV)</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight block mt-0.5">
                      ส่งออกแยกไฟล์ตามประเภทงานที่เลือกด้านล่าง
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Report Type Selector (Active when CSV mode or Preview mode) */}
            {exportFormatMode === 'csv_single' && (
              <div className="space-y-2 animate-fade-in">
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {language === 'th' ? 'เลือกประเภทรายงานที่จะส่งออก CSV' : 'Select CSV Report Category'}
                </label>
                <div className="grid grid-cols-1 gap-2 select-none">
                  <button
                    type="button"
                    onClick={() => setReportType('overall')}
                    className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                      reportType === 'overall' 
                        ? 'bg-indigo-50/90 text-indigo-750 border-indigo-300 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800 shadow-sm ring-2 ring-indigo-500/20' 
                        : 'bg-slate-50 dark:bg-slate-850/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-750 hover:bg-slate-100'
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
                        : 'bg-slate-50 dark:bg-slate-850/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-750 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <DollarSign size={15} className="text-emerald-600 dark:text-emerald-400" />
                      <span>💵 รายงานการเงิน (ฝาก-ถอน & บัญชี)</span>
                    </div>
                    {reportType === 'finance' && <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setReportType('marketing')}
                    className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                      reportType === 'marketing' 
                        ? 'bg-rose-50/90 text-rose-750 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800 shadow-sm ring-2 ring-rose-500/20' 
                        : 'bg-slate-50 dark:bg-slate-850/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-750 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Megaphone size={15} className="text-rose-600 dark:text-rose-400" />
                      <span>📣 รายงานการตลาด (ยอดลูกค้าใหม่)</span>
                    </div>
                    {reportType === 'marketing' && <CheckCircle2 size={14} className="text-rose-600 dark:text-rose-400" />}
                  </button>
                </div>
              </div>
            )}

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
          </div>

          {/* Dynamic Export Main Button */}
          {exportFormatMode === 'xlsx_multi_sheet' ? (
            <button
              onClick={handleExportMain}
              className="w-full bg-indigo-650 hover:bg-indigo-750 text-white py-3.5 rounded-2xl text-xs font-extrabold shadow-lg shadow-indigo-150 dark:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer mt-6 select-none"
            >
              <Download size={16} />
              {language === 'th' ? '📥 ส่งออกรายงานรวมไฟล์เดียว (Excel .xlsx)' : 'Export Master Report (.xlsx)'}
            </button>
          ) : (
            <button
              onClick={handleExportMain}
              className={`w-full text-white py-3.5 rounded-2xl text-xs font-extrabold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-6 select-none ${
                reportType === 'finance' ? 'bg-emerald-600 hover:bg-emerald-700' : reportType === 'marketing' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              <Download size={16} />
              {language === 'th' ? `📥 ส่งออก${reportType === 'finance' ? 'รายงานการเงิน' : reportType === 'marketing' ? 'รายงานการตลาด' : 'รายงานภาพรวม'} (CSV)` : 'Export Selected CSV Report'}
            </button>
          )}
        </div>

        {/* Right Section (2/3 width): Data Previews & Specialized Metrics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card row: Preview Data Summary */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="font-extrabold text-slate-850 dark:text-slate-100 text-sm font-display flex items-center gap-2">
                <FileSpreadsheet size={16} className={reportType === 'finance' ? 'text-emerald-500' : reportType === 'marketing' ? 'text-rose-500' : 'text-indigo-500'} />
                {language === 'th' ? 'ตัวอย่างและสรุปสถิติตามเงื่อนไข (Report Metric Summary)' : 'Report Metric Summary'}
              </h3>
              <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                {exportFormatMode === 'xlsx_multi_sheet' ? '📊 โหมด: Excel 3 แท็บชีต' : '📑 โหมด: ไฟล์เฉพาะทาง'}
              </span>
            </div>

            {/* Total matching stats card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-indigo-50/20 dark:bg-indigo-955/10 border border-indigo-50 dark:border-indigo-900/30 p-4.5 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{language === 'th' ? 'รายการแชตตรงตามตัวกรอง' : 'Filtered Cases'}</span>
                <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-2 font-display">{filteredCount} <span className="text-xs text-slate-400 font-bold uppercase">{language === 'th' ? 'เคส' : 'Cases'}</span></span>
              </div>
              <div className="bg-emerald-50/20 dark:bg-emerald-955/10 border border-emerald-100/50 dark:border-emerald-900/30 p-4.5 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{language === 'th' ? 'รายการการเงิน (ฝาก-ถอน)' : 'Financial Inbounds'}</span>
                <span className="text-3xl font-extrabold text-emerald-600 mt-2 font-display">{depositCount + withdrawalCount} <span className="text-xs text-slate-450 dark:text-slate-500 font-bold uppercase">{language === 'th' ? 'รายการ' : 'Items'}</span></span>
              </div>
              <div className="bg-rose-50/20 dark:bg-rose-955/10 border border-rose-100/50 dark:border-rose-900/30 p-4.5 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{language === 'th' ? 'ยอดลูกค้าใหม่ (การตลาด)' : 'New Customer Ratio'}</span>
                <span className="text-3xl font-extrabold text-rose-600 mt-2 font-display">{newCustomerCount} <span className="text-xs text-slate-450 dark:text-slate-500 font-bold uppercase">{language === 'th' ? `ราย (${filteredCount > 0 ? ((newCustomerCount/filteredCount)*100).toFixed(0) : 0}%)` : 'Users'}</span></span>
              </div>
            </div>

            {/* Specialized Metrics Breakdown */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-3">
              <span className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">
                {language === 'th' ? 'สถิติตามเงื่อนไขการเงินและการตลาด (Specialized Business Breakdown)' : 'Business Breakdown'}
              </span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-emerald-50/25 dark:bg-emerald-955/10 border border-emerald-100/60 dark:border-emerald-900/20 rounded-xl flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  <span>💵 รายการฝาก:</span>
                  <span className="text-sm font-extrabold">{depositCount}</span>
                </div>
                <div className="p-3 bg-amber-50/25 dark:bg-amber-955/10 border border-amber-100/60 dark:border-amber-900/20 rounded-xl flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-300">
                  <span>💸 รายการถอน:</span>
                  <span className="text-sm font-extrabold">{withdrawalCount}</span>
                </div>
                <div className="p-3 bg-rose-50/25 dark:bg-rose-955/10 border border-rose-100/60 dark:border-rose-900/20 rounded-xl flex items-center justify-between text-xs font-bold text-rose-700 dark:text-rose-300">
                  <span>✨ ลูกค้าใหม่:</span>
                  <span className="text-sm font-extrabold">{newCustomerCount}</span>
                </div>
                <div className="p-3 bg-purple-50/25 dark:bg-purple-955/10 border border-purple-100/60 dark:border-purple-900/20 rounded-xl flex items-center justify-between text-xs font-bold text-purple-700 dark:text-purple-300">
                  <span>🔁 ลูกค้าเดิมทักซ้ำ:</span>
                  <span className="text-sm font-extrabold">{returningCustomerCount}</span>
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
                      onClick={handleExportMain}
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
