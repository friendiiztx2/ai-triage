'use client';

import React, { useState, useMemo } from 'react';
import { Building, RefreshCw, Copy, Check } from 'lucide-react';
import SortHeader from '@/components/ui/SortHeader';

export interface CompanyTableProps {
  companies: any[];
  loading: boolean;
  onRefresh: () => void;
  language?: 'th' | 'en';
}

type CompanySortColumn = 'name' | 'domain' | 'client_id' | 'created_at';

export default function CompanyTable({
  companies,
  loading,
  language = 'th',
}: CompanyTableProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<CompanySortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (col: CompanySortColumn) => {
    if (sortColumn !== col) {
      setSortColumn(col);
      setSortDirection('asc');
    } else if (sortDirection === 'asc') {
      setSortDirection('desc');
    } else {
      setSortColumn(null);
      setSortDirection('asc');
    }
  };

  const sortedCompanies = useMemo(() => {
    if (!sortColumn) return companies;
    return [...companies].sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      if (sortColumn === 'name') {
        valA = (a.name || '').toLowerCase();
        valB = (b.name || '').toLowerCase();
      } else if (sortColumn === 'domain') {
        valA = (a.domain || '').toLowerCase();
        valB = (b.domain || '').toLowerCase();
      } else if (sortColumn === 'client_id') {
        valA = (a.client_id || '').toLowerCase();
        valB = (b.client_id || '').toLowerCase();
      } else if (sortColumn === 'created_at') {
        valA = new Date(a.created_at || 0).getTime();
        valB = new Date(b.created_at || 0).getTime();
      }

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
      return sortDirection === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [companies, sortColumn, sortDirection]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-2.5 text-neutral-400 font-mono text-xs">
        <RefreshCw size={18} className="animate-spin text-neutral-400 dark:text-neutral-600" />
        <span>{language === 'th' ? 'กำลังโหลดข้อมูลบริษัทผู้เช่า...' : 'Loading tenant companies...'}</span>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="py-16 text-center text-neutral-400 text-xs flex flex-col items-center justify-center gap-2 font-mono">
        <Building size={24} className="text-neutral-300 dark:text-neutral-700" />
        <span>{language === 'th' ? 'ไม่พบข้อมูลรายชื่อบริษัทในระบบ' : 'No companies found in the system'}</span>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200/80 dark:border-neutral-800/80">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-neutral-50/70 dark:bg-neutral-900/60 border-b border-neutral-200/80 dark:border-neutral-800/80">
            <th className="px-4 py-3">
              <SortHeader
                label={language === 'th' ? 'บริษัท' : 'Company'}
                active={sortColumn === 'name'}
                direction={sortDirection}
                onSort={() => handleSort('name')}
              />
            </th>
            <th className="px-4 py-3">
              <SortHeader
                label={language === 'th' ? 'โดเมน' : 'Domain'}
                active={sortColumn === 'domain'}
                direction={sortDirection}
                onSort={() => handleSort('domain')}
              />
            </th>
            <th className="px-4 py-3">
              <SortHeader
                label="Client ID"
                active={sortColumn === 'client_id'}
                direction={sortDirection}
                onSort={() => handleSort('client_id')}
              />
            </th>
            <th className="px-4 py-3 text-xs font-semibold text-neutral-600 dark:text-neutral-300">Client Secret</th>
            <th className="px-4 py-3 text-right">
              <SortHeader
                label={language === 'th' ? 'วันที่ลงทะเบียน' : 'Registration Date'}
                active={sortColumn === 'created_at'}
                direction={sortDirection}
                onSort={() => handleSort('created_at')}
                align="right"
              />
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 text-neutral-700 dark:text-neutral-300">
          {sortedCompanies.map((c) => (
            <tr key={c.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-[background-color] duration-150">
              <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">{c.name}</td>
              <td className="px-4 py-3 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                {c.domain}
              </td>
              <td className="px-4 py-3 font-mono text-neutral-600 dark:text-neutral-400">
                <span className="inline-flex items-center gap-1.5">
                  <span>{c.client_id}</span>
                  <button
                    onClick={() => copyToClipboard(c.client_id, `cid-${c.id}`)}
                    title={language === 'th' ? 'คัดลอก Client ID' : 'Copy Client ID'}
                    className="text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 cursor-pointer p-0.5"
                  >
                    {copiedKey === `cid-${c.id}` ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                  </button>
                </span>
              </td>
              <td className="px-4 py-3 font-mono text-neutral-400">
                <span className="inline-flex items-center gap-1.5">
                  <span>{c.client_secret || '••••••••'}</span>
                  {c.client_secret && (
                    <button
                      onClick={() => copyToClipboard(c.client_secret, `sec-${c.id}`)}
                      title={language === 'th' ? 'คัดลอก Client Secret' : 'Copy Client Secret'}
                      className="text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 cursor-pointer p-0.5"
                    >
                      {copiedKey === `sec-${c.id}` ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                    </button>
                  )}
                </span>
              </td>
              <td className="px-4 py-3 text-right font-mono text-[11px] text-neutral-400">
                {c.created_at ? new Date(c.created_at).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US') : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
