'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, AlertCircle, Sliders, Infinity, Sparkles, Check } from 'lucide-react';

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

const PACKAGES = [
  {
    plan: 'Starter',
    badge: 'ทีมขนาดเล็ก',
    value: 20000,
    label: '20,000 แชต',
    price: '฿8,000 / เดือน',
    isUnlimited: false,
  },
  {
    plan: 'Pro',
    badge: 'ยอดนิยม',
    popular: true,
    value: 50000,
    label: '50,000 แชต',
    price: '฿15,000 / เดือน',
    isUnlimited: false,
  },
  {
    plan: 'Enterprise',
    badge: 'องค์กรใหญ่',
    value: 120000,
    label: '120,000 แชต',
    price: '฿28,000 / เดือน',
    isUnlimited: false,
  },
  {
    plan: 'Custom',
    badge: 'On-Premise',
    value: -1,
    label: 'ไม่จำกัด',
    price: 'ติดต่อฝ่ายขาย',
    isUnlimited: true,
  },
];

export default function EditQuotaModal({
  isOpen,
  onClose,
  onSuccess,
  company,
}: EditQuotaModalProps) {
  const [quota, setQuota] = useState('50000');
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen && company) {
      const q = company.monthly_quota ?? 50000;
      if (q === -1 || q >= 999999999) {
        setIsUnlimited(true);
        setQuota('-1');
      } else {
        setIsUnlimited(false);
        setQuota(String(q));
      }
      setErrorMsg('');
    }
  }, [isOpen, company]);

  if (!isOpen || !company) return null;

  const handleSelectPackage = (pkg: typeof PACKAGES[0]) => {
    if (pkg.isUnlimited) {
      setIsUnlimited(true);
      setQuota('-1');
    } else {
      setIsUnlimited(false);
      setQuota(String(pkg.value));
    }
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const quotaNum = isUnlimited ? -1 : Number(quota);

    if (!isUnlimited && (isNaN(quotaNum) || quotaNum < 1000)) {
      setErrorMsg('กรุณาระบุโควต้าเป็นตัวเลขอย่างน้อย 1,000 ข้อความ หรือเลือกแพ็กเกจไม่จำกัด');
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

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in select-none">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden transition-all duration-200">
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
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
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

          {/* Package Selection Cards */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-medium text-neutral-700 dark:text-neutral-300">
                เลือกแพ็กเกจมาตรฐาน (Sift AI Packages):
              </label>
              <span className="text-[11px] text-neutral-400">เลือกค่าด่วน</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PACKAGES.map((pkg) => {
                const isSelected = pkg.isUnlimited
                  ? isUnlimited
                  : !isUnlimited && Number(quota) === pkg.value;

                return (
                  <button
                    key={pkg.plan}
                    type="button"
                    onClick={() => handleSelectPackage(pkg)}
                    className={`relative p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 shadow-xs ring-1 ring-blue-500/30'
                        : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/40 hover:border-neutral-300 dark:hover:border-neutral-600'
                    }`}
                  >
                    {pkg.popular && (
                      <span className="absolute -top-2 right-2 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-2xs">
                        ยอดนิยม
                      </span>
                    )}

                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-neutral-900 dark:text-white">
                          {pkg.plan}
                        </span>
                        {isSelected && <Check size={12} className="text-blue-600 dark:text-blue-400" />}
                      </div>
                      <div className="text-[13px] font-extrabold font-mono text-neutral-900 dark:text-white">
                        {pkg.label}
                      </div>
                    </div>

                    <div className="text-[10px] text-neutral-400 mt-2 truncate">
                      {pkg.price}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quota Input / Unlimited View */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-medium text-neutral-700 dark:text-neutral-300">
                โควต้าข้อความสูงสุดต่อเดือน (Monthly Quota) *
              </label>
              {isUnlimited ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                  <Infinity size={12} />
                  <span>ไม่จำกัดจำนวนแชต</span>
                </span>
              ) : null}
            </div>

            {isUnlimited ? (
              <div className="p-3.5 rounded-xl border border-purple-200 dark:border-purple-800/60 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-purple-950 dark:text-purple-200">
                      แพ็กเกจ Custom: ไม่จำกัดจำนวนแชต (Unlimited)
                    </div>
                    <div className="text-[11px] text-purple-700/80 dark:text-purple-300/80">
                      ระบบจะไม่จำกัดโควต้า และไม่มีการแจ้งเตือน 80% / 90%
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsUnlimited(false);
                    setQuota('50000');
                  }}
                  className="text-[11px] text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white underline cursor-pointer"
                >
                  กำหนดตัวเลขเอง
                </button>
              </div>
            ) : (
              <div>
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
                <p className="text-[11px] text-neutral-400 mt-1">
                  ระบบจะเริ่มแจ้งเตือนอัตโนมัติเมื่อใช้ถึง 80% ({Math.round(Number(quota || 0) * 0.8).toLocaleString()} ข้อความ) และ 90% ({Math.round(Number(quota || 0) * 0.9).toLocaleString()} ข้อความ)
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-[12px] font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition cursor-pointer"
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