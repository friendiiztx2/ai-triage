'use client';

import React, { useState, useEffect } from 'react';
import { X, Building2, Save, Loader2, AlertCircle, CheckCircle2, Sliders } from 'lucide-react';

interface EditQuotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  company: {
    id: string;
    name: string;
    monthly_quota?: number;
  } | null;
}

export default function EditQuotaModal({
  isOpen,
  onClose,
  onSuccess,
  company,
}: EditQuotaModalProps) {
  const [quota, setQuota] = useState('50000');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen && company) {
      setQuota(String(company.monthly_quota || 50000));
      setErrorMsg('');
    }
  }, [isOpen, company]);

  if (!isOpen || !company) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const quotaNum = Number(quota);
    if (isNaN(quotaNum) || quotaNum < 1000) {
      setErrorMsg('กรุณาระบุโควต้าเป็นตัวเลขอย่างน้อย 1,000 ข้อความ');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/usage-quotas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: company.id,
          monthly_quota: quotaNum,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาดในการบันทึกโควต้า');

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'ไม่สามารถบันทึกโควต้าได้');
    } finally {
      setSaving(false);
    }
  };

  const quickPresets = [20000, 50000, 100000, 200000, 500000];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in select-none">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transition-all duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Sliders size={18} />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-neutral-900 dark:text-white">
                ปรับแต่งโควต้าของบริษัท
              </h2>
              <p className="text-[12px] text-neutral-500 dark:text-neutral-400">
                {company.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2 text-rose-700 dark:text-rose-300 text-[12px]">
              <AlertCircle size={14} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-neutral-700 dark:text-neutral-300">
              โควต้าข้อความสูงสุดต่อเดือน (Monthly Quota) *
            </label>
            <input
              type="number"
              required
              min={1000}
              step={1000}
              value={quota}
              onChange={(e) => setQuota(e.target.value)}
              className="w-full px-3.5 py-2.5 text-[14px] font-semibold font-mono rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              placeholder="50000"
            />
            <p className="text-[11px] text-neutral-400">
              ระบบจะเริ่มแจ้งเตือนอัตโนมัติเมื่อใช้ถึง 80% ({Math.round(Number(quota || 0) * 0.8).toLocaleString()} ข้อความ) และ 90% ({Math.round(Number(quota || 0) * 0.9).toLocaleString()} ข้อความ)
            </p>
          </div>

          {/* Presets */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-neutral-500 dark:text-neutral-400">เลือกค่าด่วน:</label>
            <div className="flex flex-wrap gap-1.5">
              {quickPresets.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setQuota(String(val))}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium border transition cursor-pointer ${
                    Number(quota) === val
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                      : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  {val.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-[12px] font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition disabled:opacity-60 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <Save size={13} />
                  <span>บันทึกโควต้า</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
