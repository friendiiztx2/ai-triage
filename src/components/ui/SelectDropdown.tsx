'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

export interface SelectDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  menuClassName?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  align?: 'left' | 'right';
  'aria-label'?: string;
}

export default function SelectDropdown({
  value,
  onChange,
  options,
  placeholder = 'เลือก...',
  className = '',
  menuClassName = '',
  disabled = false,
  size = 'sm',
  icon,
  align = 'left',
  'aria-label': ariaLabel,
}: SelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; right: number; width: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const updatePosition = useCallback(() => {
    if (!containerRef.current || typeof window === 'undefined') return;
    const rect = containerRef.current.getBoundingClientRect();
    setCoords({
      top: rect.bottom + 6,
      left: rect.left,
      right: window.innerWidth - rect.right,
      width: rect.width,
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        (!menuRef.current || !menuRef.current.contains(target))
      ) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, updatePosition]);

  const sizeClasses = size === 'sm'
    ? 'px-2.5 py-1.5 text-xs'
    : 'px-3 py-2 text-xs sm:text-sm';

  const dropdownMenu =
    isOpen && coords && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={menuRef}
            role="listbox"
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: align === 'right' ? undefined : `${coords.left}px`,
              right: align === 'right' ? `${coords.right}px` : undefined,
              minWidth: `${coords.width}px`,
              zIndex: 99999,
            }}
            className={`w-max max-w-xs bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-xl shadow-[0_16px_40px_-4px_rgba(0,0,0,0.22)] p-1.5 space-y-0.5 animate-scale-in max-h-64 overflow-y-auto ${menuClassName}`}
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#e8f0fe] text-[#1a73e8] dark:bg-blue-950/70 dark:text-[#8ab4f8] font-semibold'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100/80 dark:hover:bg-neutral-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                    <span className="truncate">{opt.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {opt.badge && <span>{opt.badge}</span>}
                    {isSelected && (
                      <Check size={14} className="text-[#1a73e8] dark:text-[#8ab4f8] shrink-0 stroke-[2.5]" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>,
          document.body
        )
      : null;

  return (
    <div ref={containerRef} className={`relative inline-block text-left w-full ${isOpen ? 'z-[100]' : 'z-auto'}`}>
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => {
          if (disabled) return;
          if (!isOpen) updatePosition();
          setIsOpen((prev) => !prev);
        }}
        className={`w-full flex items-center justify-between gap-1.5 rounded-lg border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50/80 dark:hover:bg-neutral-800/80 focus:outline-none focus:border-[#1a73e8]/70 dark:focus:border-[#8ab4f8]/70 shadow-2xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses} ${className}`}
      >
        <div className="flex items-center gap-1.5 truncate">
          {icon && <span className="text-neutral-400 shrink-0">{icon}</span>}
          {selectedOption ? (
            <span className="truncate font-medium flex items-center gap-1.5">
              {selectedOption.icon}
              {selectedOption.label}
            </span>
          ) : (
            <span className="text-neutral-400 dark:text-neutral-500 truncate font-normal">
              {placeholder}
            </span>
          )}
        </div>
        <ChevronDown
          size={14}
          className={`text-neutral-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-neutral-600 dark:text-neutral-300' : ''
          }`}
        />
      </button>

      {dropdownMenu}
    </div>
  );
}
