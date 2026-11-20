import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StreamingReplyProps {
  text: string;
  /** Animate streaming only for newly arrived latest assistant turn */
  animateStream?: boolean;
  className?: string;
}

/**
 * DesignBookmark Motion — "Streaming reply"
 * Smooth token-by-token reveal for AI assistant dialogue turns.
 * Respects `prefers-reduced-motion` by displaying full text immediately.
 */
export const StreamingReply: React.FC<StreamingReplyProps> = ({
  text,
  animateStream = true,
  className,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [visibleChars, setVisibleChars] = useState<number>(
    animateStream && !prefersReducedMotion ? 0 : text.length
  );

  useEffect(() => {
    if (!animateStream || prefersReducedMotion) {
      setVisibleChars(text.length);
      return;
    }

    setVisibleChars(0);
    const step = Math.max(2, Math.ceil(text.length / 26));
    const timer = window.setInterval(() => {
      setVisibleChars((prev) => {
        if (prev + step >= text.length) {
          window.clearInterval(timer);
          return text.length;
        }
        return prev + step;
      });
    }, 22);

    return () => window.clearInterval(timer);
  }, [text, animateStream, prefersReducedMotion]);

  const isStreaming = visibleChars < text.length;

  return (
    <motion.span
      initial={prefersReducedMotion ? false : { opacity: 0.7 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={cn('inline', className)}
    >
      {text.slice(0, visibleChars)}
      {isStreaming && (
        <span
          aria-hidden="true"
          className="inline-block w-[2px] h-[0.95em] bg-slate-900 ml-0.5 align-middle animate-pulse"
        />
      )}
    </motion.span>
  );
};
