'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, RefreshCw, ShieldAlert } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import AddCompanyModal from '@/components/companies/AddCompanyModal';
import CompanyTable from '@/components/companies/CompanyTable';

export default function CompaniesPage() {
  const { language } = useLanguage();
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const savedSession = localStorage.getItem('user_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setUserProfile(parsed);
        if (parsed.role === 'system_admin') {
          fetchCompanies();
        } else {
          setLoading(false);
        }
      } catch (e) {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/companies');
      if (res.ok) {
        const data = await res.json();
        setCompanies(data);
      }
    } catch (err) {
      console.error('Error fetching companies:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = useMemo(() => {
    if (searchQuery.trim() === '') return companies;
    const q = searchQuery.toLowerCase();
    return companies.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.domain?.toLowerCase().includes(q) ||
        c.client_id?.toLowerCase().includes(q)
    );
  }, [searchQuery, companies]);

  // Access Control Guard: Only System Admin
  if (userProfile && userProfile.role !== 'system_admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-3 font-mono text-xs">
        <div className="p-3 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          <ShieldAlert size={28} />
        </div>
        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
          {language === 'th' ? 'การเข้าถึงถูกจำกัด' : 'Restricted Access'}
        </h2>
        <p className="text-neutral-400 max-w-sm font-sans text-xs">
          {language === 'th'
            ? 'หน้านี้สงวนสิทธิ์เฉพาะผู้ดูแลระบบโครงสร้างส่วนกลาง (System Administrator) เท่านั้น'
            : 'This page is restricted to global System Administrators only.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight font-display">
            {language === 'th' ? 'จัดการบริษัทผู้เช่า' : 'Manage Companies'}
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-xs sm:text-sm mt-0.5 font-normal">
            {language === 'th'
              ? 'สร้างและส่งมอบบริษัทใหม่ทีละขั้นตอน (แพ็กเกจโควต้า • บัญชีแอดมินลูกค้า • กลุ่ม Telegram • ใบส่งมอบระบบ)'
              : 'Multi-step Company Onboarding Wizard: Package Quota, Initial Admin, Telegram Group, and Customer Handover Kit.'}
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus size={15} />
          <span>{language === 'th' ? 'สร้างและส่งมอบบริษัทใหม่ (Wizard 4 ขั้นตอน)' : 'Onboard New Company (4-Step Wizard)'}</span>
        </button>
      </div>

      {/* Search and Table Box */}
      <div className="rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md shadow-xs overflow-hidden p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={13} />
            <input
              type="text"
              placeholder={language === 'th' ? 'ค้นหาชื่อบริษัท, โดเมน หรือ Client ID...' : 'Search company name, domain, or Client ID...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors shadow-xs"
            />
          </div>

          <button
            onClick={fetchCompanies}
            title={language === 'th' ? 'รีเฟรชข้อมูล' : 'Refresh data'}
            className="p-1.5 border border-neutral-200/80 dark:border-neutral-800/80 rounded-lg bg-white/70 dark:bg-neutral-900/70 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer self-end sm:self-auto shadow-xs"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Company Table Component */}
        <CompanyTable
          companies={filteredCompanies}
          loading={loading}
          onRefresh={fetchCompanies}
          language={language}
        />
      </div>

      {/* Add Company Modal Component */}
      <AddCompanyModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchCompanies}
        language={language}
      />
    </div>
  );
}
