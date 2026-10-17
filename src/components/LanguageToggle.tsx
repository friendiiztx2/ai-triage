'use client';

import { useLanguage } from './LanguageContext';

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex bg-neutral-200/60 dark:bg-neutral-800 p-0.5 rounded-lg border border-neutral-200/80 dark:border-neutral-700/80 select-none">
      <button
        onClick={() => setLanguage('th')}
        className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium cursor-pointer transition-colors ${
          language === 'th'
            ? 'bg-[#e8f0fe] dark:bg-blue-950/60 text-[#1a73e8] dark:text-blue-300 shadow-2xs font-semibold'
            : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
        }`}
      >
        TH
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium cursor-pointer transition-colors ${
          language === 'en'
            ? 'bg-[#e8f0fe] dark:bg-blue-950/60 text-[#1a73e8] dark:text-blue-300 shadow-2xs font-semibold'
            : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
        }`}
      >
        EN
      </button>
    </div>
  );
}
