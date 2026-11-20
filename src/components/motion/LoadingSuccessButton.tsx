import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { CheckCircleIcon } from '@solar-icons/react/bold-duotone';
import { cn } from '@/lib/utils';
import { MOTION_SPRINGS } from './springs';

interface LoadingSuccessButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  status: 'idle' | 'loading' | 'success';
  idleLabel: React.ReactNode;
  loadingLabel?: string;
  successLabel?: string;
}

/**
 * DesignBookmark Motion — "Loading to success"
 * Submit button that smoothly transitions from idle label → spinner →
 * success checkmark confirmation without layout jank.
 */
export const LoadingSuccessButton: React.FC<LoadingSuccessButtonProps> = ({
  status,
  idleLabel,
  loadingLabel = 'Обработка…',
  successLabel = 'Готово',
  className,
  disabled,
  type = 'button',
  ...rest
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <button
      type={type}
      disabled={disabled || status === 'loading'}
      aria-busy={status === 'loading'}
      className={cn(
        'relative inline-flex items-center justify-center overflow-hidden rounded-full font-medium transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed',
        status === 'success' && 'bg-emerald-600 hover:bg-emerald-600 text-white',
        className
      )}
      {...rest}
    >
      <AnimatePresence mode="wait" initial={false}>
        {status === 'loading' ? (
          <motion.span
            key="loading"
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.85 }}
            transition={MOTION_SPRINGS.panel}
            className="inline-flex items-center justify-center gap-2"
          >
            <span
              aria-hidden="true"
              className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin"
            />
            <span>{loadingLabel}</span>
          </motion.span>
        ) : status === 'success' ? (
          <motion.span
            key="success"
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.8 }}
            transition={MOTION_SPRINGS.pill}
            className="inline-flex items-center justify-center gap-2"
          >
            <CheckCircleIcon size={18} />
            <span>{successLabel}</span>
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6 }}
            transition={MOTION_SPRINGS.panel}
            className="inline-flex items-center justify-center gap-2"
          >
            {idleLabel}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
};
