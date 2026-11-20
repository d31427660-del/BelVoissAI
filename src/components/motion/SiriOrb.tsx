import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SiriOrbProps {
  state: 'idle' | 'listening' | 'thinking' | 'speaking' | 'muted';
  /** 0..100 live mic/audio amplitude */
  amplitude?: number;
  size?: number;
  children?: React.ReactNode;
  className?: string;
}

/**
 * DesignBookmark Motion (SmoothUI) — "Siri orb"
 * Glowing, fluidly morphing spherical AI voice orb that reacts to
 * idle / listening / thinking / speaking states and live amplitude.
 * Respects `prefers-reduced-motion`.
 */
export const SiriOrb: React.FC<SiriOrbProps> = ({
  state,
  amplitude = 0,
  size = 96,
  children,
  className,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const normalizedAmp = Math.min(1, Math.max(0, amplitude / 100));

  const dynamicScale =
    prefersReducedMotion
      ? 1
      : state === 'speaking'
      ? 1.07
      : state === 'listening'
      ? 1 + normalizedAmp * 0.14
      : state === 'thinking'
      ? 1.04
      : 1;

  const palette =
    state === 'muted'
      ? 'conic-gradient(from 0deg, #94a3b8, #cbd5e1, #64748b, #94a3b8)'
      : state === 'listening'
      ? 'conic-gradient(from 0deg, #10b981, #34d399, #0ea5e9, #10b981)'
      : state === 'thinking'
      ? 'conic-gradient(from 0deg, #6366f1, #38bdf8, #a855f7, #6366f1)'
      : state === 'speaking'
      ? 'conic-gradient(from 0deg, #2563eb, #10b981, #6366f1, #2563eb)'
      : 'conic-gradient(from 0deg, #1e293b, #334155, #0f172a, #1e293b)';

  return (
    <div
      style={{ width: size, height: size }}
      className={cn('relative inline-flex items-center justify-center rounded-full select-none', className)}
    >
      {/* Ambient aura */}
      <motion.span
        aria-hidden="true"
        animate={
          prefersReducedMotion
            ? { opacity: state === 'muted' ? 0.15 : 0.35 }
            : {
                scale: [dynamicScale, dynamicScale + 0.12, dynamicScale],
                opacity: state === 'muted' ? 0.15 : [0.35, 0.58, 0.35],
              }
        }
        transition={{
          repeat: Infinity,
          duration: state === 'thinking' ? 1.1 : 2.1,
          ease: 'easeInOut',
        }}
        style={{ background: palette }}
        className="absolute -inset-2 rounded-full blur-md pointer-events-none will-change-transform"
      />

      {/* Rotating liquid-gradient core */}
      <motion.span
        aria-hidden="true"
        animate={
          prefersReducedMotion
            ? { scale: 1 }
            : {
                rotate: 360,
                scale: dynamicScale,
              }
        }
        transition={{
          rotate: {
            repeat: Infinity,
            duration: state === 'thinking' ? 2.4 : state === 'speaking' ? 4.5 : 9,
            ease: 'linear',
          },
          scale: { duration: 0.18, ease: 'easeOut' },
        }}
        style={{ background: palette }}
        className="absolute inset-0 rounded-full shadow-lg will-change-transform"
      />

      {/* Specular glass highlight */}
      <span
        aria-hidden="true"
        className="absolute inset-[3px] rounded-full bg-gradient-to-tr from-black/20 via-transparent to-white/40 pointer-events-none"
      />

      {/* Center icon slot */}
      <span className="relative z-10 flex items-center justify-center text-white">
        {children}
      </span>
    </div>
  );
};
