'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  Link2, 
  Building2, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Plus, 
  HelpCircle,
  Hash
} from 'lucide-react';

interface LinkGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentCompanyId: string;
  companies: any[];
  isSystemAdmin: boolean;
}

export default function LinkGroupModal({
  isOpen,
  onClose,
  onSuccess,
  currentCompanyId,
  companies,
  isSystemAdmin,
}: LinkGroupModalProps) {
  const [unassignedGroups, setUnassignedGroups] = useState<any[]>([]);
  const [loadingUnassigned, setLoadingUnassigned] = useState(false);
  
  // Form fields
  const [selectedChatId, setSelectedChatId] = useState('');
  const [targetCompanyId, setTargetCompanyId] = useState(currentCompanyId || '');
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualChatId, setManualChatId] = useState('');
  const [manualGroupName, setManualGroupName] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setIsManualMode(false);
      setManualChatId('');
      setManualGroupName('');
      setSelectedChatId('');
      setTargetCompanyId(currentCompanyId || (companies[0]?.id || ''));
      fetchUnassigned();
    }
  }, [isOpen, currentCompanyId, companies]);

  const fetchUnassigned = async () => {
    setLoadingUnassigned(true);
    try {
      const res = await fetch('/api/telegram-groups?unassigned=true');
      const data = await res.json();
      if (res.ok && data.groups) {
        setUnassignedGroups(data.groups);
        if (data.groups.length > 0) {
          setSelectedChatId(data.groups[0].chat_id);
        } else {
          // If no unassigned groups, auto switch to manual mode
          setIsManualMode(true);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch unassigned groups:', err);
    } finally {
      setLoadingUnassigned(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const finalChatId = isManualMode ? manualChatId.trim() : selectedChatId;
    if (!finalChatId) {
      setErrorMsg('กรุณาเลือกกลุ่ม หรือระบุ Telegram Chat ID');
      return;
    }

    if (!targetCompanyId) {
      setErrorMsg('กรุณาเลือกบริษัทที่ต้องการผูกกลุ่ม');
      return;
    }

    setSubmitting(true);
    try {
      let groupName = manualGroupName.trim();
      if (!isManualMode) {
        const found = unassignedGroups.find((g) => g.chat_id === selectedChatId);
        groupName = found?.group_name || `กลุ่ม Telegram (${finalChatId})`;
      }

      const res = await fetch('/api/telegram-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: finalChatId,
          company_id: targetCompanyId,
          group_name: groupName || `กลุ่ม Telegram (${finalChatId})`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการผูกกลุ่ม');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'ไม่สามารถผูกกลุ่มได้');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in select-none">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden transition-all duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Link2 size={18} />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-neutral-900 dark:text-white">
                ผูกกลุ่ม Telegram กับบริษัท
              </h2>
              <p className="text-[12px] text-neutral-500 dark:text-neutral-400">
                เชื่อมต่อกลุ่มเพื่อเปิดใช้งาน AI Bot และสิทธิ์ผู้บริหาร
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* How it works Banner */}
          <div className="bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/50 rounded-xl p-3.5 flex items-start gap-2.5 text-[12px] text-blue-900 dark:text-blue-200">
            <HelpCircle size={16} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-blue-950 dark:text-blue-100">
                วิธีผูกกลุ่มอัตโนมัติ:
              </p>
              <p className="text-blue-800/80 dark:text-blue-300 text-[11px] leading-relaxed">
                1. เชิญบอท Telegram เข้ากลุ่มที่ต้องการ<br/>
                2. บอทจะบันทึกกลุ่มเข้าระบบเพื่อรอผูกกับบริษัทโดยอัตโนมัติ<br/>
                3. เลือกกลุ่มจากรายการด้านล่างเพื่อผูกกับบริษัทของคุณได้ทันที
              </p>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl p-3 flex items-center gap-2 text-rose-700 dark:text-rose-300 text-[12px]">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Target Company Selector */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
              <Building2 size={13} className="text-neutral-500" />
              <span>บริษัทผู้ใช้งาน (Target Company)</span>
            </label>
            <select
              value={targetCompanyId}
              onChange={(e) => setTargetCompanyId(e.target.value)}
              disabled={!isSystemAdmin && companies.length <= 1}
              className="w-full px-3 py-2 text-[13px] rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 disabled:bg-neutral-100 dark:disabled:bg-neutral-800/50 disabled:cursor-not-allowed cursor-pointer"
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.id === currentCompanyId ? '(บริษัทปัจจุบัน)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Group Selection Mode */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <Send size={13} className="text-neutral-500" />
                <span>กลุ่ม Telegram ที่ต้องการผูก</span>
              </label>

              <button
                type="button"
                onClick={() => setIsManualMode(!isManualMode)}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
              >
                {isManualMode ? '← เลือกจากกลุ่มที่ระบบตรวจพบล่าสุด' : '+ ระบุ Chat ID เอง'}
              </button>
            </div>

            {!isManualMode ? (
              <div>
                {loadingUnassigned ? (
                  <div className="flex items-center justify-center p-6 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50/50 dark:bg-neutral-800/30">
                    <Loader2 size={18} className="animate-spin text-neutral-400 mr-2" />
                    <span className="text-[12px] text-neutral-500">กำลังตรวจสอบกลุ่มใหม่...</span>
                  </div>
                ) : unassignedGroups.length > 0 ? (
                  <div className="space-y-2">
                    <select
                      value={selectedChatId}
                      onChange={(e) => setSelectedChatId(e.target.value)}
                      className="w-full px-3 py-2.5 text-[13px] rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer font-medium"
                    >
                      {unassignedGroups.map((g) => (
                        <option key={g.chat_id} value={g.chat_id}>
                          {g.group_name || 'กลุ่มไม่มีชื่อ'} (ID: {g.chat_id})
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      <span>พบบอทในกลุ่มใหม่ {unassignedGroups.length} กลุ่ม พร้อมให้กดผูกได้ทันที</span>
                    </p>
                  </div>
                ) : (
                  <div className="p-4 border border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl text-center space-y-2 bg-neutral-50/50 dark:bg-neutral-800/20">
                    <p className="text-[12px] text-neutral-500 dark:text-neutral-400">
                      ยังไม่พบกลุ่มใหม่ที่ยังไม่ได้ผูกในระบบ
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsManualMode(true)}
                      className="inline-flex items-center gap-1 text-[12px] text-blue-600 dark:text-blue-400 font-medium hover:underline"
                    >
                      <span>คลิกที่นี่เพื่อกรอก Chat ID ด้วยตนเอง</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 bg-neutral-50 dark:bg-neutral-800/40 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                    Telegram Chat ID (เช่น -5495142610) *
                  </label>
                  <div className="relative">
                    <Hash size={13} className="absolute left-3 top-3 text-neutral-400" />
                    <input
                      type="text"
                      required
                      placeholder="-5495142610"
                      value={manualChatId}
                      onChange={(e) => setManualChatId(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-[13px] rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                    ชื่อกลุ่ม (Group Name)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น กลุ่มผู้บริหาร สาขาหลัก"
                    value={manualGroupName}
                    onChange={(e) => setManualGroupName(e.target.value)}
                    className="w-full px-3 py-2 text-[13px] rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-[12px] font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition disabled:opacity-60 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <Link2 size={13} />
                  <span>ยืนยันการผูกกลุ่ม</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
