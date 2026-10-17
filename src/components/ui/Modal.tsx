'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  zIndex?: string;
  className?: string;
  headerClassName?: string;
}

const maxWidthMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  maxWidth = 'md',
  zIndex = 'z-50',
  className = '',
  headerClassName = '',
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 ${zIndex} flex items-center justify-center p-4 bg-transparent select-none`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl shadow-[0_25px_70px_-15px_rgba(0,0,0,0.35)] w-full overflow-hidden transition-all transform scale-100 ${maxWidthMap[maxWidth]} ${className}`}
      >
        {(title || icon) && (
          <div
            className={`p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-900/50 ${headerClassName}`}
          >
            <div className="flex items-center gap-3">
              {icon && (
                <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-955/20 text-indigo-600 dark:text-indigo-400 shrink-0">
                  {icon}
                </div>
              )}
              <div>
                {title && (
                  <h3 className="font-bold text-neutral-800 dark:text-neutral-100 text-base leading-tight">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="text-neutral-500 dark:text-neutral-400 text-xs mt-0.5 leading-relaxed">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        )}

        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
