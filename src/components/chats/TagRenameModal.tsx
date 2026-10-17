'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';

export interface TagRenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  tagToRename: string | null;
  onConfirmRename: (newTagName: string) => Promise<void> | void;
}

export default function TagRenameModal({
  isOpen,
  onClose,
  tagToRename,
  onConfirmRename,
}: TagRenameModalProps) {
  const [newTagName, setNewTagName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNewTagName(tagToRename || '');
      setSubmitting(false);
    }
  }, [isOpen, tagToRename]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    setSubmitting(true);
    try {
      await onConfirmRename(newTagName.trim());
      onClose();
    } catch (err) {
      console.error('Failed to rename tag:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="แก้ไขชื่อป้ายกำกับ"
      maxWidth="md"
      zIndex="z-[9999]"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-normal">
          ระบบจะทำการเปลี่ยนชื่อแท็ก{' '}
          <span className="font-mono font-medium text-neutral-900 dark:text-neutral-100 px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
            {tagToRename}
          </span>{' '}
          สำหรับทุกบทสนทนาที่ติดแท็กนี้อยู่ ให้เปลี่ยนเป็นชื่อใหม่พร้อมกันทันที
        </p>

        <div>
          <label className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block mb-1.5">
            ชื่อแท็กใหม่
          </label>
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3.5 py-2 text-xs font-mono font-medium focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white focus:outline-none text-neutral-800 dark:text-neutral-100"
            placeholder="เช่น #รอสลิปโอนเงิน..."
            autoFocus
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={submitting || !newTagName.trim()}
            className="px-4 py-1.5 rounded-lg text-xs font-medium bg-[#1a73e8] hover:bg-[#1557b0] disabled:opacity-50 text-white shadow-xs transition cursor-pointer"
          >
            {submitting ? 'กำลังบันทึก...' : 'ยืนยันเปลี่ยนชื่อ'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
