import React, { useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GooThinkingProps {
  label?: string;
  className?: string;
  dotClassName?: string;
}

/**
 * DesignBookmark Motion — "Goo thinking"
 * Compact AI thinking status pill with metaball/gooey animated dots.
 * Uses a per-instance SVG filter ID (`useId`) and gracefully degrades
 * to a calm opacity pulse under `prefers-reduced-motion`.
 */
export const GooThinking: React.FC<GooThinkingProps> = ({
  label = 'Voxi думает',
  className,
  dotClassName = 'bg-slate-900',
}) => {
  const rawId = useId();
  const filterId = `goo-thinking-${rawId.replace(/:/g, '')}`;
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/95 border border-black/[0.08] shadow-xs text-xs font-medium text-slate-800',
        className
      )}
    >
      <svg className="sr-only" aria-hidden="true" width="0" height="0">
        <defs>
          <filter id={filterId}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.4" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      <span
        aria-hidden="true"
        className="relative inline-flex items-center justify-center w-9 h-4"
        style={prefersReducedMotion ? undefined : { filter: `url(#${filterId})` }}
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className={cn('w-2 h-2 rounded-full mx-[1.5px]', dotClassName)}
            animate={
              prefersReducedMotion
                ? { opacity: [0.4, 1, 0.4] }
                : {
                    x: i === 0 ? [0, 5, 0] : i === 2 ? [0, -5, 0] : [0, 0, 0],
                    scale: i === 1 ? [0.85, 1.25, 0.85] : [1, 0.8, 1],
                  }
            }
            transition={{
              repeat: Infinity,
              duration: prefersReducedMotion ? 1.8 : 1.15,
              ease: 'easeInOut',
              delay: i * 0.14,
            }}
          />
        ))}
      </span>

      <span>{label}</span>
    </div>
  );
};
