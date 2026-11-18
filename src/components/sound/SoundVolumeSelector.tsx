import React from 'react';

export const VOLUME_LEVELS = [
  { label: 'เบา', pct: '50%', val: 0.5 },
  { label: 'กลาง', pct: '75%', val: 0.75 },
  { label: 'ดัง', pct: '100%', val: 1.0 },
  { label: 'ดังสุด', pct: '150%', val: 1.5 },
];

interface SoundVolumeSelectorProps {
  volumeLevel: number;
  onSelectVolume: (volume: number) => void;
}

/** Four volume steps as one segmented control */
export default function SoundVolumeSelector({ volumeLevel, onSelectVolume }: SoundVolumeSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 block">ความดัง</label>
      <div className="grid grid-cols-4 gap-0.5 p-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/70 dark:border-neutral-700/60">
        {VOLUME_LEVELS.map((vol) => {
          const isActive = volumeLevel === vol.val;
          return (
            <button
              key={vol.val}
              type="button"
              aria-pressed={isActive}
              onClick={() => onSelectVolume(vol.val)}
              className={`py-1.5 rounded-lg text-xs transition text-center cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-neutral-900 text-brand-700 dark:text-brand-300 font-semibold shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              {vol.label} <span className="text-neutral-400 font-normal">{vol.pct}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
