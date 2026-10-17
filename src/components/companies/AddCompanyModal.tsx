import React, { useState } from 'react';
import { X, Building, Globe, Layers } from 'lucide-react';
import CompanyRegistrationSuccessView from './CompanyRegistrationSuccessView';

export interface AddCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  language?: 'th' | 'en';
}

export default function AddCompanyModal({ isOpen, onClose, onSuccess, language = 'th' }: AddCompanyModalProps) {
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [isDomainCustomized, setIsDomainCustomized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleRegisterCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalDomain =
      domain.trim() || `${name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'company'}.com`;

    if (!name.trim()) {
      setError(language === 'th' ? 'กรุณากรอกชื่อบริษัท' : 'Please enter company name');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/companies/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          domain: finalDomain,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register company');

      setSuccessData(data.company);
    } catch (err: any) {
      setError(err.message || (language === 'th' ? 'เกิดข้อผิดพลาดในการลงทะเบียนบริษัท' : 'Failed to register company'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-transparent z-50 flex items-center justify-center p-4 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
          if (successData) onSuccess();
        }
      }}
    >
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-3xl shadow-[0_25px_70px_-15px_rgba(0,0,0,0.35)] p-6 relative">
        <button
          onClick={() => {
            onClose();
            if (successData) onSuccess();
          }}
          className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-600 transition p-1 rounded-md"
        >
          <X size={16} />
        </button>

        {!successData ? (
          <>
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-955/20 text-indigo-600 dark:text-indigo-400">
                <Building size={18} />
              </div>
              <h3 className="font-extrabold text-neutral-800 dark:text-neutral-100 text-sm font-display">
                {language === 'th' ? 'ลงทะเบียนบริษัทผู้เช่าใหม่' : 'Register New Tenant Company'}
              </h3>
            </div>

            {error && (
              <div className="bg-rose-50 dark:bg-rose-955/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold p-3.5 rounded-xl border border-rose-200/50 dark:border-rose-900/30 mb-4 leading-normal">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleRegisterCompany} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                  {language === 'th' ? 'ชื่อบริษัท (Company Name)' : 'Company Name'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={language === 'th' ? 'เช่น DD group' : 'e.g. DD group'}
                  value={name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setName(val);
                    if (!isDomainCustomized) {
                      const clean = val.toLowerCase().replace(/[^a-z0-9]/g, '');
                      setDomain(clean ? `${clean}.com` : '');
                    }
                  }}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 focus:border-indigo-600 focus:outline-none font-semibold text-neutral-800 dark:text-neutral-100"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                  {language === 'th' ? 'โดเมนหลัก (Domain Identifier)' : 'Domain Identifier'}
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-2.5 text-neutral-400" size={14} />
                  <input
                    type="text"
                    placeholder={language === 'th' ? 'เช่น ddgroup.com' : 'e.g. ddgroup.com'}
                    value={domain}
                    onChange={(e) => {
                      setIsDomainCustomized(true);
                      setDomain(e.target.value);
                    }}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl pl-9 pr-3 py-2 focus:border-indigo-600 focus:outline-none font-semibold text-neutral-800 dark:text-neutral-100"
                  />
                </div>
              </div>

              <div className="bg-[#e8f0fe]/50 dark:bg-blue-950/20 border border-[#1a73e8]/20 p-3 rounded-xl flex items-start gap-2.5">
                <Layers size={14} className="text-[#1a73e8] dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="text-[10px] text-neutral-700 dark:text-neutral-300 font-medium leading-normal">
                  {language === 'th'
                    ? 'ระบบจะสร้างรหัสความปลอดภัย Client ID และ Client Secret ให้อัตโนมัติ พร้อมตั้งค่าหมวดหมู่มาตรฐาน 18 รายการ'
                    : 'System automatically generates Client ID and Client Secret credentials, initializing 18 default taxonomy categories.'}
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-[#1a73e8] hover:bg-[#1557b0] text-white disabled:opacity-40 py-2.5 rounded-lg font-medium text-xs shadow-xs transition cursor-pointer text-center block"
              >
                {saving
                  ? (language === 'th' ? 'กำลังจัดตั้งระบบบริษัท...' : 'Provisioning Company...')
                  : (language === 'th' ? 'ยืนยันสร้างจัดตั้งบริษัทใหม่' : 'Confirm Registration')}
              </button>
            </form>
          </>
        ) : (
          <CompanyRegistrationSuccessView
            successData={successData}
            onClose={onClose}
            onSuccess={onSuccess}
            language={language}
          />
        )}
      </div>
    </div>
  );
}
