import React, { useId } from 'react';
import {
  QuestionCircleIcon as HelpCircle,
  CloseCircleIcon as CloseIcon,
  LightbulbBoltIcon as Lightbulb,
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
  helpTriggerLabel = 'Подсказка',
}) => {
  const rawId = useId();
  const popoverId = `field-help-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return (
    <div className="flex items-start justify-between gap-2 mb-1.5">
      <label
        htmlFor={htmlFor}
        className="text-[13px] font-semibold text-black flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 min-w-0 leading-snug cursor-pointer"
      >
        <span>
          {label}
          {required && (
            <span className="text-[#FE432A] font-bold ml-0.5" title="Обязательное поле">
              *
            </span>
          )}
        </span>
        {optionalText && (
          <span className="text-[11px] font-normal text-[#737373]">({optionalText})</span>
        )}
      </label>

      {helpText && (
        <>
          <button
            type="button"
            {...({ popoverTarget: popoverId } as any)}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F5F5F5] hover:bg-black hover:text-white text-[#525252] border border-black/[0.08] text-[11px] font-medium transition-colors shrink-0 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{helpTriggerLabel}</span>
          </button>

          <div
            id={popoverId}
            {...({ popover: 'auto' } as any)}
            className="voxi-help-popover"
          >
            <div className="p-5 space-y-3.5 text-left">
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-black/[0.08]">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-[8px] bg-black text-[#D8E738] flex items-center justify-center shrink-0">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <h4 className="font-display text-[14px] font-bold text-black">
                    {helpTitle || label}
                  </h4>
                </div>

                <button
                  type="button"
                  {...({ popoverTarget: popoverId, popoverTargetAction: 'hide' } as any)}
                  aria-label="Закрыть подсказку"
                  className="p-1 rounded-full text-[#737373] hover:text-black hover:bg-[#F5F5F5] transition-colors cursor-pointer"
                >
                  <CloseIcon className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[13px] text-[#404040] leading-relaxed whitespace-pre-line">
                {helpText}
              </p>

              {helpExample && (
                <div className="p-3.5 rounded-[14px] bg-[#F5F5F5] border border-black/[0.06] text-[12.5px] text-black space-y-1">
                  <span className="block font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[#737373]">
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
                  className="px-4 py-1.5 rounded-full bg-black hover:bg-[#222222] text-white text-xs font-medium transition-colors cursor-pointer"
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
  <p id={id} className="mt-1.5 text-[11.5px] text-[#666666] leading-relaxed">
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
