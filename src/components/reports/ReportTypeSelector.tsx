import React from 'react';
import { Layers, DollarSign, Megaphone } from 'lucide-react';

export interface ReportTypeSelectorProps {
  reportType: 'overall' | 'finance' | 'marketing';
  onSelectType: (type: 'overall' | 'finance' | 'marketing') => void;
  language?: 'th' | 'en';
}

export default function ReportTypeSelector({
  reportType,
  onSelectType,
  language = 'th',
}: ReportTypeSelectorProps) {
  const types: Array<{
    id: 'overall' | 'finance' | 'marketing';
    title: string;
    desc: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'overall',
      title: language === 'th' ? 'รายงานภาพรวมระบบ' : 'Overall Operations',
      desc:
        language === 'th'
          ? 'ข้อมูลแชต สรุปประเด็น AI และระดับความด่วนครบทุกเคส'
          : 'Complete chat logs, AI triage summaries and urgency flags',
      icon: <Layers size={14} />,
    },
    {
      id: 'finance',
      title: language === 'th' ? 'รายงานธุรกรรมการเงิน' : 'Finance & Transactions',
      desc:
        language === 'th'
          ? 'คัดกรองเฉพาะเคสฝากเงิน ถอนเงิน บัญชีปลายทาง และยอดเงิน'
          : 'Filter deposit, withdrawal, slip verification and amounts',
      icon: <DollarSign size={14} />,
    },
    {
      id: 'marketing',
      title: language === 'th' ? 'รายงานการตลาดและลูกค้าใหม่' : 'Marketing & Leads',
      desc:
        language === 'th'
          ? 'วิเคราะห์ลูกค้าทักครั้งแรก สอบถามโปรโมชั่น และกลุ่ม VIP'
          : 'First-time inbound customers, promotional inquiries and VIPs',
      icon: <Megaphone size={14} />,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
      {types.map((t) => {
        const isSelected = reportType === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelectType(t.id)}
            className={`p-3.5 rounded-xl border text-left transition-colors cursor-pointer backdrop-blur-md ${
              isSelected
                ? 'bg-[#e8f0fe]/60 dark:bg-blue-950/30 border-[#1a73e8] dark:border-blue-500/60 shadow-xs'
                : 'bg-white/70 dark:bg-neutral-900/70 border-neutral-200/80 dark:border-neutral-800/80 hover:border-[#1a73e8]/40 dark:hover:border-blue-500/40 hover:shadow-sm shadow-xs'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <div
                className={`p-1.5 rounded-md transition-colors ${
                  isSelected
                    ? 'bg-[#1a73e8] text-white shadow-xs'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                }`}
              >
                {t.icon}
              </div>
              <span
                className={`font-medium text-xs ${
                  isSelected
                    ? 'text-[#1a73e8] dark:text-blue-300 font-semibold'
                    : 'text-neutral-700 dark:text-neutral-300'
                }`}
              >
                {t.title}
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-normal leading-relaxed">
              {t.desc}
            </p>
          </button>
        );
      })}
    </div>
  );
}
