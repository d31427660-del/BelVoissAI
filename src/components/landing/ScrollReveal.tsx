import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
}

/**
 * Editorial scroll-entry wrapper.
 * - On browsers supporting CSS `animation-timeline: view()` + `animation-range: entry`,
 *   animation runs purely on the compositor thread via `.voxi-scroll-reveal`.
 * - On older browsers, falls back to IntersectionObserver without hiding content before mount
 *   or when `prefers-reduced-motion: reduce` is enabled.
 */
export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className,
  delayMs = 0,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === 'undefined') return;

    const allowsMotion = window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
    if (!allowsMotion) return;

    const supportsNativeViewTimeline =
      typeof CSS !== 'undefined' &&
      CSS.supports &&
      CSS.supports('(animation-timeline: view()) and (animation-range: entry)');

    if (supportsNativeViewTimeline) return;

    // Already inside or above viewport on load: keep visible immediately
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92) return;

    el.classList.add('voxi-io-pending');
    if (delayMs > 0) {
      el.style.transitionDelay = `${delayMs}ms`;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.remove('voxi-io-pending');
            el.classList.add('voxi-io-visible');
            observer.unobserve(el);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delayMs]);

  return (
    <div ref={ref} className={cn('voxi-scroll-reveal', className)}>
      {children}
    </div>
  );
};
