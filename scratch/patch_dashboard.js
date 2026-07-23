const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add import
if (!content.includes("import { useLanguage }")) {
  content = content.replace(
    `import Link from 'next/link';`,
    `import Link from 'next/link';\nimport { useLanguage } from '@/components/LanguageContext';`
  );
}

// 2. Add hook call inside OverviewPage
if (!content.includes("const { t, language } = useLanguage();")) {
  content = content.replace(
    `export default function OverviewPage() {`,
    `export default function OverviewPage() {\n  const { t, language } = useLanguage();`
  );
}

// 3. Replace titles
content = content.replace(`แดชบอร์ดภาพรวมระบบ`, `{t('dashTitle')}`);
content = content.replace(`สรุปปริมาณสถิติการคัดกรองปัญหาของลูกค้าอัตโนมัติด้วย AI`, `{t('dashSub')}`);

// 4. Timeframe option replacements
content = content.replace(
  `<option value="today">ช่วงเวลา: วันนี้ (Today)</option>`,
  `<option value="today">{language === 'th' ? 'ช่วงเวลา: วันนี้ (Today)' : 'Timeframe: Today'}</option>`
);
content = content.replace(
  `<option value="7days">ช่วงเวลา: 7 วันล่าสุด</option>`,
  `<option value="7days">{language === 'th' ? 'ช่วงเวลา: 7 วันล่าสุด' : 'Timeframe: Last 7 Days'}</option>`
);
content = content.replace(
  `<option value="30days">ช่วงเวลา: 30 วันล่าสุด</option>`,
  `<option value="30days">{language === 'th' ? 'ช่วงเวลา: 30 วันล่าสุด' : 'Timeframe: Last 30 Days'}</option>`
);
content = content.replace(
  `<option value="custom">ระบุช่วงวันที่เอง...</option>`,
  `<option value="custom">{language === 'th' ? 'ระบุช่วงวันที่เอง...' : 'Custom Range...'}</option>`
);

// 5. Auto Refresh option replacements
content = content.replace(
  `<option value="off">รีเฟรชออโต้: ปิด</option>`,
  `<option value="off">{language === 'th' ? 'รีเฟรชออโต้: ปิด' : 'Auto Refresh: Off'}</option>`
);
content = content.replace(
  `<option value="30s">รีเฟรชออโต้: ทุก 30 วิ</option>`,
  `<option value="30s">{language === 'th' ? 'รีเฟรชออโต้: ทุก 30 วิ' : 'Auto Refresh: 30s'}</option>`
);
content = content.replace(
  `<option value="1m">รีเฟรชออโต้: ทุก 1 นาที</option>`,
  `<option value="1m">{language === 'th' ? 'รีเฟรชออโต้: ทุก 1 นาที' : 'Auto Refresh: 1 min'}</option>`
);
content = content.replace(
  `<option value="3m">รีเฟรชออโต้: ทุก 3 นาที</option>`,
  `<option value="3m">{language === 'th' ? 'รีเฟรชออโต้: ทุก 3 นาที' : 'Auto Refresh: 3 min'}</option>`
);

// 6. Reload button
content = content.replace(
  `<RefreshCw size={14} /> โหลดซ้ำข้อมูล`,
  `<RefreshCw size={14} /> {t('chartLoadData')}`
);

// 7. Cards
content = content.replace(
  `<span className="text-slate-400 dark:text-slate-555 text-xs font-bold uppercase tracking-wider">แชตลูกค้าทั้งหมด</span>`,
  `<span className="text-slate-400 dark:text-slate-555 text-xs font-bold uppercase tracking-wider">{t('cardTotalChats')}</span>`
);
content = content.replace(
  `{stats.totalChats} เคส`,
  `{stats.totalChats} {t('cases')}`
);

content = content.replace(
  `<span className="text-slate-400 dark:text-slate-555 text-xs font-bold uppercase tracking-wider">รอดำเนินการคัดแยก</span>`,
  `<span className="text-slate-400 dark:text-slate-555 text-xs font-bold uppercase tracking-wider">{t('cardPending')}</span>`
);
content = content.replace(
  `{stats.pendingTriage} เคส`,
  `{stats.pendingTriage} {t('cases')}`
);

content = content.replace(
  `<span className="text-slate-400 dark:text-slate-555 text-xs font-bold uppercase tracking-wider">ด่วน / ด่วนที่สุด</span>`,
  `<span className="text-slate-400 dark:text-slate-555 text-xs font-bold uppercase tracking-wider">{t('cardUrgent')}</span>`
);
content = content.replace(
  `{stats.highPriority} เคส`,
  `{stats.highPriority} {t('cases')}`
);

content = content.replace(
  `<span className="text-slate-400 dark:text-slate-555 text-xs font-bold uppercase tracking-wider">จำนวนลูกค้าลงทะเบียน</span>`,
  `<span className="text-slate-400 dark:text-slate-555 text-xs font-bold uppercase tracking-wider">{t('cardActiveCustomers')}</span>`
);
content = content.replace(
  `{stats.totalCustomers} ราย`,
  `{stats.totalCustomers} {t('persons')}`
);

// 8. Cases by Category Breakdown
content = content.replace(
  `จำนวนเคสแยกตามประเภทปัญหา (Simulated Cases by Category)`,
  `{t('casesByCategory')}`
);
content = content.replace(
  `สรุปจำนวนเคสปัญหาที่คัดแยกแล้วของแต่ละประเด็นย่อย (คลิกเพื่อดูรายการแชต)`,
  `{t('casesByCategorySub')}`
);
content = content.replace(
  `แสดงหมวดหมู่ทั้งหมด`,
  `{t('showAllCategories')}`
);

// 9. AI Accuracy Audit
content = content.replace(
  `การประเมินความแม่นยำ AI (AI Accuracy Audit)`,
  `{t('aiAccuracyTitle')}`
);
content = content.replace(
  `อัตราการยอมรับข้อมูลตาม AI และสถิติที่เจ้าหน้าที่คัดแยกแก้ไข`,
  `{t('aiAccuracySub')}`
);
content = content.replace(
  `อัตราความถูกต้อง`,
  `{t('accuracyRate')}`
);
content = content.replace(
  `ดีเยี่ยม (Excellent)`,
  `{t('excellent')}`
);
content = content.replace(
  `เคสที่ตรวจสอบแล้ว`,
  `{t('auditedCases')}`
);
content = content.replace(
  `ยืนยันตาม AI`,
  `{t('confirmedByAi')}`
);
content = content.replace(
  `แก้ไขโดยแอดมิน (Override)`,
  `{t('overrideByAdmin')}`
);
content = content.replace(
  `* สถิติตัวเลขมาจากการเปรียบเทียบประวัติการแก้ไขบทสนทนาจริงในระบบ`,
  `{t('statsDisclaimer')}`
);

// 10. Trends & Priority
content = content.replace(
  `เปรียบเทียบแนวโน้มประเภทปัญหา (Category Trends Comparison)`,
  `{t('categoryTrendsTitle')}`
);
content = content.replace(
  `เปรียบเทียบจำนวนการเกิดเคสแต่ละประเภทแยกเป็นรายเส้นคนละสีตามช่วงเวลา`,
  `{t('categoryTrendsSub')}`
);
content = content.replace(
  `ระดับความเร่งด่วน (Priority Statistics)`,
  `{t('priorityStatsTitle')}`
);
content = content.replace(
  `จำนวนปัญหาแยกตามระดับความฉุกเฉินของการช่วยเหลือ (โทนพาสเทลสบายตา)`,
  `{t('priorityStatsSub')}`
);
content = content.replace(
  `ไม่มีข้อมูลความเร่งด่วนในช่วงเวลานี้`,
  `{t('noData')}`
);

// 11. Custom date picker label
content = content.replace(
  `<span className="text-xs font-semibold text-slate-400">ถึง</span>`,
  `<span className="text-xs font-semibold text-slate-400">{language === 'th' ? 'ถึง' : 'to'}</span>`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched page.tsx (Dashboard)!');
