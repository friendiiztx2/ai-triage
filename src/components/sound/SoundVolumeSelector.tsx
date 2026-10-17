import React from 'react';

export const VOLUME_LEVELS = [
  { label: 'เบา (50%)', val: 0.5 },
  { label: 'ปานกลาง (75%)', val: 0.75 },
  { label: 'ดังชัด (100%)', val: 1.0 },
  { label: 'ดังที่สุด (150%)', val: 1.5 },
];

interface SoundVolumeSelectorProps {
  volumeLevel: number;
  onSelectVolume: (volume: number) => void;
}

export default function SoundVolumeSelector({ volumeLevel, onSelectVolume }: SoundVolumeSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block">
        🔊 ปรับระดับความดังเสียง
      </label>
      <div className="grid grid-cols-4 gap-2">
        {VOLUME_LEVELS.map((vol) => {
          const isActive = volumeLevel === vol.val;
          return (
            <button
              key={vol.val}
              type="button"
              onClick={() => onSelectVolume(vol.val)}
              className={`py-2 px-2 rounded-xl text-xs font-medium border transition text-center cursor-pointer ${
                isActive
                  ? 'bg-[#1a73e8] text-white border-[#1a73e8] shadow-xs'
                  : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
              }`}
            >
              {vol.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
