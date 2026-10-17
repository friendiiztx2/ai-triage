import React from 'react';
import { ShieldAlert, Music, Radio, Megaphone, Check } from 'lucide-react';

export interface ToneOption {
  id: string;
  title: string;
  desc: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

export const TONE_OPTIONS: ToneOption[] = [
  {
    id: 'siren',
    title: '🚨 ไซเรนเตือนฉุกเฉิน (Digital Siren)',
    desc: 'เสียงสังเคราะห์ความถี่สูงสลับจังหวะ ชัดเจนสะดุดตาที่สุด',
    icon: ShieldAlert,
  },
  {
    id: 'dual_chime',
    title: '🎵 เสียงสองโทน (Dual Chime)',
    desc: 'เสียงชิเมะสองโทนกังวานใส นุ่มนวลฟังสบาย',
    icon: Music,
  },
  {
    id: 'radar_pulse',
    title: '📡 เรดาร์เตือนถี่ (Radar Pulse)',
    desc: 'เสียงบี๊บเรดาร์สัญญาณ 4 จังหวะเตือนสั้นถี่',
    icon: Radio,
  },
  {
    id: 'emergency_horn',
    title: '📢 แตรฉุกเฉิน (Emergency Horn)',
    desc: 'เสียงแตรเตือนภัยความถี่ต่ำก้องกังวานในห้องทำงาน',
    icon: Megaphone,
  },
];

interface SoundToneSelectorProps {
  selectedTone: string;
  onSelectTone: (toneId: string) => void;
}

export default function SoundToneSelector({ selectedTone, onSelectTone }: SoundToneSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block">
        🎵 เลือกรูปแบบโทนเสียง
      </label>

      <div className="grid grid-cols-1 gap-2.5">
        {TONE_OPTIONS.map((tone) => {
          const Icon = tone.icon;
          const isSelected = selectedTone === tone.id;
          return (
            <button
              key={tone.id}
              type="button"
              onClick={() => onSelectTone(tone.id)}
              className={`flex items-start gap-3 p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                isSelected
                  ? 'border-[#1a73e8] bg-[#e8f0fe]/60 dark:bg-blue-955/30 text-[#1a73e8] dark:text-blue-100 ring-2 ring-[#1a73e8]/20'
                  : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300'
              }`}
            >
              <div
                className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                  isSelected ? 'bg-[#1a73e8] text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                }`}
              >
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">{tone.title}</span>
                  {isSelected && <Check size={14} className="text-[#1a73e8] dark:text-blue-400 font-extrabold" />}
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">{tone.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
