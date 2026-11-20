import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircleIcon } from '@solar-icons/react/bold-duotone';
import { cn } from '@/lib/utils';
import { MOTION_SPRINGS } from './springs';

export interface StepItem {
  id: string;
  label: string;
  duration?: string;
}

interface StepProgressProps {
  steps: StepItem[];
  activeStep: number;
  onSelectStep: (index: number) => void;
  className?: string;
}

/**
 * DesignBookmark Motion — "Step progress"
 * Interactive multi-step progress bar with spring-filled rail and
 * scaling step nodes.
 */
export const StepProgress: React.FC<StepProgressProps> = ({
  steps,
  activeStep,
  onSelectStep,
  className,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const ratio = steps.length > 1 ? activeStep / (steps.length - 1) : 1;

  return (
    <div className={cn('w-full space-y-3', className)}>
      <div className="relative flex items-center justify-between">
        {/* Background track */}
        <div
          aria-hidden="true"
          className="absolute left-4 right-4 top-4 h-[2px] bg-slate-200 rounded-full"
        />

        {/* Animated progress fill (scaleX on compositor) */}
        <motion.div
          aria-hidden="true"
          initial={false}
          animate={{ scaleX: ratio }}
          transition={prefersReducedMotion ? { duration: 0 } : MOTION_SPRINGS.pill}
          style={{ originX: 0 }}
          className="absolute left-4 right-4 top-4 h-[2px] bg-slate-950 rounded-full will-change-transform"
        />

        {steps.map((step, idx) => {
          const isCompleted = idx < activeStep;
          const isActive = idx === activeStep;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onSelectStep(idx)}
              aria-current={isActive ? 'step' : undefined}
              className="relative z-10 flex flex-col items-center gap-1.5 group cursor-pointer focus:outline-none"
            >
              <motion.span
                animate={
                  prefersReducedMotion
                    ? undefined
                    : { scale: isActive ? 1.12 : 1 }
                }
                transition={MOTION_SPRINGS.pill}
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-semibold border transition-colors',
                  isActive
                    ? 'bg-slate-950 text-white border-slate-950 shadow-sm'
                    : isCompleted
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-500 border-slate-300 group-hover:border-slate-500 group-hover:text-slate-900'
                )}
              >
                {isCompleted ? <CheckCircleIcon size={15} /> : `0${idx + 1}`}
              </motion.span>
              <span
                className={cn(
                  'text-[11px] sm:text-xs font-medium text-center max-w-[110px] leading-tight transition-colors',
                  isActive ? 'text-slate-950' : 'text-slate-500 group-hover:text-slate-800'
                )}
              >
                {step.label}
              </span>
              {step.duration && (
                <span className="text-[10px] font-mono text-slate-400">
                  {step.duration}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
