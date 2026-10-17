'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, ArrowUpRight, Edit2, Trash2, Info, Lock } from 'lucide-react';
import { getCategoryLabel, getBaseCatId } from '@/lib/categories';
import CategoryStatsCards from '@/components/categories/CategoryStatsCards';
import SortHeader from '@/components/ui/SortHeader';

interface CategoryListGridProps {
  categories: any[];
  totalChatsCount: number;
  categoryStats: Record<string, number>;
  canManage: boolean;
  userProfile: any;
  language: 'th' | 'en';
  onEdit: (category: any) => void;
  onDelete: (category: any) => void;
}

export default function CategoryListGrid({
  categories,
  totalChatsCount,
  categoryStats,
  canManage,
  userProfile,
  language,
  onEdit,
  onDelete,
}: CategoryListGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<'name' | 'intent' | 'volume' | 'status' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (col: 'name' | 'intent' | 'volume' | 'status') => {
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

  // Filter categories based on search input
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase().trim();
    return categories.filter((cat) => {
      const label = getCategoryLabel(cat, language).toLowerCase();
      const id = (cat.id || '').toLowerCase();
      const desc = (cat.description || cat.desc || '').toLowerCase();
      return label.includes(q) || id.includes(q) || desc.includes(q);
    });
  }, [categories, searchQuery, language]);

  // Sort filtered categories
  const sortedCategories = useMemo(() => {
    if (!sortColumn) return filteredCategories;
    return [...filteredCategories].sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      if (sortColumn === 'name') {
        valA = getCategoryLabel(a, language).toLowerCase();
        valB = getCategoryLabel(b, language).toLowerCase();
      } else if (sortColumn === 'intent') {
        valA = (a.description || a.desc || '').toLowerCase();
        valB = (b.description || b.desc || '').toLowerCase();
      } else if (sortColumn === 'volume') {
        const baseKeyA = getBaseCatId(a.id);
        const countA = categoryStats[a.id] || categoryStats[baseKeyA] || 0;
        const baseKeyB = getBaseCatId(b.id);
        const countB = categoryStats[b.id] || categoryStats[baseKeyB] || 0;
        valA = countA;
        valB = countB;
      } else if (sortColumn === 'status') {
        valA = 'active';
        valB = 'active';
      }

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
      return sortDirection === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [filteredCategories, sortColumn, sortDirection, language, categoryStats]);

  return (
    <div className="space-y-4">
      {/* 1. Precision Metric Strip */}
      <CategoryStatsCards
        categories={categories}
        totalChatsCount={totalChatsCount}
        categoryStats={categoryStats}
        language={language}
      />

      {/* 2. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder={language === 'th' ? 'ค้นหาชื่อหมวดหมู่, คำอธิบาย หรือ ID...' : 'Filter categories by name, slug or criteria...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/70 dark:bg-neutral-900/70 border border-neutral-200/80 dark:border-neutral-800/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors shadow-xs backdrop-blur-md"
          />
        </div>

        {!canManage && (
          <div className="inline-flex items-center gap-1.5 text-[11px] text-neutral-500 bg-neutral-100 dark:bg-neutral-800/80 px-2.5 py-1 rounded-md border border-neutral-200/60 dark:border-neutral-700/60 font-mono">
            <Lock size={11} className="text-neutral-400" />
            <span>{language === 'th' ? 'โหมดอ่านอย่างเดียว (Read Only)' : 'Read-only access'}</span>
          </div>
        )}
      </div>

      {/* 3. Enterprise Taxonomy Data Table */}
      <div className="rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/60 dark:bg-neutral-900/60">
                <th className="py-3 px-4">
                  <SortHeader
                    label={language === 'th' ? 'หมวดหมู่ & คีย์ระบบ' : 'Category & Slug'}
                    active={sortColumn === 'name'}
                    direction={sortDirection}
                    onSort={() => handleSort('name')}
                  />
                </th>
                <th className="py-3 px-4 hidden md:table-cell">
                  <SortHeader
                    label={language === 'th' ? 'เกณฑ์การจำแนก AI' : 'Classification Intent'}
                    active={sortColumn === 'intent'}
                    direction={sortDirection}
                    onSort={() => handleSort('intent')}
                  />
                </th>
                <th className="py-3 px-4 text-right">
                  <SortHeader
                    label={language === 'th' ? 'เคสสะสม' : 'Volume'}
                    active={sortColumn === 'volume'}
                    direction={sortDirection}
                    onSort={() => handleSort('volume')}
                    align="right"
                  />
                </th>
                <th className="py-3 px-4 hidden sm:table-cell text-center">
                  <SortHeader
                    label={language === 'th' ? 'สถานะ' : 'Status'}
                    active={sortColumn === 'status'}
                    direction={sortDirection}
                    onSort={() => handleSort('status')}
                    align="center"
                  />
                </th>
                <th className="py-3 px-4 text-right font-semibold text-xs text-neutral-600 dark:text-neutral-300">
                  {language === 'th' ? 'การจัดการ' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 text-neutral-700 dark:text-neutral-300">
              {sortedCategories.map((cat) => {
                const baseKey = getBaseCatId(cat.id);
                const count = categoryStats[cat.id] || categoryStats[baseKey] || 0;
                const percent = totalChatsCount > 0 ? ((count / totalChatsCount) * 100).toFixed(1) : '0';
                const label = getCategoryLabel(cat, language);
                const desc = cat.description || cat.desc || (language === 'th' ? 'ไม่มีคำอธิบายเพิ่มเติม' : 'No description provided');

                return (
                  <tr
                    key={cat.id}
                    className="group hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-[background-color] duration-150"
                  >
                    {/* Category Name & Slug */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-neutral-900 dark:text-neutral-100 text-xs">
                          {label}
                        </span>
                        <span className="font-mono text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                          {baseKey}
                        </span>
                      </div>
                    </td>

                    {/* AI Intent Description */}
                    <td className="py-3 px-4 max-w-sm hidden md:table-cell">
                      <p className="text-neutral-500 dark:text-neutral-400 line-clamp-2 text-xs leading-relaxed">
                        {desc}
                      </p>
                    </td>

                    {/* Volume & Share */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex flex-col items-end">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">
                            {count.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            ({percent}%)
                          </span>
                        </div>
                        <div className="w-16 bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className="bg-[#1a73e8] h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.max(0, Number(percent)))}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center hidden sm:table-cell">
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#e6f4ea] text-[#137333] border border-[#ceead6] dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 font-medium">
                        Active
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1 justify-end">
                        <Link
                          href={`/chats?category=${encodeURIComponent(baseKey)}`}
                          title={language === 'th' ? 'ดูรายการแชต' : 'View chats'}
                          className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        >
                          <ArrowUpRight size={13} />
                        </Link>

                        {canManage && (
                          <>
                            <button
                              type="button"
                              onClick={() => onEdit(cat)}
                              title={language === 'th' ? 'แก้ไขหมวดหมู่' : 'Edit category'}
                              className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDelete(cat)}
                              title={language === 'th' ? 'ลบหมวดหมู่' : 'Delete category'}
                              className="p-1.5 rounded-md text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-955/30 transition-colors cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Default Fallback Row: Other / Unclassified */}
              <tr className="bg-neutral-50/40 dark:bg-neutral-900/40 hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors border-t border-dashed border-neutral-200 dark:border-neutral-800">
                <td className="py-3 px-4">
                  <div className="flex flex-col">
                    <span className="font-medium text-neutral-800 dark:text-neutral-200 text-xs flex items-center gap-1.5">
                      <span>{language === 'th' ? 'เรื่องอื่นๆ (Other / Unclassified)' : 'Other / Unclassified'}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-neutral-200/80 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                        Default
                      </span>
                    </span>
                    <span className="font-mono text-[10px] text-neutral-400 mt-0.5">
                      other
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 max-w-sm hidden md:table-cell">
                  <p className="text-neutral-400 text-xs leading-relaxed italic">
                    {language === 'th'
                      ? 'แชตที่โมเดล AI ยังไม่สามารถจำแนกลงในหมวดหมู่ข้างต้นได้ จะถูกรวมไว้ที่นี่เพื่อให้เจ้าหน้าที่ตรวจสอบ'
                      : 'Fallback bucket for inquiries not meeting active intent criteria.'}
                  </p>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex flex-col items-end">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-mono font-semibold text-neutral-800 dark:text-neutral-200 tabular-nums">
                        {(categoryStats['other'] || 0).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        ({totalChatsCount > 0 ? (((categoryStats['other'] || 0) / totalChatsCount) * 100).toFixed(1) : '0'}%)
                      </span>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-center hidden sm:table-cell">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border border-neutral-200 dark:border-neutral-700 font-medium">
                    System
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <Link
                    href="/chats?category=other"
                    title={language === 'th' ? 'ดูรายการเคสอื่นๆ' : 'View unclassified chats'}
                    className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors inline-flex"
                  >
                    <ArrowUpRight size={13} />
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
