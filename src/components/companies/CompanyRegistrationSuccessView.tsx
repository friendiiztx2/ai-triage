import React, { useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Check,
  Building2,
  PackageCheck,
  UserCheck,
  Send,
  KeyRound,
  AlertTriangle,
} from 'lucide-react';

export interface OnboardingSuccessData {
  id: string;
  name: string;
  domain: string;
  client_id: string;
  client_secret: string;
  monthly_quota?: number;
  package_name?: string;
  package_badge?: string;
  is_unlimited?: boolean;
  admin_created?: boolean;
  admin_user?: {
    name: string;
    email: string;
    password?: string;
    role: string;
  } | null;
  telegram_bound?: boolean;
  telegram_group?: {
    group_name: string;
    chat_id: string;
  } | null;
  warnings?: string[];
}

interface CompanyRegistrationSuccessViewProps {
  successData: OnboardingSuccessData;
  onClose: () => void;
  onSuccess: () => void;
  language?: 'th' | 'en';
}

export default function CompanyRegistrationSuccessView({
  successData,
  onClose,
  onSuccess,
  language = 'th',
}: CompanyRegistrationSuccessViewProps) {
  const [copiedHandover, setCopiedHandover] = useState(false);
  const [copiedApi, setCopiedApi] = useState(false);

  const originUrl =
    typeof window !== 'undefined' ? window.location.origin : 'https://sift-ai-demo.vercel.app';

  const quotaDisplay =
    successData.is_unlimited || successData.monthly_quota === -1
      ? 'ไม่จำกัดจำนวนแชต (Unlimited)'
      : `${(successData.monthly_quota || 50000).toLocaleString()} แชต / เดือน`;

  const pkgName = successData.package_name || 'Pro';

  const buildHandoverMessage = () => {
    const lines = [
      `🎉 ใบส่งมอบระบบ Sift AI Customer Triage & Back Office`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🏢 บริษัท: ${successData.name} (${successData.domain})`,
      `📦 แพ็กเกจ: ${pkgName} (โควต้า ${quotaDisplay})`,
      `🌐 ลิงก์เข้าใช้งานระบบ (Back Office): ${originUrl}/login`,
      ``,
    ];

    if (successData.admin_created && successData.admin_user) {
      lines.push(
        `👤 บัญชีผู้ดูแลระบบ (Company Admin):`,
        `• ชื่อผู้ใช้งาน: ${successData.admin_user.name}`,
        `• อีเมล / ชื่อบัญชีเข้าสู่ระบบ: ${successData.admin_user.email}`,
        `• รหัสผ่านเริ่มต้น: ${successData.admin_user.password || '-'}`,
        `*(แนะนำให้เปลี่ยนรหัสผ่านหลังเข้าสู่ระบบครั้งแรก)*`,
        ``
      );
    } else {
      lines.push(
        `👤 บัญชีผู้ดูแลระบบ: ยังไม่ได้สร้างในขั้นตอนนี้ (สามารถเพิ่มได้ที่เมนูจัดการผู้ใช้งาน)`,
        ``
      );
    }

    if (successData.telegram_bound && successData.telegram_group) {
      lines.push(
        `✈️ กลุ่มแจ้งเตือน Telegram AI Bot:`,
        `• ชื่อกลุ่ม: ${successData.telegram_group.group_name}`,
        `• Telegram Chat ID: ${successData.telegram_group.chat_id}`,
        `• สถานะ: เชื่อมต่อและพร้อมแจ้งเตือนเคสเร่งด่วนแล้ว`,
        ``
      );
    } else {
      lines.push(
        `✈️ กลุ่มแจ้งเตือน Telegram: ยังไม่ได้ผูกกลุ่ม (สามารถผูกภายหลังได้ที่เมนูกลุ่มแจ้งเตือน Telegram)`,
        ``
      );
    }

    lines.push(
      `🔑 ข้อมูลสำหรับเชื่อมต่อระบบ API / Webhook:`,
      `• Client ID: ${successData.client_id}`,
      `• Client Secret: ${successData.client_secret}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
    );

    return lines.join('\n');
  };

  const handleCopyHandover = () => {
    navigator.clipboard.writeText(buildHandoverMessage());
    setCopiedHandover(true);
    setTimeout(() => setCopiedHandover(false), 2500);
  };

  const handleCopyApiOnly = () => {
    navigator.clipboard.writeText(
      `Company: ${successData.name} (${successData.domain})\nClient ID: ${successData.client_id}\nClient Secret: ${successData.client_secret}`
    );
    setCopiedApi(true);
    setTimeout(() => setCopiedApi(false), 2500);
  };

  return (
    <div className="space-y-4 text-xs select-text">
      {/* Header Banner */}
      <div className="flex flex-col items-center text-center gap-1.5 pb-1">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
          <CheckCircle2 size={28} />
        </div>
        <h3 className="font-extrabold text-neutral-900 dark:text-white text-base">
          {language === 'th'
            ? 'จัดตั้งบริษัทและเตรียมระบบส่งมอบสำเร็จ!'
            : 'Company Onboarding Completed!'}
        </h3>
        <p className="text-neutral-500 dark:text-neutral-400 text-[11px] max-w-md">
          {language === 'th'
            ? 'ระบบได้สร้างพื้นที่บริษัท ตั้งค่าโควต้าหมวดหมู่เริ่มต้น และเตรียมใบสรุปสำหรับส่งมอบให้ลูกค้าเรียบร้อยแล้ว'
            : 'Company workspace, quota, default categories, and handover summary are ready.'}
        </p>
      </div>

      {/* Warnings if any partial step had an issue */}
      {successData.warnings && successData.warnings.length > 0 && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 space-y-1">
          {successData.warnings.map((w, idx) => (
            <div key={idx} className="flex items-center gap-2 text-[11px] font-medium">
              <AlertTriangle size={14} className="shrink-0 text-amber-500" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Handover Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* 1. Company Profile */}
        <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/40 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">
            <Building2 size={13} />
            <span>1. ข้อมูลบริษัท (Company)</span>
          </div>
          <div className="font-extrabold text-neutral-900 dark:text-white text-sm truncate">
            {successData.name}
          </div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
            Domain: <span className="text-neutral-700 dark:text-neutral-300 font-semibold">{successData.domain}</span>
          </div>
        </div>

        {/* 2. Package & Monthly Quota */}
        <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/40 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
            <PackageCheck size={13} />
            <span>2. แพ็กเกจโควต้า (Package)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 font-extrabold text-xs border border-emerald-500/30">
              {pkgName}
            </span>
            <span className="font-bold text-neutral-800 dark:text-neutral-200 text-xs">
              {quotaDisplay}
            </span>
          </div>
          <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
            สร้างหมวดหมู่คัดกรองพื้นฐาน 3 หมวดหมู่แล้ว
          </div>
        </div>

        {/* 3. Initial Admin Account */}
        <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/40 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase">
            <UserCheck size={13} />
            <span>3. บัญชีแอดมินลูกค้า (Admin)</span>
          </div>
          {successData.admin_created && successData.admin_user ? (
            <div className="space-y-0.5 text-[11px]">
              <div className="font-bold text-neutral-900 dark:text-white truncate">
                {successData.admin_user.name}
              </div>
              <div className="text-neutral-600 dark:text-neutral-300 font-mono truncate">
                User: <span className="font-bold text-indigo-600 dark:text-indigo-400">{successData.admin_user.email}</span>
              </div>
              <div className="text-neutral-600 dark:text-neutral-300 font-mono">
                Pass: <span className="font-bold text-amber-600 dark:text-amber-400">{successData.admin_user.password}</span>
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-neutral-400 dark:text-neutral-500 pt-1">
              ข้ามขั้นตอนนี้ (สร้างภายหลังได้ที่เมนูจัดการผู้ใช้งาน)
            </div>
          )}
        </div>

        {/* 4. Telegram Bot Binding */}
        <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/40 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase">
            <Send size={13} />
            <span>4. กลุ่มแจ้งเตือน Telegram</span>
          </div>
          {successData.telegram_bound && successData.telegram_group ? (
            <div className="space-y-0.5 text-[11px]">
              <div className="font-bold text-neutral-900 dark:text-white truncate">
                {successData.telegram_group.group_name}
              </div>
              <div className="text-neutral-500 dark:text-neutral-400 font-mono">
                Chat ID: <span className="text-sky-600 dark:text-sky-400 font-bold">{successData.telegram_group.chat_id}</span>
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-neutral-400 dark:text-neutral-500 pt-1">
              ยังไม่ผูกกลุ่ม (ผูกภายหลังได้ที่เมนูกลุ่มแจ้งเตือน Telegram)
            </div>
          )}
        </div>
      </div>

      {/* Security API Credentials Box */}
      <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100/70 dark:bg-neutral-950/60 space-y-2 font-mono">
        <div className="flex items-center justify-between font-sans">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">
            <KeyRound size={12} />
            <span>API Integration Credentials</span>
          </div>
          <button
            type="button"
            onClick={handleCopyApiOnly}
            className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            {copiedApi ? <Check size={11} /> : <Copy size={11} />}
            {copiedApi ? 'คัดลอก API Key แล้ว' : 'คัดลอกเฉพาะ API Key'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
          <div className="p-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800">
            <span className="block text-[9px] text-neutral-400 uppercase font-sans font-bold">
              Client ID
            </span>
            <span className="font-bold text-neutral-800 dark:text-neutral-200 break-all">
              {successData.client_id}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800">
            <span className="block text-[9px] text-neutral-400 uppercase font-sans font-bold">
              Client Secret
            </span>
            <span className="font-bold text-rose-600 dark:text-rose-400 break-all">
              {successData.client_secret}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
        <button
          type="button"
          onClick={handleCopyHandover}
          className={`flex-1 py-3 px-4 rounded-xl font-bold transition flex items-center justify-center gap-2 cursor-pointer border ${
            copiedHandover
              ? 'bg-emerald-600 text-white border-emerald-500'
              : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/70 dark:text-indigo-300 dark:border-indigo-800'
          }`}
        >
          {copiedHandover ? <Check size={16} /> : <Copy size={16} />}
          <span>
            {copiedHandover
              ? 'คัดลอกข้อความใบส่งมอบลูกค้าเรียบร้อยแล้ว!'
              : 'คัดลอกใบส่งมอบลูกค้า (พร้อมส่งทางแชต/อีเมล)'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            onClose();
            onSuccess();
          }}
          className="sm:w-36 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl font-bold transition cursor-pointer shadow-lg shadow-indigo-600/20"
        >
          {language === 'th' ? 'เสร็จสิ้น' : 'Done'}
        </button>
      </div>
    </div>
  );
}
