import React, { useEffect, useRef } from 'react';

/**
 * Top Scroll Progress Hairline (#FE432A).
 * Uses native CSS Scroll-Driven Animation (`animation-timeline: scroll()`) where supported,
 * and falls back to a passive rAF scroll listener only when unsupported and motion is allowed.
 */
export const ScrollProgressBar: React.FC = () => {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !barRef.current) return;
    const prefersNoMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersNoMotion) return;

    // Native CSS Scroll-Driven Animation handles it on the compositor thread when supported
    if (typeof CSS !== 'undefined' && CSS.supports && CSS.supports('animation-timeline', 'scroll()')) {
      return;
    }

    let rafId = 0;
    const update = () => {
      rafId = 0;
      const el = barRef.current;
      if (!el) return;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
      el.style.transform = `scaleX(${ratio})`;
    };

    const onScroll = () => {
      if (!rafId) {
        rafId = window.requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  return <div ref={barRef} className="voxi-scroll-progress" aria-hidden="true" />;
};
