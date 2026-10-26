import React, { useState, useEffect } from 'react';
import {
  Building2,
  X,
  PackageCheck,
  UserPlus,
  Send,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Check,
  RefreshCw,
  ShieldCheck,
  Infinity as InfinityIcon,
  AlertCircle,
} from 'lucide-react';
import CompanyRegistrationSuccessView, {
  OnboardingSuccessData,
} from './CompanyRegistrationSuccessView';

interface AddCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  language?: 'th' | 'en';
}

interface PackageOption {
  id: 'starter' | 'pro' | 'enterprise' | 'custom';
  name: string;
  quota: number;
  quotaLabel: string;
  priceLabel: string;
  telegramAllowance: string;
  includesTelegram: boolean;
  popular?: boolean;
  description: string;
}

const PACKAGE_OPTIONS: PackageOption[] = [
  {
    id: 'starter',
    name: 'Starter',
    quota: 20000,
    quotaLabel: '20,000 แชต / เดือน',
    priceLabel: '฿8,000 / เดือน',
    telegramAllowance: 'ไม่รวม AI Telegram Bot',
    includesTelegram: false,
    description: 'เหมาะสำหรับธุรกิจเริ่มต้น คัดกรองแชตอัตโนมัติพร้อมแดชบอร์ดพื้นฐาน',
  },
  {
    id: 'pro',
    name: 'Pro',
    quota: 50000,
    quotaLabel: '50,000 แชต / เดือน',
    priceLabel: '฿15,000 / เดือน',
    telegramAllowance: 'รองรับ Telegram 1 กลุ่ม',
    includesTelegram: true,
    popular: true,
    description: 'แพ็กเกจยอดนิยม ครบทุกฟีเจอร์ AI Triage พร้อมแจ้งเตือนเคสด่วนเข้า Telegram',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    quota: 120000,
    quotaLabel: '120,000 แชต / เดือน',
    priceLabel: '฿28,000 / เดือน',
    telegramAllowance: 'รองรับ Telegram สูงสุด 3 กลุ่ม',
    includesTelegram: true,
    description: 'รองรับปริมาณแชตสูง แยกกลุ่มแจ้งเตือนตามแผนก พร้อมดูแลระดับองค์กร',
  },
  {
    id: 'custom',
    name: 'Custom',
    quota: -1,
    quotaLabel: 'ไม่จำกัดจำนวนแชต',
    priceLabel: 'ราคาตามตกลง',
    telegramAllowance: 'ไม่จำกัดกลุ่มแจ้งเตือน',
    includesTelegram: true,
    description: 'ออกแบบเฉพาะสำหรับองค์กรขนาดใหญ่ หรือใช้งานหลายแบรนด์แบบไร้ขีดจำกัด',
  },
];

function generateRandomPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `Sift@${suffix}`;
}

export default function AddCompanyModal({
  isOpen,
  onClose,
  onSuccess,
  language = 'th',
}: AddCompanyModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Company Profile
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [domainManuallyEdited, setDomainManuallyEdited] = useState(false);

  // Step 2: Package & Quota
  const [selectedPkgId, setSelectedPkgId] = useState<'starter' | 'pro' | 'enterprise' | 'custom'>('pro');

  // Step 3: Initial Admin User
  const [createAdminNow, setCreateAdminNow] = useState(true);
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState(() => generateRandomPassword());
  const [adminRole, setAdminRole] = useState<'admin' | 'staff'>('admin');

  // Step 4: Telegram Group Binding
  const [bindTelegramNow, setBindTelegramNow] = useState(false);
  const [telegramGroupName, setTelegramGroupName] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [unassignedGroups, setUnassignedGroups] = useState<any[]>([]);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<OnboardingSuccessData | null>(null);

  const selectedPackage =
    PACKAGE_OPTIONS.find((p) => p.id === selectedPkgId) || PACKAGE_OPTIONS[1];

  // Fetch unassigned telegram groups when modal opens
  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/telegram-groups?unassigned=true')
      .then((res) => res.json())
      .then((data) => {
        if (data?.groups && Array.isArray(data.groups)) {
          setUnassignedGroups(data.groups);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    setStep(1);
    setName('');
    setDomain('');
    setDomainManuallyEdited(false);
    setSelectedPkgId('pro');
    setCreateAdminNow(true);
    setAdminName('');
    setAdminEmail('');
    setAdminPassword(generateRandomPassword());
    setAdminRole('admin');
    setBindTelegramNow(false);
    setTelegramGroupName('');
    setTelegramChatId('');
    setErrorMsg(null);
    setSuccessData(null);
    onClose();
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!domainManuallyEdited) {
      const suggested = val
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 20);
      if (suggested) {
        setDomain(suggested);
      }
    }
  };

  const goToNextStep = () => {
    setErrorMsg(null);
    if (step === 1) {
      if (!name.trim() || !domain.trim()) {
        setErrorMsg('กรุณาระบุชื่อบริษัทและรหัสโดเมน (Domain Identifier) ให้ครบถ้วน');
        return;
      }
      // Pre-fill default admin name & email if empty
      const cleanDom = domain.toLowerCase().trim().replace(/[^a-z0-9-_]/g, '');
      if (!adminName.trim()) {
        setAdminName(`ผู้ดูแลระบบ (${name.trim()})`);
      }
      if (!adminEmail.trim() && cleanDom) {
        setAdminEmail(`admin@${cleanDom}.com`);
      }
      if (!telegramGroupName.trim()) {
        setTelegramGroupName(`${name.trim()} - AI Triage Alert`);
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      if (createAdminNow) {
        if (!adminEmail.trim() || !adminPassword.trim()) {
          setErrorMsg('กรุณาระบุชื่อบัญชี/อีเมล และรหัสผ่านของแอดมิน หรือเลือก "ข้ามไปสร้างภายหลัง"');
          return;
        }
      }
      setStep(4);
    }
  };

  const handleCompleteOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (bindTelegramNow && !telegramChatId.trim()) {
      setErrorMsg('กรุณาระบุ Telegram Chat ID หรือเลือก "ยังไม่ต้องผูกกลุ่มในตอนนี้"');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        name: name.trim(),
        domain: domain.trim(),
        monthly_quota: selectedPackage.quota,
        package_name: selectedPackage.name,
      };

      if (createAdminNow && adminEmail.trim() && adminPassword.trim()) {
        payload.admin_user = {
          name: adminName.trim() || `Admin (${name.trim()})`,
          email: adminEmail.trim(),
          password: adminPassword.trim(),
          role: adminRole,
        };
      }

      if (bindTelegramNow && telegramChatId.trim()) {
        payload.telegram_group = {
          group_name: telegramGroupName.trim() || `${name.trim()} - Alert Group`,
          chat_id: telegramChatId.trim(),
        };
      }

      const res = await fetch('/api/companies/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการสร้างบริษัท');
      }

      setSuccessData(data);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const stepsMeta = [
    { num: 1, title: 'ข้อมูลบริษัท', icon: Building2 },
    { num: 2, title: 'เลือกแพ็กเกจ', icon: PackageCheck },
    { num: 3, title: 'สร้างแอดมิน', icon: UserPlus },
    { num: 4, title: 'ผูก Telegram', icon: Send },
  ];

  return (
    <div className="fixed inset-0 bg-neutral-950/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/70 dark:bg-neutral-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Building2 size={20} />
            </div>
            <div>
              <h2 className="font-extrabold text-sm sm:text-base text-neutral-900 dark:text-white">
                {successData
                  ? 'ใบส่งมอบระบบบริษัทใหม่ (Customer Handover Kit)'
                  : 'สร้างและส่งมอบบริษัทใหม่ทีละขั้นตอน (Company Onboarding Wizard)'}
              </h2>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                {successData
                  ? 'สรุปข้อมูลทั้งหมดสำหรับส่งมอบให้ลูกค้าเริ่มใช้งานได้ทันที'
                  : `ขั้นตอนที่ ${step} จาก 4 • ตั้งค่าระบบครบวงจรในที่เดียว`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1.5 rounded-lg transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stepper Progress Bar (Hidden once completed) */}
        {!successData && (
          <div className="px-6 py-3 bg-neutral-100/60 dark:bg-neutral-950/50 border-b border-neutral-200/80 dark:border-neutral-800/80">
            <div className="grid grid-cols-4 gap-2">
              {stepsMeta.map((s) => {
                const Icon = s.icon;
                const isActive = step === s.num;
                const isDone = step > s.num;
                return (
                  <button
                    key={s.num}
                    type="button"
                    onClick={() => {
                      if (s.num < step) {
                        setErrorMsg(null);
                        setStep(s.num as 1 | 2 | 3 | 4);
                      }
                    }}
                    disabled={s.num > step}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left transition ${
                      isActive
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                        : isDone
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 cursor-pointer hover:bg-emerald-500/15'
                        : 'bg-white/60 dark:bg-neutral-900/50 text-neutral-400 dark:text-neutral-500 border-neutral-200/70 dark:border-neutral-800 cursor-not-allowed'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-extrabold shrink-0 ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : isDone
                          ? 'bg-emerald-500 text-white'
                          : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'
                      }`}
                    >
                      {isDone ? <Check size={13} /> : s.num}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold truncate leading-tight">
                        {s.title}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {successData ? (
            <CompanyRegistrationSuccessView
              successData={successData}
              onClose={handleClose}
              onSuccess={onSuccess}
              language={language}
            />
          ) : (
            <form onSubmit={handleCompleteOnboarding} className="space-y-5 text-xs">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-300 flex items-center gap-2 text-xs font-semibold">
                  <AlertCircle size={16} className="shrink-0 text-rose-500" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* ==================== STEP 1: ข้อมูลบริษัท ==================== */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block font-bold text-neutral-700 dark:text-neutral-300 text-xs">
                      ชื่อบริษัท / องค์กรลูกค้า (Company Name) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="เช่น บริษัท สยามเทค จำกัด หรือ Siam Tech Co., Ltd."
                      className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-neutral-900 dark:text-white text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-bold text-neutral-700 dark:text-neutral-300 text-xs">
                      รหัสโดเมนประจำบริษัท (Domain Identifier) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={domain}
                      onChange={(e) => {
                        setDomainManuallyEdited(true);
                        setDomain(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''));
                      }}
                      placeholder="เช่น siamtech (ภาษาอังกฤษพิมพ์เล็กหรือตัวเลข ห้ามเว้นวรรค)"
                      className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm"
                    />
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      ใช้สำหรับสร้างรหัส <code className="font-mono">Client ID</code> และแยกพื้นที่ข้อมูล (Multi-Tenant Isolation) ของลูกค้าแต่ละรายออกจากกัน
                    </p>
                  </div>

                  {/* Preview of Auto-Provisioned Resources */}
                  <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-800/50 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-indigo-700 dark:text-indigo-300 text-xs">
                      <Sparkles size={15} />
                      <span>สิ่งที่ระบบจะเตรียมให้อัตโนมัติเมื่อสร้างบริษัท:</span>
                    </div>
                    <ul className="space-y-1 text-[11px] text-neutral-600 dark:text-neutral-300 pl-5 list-disc">
                      <li>สร้างรหัสความปลอดภัย <b>Client ID</b> และ <b>Client Secret</b> เฉพาะบริษัท</li>
                      <li>สร้างหมวดหมู่คัดกรองพื้นฐาน 3 หมวดหมู่ (สอบถามทั่วไป, แจ้งปัญหาระบบ, การชำระเงิน)</li>
                      <li>ผูกโควต้าแพ็กเกจ บัญชีแอดมิน และกลุ่มแจ้งเตือน Telegram พร้อมใบสรุปส่งมอบลูกค้า</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* ==================== STEP 2: เลือกแพ็กเกจ ==================== */}
              {step === 2 && (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-neutral-900 dark:text-white text-sm">
                        เลือกแพ็กเกจและโควต้าข้อความรายเดือน
                      </h3>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        กำหนดโควต้าเริ่มต้นให้บริษัท <b>{name}</b> (สามารถปรับเปลี่ยนภายหลังได้ที่เมนูโควต้าการใช้งาน)
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PACKAGE_OPTIONS.map((pkg) => {
                      const isSelected = selectedPkgId === pkg.id;
                      return (
                        <div
                          key={pkg.id}
                          onClick={() => setSelectedPkgId(pkg.id)}
                          className={`p-4 rounded-2xl border-2 transition cursor-pointer relative flex flex-col justify-between ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 dark:border-indigo-500 shadow-md'
                              : 'border-neutral-200 dark:border-neutral-800 hover:border-indigo-300 dark:hover:border-neutral-700 bg-white dark:bg-neutral-850'
                          }`}
                        >
                          {pkg.popular && (
                            <span className="absolute -top-2.5 right-3 px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-extrabold shadow-sm">
                              ยอดนิยม (แนะนำ)
                            </span>
                          )}

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-sm text-neutral-900 dark:text-white">
                                {pkg.name}
                              </span>
                              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                {pkg.priceLabel}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 font-extrabold text-base text-emerald-600 dark:text-emerald-400">
                              {pkg.quota === -1 && <InfinityIcon size={18} />}
                              <span>{pkg.quotaLabel}</span>
                            </div>

                            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                              {pkg.description}
                            </p>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-neutral-200/70 dark:border-neutral-800 flex items-center justify-between text-[11px]">
                            <span
                              className={`font-semibold ${
                                pkg.includesTelegram
                                  ? 'text-sky-600 dark:text-sky-400'
                                  : 'text-neutral-400 dark:text-neutral-500'
                              }`}
                            >
                              • {pkg.telegramAllowance}
                            </span>
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                                isSelected
                                  ? 'bg-indigo-600 border-indigo-600 text-white'
                                  : 'border-neutral-300 dark:border-neutral-700'
                              }`}
                            >
                              {isSelected && <Check size={12} />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ==================== STEP 3: สร้างแอดมินลูกค้า ==================== */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800">
                    <div className="space-y-0.5">
                      <div className="font-bold text-neutral-900 dark:text-white text-xs">
                        สร้างบัญชีผู้ดูแลคนแรกให้ลูกค้าทันที (Company Admin)
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        สร้าง Username และรหัสผ่านสำหรับให้ลูกค้าล็อกอินเข้าดูเฉพาะข้อมูลของบริษัทตนเอง
                      </div>
                    </div>
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={createAdminNow}
                        onChange={(e) => setCreateAdminNow(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all relative peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {createAdminNow ? (
                    <div className="space-y-3.5 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="space-y-1.5">
                          <label className="block font-bold text-neutral-700 dark:text-neutral-300">
                            ชื่อผู้ดูแลระบบ (Display Name) <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={adminName}
                            onChange={(e) => setAdminName(e.target.value)}
                            placeholder={`ผู้ดูแลระบบ (${name})`}
                            className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl font-semibold text-neutral-900 dark:text-white"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block font-bold text-neutral-700 dark:text-neutral-300">
                            ระดับสิทธิ์ในบริษัท (Role)
                          </label>
                          <select
                            value={adminRole}
                            onChange={(e) => setAdminRole(e.target.value as 'admin' | 'staff')}
                            className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl font-bold text-neutral-900 dark:text-white"
                          >
                            <option value="admin">Company Admin (ผู้ดูแลประจำบริษัท)</option>
                            <option value="staff">Staff (เจ้าหน้าที่ปฏิบัติการ)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="space-y-1.5">
                          <label className="block font-bold text-neutral-700 dark:text-neutral-300">
                            อีเมล หรือ ชื่อผู้ใช้สำหรับเข้าสู่ระบบ <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={adminEmail}
                            onChange={(e) => setAdminEmail(e.target.value)}
                            placeholder={`admin@${domain || 'company'}.com`}
                            className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl font-mono font-bold text-indigo-600 dark:text-indigo-400"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="block font-bold text-neutral-700 dark:text-neutral-300">
                              รหัสผ่านเริ่มต้น (Password) <span className="text-rose-500">*</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => setAdminPassword(generateRandomPassword())}
                              className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <RefreshCw size={10} />
                              <span>สุ่มรหัสผ่านใหม่</span>
                            </button>
                          </div>
                          <input
                            type="text"
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl font-mono font-bold text-amber-600 dark:text-amber-400"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-lg">
                        <ShieldCheck size={14} className="shrink-0" />
                        <span>
                          รหัสผ่านจะถูกเข้ารหัสด้วย <b>bcrypt</b> ลงฐานข้อมูล และแสดงในใบส่งมอบขั้นตอนสุดท้ายเพื่อให้คัดลอกส่งให้ลูกค้า
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400">
                      ข้ามการสร้างบัญชีผู้ดูแลในขั้นตอนนี้ (สามารถเพิ่มผู้ใช้งานภายหลังได้ที่เมนู <b>จัดการผู้ใช้งาน</b>)
                    </div>
                  )}
                </div>
              )}

              {/* ==================== STEP 4: ผูกกลุ่มแจ้งเตือน Telegram ==================== */}
              {step === 4 && (
                <div className="space-y-4">
                  {selectedPackage.id === 'starter' && (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 flex items-center gap-2 text-[11px] font-semibold">
                      <AlertCircle size={15} className="shrink-0 text-amber-500" />
                      <span>
                        หมายเหตุ: แพ็กเกจ <b>Starter (20,000 แชต)</b> ตามมาตรฐานไม่รวม AI Telegram Bot คุณสามารถข้ามขั้นตอนนี้ได้ทันที
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800">
                    <div className="space-y-0.5">
                      <div className="font-bold text-neutral-900 dark:text-white text-xs">
                        ผูกกลุ่มแจ้งเตือนเคสด่วน Telegram ตอนนี้เลยหรือไม่?
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        หากลูกค้าเชิญบอทเข้ากลุ่ม Telegram แล้ว สามารถเลือกผูกหรือใส่ Chat ID ได้ทันที (หรือข้ามไปผูกทีหลังได้)
                      </div>
                    </div>
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bindTelegramNow}
                        onChange={(e) => setBindTelegramNow(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all relative peer-checked:bg-sky-600"></div>
                    </label>
                  </div>

                  {bindTelegramNow ? (
                    <div className="space-y-3.5 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                      {unassignedGroups.length > 0 && (
                        <div className="space-y-1.5">
                          <label className="block font-bold text-sky-600 dark:text-sky-400 text-[11px]">
                            เลือกจากกลุ่มที่รอผูกในระบบ (Unassigned Telegram Groups):
                          </label>
                          <select
                            onChange={(e) => {
                              const g = unassignedGroups.find(
                                (item) => String(item.chat_id) === e.target.value
                              );
                              if (g) {
                                setTelegramChatId(String(g.chat_id));
                                setTelegramGroupName(g.group_name || `${name} - Alert`);
                              }
                            }}
                            defaultValue=""
                            className="w-full px-3 py-2 bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-xl font-bold text-neutral-800 dark:text-neutral-200"
                          >
                            <option value="">-- เลือกกลุ่มที่บอทเข้าแล้ว หรือกรอก Chat ID ด้านล่าง --</option>
                            {unassignedGroups.map((g: any) => (
                              <option key={g.chat_id} value={String(g.chat_id)}>
                                {g.group_name || 'กลุ่มไม่มีชื่อ'} (Chat ID: {g.chat_id})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="space-y-1.5">
                          <label className="block font-bold text-neutral-700 dark:text-neutral-300">
                            ชื่อกลุ่มแจ้งเตือน Telegram <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={telegramGroupName}
                            onChange={(e) => setTelegramGroupName(e.target.value)}
                            placeholder={`${name} - AI Triage Alert`}
                            className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl font-semibold text-neutral-900 dark:text-white"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block font-bold text-neutral-700 dark:text-neutral-300">
                            Telegram Chat ID <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={telegramChatId}
                            onChange={(e) => setTelegramChatId(e.target.value)}
                            placeholder="เช่น -1001234567890"
                            className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl font-mono font-bold text-sky-600 dark:text-sky-400"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 text-center rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400">
                      ยังไม่ต้องผูกกลุ่ม Telegram ในตอนนี้ (สามารถผูกภายหลังเมื่อบอทเข้ากลุ่มลูกค้าแล้วได้ที่เมนู <b>กลุ่มแจ้งเตือน Telegram</b>)
                    </div>
                  )}

                  {/* Quick Pre-Flight Review Box before creating */}
                  <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-800/50 space-y-1.5">
                    <div className="text-[11px] font-extrabold text-indigo-700 dark:text-indigo-300">
                      สรุปข้อมูลก่อนยืนยันการสร้างบริษัท:
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-700 dark:text-neutral-300">
                      <div>
                        • <b>บริษัท:</b> {name} (<code className="font-mono">{domain}</code>)
                      </div>
                      <div>
                        • <b>แพ็กเกจ:</b> {selectedPackage.name} ({selectedPackage.quotaLabel})
                      </div>
                      <div>
                        • <b>บัญชีแอดมิน:</b>{' '}
                        {createAdminNow ? adminEmail : 'ข้ามไปสร้างภายหลัง'}
                      </div>
                      <div>
                        • <b>Telegram:</b>{' '}
                        {bindTelegramNow ? telegramChatId : 'ผูกภายหลัง'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ==================== WIZARD FOOTER NAVIGATION ==================== */}
              <div className="flex items-center justify-between pt-3 border-t border-neutral-200 dark:border-neutral-800">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg(null);
                      setStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
                    }}
                    className="px-4 py-2.5 rounded-xl font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                    <span>ย้อนกลับ</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2.5 rounded-xl font-bold text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                )}

                {step < 4 ? (
                  <button
                    type="button"
                    onClick={goToNextStep}
                    className="px-5 py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
                  >
                    <span>ถัดไป (ขั้นตอนที่ {step + 1}/4)</span>
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-2 shadow-lg shadow-emerald-600/25 disabled:opacity-50 cursor-pointer"
                  >
                    <Sparkles size={16} />
                    <span>
                      {submitting
                        ? 'กำลังจัดตั้งบริษัทและเตรียมใบส่งมอบ...'
                        : 'ยืนยันและสร้างบริษัทใหม่'}
                    </span>
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
