import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface WordRollProps {
  words: string[];
  /** Rotation interval in ms (default: 2800) */
  intervalMs?: number;
  className?: string;
}

/**
 * DesignBookmark Motion — "Word roll"
 * Rotates phrases vertically inside a clipped, fixed-line-height container
 * with zero vertical layout shift and no descender clipping.
 * Respects `prefers-reduced-motion` (static first phrase) and pauses on hover.
 */
export const WordRoll: React.FC<WordRollProps> = ({
  words,
  intervalMs = 2800,
  className,
}) => {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion || isPaused || words.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [words.length, intervalMs, prefersReducedMotion, isPaused]);

  const current = words[index % words.length] ?? '';

  if (prefersReducedMotion) {
    return <span className={cn('inline-block', className)}>{words[0] ?? ''}</span>;
  }

  return (
    <span
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={cn(
        'inline-flex relative overflow-hidden align-bottom py-[0.08em] -my-[0.08em]',
        className
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={current}
          initial={{ y: '105%', opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          exit={{ y: '-105%', opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block whitespace-nowrap will-change-transform"
        >
          {current}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};
