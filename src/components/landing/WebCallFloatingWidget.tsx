import React from 'react';
import { motion } from 'framer-motion';
import { PhoneCallingRoundedIcon, SoundwaveCircleIcon } from '@solar-icons/react/bold-duotone';

interface WebCallFloatingWidgetProps {
  onOpenVoiceTest: () => void;
}

export const WebCallFloatingWidget: React.FC<WebCallFloatingWidgetProps> = ({ onOpenVoiceTest }) => {
  return (
    <motion.aside
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.8, duration: 0.4 }}
      aria-label="Интерактивный голосовой виджет Voxi.by"
      className="fixed bottom-5 right-5 sm:bottom-7 sm:right-7 z-40 print:hidden"
    >
      <button
        type="button"
        onClick={onOpenVoiceTest}
        aria-label="Поговорить с живым голосовым ИИ Voxi.by прямо сейчас без ввода номера телефона"
        className="group relative flex items-center gap-3.5 pl-3.5 pr-4 py-2.5 sm:py-3 rounded-full bg-slate-900/95 hover:bg-slate-950 text-white shadow-2xl shadow-blue-900/35 border border-white/20 backdrop-blur-xl transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
      >
        {/* Animated Green Online Waveform Aura */}
        <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-[#2563eb] to-emerald-400 text-white shrink-0 shadow-md shadow-blue-500/30">
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 border-2 border-slate-900" />
          </span>
          <PhoneCallingRoundedIcon size={20} className="group-hover:rotate-12 transition-transform duration-300" />
        </div>

        {/* Text and Badges */}
        <div className="text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-xs sm:text-sm font-bold text-white tracking-tight">
              Поговорить с Voxi
            </span>
            <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/70 border border-emerald-500/30 px-1.5 py-0.2 rounded-full">
              LIVE
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-300 font-normal">
            <SoundwaveCircleIcon size={13} className="text-emerald-400 shrink-0" />
            <span>В 1 клик через микрофон • Без номера</span>
          </div>
        </div>
      </button>
    </motion.aside>
  );
};
