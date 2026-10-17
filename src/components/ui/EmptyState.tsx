import React from 'react';
import { Inbox } from 'lucide-react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="p-4 rounded-3xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 mb-4 shadow-inner">
        {icon || <Inbox size={32} />}
      </div>
      <h3 className="font-extrabold text-neutral-800 dark:text-neutral-200 text-base mb-1 font-display">
        {title}
      </h3>
      {description && (
        <p className="text-xs text-neutral-400 dark:text-neutral-500 max-w-sm font-medium mb-6">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
