'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Tag, Edit2 } from 'lucide-react';

export interface AvailableTag {
  name: string;
  desc: string;
  style: string;
}

export interface TagManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  allAvailableTags: AvailableTag[];
  onSaveRenameTag: (index: number, newTagName: string) => Promise<void> | void;
}

export default function TagManagerModal({
  isOpen,
  onClose,
  allAvailableTags,
  onSaveRenameTag,
}: TagManagerModalProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const handleStartEdit = (idx: number, currentName: string) => {
    setEditingIndex(idx);
    setEditingValue(currentName);
  };

  const handleSave = async (idx: number) => {
    if (!editingValue.trim()) return;
    await onSaveRenameTag(idx, editingValue.trim());
    setEditingIndex(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="จัดการป้ายกำกับเคส (Tag Manager)"
      maxWidth="lg"
      zIndex="z-[9999]"
    >
      <div className="p-6 space-y-4">
        <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
          การเปลี่ยนชื่อป้ายกำกับจะทำการอัปเดตชื่อใหม่ให้ทุกบทสนทนาในระบบทันที:
        </p>

        <div className="space-y-2 max-h-[350px] overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800">
          {allAvailableTags.map((tagObj, idx) => {
            const isEditing = editingIndex === idx;
            return (
              <div key={idx} className="flex items-center justify-between py-2.5 gap-3">
                {isEditing ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave(idx);
                        if (e.key === 'Escape') setEditingIndex(null);
                      }}
                      className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-xs font-mono font-medium text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleSave(idx)}
                      className="bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-xs transition cursor-pointer"
                    >
                      บันทึก
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingIndex(null)}
                      className="text-xs font-medium text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-md border border-neutral-200/80 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                        {tagObj.name}
                      </span>
                      <span className="text-[11px] text-neutral-400 font-normal">({tagObj.desc})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleStartEdit(idx, tagObj.name)}
                      className="flex items-center gap-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-white dark:bg-neutral-800 px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 transition cursor-pointer"
                    >
                      <Edit2 size={11} className="text-neutral-400" />
                      <span>แก้ไข</span>
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-3 border-t border-neutral-100 dark:border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-medium px-4 py-2 rounded-lg transition cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </Modal>
  );
}
