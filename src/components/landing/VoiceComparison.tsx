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
    <section className="py-24 bg-[#f5f5f7]">
      <div className="max-w-[1080px] mx-auto px-4 sm:px-6">
        
        {/* Apple Section Header */}
        <div className="mb-14 max-w-2xl space-y-3">
          <div className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">
            Качество речи
          </div>
          <h2 className="apple-heading text-3xl sm:text-4xl lg:text-[44px] text-[#1d1d1f]">
            Естественный диалог.{' '}
            <span className="text-[#86868b] font-normal">
              Без кнопочных меню и пауз.
            </span>
          </h2>
          <p className="text-[#86868b] text-base leading-relaxed">
            Сравните работу классического тонального автоответчика и голосового ассистента Voxi.by.
          </p>
        </div>

        {/* Comparison Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Old Robot Card */}
          <div className="p-8 sm:p-10 rounded-[40px] bg-[#ffffff] border border-[#e5e5ea] space-y-6 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#86868b]">Обычный IVR-автоответчик</span>
                <span className="px-3.5 py-1.5 rounded-full bg-[#f5f5f7] text-[#86868b] font-medium">
                  Задержка 3.5 сек
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-[#1d1d1f] tracking-tight">
                  «Нажмите один для соединения...»
                </h3>
                <p className="text-sm text-[#86868b] leading-relaxed">
                  Механическая интонация, длинные голосовые меню и отсутствие понимания живой речи приводят к потере до 45% звонящих.
                </p>
              </div>

              <button
                onClick={handlePlayOld}
                className={`w-full py-3.5 rounded-full flex items-center justify-center gap-2 text-xs font-medium transition-colors ${
                  playingSide === 'old'
                    ? 'bg-[#1d1d1f] text-[#ffffff]'
                    : 'bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f]'
                }`}
              >
                <VolumeLoudIcon size={17} />
                <span>{playingSide === 'old' ? 'Остановить' : 'Прослушать обычный автоответчик'}</span>
              </button>
            </div>

            <ul className="space-y-2.5 text-xs sm:text-sm text-[#86868b] border-t border-[#f5f5f7] pt-5">
              <li className="flex items-center gap-2.5">
                <span className="text-[#86868b]">—</span> Заставляет слушать длинное меню
              </li>
              <li className="flex items-center gap-2.5">
                <span className="text-[#86868b]">—</span> Не консультирует по услугам и ценам
              </li>
              <li className="flex items-center gap-2.5">
                <span className="text-[#86868b]">—</span> Не оформляет запись самостоятельно
              </li>
            </ul>
          </div>

          {/* Voxi AI Card */}
          <div className="p-8 sm:p-10 rounded-[40px] bg-[#1d1d1f] text-[#ffffff] space-y-6 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#ffffff]">Voxi AI</span>
                <span className="px-3.5 py-1.5 rounded-full bg-[#ffffff]/15 text-[#ffffff] font-medium">
                  Отклик 0.4 сек
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-[#ffffff] tracking-tight">
                  «Здравствуйте! Чем могу помочь?»
                </h3>
                <p className="text-sm text-[#86868b] leading-relaxed">
                  Живая интонация, мгновенная реакция, точное знание вашего прайс-листа в BYN и автоматическая запись клиента в CRM.
                </p>
              </div>

              <button
                onClick={handlePlayAi}
                className={`w-full py-3.5 rounded-full flex items-center justify-center gap-2 text-xs font-medium transition-colors ${
                  playingSide === 'ai'
                    ? 'bg-[#e5e5ea] text-[#1d1d1f]'
                    : 'bg-[#ffffff] hover:bg-[#e5e5ea] text-[#1d1d1f]'
                }`}
              >
                <VolumeLoudIcon size={17} />
                <span>{playingSide === 'ai' ? 'Остановить' : 'Прослушать Voxi AI'}</span>
              </button>
            </div>

            <ul className="space-y-2.5 text-xs sm:text-sm text-[#ffffff] border-t border-[#3a3a3c] pt-5">
              <li className="flex items-center gap-2.5">
                <CheckCircleIcon size={17} className="text-[#ffffff] shrink-0" />
                <span>Отвечает на звонок за 0.5 секунды без очередей</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircleIcon size={17} className="text-[#ffffff] shrink-0" />
                <span>Называет точные цены в BYN и условия рассрочки</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircleIcon size={17} className="text-[#ffffff] shrink-0" />
                <span>Фиксирует клиента и отправляет заявку в Telegram</span>
              </li>
            </ul>
          </div>

        </div>

      </div>
    </section>
  );
};
