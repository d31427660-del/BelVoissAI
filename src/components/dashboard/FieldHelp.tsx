import React, { useId } from 'react';
import {
  QuestionCircleIcon as HelpCircle,
  CloseCircleIcon as CloseIcon,
  LightbulbBoltIcon as Lightbulb
} from '@solar-icons/react/bold-duotone';

interface FieldLabelProps {
  htmlFor: string;
  label: string;
  required?: boolean;
  optionalText?: string;
  helpTitle?: string;
  helpText?: string;
  helpExample?: string;
  helpTriggerLabel?: string;
}

export const FieldLabel: React.FC<FieldLabelProps> = ({
  htmlFor,
  label,
  required,
  optionalText,
  helpTitle,
  helpText,
  helpExample,
  helpTriggerLabel = 'Подсказка'
}) => {
  const rawId = useId();
  const popoverId = `field-help-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return (
    <div className="flex items-start justify-between gap-2 mb-1.5">
      <label
        htmlFor={htmlFor}
        className="text-xs font-semibold text-slate-800 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 min-w-0 leading-snug cursor-pointer"
      >
        <span>{label}</span>
        {required && (
          <span className="text-rose-500 font-bold" title="Обязательное поле">
            *
          </span>
        )}
        {optionalText && (
          <span className="text-[11px] font-normal text-slate-400">
            ({optionalText})
          </span>
        )}
      </label>

      {helpText && (
        <>
          <button
            type="button"
            {...({ popoverTarget: popoverId } as any)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200/80 hover:border-blue-200 text-[11px] font-medium transition-colors shrink-0"
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>{helpTriggerLabel}</span>
          </button>

          <div
            id={popoverId}
            {...({ popover: 'auto' } as any)}
            className="voxi-help-popover"
          >
            <div className="p-4 sm:p-5 space-y-3 text-left">
              <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">
                    {helpTitle || label}
                  </h4>
                </div>

                <button
                  type="button"
                  {...({ popoverTarget: popoverId, popoverTargetAction: 'hide' } as any)}
                  aria-label="Закрыть подсказку"
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <CloseIcon className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {helpText}
              </p>

              {helpExample && (
                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-slate-800 space-y-1">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-blue-700">
                    Пример:
                  </span>
                  <div className="font-medium whitespace-pre-line leading-relaxed">
                    {helpExample}
                  </div>
                </div>
              )}

              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  {...({ popoverTarget: popoverId, popoverTargetAction: 'hide' } as any)}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
                >
                  Понятно
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

interface FieldHintProps {
  id: string;
  children: React.ReactNode;
}

export const FieldHint: React.FC<FieldHintProps> = ({ id, children }) => (
  <p id={id} className="mt-1.5 text-[11px] text-slate-500 leading-relaxed">
    {children}
  </p>
);

interface AutoGrowTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
}

export const AutoGrowTextarea: React.FC<AutoGrowTextareaProps> = ({
  value,
  className = '',
  rows = 1,
  onKeyDown,
  ...rest
}) => (
  <div className="voxi-growable-wrap" data-replicated-value={value}>
    <textarea
      rows={rows}
      value={value}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey && rows === 1) {
          e.preventDefault();
        }
        onKeyDown?.(e);
      }}
      className={`voxi-autogrow-textarea ${className}`}
      {...rest}
    />
  </div>
);

