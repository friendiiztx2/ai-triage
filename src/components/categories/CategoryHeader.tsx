'use client';

import React from 'react';
import { Database, Tag, RefreshCw, Plus } from 'lucide-react';

interface CategoryHeaderProps {
  language: string;
  activeTab: 'categories' | 'tags';
  setActiveTab: (tab: 'categories' | 'tags') => void;
  canManage: boolean;
  categoriesCount: number;
  systemTagsCount: number;
  onOpenCreateModal: () => void;
  onRefresh: () => void;
}

export default function CategoryHeader({
  language,
  activeTab,
  setActiveTab,
  canManage,
  categoriesCount,
  systemTagsCount,
  onOpenCreateModal,
  onRefresh,
}: CategoryHeaderProps) {
  return (
    <div className="space-y-4 pb-1">
      {/* Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight font-display">
            {language === 'th' ? 'ศูนย์จัดการหมวดหมู่และแท็กระบบ' : 'Taxonomy & Tag Manager'}
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-xs sm:text-sm mt-0.5 font-normal">
            {language === 'th'
              ? 'จัดการหมวดหมู่หลักสำหรับโมเดล AI และแท็กติดเคสระบบ'
              : 'Configure classification intents and operational tags for Sift AI pipeline'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'categories' && canManage && (
            <button
              onClick={onOpenCreateModal}
              className="inline-flex items-center gap-1.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white px-3.5 py-1.5 rounded-lg text-xs font-medium shadow-xs transition-colors cursor-pointer"
            >
              <Plus size={13} />
              <span>{language === 'th' ? 'เพิ่มหมวดหมู่' : 'Add Category'}</span>
            </button>
          )}

          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 bg-white/70 dark:bg-neutral-900/70 hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-800/80 text-neutral-700 dark:text-neutral-300 px-3 py-1.5 rounded-lg text-xs font-medium shadow-xs transition-colors cursor-pointer backdrop-blur-md"
          >
            <RefreshCw size={12} />
            <span>{language === 'th' ? 'รีเฟรช' : 'Reload'}</span>
          </button>
        </div>
      </div>

      {/* Sleek Segmented Control */}
      <div className="flex items-center gap-1.5 border-b border-neutral-200/80 dark:border-neutral-800/80 pb-2.5">
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer select-none font-medium ${
            activeTab === 'categories'
              ? 'bg-[#1a73e8] text-white shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60'
          }`}
        >
          <Database size={13} className={activeTab === 'categories' ? 'text-white' : 'text-[#1a73e8]'} />
          <span>{language === 'th' ? 'หมวดหมู่หลัก' : 'Main Categories'}</span>
          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full tabular-nums ${
            activeTab === 'categories'
              ? 'bg-white/20 text-white font-medium'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
          }`}>
            {categoriesCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('tags')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer select-none font-medium ${
            activeTab === 'tags'
              ? 'bg-[#8430ce] text-white shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60'
          }`}
        >
          <Tag size={13} className={activeTab === 'tags' ? 'text-white' : 'text-[#8430ce]'} />
          <span>{language === 'th' ? 'แท็กระบบ' : 'System Tags'}</span>
          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full tabular-nums ${
            activeTab === 'tags'
              ? 'bg-white/20 text-white font-medium'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
          }`}>
            {systemTagsCount}
          </span>
        </button>
      </div>
    </div>
  );
}
