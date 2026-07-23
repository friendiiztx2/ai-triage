const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'audit-logs', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add import
if (!content.includes("import { useLanguage }")) {
  content = content.replace(
    `import { saveAuditLog } from '@/lib/audit';`,
    `import { saveAuditLog } from '@/lib/audit';\nimport { useLanguage } from '@/components/LanguageContext';`
  );
}

// 2. Add hook call inside AuditLogsPage
if (!content.includes("const { t, language } = useLanguage();")) {
  content = content.replace(
    `export default function AuditLogsPage() {`,
    `export default function AuditLogsPage() {\n  const { t, language } = useLanguage();`
  );
}

// 3. Replace titles & loading
content = content.replace(`กำลังตรวจสอบสิทธิ์การใช้งาน...`, `{t('auditLoading')}`);
content = content.replace(`โปรดล็อกอินเข้าใช้งานระบบเพื่อเข้าถึงข้อมูลนี้`, `{language === 'th' ? 'โปรดล็อกอินเข้าใช้งานระบบเพื่อเข้าถึงข้อมูลนี้' : 'Please log in to access this system information.'}`);
content = content.replace(`ไปยังหน้าล็อกอิน`, `{language === 'th' ? 'ไปยังหน้าล็อกอิน' : 'Go to Login Page'}`);
content = content.replace(`🔒 ขออภัย เฉพาะสิทธิ์แอดมินเท่านั้นที่จะสามารถดูหน้านี้ได้`, `{language === 'th' ? '🔒 ขออภัย เฉพาะสิทธิ์แอดมินเท่านั้นที่จะสามารถดูหน้านี้ได้' : '🔒 Sorry, only administrators are allowed to view this page.'}`);
content = content.replace(`กลับสู่แดชบอร์ดหลัก`, `{language === 'th' ? 'กลับสู่แดชบอร์ดหลัก' : 'Back to Dashboard'}`);

content = content.replace(`ประวัติบันทึกกิจกรรมแอดมิน (Admin Audit Logs)`, `{t('auditLogsTitle')}`);
content = content.replace(`บันทึกประวัติการกระทำ การลบ แก้ไข เพิ่ม และปรับเปลี่ยนโครงสร้างระดับผู้ดูแลระบบทั้งหมด`, `{t('auditLogsSub')}`);
content = content.replace(`อัปเดตประวัติ`, `{language === 'th' ? 'อัปเดตประวัติ' : 'Update Logs'}`);

// 4. Replace filters
content = content.replace(`placeholder="ค้นหาชื่อผู้ดำเนินการ หรือรายละเอียด..."`, `placeholder={t('auditSearchPlaceholder')}`);
content = content.replace(`<option value="all">กิจกรรมทั้งหมด</option>`, `<option value="all">{t('auditFilterAll')}</option>`);

content = content.replace(`<option value="CREATE">สร้าง (CREATE)</option>`, `<option value="CREATE">{language === 'th' ? 'สร้าง (CREATE)' : 'Create (CREATE)'}</option>`);
content = content.replace(`<option value="UPDATE">แก้ไข (UPDATE)</option>`, `<option value="UPDATE">{language === 'th' ? 'แก้ไข (UPDATE)' : 'Update (UPDATE)'}</option>`);
content = content.replace(`<option value="DELETE">ลบ (DELETE)</option>`, `<option value="DELETE">{language === 'th' ? 'ลบ (DELETE)' : 'Delete (DELETE)'}</option>`);
content = content.replace(`<option value="LOGIN">เข้าสู่ระบบ (LOGIN)</option>`, `<option value="LOGIN">{language === 'th' ? 'เข้าสู่ระบบ (LOGIN)' : 'Login (LOGIN)'}</option>`);

content = content.replace(`<option value="7days">ช่วงเวลา: 7 วันล่าสุด (เริ่มต้น)</option>`, `<option value="7days">{language === 'th' ? 'ช่วงเวลา: 7 วันล่าสุด (เริ่มต้น)' : 'Timeframe: Last 7 Days (Default)'}</option>`);
content = content.replace(`<option value="today">ช่วงเวลา: วันนี้</option>`, `<option value="today">{language === 'th' ? 'ช่วงเวลา: วันนี้' : 'Timeframe: Today'}</option>`);
content = content.replace(`<option value="30days">ช่วงเวลา: 30 วันล่าสุด</option>`, `<option value="30days">{language === 'th' ? 'ช่วงเวลา: 30 วันล่าสุด' : 'Timeframe: Last 30 Days'}</option>`);
content = content.replace(`<option value="all">ช่วงเวลา: ทั้งหมด</option>`, `<option value="all">{language === 'th' ? 'ช่วงเวลา: ทั้งหมด' : 'Timeframe: All'}</option>`);
content = content.replace(`<option value="custom">ระบุช่วงวันที่เอง...</option>`, `<option value="custom">{language === 'th' ? 'ระบุช่วงวันที่เอง...' : 'Custom Range...'}</option>`);

// 5. Replace summary label
content = content.replace(
  `พบประวัติทั้งหมด {filteredLogs.length} รายการ`,
  `{language === 'th' ? \`พบประวัติทั้งหมด \${filteredLogs.length} รายการ\` : \`Found \${filteredLogs.length} total logs\`}`
);

// 6. Custom date pickers drawer
content = content.replace(`<span>ระบุช่วงวันที่:</span>`, `<span>{language === 'th' ? 'ระบุช่วงวันที่:' : 'Select Range:'}</span>`);
content = content.replace(`<span className="text-[10px] font-bold text-slate-400 uppercase">จาก:</span>`, `<span className="text-[10px] font-bold text-slate-400 uppercase">{language === 'th' ? 'จาก:' : 'From:'}</span>`);
content = content.replace(`<span className="text-[10px] font-bold text-slate-400 uppercase">ถึง:</span>`, `<span className="text-[10px] font-bold text-slate-400 uppercase">{language === 'th' ? 'ถึง:' : 'To:'}</span>`);

// 7. Table headers & messages
content = content.replace(`กำลังดึงข้อมูลบันทึกกิจกรรม...`, `{language === 'th' ? 'กำลังดึงข้อมูลบันทึกกิจกรรม...' : 'Retrieving audit logs...'}`);
content = content.replace(`ไม่พบรายการบันทึกกิจกรรมตามเงื่อนไขการค้นหา`, `{t('auditNoData')}`);
content = content.replace(`<th className="px-6 py-4">ผู้ดำเนินการ (Admin)</th>`, `<th className="px-6 py-4">{language === 'th' ? 'ผู้ดำเนินการ (Admin)' : 'Actor (Admin)'}</th>`);
content = content.replace(`<th className="px-6 py-4">ประเภทกิจกรรม</th>`, `<th className="px-6 py-4">{language === 'th' ? 'ประเภทกิจกรรม' : 'Action Type'}</th>`);
content = content.replace(`<th className="px-6 py-4">ประวัติการดำเนินการ</th>`, `<th className="px-6 py-4">{language === 'th' ? 'ประวัติการดำเนินการ' : 'Activity Detail'}</th>`);
content = content.replace(`<th className="px-6 py-4">เวลาดำเนินการ</th>`, `<th className="px-6 py-4">{language === 'th' ? 'เวลาดำเนินการ' : 'Timestamp'}</th>`);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched audit-logs/page.tsx!');
