import React, { useState, useMemo, useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SlidingTabs } from './SlidingTabs';

type PeriodKey = 'week' | 'month' | 'year';

export interface StatSeries {
  valueLabel: string;
  deltaLabel: string;
  subtitle: string;
  points: number[];
}

interface StatCardProps {
  title: string;
  series: Record<PeriodKey, StatSeries>;
  className?: string;
}

function buildPaths(points: number[], width: number, height: number, padY = 10) {
  const safe = points.length >= 2 ? points : [0, 0];
  const min = Math.min(...safe);
  const max = Math.max(...safe);
  const span = Math.max(1, max - min);
  const stepX = width / (safe.length - 1);

  const coords = safe.map((val, i) => {
    const x = +(i * stepX).toFixed(1);
    const y = +(height - padY - ((val - min) / span) * (height - padY * 2)).toFixed(1);
    return { x, y };
  });

  const line = coords
    .map((c, i) => (i === 0 ? `M ${c.x} ${c.y}` : `L ${c.x} ${c.y}`))
    .join(' ');
  const area = `${line} L ${width} ${height} L 0 ${height} Z`;

  return { line, area };
}

/**
 * DesignBookmark Motion — "Stat card"
 * Revenue / calls metric card with smooth SVG area+line morphing across
 * Week / Month / Year timeframes.
 */
export const StatCard: React.FC<StatCardProps> = ({
  title,
  series,
  className,
}) => {
  const [period, setPeriod] = useState<PeriodKey>('month');
  const prefersReducedMotion = useReducedMotion();
  const rawId = useId();
  const gradId = `stat-grad-${rawId.replace(/:/g, '')}`;

  const active = series[period];
  const { line, area } = useMemo(
    () => buildPaths(active.points, 320, 88),
    [active.points]
  );

  return (
    <div
      className={cn(
        'p-6 sm:p-7 rounded-[24px] bg-[#F5F5F5] border border-black/[0.06] space-y-5',
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-[#737373]">
            {title}
          </div>
          <div className="flex items-baseline gap-2.5 mt-1.5">
            <span className="font-display text-3xl sm:text-4xl font-bold text-black tracking-[-0.04em] tabular-nums">
              {active.valueLabel}
            </span>
            <span className="font-mono text-[11px] font-semibold text-black bg-[#D8E738] px-2.5 py-0.5 rounded-full">
              {active.deltaLabel}
            </span>
          </div>
          <div className="text-[12px] text-[#525252] mt-1">{active.subtitle}</div>
        </div>

        <SlidingTabs<PeriodKey>
          ariaLabel="Период статистики"
          value={period}
          onChange={setPeriod}
          className="bg-black/[0.06] border-transparent self-start sm:self-auto"
          tabClassName="px-3.5 py-1.5 text-[12px]"
          activePillClassName="bg-white shadow-xs"
          options={[
            { value: 'week', label: 'Неделя' },
            { value: 'month', label: 'Месяц' },
            { value: 'year', label: 'Год' },
          ]}
        />
      </div>

      <div className="w-full h-24 overflow-hidden rounded-[16px] bg-white border border-black/[0.06] p-2">
        <svg
          viewBox="0 0 320 88"
          preserveAspectRatio="none"
          className="w-full h-full overflow-visible"
          role="img"
          aria-label={`График: ${title} (${active.valueLabel})`}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0A0A0A" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#0A0A0A" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          <motion.path
            d={area}
            fill={`url(#${gradId})`}
            animate={{ d: area }}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { duration: 0.45, ease: [0.16, 1, 0.3, 1] }
            }
          />
          <motion.path
            d={line}
            fill="none"
            stroke="#000000"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={{ d: line }}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { duration: 0.45, ease: [0.16, 1, 0.3, 1] }
            }
          />
        </svg>
      </div>
    </div>
  );
};
