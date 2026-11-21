import React, { useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { MOTION_SPRINGS } from './springs';

export interface SlidingTabOption<T extends string> {
  value: T;
  label: React.ReactNode;
}

interface SlidingTabsProps<T extends string> {
  options: Array<SlidingTabOption<T>>;
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
  className?: string;
  tabClassName?: string;
  activePillClassName?: string;
}

/**
 * DesignBookmark Motion — "Tab pill / Plan switch"
 * Segmented control with a spring-animated sliding pill indicator.
 * Uses compositor transforms via Framer Motion shared `layoutId` and
 * disables spatial sliding when `prefers-reduced-motion` is enabled.
 */
export function SlidingTabs<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
  tabClassName,
  activePillClassName,
}: SlidingTabsProps<T>) {
  const layoutId = useId();
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center p-1 rounded-full bg-slate-200/80 border border-slate-300/80',
        className
      )}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative z-10 min-h-[44px] sm:min-h-[38px] px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors cursor-pointer select-none inline-flex items-center justify-center',
              isActive
                ? 'text-slate-950'
                : 'text-slate-600 hover:text-slate-950',
              tabClassName
            )}
          >
            {isActive && (
              <motion.span
                layoutId={`sliding-pill-${layoutId}`}
                transition={
                  prefersReducedMotion ? { duration: 0 } : MOTION_SPRINGS.pill
                }
                aria-hidden="true"
                className={cn(
                  'absolute inset-0 -z-10 rounded-full bg-white shadow-xs',
                  activePillClassName
                )}
              />
            )}
            <span className="relative z-10">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
