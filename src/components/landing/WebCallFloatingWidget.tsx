import React from 'react';
import { PhoneCallingRoundedIcon, SoundwaveCircleIcon } from '@solar-icons/react/bold-duotone';

interface WebCallFloatingWidgetProps {
  onOpenVoiceTest: () => void;
}

export const WebCallFloatingWidget: React.FC<WebCallFloatingWidgetProps> = ({ onOpenVoiceTest }) => {
  return (
    <aside
      aria-label="Интерактивный голосовой виджет Voxi.by"
      className="fixed bottom-5 right-5 sm:bottom-7 sm:right-7 z-40 print:hidden animate-fadeIn"
    >
      <button
        type="button"
        onClick={onOpenVoiceTest}
        aria-label="Поговорить с живым голосовым ИИ Voxi.by прямо сейчас без ввода номера телефона"
        className="group relative flex items-center gap-3 pl-3 pr-4 py-2 sm:py-2.5 rounded-full liquid-glass-dark text-white transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
      >
        {/* White Live Icon Circle */}
        <div className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full liquid-glass-pill text-black shrink-0">
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 border-2 border-black" />
          </span>
          <PhoneCallingRoundedIcon size={18} className="group-hover:rotate-12 transition-transform duration-300" />
        </div>

        {/* Text and Badges */}
        <div className="text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-xs sm:text-sm font-medium text-white tracking-tight">
              Поговорить с Voxi
            </span>
            <span className="text-[10px] font-normal text-white/80 bg-white/15 px-1.5 py-0.5 rounded-full">
              LIVE
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-white/70 font-normal">
            <SoundwaveCircleIcon size={12} className="text-white/80 shrink-0" />
            <span>Через микрофон • Без номера</span>
          </div>
        </div>
      </button>
    </aside>
  );
};
