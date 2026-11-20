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
        'p-6 rounded-[24px] bg-[#F5F5F5] border border-black/[0.06] space-y-4',
        className
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <div className="font-display text-[17px] font-bold text-black tracking-tight">{title}</div>
          <div className="text-[12.5px] text-[#525252] mt-0.5">
            Осталось <strong className="text-black font-mono">{remaining} мин</strong> из{' '}
            <span className="font-mono">{totalMinutes} мин</span>
          </div>
        </div>
        <div className="text-[11px] font-mono font-semibold text-black bg-white border border-black/[0.08] px-3 py-1 rounded-full">
          {Math.min(100, Math.round((usedMinutes / safeTotal) * 100))}% использовано
        </div>
      </div>

      {/* Segmented progress rail */}
      <div className="h-3 w-full rounded-full bg-white border border-black/[0.06] overflow-hidden flex gap-0.5 p-0.5">
        {segments
          .filter((seg) => seg.minutes > 0)
          .map((seg) => {
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
      <div className="divide-y divide-black/[0.08]">
        {segments.map((seg) => {
          const isOpen = expandedId === seg.id;
          return (
            <div key={seg.id} className="py-2.5">
              <button
                type="button"
                onClick={() => setExpandedId(isOpen ? null : seg.id)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between gap-3 text-left py-1 cursor-pointer group"
              >
                <span className="flex items-center gap-2.5 text-[13px] font-medium text-black">
                  <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', seg.colorClass)} />
                  <span>{seg.label}</span>
                </span>
                <span className="flex items-center gap-2 text-[12px] font-mono text-[#525252]">
                  <span className="text-black font-semibold">{seg.minutes} мин</span>
                  <AltArrowDownIcon
                    size={14}
                    className={cn(
                      'text-[#737373] transition-transform duration-200',
                      isOpen && 'rotate-180 text-black'
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
                    <p className="pt-1.5 pb-1 pl-5 text-[12px] text-[#525252] leading-relaxed">
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
