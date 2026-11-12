import React, { useState, useEffect } from 'react';
import {
  ArrowRightIcon,
  SoundwaveCircleIcon,
  PauseIcon,
  PlayIcon,
  ChatRoundCallIcon,
  AltArrowLeftIcon,
  AltArrowRightIcon
} from '@solar-icons/react/bold-duotone';
import { VoiceSimulator } from '../../lib/speechSynth';
import { VoiceId } from '../../types';

interface HeroProps {
  onOpenVoiceTest?: () => void;
  onOpenAuth: () => void;
}

interface OrbScenario {
  id: string;
  pillLabel: string;
  title: string;
  subtitle: string;
  voice: VoiceId;
  voiceBadge: string;
  emotionCue: string;
  image: string;
  orbGradient: string;
  orbShadow: string;
  questions: Array<{
    id: string;
    question: string;
    answerAnna: string;
    answerMaxim: string;
  }>;
}

const ORB_SCENARIOS: OrbScenario[] = [
  {
    id: 'driving',
    pillLabel: 'Автошкола • Категория B',
    title: 'Автошкола «Драйв-Минск» ↗',
    subtitle: 'Естественная консультация курсантов по стоимости в BYN, рассрочке и вечерним группам.',
    voice: 'anna',
    voiceBadge: 'Голос: Анна • Эмпатичный тембр',
    emotionCue: '[доброжелательно, без пауз]',
    image: '/orbs/orb-1.webp',
    orbGradient: 'radial-gradient(circle at 32% 28%, #60a5fa 0%, #2563eb 45%, #3730a3 85%, #1e1b4b 100%)',
    orbShadow: '0 24px 60px -10px rgba(37, 99, 235, 0.45)',
    questions: [
      {
        id: 'price',
        question: 'Сколько стоит обучение и есть ли рассрочка?',
        answerAnna: 'Полный курс обучения стоит тысячу пятьдесят белорусских рублей. Мы оформляем беспроцентную рассрочку на четыре платежа без справок о доходах.',
        answerMaxim: 'Полный курс категории Б с топливом стоит тысячу пятьдесят белорусских рублей. Доступна внутренняя рассрочка на четыре этапа.'
      },
      {
        id: 'booking',
        question: 'Можно записаться на сегодня после 18:00?',
        answerAnna: 'Да, конечно! Сегодня в восемнадцать тридцать есть свободное место на вводное занятие. Подскажите ваше имя, и я сразу отправлю пропуск вам в Телеграм.',
        answerMaxim: 'Да, сегодня в восемнадцать тридцать открыта запись в вечернюю группу. Назовите ваше имя, я забронирую место.'
      },
      {
        id: 'location',
        question: 'Где вы находитесь и работаете ли в выходные?',
        answerAnna: 'Мы находимся в Минске на улице Сурганова двадцать четыре, в двух минутах от метро Академия Наук. Работаем ежедневно с девяти утра до девяти вечера.',
        answerMaxim: 'Наш учебный класс находится в Минске на улице Сурганова двадцать четыре, рядом с метро Академия Наук. Ждем вас и в выходные дни.'
      }
    ]
  },
  {
    id: 'sto',
    pillLabel: 'Автосервис и СТО',
    title: 'СТО «Авторитет-Сервис» ↗',
    subtitle: 'Уверенный мужской голос мастера-приёмщика: расчёт ТО, проверка подъёмников и запись по марке авто.',
    voice: 'maxim',
    voiceBadge: 'Голос: Максим • Уверенный эксперт',
    emotionCue: '[уверенно, по-деловому]',
    image: '/orbs/orb-3.webp',
    orbGradient: 'radial-gradient(circle at 32% 28%, #34d399 0%, #059669 45%, #2563eb 85%, #0f172a 100%)',
    orbShadow: '0 24px 60px -10px rgba(16, 185, 129, 0.45)',
    questions: [
      {
        id: 'price',
        question: 'Сколько стоит диагностика подвески и замена масла?',
        answerAnna: 'Компьютерная и слесарная диагностика подвески стоит тридцать пять белорусских рублей, а при ремонте у нас проводится бесплатно.',
        answerMaxim: 'Стоимость диагностики и обслуживания в нашем СТО — от тридцати пяти белорусских рублей, а при ремонте диагностика бесплатна. Есть рассрочка по Халве.'
      },
      {
        id: 'booking',
        question: 'Есть свободный подъёмник на сегодня вечером?',
        answerAnna: 'Да, сегодня на восемнадцать тридцать свободен второй бокс. Подскажите марку автомобиля и ваше имя.',
        answerMaxim: 'Да, конечно! Сегодня после восемнадцати ноль-ноль свободен второй бокс на восемнадцать тридцать. Назовите марку автомобиля и ваше имя, я сразу забронирую время за вами.'
      },
      {
        id: 'location',
        question: 'Куда подъезжать и есть ли запчасти в наличии?',
        answerAnna: 'Мы находимся на улице Тимирязева сто двадцать один, удобный заезд с МКАД. Фильтры и масла в наличии на складе.',
        answerMaxim: 'Мы находимся в Минске на улице Тимирязева сто двадцать один, удобный съезд с МКАД. Работаем ежедневно с девяти утра до восьми вечера, запчасти в наличии.'
      }
    ]
  },
  {
    id: 'clinic',
    pillLabel: 'Стоматология и Медцентр',
    title: 'Клиника «ДентаЛюкс» ↗',
    subtitle: 'Мгновенный приём обращений с острой болью за 0.5 сек, подбор врача и сверка с расписанием.',
    voice: 'anna',
    voiceBadge: 'Голос: Анна • Заботливый администратор',
    emotionCue: '[мягко, внимательно]',
    image: '/orbs/orb-2.webp',
    orbGradient: 'radial-gradient(circle at 32% 28%, #818cf8 0%, #4f46e5 48%, #2563eb 82%, #1e1b4b 100%)',
    orbShadow: '0 24px 60px -10px rgba(79, 70, 229, 0.45)',
    questions: [
      {
        id: 'price',
        question: 'Сколько стоит консультация стоматолога и снимок?',
        answerAnna: 'Первичная консультация врача-стоматолога с планом лечения стоит сорок пять белорусских рублей, 3D-снимок делаем на месте за пятьдесят рублей.',
        answerMaxim: 'Первичный осмотр и составление плана лечения стоят сорок пять белорусских рублей. Принимаем также по страховкам Белгосстрах и ТАСК.'
      },
      {
        id: 'booking',
        question: 'Болит зуб, можно попасть к врачу сегодня?',
        answerAnna: 'При острой боли мы принимаем без очереди! Сегодня в семнадцать сорок пять есть окно у хирурга-терапевта. Записать вас на это время?',
        answerMaxim: 'С острой болью примем вас сегодня! Есть окно в семнадцать сорок пять. Подскажите ваше имя для оформления карты.'
      },
      {
        id: 'location',
        question: 'Работаете ли вы по медицинским страховкам?',
        answerAnna: 'Да, мы работаем со страховыми компаниями Белгосстрах, ТАСК и Белнефтестрах. Находимся на проспекте Победителей восемьдесят четыре.',
        answerMaxim: 'Да, обслуживаем по полисам ДМС Белгосстрах и ТАСК. Ждем вас на проспекте Победителей восемьдесят четыре.'
      }
    ]
  },
  {
    id: 'beauty',
    pillLabel: 'Салон красоты и SPA',
    title: 'Студия «Бьюти-Минск» ↗',
    subtitle: 'Круглосуточная запись в YCLIENTS, подбор топ-мастера и предложение комплексных процедур.',
    voice: 'anna',
    voiceBadge: 'Голос: Анна • Премиальный сервис',
    emotionCue: '[приветливо, выразительно]',
    image: '/orbs/orb-4.webp',
    orbGradient: 'radial-gradient(circle at 32% 28%, #38bdf8 0%, #2563eb 45%, #10b981 88%, #0f172a 100%)',
    orbShadow: '0 24px 60px -10px rgba(14, 165, 233, 0.45)',
    questions: [
      {
        id: 'price',
        question: 'Какая стоимость маникюра с покрытием и укладки?',
        answerAnna: 'Комплекс маникюра со снятием и укреплением у топ-мастера стоит семьдесят пять белорусских рублей, вечерняя укладка — от восьмидесяти рублей.',
        answerMaxim: 'Маникюр с покрытием стоит семьдесят пять белорусских рублей, укладка — от восьмидесяти рублей.'
      },
      {
        id: 'booking',
        question: 'Есть окошко на завтра в первой половине дня?',
        answerAnna: 'Да! Завтра в одиннадцать тридцать свободно окно у топ-мастера Алины. Оформить запись и прислать напоминание в Телеграм?',
        answerMaxim: 'Завтра на одиннадцать тридцать есть свободное окно у мастера Алины. Записать вас?'
      },
      {
        id: 'location',
        question: 'Есть ли парковка рядом с вашим салоном?',
        answerAnna: 'Да, для гостей салона работает бесплатная парковка со стороны улицы Немига двенадцать. Будем рады видеть вас!',
        answerMaxim: 'У нас есть гостевая парковка в центре на улице Немига двенадцать.'
      }
    ]
  },
  {
    id: 'sip',
    pillLabel: 'Ночной дежурный 24/7',
    title: 'Ночной консьерж РБ ↗',
    subtitle: 'Приём вызовов после 20:00 и в выходные дни без потерь рекламного бюджета.',
    voice: 'maxim',
    voiceBadge: 'Голос: Максим • Дежурный 24/7',
    emotionCue: '[спокойно, чёткая дикция]',
    image: '/orbs/orb-5.webp',
    orbGradient: 'radial-gradient(circle at 32% 28%, #2dd4bf 0%, #2563eb 52%, #1e3a8a 90%, #090d16 100%)',
    orbShadow: '0 24px 60px -10px rgba(37, 99, 235, 0.45)',
    questions: [
      {
        id: 'price',
        question: 'Вы сейчас работаете? Хочу оставить заявку на утро.',
        answerAnna: 'Офис откроется в девять утра, но я дежурный голосовой ассистент и могу прямо сейчас рассчитать стоимость и записать вас на удобное время!',
        answerMaxim: 'Здравствуйте! Сейчас нерабочее время офиса, но я голосовой помощник компании и с радостью забронирую для вас время на завтрашнее утро.'
      },
      {
        id: 'booking',
        question: 'Пусть мне перезвонит старший специалист в 9:30.',
        answerAnna: 'Принято! Я уже передала ваш номер в Телеграм старшему менеджеру с пометкой позвонить ровно в девять тридцать утра.',
        answerMaxim: 'Договорились! Я зафиксировал ваш номер и отправил карточку руководителю в Телеграм. Вам перезвонят завтра ровно в девять тридцать.'
      },
      {
        id: 'location',
        question: 'Пришлите мне схему проезда и прайс в SMS.',
        answerAnna: 'Уже отправляю! В течение десяти секунд вам придет сообщение с точным адресом, точкой на карте и актуальным прайс-листом в белорусских рублях.',
        answerMaxim: 'Готово! Отправил вам SMS-визитку с адресом, картой проезда и ценами в белорусских рублях.'
      }
    ]
  }
];

export const Hero: React.FC<HeroProps> = ({
  onOpenVoiceTest,
  onOpenAuth
}) => {
  const [activeScenarioIndex, setActiveScenarioIndex] = useState<number>(0);
  const [selectedVoice, setSelectedVoice] = useState<VoiceId>('anna');
  const [activeQuestionId, setActiveQuestionId] = useState<string>('price');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [screenWidth, setScreenWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    let resizeTimer: number;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        setScreenWidth(window.innerWidth);
      }, 150);
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
      VoiceSimulator.stop();
    };
  }, []);

  const currentScenario = ORB_SCENARIOS[activeScenarioIndex] || ORB_SCENARIOS[0];
  const currentQuestionObj =
    currentScenario.questions.find((q) => q.id === activeQuestionId) ||
    currentScenario.questions[0];
  const currentAnswerText =
    selectedVoice === 'maxim' ? currentQuestionObj.answerMaxim : currentQuestionObj.answerAnna;

  const selectScenarioByIndex = (nextIndex: number) => {
    const normalized = (nextIndex + ORB_SCENARIOS.length) % ORB_SCENARIOS.length;
    const nextScenario = ORB_SCENARIOS[normalized];
    setActiveScenarioIndex(normalized);
    setSelectedVoice(nextScenario.voice);
    setActiveQuestionId(nextScenario.questions[0].id);
    VoiceSimulator.stop();
    setIsSpeaking(false);
  };

  const playQuestionAnswer = (
    questionObj: OrbScenario['questions'][0],
    voiceOverride?: VoiceId
  ) => {
    const targetVoice = voiceOverride || selectedVoice;
    const textToSpeak =
      targetVoice === 'maxim' ? questionObj.answerMaxim : questionObj.answerAnna;

    setActiveQuestionId(questionObj.id);
    VoiceSimulator.stop();

    VoiceSimulator.speak(
      textToSpeak,
      targetVoice,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    );
  };

  const handleOrbToggle = () => {
    if (isSpeaking) {
      VoiceSimulator.stop();
      setIsSpeaking(false);
    } else {
      playQuestionAnswer(currentQuestionObj);
    }
  };

  const handleVoiceChange = (voice: VoiceId) => {
    setSelectedVoice(voice);
    if (isSpeaking) {
      playQuestionAnswer(currentQuestionObj, voice);
    }
  };

  // Compute relative position (-2, -1, 0, +1, +2) for the 5-Orb ElevenLabs Carousel
  const getRelativeOffset = (idx: number) => {
    const total = ORB_SCENARIOS.length;
    let diff = idx - activeScenarioIndex;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    return diff;
  };

  return (
    <section className="relative overflow-hidden pt-10 pb-20 md:pt-16 md:pb-24 bg-transparent">
      {/* Subtle Hardware-accelerated Radial Ambiance (Zero blur raster overhead) */}
      <div
        className="pointer-events-none absolute -top-36 right-[8%] w-[580px] h-[580px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(255, 142, 84, 0.16) 0%, rgba(251, 146, 60, 0.06) 45%, transparent 70%)',
          transform: 'translateZ(0)'
        }}
      />
      <div
        className="pointer-events-none absolute top-1/2 -left-36 w-[480px] h-[480px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(251, 191, 36, 0.12) 0%, rgba(126, 178, 163, 0.08) 45%, transparent 70%)',
          transform: 'translateZ(0)'
        }}
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
        
        {/* PART 1: ElevenLabs Editorial Asymmetrical 2-Column Hero Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start pb-12 md:pb-14">
          
          {/* Left Column: Giant Waldenburg-style H1 + ElevenLabs Dual Pill Buttons */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full liquid-glass-pill text-black text-xs font-normal">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Голосовой ИИ для бизнеса Беларуси • Отклик 0.5 сек</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[54px] text-black tracking-[-0.025em] leading-[1.08] font-light">
              Оживляем голосовые технологии.{' '}
              <span className="font-normal text-black">
                На линии 24/7.
              </span>
            </h1>

            {/* ElevenLabs Exact Dual Buttons with subtle liquid glass */}
            <div className="pt-1 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={onOpenAuth}
                className="inline-flex items-center justify-center rounded-full liquid-glass-btn-primary text-white px-5 h-11 text-base font-normal active:scale-[0.98] gap-2 whitespace-nowrap cursor-pointer"
              >
                <span>Настроить за 5 минут</span>
                <ArrowRightIcon size={18} />
              </button>

              {onOpenVoiceTest && (
                <button
                  type="button"
                  onClick={onOpenVoiceTest}
                  className="inline-flex items-center justify-center rounded-full liquid-glass-pill text-black px-5 h-11 text-base font-normal active:scale-[0.98] transition-all gap-2 whitespace-nowrap cursor-pointer group"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <SoundwaveCircleIcon size={19} className="text-black group-hover:scale-105 transition-transform" />
                  <span>Поговорить с Voxi прямо сейчас</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Top-Aligned Lead Value Proposition */}
          <div className="lg:col-span-5 lg:pt-11 flex flex-col justify-between space-y-5">
            <p className="text-base sm:text-[18px] text-[#59544F] font-normal leading-relaxed">
              Платформа речевого ИИ для передовых компаний Беларуси. От{' '}
              <strong className="font-medium text-black">Voxi Агентов</strong> для круглосуточного приёма звонков МТС и А1 и{' '}
              <strong className="font-medium text-black">Voxi Голоса</strong> с живой интонацией — до прямой записи клиентов в YCLIENTS, Bitrix24 и Telegram.
            </p>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#777169] border-t border-black/[0.075] pt-4">
              <span className="inline-flex items-center gap-1.5 font-medium text-black">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                0 BYN абонплата
              </span>
              <span>•</span>
              <span className="font-mono text-xs text-black font-medium">520ms latency</span>
              <span>•</span>
              <span>ЕРИП и bePaid</span>
              <span>•</span>
              <a href="#benchmark" className="text-black hover:underline font-medium">
                Бенчмарк речи →
              </a>
            </div>
          </div>
        </div>

        {/* PART 2: ElevenLabs Central Interactive Showcase Widget (Exact #F5F3F1 + Liquid Glass) */}
        <div
          id="showcase"
          className="rounded-[16px] liquid-glass-cream p-5 sm:p-7 lg:p-8 scroll-mt-24 relative overflow-hidden"
        >
          {/* Top Bar: Title & Voice Switcher */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-7 pb-5 border-b border-black/[0.06]">
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs bg-black"
              />
              <span className="text-sm sm:text-base font-medium text-black">
                Voxi Голос
              </span>
              <span className="hidden sm:inline-block text-xs text-[#777169] font-normal">
                • 5 отраслевых сценариев Беларуси
              </span>
            </div>

            {/* Right Status & Voice Switcher Pill */}
            <div className="flex items-center justify-between sm:justify-end gap-2">
              <div className="inline-flex items-center gap-1 bg-black/[0.04] p-1 rounded-full backdrop-blur-sm border border-black/[0.04]">
                <button
                  type="button"
                  onClick={() => handleVoiceChange('anna')}
                  className={`px-3.5 py-1 rounded-full text-xs font-normal transition-all cursor-pointer ${
                    selectedVoice === 'anna'
                      ? 'bg-white text-black shadow-[0_0_0_0.5px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.04)]'
                      : 'text-[#777169] hover:text-black'
                  }`}
                >
                  Голос: Анна
                </button>
                <button
                  type="button"
                  onClick={() => handleVoiceChange('maxim')}
                  className={`px-3.5 py-1 rounded-full text-xs font-normal transition-all cursor-pointer ${
                    selectedVoice === 'maxim'
                      ? 'bg-white text-black shadow-[0_0_0_0.5px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.04)]'
                      : 'text-[#777169] hover:text-black'
                  }`}
                >
                  Голос: Максим
                </button>
              </div>
            </div>
          </div>

          {/* ElevenLabs 5-Orb Floating Audio Showcase Stage */}
          <div className="space-y-7">
              
              {/* Secondary Category Pills */}
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {ORB_SCENARIOS.map((sc, idx) => {
                  const isCurrent = idx === activeScenarioIndex;
                  return (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => selectScenarioByIndex(idx)}
                      className={`px-4 py-2 rounded-full text-xs font-normal transition-all cursor-pointer ${
                        isCurrent
                          ? 'liquid-glass-pill text-black'
                          : 'bg-transparent text-[#59544F] hover:text-black hover:bg-white/40'
                      }`}
                    >
                      {sc.pillLabel}
                    </button>
                  );
                })}
              </div>

              {/* ElevenLabs 5-Orb Floating Audio Stage */}
              <div className="relative py-6 sm:py-8 flex flex-col items-center justify-center overflow-hidden">
                
                {/* 5-Sphere Horizontal Stage with Authentic ElevenLabs Arc Trajectory */}
                <div className="relative w-full max-w-[880px] h-64 sm:h-72 md:h-80 flex items-center justify-center select-none overflow-visible">
                  {ORB_SCENARIOS.map((sc, idx) => {
                    const offset = getRelativeOffset(idx);
                    const isCenter = offset === 0;
                    const absOffset = Math.abs(offset);
                    const sign = offset < 0 ? -1 : 1;

                    // Responsive X multiplier for mobile/tablet screens
                    const xMultiplier =
                      screenWidth < 480 ? 0.44 : screenWidth < 768 ? 0.65 : screenWidth < 1024 ? 0.85 : 1;

                    // ElevenLabs Slot Transforms (X arc, Y depression, Scale depth, Opacity, Z-Index)
                    let tx = 0;
                    let ty = 0;
                    let scale = 1;
                    let opacity = 1;
                    let zIndex = 30;

                    if (absOffset === 1) {
                      tx = sign * 215 * xMultiplier;
                      ty = 22;
                      scale = 0.76;
                      opacity = 0.78;
                      zIndex = 20;
                    } else if (absOffset === 2) {
                      tx = sign * 395 * xMultiplier;
                      ty = 46;
                      scale = 0.54;
                      opacity = 0.44;
                      zIndex = 10;
                    }

                    return (
                      <div
                        key={sc.id}
                        style={{
                          transform: `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`,
                          opacity,
                          zIndex,
                          transition: 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                        className="absolute flex items-center justify-center origin-center will-change-transform"
                      >
                        <div className="relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 flex items-center justify-center">
                          {/* Center Acoustic Radiant Glow - active only during speech */}
                          {isCenter && isSpeaking && (
                            <div className="absolute -inset-4 sm:-inset-6 rounded-full bg-black/15 blur-xl pointer-events-none animate-pulse will-change-transform" />
                          )}

                          {/* Sphere Body with Authentic ElevenLabs 3D Texture */}
                          <div
                            className={`w-full h-full rounded-full overflow-hidden relative shadow-[0_20px_50px_rgba(0,0,0,0.14)] ring-1 ring-inset ring-black/10 transition-transform ${
                              !isCenter
                                ? 'cursor-pointer hover:scale-105 hover:ring-black/20 hover:shadow-[0_26px_60px_rgba(0,0,0,0.22)]'
                                : ''
                            }`}
                            onClick={!isCenter ? () => selectScenarioByIndex(idx) : undefined}
                          >
                            {/* High-Resolution Photorealistic 3D Texture */}
                            <img
                              src={sc.image}
                              alt={sc.title}
                              loading={isCenter ? 'eager' : 'lazy'}
                              decoding="async"
                              className={`w-full h-full object-cover select-none pointer-events-none will-change-transform ${
                                isCenter && isSpeaking ? 'animate-[spin_16s_linear_infinite]' : ''
                              }`}
                              draggable={false}
                            />

                            {/* Specular 3D Lighting Sheen Overlay */}
                            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-black/5 via-transparent to-white/25 pointer-events-none" />
                          </div>

                          {/* Exact Center White Circular Play/Pause Button with Liquid Glass */}
                          {isCenter && (
                            <button
                              type="button"
                              onClick={handleOrbToggle}
                              aria-label={isSpeaking ? 'Остановить озвучку' : 'Прослушать голос ИИ'}
                              className="absolute inset-0 m-auto z-30 w-14 h-14 sm:w-16 sm:h-16 rounded-full liquid-glass-pill text-black hover:scale-105 active:scale-95 shadow-[inset_0_1.5px_1px_rgba(255,255,255,1),0_12px_36px_rgba(0,0,0,0.18)] flex items-center justify-center transition-transform cursor-pointer group"
                            >
                              {isSpeaking ? (
                                <PauseIcon size={24} className="text-black" />
                              ) : (
                                <PlayIcon
                                  size={24}
                                  className="text-black ml-0.5 transition-colors"
                                />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Scenario Title, Prev/Next Arrows & Subtitle Underneath Center Orb */}
                <div className="mt-2 flex flex-col items-center text-center max-w-xl mx-auto px-2 space-y-2">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => selectScenarioByIndex(activeScenarioIndex - 1)}
                      aria-label="Предыдущий сценарий"
                      className="w-8 h-8 rounded-full bg-white text-black shadow-[0_0_0_0.5px_rgba(0,0,0,0.125),0_1px_1px_rgba(0,0,0,0.04)] hover:bg-[#FDFCFC] flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                    >
                      <AltArrowLeftIcon size={16} />
                    </button>

                    <div className="text-base sm:text-lg font-medium text-black tracking-tight">
                      {currentScenario.title}
                    </div>

                    <button
                      type="button"
                      onClick={() => selectScenarioByIndex(activeScenarioIndex + 1)}
                      aria-label="Следующий сценарий"
                      className="w-8 h-8 rounded-full bg-white text-black shadow-[0_0_0_0.5px_rgba(0,0,0,0.125),0_1px_1px_rgba(0,0,0,0.04)] hover:bg-[#FDFCFC] flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                    >
                      <AltArrowRightIcon size={16} />
                    </button>
                  </div>

                  <p className="text-xs sm:text-sm text-[#777169]">
                    {currentScenario.subtitle}
                  </p>
                </div>
              </div>

              {/* Live Spoken Script & 3 Interactive Client Questions */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch pt-2">
                
                {/* Left: Live Emotional Prompt Reader Card (ElevenLabs 12px Card with Liquid Glass) */}
                <div className="lg:col-span-6 rounded-[12px] liquid-glass-card p-5 sm:p-6 flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-mono text-[11px] font-normal px-2.5 py-1 rounded-full liquid-glass-pill text-black">
                      {currentScenario.emotionCue}
                    </span>
                    <span className="text-[#777169] font-mono text-[11px]">
                      {selectedVoice === 'maxim' ? 'Максим (48 kHz Neural)' : 'Анна (48 kHz Neural)'}
                    </span>
                  </div>

                  <div
                    key={`${currentScenario.id}-${selectedVoice}-${activeQuestionId}`}
                    className="text-sm sm:text-base text-black font-normal leading-relaxed animate-fadeIn"
                  >
                    <span className="text-black font-semibold mr-1.5">
                      {selectedVoice === 'maxim' ? 'Максим:' : 'Анна:'}
                    </span>
                    «{currentAnswerText}»
                  </div>

                  <div className="pt-3 border-t border-black/[0.06] flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={handleOrbToggle}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full liquid-glass-btn-primary active:scale-[0.98] text-white text-xs font-normal transition-all cursor-pointer"
                    >
                      {isSpeaking ? <PauseIcon size={15} /> : <PlayIcon size={15} />}
                      <span>{isSpeaking ? 'Пауза' : 'Озвучить ответ'}</span>
                    </button>

                    {onOpenVoiceTest && (
                      <button
                        type="button"
                        onClick={onOpenVoiceTest}
                        className="text-xs font-normal text-black hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Задать свой вопрос микрофоном</span>
                        <ArrowRightIcon size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Right: 3 Interactive Question Cards (ElevenLabs 12px Cards with Liquid Glass) */}
                <div className="lg:col-span-6 flex flex-col justify-between space-y-2">
                  <div className="text-[11px] font-normal text-[#777169] tracking-normal px-1 uppercase">
                    Выберите вопрос клиента для мгновенной озвучки:
                  </div>

                  {currentScenario.questions.map((item) => {
                    const isSelected = activeQuestionId === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => playQuestionAnswer(item)}
                        className={`w-full px-4 py-3 rounded-[12px] text-xs sm:text-sm font-normal flex items-center justify-between gap-3 transition-all text-left cursor-pointer ${
                          isSelected
                            ? 'liquid-glass-btn-primary text-white shadow-sm'
                            : 'liquid-glass-card hover:bg-white text-black'
                        }`}
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <ChatRoundCallIcon
                            size={17}
                            className={isSelected ? 'text-white shrink-0' : 'text-[#777169] shrink-0'}
                          />
                          <span className="truncate">«{item.question}»</span>
                        </span>
                        <span
                          className={`shrink-0 text-[11px] font-normal px-2.5 py-0.5 rounded-full ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'liquid-glass-pill text-black'
                          }`}
                        >
                          {isSelected && isSpeaking ? '● Звучит' : 'Слушать'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
        </div>
      </div>
    </section>
  );
};
