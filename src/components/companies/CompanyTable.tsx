import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Plus,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  Globe,
  ShieldAlert,
  PackageCheck,
  Infinity as InfinityIcon,
} from 'lucide-react';

export interface Company {
  id: string;
  name: string;
  domain: string;
  client_id: string;
  client_secret: string;
  created_at: string;
  monthly_quota?: number;
  package_name?: string;
  package_badge?: string;
  is_unlimited?: boolean;
}

interface CompanyTableProps {
  companies: Company[];
  loading: boolean;
  onRefresh?: () => void;
  showSecrets?: Record<string, boolean>;
  toggleSecret?: (id: string) => void;
  copyToClipboard?: (text: string) => void;
  onAddNew?: () => void;
  language?: 'th' | 'en';
}

export default function CompanyTable({
  companies,
  loading,
  showSecrets: externalShowSecrets,
  toggleSecret: externalToggleSecret,
  copyToClipboard: externalCopy,
  onAddNew,
  language = 'th',
}: CompanyTableProps) {
  const [internalShowSecrets, setInternalShowSecrets] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const showSecrets = externalShowSecrets || internalShowSecrets;

  const handleToggleSecret = (id: string) => {
    if (externalToggleSecret) {
      externalToggleSecret(id);
    } else {
      setInternalShowSecrets((prev) => ({ ...prev, [id]: !prev[id] }));
    }
  };

  const handleCopy = (text: string, keyId: string) => {
    if (externalCopy) {
      externalCopy(text);
    } else {
      navigator.clipboard.writeText(text);
    }
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 p-16 text-center shadow-sm">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-neutral-400 text-xs font-medium">
          {language === 'th' ? 'กำลังดึงข้อมูลรายชื่อบริษัท...' : 'Fetching registered companies...'}
        </p>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 p-16 text-center shadow-sm space-y-3">
        <Building2 size={40} className="mx-auto text-neutral-300 dark:text-neutral-700" />
        <div className="max-w-xs mx-auto space-y-1">
          <h3 className="font-bold text-neutral-700 dark:text-neutral-200 text-sm">
            {language === 'th' ? 'ยังไม่มีข้อมูลบริษัทในระบบ' : 'No Companies Registered'}
          </h3>
          <p className="text-neutral-400 text-xs leading-relaxed">
            {language === 'th'
              ? 'เริ่มสร้างบริษัทองค์กรใหม่เพื่อแยกสิทธิ์การเข้าถึงข้อมูลและการเชื่อมต่อ API'
              : 'Start provisioning your first company tenant to isolate data and API credentials.'}
          </p>
        </div>
        {onAddNew && (
          <button
            onClick={onAddNew}
            className="mt-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 dark:text-indigo-400 px-4 py-2 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={15} />
            {language === 'th' ? 'เริ่มสร้างบริษัทแรก' : 'Register First Company'}
          </button>
        )}
      </div>
    );
  }

  const getBadgeStyle = (pkgName?: string) => {
    switch ((pkgName || 'Pro').toLowerCase()) {
      case 'starter':
        return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
      case 'enterprise':
        return 'bg-violet-500/15 text-violet-700 border-violet-500/30 dark:text-violet-300';
      case 'custom':
        return 'bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-300';
      default:
        return 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300';
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40 text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
              <th className="py-3.5 px-6">
                {language === 'th' ? 'ชื่อบริษัท / แบรนด์' : 'Company Name'}
              </th>
              <th className="py-3.5 px-6">
                {language === 'th' ? 'โดเมน (Domain)' : 'Domain'}
              </th>
              <th className="py-3.5 px-6">
                {language === 'th' ? 'แพ็กเกจ / โควต้าแชต' : 'Package & Quota'}
              </th>
              <th className="py-3.5 px-6">Client ID</th>
              <th className="py-3.5 px-6">
                {language === 'th' ? 'รหัสลับ (Client Secret)' : 'Client Secret'}
              </th>
              <th className="py-3.5 px-6 text-right">
                {language === 'th' ? 'วันที่จัดตั้ง' : 'Created Date'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200/60 dark:divide-neutral-800/60 text-xs">
            {companies.map((c) => {
              const quotaNum = c.monthly_quota ?? 50000;
              const isUnlimited = c.is_unlimited || quotaNum === -1 || quotaNum >= 999999999;
              const pkgName = c.package_name || 'Pro';

              return (
                <tr
                  key={c.id}
                  className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/30 transition-colors"
                >
                  <td className="py-4 px-6 font-bold text-neutral-800 dark:text-neutral-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500/10 to-violet-500/10 dark:from-indigo-500/20 dark:to-violet-500/20 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase shrink-0">
                        {(c.name || 'CO').slice(0, 2)}
                      </div>
                      <div>
                        <span className="block">{c.name}</span>
                        <span className="text-[10px] font-mono text-neutral-400 font-normal">
                          ID: {c.id}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-6">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                      <Globe size={12} className="text-indigo-500" />
                      {c.domain}
                    </span>
                  </td>

                  <td className="py-4 px-6">
                    <div className="flex flex-col items-start gap-1">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold border ${getBadgeStyle(
                          pkgName
                        )}`}
                      >
                        <PackageCheck size={12} />
                        <span>{pkgName}</span>
                      </span>
                      <Link
                        href={`/usage-quotas?company_id=${c.id}`}
                        className="text-[10px] text-neutral-500 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold flex items-center gap-1 hover:underline"
                      >
                        {isUnlimited ? (
                          <>
                            <InfinityIcon size={11} />
                            <span>ไม่จำกัดจำนวนแชต</span>
                          </>
                        ) : (
                          <span>{quotaNum.toLocaleString()} แชต/เดือน</span>
                        )}
                      </Link>
                    </div>
                  </td>

                  <td className="py-4 px-6 font-mono text-neutral-600 dark:text-neutral-300">
                    {c.client_id ? (
                      <div className="flex items-center gap-2">
                        <span className="bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded text-[11px] border border-neutral-200 dark:border-neutral-700">
                          {c.client_id}
                        </span>
                        <button
                          onClick={() => handleCopy(c.client_id, `cid-${c.id}`)}
                          className="text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 rounded transition cursor-pointer"
                          title={language === 'th' ? 'คัดลอก Client ID' : 'Copy Client ID'}
                        >
                          {copiedKey === `cid-${c.id}` ? (
                            <Check size={13} className="text-emerald-500" />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="text-neutral-400 italic">-</span>
                    )}
                  </td>

                  <td className="py-4 px-6 font-mono">
                    {c.client_secret ? (
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-50/50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 px-2.5 py-1 rounded text-[11px] border border-amber-200/60 dark:border-amber-800/50 flex items-center gap-1.5">
                          <KeyRound size={12} className="text-amber-500 shrink-0" />
                          {showSecrets[c.id] ? c.client_secret : '••••••••••••••••••••••••'}
                        </span>
                        <button
                          onClick={() => handleToggleSecret(c.id)}
                          className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1 rounded transition cursor-pointer"
                          title={
                            showSecrets[c.id]
                              ? language === 'th'
                                ? 'ซ่อนรหัสลับ'
                                : 'Hide Secret'
                              : language === 'th'
                              ? 'แสดงรหัสลับ'
                              : 'Show Secret'
                          }
                        >
                          {showSecrets[c.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button
                          onClick={() => handleCopy(c.client_secret, `sec-${c.id}`)}
                          className="text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 rounded transition cursor-pointer"
                          title={language === 'th' ? 'คัดลอก Client Secret' : 'Copy Client Secret'}
                        >
                          {copiedKey === `sec-${c.id}` ? (
                            <Check size={13} className="text-emerald-500" />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="text-neutral-400 italic flex items-center gap-1 text-[11px]">
                        <ShieldAlert size={12} /> Legacy
                      </span>
                    )}
                  </td>

                  <td className="py-4 px-6 text-right text-neutral-400 font-medium">
                    {c.created_at
                      ? new Date(c.created_at).toLocaleDateString(
                          language === 'th' ? 'th-TH' : 'en-US',
                          {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          }
                        )
                      : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
