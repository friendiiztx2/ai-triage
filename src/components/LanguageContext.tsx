'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'th' | 'en';

const translations = {
  th: {
    // Sidebar
    overview: 'ภาพรวมระบบ',
    chats: 'รายการแชตลูกค้า',
    customers: 'ข้อมูลลูกค้า',
    categories: 'จัดการหมวดหมู่',
    companies: 'จัดการบริษัท',
    users: 'จัดการผู้ใช้งาน',
    auditLogs: 'บันทึกกิจกรรม',
    themeLight: 'โหมดสว่าง (Light)',
    themeDark: 'โหมดมืด (Dark)',
    logout: 'ออกจากระบบ (Logout)',
    tenantLabel: 'บริษัทผู้ใช้งาน (Tenant Context)',
    connectionLabel: 'เชื่อมต่อ:',
    systemDeveloper: 'ระบบพัฒนาร่วมกับ อ้อ (Or)',
    switchTheme: 'สลับโหมด',
    switchLanguage: 'ภาษา / Language',

    // Dashboard (Overview)
    dashTitle: 'แดชบอร์ดภาพรวมระบบ',
    dashSub: 'สรุปปริมาณสถิติการคัดกรองปัญหาของลูกค้าอัตโนมัติด้วย AI',
    cardTotalChats: 'แชตลูกค้าทั้งหมด',
    cardPending: 'รอการดำเนินการคัดแยก',
    cardUrgent: 'ด่วน / ด่วนที่สุด',
    cardActiveCustomers: 'จำนวนลูกค้าลงทะเบียน',
    casesByCategory: 'จำนวนเคสแยกตามประเภทปัญหา (Simulated Cases by Category)',
    casesByCategorySub: 'สรุปจำนวนเคสปัญหาที่คัดแยกแล้วของแต่ละประเด็นย่อย (คลิกเพื่อดูรายการแชต)',
    showAllCategories: 'แสดงหมวดหมู่ทั้งหมด',
    aiAccuracyTitle: 'การประเมินความแม่นยำ AI (AI Accuracy Audit)',
    aiAccuracySub: 'อัตราการยอมรับข้อมูลตาม AI และสถิติที่เจ้าหน้าที่คัดแยกแก้ไข',
    accuracyRate: 'อัตราความถูกต้อง',
    excellent: 'ดีเยี่ยม (Excellent)',
    auditedCases: 'เคสที่ตรวจสอบแล้ว',
    confirmedByAi: 'ยืนยันตาม AI',
    overrideByAdmin: 'แก้ไขโดยแอดมิน (Override)',
    cases: 'เคส',
    persons: 'ราย',
    statsDisclaimer: '* สถิติตัวเลขมาจากการเปรียบเทียบประวัติการแก้ไขบทสนทนาจริงในระบบ',
    categoryTrendsTitle: 'เปรียบเทียบแนวโน้มประเภทปัญหา (Category Trends Comparison)',
    categoryTrendsSub: 'เปรียบเทียบจำนวนการเกิดเคสแต่ละประเภทแยกเป็นรายเส้นคนละสีตามช่วงเวลา',
    priorityStatsTitle: 'ระดับความเร่งด่วน (Priority Statistics)',
    priorityStatsSub: 'จำนวนปัญหาแยกตามระดับความฉุกเฉินของการช่วยเหลือ (โทนพาสเทลสบายตา)',
    noData: 'ไม่มีข้อมูลความเร่งด่วนในช่วงเวลานี้',
    timeToday: 'วันนี้ (Today)',
    time7Days: '7 วันล่าสุด',
    time30Days: '30 วันล่าสุด',
    timeCustom: 'ระบุช่วงวันที่เอง...',
    chartTimeframe: 'ช่วงเวลา:',
    chartReload: 'รีเฟรชออโต้:',
    chartLoadData: 'โหลดซ้ำข้อมูล',
    reloadOff: 'ปิด',

    // Chats Manager
    chatsTitle: 'เครื่องมือคัดกรองปัญหาแชต (AI Triage Manager)',
    chatsSub: 'บริหารจัดการ จัดหมวดหมู่ และประเมินความเร่งด่วนของรายการแชตทั้งหมดจากลูกค้า',
    btnExportCsv: 'ส่งออกรายงาน CSV',
    filterSearch: 'ค้นหาลูกค้า หรือหัวข้อ...',
    filterStatus: 'สถานะ: ทั้งหมด',
    filterPending: 'รอดำเนินการ (Pending)',
    filterCompleted: 'จัดแยกแยะแล้ว (Completed)',
    filterPriority: 'ความด่วน: ทั้งหมด',
    filterCategory: 'หมวดหมู่: ทั้งหมด',
    filterAiAudit: 'ผลประเมิน AI: ทั้งหมด',
    filterConfirmed: 'ตรงตาม AI (Confirmed)',
    filterCorrected: 'แอดมินแก้ไข (Override)',
    filterTimeframe: 'ช่วงเวลา: ทั้งหมด',
    colChatId: 'แชทไอดี (Chat ID)',
    colCustomer: 'ลูกค้า (Customer)',
    colAiSummary: 'ข้อสรุปปัญหา (AI Summary)',
    colCategory: 'หมวดหมู่ (Category)',
    colPriority: 'ความด่วน (Priority)',
    colStatus: 'สถานะ (Status)',
    colTime: 'เวลา (Time)',
    loadingChats: 'กำลังดึงรายการแชตจากระบบ...',
    noChatsFound: 'ไม่พบข้อมูลแชตที่ตรงตามตัวเลือกฟิลเตอร์',

    // Audit Logs
    auditLogsTitle: 'บันทึกประวัติการทำงาน (Audit & Activity Logs)',
    auditLogsSub: 'ตรวจสอบบันทึกกิจกรรมย้อนหลัง การแก้ไขหมวดหมู่ การคัดแยกเคส และประวัติการเข้าใช้งานระบบ',
    auditSearchPlaceholder: 'ค้นหาชื่อผู้ดำเนินการ หรือรายละเอียดกิจกรรม...',
    auditFilterAll: 'ประเภทกิจกรรม: ทั้งหมด',
    auditNoData: 'ไม่พบประวัติการบันทึกกิจกรรมตามเงื่อนไขที่เลือก',
    auditLoading: 'กำลังโหลดบันทึกกิจกรรมย้อนหลัง...',
  },
  en: {
    // Sidebar
    overview: 'System Overview',
    chats: 'Customer Chats',
    customers: 'Customer Info',
    categories: 'Manage Categories',
    companies: 'Manage Companies',
    users: 'Manage Users',
    auditLogs: 'Audit Logs',
    themeLight: 'Light Mode',
    themeDark: 'Dark Mode',
    logout: 'Logout',
    tenantLabel: 'Tenant Context',
    connectionLabel: 'Connected:',
    systemDeveloper: 'Developed with Or',
    switchTheme: 'Theme',
    switchLanguage: 'Language',

    // Dashboard (Overview)
    dashTitle: 'System Overview Dashboard',
    dashSub: 'AI-powered summary of customer issue triage and categorization stats',
    cardTotalChats: 'Total Customer Chats',
    cardPending: 'Pending Triage',
    cardUrgent: 'Urgent / Critical',
    cardActiveCustomers: 'Registered Customers',
    casesByCategory: 'Simulated Cases by Category',
    casesByCategorySub: 'Summary of triaged cases for each sub-category (click to view chats)',
    showAllCategories: 'Show All Categories',
    aiAccuracyTitle: 'AI Accuracy Audit',
    aiAccuracySub: 'Acceptance rate of AI recommendations vs. manual overrides',
    accuracyRate: 'Accuracy Rate',
    excellent: 'Excellent',
    auditedCases: 'Audited Cases',
    confirmedByAi: 'Confirmed by AI',
    overrideByAdmin: 'Manual Overrides',
    cases: 'Cases',
    persons: 'Persons',
    statsDisclaimer: '* Statistics computed from actual manual chat categorization history.',
    categoryTrendsTitle: 'Category Trends Comparison',
    categoryTrendsSub: 'Compare volume trends for each category over time',
    priorityStatsTitle: 'Priority Statistics',
    priorityStatsSub: 'Volume of issues by urgency level (soft pastel tone)',
    noData: 'No priority data for this timeframe',
    timeToday: 'Today',
    time7Days: 'Last 7 Days',
    time30Days: 'Last 30 Days',
    timeCustom: 'Custom Range...',
    chartTimeframe: 'Timeframe:',
    chartReload: 'Auto Refresh:',
    chartLoadData: 'Reload Data',
    reloadOff: 'Off',

    // Chats Manager
    chatsTitle: 'AI Triage Manager',
    chatsSub: 'Manage, categorize, and evaluate urgency of customer chat logs',
    btnExportCsv: 'Export CSV Report',
    filterSearch: 'Search customer or topic...',
    filterStatus: 'Status: All',
    filterPending: 'Pending',
    filterCompleted: 'Completed',
    filterPriority: 'Priority: All',
    filterCategory: 'Category: All',
    filterAiAudit: 'AI Evaluation: All',
    filterConfirmed: 'Confirmed by AI',
    filterCorrected: 'Override by Admin',
    filterTimeframe: 'Timeframe: All',
    colChatId: 'Chat ID',
    colCustomer: 'Customer',
    colAiSummary: 'AI Summary',
    colCategory: 'Category',
    colPriority: 'Priority',
    colStatus: 'Status',
    colTime: 'Time',
    loadingChats: 'Retrieving chat logs from system...',
    noChatsFound: 'No chats found matching filters',

    // Audit Logs
    auditLogsTitle: 'Audit & Activity Logs',
    auditLogsSub: 'Audit system activity logs, category updates, triage overrides, and user session history',
    auditSearchPlaceholder: 'Search by user name, email or details...',
    auditFilterAll: 'Action Type: All',
    auditNoData: 'No audit logs found for the selected criteria',
    auditLoading: 'Loading audit logs history...',
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('th');

  useEffect(() => {
    const saved = localStorage.getItem('language') as Language | null;
    if (saved === 'th' || saved === 'en') {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string) => {
    const section = translations[language];
    return (section as any)[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
