import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { MOTION_SPRINGS } from './springs';

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  /** Maximum pull distance in pixels on X/Y axes (default: 7) */
  strength?: number;
  /** Disable magnetic tracking */
  disabled?: boolean;
}

/**
 * DesignBookmark Motion — "Magnetic button"
 * Gently attracts the CTA toward the cursor using spring physics.
 * Automatically disables spatial movement for touch/coarse pointers
 * and when `prefers-reduced-motion: reduce` is active.
 */
export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  className,
  strength = 7,
  disabled = false,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  const springX = useSpring(rawX, MOTION_SPRINGS.magnetic);
  const springY = useSpring(rawY, MOTION_SPRINGS.magnetic);

  const isFinePointer = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(pointer: fine)').matches;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || prefersReducedMotion || !ref.current || !isFinePointer()) {
      return;
    }
    const rect = ref.current.getBoundingClientRect();
    const relX = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const relY = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);

    rawX.set(Math.max(-1, Math.min(1, relX)) * strength);
    rawY.set(Math.max(-1, Math.min(1, relY)) * strength);
  };

  const handleMouseLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  if (prefersReducedMotion) {
    return <div className={cn('inline-flex', className)}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      className={cn('inline-flex will-change-transform', className)}
    >
      {children}
    </motion.div>
  );
};
