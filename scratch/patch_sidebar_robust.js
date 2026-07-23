const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'Sidebar.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add import if not present
if (!content.includes("import { useLanguage }")) {
  content = content.replace(
    `import { usePathname } from 'next/navigation';`,
    `import { usePathname } from 'next/navigation';\nimport { useLanguage } from '@/components/LanguageContext';`
  );
}

// 2. Add useLanguage hook call if not present
if (!content.includes("const { t, language, setLanguage }")) {
  content = content.replace(
    `const pathname = usePathname();`,
    `const pathname = usePathname();\n  const { t, language, setLanguage } = useLanguage();`
  );
}

// 3. Translate visibleMenuItems
content = content.replace(`label: 'ภาพรวมระบบ'`, `label: t('overview')`);
content = content.replace(`label: 'รายการแชตลูกค้า'`, `label: t('chats')`);
content = content.replace(`label: 'ข้อมูลลูกค้า'`, `label: t('customers')`);
content = content.replace(`label: 'จัดการหมวดหมู่'`, `label: t('categories')`);
content = content.replace(`label: 'จัดการบริษัท'`, `label: t('companies')`);
content = content.replace(`label: 'จัดการผู้ใช้งาน'`, `label: t('users')`);
content = content.replace(`label: 'บันทึกกิจกรรม'`, `label: t('auditLogs')`);

// 4. Translate tenant label
content = content.replace(`บริษัทผู้ใช้งาน (Tenant Context)`, `{t('tenantLabel')}`);

// 5. Replace theme toggle labels
content = content.replace(`โหมดสว่าง (Light)`, `{t('themeLight')}`);
content = content.replace(`โหมดมืด (Dark)`, `{t('themeDark')}`);
content = content.replace(`สลับโหมด`, `{t('switchTheme')}`);

// 6. Replace Supabase connected label
content = content.replace(
  `เชื่อมต่อ: <span className="font-bold text-slate-700 dark:text-slate-200">Supabase</span>`,
  `{t('connectionLabel')} <span className="font-bold text-slate-700 dark:text-slate-200">Supabase</span>`
);

// 7. Replace logout button label
content = content.replace(
  `<LogOut size={14} /> ออกจากระบบ (Logout)`,
  `<LogOut size={14} /> {t('logout')}`
);

// 8. Replace system developer label
content = content.replace(
  `ระบบพัฒนาร่วมกับ อ้อ (Or)`,
  `{t('systemDeveloper')}`
);

// 9. Inject Language Selection Block if not present
if (!content.includes("Language Selection Block")) {
  const target = `      {/* Footer Info */}
      <div className="p-6 border-t border-slate-100 dark:border-slate-800 space-y-4">`;
  
  const replacement = `      {/* Footer Info */}
      <div className="p-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
        {/* Language Selection Block */}
        <div className="bg-slate-50 dark:bg-slate-855 border border-slate-200 dark:border-slate-750 p-3 rounded-2xl flex items-center justify-between shadow-sm select-none">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌐</span>
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold text-slate-800 dark:text-slate-200 leading-none">Language</span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">{language === 'th' ? 'ภาษาไทย' : 'English'}</span>
            </div>
          </div>
          <div className="flex bg-slate-200 dark:bg-slate-700/80 p-0.5 rounded-xl border border-slate-300 dark:border-slate-600 shadow-inner">
            <button 
              onClick={() => setLanguage('th')}
              className={\`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition-all duration-200 \${language === 'th' ? 'bg-indigo-650 text-white shadow-md transform scale-105' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}\`}
            >TH</button>
            <button 
              onClick={() => setLanguage('en')}
              className={\`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition-all duration-200 \${language === 'en' ? 'bg-indigo-650 text-white shadow-md transform scale-105' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}\`}
            >EN</button>
          </div>
        </div>`;
        
  content = content.replace(target, replacement);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully applied robust patch to Sidebar.tsx!');
