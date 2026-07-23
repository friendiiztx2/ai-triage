'use client';

import { useLanguage } from './LanguageContext';

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex bg-slate-200/80 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-300 dark:border-slate-700 shadow-inner select-none backdrop-blur-sm">
      <button
        onClick={() => setLanguage('th')}
        className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition-all duration-200 ${
          language === 'th'
            ? 'bg-indigo-600 text-white shadow-md transform scale-105'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
        }`}
      >
        TH
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition-all duration-200 ${
          language === 'en'
            ? 'bg-indigo-600 text-white shadow-md transform scale-105'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
        }`}
      >
        EN
      </button>
    </div>
  );
}
