import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface CompanyRegistrationSuccessViewProps {
  successData: {
    id: string;
    name: string;
    domain: string;
    client_id: string;
    client_secret: string;
  };
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
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(language === 'th' ? 'คัดลอกข้อมูลความปลอดภัยสำเร็จแล้ว' : 'Security credentials copied successfully');
  };

  return (
    <div className="space-y-5 text-xs text-center py-2 select-text">
      <div className="flex flex-col items-center gap-2">
        <CheckCircle2 size={44} className="text-emerald-500 animate-bounce" />
        <h3 className="font-extrabold text-neutral-800 dark:text-neutral-100 text-sm font-display">
          {language === 'th' ? 'จัดตั้งบริษัทสำเร็จแล้ว!' : 'Company Provisioned Successfully!'}
        </h3>
        <p className="text-neutral-500 dark:text-neutral-400 text-[10px]">
          {language === 'th'
            ? 'โปรดคัดลอกข้อมูลความปลอดภัยเหล่านี้ไปตั้งค่า API Integration ของระบบปลายทาง'
            : 'Please copy these security credentials to configure API integrations for your target system.'}
        </p>
      </div>

      <div className="space-y-3.5 border border-neutral-200 dark:border-neutral-800 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-850 text-left font-mono">
        <div className="space-y-1">
          <span className="block text-[9px] font-bold text-neutral-400 uppercase font-sans">
            Company Name / Domain
          </span>
          <span className="block font-bold text-neutral-800 dark:text-neutral-200 text-xs">
            {successData.name} ({successData.domain})
          </span>
        </div>

        <div className="space-y-1 border-t border-neutral-200 dark:border-neutral-800 pt-2.5">
          <span className="block text-[9px] font-bold text-neutral-400 uppercase font-sans">
            Client ID
          </span>
          <span className="block font-bold text-neutral-800 dark:text-neutral-200 text-xs">
            {successData.client_id}
          </span>
        </div>

        <div className="space-y-1 border-t border-neutral-200 dark:border-neutral-800 pt-2.5">
          <span className="block text-[9px] font-bold text-neutral-400 uppercase font-sans">
            Client Secret
          </span>
          <span className="block font-bold text-rose-600 dark:text-rose-400 text-xs">
            {successData.client_secret}
          </span>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={() =>
            copyToClipboard(
              `Company Name: ${successData.name}\nDomain: ${successData.domain}\nClient ID: ${successData.client_id}\nClient Secret: ${successData.client_secret}`
            )
          }
          className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-200 py-2.5 rounded-xl font-bold transition cursor-pointer"
        >
          {language === 'th' ? 'คัดลอกข้อมูลทั้งหมด' : 'Copy All Credentials'}
        </button>
        <button
          onClick={() => {
            onClose();
            onSuccess();
          }}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold transition cursor-pointer"
        >
          {language === 'th' ? 'เสร็จสิ้น' : 'Done'}
        </button>
      </div>
    </div>
  );
}
