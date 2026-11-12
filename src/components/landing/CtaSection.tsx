import React from 'react';
import { ArrowRightIcon, PhoneCallingRoundedIcon } from '@solar-icons/react/bold-duotone';

interface CtaSectionProps {
  onOpenAuth: () => void;
  onOpenVoiceTest: () => void;
}

export const CtaSection: React.FC<CtaSectionProps> = ({ onOpenAuth, onOpenVoiceTest }) => {
  return (
    <section className="py-20 bg-transparent border-t border-black/[0.06]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-12">
        
        {/* Main Obsidian Editorial Card with Liquid Glass (16px radius) */}
        <div className="rounded-[16px] liquid-glass-dark text-white p-8 sm:p-12 lg:p-14 relative overflow-hidden">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/15 text-white text-xs font-normal backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                <span>15 минут бесплатно при регистрации • 0 BYN абонплата</span>
              </div>

              <h2 className="text-3xl sm:text-5xl text-white tracking-[-0.025em] leading-[1.08] font-light">
                Ни одного пропущенного звонка.{' '}
                <span className="text-[#777169]">
                  Уже сегодня.
                </span>
              </h2>

              <p className="text-white/80 text-sm sm:text-base max-w-xl leading-relaxed font-normal">
                Настройте голосового ИИ-администратора за 5 минут, подключите номер МТС или А1 и получайте готовые заявки в CRM и Telegram.
              </p>
            </div>

            <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col items-stretch gap-3">
              <button
                type="button"
                onClick={onOpenAuth}
                className="w-full h-12 px-6 rounded-full bg-white hover:bg-[#FDFCFC] text-black font-normal text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_8px_24px_rgba(0,0,0,0.15)]"
              >
                <span>Создать ИИ-агента бесплатно</span>
                <ArrowRightIcon size={16} />
              </button>

              <button
                type="button"
                onClick={onOpenVoiceTest}
                className="w-full h-12 px-6 rounded-full bg-white/10 hover:bg-white/15 text-white border border-white/20 font-normal text-sm flex items-center justify-center gap-2.5 transition-colors cursor-pointer active:scale-[0.98] backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                </span>
                <PhoneCallingRoundedIcon size={17} />
                <span>Поговорить с Voxi в браузере</span>
              </button>
            </div>
          </div>
        </div>

        {/* ElevenLabs Pre-Footer Wide Horizontal Banner */}
        <div className="pt-4 border-t border-black/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-base sm:text-lg font-medium text-black tracking-tight">
              Платформа речевого ИИ для бизнеса Беларуси
            </div>
            <div className="text-xs text-[#777169] mt-0.5 font-normal">
              Без привязки карты • Официальный договор РБ (УНП 193991846) • МТС, А1, Белтелеком
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onOpenVoiceTest}
              className="h-9 px-4 rounded-full liquid-glass-pill text-black font-normal text-xs transition-colors cursor-pointer active:scale-[0.98]"
            >
              Тестовый звонок
            </button>
            <button
              type="button"
              onClick={onOpenAuth}
              className="h-9 px-4 rounded-full liquid-glass-btn-primary text-white font-normal text-xs transition-colors cursor-pointer active:scale-[0.98]"
            >
              Личный кабинет →
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
