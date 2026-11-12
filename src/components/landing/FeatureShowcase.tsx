import React, { useState, useEffect } from 'react';
import {
  PhoneCallingRoundedIcon,
  BoltCircleIcon,
  ShieldCheckIcon,
  ChatRoundDotsIcon,
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  Tuning2Icon
} from '@solar-icons/react/bold-duotone';
import { VoiceSimulator } from '../../lib/speechSynth';
import { VoiceId } from '../../types';

export const FeatureShowcase: React.FC = () => {
  const [promptVoice, setPromptVoice] = useState<VoiceId>('anna');
  const [isPlayingPrompt, setIsPlayingPrompt] = useState(false);
  const [activeCaseStudy, setActiveCaseStudy] = useState<'drive' | 'sto' | 'dental'>('drive');

  useEffect(() => {
    return () => {
      VoiceSimulator.stop();
    };
  }, []);

  const promptSampleText =
    promptVoice === 'anna'
      ? 'Секундочку, сверяю расписание инструкторов... Да, на четверг в восемнадцать тридцать свободно одно место в вечерней группе на Сурганова. Стоимость с топливом — тысяча пятьдесят рублей, можно в рассрочку. Записать вас?'
      : 'Так, сейчас гляну свободный подъёмник по базе... Отлично, сегодня на восемнадцать тридцать свободен второй бокс. Диагностика подвески — тридцать пять рублей, а при ремонте у нас бесплатно. Бронируем?';

  const handleTogglePromptPlay = () => {
    if (isPlayingPrompt) {
      VoiceSimulator.stop();
      setIsPlayingPrompt(false);
    } else {
      VoiceSimulator.stop();
      VoiceSimulator.speak(
        promptSampleText,
        promptVoice,
        () => setIsPlayingPrompt(true),
        () => setIsPlayingPrompt(false)
      );
    }
  };

  const caseStudies = {
    drive: {
      company: 'Автошкола «Драйв-Минск»',
      metric: '+42% вечерних записей после 19:00',
      quote:
        '«Раньше мы теряли до половины звонков вечером и в выходные. С Voxi каждый курсант получает расчёт рассрочки за 0.5 секунды и сразу попадает в группу».',
      role: 'Руководитель отдела набора, г. Минск'
    },
    sto: {
      company: 'СТО «Авторитет-Сервис»',
      metric: '0 пропущенных вызовов в сезон шиномонтажа',
      quote:
        '«Мастера-приёмщики больше не отвлекаются от подъёмников на типовые вопросы. ИИ сам уточняет марку авто, сверяет свободный бокс и присылает заявку в Telegram».',
      role: 'Директор автосервиса, ул. Тимирязева'
    },
    dental: {
      company: 'Стоматология «ДентаЛюкс»',
      metric: 'Окупаемость пакета минут с 1-го пациента',
      quote:
        '«Пациент с острой болью получает ответ мгновенно. Ассистент вежливо подбирает окно у терапевта и отправляет пациенту SMS-визитку со схемой проезда».',
      role: 'Главный врач клиники, пр-т Победителей'
    }
  };

  const smallBentoFeatures = [
    {
      icon: <PhoneCallingRoundedIcon size={20} />,
      badge: 'BYO-SIP',
      title: 'SIP-транк с МТС и А1',
      description: 'Прямое подключение номеров +375 (29/33/44) и городских линий Белтелеком за 5 минут без смены оператора.'
    },
    {
      icon: <Tuning2Icon size={20} />,
      badge: 'Guardrails',
      title: 'Строгие рамки прайса',
      description: 'ИИ никогда не придумывает несуществующие скидки или услуги — отвечает строго по вашей базе знаний в BYN.'
    },
    {
      icon: <ChatRoundDotsIcon size={20} />,
      badge: 'Telegram & SMS',
      title: 'Мгновенные карточки и SMS',
      description: 'Отправка лида руководителю в Telegram за 1 секунду и авто-визитка клиенту со схемой проезда.'
    },
    {
      icon: <ShieldCheckIcon size={20} />,
      badge: 'Закон № 99-З',
      title: 'Безопасность и RLS',
      description: 'Полная изоляция журналов звонков и персональных данных на уровне компании по стандартам РБ.'
    }
  ];

  return (
    <section id="features" className="py-24 bg-[#ffffff] relative scroll-mt-20">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-24">
        
        {/* ================================================================= */}
        {/* PART 1: ElevenLabs "Two Platforms Built on the Same Foundation"   */}
        {/* ================================================================= */}
        <div className="space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-6 space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-black/[0.04] text-[#0a0a0c] border border-black/[0.08] text-xs font-medium">
                Единая архитектура Voxi v2.5
              </div>
              <h2 className="apple-heading text-3xl sm:text-4xl lg:text-[46px] text-[#0a0a0c] tracking-[-0.03em] leading-[1.08] font-semibold">
                Два контура автоматизации на едином речевом ядре
              </h2>
            </div>

            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t lg:border-t-0 border-black/[0.08]">
              <div className="space-y-1.5">
                <div className="text-sm font-bold text-[#0a0a0c] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0a0a0c]" />
                  <span>Voxi Голосовой Студио-Контур</span>
                </div>
                <p className="text-xs sm:text-sm text-[#52525b] leading-relaxed">
                  Синтезирует живую речь с задержкой 0.5 сек, естественными паузами-филлерами и знанием улиц Минска.
                </p>
              </div>
              <div className="space-y-1.5">
                <div className="text-sm font-bold text-[#0a0a0c] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Voxi Операционный Контур</span>
                </div>
                <p className="text-xs sm:text-sm text-[#52525b] leading-relaxed">
                  Проверяет слоты в YCLIENTS и Google Calendar на лету, отправляет SMS/Viber клиентам и доставляет лиды в CRM.
                </p>
              </div>
            </div>
          </div>

          {/* Massive Overlapping Dual-Dashboard Visual Frame with Liquid Glass Dark */}
          <div className="rounded-[16px] liquid-glass-dark p-5 sm:p-8 lg:p-10 border border-white/10 relative overflow-hidden">
            {/* Ambient Sensory Glow Inside Frame */}
            <div className="pointer-events-none absolute -top-24 left-1/3 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 right-10 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch relative z-10">
              
              {/* Left Mockup Window: Voxi Voice Studio & Scenario Builder */}
              <div className="lg:col-span-6 rounded-[12px] liquid-glass-card p-5 sm:p-6 flex flex-col justify-between space-y-5 text-black">
                <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="ml-2 text-xs font-medium text-black">
                      Voxi Studio • Конструктор сценария
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-black bg-[#F5F3F1] px-2.5 py-0.5 rounded-full border border-black/[0.06]">
                    Голос: Анна • Онлайн
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-[10px] bg-[#F5F3F1] border border-black/[0.06] space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-[#777169]">
                      <span>Приветствие администратора</span>
                      <span className="text-emerald-600 font-medium">● Активно</span>
                    </div>
                    <p className="text-black font-normal">
                      «Здравствуйте! Автошкола Драйв-Минск, голосовой помощник Анна. Подсказать стоимость обучения или записать на пробный урок?»
                    </p>
                  </div>

                  <div className="p-3.5 rounded-[10px] bg-[#F5F3F1] border border-black/[0.06] space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-medium text-black">
                      <span>Быстрые действия во время звонка</span>
                      <span className="font-mono text-xs text-[#777169]">Live Slots ON</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2.5 py-1 rounded-full bg-white text-black border border-black/[0.08] text-[11px]">
                        «Секундочку, сверяю расписание...»
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-white text-black border border-black/[0.08] text-[11px]">
                        «Сейчас подскажу точную цену в BYN...»
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#777169] pt-2 border-t border-black/[0.06]">
                  <span>Синхронизация прайс-листа и базы знаний (BYN)</span>
                  <span className="font-mono text-emerald-600 font-medium">Готово к звонкам</span>
                </div>
              </div>

              {/* Right Mockup Window: Voxi Agent Control Center & Telemetry */}
              <div className="lg:col-span-6 rounded-[12px] bg-white/[0.04] backdrop-blur-md border border-white/10 shadow-sm p-5 sm:p-6 flex flex-col justify-between space-y-5 text-white">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-medium text-white">
                      Мониторинг звонков и SLA (Минск)
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-300 bg-white/10 border border-white/15 px-2.5 py-0.5 rounded-full">
                    sip.mts.by • sip.a1.by
                  </span>
                </div>

                {/* 3 Live Telemetry Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-[10px] bg-white/5 border border-white/10">
                    <div className="text-[11px] text-zinc-400">Оценка CSAT</div>
                    <div className="text-xl sm:text-2xl font-normal text-white mt-1 font-mono">4.92</div>
                    <div className="text-[10px] text-emerald-400 mt-0.5">+18% к IVR</div>
                  </div>
                  <div className="p-3.5 rounded-[10px] bg-white/5 border border-white/10">
                    <div className="text-[11px] text-zinc-400">Отклик голоса</div>
                    <div className="text-xl sm:text-2xl font-normal text-emerald-400 mt-1 font-mono">0.51с</div>
                    <div className="text-[10px] text-zinc-300 mt-0.5">Потоковый TTS</div>
                  </div>
                  <div className="p-3.5 rounded-[10px] bg-white/5 border border-white/10">
                    <div className="text-[11px] text-zinc-400">Авто-запись</div>
                    <div className="text-xl sm:text-2xl font-normal text-white mt-1 font-mono">89.4%</div>
                    <div className="text-[10px] text-emerald-400 mt-0.5">Без участия админа</div>
                  </div>
                </div>

                {/* Live Call Event Feed */}
                <div className="p-3.5 rounded-[10px] bg-white/5 border border-white/10 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-zinc-300">
                    <span>Последний вызов: +375 (29) 310-44-18</span>
                    <span className="text-emerald-400 font-mono">Записан в YCLIENTS</span>
                  </div>
                  <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                    <div className="bg-white h-full w-[92%] rounded-full" />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                    <span>SMS-визитка отправлена клиенту</span>
                    <span>Чек: 280 BYN</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* PART 2: ElevenLabs 6-Card Bento Grid + Customer Impact Tabs       */}
        {/* ================================================================= */}
        <div className="space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/[0.04] text-black border border-black/[0.06] text-xs font-normal">
                Технологический стек Voxi.by
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-[40px] text-black tracking-[-0.025em] font-light">
                Создано для Беларуси.{' '}
                <span className="font-normal text-black">
                  Готово к высоким нагрузкам.
                </span>
              </h2>
            </div>
            <p className="text-base text-[#59544F] max-w-md leading-relaxed font-normal">
              Каждая деталь — от распознавания минских улиц и расчётов в BYN до прямой проверки расписания — объединена в одной платформе.
            </p>
          </div>

          {/* Row 1: Two Large 50/50 Interactive Bento Cards (ElevenLabs 16px Cards) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Large Bento Card 1: Interactive Prompt Reader with Emotional Cues */}
            <div className="rounded-[16px] liquid-glass-cream p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-black">
                    Живая речь и речевые филлеры
                  </span>
                  <span className="text-[11px] font-mono text-[#777169] liquid-glass-pill px-2.5 py-1">
                    Yandex SpeechKit + Voxi v2.5
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-medium text-black tracking-tight">
                  Эмоциональная интонация без неловких пауз
                </h3>
                <p className="text-xs sm:text-sm text-[#59544F] leading-relaxed font-normal">
                  Пока база данных проверяет свободный слот, ассистент произносит естественную фразу-заполнитель, удерживая внимание клиента.
                </p>
              </div>

              {/* Interactive Prompt Box */}
              <div className="rounded-[12px] liquid-glass-card p-5 space-y-4">
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
                  <span className="px-2 py-0.5 rounded-full bg-[#F5F3F1] text-black border border-black/[0.06]">
                    [филлер паузы 0.2с]
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#F5F3F1] text-black border border-black/[0.06]">
                    [проверка слота 18:30]
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#F5F3F1] text-black border border-black/[0.06]">
                    [расчёт в BYN]
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-black leading-relaxed font-normal">
                  «{promptSampleText}»
                </p>

                <div className="pt-3 border-t border-black/[0.06] flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-1 bg-black/[0.04] p-1 rounded-full">
                    <button
                      type="button"
                      onClick={() => {
                        setPromptVoice('anna');
                        VoiceSimulator.stop();
                        setIsPlayingPrompt(false);
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-normal transition-all cursor-pointer ${
                        promptVoice === 'anna'
                          ? 'bg-white text-black shadow-[0_0_0_0.5px_rgba(0,0,0,0.125),0_1px_1px_rgba(0,0,0,0.04)]'
                          : 'text-[#777169] hover:text-black'
                      }`}
                    >
                      Анна (Автошкола)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPromptVoice('maxim');
                        VoiceSimulator.stop();
                        setIsPlayingPrompt(false);
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-normal transition-all cursor-pointer ${
                        promptVoice === 'maxim'
                          ? 'bg-white text-black shadow-[0_0_0_0.5px_rgba(0,0,0,0.125),0_1px_1px_rgba(0,0,0,0.04)]'
                          : 'text-[#777169] hover:text-black'
                      }`}
                    >
                      Максим (СТО)
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleTogglePromptPlay}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black hover:bg-[#44403B] active:scale-[0.98] text-white text-xs font-normal transition-all cursor-pointer"
                  >
                    {isPlayingPrompt ? <PauseIcon size={15} /> : <PlayIcon size={15} />}
                    <span>{isPlayingPrompt ? 'Остановить' : 'Слушать пример'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Large Bento Card 2: Analytics & Two-Way Slot Verification Chart */}
            <div className="rounded-[16px] liquid-glass-cream p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-black">
                    Двусторонняя сверка слотов и ROI
                  </span>
                  <span className="text-[11px] font-mono text-emerald-700 liquid-glass-pill px-2.5 py-1">
                    Live Function Calling
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-medium text-black tracking-tight">
                  Конверсия звонков в подтверждённую запись
                </h3>
                <p className="text-xs sm:text-sm text-[#59544F] leading-relaxed font-normal">
                  Если время 18:00 уже занято в календаре, Voxi мгновенно видит коллизию и предлагает клиенту соседние окна 17:30 или 18:30.
                </p>
              </div>

              {/* Performance Comparison Visual Card */}
              <div className="rounded-[12px] liquid-glass-card p-5 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-black">Удержание вечерних и пиковых звонков</span>
                  <span className="font-mono text-xs font-medium text-emerald-600">+36.8% прирост записей</span>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-black flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-black" />
                        С платформой Voxi.by (24/7 + сверка слотов)
                      </span>
                      <span className="font-mono font-medium text-black">96.4%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#F5F3F1] overflow-hidden">
                      <div className="h-full w-[96.4%] rounded-full bg-black" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#777169] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-black/20" />
                        Обычный приём звонков без ИИ-дежурного
                      </span>
                      <span className="font-mono text-[#777169]">59.6%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#F5F3F1] overflow-hidden">
                      <div className="h-full w-[59.6%] rounded-full bg-black/20" />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-black/[0.06] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#777169]">
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                    <BoltCircleIcon size={14} className="text-emerald-500" />
                    Проверка занятости за 120 мс
                  </span>
                  <span className="font-mono">YCLIENTS • Google Calendar • Telegram</span>
                </div>
              </div>
            </div>

          </div>

          {/* Row 2: Four Equal 25% Architectural Feature Cards (ElevenLabs 16px Cards with Liquid Glass) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {smallBentoFeatures.map((item, index) => (
              <div
                key={index}
                className="p-6 rounded-[16px] liquid-glass-cream hover:bg-white/90 hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all flex flex-col justify-between space-y-5 group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-[10px] liquid-glass-pill text-black flex items-center justify-center transition-colors">
                      {item.icon}
                    </div>
                    <span className="font-mono text-[10px] font-normal px-2.5 py-0.5 rounded-full liquid-glass-pill text-black">
                      {item.badge}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-base font-medium text-black tracking-tight">
                      {item.title}
                    </h3>
                    <p className="text-[#59544F] text-xs leading-relaxed font-normal">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ElevenLabs Customer Testimonial Pill Bar Underneath Bento Grid with Liquid Glass */}
          <div className="rounded-[16px] liquid-glass-cream p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex flex-wrap items-center gap-2">
              {(['drive', 'sto', 'dental'] as const).map((key) => {
                const isSelected = activeCaseStudy === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveCaseStudy(key)}
                    className={`px-4 py-2 rounded-full text-xs font-normal transition-all cursor-pointer ${
                      isSelected
                        ? 'liquid-glass-pill text-black'
                        : 'bg-transparent text-[#59544F] hover:text-black hover:bg-white/40'
                    }`}
                  >
                    {caseStudies[key].company}
                  </button>
                );
              })}
            </div>

            <div className="flex-1 lg:px-4 space-y-1">
              <div className="text-xs font-medium text-emerald-600 flex items-center gap-1.5">
                <CheckCircleIcon size={15} />
                <span>{caseStudies[activeCaseStudy].metric}</span>
              </div>
              <p className="text-xs sm:text-sm text-black font-normal leading-relaxed">
                {caseStudies[activeCaseStudy].quote}
              </p>
              <div className="text-[11px] text-[#777169]">
                {caseStudies[activeCaseStudy].role}
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
