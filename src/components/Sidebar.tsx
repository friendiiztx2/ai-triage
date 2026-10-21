'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/components/LanguageContext';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Settings, 
  Database,
  ShieldCheck,
  History,
  FileSpreadsheet,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import SidebarWorkspaceSwitcher from '@/components/sidebar/SidebarWorkspaceSwitcher';
import SidebarNavMenu from '@/components/sidebar/SidebarNavMenu';
import SidebarFooter from '@/components/sidebar/SidebarFooter';

export default function Sidebar() {
  const pathname = usePathname();
  const { t, language, setLanguage } = useLanguage();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [activeCompany, setActiveCompany] = useState('');
  const defaultSession = {
    id: 'admin-01',
    name: 'System Admin',
    role: 'system_admin',
    company_id: '',
    permissions: ['view_dashboard', 'view_chats', 'manage_categories', 'manage_users', 'manage_companies', 'export_csv']
  };

  const [userProfile, setUserProfile] = useState<any>(defaultSession);
  const [companies, setCompanies] = useState<any[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Initialize theme, active company, and session on client mount
  useEffect(() => {
    if (pathname === '/login' || pathname.startsWith('/login/')) {
      return;
    }

    const savedTheme = (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    
    setTheme(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');

    const savedCollapsed = localStorage.getItem('sidebar_collapsed') === 'true';
    setIsCollapsed(savedCollapsed);

    const isLoggedOut = sessionStorage.getItem('session_logout') === 'true';
    let savedSession = localStorage.getItem('user_session');
    if (!savedSession) {
      const matchCookie = document.cookie.match(/(?:^|; )user_session=([^;]*)/);
      if (matchCookie) {
        savedSession = decodeURIComponent(matchCookie[1]);
        localStorage.setItem('user_session', savedSession);
      }
    }

    if (!savedSession || isLoggedOut) {
      window.location.href = '/login';
      return;
    }

    try {
      const parsed = JSON.parse(savedSession);
      setUserProfile(parsed);

      // Fetch companies
      fetch('/api/companies')
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setCompanies(data);
            if (parsed.role === 'system_admin') {
              setActiveCompany((prev) => {
                if (!prev) {
                  const firstId = data[0].id;
                  document.cookie = `company_id=${firstId}; path=/; max-age=31536000`;
                  localStorage.setItem('company_id', firstId);
                  return firstId;
                }
                return prev;
              });
            }
          }
        })
        .catch((err) => console.error('Error loading companies:', err));

      const isSystemAdmin = parsed.role === 'system_admin';
      const matchCookie = document.cookie.match(/(?:^|; )company_id=([^;]*)/);
      const currentActive = matchCookie ? decodeURIComponent(matchCookie[1]) : localStorage.getItem('company_id');

      if (isSystemAdmin) {
        if (currentActive) {
          setActiveCompany(currentActive);
        }
      } else {
        const allowedIds = (parsed.company_id || '').split(',').map((id: string) => id.trim()).filter(Boolean);
        if (currentActive && allowedIds.includes(currentActive)) {
          setActiveCompany(currentActive);
        } else if (allowedIds.length > 0) {
          const firstAllowed = allowedIds[0];
          document.cookie = `company_id=${firstAllowed}; path=/; max-age=31536000`;
          localStorage.setItem('company_id', firstAllowed);
          setActiveCompany(firstAllowed);
        }
      }
    } catch (e) {
      window.location.href = '/login';
    }
  }, [pathname]);

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    setActiveCompany(selected);
    document.cookie = `company_id=${selected}; path=/; max-age=31536000`;
    localStorage.setItem('company_id', selected);
    window.location.reload();
  };

  const handleLogout = async () => {
    sessionStorage.setItem('session_logout', 'true');
    try {
      await fetch('/api/users/logout', { method: 'POST' });
    } catch (e) {}
    document.cookie = 'user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; max-age=0;';
    document.cookie = 'company_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; max-age=0;';
    localStorage.removeItem('user_session');
    localStorage.removeItem('company_id');
    setUserProfile(null);
    window.location.href = '/login';
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'th' ? 'en' : 'th');
  };

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
    visibleMenuItems.push({
      href: '/ai-reports',
      label: language === 'th' ? 'ปัญหาจากผู้ใช้งาน' : 'User Issues',
      icon: AlertTriangle,
    });
  }
  if (allowedPermissions.includes('export_csv')) {
    visibleMenuItems.push({ href: '/reports', label: language === 'th' ? 'รายงานและส่งออก' : 'Reports & Export', icon: FileSpreadsheet });
  }

  return (
    <aside className={`bg-white/80 dark:bg-neutral-900/70 backdrop-blur-md border-r border-neutral-200/80 dark:border-neutral-800/80 h-screen flex flex-col justify-between transition-all duration-200 relative z-30 select-none shadow-xs ${isCollapsed ? 'w-16' : 'w-60'}`}>
      {/* Collapse/Expand Toggle Button */}
      <button 
        onClick={toggleCollapse}
        className="absolute -right-3 top-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-400 hover:text-neutral-800 dark:text-neutral-300 dark:hover:text-white p-1 rounded-full shadow-xs transition-all z-50 cursor-pointer"
        title={isCollapsed ? 'ขยายเมนู' : 'พับเมนู'}
      >
        {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      <div className={`flex-1 overflow-y-auto ${isCollapsed ? 'p-2' : 'p-3'}`}>
        {/* Unified Workspace Switcher (Logo + Company context) */}
        <SidebarWorkspaceSwitcher
          companies={companies}
          activeCompany={activeCompany}
          onCompanyChange={handleCompanyChange}
          userProfile={userProfile}
          isCollapsed={isCollapsed}
        />

        {/* Navigation Menu */}
        <SidebarNavMenu
          items={visibleMenuItems}
          pathname={pathname}
          isCollapsed={isCollapsed}
        />
      </div>

      {/* Footer User Info & Micro Actions */}
      <SidebarFooter
        isCollapsed={isCollapsed}
        theme={theme}
        onToggleTheme={toggleTheme}
        userProfile={userProfile}
        language={language}
        onToggleLanguage={toggleLanguage}
        onLogout={handleLogout}
        t={t}
      />
    </aside>
  );
}
