import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { MOTION_SPRINGS } from './springs';

interface WordRollProps {
  words: string[];
  /** Rotation interval in ms (default: 2800) */
  intervalMs?: number;
  className?: string;
}

/**
 * DesignBookmark Motion — "Word roll"
 * Rotates words vertically with smooth spring roll & width transition,
 * keeping layout stable. Respects `prefers-reduced-motion` (static first word)
 * and pauses automatically on hover/focus (WCAG 2.2.2).
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
        'inline-flex relative overflow-hidden align-bottom',
        className
      )}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={current}
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={MOTION_SPRINGS.roll}
          className="inline-block whitespace-nowrap will-change-transform"
        >
          {current}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};
