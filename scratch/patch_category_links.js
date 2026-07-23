const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'categories', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add imports
if (!content.includes("import Link from 'next/link';")) {
  content = content.replace(
    `import { saveAuditLog } from '@/lib/audit';`,
    `import { saveAuditLog } from '@/lib/audit';\nimport Link from 'next/link';\nimport { useLanguage } from '@/components/LanguageContext';`
  );
}

// 2. Add hook call inside CategoriesPage
if (!content.includes("const { t, language } = useLanguage();")) {
  content = content.replace(
    `export default function CategoriesPage() {`,
    `export default function CategoriesPage() {\n  const { t, language } = useLanguage();`
  );
}

// 3. Translate page headers
content = content.replace(
  `จัดการหมวดหมู่ปัญหา (Category Manager)`,
  `{language === 'th' ? 'จัดการหมวดหมู่ปัญหา (Category Manager)' : 'Manage Categories'}`
);
content = content.replace(
  `ตั้งค่าและดูรายการหมวดหมู่ปัญหาหลักที่ใช้ประเมินผลด้วย AI`,
  `{language === 'th' ? 'ตั้งค่าและดูรายการหมวดหมู่ปัญหาหลักที่ใช้ประเมินผลด้วย AI' : 'Configure main category mappings evaluated by AI'}`
);
content = content.replace(
  `<Plus size={16} /> เพิ่มหมวดหมู่ใหม่`,
  `<Plus size={16} /> {language === 'th' ? 'เพิ่มหมวดหมู่ใหม่' : 'Add Category'}`
);
content = content.replace(
  `<RefreshCw size={14} /> อัปเดตข้อมูลหมวดหมู่`,
  `<RefreshCw size={14} /> {language === 'th' ? 'อัปเดตข้อมูลหมวดหมู่' : 'Reload Categories'}`
);
content = content.replace(
  `กำลังตรวจสอบรายการหมวดหมู่...`,
  `{language === 'th' ? 'กำลังตรวจสอบรายการหมวดหมู่...' : 'Checking categories list...'}`
);

// 4. Replace regular category stat footer with clickable Link
const targetFooter = `                  {/* Stat Footer */}
                  <div className="bg-slate-50 dark:bg-slate-855/50 border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1.5"><MessageSquare size={14} /> เคสสะสมทั้งหมด</span>
                    <span className="text-slate-800 dark:text-slate-200 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/30 px-2.5 py-0.5 rounded-lg font-bold">
                      {ticketCount} เคส
                    </span>
                  </div>`;

// Check what it is actually written in the file (let's check spacing or search for it)
// In our print earlier:
// 303:                   {/* Stat Footer */}
// 304:                   <div className="bg-slate-50 dark:bg-slate-850/50 border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex justify-between items-center text-xs font-semibold">
// 305:                     <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1.5"><MessageSquare size={14} /> เคสสะสมทั้งหมด</span>
// 306:                     <span className="text-slate-800 dark:text-slate-200 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/30 px-2.5 py-0.5 rounded-lg font-bold">
// 307:                       {ticketCount} เคส
// 308:                     </span>
// 309:                   </div>

const targetFooterExact = `                  {/* Stat Footer */}
                  <div className="bg-slate-50 dark:bg-slate-850/50 border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1.5"><MessageSquare size={14} /> เคสสะสมทั้งหมด</span>
                    <span className="text-slate-800 dark:text-slate-200 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/30 px-2.5 py-0.5 rounded-lg font-bold">
                      {ticketCount} เคส
                    </span>
                  </div>`;

const replacementFooterExact = `                  {/* Stat Footer (Clickable to view chats list) */}
                  <Link 
                    href={\`/chats?category=\${cat.id}\`}
                    className="bg-slate-50 dark:bg-slate-850/50 hover:bg-slate-100 dark:hover:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-250 transition-all cursor-pointer group/footer select-none"
                  >
                    <span className="text-slate-400 dark:text-slate-500 group-hover/footer:text-indigo-600 dark:group-hover/footer:text-indigo-400 flex items-center gap-1.5 transition-colors">
                      <MessageSquare size={14} /> {language === 'th' ? 'เคสสะสมทั้งหมด' : 'Total Accumulated'}
                    </span>
                    <span className="text-indigo-650 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-955/30 border border-indigo-100 dark:border-indigo-900/30 px-2.5 py-0.5 rounded-lg font-extrabold group-hover/footer:scale-105 transition-transform flex items-center gap-1">
                      {ticketCount} {language === 'th' ? 'เคส' : 'Cases'} ➡️
                    </span>
                  </Link>`;

content = content.replace(targetFooterExact, replacementFooterExact);

// 5. Replace fallback "other" card stat footer with clickable Link
const otherFooterExact = `              {/* Stat Footer */}
              <div className="bg-slate-50 dark:bg-slate-850/50 border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1.5"><MessageSquare size={14} /> เคสสะสมทั้งหมด</span>
                <span className="text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 px-2.5 py-0.5 rounded-lg font-bold">
                  {categoryStats['other'] || categoryStats['Other'] || 0} เคส
                </span>
              </div>`;

const otherReplacementFooterExact = `              {/* Stat Footer (Clickable to view unclassified chats) */}
              <Link 
                href="/chats?category=other"
                className="bg-slate-50 dark:bg-slate-850/50 hover:bg-slate-100 dark:hover:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-250 transition-all cursor-pointer group/footer select-none"
              >
                <span className="text-slate-400 dark:text-slate-500 group-hover/footer:text-indigo-600 dark:group-hover/footer:text-indigo-400 flex items-center gap-1.5 transition-colors">
                  <MessageSquare size={14} /> {language === 'th' ? 'เคสสะสมทั้งหมด' : 'Total Accumulated'}
                </span>
                <span className="text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 px-2.5 py-0.5 rounded-lg font-extrabold group-hover/footer:scale-105 transition-transform flex items-center gap-1">
                  {categoryStats['other'] || categoryStats['Other'] || 0} {language === 'th' ? 'เคส' : 'Cases'} ➡️
                </span>
              </Link>`;

content = content.replace(otherFooterExact, otherReplacementFooterExact);

// 6. Translate Other Card Text
content = content.replace(
  `อื่นๆ (Other / Unclassified)`,
  `{language === 'th' ? 'อื่นๆ (Other / Unclassified)' : 'Other / Unclassified'}`
);
content = content.replace(
  `กลุ่มสำหรับแชตที่ AI ไม่สามารถจำแนกลงในหมวดหมู่หลักทั้ง 4 ด้านข้างต้นได้ พนักงานจะเป็นผู้เข้ามาพิจารณาสร้างหมวดหมู่ใหม่เป็นกรณีพิเศษ`,
  `{language === 'th' ? 'กลุ่มสำหรับแชตที่ AI ไม่สามารถจำแนกลงในหมวดหมู่หลักทั้ง 4 ด้านข้างต้นได้ พนักงานจะเป็นผู้เข้ามาพิจารณาสร้างหมวดหมู่ใหม่เป็นกรณีพิเศษ' : 'Chats that AI cannot categorize into the main mapped categories. Admins will manually triage or setup a new category.'}`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched categories/page.tsx with clickable chat list links!');
