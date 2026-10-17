import React from 'react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'indigo' | 'emerald' | 'rose' | 'amber' | 'purple';
  trend?: {
    value: string;
    isUp?: boolean;
  };
  onClick?: () => void;
}

const variantStyles: Record<string, { bg: string; text: string; border: string; iconBg: string }> = {
  default: {
    bg: 'bg-white dark:bg-neutral-900',
    text: 'text-neutral-800 dark:text-neutral-100',
    border: 'border-neutral-200 dark:border-neutral-800',
    iconBg: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400',
  },
  indigo: {
    bg: 'bg-indigo-50/30 dark:bg-indigo-950/20',
    text: 'text-indigo-900 dark:text-indigo-200',
    border: 'border-indigo-100 dark:border-indigo-900/40',
    iconBg: 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400',
  },
  emerald: {
    bg: 'bg-emerald-50/30 dark:bg-emerald-950/20',
    text: 'text-emerald-900 dark:text-emerald-200',
    border: 'border-emerald-100 dark:border-emerald-900/40',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400',
  },
  rose: {
    bg: 'bg-rose-50/30 dark:bg-rose-950/20',
    text: 'text-rose-900 dark:text-rose-200',
    border: 'border-rose-100 dark:border-rose-900/40',
    iconBg: 'bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400',
  },
  amber: {
    bg: 'bg-amber-50/30 dark:bg-amber-950/20',
    text: 'text-amber-900 dark:text-amber-200',
    border: 'border-amber-100 dark:border-amber-900/40',
    iconBg: 'bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400',
  },
  purple: {
    bg: 'bg-purple-50/30 dark:bg-purple-950/20',
    text: 'text-purple-900 dark:text-purple-200',
    border: 'border-purple-100 dark:border-purple-900/40',
    iconBg: 'bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-400',
  },
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  variant = 'default',
  trend,
  onClick,
}: StatCardProps) {
  const styles = variantStyles[variant] || variantStyles.default;

  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-2xl border ${styles.bg} ${styles.border} shadow-sm transition-all ${
        onClick ? 'cursor-pointer hover:shadow-md hover:scale-[1.01]' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
          {title}
        </span>
        {icon && (
          <div className={`p-2 rounded-xl ${styles.iconBg} shrink-0`}>
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className={`text-2xl font-black ${styles.text} font-display tracking-tight`}>
          {value}
        </span>
        {trend && (
          <span
            className={`text-xs font-extrabold ${
              trend.isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {trend.isUp ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-medium mt-1">
          {subtitle}
        </p>
      )}
    </div>
  );
}
