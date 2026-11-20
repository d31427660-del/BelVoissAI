import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { MOTION_SPRINGS } from './springs';

export interface StackNotificationItem {
  id: string;
  channel: string;
  time: string;
  title: string;
  body: string;
  accentClass: string;
  icon: React.ReactNode;
}

interface NotificationStackProps {
  items: StackNotificationItem[];
  className?: string;
}

/**
 * DesignBookmark Motion (Kokonut UI) — "Notification stack"
 * Interactive stacked alert cards (Telegram lead, YCLIENTS booking, client SMS)
 * that fan out smoothly on click.
 */
export const NotificationStack: React.FC<NotificationStackProps> = ({
  items,
  className,
}) => {
  const [expanded, setExpanded] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-slate-900 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Живые уведомления после звонка</span>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs font-medium text-slate-600 hover:text-slate-950 transition-colors cursor-pointer"
        >
          {expanded ? 'Свернуть стопку' : `Показать все (${items.length})`}
        </button>
      </div>

      <div
        className="relative"
        style={{
          minHeight: expanded ? undefined : `${84 + Math.max(0, items.length - 1) * 14}px`,
        }}
      >
        <div className={cn(expanded ? 'space-y-2.5' : 'relative')}>
          {items.map((item, idx) => {
            const offsetY = expanded ? 0 : idx * 12;
            const scale = expanded ? 1 : 1 - idx * 0.04;
            const opacity = expanded ? 1 : Math.max(0.55, 1 - idx * 0.18);

            return (
              <motion.div
                key={item.id}
                layout={!prefersReducedMotion}
                onClick={() => !expanded && setExpanded(true)}
                animate={
                  prefersReducedMotion
                    ? undefined
                    : {
                        y: offsetY,
                        scale,
                        opacity,
                      }
                }
                transition={MOTION_SPRINGS.pill}
                style={{
                  zIndex: items.length - idx,
                }}
                className={cn(
                  'rounded-xl bg-white border border-slate-200/90 p-3.5 shadow-sm transition-shadow will-change-transform',
                  !expanded && idx > 0 && 'absolute inset-x-0 top-0 pointer-events-none',
                  !expanded && idx === 0 && 'relative cursor-pointer hover:shadow-md'
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                      item.accentClass
                    )}
                  >
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-slate-900 truncate">
                        {item.channel}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {item.time}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-slate-800 mt-0.5 truncate">
                      {item.title}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-2">
                      {item.body}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
