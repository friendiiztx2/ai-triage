const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'chats', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add import
if (!content.includes("import { useLanguage }")) {
  content = content.replace(
    `import Sidebar from "@/components/Sidebar";`,
    `import Sidebar from "@/components/Sidebar";\nimport { useLanguage } from '@/components/LanguageContext';`
  );
}

// 2. Add hook call inside ChatsPage
if (!content.includes("const { t, language } = useLanguage();")) {
  content = content.replace(
    `export default function ChatsPage() {`,
    `export default function ChatsPage() {\n  const { t, language } = useLanguage();`
  );
}

// 3. Replace titles
content = content.replace(`ระบบบริการจัดการดูแล (AI Triage Manager)`, `{t('chatsTitle')}`);
content = content.replace(`คัดแยก จัดหมวดหมู่ และแก้ไขความเร่งด่วนของลูกค้าในการแก้ปัญหา (รองรับหน้าต่างลอยเปรียบเทียบซ้อนกันได้)`, `{t('chatsSub')}`);
content = content.replace(`ส่งออกรายงาน CSV`, `{t('btnExportCsv')}`);

// 4. Replace filters
content = content.replace(`placeholder="ค้นหาลูกค้า หรือหัวข้อ..."`, `placeholder={t('filterSearch')}`);
content = content.replace(`<option value="all">สถานะ: ทั้งหมด</option>`, `<option value="all">{t('filterStatus')}</option>`);
content = content.replace(`<option value="pending">รอดำเนินการ (Pending)</option>`, `<option value="pending">{t('filterPending')}</option>`);
content = content.replace(`<option value="completed">จัดแยกแยะแล้ว (Completed)</option>`, `<option value="completed">{t('filterCompleted')}</option>`);

content = content.replace(`<option value="all">ความด่วน: ทั้งหมด</option>`, `<option value="all">{t('filterPriority')}</option>`);
content = content.replace(`<option value="all">หมวดหมู่: ทั้งหมด</option>`, `<option value="all">{t('filterCategory')}</option>`);

content = content.replace(`<option value="all">ผลประเมิน AI: ทั้งหมด</option>`, `<option value="all">{t('filterAiAudit')}</option>`);
content = content.replace(`<option value="confirmed">ตรงตาม AI (Confirmed)</option>`, `<option value="confirmed">{t('filterConfirmed')}</option>`);
content = content.replace(`<option value="corrected">แอดมินแก้ไข (Override)</option>`, `<option value="corrected">{t('filterCorrected')}</option>`);

content = content.replace(`<option value="all">ช่วงเวลา: ทั้งหมด</option>`, `<option value="all">{t('filterTimeframe')}</option>`);
content = content.replace(`<option value="today">ช่วงเวลา: วันนี้</option>`, `<option value="today">{language === 'th' ? 'ช่วงเวลา: วันนี้' : 'Timeframe: Today'}</option>`);
content = content.replace(`<option value="7days">ช่วงเวลา: 7 วันล่าสุด</option>`, `<option value="7days">{language === 'th' ? 'ช่วงเวลา: 7 วันล่าสุด' : 'Timeframe: Last 7 Days'}</option>`);
content = content.replace(`<option value="30days">ช่วงเวลา: 30 วันล่าสุด</option>`, `<option value="30days">{language === 'th' ? 'ช่วงเวลา: 30 วันล่าสุด' : 'Timeframe: Last 30 Days'}</option>`);
content = content.replace(`<option value="custom">ระบุช่วงวันที่เอง...</option>`, `<option value="custom">{language === 'th' ? 'ระบุช่วงวันที่เอง...' : 'Custom Range...'}</option>`);

// 5. Replace table columns
content = content.replace(`<th className="px-6 py-4">ลูกค้า (Customer)</th>`, `<th className="px-6 py-4">{t('colCustomer')}</th>`);
content = content.replace(`<th className="px-6 py-4">ข้อสรุปปัญหา (AI Summary)</th>`, `<th className="px-6 py-4">{t('colAiSummary')}</th>`);
content = content.replace(`<th className="px-6 py-4">หมวดหมู่ (Category)</th>`, `<th className="px-6 py-4">{t('colCategory')}</th>`);
content = content.replace(`<th className="px-6 py-4">ความด่วน (Priority)</th>`, `<th className="px-6 py-4">{t('colPriority')}</th>`);
content = content.replace(`<th className="px-6 py-4">สถานะ (Status)</th>`, `<th className="px-6 py-4">{t('colStatus')}</th>`);
content = content.replace(`<th className="px-6 py-4">เวลา (Time)</th>`, `<th className="px-6 py-4">{t('colTime')}</th>`);

// 6. Replace loading states and fallbacks
content = content.replace(`กำลังดึงรายการแชตจากระบบ...`, `{t('loadingChats')}`);
content = content.replace(`ไม่พบข้อมูลแชตที่ตรงตามตัวเลือกฟิลเตอร์`, `{t('noChatsFound')}`);
content = content.replace(`ไม่มีข้อมูลสรุป`, `{language === 'th' ? 'ไม่มีข้อมูลสรุป' : 'No summary'}`);
content = content.replace(`chat.status === 'completed' ? 'แยกแยะแล้ว' : 'รอดำเนินการ'`, `chat.status === 'completed' ? (language === 'th' ? 'แยกแยะแล้ว' : 'Completed') : (language === 'th' ? 'รอดำเนินการ' : 'Pending')`);

// 7. Date picker helper inside filters
content = content.replace(`<span className="font-bold">จาก:</span>`, `<span className="font-bold">{language === 'th' ? 'จาก:' : 'From:'}</span>`);
content = content.replace(`<span className="font-bold">ถึง:</span>`, `<span className="font-bold">{language === 'th' ? 'ถึง:' : 'To:'}</span>`);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched chats/page.tsx!');
