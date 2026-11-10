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
    usageQuotas: 'การใช้งานและโควต้า',
    telegramGroups: 'จัดการกลุ่ม Telegram',
    userIssues: 'ปัญหาจากผู้ใช้งาน',
    reportsExport: 'รายงานและส่งออก',
    themeLight: 'โหมดสว่าง',
    themeDark: 'โหมดมืด',
    logout: 'ออกจากระบบ',
    tenantLabel: 'บริษัทผู้ใช้งาน',
    connectionLabel: 'เชื่อมต่อ:',
    systemDeveloper: 'ระบบพัฒนาโดยทีม Sift AI',
    switchTheme: 'สลับโหมด',
    switchLanguage: 'เปลี่ยนภาษา',

    // Dashboard (Overview)
    dashTitle: 'แดชบอร์ดภาพรวมระบบ',
    dashSub: 'สรุปปริมาณสถิติการคัดกรองปัญหาของลูกค้าอัตโนมัติด้วย Sift AI',
    cardTotalChats: 'แชตลูกค้าทั้งหมด',
    cardPending: 'รอการดำเนินการคัดแยก',
    cardUrgent: 'ด่วนที่สุด',
    cardActiveCustomers: 'จำนวนลูกค้าลงทะเบียน',
    casesByCategory: 'จำนวนเคสแยกตามประเภทปัญหา',
    casesByCategorySub: 'สรุปจำนวนเคสปัญหาที่คัดแยกแล้วของแต่ละประเด็นย่อย (คลิกเพื่อดูรายการแชต)',
    showAllCategories: 'แสดงหมวดหมู่ทั้งหมด',
    aiAccuracyTitle: 'การประเมินความแม่นยำ AI',
    aiAccuracySub: 'อัตราการยอมรับข้อมูลตาม AI และสถิติที่เจ้าหน้าที่คัดแยกแก้ไข',
    accuracyRate: 'อัตราความถูกต้อง',
    excellent: 'ดีเยี่ยม',
    auditedCases: 'เคสที่ตรวจสอบแล้ว',
    confirmedByAi: 'ยืนยันตาม AI แนะนำ',
    overrideByAdmin: 'แก้ไขโดยเจ้าหน้าที่',
    cases: 'เคส',
    persons: 'ราย',
    statsDisclaimer: '* สถิติตัวเลขมาจากการเปรียบเทียบประวัติการแก้ไขบทสนทนาจริงในระบบ',
    categoryTrendsTitle: 'เปรียบเทียบแนวโน้มประเภทปัญหา',
    categoryTrendsSub: 'เปรียบเทียบจำนวนการเกิดเคสแต่ละประเภทแยกเป็นรายเส้นคนละสีตามช่วงเวลา',
    priorityStatsTitle: 'ระดับความเร่งด่วน',
    priorityStatsSub: 'จำนวนปัญหาแยกตามระดับความฉุกเฉินของการช่วยเหลือ',
    noData: 'ไม่มีข้อมูลความเร่งด่วนในช่วงเวลานี้',
    timeToday: 'วันนี้',
    time7Days: '7 วันล่าสุด',
    time30Days: '30 วันล่าสุด',
    timeCustom: 'ระบุช่วงวันที่เอง...',
    chartTimeframe: 'ช่วงเวลา:',
    chartReload: 'รีเฟรชออโต้:',
    chartLoadData: 'โหลดซ้ำข้อมูล',
    reloadOff: 'ปิด',

    // Chats Manager
    chatsTitle: 'เครื่องมือคัดกรองปัญหาแชต',
    chatsSub: 'บริหารจัดการ จัดหมวดหมู่ และประเมินความเร่งด่วนของรายการแชตทั้งหมดด้วย Sift AI',
    btnExportCsv: 'ส่งออกรายงาน CSV',
    filterSearch: 'ค้นหาลูกค้า หรือหัวข้อ...',
    filterStatus: 'สถานะ: ทั้งหมด',
    filterPending: 'รอดำเนินการ',
    filterCompleted: 'จัดแยกแยะแล้ว',
    filterPriority: 'ความด่วน: ทั้งหมด',
    filterCategory: 'หมวดหมู่: ทั้งหมด',
    filterAiAudit: 'ผลประเมิน AI: ทั้งหมด',
    filterConfirmed: 'ตรงตาม AI แนะนำ',
    filterCorrected: 'แก้ไขโดยเจ้าหน้าที่',
    filterTimeframe: 'ช่วงเวลา: ทั้งหมด',
    colChatId: 'รหัสแชต',
    colCustomer: 'ลูกค้า',
    colAiSummary: 'ข้อสรุปปัญหาโดย AI',
    colCategory: 'หมวดหมู่',
    colPriority: 'ความด่วน',
    colStatus: 'สถานะ',
    colTime: 'เวลา',
    loadingChats: 'กำลังดึงรายการแชตจากระบบ...',
    noChatsFound: 'ไม่พบข้อมูลแชตที่ตรงตามตัวเลือกฟิลเตอร์',

    // Audit Logs
    auditLogsTitle: 'บันทึกประวัติการทำงาน',
    auditLogsSub: 'ตรวจสอบบันทึกกิจกรรมย้อนหลัง การแก้ไขหมวดหมู่ การคัดแยกเคส และประวัติการเข้าใช้งานระบบ',
    auditSearchPlaceholder: 'ค้นหาชื่อผู้ดำเนินการ หรือรายละเอียดกิจกรรม...',
    auditFilterAll: 'ประเภทกิจกรรม: ทั้งหมด',
    auditNoData: 'ไม่พบประวัติการบันทึกกิจกรรมตามเงื่อนไขที่เลือก',
    auditLoading: 'กำลังโหลดบันทึกกิจกรรมย้อนหลัง...',

    // Usage & Quotas Monitoring
    quotaTitle: 'ระบบติดตามการใช้งานและโควต้า',
    quotaSub: 'ตรวจสอบปริมาณข้อความ โทเคน AI และระบบแจ้งเตือนอัตโนมัติ 80% / 90%',
    quotaRefresh: 'รีเฟรชข้อมูล',
    quotaEditBtn: 'ปรับแต่งโควต้า',
    quotaMonthlyTitle: 'โควต้าประจำเดือน',
    quotaUnlimitedBadge: 'ไม่จำกัด',
    quotaUnlimitedPlan: 'แพ็กเกจพิเศษ: ไม่จำกัดจำนวนแชต',
    quotaUnlimitedDesc: 'ระบบจะไม่จำกัดโควต้าและไม่มีการระงับการใช้งาน',
    quotaCriticalTitle: 'วิกฤต: โควต้าใกล้เต็ม 90%',
    quotaWarningTitle: 'แจ้งเตือนเฝ้าระวัง: ใช้โควต้าถึง 80%',
    quotaNormalTitle: 'สถานะการใช้งานอยู่ในเกณฑ์ปกติ',
    quotaRemainingMsg: 'คงเหลือ {n} ข้อความ',
    quotaRemainingDays: 'เหลืออีก {n} วัน',
    quotaElapsedDays: 'ผ่านไปแล้ว {elapsed} จากทั้งหมด {total} วัน ในรอบเดือนนี้',
    quotaCyclePeriod: 'รอบระยะเวลาการใช้งาน',
    quotaCardUsed: 'ข้อความที่ใช้ในเดือนนี้',
    quotaCardTokens: 'โทเคน AI โดยประมาณ',
    quotaCardDailyAvg: 'เฉลี่ยต่อวัน',
    quotaCardForecast: 'พยากรณ์สิ้นเดือน',
    quotaSafeForecast: '✓ ปลอดภัย อยู่ในกรอบโควต้า',
    quotaRiskForecast: '⚠️ เสี่ยงเกินโควต้า ({p}%)',
    quotaUnlimitedForecast: '✓ ใช้งานได้ไม่จำกัด',
    quotaDailyTrend: 'ปริมาณการใช้งานรายวัน',
    quotaDailyTarget: 'เกณฑ์แนะนำต่อวัน',
    quotaPeakHours: 'ช่วงเวลาการใช้งานสูงสุด',
    quotaHistoryTitle: 'ประวัติการใช้งานย้อนหลัง',
    quotaHistorySub: 'เปรียบเทียบโควต้าและการใช้งานจริงในรอบ 4 เดือนล่าสุด',
    quotaExportCsv: 'ส่งออก CSV',
    quotaAllCompaniesTitle: 'ภาพรวมโควต้าของทุกบริษัท',
    quotaAllCompaniesSub: 'เฉพาะ System Admin: ปรับแพ็กเกจ (Starter 20k / Pro 50k / Enterprise 120k / ไม่จำกัด)',
    quotaSearchCompany: 'ค้นหาชื่อบริษัท...',
    quotaColMonth: 'รอบเดือน',
    quotaColAllocated: 'โควต้าที่จัดสรร',
    quotaColActual: 'ข้อความที่ใช้จริง',
    quotaColRatio: 'สัดส่วนการใช้งาน (%)',
    quotaColStatus: 'สถานะ',
    quotaColCompany: 'ชื่อบริษัท',
    quotaColPackage: 'แพ็กเกจ / โควต้าต่อเดือน',
    quotaColUsed: 'ใช้ไปแล้ว',
    quotaColRatioShort: 'สัดส่วน (%)',
    quotaColActions: 'การจัดการ',
    quotaViewChart: 'ดูกราฟ',
    quotaStatusNormal: 'ปกติ',
    quotaStatusWarning: 'เฝ้าระวัง',
    quotaStatusCritical: 'วิกฤต',
    quotaStatusUnlimited: 'ไม่จำกัด',
    quotaActiveBadge: 'เปิดอยู่',
    quotaMessagesUnit: 'ข้อความ',
    quotaTokensUnit: 'โทเคน',
    quotaDayLabel: 'วันที่ {d} ของเดือน',
    quotaHourLabel: 'เวลา {h}',
    quotaBenchmarkLabel: 'เกณฑ์เฉลี่ย',
    quotaNoDailyData: 'ยังไม่มีข้อมูลการใช้งานรายวันในเดือนนี้',
    quotaNoHourlyData: 'ยังไม่มีข้อมูลชั่วโมงสนทนา',
    quotaChatVolume: 'ปริมาณแชต',
    quotaUsageVolume: 'การใช้งาน',
    quotaUnlimitedPackageNote: '✨ แพ็กเกจพิเศษ ไม่จำกัดจำนวนแชต',
    quotaUnlimitedNoCutoff: 'ไม่มีการตัดรอบหรือระงับการใช้งานอัตโนมัติ',
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
    usageQuotas: 'Usage & Quotas',
    telegramGroups: 'Telegram Groups',
    userIssues: 'User Issues',
    reportsExport: 'Reports & Export',
    themeLight: 'Light Mode',
    themeDark: 'Dark Mode',
    logout: 'Logout',
    tenantLabel: 'Tenant Context',
    connectionLabel: 'Connected:',
    systemDeveloper: 'Developed by Sift AI Team',
    switchTheme: 'Switch Theme',
    switchLanguage: 'Language',

    // Dashboard (Overview)
    dashTitle: 'System Overview Dashboard',
    dashSub: 'Summary of automated customer issue triage statistics with Sift AI',
    cardTotalChats: 'Total Customer Chats',
    cardPending: 'Pending Categorization',
    cardUrgent: 'Urgent',
    cardActiveCustomers: 'Registered Customers',
    casesByCategory: 'Cases by Category',
    casesByCategorySub: 'Summary of categorized cases per topic (click to view chat logs)',
    showAllCategories: 'Show All Categories',
    aiAccuracyTitle: 'AI Accuracy Audit',
    aiAccuracySub: 'AI recommendation acceptance rate vs. manual overrides',
    accuracyRate: 'Accuracy Rate',
    excellent: 'Excellent',
    auditedCases: 'Audited Cases',
    confirmedByAi: 'Confirmed by AI',
    overrideByAdmin: 'Manual Overrides',
    cases: 'Cases',
    persons: 'Persons',
    statsDisclaimer: '* Statistics derived from actual manual chat categorization history.',
    categoryTrendsTitle: 'Category Trends Comparison',
    categoryTrendsSub: 'Comparison of case volume trends across categories over time',
    priorityStatsTitle: 'Priority Statistics',
    priorityStatsSub: 'Volume of issues classified by urgency level',
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
    chatsTitle: 'Chat Triage Manager',
    chatsSub: 'Manage, categorize, and evaluate urgency of customer chat logs with Sift AI',
    btnExportCsv: 'Export CSV Report',
    filterSearch: 'Search customer or topic...',
    filterStatus: 'Status: All',
    filterPending: 'Pending',
    filterCompleted: 'Completed',
    filterPriority: 'Priority: All',
    filterCategory: 'Category: All',
    filterAiAudit: 'AI Evaluation: All',
    filterConfirmed: 'Confirmed by AI',
    filterCorrected: 'Manual Override',
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
    auditLogsSub: 'Audit system activity logs, category modifications, and user session history',
    auditSearchPlaceholder: 'Search by user name, email, or details...',
    auditFilterAll: 'Action Type: All',
    auditNoData: 'No audit logs found for the selected criteria',
    auditLoading: 'Loading audit logs history...',

    // Usage & Quotas Monitoring
    quotaTitle: 'Usage & Quotas Monitoring',
    quotaSub: 'Monitor message volume, AI tokens, and automated 80% / 90% threshold alerts',
    quotaRefresh: 'Refresh Data',
    quotaEditBtn: 'Edit Quota',
    quotaMonthlyTitle: 'Monthly Quota',
    quotaUnlimitedBadge: 'Unlimited',
    quotaUnlimitedPlan: 'Custom Plan: Unlimited Messages',
    quotaUnlimitedDesc: 'System does not restrict quota or throttle usage automatically',
    quotaCriticalTitle: 'Critical: Quota Reached 90%',
    quotaWarningTitle: 'Warning: Quota Reached 80%',
    quotaNormalTitle: 'Usage status is in normal range',
    quotaRemainingMsg: '{n} messages remaining',
    quotaRemainingDays: '{n} days remaining',
    quotaElapsedDays: '{elapsed} of {total} days elapsed this cycle',
    quotaCyclePeriod: 'Billing Cycle Period',
    quotaCardUsed: 'Messages Used This Month',
    quotaCardTokens: 'Estimated AI Tokens',
    quotaCardDailyAvg: 'Daily Average',
    quotaCardForecast: 'Month-end Forecast',
    quotaSafeForecast: '✓ Safe, within quota',
    quotaRiskForecast: '⚠️ Risk of exceeding quota ({p}%)',
    quotaUnlimitedForecast: '✓ Unlimited usage',
    quotaDailyTrend: 'Daily Usage Trend',
    quotaDailyTarget: 'Daily Target',
    quotaPeakHours: 'Peak Hours',
    quotaHistoryTitle: 'Historical Usage Cycles',
    quotaHistorySub: 'Quota vs. actual usage comparison over the last 4 billing cycles',
    quotaExportCsv: 'Export CSV',
    quotaAllCompaniesTitle: 'Multi-Tenant Quotas Overview',
    quotaAllCompaniesSub: 'System Admin Only: Adjust packages (Starter 20k / Pro 50k / Enterprise 120k / Unlimited)',
    quotaSearchCompany: 'Search company name...',
    quotaColMonth: 'Billing Cycle',
    quotaColAllocated: 'Allocated Quota',
    quotaColActual: 'Actual Used',
    quotaColRatio: 'Usage Ratio (%)',
    quotaColStatus: 'Status',
    quotaColCompany: 'Company Name',
    quotaColPackage: 'Plan / Monthly Quota',
    quotaColUsed: 'Used Messages',
    quotaColRatioShort: 'Ratio (%)',
    quotaColActions: 'Actions',
    quotaViewChart: 'View Chart',
    quotaStatusNormal: 'Normal',
    quotaStatusWarning: 'Warning',
    quotaStatusCritical: 'Critical',
    quotaStatusUnlimited: 'Unlimited',
    quotaActiveBadge: 'Active',
    quotaMessagesUnit: 'messages',
    quotaTokensUnit: 'Tokens',
    quotaDayLabel: 'Day {d} of month',
    quotaHourLabel: 'Time {h}',
    quotaBenchmarkLabel: 'Benchmark',
    quotaNoDailyData: 'No daily usage data available for this month',
    quotaNoHourlyData: 'No hourly chat data available',
    quotaChatVolume: 'Chat Volume',
    quotaUsageVolume: 'Usage',
    quotaUnlimitedPackageNote: '✨ Custom plan with unlimited chat messages',
    quotaUnlimitedNoCutoff: 'No automatic cutoff or quota restriction',
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
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

  const t = (key: string, params?: Record<string, string | number>) => {
    const section = translations[language];
    let val: string = (section as any)?.[key] || (translations.th as any)?.[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        val = val.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }
    return val;
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
