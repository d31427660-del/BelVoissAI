import React, { useRef, useState } from 'react';
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValueEvent,
  useReducedMotion,
} from 'framer-motion';
import { ArrowRightIcon } from '@solar-icons/react/bold-duotone';

interface CallJourneyScrollProps {
  onOpenAuth: () => void;
}

const CALL_STEPS = [
  {
    num: '01',
    time: '21:42:00',
    tag: 'ВХОДЯЩИЙ ЗВОНОК · 0.5 СЕК',
    title: 'Клиент звонит вечером или когда линия занята',
    desc: 'Мастера в ремзоне, врачи на приёме, офис уже закрыт. Вместо гудков в пустоту Voxi.by снимает трубку на вашем номере А1, МТС или Unitalk за полсекунды.',
    chip: 'Пример · +375 (29) 642-18-90 · Принят без гудков',
  },
  {
    num: '02',
    time: '21:42:18',
    tag: 'ЖИВОЙ ДИАЛОГ · ПРАЙС В BYN',
    title: 'Уточняет задачу, отвечает на вопросы и подбирает окно',
    desc: 'Никаких «нажмите 1». Слышит живую речь, называет точные цены в BYN (ТО, пробное занятие в автошколе, приём в клинике) и сверяет свободный слот.',
    chip: 'Диагностика 35 BYN · Бокс №2 завтра 18:30',
  },
  {
    num: '03',
    time: '21:43:02',
    tag: 'ГОТОВАЯ ЗАПИСЬ · CRM + TELEGRAM',
    title: 'Фиксирует карточку лида и записывает клиента в график',
    desc: 'Имя, телефон, услуга и статус «Подтверждено» автоматически уходят в YCLIENTS, Bitrix24, таблицу и Telegram, а клиенту приходит SMS-визитка с адресом.',
    chip: 'Запись #4821 · Отправлено в CRM и Telegram',
  },
];

const DIAL_TICKS = Array.from({ length: 90 }, (_, idx) => idx * 4);

/**
 * 1-to-1 shopify.design Scroll-Driven Colossal Radial Countdown + Asymmetric Manifesto
 * adapted 100% for Voxi.by's 3-step live call journey.
 */
export const CallJourneyScroll: React.FC<CallJourneyScrollProps> = ({ onOpenAuth }) => {
  const runwayRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: runwayRef,
    offset: ['start start', 'end end'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 26,
    mass: 0.45,
  });

  const progress = prefersReducedMotion ? scrollYProgress : smoothProgress;

  // Colossal SVG circle r=480 -> circumference ≈ 3016
  const CIRCUMFERENCE = 3016;
  const strokeDashoffset = useTransform(progress, [0, 1], [CIRCUMFERENCE * 0.68, 0]);
  // Giant orange clock hand sweeping dramatically across the dial (-55deg to +55deg)
  const handRotate = useTransform(progress, [0, 1], [-58, 58]);
  const dialScale = useTransform(progress, [0, 0.5, 1], [0.96, 1.02, 0.98]);

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    if (v < 0.33) setActiveIndex(0);
    else if (v < 0.67) setActiveIndex(1);
    else setActiveIndex(2);
  });

  const currentStep = CALL_STEPS[activeIndex] || CALL_STEPS[0];

  const jumpToStep = (idx: number) => {
    setActiveIndex(idx);
    const el = runwayRef.current;
    if (!el || typeof window === 'undefined') return;
    const rect = el.getBoundingClientRect();
    const headerOffset = window.innerWidth >= 1024 ? 84 : window.innerWidth >= 640 ? 76 : 68;
    const absTop = rect.top + window.scrollY - headerOffset;
    const maxScroll = Math.max(0, el.offsetHeight - (window.innerHeight - headerOffset));
    const targets = [0.06, 0.48, 0.88];
    window.scrollTo({
      top: Math.max(0, absTop + maxScroll * targets[idx]),
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  };

  return (
    <section id="how-it-works" className="relative bg-white scroll-mt-24">
      {/* Tall Scroll Runway driving the Sticky Colossal Dial (exact shopify.design countdown mechanics) */}
      <div ref={runwayRef} className="relative min-h-[260vh] lg:min-h-[300vh]">
        <div className="sticky top-[68px] sm:top-[76px] lg:top-[84px] h-[calc(100dvh-68px)] sm:h-[calc(100dvh-76px)] lg:h-[calc(100dvh-84px)] w-full overflow-hidden bg-white flex flex-col justify-between">
          {/* Top Minimal Step Header inside Sticky Viewport */}
          <div className="relative z-20 w-full max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 pt-5 sm:pt-7 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="max-w-md space-y-2">
              <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.11em] text-[#FF591D] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF591D]" />
                <span>{currentStep.tag}</span>
              </div>
              <h2 className="font-display text-[26px] sm:text-[34px] font-bold leading-[1.06] tracking-[-0.035em] text-black">
                {currentStep.title}
              </h2>
              <p className="text-[14px] sm:text-[15px] leading-relaxed text-[#525252]">
                {currentStep.desc}
              </p>
            </div>

            {/* Interactive Step Switcher Pills (allows instant jump as well as scrolling) */}
            <div className="flex flex-col sm:items-end gap-2.5 shrink-0">
              <div className="inline-flex items-center gap-1.5 p-1 rounded-full bg-[#F5F5F5] border border-black/[0.06]">
                {CALL_STEPS.map((s, idx) => {
                  const active = idx === activeIndex;
                  return (
                    <button
                      key={s.num}
                      type="button"
                      onClick={() => jumpToStep(idx)}
                      className={`min-h-[44px] sm:min-h-[36px] px-3.5 rounded-full font-mono text-[11px] font-semibold transition-colors cursor-pointer ${
                        active ? 'bg-black text-white' : 'text-[#666666] hover:text-black'
                      }`}
                    >
                      ШАГ {s.num}
                    </button>
                  );
                })}
              </div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-black/[0.08] font-mono text-[11px] text-black shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                <span>{currentStep.chip}</span>
              </div>
            </div>
          </div>

          {/* COLOSSAL ARCHING SVG CLOCK DIAL + GIANT NUMERAL + OVERSIZED #FF591D CLOCK HAND */}
          <motion.div
            style={{ scale: dialScale }}
            className="relative flex-1 flex items-end justify-center pointer-events-none select-none overflow-hidden"
          >
            {/* Colossal SVG Dial positioned so its upper arch spans edge-to-edge */}
            <div className="relative w-[min(1260px,138vw)] aspect-square translate-y-[44%] sm:translate-y-[42%] flex items-center justify-center">
              <svg
                viewBox="0 0 1000 1000"
                className="w-full h-full -rotate-90"
                aria-hidden="true"
              >
                {/* Radial perimeter tick marks (exact shopify.design dial) */}
                {DIAL_TICKS.map((deg, idx) => (
                  <line
                    key={idx}
                    x1="500"
                    y1="30"
                    x2="500"
                    y2={idx % 5 === 0 ? '48' : '42'}
                    stroke="rgba(0,0,0,0.16)"
                    strokeWidth={idx % 5 === 0 ? '2' : '1.25'}
                    transform={`rotate(${deg} 500 500)`}
                  />
                ))}
                {/* Faint outer circle */}
                <circle
                  cx="500"
                  cy="500"
                  r="480"
                  fill="none"
                  stroke="rgba(0,0,0,0.06)"
                  strokeWidth="1.5"
                />
                {/* Scroll-scrubbed #FF591D vermilion progress arc */}
                <motion.circle
                  cx="500"
                  cy="500"
                  r="480"
                  fill="none"
                  stroke="#FF591D"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  style={{ strokeDashoffset }}
                />
              </svg>

              {/* GIANT MONUMENTAL BLACK NUMERAL (01 / 02 / 03) */}
              <div className="absolute inset-x-0 top-[14%] sm:top-[12%] flex justify-center">
                <span className="font-display font-extrabold text-black text-[180px] sm:text-[310px] lg:text-[420px] leading-[0.82] tracking-[-0.06em] tabular-nums">
                  {currentStep.num}
                </span>
              </div>

              {/* OVERSIZED GLOSSY #FF591D ORANGE CLOCK HAND (exact shopify.design center-bottom pivot hand) */}
              <motion.div
                style={{ rotate: handRotate }}
                className="absolute inset-0 flex items-center justify-center will-change-transform"
              >
                <div className="relative flex flex-col items-center -translate-y-[18%]">
                  {/* Long tapered glossy orange clock arm */}
                  <div
                    className="w-[18px] sm:w-[24px] h-[250px] sm:h-[380px] lg:h-[440px] rounded-full"
                    style={{
                      background:
                        'linear-gradient(90deg, #FF7B42 0%, #FF591D 52%, #D93B04 100%)',
                      boxShadow: '0 18px 34px rgba(255, 89, 29, 0.35)',
                    }}
                  />
                  {/* Glossy circular pivot hub */}
                  <div
                    className="-mt-10 w-[72px] h-[72px] sm:w-[96px] sm:h-[96px] rounded-full"
                    style={{
                      background:
                        'radial-gradient(circle at 32% 30%, #FF8A54 0%, #FF591D 58%, #C93300 100%)',
                      boxShadow: '0 14px 30px rgba(255, 89, 29, 0.35)',
                    }}
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ASYMMETRIC MANIFESTO EXIT BAND (exact shopify.design lower countdown lockup: bold manifesto + black 44px pill + 44px circle arrow) */}
      <div className="w-full max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 pt-10 pb-20 lg:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          <div className="lg:col-span-5 lg:col-start-2">
            <h3 className="font-display text-[32px] sm:text-[42px] lg:text-[48px] font-bold leading-[1.04] tracking-[-0.04em] text-black">
              Ни один звонок
              <br />
              не уходит в пустоту.
              <br />
              Даже ночью.
            </h3>
          </div>

          <div className="lg:col-span-5 flex lg:justify-start">
            <div className="inline-flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenAuth}
                className="inline-flex items-center gap-2.5 h-[44px] px-6 rounded-full bg-black hover:bg-[#1f1f1f] text-white text-[13.5px] font-medium transition-colors cursor-pointer"
              >
                <span className="w-4 h-4 rounded-[4px] bg-white text-black inline-flex items-center justify-center font-display text-[10px] font-extrabold">
                  V
                </span>
                <span>Запустить тест на своих звонках</span>
              </button>
              <button
                type="button"
                onClick={onOpenAuth}
                aria-label="Перейти к запуску теста"
                className="w-[44px] h-[44px] rounded-full bg-black hover:bg-[#FE432A] text-white inline-flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <ArrowRightIcon size={17} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
