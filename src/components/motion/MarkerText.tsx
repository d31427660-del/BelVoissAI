import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MarkerTextProps {
  children: React.ReactNode;
  colorClass?: string;
  className?: string;
}

/**
 * DesignBookmark Motion (Kokonut UI) — "Marker text"
 * Editorial highlighter sweep behind key metrics / phrases using
 * compositor-friendly `scaleX` triggered on viewport entry.
 */
export const MarkerText: React.FC<MarkerTextProps> = ({
  children,
  colorClass = 'bg-amber-300/45',
  className,
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <span className={cn('relative inline-block px-1 -mx-0.5', className)}>
      <motion.span
        aria-hidden="true"
        initial={prefersReducedMotion ? { scaleX: 1 } : { scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { duration: 0.55, ease: [0.22, 1, 0.36, 1] }
        }
        style={{ originX: 0 }}
        className={cn(
          'absolute inset-x-0 bottom-0.5 h-[42%] rounded-sm -z-0 pointer-events-none will-change-transform',
          colorClass
        )}
      />
      <span className="relative z-10">{children}</span>
    </span>
  );
};
