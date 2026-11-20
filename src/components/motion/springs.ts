import type { Transition } from 'framer-motion';

/**
 * Shared spring physics presets inspired by DesignBookmark Motion
 * (https://designbookmark.com/motion)
 */
export const MOTION_SPRINGS = {
  /** Crisp UI pill / tab indicator transitions */
  pill: {
    type: 'spring',
    stiffness: 420,
    damping: 34,
    mass: 0.85,
  } satisfies Transition,

  /** Tactile magnetic button pull & release */
  magnetic: {
    stiffness: 260,
    damping: 18,
    mass: 0.55,
  },

  /** Editorial text roll transitions */
  roll: {
    type: 'spring',
    stiffness: 380,
    damping: 30,
    mass: 0.75,
  } satisfies Transition,

  /** Smooth panel reveal / crossfade */
  panel: {
    duration: 0.24,
    ease: [0.16, 1, 0.3, 1],
  } satisfies Transition,
} as const;
