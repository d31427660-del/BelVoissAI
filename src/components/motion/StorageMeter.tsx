import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { AltArrowDownIcon } from '@solar-icons/react/bold-duotone';
import { cn } from '@/lib/utils';
import { MOTION_SPRINGS } from './springs';

export interface StorageSegment {
  id: string;
  label: string;
  minutes: number;
  colorClass: string;
  detail: string;
}

interface StorageMeterProps {
  title: string;
  usedMinutes: number;
  totalMinutes: number;
  segments: StorageSegment[];
  className?: string;
}

/**
 * DesignBookmark Motion — "Storage meter"
 * Segmented minutes balance & consumption card with expandable breakdown
 * rows (by scenarios / call types).
 */
export const StorageMeter: React.FC<StorageMeterProps> = ({
  title,
  usedMinutes,
  totalMinutes,
  segments,
  className,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const safeTotal = Math.max(1, totalMinutes);
  const remaining = Math.max(0, totalMinutes - usedMinutes);

  return (
    <div
      className={cn(
        'p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4',
        className
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-slate-950">{title}</div>
          <div className="text-xs text-slate-500 mt-0.5">
            Осталось <strong className="text-slate-900 font-mono">{remaining} мин</strong> из{' '}
            <span className="font-mono">{totalMinutes} мин</span>
          </div>
        </div>
        <div className="text-xs font-mono font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
          {Math.min(100, Math.round((usedMinutes / safeTotal) * 100))}% использовано
        </div>
      </div>

      {/* Segmented progress rail */}
      <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden flex gap-0.5 p-0.5">
        {segments.map((seg) => {
          const pct = Math.min(100, Math.max(2, (seg.minutes / safeTotal) * 100));
          return (
            <motion.div
              key={seg.id}
              initial={prefersReducedMotion ? false : { scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={MOTION_SPRINGS.pill}
              style={{ width: `${pct}%`, originX: 0 }}
              title={`${seg.label}: ${seg.minutes} мин`}
              className={cn('h-full rounded-full will-change-transform', seg.colorClass)}
            />
          );
        })}
      </div>

      {/* Expandable rows */}
      <div className="divide-y divide-slate-100">
        {segments.map((seg) => {
          const isOpen = expandedId === seg.id;
          return (
            <div key={seg.id} className="py-2">
              <button
                type="button"
                onClick={() => setExpandedId(isOpen ? null : seg.id)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between gap-3 text-left py-1 cursor-pointer group"
              >
                <span className="flex items-center gap-2.5 text-xs font-medium text-slate-800 group-hover:text-slate-950">
                  <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', seg.colorClass)} />
                  <span>{seg.label}</span>
                </span>
                <span className="flex items-center gap-2 text-xs font-mono text-slate-600">
                  <span>{seg.minutes} мин</span>
                  <AltArrowDownIcon
                    size={14}
                    className={cn(
                      'text-slate-400 transition-transform duration-200',
                      isOpen && 'rotate-180 text-slate-900'
                    )}
                  />
                </span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={prefersReducedMotion ? false : { opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={prefersReducedMotion ? undefined : { opacity: 0, height: 0 }}
                    transition={MOTION_SPRINGS.panel}
                    className="overflow-hidden"
                  >
                    <p className="pt-1.5 pb-1 pl-5 text-[11px] text-slate-500 leading-relaxed">
                      {seg.detail}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};
