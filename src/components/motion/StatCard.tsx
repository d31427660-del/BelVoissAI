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
        'p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4',
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-medium text-slate-500">{title}</div>
          <div className="flex items-baseline gap-2.5 mt-1">
            <span className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight tabular-nums">
              {active.valueLabel}
            </span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
              {active.deltaLabel}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">{active.subtitle}</div>
        </div>

        <SlidingTabs<PeriodKey>
          ariaLabel="Период статистики"
          value={period}
          onChange={setPeriod}
          className="bg-slate-100 border-slate-200/80 self-start sm:self-auto"
          tabClassName="px-3 py-1 text-xs sm:text-xs"
          options={[
            { value: 'week', label: 'Неделя' },
            { value: 'month', label: 'Месяц' },
            { value: 'year', label: 'Год' },
          ]}
        />
      </div>

      <div className="w-full h-24 overflow-hidden">
        <svg
          viewBox="0 0 320 88"
          preserveAspectRatio="none"
          className="w-full h-full overflow-visible"
          role="img"
          aria-label={`График: ${title} (${active.valueLabel})`}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.24" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
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
            stroke="#059669"
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
