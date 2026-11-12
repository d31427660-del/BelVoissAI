import React, { useState, useEffect } from 'react';
import {
  VolumeLoudIcon,
  CheckCircleIcon,
  AltArrowLeftIcon,
  AltArrowRightIcon
} from '@solar-icons/react/bold-duotone';
import { VoiceSimulator } from '../../lib/speechSynth';

interface TimelineMilestone {
  id: string;
  timeMark: string;
  title: string;
  tag: string;
  description: string;
}

const CALL_TIMELINE: TimelineMilestone[] = [
  {
    id: 'sip',
    timeMark: '0 мс',
    title: 'Входящий SIP-вызов МТС / А1 / Белтелеком',
    tag: 'WebRTC & SIP 2.0',
    description: 'Звонок поступает на минский узел связи без переадресации за рубеж. Соединение устанавливается с первого гудка без ожидания оператора.'
  },
  {
    id: 'stt',
    timeMark: '120 мс',
    title: 'Потоковое распознавание речи и топонимики РБ',
    tag: 'Deepgram Nova-2 + Словарь РБ',
    description: 'Нейросеть мгновенно распознаёт названия улиц Минска (Сурганова, Тимирязева, Немига), марки авто и фамилии врачей без ошибок.'
  },
  {
    id: 'filler',
    timeMark: '210 мс',
    title: 'Естественный речевой филлер (Zero-Pause UX)',
    tag: 'Voxi Filler Engine',
    description: 'Если требуется запрос в базу расписания, ассистент мягко произносит фразу («Секундочку, проверяю свободные окна...»), исключая тишину в трубке.'
  },
  {
    id: 'crm',
    timeMark: '340 мс',
    title: 'Двусторонняя проверка слота в YCLIENTS и расчёт в BYN',
    tag: 'Live Function Calling',
    description: 'Платформа сверяет занятость мастеров или боксов СТО на лету и формирует точную стоимость услуги в белорусских рублях.'
  },
  {
    id: 'tts',
    timeMark: '510 мс',
    title: 'Синтез живого голоса с эмоциональной окраской',
    tag: 'Voxi v2.5 Neural Audio',
    description: 'Клиент слышит доброжелательный ответ Анны или Максима с естественным дыханием и интонацией живого администратора.'
  },
  {
    id: 'postcall',
    timeMark: '+1.0 сек',
    title: 'Карточка в Telegram, сделка в CRM и SMS-визитка',
    tag: 'Omnichannel Sync',
    description: 'Сразу после звонка руководитель получает сводку и аудиозапись в Telegram, а клиенту уходит SMS с адресом и временем записи.'
  }
];

export const VoiceComparison: React.FC = () => {
  const [playingSide, setPlayingSide] = useState<'old' | 'ai' | null>(null);
  const [activeTimelineIdx, setActiveTimelineIdx] = useState<number>(4);

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

  const currentMilestone = CALL_TIMELINE[activeTimelineIdx] || CALL_TIMELINE[0];

  return (
    <section id="benchmark" className="py-24 bg-[#ffffff] border-y border-black/[0.06] scroll-mt-20">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-20">
        
        {/* PART 1: Audio Benchmark Comparison */}
        <div>
          <div className="mb-12 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/[0.04] text-black text-xs font-normal border border-black/[0.06]">
              Аудио-бенчмарк • Качество речи
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-[40px] text-black tracking-[-0.025em] font-light">
              Естественный диалог.{' '}
              <span className="font-normal text-black">
                Без кнопочных меню и пауз.
              </span>
            </h2>
            <p className="text-[#59544F] text-base leading-relaxed font-normal">
              Сравните тональный автоответчик прошлого поколения и нейросетевую модель Voxi v2.5.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Old Robot Card (ElevenLabs 16px Card with Liquid Glass) */}
            <div className="p-6 sm:p-8 rounded-[16px] liquid-glass-cream space-y-6 flex flex-col justify-between">
              <div className="space-y-5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#777169]">Классический IVR-автоответчик</span>
                  <span className="px-3 py-1 rounded-full liquid-glass-pill text-rose-700 text-[11px] font-mono">
                    3 500 мс задержка
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-medium text-black tracking-tight">
                    «Нажмите один для соединения...»
                  </h3>
                  <p className="text-xs sm:text-sm text-[#59544F] leading-relaxed">
                    Механическая интонация, длинные голосовые меню и отсутствие понимания живой речи приводят к потере до 45% звонящих клиентов.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handlePlayOld}
                  className={`w-full h-11 rounded-full flex items-center justify-center gap-2 text-xs font-normal transition-all cursor-pointer ${
                    playingSide === 'old'
                      ? 'bg-black text-white'
                      : 'liquid-glass-pill text-black active:scale-[0.98]'
                  }`}
                >
                  <VolumeLoudIcon size={17} />
                  <span>{playingSide === 'old' ? 'Остановить' : 'Прослушать обычный IVR'}</span>
                </button>
              </div>

              <ul className="space-y-2.5 text-xs sm:text-sm text-[#59544F] border-t border-black/[0.075] pt-5">
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
                  <span>Не проверяет свободные окна в расписании</span>
                </li>
              </ul>
            </div>

            {/* Voxi AI Card (Liquid Glass Dark Card) */}
            <div className="p-6 sm:p-8 rounded-[16px] liquid-glass-dark text-white space-y-6 flex flex-col justify-between relative overflow-hidden">
              <div className="space-y-5 relative z-10">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Voxi.by Neural v2.5
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/10 text-emerald-400 border border-white/15 text-[11px] font-mono font-medium">
                    510 мс отклик • МТС и А1
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-medium text-white tracking-tight">
                    «Здравствуйте! Чем могу помочь?»
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal">
                    Живая естественная речь без пауз, точное знание прайс-листа в BYN, сверка слотов и мгновенная отправка заявки в Telegram.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handlePlayAi}
                  className={`w-full h-11 rounded-full flex items-center justify-center gap-2 text-xs font-normal transition-all shadow-sm cursor-pointer ${
                    playingSide === 'ai'
                      ? 'bg-emerald-400 text-black'
                      : 'bg-white hover:bg-[#FDFCFC] text-black active:scale-[0.98]'
                  }`}
                >
                  <VolumeLoudIcon size={17} />
                  <span>{playingSide === 'ai' ? 'Остановить' : 'Прослушать Voxi v2.5'}</span>
                </button>
              </div>

              <ul className="space-y-2.5 text-xs sm:text-sm text-white border-t border-white/15 pt-5 relative z-10">
                <li className="flex items-center gap-2.5">
                  <CheckCircleIcon size={18} className="text-emerald-400 shrink-0" />
                  <span>Отвечает на звонок за 0.5 секунды без очередей</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircleIcon size={18} className="text-emerald-400 shrink-0" />
                  <span>Называет точные цены в BYN и условия рассрочки</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircleIcon size={18} className="text-emerald-400 shrink-0" />
                  <span>Проверяет свободные окна и присылает SMS-визитку</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* PART 2: ElevenLabs-Inspired Interactive Graduated Ruler Timeline with Liquid Glass */}
        <div className="rounded-[16px] liquid-glass-cream p-6 sm:p-8 space-y-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-medium text-[#777169] uppercase tracking-wider">
                Инженерная шкала отклика • 510 миллисекунд
              </div>
              <h3 className="text-xl sm:text-2xl font-medium text-black tracking-tight">
                Что происходит за 0.5 секунды во время звонка клиента
              </h3>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() =>
                  setActiveTimelineIdx((prev) => (prev - 1 + CALL_TIMELINE.length) % CALL_TIMELINE.length)
                }
                aria-label="Предыдущий этап"
                className="w-9 h-9 rounded-full bg-white hover:bg-[#FDFCFC] text-black shadow-[0_0_0_0.5px_rgba(0,0,0,0.125),0_1px_1px_rgba(0,0,0,0.04)] flex items-center justify-center transition-colors cursor-pointer active:scale-95"
              >
                <AltArrowLeftIcon size={17} />
              </button>
              <button
                type="button"
                onClick={() => setActiveTimelineIdx((prev) => (prev + 1) % CALL_TIMELINE.length)}
                aria-label="Следующий этап"
                className="w-9 h-9 rounded-full bg-white hover:bg-[#FDFCFC] text-black shadow-[0_0_0_0.5px_rgba(0,0,0,0.125),0_1px_1px_rgba(0,0,0,0.04)] flex items-center justify-center transition-colors cursor-pointer active:scale-95"
              >
                <AltArrowRightIcon size={17} />
              </button>
            </div>
          </div>

          {/* ElevenLabs Graduated Tick Ruler */}
          <div className="relative pt-2 pb-1">
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {CALL_TIMELINE.map((item, idx) => {
                const isActive = idx === activeTimelineIdx;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTimelineIdx(idx)}
                    className={`group text-left p-3 rounded-[12px] border transition-all cursor-pointer ${
                      isActive
                        ? 'liquid-glass-pill text-black shadow-sm'
                        : 'bg-transparent border-transparent hover:bg-white/60 text-[#777169]'
                    }`}
                  >
                    {/* Ruler Tick Marks */}
                    <div className="flex items-end justify-between gap-1 mb-2.5 h-4" aria-hidden="true">
                      {[0, 1, 2, 3, 4, 5].map((tick) => (
                        <span
                          key={tick}
                          className={`w-[1.5px] rounded-full transition-all ${
                            tick === 0
                              ? isActive
                                ? 'h-4 bg-black'
                                : 'h-3 bg-black/30'
                              : isActive
                                ? 'h-2 bg-black/40'
                                : 'h-1.5 bg-black/15'
                          }`}
                        />
                      ))}
                    </div>
                    <div
                      className={`font-mono text-xs font-semibold ${
                        isActive ? 'text-black' : 'text-[#777169]'
                      }`}
                    >
                      {item.timeMark}
                    </div>
                    <div
                      className={`text-[11px] truncate mt-0.5 ${
                        isActive ? 'text-black' : 'text-[#777169]'
                      }`}
                    >
                      {item.title}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Milestone Readout Box (ElevenLabs 12px Card with Liquid Glass) */}
          <div className="p-5 sm:p-6 rounded-[12px] liquid-glass-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-full liquid-glass-btn-primary text-white font-mono text-xs font-normal">
                  {currentMilestone.timeMark}
                </span>
                <h4 className="text-base font-medium text-black">
                  {currentMilestone.title}
                </h4>
              </div>
              <p className="text-xs sm:text-sm text-[#59544F] leading-relaxed font-normal">
                {currentMilestone.description}
              </p>
            </div>
            <span className="self-start sm:self-center shrink-0 px-3.5 py-1.5 rounded-full liquid-glass-pill text-xs font-mono font-normal text-black">
              {currentMilestone.tag}
            </span>
          </div>
        </div>

      </div>
    </section>
  );
};
