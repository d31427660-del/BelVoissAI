import React, { useState, useEffect, useMemo } from 'react';
import { useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ReadAlongProps {
  text: string;
  /** When true, highlights words progressively at natural speech cadence */
  isActive: boolean;
  /** Approximate words per minute for Russian neural speech (default: 155) */
  wordsPerMinute?: number;
  className?: string;
}

/**
 * DesignBookmark Motion — "Read along"
 * Word-by-word highlighted reading progress synchronized with speech playback.
 * When idle or under `prefers-reduced-motion`, renders full crisp text.
 */
export const ReadAlong: React.FC<ReadAlongProps> = ({
  text,
  isActive,
  wordsPerMinute = 155,
  className,
}) => {
  const words = useMemo(() => text.split(/\s+/).filter(Boolean), [text]);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    try {
      const sel = typeof window !== 'undefined' ? window.getSelection() : null;
      if (sel && sel.rangeCount > 0) {
        sel.removeAllRanges();
      }
    } catch {
      // ignore selection cleanup errors
    }

    if (!isActive || prefersReducedMotion || words.length === 0) {
      setActiveIndex(-1);
      return;
    }

    setActiveIndex(0);
    const msPerWord = Math.max(180, Math.round(60000 / wordsPerMinute));
    const interval = window.setInterval(() => {
      setActiveIndex((prev) => {
        if (prev >= words.length - 1) {
          window.clearInterval(interval);
          return words.length - 1;
        }
        return prev + 1;
      });
    }, msPerWord);

    return () => window.clearInterval(interval);
  }, [isActive, text, words.length, wordsPerMinute, prefersReducedMotion]);

  if (!isActive || prefersReducedMotion || activeIndex < 0) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {words.map((word, idx) => {
        const isRead = idx <= activeIndex;
        const isCurrent = idx === activeIndex;
        return (
          <React.Fragment key={`${idx}-${word}`}>
            <span
              className={cn(
                'transition-colors duration-200 rounded-sm',
                isCurrent
                  ? 'text-slate-950 bg-amber-200/60 px-0.5'
                  : isRead
                  ? 'text-slate-950'
                  : 'text-slate-400'
              )}
            >
              {word}
            </span>
            {idx < words.length - 1 ? ' ' : ''}
          </React.Fragment>
        );
      })}
    </span>
  );
};
