import React, { useState, useEffect } from 'react';
import {
  ArrowRightUpIcon,
  PlayIcon,
  PauseIcon,
  PhoneCallingRoundedIcon,
} from '@solar-icons/react/bold-duotone';
import { VoiceSimulator } from '../../lib/speechSynth';
import { VoiceId } from '../../types';
import { ScrollReveal } from './ScrollReveal';

interface HeroProps {
  onOpenVoiceTest?: () => void;
  onOpenAuth: () => void;
}

interface BentoDemo {
  id: 'sto' | 'driving' | 'clinic';
  label: string;
  company: string;
  caller: string;
  reply: string;
  voice: VoiceId;
  audioPhrase: string;
  client: string;
  phone: string;
  slot: string;
  priceByn: string;
}

const BENTO_DEMOS: BentoDemo[] = [
  {
    id: 'sto',
    label: 'СТО',
    company: 'СТО «Минск-Моторс»',
    caller: 'Есть свободный подъёмник сегодня после 18:00?',
    reply: 'Да! Сегодня в 18:30 свободен второй бокс. Назовите марку авто и ваше имя — сразу забронирую.',
    voice: 'maxim',
    audioPhrase:
      'Да, конечно! Сегодня после восемнадцати ноль-ноль свободен второй бокс на восемнадцать тридцать. Назовите марку автомобиля и ваше имя, я сразу забронирую время за вами.',
    client: 'Дмитрий · VW Tiguan',
    phone: '+375 (29) 642-18-90',
    slot: 'Сегодня, 18:30 · Бокс №2',
    priceByn: 'от 35 BYN',
  },
  {
    id: 'driving',
    label: 'Автошкола',
    company: 'Автошкола «Драйв-Минск»',
    caller: 'Сколько стоит категория B и есть ли рассрочка?',
    reply: 'Полный курс стоит 1 050 BYN, рассрочка на 4 платежа без справок. Записать на вводное занятие?',
    voice: 'anna',
    audioPhrase:
      'Полный курс обучения стоит тысячу пятьдесят белорусских рублей. Мы оформляем беспроцентную рассрочку на четыре платежа без справок о доходах.',
    client: 'Екатерина · Категория B',
    phone: '+375 (33) 319-44-12',
    slot: 'Завтра, 18:30 · Сурганова, 24',
    priceByn: '1 050 BYN',
  },
  {
    id: 'clinic',
    label: 'Клиника',
    company: 'Клиника «Дент-Престиж»',
    caller: 'Болит зуб, можно попасть к врачу сегодня?',
    reply: 'При острой боли принимаем без очереди! Сегодня в 17:45 есть окно у хирурга-терапевта.',
    voice: 'anna',
    audioPhrase:
      'При острой боли мы принимаем без очереди! Сегодня в семнадцать сорок пять есть окно у хирурга-терапевта. Записать вас на это время?',
    client: 'Алексей · Острая боль',
    phone: '+375 (44) 705-88-21',
    slot: 'Сегодня, 17:45 · Победителей, 84',
    priceByn: '45 BYN',
  },
];

const MICRO_DOTS = [
  'top-3 left-3',
  'top-3 right-3',
  'bottom-3 left-3',
  'bottom-3 right-3',
];

export const Hero: React.FC<HeroProps> = ({ onOpenVoiceTest, onOpenAuth }) => {
  const [activeId, setActiveId] = useState<'sto' | 'driving' | 'clinic'>('sto');
  const [playingTrack, setPlayingTrack] = useState<'live' | 'ivr' | 'voxi' | null>(null);

  const activeDemo = BENTO_DEMOS.find((d) => d.id === activeId) || BENTO_DEMOS[0];

  useEffect(() => {
    return () => {
      VoiceSimulator.stop();
    };
  }, []);

  const handlePlay = (track: 'live' | 'ivr' | 'voxi', phrase: string, voice: VoiceId) => {
    if (playingTrack === track) {
      VoiceSimulator.stop();
      setPlayingTrack(null);
      return;
    }
    VoiceSimulator.unlock();
    VoiceSimulator.stop();
    setPlayingTrack(track);
    VoiceSimulator.speak(
      phrase,
      voice,
      () => setPlayingTrack(track),
      () => setPlayingTrack(null)
    );
  };

  return (
    <section id="showcase" className="relative bg-white pb-16 lg:pb-24">
      <div className="w-full max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
        {/* 1-to-1 shopify.design Monumental 2-Line Centered Hero Lockup */}
        <div className="pt-8 sm:pt-14 lg:pt-16 pb-16 sm:pb-24 lg:pb-28 text-center flex flex-col items-center justify-center min-h-[430px] sm:min-h-[540px] lg:min-h-[600px]">
          <h1 className="font-display font-bold text-black text-[48px] sm:text-[86px] lg:text-[124px] xl:text-[144px] leading-[0.94] tracking-[-0.048em] select-none">
            Каждый звонок
            <br />
            в запись 24/7
          </h1>

          <p className="mt-6 sm:mt-8 max-w-[560px] text-[15px] sm:text-[17px] leading-[1.45] font-medium text-black">
            ИИ-администратор Voxi.by отвечает на звонки и заявки в Беларуси за 0.5 сек — без пропущенных и очередей.
          </p>
        </div>

        {/* Exact shopify.design Full-Width LIVE Hairline Bar */}
        <div className="mb-6 flex items-center gap-4">
          <div className="inline-flex items-center gap-2 shrink-0">
            <span className="w-[6px] h-[6px] rounded-full bg-[#34D399]" aria-hidden="true" />
            <span className="font-mono text-[11px] tracking-[0.11em] uppercase text-black">
              LIVE
            </span>
          </div>
          <div className="h-px flex-1 bg-black/[0.08]" aria-hidden="true" />
          <div className="inline-flex items-center gap-2.5 shrink-0">
            <span className="font-mono text-[11px] tracking-[0.11em] uppercase text-black">
              VOXI.BY · БЕЛАРУСЬ
            </span>
            <span
              className="w-[22px] h-[22px] rounded-[6px] bg-black text-white inline-flex items-center justify-center gap-[2px]"
              aria-hidden="true"
            >
              <span className="w-[2px] h-2.5 rounded-full bg-white" />
              <span className="w-[2px] h-2.5 rounded-full bg-white" />
            </span>
          </div>
        </div>

        <div className="relative">
          {/* EXACT 3-Column Independent Flex Masonry Grid (shopify.design .hero-grid: 3 cols, 21.6px gaps, 24px radius, zero drop shadows) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[21px] items-start">
            {/* ==================== COLUMN 1 ==================== */}
            <div className="flex flex-col gap-[21px]">
              {/* Card 1A: Obsidian Dotted Surface — Live Call Stream (mirrors `Suppl` card) */}
              <div className="voxi-dot-surface rounded-[24px] p-6 sm:p-7 text-white flex flex-col justify-between min-h-[430px]">
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="w-7 h-7 rounded-[7px] bg-white/15 text-white inline-flex items-center justify-center font-display text-xs font-bold">
                      V
                    </span>
                    <div
                      role="tablist"
                      aria-label="Сценарии живого звонка"
                      className="inline-flex items-center gap-1 p-1 rounded-full bg-white/10"
                    >
                      {BENTO_DEMOS.map((demo) => {
                        const selected = demo.id === activeId;
                        return (
                          <button
                            key={demo.id}
                            type="button"
                            role="tab"
                            aria-selected={selected}
                            onClick={() => {
                              VoiceSimulator.stop();
                              setPlayingTrack(null);
                              setActiveId(demo.id);
                            }}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
                              selected ? 'bg-white text-black' : 'text-white/70 hover:text-white'
                            }`}
                          >
                            {demo.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="font-display text-[56px] sm:text-[64px] font-bold leading-[0.94] tracking-[-0.045em] text-white">
                      0.5 сек
                    </div>
                    <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.1em] text-[#6BFF91]">
                      {activeDemo.company} · А1 / МТС
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-2">
                    <div className="rounded-[16px] bg-white/[0.07] p-3.5 text-[13px] text-white/80 leading-snug">
                      «{activeDemo.caller}»
                    </div>
                    <div className="rounded-[16px] bg-white text-black p-3.5 text-[13px] font-medium leading-snug">
                      «{activeDemo.reply}»
                    </div>
                  </div>
                </div>

                <div className="pt-5 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handlePlay('live', activeDemo.audioPhrase, activeDemo.voice)}
                    className={`inline-flex items-center gap-2 h-10 px-4 rounded-full text-[12px] font-medium transition-colors cursor-pointer ${
                      playingTrack === 'live'
                        ? 'bg-[#6BFF91] text-black'
                        : 'bg-white/15 hover:bg-white text-white hover:text-black'
                    }`}
                  >
                    {playingTrack === 'live' ? <PauseIcon size={14} /> : <PlayIcon size={14} />}
                    <span>{playingTrack === 'live' ? 'Пауза' : 'Послушать ответ'}</span>
                  </button>
                  <span className="font-mono text-[10.5px] uppercase tracking-wider text-white/50">
                    ЖИВАЯ РЕЧЬ
                  </span>
                </div>
              </div>

              {/* Card 1B: Soft Neutral Minimal Greeting (mirrors `Welcome back` card) */}
              <ScrollReveal>
                <div className="rounded-[24px] bg-[#E8E8E8] p-7 sm:p-8 min-h-[210px] flex flex-col justify-between">
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-[#737373]">
                    ВЕЧЕР · 21:42 · БЕЗ ГУДКОВ
                  </span>
                  <div className="font-display text-[26px] sm:text-[30px] font-medium tracking-[-0.03em] leading-[1.1] text-[#666666]">
                    «Здравствуйте, слушаю вас»
                  </div>
                  <div className="flex items-center justify-between font-mono text-[10.5px] uppercase tracking-wider text-[#737373]">
                    <span>0 ОЧЕРЕДЕЙ</span>
                    <span>24/7</span>
                  </div>
                </div>
              </ScrollReveal>

              {/* Card 1C: Quick Audio Comparison Bento Card */}
              <ScrollReveal>
                <div className="rounded-[24px] bg-[#0A0A0A] text-white p-6 sm:p-7 space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-white/55">
                      ДО / ПОСЛЕ VOXI.BY
                    </span>
                    <span className="font-mono text-[10.5px] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#6BFF91] text-black font-semibold">
                      0 ПРОПУЩЕННЫХ
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-[16px] bg-white/[0.06] p-4 space-y-1">
                      <div className="flex items-center justify-between font-mono text-[10.5px] text-[#FE432A]">
                        <span>ДО · ПРОПУЩЕННЫЙ ВЫЗОВ</span>
                        <span>−45% ЛИДОВ</span>
                      </div>
                      <p className="text-[13px] text-white/75 leading-snug">
                        Перезвон через 2–12 часов: «Спасибо, я уже записался в другом месте».
                      </p>
                    </div>

                    <div className="rounded-[16px] bg-[#1C3B36] p-4 space-y-1">
                      <div className="flex items-center justify-between font-mono text-[10.5px] text-[#6BFF91]">
                        <span>ПОСЛЕ · ОТВЕТ ЗА 0.5 СЕК</span>
                        <span>ЗАПИСЬ В CRM</span>
                      </div>
                      <p className="text-[13px] text-white leading-snug">
                        Назвал цену в BYN, проверил окно и прислал карточку в Telegram + SMS клиенту.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        handlePlay(
                          'ivr',
                          'Здравствуйте... Если вы хотите записаться... нажмите один... Для соединения с оператором... ожидайте на линии...',
                          'maxim'
                        )
                      }
                      className={`h-9 px-3.5 rounded-full text-[11.5px] font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                        playingTrack === 'ivr'
                          ? 'bg-[#FE432A] text-white'
                          : 'bg-white/10 text-white/80 hover:bg-white/20'
                      }`}
                    >
                      {playingTrack === 'ivr' ? <PauseIcon size={12} /> : <PlayIcon size={12} />}
                      <span>Старый IVR</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handlePlay(
                          'voxi',
                          'Здравствуйте! СТО «Минск-Моторс Экспресс», меня зовут Анна. У нас как раз есть свободный подъемник на сегодня в 18:30. Записать вас?',
                          'anna'
                        )
                      }
                      className={`h-9 px-3.5 rounded-full text-[11.5px] font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                        playingTrack === 'voxi'
                          ? 'bg-[#6BFF91] text-black'
                          : 'bg-white text-black hover:bg-[#6BFF91]'
                      }`}
                    >
                      {playingTrack === 'voxi' ? <PauseIcon size={12} /> : <PlayIcon size={12} />}
                      <span>Ответ Voxi.by</span>
                    </button>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            {/* ==================== COLUMN 2 ==================== */}
            <div className="flex flex-col gap-[21px]">
              {/* Card 2A: Deep Cobalt #0225AC Geometric Acoustic Wireframe (exact twin of shopify.design blue art card) */}
              <div className="rounded-[24px] bg-[#0225AC] text-white p-6 sm:p-7 min-h-[340px] flex flex-col justify-between relative overflow-hidden">
                <svg
                  viewBox="0 0 400 320"
                  fill="none"
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full opacity-90 pointer-events-none"
                >
                  <polygon points="185,22 360,155 245,296 72,202" stroke="#53B8FF" strokeWidth="1" />
                  <polygon points="185,22 292,52 204,160 112,248" stroke="#7CC8FF" strokeWidth="0.9" />
                  <polygon points="292,52 360,155 204,160" stroke="#53B8FF" strokeWidth="0.9" />
                  <polygon points="185,22 204,160 72,202" stroke="#53B8FF" strokeWidth="0.9" />
                  <polygon points="204,160 360,155 245,296" stroke="#7CC8FF" strokeWidth="0.9" />
                  <line x1="185" y1="22" x2="245" y2="296" stroke="#9BD6FF" strokeWidth="0.8" />
                  <line x1="72" y1="202" x2="292" y2="52" stroke="#9BD6FF" strokeWidth="0.8" />
                  <circle cx="185" cy="22" r="3" fill="#9BD6FF" />
                  <circle cx="204" cy="160" r="3.5" fill="#FFFFFF" />
                  <circle cx="360" cy="155" r="3" fill="#9BD6FF" />
                  <circle cx="245" cy="296" r="3" fill="#9BD6FF" />
                  <circle cx="72" cy="202" r="3" fill="#9BD6FF" />
                </svg>

                <div className="relative z-10 flex items-center justify-between font-mono text-[10.5px] uppercase tracking-[0.1em] text-white/75">
                  <span>МАРШРУТИЗАЦИЯ РБ</span>
                  <span>SIP / WEBRTC</span>
                </div>

                <div className="relative z-10 space-y-1">
                  <div className="font-display text-[32px] font-bold tracking-[-0.03em] leading-none">
                    А1 · МТС · Unitalk
                  </div>
                  <div className="text-[13px] text-white/80">
                    Прямой шлюз в Минске без смены вашего номера
                  </div>
                </div>
              </div>

              {/* Card 2B: Tall Crisp Light Neutral #F1F1F1 Live Bookings Feed (exact twin of center tall grid card in shopify.design!) */}
              <ScrollReveal>
                <div className="rounded-[24px] bg-[#F1F1F1] p-6 sm:p-7 min-h-[450px] flex flex-col justify-between relative">
                  {/* Subtle editorial registration dots matching shopify.design center card */}
                  {MICRO_DOTS.map((pos) => (
                    <span
                      key={pos}
                      aria-hidden="true"
                      className={`absolute ${pos} w-1 h-1 rounded-full bg-black/20`}
                    />
                  ))}

                  <div className="flex items-center justify-between font-mono text-[10.5px] uppercase tracking-[0.1em] text-[#737373]">
                    <span>ГОТОВЫЕ ЗАПИСИ В CRM</span>
                    <span className="text-black font-semibold">СЕГОДНЯ</span>
                  </div>

                  {/* Active Highlighted Booking Card + 2 Queue Items */}
                  <div className="my-5 space-y-3">
                    {BENTO_DEMOS.map((item) => {
                      const isSelected = item.id === activeId;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setActiveId(item.id)}
                          className={`w-full text-left rounded-[18px] p-4 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-white shadow-[0_12px_28px_-10px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.06]'
                              : 'bg-white/60 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-display text-[15px] font-bold text-black">
                              {item.client}
                            </span>
                            <span className="font-mono text-[11px] font-semibold text-black">
                              {item.priceByn}
                            </span>
                          </div>
                          <div className="mt-1 text-[12px] text-[#525252] flex items-center justify-between gap-2">
                            <span>{item.slot}</span>
                            <span className="font-mono text-[10px] text-[#10B981]">● CRM + TG</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Bottom bar with floating white circular ↗ button (exact shopify.design detail!) */}
                  <div className="flex items-end justify-between gap-3 pt-2">
                    <div>
                      <div className="font-display text-[15px] font-bold text-black">
                        {activeDemo.company}
                      </div>
                      <div className="text-[12px] text-[#525252] font-mono mt-0.5">
                        {activeDemo.phone} · {activeDemo.priceByn}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenVoiceTest?.()}
                      aria-label="Открыть живой голосовой тест"
                      className="w-10 h-10 rounded-full bg-white shadow-[0_4px_14px_rgba(0,0,0,0.08)] hover:bg-black hover:text-white text-black inline-flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    >
                      <ArrowRightUpIcon size={17} />
                    </button>
                  </div>
                </div>
              </ScrollReveal>

              {/* Card 2C: Pure White Minimal Typographic Card (mirrors `artifact` card in shopify.design!) */}
              <ScrollReveal>
                <div className="rounded-[24px] bg-white border border-black/[0.08] p-8 min-h-[210px] flex flex-col items-center justify-center text-center">
                  <div className="font-display text-[42px] sm:text-[48px] font-bold tracking-[-0.045em] text-black leading-none">
                    0 BYN
                  </div>
                  <div className="mt-3 font-mono text-[11px] uppercase tracking-[0.1em] text-[#666666]">
                    АБОНПЛАТА BYO-SIP · ОПЛАТА ЗА МИНУТЫ
                  </div>
                </div>
              </ScrollReveal>
            </div>

            {/* ==================== COLUMN 3 ==================== */}
            <div className="flex flex-col gap-[21px] md:col-span-2 lg:col-span-1">
              {/* Card 3A: Deep Forest Green Card with Crisp White Inset Frame (mirrors green top-right card in shopify.design!) */}
              <div className="rounded-[24px] bg-[#1D7426] p-6 sm:p-7 min-h-[280px] flex flex-col justify-between">
                <div className="rounded-[20px] bg-white border-[2px] border-black p-5 space-y-3">
                  <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-[#525252]">
                    <span>В РЕАЛЬНОМ ВРЕМЕНИ</span>
                    <span className="text-[#1D7426] font-semibold">● ONLINE</span>
                  </div>
                  <div className="font-display text-[20px] font-bold tracking-tight text-black leading-tight">
                    Поговорите с Voxi прямо в браузере
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenVoiceTest?.()}
                    className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-black hover:bg-[#FE432A] text-white text-[12px] font-medium transition-colors cursor-pointer"
                  >
                    <PhoneCallingRoundedIcon size={15} />
                    <span>Запустить живой звонок</span>
                  </button>
                </div>

                <div className="pt-4 flex items-center justify-between font-mono text-[10.5px] uppercase tracking-[0.1em] text-white/85">
                  <span>YCLIENTS · BITRIX24</span>
                  <span>TELEGRAM · SMS</span>
                </div>
              </div>

              {/* Card 3B: iPhone Top-Bezel Card (exact twin of shopify.design `Sidekick` iPhone card!) */}
              <ScrollReveal>
                <a
                  href="#calculator"
                  className="block rounded-[24px] bg-[#EAEAEA] pt-6 px-5 sm:px-6 overflow-hidden group min-h-[290px]"
                >
                  <div className="rounded-t-[36px] border-[5px] border-b-0 border-[#1C1C1E] bg-[#F4F4F6] pt-3.5 px-5 pb-6 shadow-inner">
                    {/* iPhone Status Bar + Dynamic Island */}
                    <div className="flex items-center justify-between mb-6">
                      <span className="font-mono text-[11px] font-semibold text-black">21:42</span>
                      <span className="w-[78px] h-[20px] rounded-full bg-black" aria-hidden="true" />
                      <span className="flex items-center gap-1" aria-hidden="true">
                        <span className="w-1 h-2 bg-black rounded-sm" />
                        <span className="w-1 h-2.5 bg-black rounded-sm" />
                        <span className="w-4 h-2.5 border border-black rounded-[3px] p-[1px]">
                          <span className="block w-full h-full bg-black rounded-[1px]" />
                        </span>
                      </span>
                    </div>

                    {/* Floating Pill matching `Sidekick` pill in shopify.design */}
                    <div className="flex justify-end mb-5">
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-[0_6px_18px_rgba(0,0,0,0.08)] text-[13px] font-medium text-black">
                        <span className="w-2 h-2 rounded-full bg-[#0225AC]" />
                        <span>Voxi.by</span>
                      </span>
                    </div>

                    {/* Cut-off Big Metric matching `Total balance` in shopify.design */}
                    <div className="space-y-0.5">
                      <div className="text-[13px] text-[#666666] font-medium">
                        Сохранённая выручка / мес
                      </div>
                      <div className="font-display text-[46px] font-bold tracking-[-0.04em] text-black leading-none group-hover:text-[#0225AC] transition-colors">
                        +5 638 BYN
                      </div>
                    </div>
                  </div>
                </a>
              </ScrollReveal>

              {/* Card 3C: Acid Lime #D8E738 Graphic Punch Card (exact twin of `tinker` lime card in shopify.design!) */}
              <ScrollReveal>
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="w-full text-left rounded-[24px] bg-[#D8E738] hover:bg-[#CFE02A] p-7 sm:p-8 min-h-[260px] flex flex-col justify-between transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between font-mono text-[10.5px] uppercase tracking-[0.1em] text-black/75">
                    <span>ПИЛОТ · БЕЗ КАРТЫ</span>
                    <ArrowRightUpIcon size={18} className="text-black transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>

                  <div className="flex items-center gap-3 py-4">
                    {/* Crisp Geometric Spark Mark echoing shopify.design lime graphic */}
                    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true" className="shrink-0">
                      <path
                        d="M18 2L21.5 12.5L32 8L24.5 17L34 23L22.5 23.5L25 34L17.5 25.5L8 32L13 21.5L2 19L12.5 14.5L9 4L18 11.5V2Z"
                        stroke="#000000"
                        strokeWidth="2.4"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="font-display text-[28px] sm:text-[32px] font-extrabold tracking-[-0.04em] text-black leading-[0.98]">
                      Настроить за 5 минут
                    </span>
                  </div>

                  <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-black font-semibold">
                    +15 МИНУТ ЗВОНКОВ В ПОДАРОК
                  </div>
                </button>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
