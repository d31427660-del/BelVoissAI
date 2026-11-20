import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  PhoneCallingRoundedIcon,
  CalendarMarkIcon,
  CheckCircleIcon,
  SoundwaveCircleIcon,
  PauseIcon,
  PlayIcon,
} from '@solar-icons/react/bold-duotone';
import { cn } from '@/lib/utils';
import { MOTION_SPRINGS } from './springs';

interface IslandState {
  id: 'idle' | 'call' | 'booking' | 'telegram';
  badge: string;
  title: string;
  detail: string;
  accent: string;
  icon: React.ReactNode;
}

const ISLAND_STATES: IslandState[] = [
  {
    id: 'idle',
    badge: '24/7 онлайн',
    title: 'Voxi готов к звонкам',
    detail: 'Отклик 0.5 сек • МТС / А1',
    accent: 'bg-emerald-400',
    icon: <SoundwaveCircleIcon size={16} className="text-emerald-400" />,
  },
  {
    id: 'call',
    badge: 'Входящий звонок',
    title: '+375 (29) 614-••-82',
    detail: 'Анна отвечает • 00:18',
    accent: 'bg-sky-400',
    icon: <PhoneCallingRoundedIcon size={16} className="text-sky-400" />,
  },
  {
    id: 'booking',
    badge: 'YCLIENTS Sync',
    title: 'Запись подтверждена',
    detail: 'Сегодня 18:30 • Топ-мастер',
    accent: 'bg-violet-400',
    icon: <CalendarMarkIcon size={16} className="text-violet-400" />,
  },
  {
    id: 'telegram',
    badge: 'Лид в Telegram',
    title: 'Карточка отправлена',
    detail: 'Чек 75 BYN • + аудиозапись',
    accent: 'bg-emerald-400',
    icon: <CheckCircleIcon size={16} className="text-emerald-400" />,
  },
];

interface MorphIslandProps {
  className?: string;
}

/**
 * DesignBookmark Motion — "Morph island"
 * Dynamic Island-style status pill demonstrating the live Voxi call lifecycle:
 * Idle → Incoming call → YCLIENTS booking → Telegram lead.
 * Includes a visible pause/play control (WCAG 2.2.2) and manual step click.
 */
export const MorphIsland: React.FC<MorphIslandProps> = ({ className }) => {
  const [idx, setIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion || isPaused) return;
    const id = window.setInterval(() => {
      setIdx((prev) => (prev + 1) % ISLAND_STATES.length);
    }, 3400);
    return () => window.clearInterval(id);
  }, [isPaused, prefersReducedMotion]);

  const current = ISLAND_STATES[idx];

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <motion.div
        layout={!prefersReducedMotion}
        transition={MOTION_SPRINGS.pill}
        onClick={() => setIdx((prev) => (prev + 1) % ISLAND_STATES.length)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIdx((prev) => (prev + 1) % ISLAND_STATES.length);
          }
        }}
        aria-label={`Статус Voxi: ${current.badge} — ${current.title}. Нажмите, чтобы переключить этап`}
        className="inline-flex items-center gap-3 px-3.5 py-2 rounded-full bg-neutral-950 text-white border border-white/10 shadow-lg cursor-pointer select-none max-w-full"
      >
        <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
          {current.icon}
        </span>

        <div className="min-w-0 overflow-hidden pr-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={current.id}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col text-left leading-tight"
            >
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                <span className={cn('w-1.5 h-1.5 rounded-full', current.accent)} />
                {current.badge}
              </span>
              <span className="text-xs font-medium text-white truncate">
                {current.title}{' '}
                <span className="text-zinc-400 font-normal hidden sm:inline">
                  · {current.detail}
                </span>
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Step dots */}
        <span aria-hidden="true" className="hidden sm:flex items-center gap-1 pl-1">
          {ISLAND_STATES.map((st, i) => (
            <span
              key={st.id}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i === idx ? 'w-3.5 bg-white' : 'w-1.5 bg-white/25'
              )}
            />
          ))}
        </span>
      </motion.div>

      {!prefersReducedMotion && (
        <button
          type="button"
          onClick={() => setIsPaused((p) => !p)}
          aria-label={isPaused ? 'Возобновить переключение статусов' : 'Приостановить переключение статусов'}
          className="w-8 h-8 rounded-full bg-white/90 border border-slate-200 text-slate-700 hover:text-black hover:bg-white flex items-center justify-center shadow-xs transition-colors cursor-pointer shrink-0"
        >
          {isPaused ? <PlayIcon size={13} /> : <PauseIcon size={13} />}
        </button>
      )}
    </div>
  );
};
