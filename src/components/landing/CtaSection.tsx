import React from 'react';
import { ArrowRightIcon, PhoneCallingRoundedIcon } from '@solar-icons/react/bold-duotone';

interface CtaSectionProps {
  onOpenAuth: () => void;
  onOpenVoiceTest: () => void;
}

export const CtaSection: React.FC<CtaSectionProps> = ({ onOpenAuth, onOpenVoiceTest }) => {
  return (
    <section className="py-24 bg-[#ffffff]">
      <div className="max-w-[1080px] mx-auto px-4 sm:px-6">
        
        <div className="rounded-[48px] sm:rounded-[56px] bg-gradient-to-br from-[#1e3a8a] via-[#2563eb] to-[#4f46e5] text-[#ffffff] shadow-2xl shadow-blue-500/25 p-10 sm:p-16 text-center flex flex-col items-center">
          
          <div className="max-w-2xl space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 text-emerald-300 text-xs font-semibold">
              15 минут бесплатно при регистрации • 0 BYN абонплата
            </div>

            <h2 className="apple-heading text-3xl sm:text-5xl text-[#ffffff]">
              Ни одного пропущенного звонка.{' '}
              <span className="text-blue-200 font-normal">
                Уже сегодня.
              </span>
            </h2>

            <p className="text-blue-100/90 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
              Настройте голосового ИИ-администратора за 5 минут и подключите вашу телефонную линию МТС или А1.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={onOpenAuth}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#ffffff] hover:bg-blue-50 text-[#2563eb] font-semibold text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <span>Начать бесплатно</span>
                <ArrowRightIcon size={18} />
              </button>

              <button
                onClick={onOpenVoiceTest}
                className="w-full sm:w-auto px-7 py-4 rounded-full bg-[#ffffff]/15 hover:bg-[#ffffff]/25 text-[#ffffff] border border-white/20 font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <PhoneCallingRoundedIcon size={18} />
                <span>Прослушать демонстрацию</span>
              </button>
            </div>

            <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-blue-100/80">
              <span>Без привязки карты</span>
              <span>•</span>
              <span>Официальный договор РБ</span>
              <span>•</span>
              <span>МТС • А1 • Белтелеком</span>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
