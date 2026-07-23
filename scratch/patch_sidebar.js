const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'Sidebar.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add import
if (!content.includes("import { useLanguage }")) {
  content = content.replace(
    `import { usePathname } from 'next/navigation';`,
    `import { usePathname } from 'next/navigation';\nimport { useLanguage } from '@/components/LanguageContext';`
  );
}

// 2. Add useLanguage hook call inside Sidebar component
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

// 5. Replace footer block to insert language toggle
const footerTarget = `{/* Footer Info */}
      <div className="p-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-100 dark:border-slate-750 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
        >
          <span className="flex items-center gap-2">
            {theme === 'light' ? (
              <>
                <Sun size={14} className="text-amber-500" /> โหมดสว่าง (Light)
              </>
            ) : (
              <>
                <Moon size={14} className="text-indigo-400" /> โหมดมืด (Dark)
              </>
            )}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-505">สลับโหมด</span>
        </button>

        {/* Supabase status block */}
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 p-3 rounded-xl">
          <ShieldCheck size={16} className="text-emerald-500" />
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            เชื่อมต่อ: <span className="font-bold text-slate-700 dark:text-slate-200">Supabase</span>
          </div>
        </div>

        {/* User profile and logout */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-2 space-y-3">
          {userProfile && (
            <div className="flex items-center gap-3 px-1">
              <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-955/40 border border-indigo-200/50 dark:border-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-extrabold text-xs">
                {userProfile.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate leading-none mb-1">
                  {userProfile.name}
                </p>
                <p className="text-[10px] text-slate-450 dark:text-slate-505 truncate leading-none">
                  สิทธิ์: <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase">{userProfile.role?.replace('_', ' ') || ''}</span>
                </p>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-rose-50 dark:bg-rose-955/20 hover:bg-rose-100 dark:hover:bg-rose-900/20 border border-rose-100 dark:border-rose-900/20 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-450 transition-all cursor-pointer"
          >
            <LogOut size={14} /> ออกจากระบบ (Logout)
          </button>
        </div>
        
        <p className="text-[10px] text-slate-400 dark:text-slate-505 text-center">
          ระบบพัฒนาร่วมกับ อ้อ (Or)
        </p>
      </div>`;

const footerReplacement = `{/* Footer Info */}
      <div className="p-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
        {/* Language Toggle Button */}
        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-750 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-all select-none">
          <span className="flex items-center gap-2">
            🌐 {t('switchLanguage')}
          </span>
          <div className="flex bg-slate-200 dark:bg-slate-700 p-0.5 rounded-lg border border-slate-350 dark:border-slate-600">
            <button 
              onClick={() => setLanguage('th')}
              className={\`px-2 py-1 rounded-md text-[10px] font-extrabold cursor-pointer transition \${language === 'th' ? 'bg-indigo-650 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}\`}
            >TH</button>
            <button 
              onClick={() => setLanguage('en')}
              className={\`px-2 py-1 rounded-md text-[10px] font-extrabold cursor-pointer transition \${language === 'en' ? 'bg-indigo-650 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}\`}
            >EN</button>
          </div>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-100 dark:border-slate-750 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
        >
          <span className="flex items-center gap-2">
            {theme === 'light' ? (
              <>
                <Sun size={14} className="text-amber-500" /> {t('themeLight')}
              </>
            ) : (
              <>
                <Moon size={14} className="text-indigo-400" /> {t('themeDark')}
              </>
            )}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-505">{t('switchTheme')}</span>
        </button>

        {/* Supabase status block */}
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 p-3 rounded-xl">
          <ShieldCheck size={16} className="text-emerald-500" />
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {t('connectionLabel')} <span className="font-bold text-slate-700 dark:text-slate-200">Supabase</span>
          </div>
        </div>

        {/* User profile and logout */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-2 space-y-3">
          {userProfile && (
            <div className="flex items-center gap-3 px-1">
              <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-955/40 border border-indigo-200/50 dark:border-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-extrabold text-xs">
                {userProfile.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate leading-none mb-1">
                  {userProfile.name}
                </p>
                <p className="text-[10px] text-slate-450 dark:text-slate-500 truncate leading-none">
                  สิทธิ์: <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase">{userProfile.role?.replace('_', ' ') || ''}</span>
                </p>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-rose-50 dark:bg-rose-955/20 hover:bg-rose-100 dark:hover:bg-rose-900/20 border border-rose-100 dark:border-rose-900/20 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-455 transition-all cursor-pointer"
          >
            <LogOut size={14} /> {t('logout')}
          </button>
        </div>
        
        <p className="text-[10px] text-slate-400 dark:text-slate-505 text-center">
          {t('systemDeveloper')}
        </p>
      </div>`;

// We will do a generic search and replace for userProfile.role?.replace('_', ' ') || '' -> u.role...
// To ensure it matches:
content = content.replace(footerTarget, footerReplacement);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched Sidebar.tsx!');
