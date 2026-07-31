'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/components/LanguageContext';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  Settings, 
  Database,
  ShieldCheck,
  BrainCircuit,
  Sparkles,
  Sun,
  Moon,
  LogOut,
  History,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { t, language } = useLanguage();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [activeCompany, setActiveCompany] = useState('2c3f46cc-fae8-4ef8-99e1-874dec8b2af2');
  const defaultSession = {
    id: 'admin-01',
    name: 'System Admin',
    role: 'system_admin',
    company_id: '2c3f46cc-fae8-4ef8-99e1-874dec8b2af2',
    permissions: ['view_dashboard', 'view_chats', 'manage_categories', 'manage_users', 'manage_companies', 'export_csv']
  };

  const [userProfile, setUserProfile] = useState<any>(defaultSession);
  const [companies, setCompanies] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Initialize theme, active company, and session on client mount
  useEffect(() => {
    setMounted(true);

    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    
    setTheme(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');

    const savedCollapsed = localStorage.getItem('sidebar_collapsed') === 'true';
    setIsCollapsed(savedCollapsed);

    const match = document.cookie.match(/(?:^|; )company_id=([^;]*)/);
    const savedCompany = match ? decodeURIComponent(match[1]) : localStorage.getItem('company_id');
    if (savedCompany) {
      setActiveCompany(savedCompany);
    } else {
      const defaultCompany = '2c3f46cc-fae8-4ef8-99e1-874dec8b2af2';
      document.cookie = `company_id=${defaultCompany}; path=/; max-age=31536000`;
      localStorage.setItem('company_id', defaultCompany);
      setActiveCompany(defaultCompany);
    }

    let savedSession = localStorage.getItem('user_session');
    if (!savedSession) {
      const matchCookie = document.cookie.match(/(?:^|; )user_session=([^;]*)/);
      if (matchCookie) {
        savedSession = decodeURIComponent(matchCookie[1]);
        localStorage.setItem('user_session', savedSession);
      }
    }

    if (!savedSession) {
      const sessionStr = JSON.stringify(defaultSession);
      localStorage.setItem('user_session', sessionStr);
      document.cookie = `user_session=${encodeURIComponent(sessionStr)}; path=/; max-age=31536000`;
      setUserProfile(defaultSession);
    } else {
      try {
        const parsed = JSON.parse(savedSession);
        setUserProfile(parsed);

        // Fetch all companies if system_admin
        if (parsed.role === 'system_admin') {
          fetch('/api/companies')
            .then(r => r.json())
            .then(data => {
              if (Array.isArray(data)) setCompanies(data);
            })
            .catch(err => console.error("Error loading companies:", err));
        }

        // Security check for allowed companies for this specific user
        const isSuper = parsed.role === 'super_admin' || parsed.role === 'system_admin';
        const allowedIds = isSuper ? 
          ['2c3f46cc-fae8-4ef8-99e1-874dec8b2af2', '2e65829a-6a60-4022-8289-0fe64ec98fae'] : 
          (parsed.company_id || '').split(',').filter(Boolean);

        // Check current active company cookie
        const matchCookie = document.cookie.match(/(?:^|; )company_id=([^;]*)/);
        const currentActive = matchCookie ? decodeURIComponent(matchCookie[1]) : localStorage.getItem('company_id');

        if (currentActive && allowedIds.includes(currentActive)) {
          setActiveCompany(currentActive);
        } else {
          // Reset to first allowed company automatically
          const firstAllowed = allowedIds[0] || '2c3f46cc-fae8-4ef8-99e1-874dec8b2af2';
          document.cookie = `company_id=${firstAllowed}; path=/; max-age=31536000`;
          localStorage.setItem('company_id', firstAllowed);
          setActiveCompany(firstAllowed);
        }
      } catch (e) {
        setUserProfile(defaultSession);
      }
    }
  }, []);

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    setActiveCompany(selected);
    document.cookie = `company_id=${selected}; path=/; max-age=31536000`;
    localStorage.setItem('company_id', selected);
    window.location.reload();
  };

  const handleLogout = () => {
    document.cookie = 'user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
    document.cookie = 'company_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
    localStorage.removeItem('user_session');
    localStorage.removeItem('company_id');
    window.location.href = '/login';
  };

  // Toggle theme handler
  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
  };

  // Toggle collapse handler
  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem('sidebar_collapsed', String(nextState));
  };

  // Hide sidebar on login pages
  if (pathname === '/login' || pathname.startsWith('/login/')) {
    return null;
  }

  // Dynamically build menu items based on user profile permissions
  const allowedPermissions = userProfile?.permissions || (
    userProfile?.role === 'system_admin'
      ? ['view_dashboard', 'view_chats', 'manage_categories', 'manage_users', 'manage_companies', 'export_csv']
      : userProfile?.role === 'super_admin'
        ? ['view_dashboard', 'view_chats', 'manage_categories', 'manage_users', 'export_csv']
        : userProfile?.role === 'admin'
          ? ['view_dashboard', 'view_chats', 'manage_categories', 'export_csv']
          : ['view_dashboard', 'view_chats']
  );

  const visibleMenuItems: any[] = [];
  
  if (allowedPermissions.includes('view_dashboard')) {
    visibleMenuItems.push({ href: '/', label: t('overview'), icon: LayoutDashboard });
  }
  if (allowedPermissions.includes('view_chats')) {
    visibleMenuItems.push({ href: '/chats', label: t('chats'), icon: MessageSquare });
    visibleMenuItems.push({ href: '/customers', label: t('customers'), icon: Users });
  }
  if (allowedPermissions.includes('manage_categories')) {
    visibleMenuItems.push({ href: '/categories', label: t('categories'), icon: Settings });
  }
  if (allowedPermissions.includes('manage_companies') && userProfile?.role === 'system_admin') {
    visibleMenuItems.push({ href: '/companies', label: t('companies'), icon: Database });
  }
  if (allowedPermissions.includes('manage_users') && (userProfile?.role === 'system_admin' || userProfile?.role === 'super_admin')) {
    visibleMenuItems.push({ href: '/users', label: t('users'), icon: ShieldCheck });
  }
  if (userProfile?.role === 'system_admin' || userProfile?.role === 'super_admin') {
    visibleMenuItems.push({ href: '/audit-logs', label: t('auditLogs'), icon: History });
  }
  if (allowedPermissions.includes('export_csv')) {
    visibleMenuItems.push({ href: '/reports', label: language === 'th' ? 'รายงานและส่งออก' : 'Reports & Export', icon: FileSpreadsheet });
  }

  return (
    <aside className={`bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-screen flex flex-col justify-between shadow-sm transition-all duration-250 relative ${isCollapsed ? 'w-20' : 'w-64'}`}>
      
      {/* Collapse/Expand Toggle Button */}
      <button 
        onClick={toggleCollapse}
        className="absolute -right-3.5 top-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 p-1 rounded-full shadow-md hover:bg-slate-50 dark:hover:bg-slate-800 transition z-50 cursor-pointer"
        title={isCollapsed ? 'ขยายเมนู' : 'พับเมนู'}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className={isCollapsed ? 'p-3' : 'p-6'}>
        {/* Luxury Logo Badge */}
        <div className={`flex items-center mb-8 ${isCollapsed ? 'justify-center gap-0' : 'gap-3.5'}`}>
          <div className="relative group cursor-pointer">
            <div className="relative overflow-hidden bg-gradient-to-br from-purple-700 via-indigo-600 to-purple-900 text-white p-3 rounded-2xl shadow-xl shadow-purple-600/40 ring-4 ring-purple-500/25 border border-purple-300/30 transition-all duration-300 group-hover:scale-105 group-hover:shadow-purple-600/60 shrink-0 flex items-center justify-center">
              {/* Subtle glass shimmer layer */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/25 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <BrainCircuit size={24} className="text-white drop-shadow-md relative z-10" />
              <Sparkles size={13} className="text-amber-300 absolute top-1 right-1 animate-pulse z-10" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 z-20">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 shadow-sm"></span>
            </span>
          </div>

          {!isCollapsed && (
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 dark:from-white dark:via-indigo-100 dark:to-slate-200 text-lg leading-none tracking-tight font-display">
                  AI Triage
                </h1>
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/20 uppercase tracking-widest border border-amber-300/40">
                  ENTERPRISE
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[9.5px] font-extrabold text-indigo-600 dark:text-indigo-400 tracking-widest uppercase flex items-center gap-1">
                  COMMAND CENTER
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Tenant Switching Context Selector */}
        {!isCollapsed && (
          <div className="mb-6 px-1">
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
              {t('tenantLabel')}
            </label>
            {(() => {
              const isSuper = userProfile?.role === 'super_admin' || userProfile?.role === 'system_admin';
              const allowedIds = isSuper ? 
                ['2c3f46cc-fae8-4ef8-99e1-874dec8b2af2', '2e65829a-6a60-4022-8289-0fe64ec98fae'] : 
                (userProfile?.company_id || '').split(',').filter(Boolean);

              const showDropdown = isSuper || allowedIds.length > 1;

              if (showDropdown) {
                // If system_admin and companies list loaded, render dynamically
                if (userProfile?.role === 'system_admin' && companies.length > 0) {
                  return (
                    <select
                      value={activeCompany}
                      onChange={handleCompanyChange}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition cursor-pointer"
                    >
                      {companies.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  );
                }

                // Otherwise render static allowed companies list
                return (
                  <select
                    value={activeCompany}
                    onChange={handleCompanyChange}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition cursor-pointer"
                  >
                    {allowedIds.includes('2c3f46cc-fae8-4ef8-99e1-874dec8b2af2') && (
                      <option value="2c3f46cc-fae8-4ef8-99e1-874dec8b2af2">{language === 'th' ? 'Mika Co. (บริษัทเริ่มต้น)' : 'Mika Co. (Default)'}</option>
                    )}
                    {allowedIds.includes('2e65829a-6a60-4022-8289-0fe64ec98fae') && (
                      <option value="2e65829a-6a60-4022-8289-0fe64ec98fae">Alpha Support Co., Ltd.</option>
                    )}
                  </select>
                );
              } else {
                return (
                  <div className="bg-slate-50 dark:bg-slate-855/50 border border-slate-100 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 select-none">
                    {activeCompany === '2e65829a-6a60-4022-8289-0fe64ec98fae' ? 'Alpha Support Co., Ltd.' : (language === 'th' ? 'Mika Co. (บริษัทเริ่มต้น)' : 'Mika Co. (Default)')}
                  </div>
                );
              }
            })()}
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="space-y-1">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center rounded-xl text-sm font-semibold transition-all duration-250 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none'
                    : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-855'
                } ${isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-4 py-3'}`}
                title={isCollapsed ? item.label : ''}
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400 dark:text-slate-550'} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className={`${isCollapsed ? 'p-3' : 'p-6'} border-t border-slate-100 dark:border-slate-800 space-y-4`}>
        
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className={`flex items-center justify-between bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-100 dark:border-slate-750 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer ${isCollapsed ? 'w-full justify-center p-2.5' : 'w-full px-4 py-2.5'}`}
          title={isCollapsed ? (theme === 'light' ? t('themeLight') : t('themeDark')) : ''}
        >
          <span className={`flex items-center ${isCollapsed ? '' : 'gap-2'}`}>
            {theme === 'light' ? (
              <Sun size={14} className="text-amber-500 shrink-0" />
            ) : (
              <Moon size={14} className="text-indigo-400 shrink-0" />
            )}
            {!isCollapsed && t('themeLight')}
          </span>
          {!isCollapsed && <span className="text-[10px] text-slate-400 dark:text-slate-550">{t('switchTheme')}</span>}
        </button>

        {/* Supabase status block */}
        {!isCollapsed && (
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 p-3 rounded-xl">
            <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
              {t('connectionLabel')} <span className="font-bold text-slate-700 dark:text-slate-200">Supabase</span>
            </div>
          </div>
        )}

        {/* User profile and logout */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-2 space-y-3">
          {userProfile && (
            <div className={`flex items-center px-1 ${isCollapsed ? 'justify-center gap-0 px-0' : 'gap-3'}`}>
              <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-955/40 border border-indigo-200/50 dark:border-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-extrabold text-xs shrink-0">
                {userProfile.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate leading-none mb-1">
                    {userProfile.name}
                  </p>
                  <p className="text-[10px] text-slate-450 dark:text-slate-555 truncate leading-none">
                    {language === 'th' ? 'สิทธิ์:' : 'Role:'} <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase">{userProfile.role?.replace('_', ' ') || ''}</span>
                  </p>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleLogout}
            className={`flex items-center justify-center bg-rose-50 dark:bg-rose-955/20 hover:bg-rose-100 dark:hover:bg-rose-900/20 border border-rose-100 dark:border-rose-900/20 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-455 transition-all cursor-pointer ${isCollapsed ? 'w-full p-2.5' : 'gap-2 w-full px-4 py-2.5'}`}
            title={isCollapsed ? t('logout') : ''}
          >
            <LogOut size={14} className="shrink-0" />
            {!isCollapsed && t('logout')}
          </button>
        </div>
        
        {!isCollapsed && (
          <p className="text-[10px] text-slate-400 dark:text-slate-505 text-center">
            {t('systemDeveloper')}
          </p>
        )}
      </div>
    </aside>
  );
}
