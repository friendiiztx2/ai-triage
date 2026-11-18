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
    title: 'ไซเรนฉุกเฉิน',
    desc: 'เสียงสูงสลับจังหวะ ชัดที่สุด',
    icon: ShieldAlert,
  },
  {
    id: 'dual_chime',
    title: 'เสียงสองโทน',
    desc: 'กังวานใส ฟังสบาย',
    icon: Music,
  },
  {
    id: 'radar_pulse',
    title: 'เรดาร์เตือนถี่',
    desc: 'บี๊บสั้น 4 จังหวะ',
    icon: Radio,
  },
  {
    id: 'emergency_horn',
    title: 'แตรฉุกเฉิน',
    desc: 'เสียงต่ำ ก้องทั้งห้อง',
    icon: Megaphone,
  },
];

interface SoundToneSelectorProps {
  selectedTone: string;
  onSelectTone: (toneId: string) => void;
}

/** Four tones as a 2×2 grid of compact cards; picking one plays it */
export default function SoundToneSelector({ selectedTone, onSelectTone }: SoundToneSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 block">โทนเสียง</label>

      <div className="grid grid-cols-2 gap-2">
        {TONE_OPTIONS.map((tone) => {
          const Icon = tone.icon;
          const isSelected = selectedTone === tone.id;
          return (
            <button
              key={tone.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelectTone(tone.id)}
              className={`relative flex items-center gap-2 p-2 rounded-lg border text-left transition cursor-pointer min-w-0 ${
                isSelected
                  ? 'border-brand-600 bg-brand-50/60 dark:bg-brand-955/30 ring-1 ring-brand-600/20'
                  : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-white dark:bg-neutral-900'
              }`}
            >
              <div
                className={`p-1.5 rounded-lg shrink-0 ${
                  isSelected ? 'bg-brand-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                }`}
              >
                <Icon size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <span
                  className={`block font-semibold text-xs truncate ${
                    isSelected ? 'text-brand-700 dark:text-brand-200' : 'text-neutral-800 dark:text-neutral-200'
                  }`}
                >
                  {tone.title}
                </span>
                <span className="block text-xs text-neutral-400 truncate">{tone.desc}</span>
              </div>
              {isSelected && <Check size={14} className="shrink-0 text-brand-600 dark:text-brand-400" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
