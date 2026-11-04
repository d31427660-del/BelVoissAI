import React, { useState, useEffect } from 'react';
import { VolumeLoudIcon, CheckCircleIcon } from '@solar-icons/react/bold-duotone';
import { VoiceSimulator } from '../../lib/speechSynth';

export const VoiceComparison: React.FC = () => {
  const [playingSide, setPlayingSide] = useState<'old' | 'ai' | null>(null);

  useEffect(() => {
    return () => {
      VoiceSimulator.stop();
    };
  }, []);

  const handlePlayOld = () => {
    if (playingSide === 'old') {
      VoiceSimulator.stop();
      setPlayingSide(null);
    } else {
      VoiceSimulator.stop();
      setPlayingSide('old');
      VoiceSimulator.speak(
        'Здравствуйте... Если вы хотите записаться... нажмите один... Для соединения с оператором... ожидайте на линии...',
        'maxim',
        () => setPlayingSide('old'),
        () => setPlayingSide(null)
      );
    }
  };

  const handlePlayAi = () => {
    if (playingSide === 'ai') {
      VoiceSimulator.stop();
      setPlayingSide(null);
    } else {
      VoiceSimulator.stop();
      setPlayingSide('ai');
      VoiceSimulator.speak(
        'Здравствуйте! Автоцентр Драйв-Минск, меня зовут Анна. У нас как раз есть свободный подъемник на сегодня в 18:30. Записать вас?',
        'anna',
        () => setPlayingSide('ai'),
        () => setPlayingSide(null)
      );
    }
  };

  return (
    <section className="py-24 bg-slate-50/80 scroll-mt-20">
      <div className="max-w-[1080px] mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="mb-14 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 text-[#2563eb] text-xs font-semibold border border-blue-100">
            Сравнение технологий • Качество речи
          </div>
          <h2 className="apple-heading text-3xl sm:text-4xl lg:text-[44px] text-[#1d1d1f]">
            Естественный диалог.{' '}
            <span className="bg-gradient-to-r from-[#2563eb] via-[#4f46e5] to-emerald-500 bg-clip-text text-transparent">
              Без кнопочных меню и пауз.
            </span>
          </h2>
          <p className="text-slate-600 text-base leading-relaxed">
            Сравните работу классического тонального автоответчика и голосового ассистента Voxi.by.
          </p>
        </div>

        {/* Comparison Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          
          {/* Old Robot Card */}
          <div className="p-8 sm:p-10 rounded-[40px] bg-white border border-slate-200/90 shadow-sm space-y-6 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500">Обычный IVR-автоответчик</span>
                <span className="px-3.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-medium">
                  Задержка 3.5 сек • Потеря клиентов
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                  «Нажмите один для соединения...»
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Механическая интонация, длинные голосовые меню и отсутствие понимания живой речи приводят к потере до 45% звонящих клиентов.
                </p>
              </div>

              <button
                type="button"
                onClick={handlePlayOld}
                className={`w-full py-3.5 rounded-full flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
                  playingSide === 'old'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <VolumeLoudIcon size={17} />
                <span>{playingSide === 'old' ? 'Остановить' : 'Прослушать обычный автоответчик'}</span>
              </button>
            </div>

            <ul className="space-y-3 text-xs sm:text-sm text-slate-500 border-t border-slate-100 pt-5">
              <li className="flex items-center gap-2.5">
                <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-600 text-xs font-bold flex items-center justify-center shrink-0">✕</span>
                <span>Заставляет слушать длинное меню цифр</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-600 text-xs font-bold flex items-center justify-center shrink-0">✕</span>
                <span>Не консультирует по услугам и ценам в BYN</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-600 text-xs font-bold flex items-center justify-center shrink-0">✕</span>
                <span>Не оформляет запись самостоятельно в CRM</span>
              </li>
            </ul>
          </div>

          {/* Voxi AI Card (Matching Brand Vibrant Blue/Emerald Theme) */}
          <div className="p-8 sm:p-10 rounded-[40px] bg-gradient-to-br from-[#1e3a8a] via-[#2563eb] to-[#4f46e5] text-white space-y-6 flex flex-col justify-between shadow-2xl shadow-blue-500/25 ring-2 ring-blue-400/40 relative overflow-hidden">
            {/* Subtle light glow accent */}
            <div className="pointer-events-none absolute -top-20 -right-20 w-52 h-52 rounded-full bg-emerald-400/20 blur-2xl" />

            <div className="space-y-5 relative z-10">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Voxi.by Голосовой ИИ
                </span>
                <span className="px-3.5 py-1 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold">
                  Отклик 0.5 сек • МТС и А1
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white tracking-tight">
                  «Здравствуйте! Чем могу помочь?»
                </h3>
                <p className="text-sm text-blue-100/90 leading-relaxed">
                  Живая естественная речь без пауз, точное знание прайс-листа в BYN, фиксация имени и мгновенная отправка заявки в Telegram.
                </p>
              </div>

              <button
                type="button"
                onClick={handlePlayAi}
                className={`w-full py-3.5 rounded-full flex items-center justify-center gap-2 text-xs font-semibold transition-all shadow-md ${
                  playingSide === 'ai'
                    ? 'bg-emerald-400 text-slate-900 shadow-emerald-500/30'
                    : 'bg-white hover:bg-blue-50 text-[#2563eb] shadow-blue-900/20'
                }`}
              >
                <VolumeLoudIcon size={17} />
                <span>{playingSide === 'ai' ? 'Остановить' : 'Прослушать Voxi AI'}</span>
              </button>
            </div>

            <ul className="space-y-3 text-xs sm:text-sm text-white border-t border-white/15 pt-5 relative z-10">
              <li className="flex items-center gap-2.5">
                <CheckCircleIcon size={18} className="text-emerald-300 shrink-0" />
                <span>Отвечает на звонок за 0.5 секунды без очередей</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircleIcon size={18} className="text-emerald-300 shrink-0" />
                <span>Называет точные цены в BYN и условия рассрочки</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircleIcon size={18} className="text-emerald-300 shrink-0" />
                <span>Фиксирует клиента и отправляет заявку в Telegram</span>
              </li>
            </ul>
          </div>

        </div>

      </div>
    </section>
  );
};
