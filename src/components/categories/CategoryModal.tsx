'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';

export interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: any | null; // null for Create, non-null for Edit
  onSave: (data: { id: string; name: string; name_en: string; description: string; isEdit: boolean }) => Promise<void>;
  language?: 'th' | 'en';
}

export default function CategoryModal({
  isOpen,
  onClose,
  category,
  onSave,
  language = 'th',
}: CategoryModalProps) {
  const isEdit = !!category;

  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [desc, setDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (category) {
        setId(category.id || '');
        setName(category.name || category.title || '');
        setNameEn(category.name_en || '');
        setDesc(category.description || category.desc || '');
      } else {
        setId('');
        setName('');
        setNameEn('');
        setDesc('');
      }
      setError(null);
      setSaving(false);
    }
  }, [isOpen, category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!isEdit && !id.trim()) return;

    setSaving(true);
    setError(null);
    try {
      await onSave({
        id: isEdit ? category.id : id.trim(),
        name: name.trim(),
        name_en: nameEn.trim(),
        description: desc.trim(),
        isEdit,
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'บันทึกหมวดหมู่ไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const title = isEdit ? 'แก้ไขหมวดหมู่ปัญหา' : 'เพิ่มหมวดหมู่ปัญหาใหม่';
  const subtitle = isEdit
    ? `ไอดีหมวดหมู่: ${category?.id} (แก้ไขไม่ได้)`
    : 'สร้างหัวข้อใหม่เพื่อให้ระบบ AI และพนักงานนำไปคัดกรอง';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} subtitle={subtitle} maxWidth="md">
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {error && (
          <div className="bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-mono p-2.5 rounded-lg border border-rose-500/20">
            {error}
          </div>
        )}

        {/* Category ID (only editable when creating) */}
        {!isEdit ? (
          <div>
            <label className="block text-neutral-500 dark:text-neutral-400 font-mono text-[10px] uppercase tracking-wider mb-1.5">
              ไอดีหมวดหมู่ (Category ID / Slug) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="เช่น billing, technical_support"
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-xs font-mono text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors"
            />
            <p className="text-[10px] font-mono text-neutral-400 mt-1">
              * ภาษาอังกฤษตัวพิมพ์เล็ก ไม่มีเว้นวรรค
            </p>
          </div>
        ) : null}

        {/* Category Name (Thai) */}
        <div>
          <label className="block text-neutral-500 dark:text-neutral-400 font-mono text-[10px] uppercase tracking-wider mb-1.5">
            {language === 'th' ? 'ชื่อหมวดหมู่ภาษาไทย' : 'Thai Category Name'} <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="เช่น ปัญหาการเงินและการชำระเงิน"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors"
          />
        </div>

        {/* Category Name (English) */}
        <div>
          <label className="block text-neutral-500 dark:text-neutral-400 font-mono text-[10px] uppercase tracking-wider mb-1.5">
            {language === 'th' ? 'ชื่อหมวดหมู่ภาษาอังกฤษ (English Name)' : 'English Category Name'}
          </label>
          <input
            type="text"
            placeholder="e.g. Deposit & Withdrawal"
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors"
          />
        </div>

        {/* Category Description */}
        <div>
          <label className="block text-neutral-500 dark:text-neutral-400 font-mono text-[10px] uppercase tracking-wider mb-1.5">
            เกณฑ์หรือคำอธิบายสำหรับ AI (Intent Description)
          </label>
          <textarea
            placeholder="อธิบายสิ่งที่ลูกค้าแจ้ง เช่น การโอนเงินไม่เข้า ขอเงินคืน หรือแจ้งสลิปผิดพลาด"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={3}
            className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors resize-none leading-relaxed"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white px-4 py-1.5 rounded-lg text-xs font-medium shadow-xs transition-colors cursor-pointer disabled:opacity-40"
          >
            {saving ? (
              <RefreshCw size={12} className="animate-spin" />
            ) : (
              <CheckCircle size={12} />
            )}
            <span>{saving ? 'กำลังบันทึก...' : isEdit ? 'บันทึกการแก้ไข' : 'สร้างหมวดหมู่'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
