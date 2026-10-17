'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Tag, Plus, Search, Edit2, Trash2, ArrowUpRight, Check, X } from 'lucide-react';
import { saveAuditLog } from '@/lib/audit';
import SortHeader from '@/components/ui/SortHeader';

export interface SystemTagsManagerProps {
  systemTags: string[];
  setSystemTags: React.Dispatch<React.SetStateAction<string[]>>;
  canManage: boolean;
}

export default function SystemTagsManager({
  systemTags,
  setSystemTags,
  canManage,
}: SystemTagsManagerProps) {
  const [editingTag, setEditingTag] = useState<{ oldName: string; newName: string } | null>(null);
  const [newTagInput, setNewTagInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [sortActive, setSortActive] = useState<boolean>(false);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = () => {
    if (!sortActive) {
      setSortActive(true);
      setSortDirection('asc');
    } else if (sortDirection === 'asc') {
      setSortDirection('desc');
    } else {
      setSortActive(false);
    }
  };

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleAddSystemTag = () => {
    if (!newTagInput.trim()) return;
    let tagName = newTagInput.trim();
    if (!tagName.startsWith('#')) tagName = '#' + tagName;
    if (systemTags.includes(tagName)) {
      showFeedback('มีแท็กชื่อนี้ในระบบแล้ว', 'error');
      return;
    }
    const nextTags = [...systemTags, tagName];
    setSystemTags(nextTags);
    localStorage.setItem('system_tags', JSON.stringify(nextTags));
    setNewTagInput('');
    saveAuditLog('CREATE', `เพิ่มแท็กระบบใหม่: ${tagName}`);
    showFeedback(`เพิ่มแท็ก "${tagName}" เข้าสู่ระบบเรียบร้อยแล้ว`);
  };

  const handleRenameSystemTag = (oldName: string) => {
    if (!editingTag || !editingTag.newName.trim()) return;
    let updatedName = editingTag.newName.trim();
    if (!updatedName.startsWith('#')) updatedName = '#' + updatedName;

    const nextTags = systemTags.map((t) => (t === oldName ? updatedName : t));
    setSystemTags(nextTags);
    localStorage.setItem('system_tags', JSON.stringify(nextTags));
    saveAuditLog('UPDATE', `แก้ไขชื่อแท็กระบบจาก ${oldName} เป็น ${updatedName}`);
    setEditingTag(null);
    showFeedback(`แก้ไขแท็กเป็น "${updatedName}" เรียบร้อยแล้ว`);
  };

  const handleDeleteSystemTag = (tagName: string) => {
    if (!window.confirm(`ยืนยันการลบแท็ก "${tagName}" ออกจากระบบ?`)) return;
    const nextTags = systemTags.filter((t) => t !== tagName);
    setSystemTags(nextTags);
    localStorage.setItem('system_tags', JSON.stringify(nextTags));
    saveAuditLog('DELETE', `ลบแท็กระบบ: ${tagName}`);
    showFeedback(`ลบแท็ก "${tagName}" เรียบร้อยแล้ว`);
  };

  const filteredTags = useMemo(() => {
    let result = systemTags;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((t) => t.toLowerCase().includes(q));
    }
    if (sortActive) {
      result = [...result].sort((a, b) => 
        sortDirection === 'asc' ? a.localeCompare(b) : b.localeCompare(a)
      );
    }
    return result;
  }, [systemTags, searchQuery, sortActive, sortDirection]);

  return (
    <div className="space-y-4">
      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
          feedback.type === 'success'
            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
            : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
        }`}>
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Action & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="ค้นหาแท็กระบบ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/70 dark:bg-neutral-900/70 border border-neutral-200/80 dark:border-neutral-800/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors shadow-xs backdrop-blur-md"
          />
        </div>

        {/* Add Tag Inline Form */}
        {canManage && (
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="แท็กใหม่ เช่น #คืนยอดเสีย..."
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSystemTag();
                }
              }}
              className="bg-white/70 dark:bg-neutral-900/70 border border-neutral-200/80 dark:border-neutral-800/80 rounded-lg px-3 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors shadow-xs backdrop-blur-md font-mono"
            />
            <button
              type="button"
              onClick={handleAddSystemTag}
              className="inline-flex items-center gap-1.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white px-3.5 py-1.5 rounded-lg text-xs font-medium shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <Plus size={13} />
              <span>เพิ่มแท็ก</span>
            </button>
          </div>
        )}
      </div>

      {/* System Tags Data Table */}
      <div className="rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/60 dark:bg-neutral-900/60">
                <th className="py-3 px-4">
                  <SortHeader
                    label="ชื่อแท็กระบบ (System Tag)"
                    active={sortActive}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="py-3 px-4 hidden sm:table-cell text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                  สถานะการใช้งาน
                </th>
                <th className="py-3 px-4 text-right text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                  การจัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 text-neutral-700 dark:text-neutral-300">
              {filteredTags.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-xs text-neutral-400 font-mono">
                    ไม่พบแท็กระบบที่ตรงกับการค้นหา
                  </td>
                </tr>
              ) : (
                filteredTags.map((tagName) => {
                  const isEditingThis = editingTag?.oldName === tagName;

                  return (
                    <tr
                      key={tagName}
                      className="group hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-[background-color] duration-150"
                    >
                      {/* Tag Name / Inline Edit */}
                      <td className="py-2.5 px-4">
                        {isEditingThis ? (
                          <div className="flex items-center gap-2 max-w-xs">
                            <input
                              type="text"
                              value={editingTag.newName}
                              onChange={(e) => setEditingTag({ ...editingTag, newName: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameSystemTag(tagName);
                                if (e.key === 'Escape') setEditingTag(null);
                              }}
                              autoFocus
                              className="bg-white dark:bg-neutral-800 border border-neutral-400 dark:border-neutral-600 rounded px-2 py-1 text-xs font-mono font-medium text-neutral-900 dark:text-neutral-100 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleRenameSystemTag(tagName)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-955/20 rounded"
                              title="บันทึก"
                            >
                              <Check size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingTag(null)}
                              className="p-1 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
                              title="ยกเลิก"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200/60 dark:border-neutral-700/60">
                              <Tag size={11} className="text-neutral-400" />
                              <span>{tagName}</span>
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-4 hidden sm:table-cell">
                        <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">
                          พร้อมใช้งานใน Triage Queue
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1 justify-end">
                          <Link
                            href={`/chats?search=${encodeURIComponent(tagName)}`}
                            title="ค้นหาเคสติดแท็กนี้"
                            className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                          >
                            <ArrowUpRight size={13} />
                          </Link>

                          {canManage && !isEditingThis && (
                            <>
                              <button
                                type="button"
                                onClick={() => setEditingTag({ oldName: tagName, newName: tagName })}
                                title="แก้ไขชื่อแท็ก"
                                className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSystemTag(tagName)}
                                title="ลบแท็ก"
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
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
