import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { MicrophoneIcon as Mic, Microphone2Icon as MicOff } from '@solar-icons/react/bold-duotone';
import { cn } from '@/lib/utils';

interface VoiceInputButtonProps {
  isListening: boolean;
  isMuted: boolean;
  isBotSpeaking?: boolean;
  durationSeconds?: number;
  audioLevel?: number;
  onClick: () => void;
  className?: string;
}

function formatTimer(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * DesignBookmark Motion (Kokonut UI) — "Voice input"
 * Compact interactive voice capture pill with live recording timer and
 * reactive mini-waveform bars.
 */
export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  isListening,
  isMuted,
  isBotSpeaking = false,
  durationSeconds = 0,
  audioLevel = 0,
  onClick,
  className,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const active = isListening && !isMuted && !isBotSpeaking;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isMuted ? 'Включить микрофон' : 'Выключить микрофон'}
      className={cn(
        'inline-flex items-center gap-2.5 px-3.5 py-2 rounded-full border text-xs font-medium transition-colors cursor-pointer select-none',
        isMuted
          ? 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200/70'
          : active
          ? 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100/80'
          : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50',
        className
      )}
    >
      <span
        className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors',
          isMuted
            ? 'bg-slate-200 text-slate-600'
            : active
            ? 'bg-emerald-600 text-white'
            : 'bg-slate-900 text-white'
        )}
      >
        {isMuted ? <MicOff size={13} /> : <Mic size={13} />}
      </span>

      <span className="font-mono text-[11px] tabular-nums">
        {formatTimer(durationSeconds)}
      </span>

      <span aria-hidden="true" className="inline-flex items-center gap-[2px] h-3.5">
        {[0.5, 1, 0.75, 1, 0.55].map((weight, i) => {
          const level = active
            ? Math.max(25, Math.min(100, (audioLevel > 4 ? audioLevel * 1.35 : 42) * weight))
            : 24;
          return (
            <motion.span
              key={i}
              animate={
                prefersReducedMotion
                  ? { scaleY: active ? 0.8 : 0.35 }
                  : { scaleY: level / 100 }
              }
              transition={{ duration: 0.12 }}
              className={cn(
                'w-[2.5px] h-3.5 rounded-full origin-center',
                isMuted
                  ? 'bg-slate-300'
                  : active
                  ? 'bg-emerald-600'
                  : 'bg-slate-400'
              )}
            />
          );
        })}
      </span>

      <span className="hidden sm:inline">
        {isMuted ? 'Микрофон выкл.' : isBotSpeaking ? 'Бот говорит' : 'Слушаю вас'}
      </span>
    </button>
  );
};
