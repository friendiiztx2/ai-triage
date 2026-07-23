const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'customers', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add imports
if (!content.includes("import { useLanguage }")) {
  content = content.replace(
    `import Link from 'next/link';`,
    `import Link from 'next/link';\nimport { useLanguage } from '@/components/LanguageContext';`
  );
}

// 2. Add hook call
if (!content.includes("const { language } = useLanguage();")) {
  content = content.replace(
    `export default function CustomersPage() {`,
    `export default function CustomersPage() {\n  const { language } = useLanguage();`
  );
}

// 3. Localize Page Title Section
content = content.replace(
  `<h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight font-display">ทะเบียนรายชื่อลูกค้า (Customers Registry)</h1>`,
  `<h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight font-display">{language === 'th' ? 'ทะเบียนรายชื่อลูกค้า (Customers Registry)' : 'Customers Registry'}</h1>`
);
content = content.replace(
  `<p className="text-slate-500 dark:text-slate-400 text-sm mt-1">ประวัติการติดต่อและเคสการแจ้งปัญหาของลูกค้าแต่ละรายในระบบ</p>`,
  `<p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{language === 'th' ? 'ประวัติการติดต่อและเคสการแจ้งปัญหาของลูกค้าแต่ละรายในระบบ' : 'Contact logs and case triage history for registered customers'}</p>`
);
content = content.replace(
  `<RefreshCw size={14} /> โหลดซ้ำรายชื่อ`,
  `<RefreshCw size={14} /> {language === 'th' ? 'โหลดซ้ำรายชื่อ' : 'Reload List'}`
);

// 4. Localize Search Bar
content = content.replace(
  `placeholder="ค้นหาลูกค้าด้วย ชื่อ, อีเมล หรือเบอร์โทร..."`,
  `placeholder={language === 'th' ? "ค้นหาลูกค้าด้วย ชื่อ, อีเมล หรือเบอร์โทร..." : "Search by name, email or phone..."}`
);

// 5. Localize Table Loading and Empty states
content = content.replace(
  `<span className="text-sm font-semibold">กำลังโหลดทะเบียนรายชื่อลูกค้า...</span>`,
  `<span className="text-sm font-semibold">{language === 'th' ? 'กำลังโหลดทะเบียนรายชื่อลูกค้า...' : 'Loading customers registry...'}</span>`
);
content = content.replace(
  `<span>ไม่พบข้อมูลทะเบียนลูกค้าในระบบ</span>`,
  `<span>{language === 'th' ? 'ไม่พบข้อมูลทะเบียนลูกค้าในระบบ' : 'No customer records found in the system'}</span>`
);

// 6. Localize Table Headers
content = content.replace(
  `<th className="px-6 py-4">ลูกค้า (Customer)</th>`,
  `<th className="px-6 py-4">{language === 'th' ? 'ลูกค้า (Customer)' : 'Customer'}</th>`
);
content = content.replace(
  `<th className="px-6 py-4">อีเมล (Email)</th>`,
  `<th className="px-6 py-4">{language === 'th' ? 'อีเมล (Email)' : 'Email'}</th>`
);
content = content.replace(
  `<th className="px-6 py-4">เบอร์โทร (Phone)</th>`,
  `<th className="px-6 py-4">{language === 'th' ? 'เบอร์โทร (Phone)' : 'Phone'}</th>`
);
content = content.replace(
  `<th className="px-6 py-4">ลงทะเบียนเมื่อ (Joined)</th>`,
  `<th className="px-6 py-4">{language === 'th' ? 'ลงทะเบียนเมื่อ (Joined)' : 'Joined'}</th>`
);

// 7. Localize History Card Title Section
content = content.replace(
  `<h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">ประวัติการเปิดตั๋ว / แจ้งเคส</h3>`,
  `<h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">{language === 'th' ? 'ประวัติการเปิดตั๋ว / แจ้งเคส' : 'Ticket & Case History'}</h3>`
);
content = content.replace(
  `<p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">เลือกชื่อลูกค้าเพื่อประเมินประวัติแชต</p>`,
  `<p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">{language === 'th' ? 'เลือกชื่อลูกค้าเพื่อประเมินประวัติแชต' : 'Select a customer to view history'}</p>`
);

// 8. Localize History Stats count
content = content.replace(
  `<h5 className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider mb-3">เคสทั้งหมด ({custChats.length})</h5>`,
  `<h5 className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider mb-3">{language === 'th' ? 'เคสทั้งหมด' : 'Total Cases'} ({custChats.length})</h5>`
);
content = content.replace(
  `<span>ไม่พบประวัติการเปิดแชตแจ้งเรื่อง</span>`,
  `<span>{language === 'th' ? 'ไม่พบประวัติการเปิดแชตแจ้งเรื่อง' : 'No chat history found'}</span>`
);

// 9. Localize Status and Empty selection fallback
content = content.replace(
  `<span className="flex items-center gap-1"><Clock size={10} /> {chat.status === 'completed' ? 'เสร็จสิ้น' : 'ค้างอยู่'}</span>`,
  `<span className="flex items-center gap-1"><Clock size={10} /> {chat.status === 'completed' ? (language === 'th' ? 'เสร็จสิ้น' : 'Completed') : (language === 'th' ? 'ค้างอยู่' : 'Pending')}</span>`
);
content = content.replace(
  `<span>ยังไม่มีการเลือกชื่อลูกค้าเพื่อประเมินประวัติ</span>`,
  `<span>{language === 'th' ? 'ยังไม่มีการเลือกชื่อลูกค้าเพื่อประเมินประวัติ' : 'No customer selected. Please select a customer.'}</span>`
);

// 10. Localize other/fallback category labels dynamically
content = content.replace(
  `{categories[chat.category_id] || chat.category_id || 'อื่นๆ'}`,
  `{categories[chat.category_id] || chat.category_id || (language === 'th' ? 'อื่นๆ' : 'Other')}`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully localized customers/page.tsx!');
