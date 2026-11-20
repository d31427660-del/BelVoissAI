import React, { useState, useEffect, useRef } from 'react';
import {
  PlayIcon,
  PauseIcon,
  ArrowRightUpIcon,
  AltArrowLeftIcon,
  AltArrowRightIcon,
  CheckCircleIcon,
} from '@solar-icons/react/bold-duotone';
import { VoiceSimulator } from '../../lib/speechSynth';
import { BusinessNiche, VoiceId } from '../../types';

interface NicheScenariosProps {
  onTestNiche: (niche: BusinessNiche) => void;
  onOpenAuth: () => void;
}

interface EditorialNicheCard {
  id: BusinessNiche;
  watermark: string;
  cardBg: string;
  watermarkFg: string;
  footerFg: string;
  tileType: 'obsidian' | 'graph-paper' | 'forest' | 'clean-white';
  tiltClass: string;
  footerLeft: string;
  footerRight: string;
  tileLabel: string;
  tileHeadline: string;
  tileNote: string;
  voice: VoiceId;
  audioPhrase: string;
  tasks: string[];
  company: string;
}

const EDITORIAL_CARDS: EditorialNicheCard[] = [
  {
    id: 'auto_service',
    watermark: 'Автосервис',
    cardBg: '#FE432A',
    watermarkFg: '#FFAAC7',
    footerFg: '#FFFFFF',
    tileType: 'obsidian',
    tiltClass: '-rotate-[2.1deg]',
    footerLeft: 'АВТОСЕРВИСЫ И СТО',
    footerRight: 'ОТ 35 BYN · ТО',
    tileLabel: 'СТО «МИНСК-МОТОРС»',
    tileHeadline: 'Шиномонтаж, ТО и запись на подъёмник',
    tileNote: 'Пока мастера в ремзоне — Voxi.by отвечает за 0.5 сек и бронирует бокс.',
    voice: 'maxim',
    audioPhrase:
      'Стоимость диагностики и обслуживания в нашем СТО — от тридцати пяти белорусских рублей, а при ремонте диагностика бесплатна. Есть рассрочка по Халве.',
    company: 'СТО «Минск-Моторс» · ул. Тимирязева, 121',
    tasks: [
      'Запись на шиномонтаж, замену масла, ТО и диагностику подвески',
      'Точные базовые цены в BYN и уточнение марки/госномера авто',
      'Передача готовой карточки мастеру-приёмщику в Telegram и YCLIENTS',
    ],
  },
  {
    id: 'driving_school',
    watermark: 'Автошкола',
    cardBg: '#0225AC',
    watermarkFg: '#FFAAC7',
    footerFg: '#FFFFFF',
    tileType: 'graph-paper',
    tiltClass: 'rotate-[1.8deg]',
    footerLeft: 'АВТОШКОЛЫ РБ',
    footerRight: '1 050 BYN · КАТ. B',
    tileLabel: 'КАТЕГОРИЯ B · РАССРОЧКА',
    tileHeadline: 'КУРС 1 050 BYN · ВЕЧЕРНЯЯ ГРУППА',
    tileNote: 'Консультации по графикам, медкомиссии и запись на вводное занятие.',
    voice: 'anna',
    audioPhrase:
      'Да, конечно! Сегодня в восемнадцать тридцать есть свободное место на вводное занятие. Подскажите ваше имя, и я сразу отправлю пропуск вам в Телеграм.',
    company: 'Автошкола «Драйв-Минск» · м. Академия наук',
    tasks: [
      'Ответы по цене обучения в BYN, топливу и рассрочке на 4 платежа',
      'Подбор вечерней, утренней или группы выходного дня по филиалу',
      'Запись на пробное/вводное занятие и отправка памятки в SMS',
    ],
  },
  {
    id: 'medical_clinic',
    watermark: 'Клиника',
    cardBg: '#1C3B36',
    watermarkFg: '#6BFF91',
    footerFg: '#FFFFFF',
    tileType: 'forest',
    tiltClass: '-rotate-[1.6deg]',
    footerLeft: 'КЛИНИКИ И МЕДЦЕНТРЫ',
    footerRight: 'БЕЗ ОЧЕРЕДИ',
    tileLabel: 'КЛИНИКА «ДЕНТ-ПРЕСТИЖ»',
    tileHeadline: 'Первичная запись и приём с острой болью',
    tileNote: 'Снимает нагрузку с регистратуры: слоты, цены в BYN, Белгосстрах и ТАСК.',
    voice: 'anna',
    audioPhrase:
      'Первичная консультация врача-стоматолога с планом лечения стоит сорок пять белорусских рублей, 3D-снимок делаем на месте за пятьдесят рублей.',
    company: 'Клиника «Дент-Престиж» · пр. Победителей, 84',
    tasks: [
      'Подбор свободного окна к врачу и приоритетная запись при острой боли',
      'Ответы на частые вопросы по ДМС (Белгосстрах, ТАСК), адресу и парковке',
      'Мгновенная передача данных пациента в МИС / CRM и администратору',
    ],
  },
  {
    id: 'custom',
    watermark: 'SMB 24/7',
    cardBg: '#DFD5CB',
    watermarkFg: '#1C3B36',
    footerFg: '#000000',
    tileType: 'clean-white',
    tiltClass: 'rotate-[2deg]',
    footerLeft: 'УНИВЕРСАЛЬНЫЙ SMB',
    footerRight: 'ЗВОНКИ + ЗАЯВКИ',
    tileLabel: 'СФЕРА УСЛУГ И ПРОДАЖИ',
    tileHeadline: 'Квалификация входящих обращений 24/7',
    tileNote: 'Собирает параметры заказа и передаёт тёплого лида команде на утро.',
    voice: 'anna',
    audioPhrase:
      'Принято! Я уже передала ваш номер в Телеграм старшему менеджеру с пометкой позвонить ровно в девять тридцать утра.',
    company: 'Универсальный сценарий · Минск и регионы РБ',
    tasks: [
      'Приём вечерних и выходных звонков и текстовых заявок без потерь',
      'Сбор ключевых вводных: услуга, сроки, адрес, бюджет в BYN',
      'Передача тёплой карточки в Telegram, Bitrix24, amoCRM или таблицу',
    ],
  },
];

/**
 * 1-to-1 shopify.design Horizontal Editorial Carousel ("Design in public" section):
 * - Giant 2-line centered black display heading + concise 2-line subtitle
 * - Uniform 415x558px portrait color-block cards with giant watermark typography,
 *   centered tilted square preview tiles, minimal ▶ Play control, and 2-col mono footers
 */
export const NicheScenarios: React.FC<NicheScenariosProps> = ({
  onTestNiche,
  onOpenAuth,
}) => {
  const [selectedId, setSelectedId] = useState<BusinessNiche>('auto_service');
  const [playingId, setPlayingId] = useState<BusinessNiche | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      VoiceSimulator.stop();
    };
  }, []);

  const activeCard =
    EDITORIAL_CARDS.find((c) => c.id === selectedId) || EDITORIAL_CARDS[0];

  const handlePlay = (card: EditorialNicheCard, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedId(card.id);

    if (playingId === card.id) {
      VoiceSimulator.stop();
      setPlayingId(null);
      return;
    }

    VoiceSimulator.unlock();
    VoiceSimulator.stop();
    setPlayingId(card.id);
    VoiceSimulator.speak(
      card.audioPhrase,
      card.voice,
      () => setPlayingId(card.id),
      () => setPlayingId(null)
    );
  };

  const scrollCarousel = (dir: -1 | 1) => {
    scrollerRef.current?.scrollBy({
      left: dir * 439,
      behavior: 'smooth',
    });
  };

  return (
    <section id="scenarios" className="relative bg-white py-20 lg:py-28 scroll-mt-10 overflow-x-clip">
      {/* Giant Centered 2-Line Editorial Heading (exact shopify.design "Design in public" lockup) */}
      <div className="w-full max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 text-center">
        <h2 className="font-display font-bold text-black text-[50px] sm:text-[88px] lg:text-[124px] leading-[0.94] tracking-[-0.048em]">
          Сценарии
          <br />
          по нишам
        </h2>
        <p className="mt-6 max-w-[440px] mx-auto text-[15px] sm:text-[17px] leading-[1.45] font-medium text-black">
          Готовая логика диалога и запись в BYN для автосервисов, автошкол, клиник и сервисного бизнеса Беларуси.
        </p>

        {/* Minimal Carousel Arrows */}
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => scrollCarousel(-1)}
            aria-label="Предыдущие сценарии"
            className="w-10 h-10 rounded-full border border-black/[0.12] bg-white hover:bg-black hover:text-white text-black inline-flex items-center justify-center transition-colors cursor-pointer"
          >
            <AltArrowLeftIcon size={17} />
          </button>
          <button
            type="button"
            onClick={() => scrollCarousel(1)}
            aria-label="Следующие сценарии"
            className="w-10 h-10 rounded-full border border-black/[0.12] bg-white hover:bg-black hover:text-white text-black inline-flex items-center justify-center transition-colors cursor-pointer"
          >
            <AltArrowRightIcon size={17} />
          </button>
        </div>
      </div>

      {/* Horizontal Overflowing 415x558 Portrait Color-Block Cards (exact shopify.design geometry) */}
      <div className="relative mt-10 lg:mt-12">
        <div
          ref={scrollerRef}
          className="flex gap-6 overflow-x-auto voxi-no-scrollbar snap-x snap-mandatory pl-5 sm:pl-8 lg:pl-12 pr-12 pb-6"
        >
          {EDITORIAL_CARDS.map((card) => {
            const isSelected = card.id === selectedId;
            const isPlaying = playingId === card.id;

            return (
              <div
                key={card.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedId(card.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedId(card.id);
                  }
                }}
                style={{ backgroundColor: card.cardBg }}
                className={`group relative shrink-0 snap-start w-[310px] sm:w-[390px] lg:w-[415px] h-[470px] sm:h-[540px] lg:h-[558px] rounded-[24px] p-6 flex flex-col justify-between overflow-hidden cursor-pointer transition-transform duration-300 ${
                  isSelected ? 'ring-2 ring-black ring-offset-4 ring-offset-white' : ''
                }`}
              >
                {/* Giant Editorial Watermark Typography spanning horizontally behind center tile */}
                <div
                  aria-hidden="true"
                  style={{ color: card.watermarkFg }}
                  className="pointer-events-none select-none absolute inset-x-[-24px] top-1/2 -translate-y-1/2 text-center font-display text-[92px] sm:text-[116px] font-bold leading-none tracking-[-0.05em] whitespace-nowrap opacity-90"
                >
                  {card.watermark}
                </div>

                {/* Top Spacer */}
                <div className="relative z-10 flex items-center justify-end">
                  {isSelected && (
                    <span
                      className={`font-mono text-[10px] uppercase tracking-[0.12em] px-2.5 py-1 rounded-full ${
                        card.footerFg === '#000000'
                          ? 'bg-black text-white'
                          : 'bg-white/20 text-white'
                      }`}
                    >
                      ВЫБРАНО
                    </span>
                  )}
                </div>

                {/* Centered Tilted Square Media / Dialogue Tile (exact shopify.design card centerpiece) */}
                <div className="relative z-10 flex items-center justify-center my-auto">
                  {card.tileType === 'graph-paper' ? (
                    /* Exact visual twin of shopify.design's tilted white graph-paper card */
                    <div
                      className={`voxi-graph-paper relative w-[236px] h-[236px] sm:w-[258px] sm:h-[258px] rounded-[22px] p-5 flex flex-col justify-between text-black shadow-[0_22px_40px_-14px_rgba(0,0,0,0.34)] transition-transform duration-300 ${card.tiltClass} group-hover:rotate-0`}
                    >
                      {/* Small warm tape accent at top like shopify.design */}
                      <span
                        aria-hidden="true"
                        className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-16 h-5 bg-[#EBD48B]/90 -rotate-3 rounded-[2px]"
                      />
                      <div className="flex items-center justify-between pt-1">
                        <span className="font-mono text-[9.5px] uppercase tracking-wider text-[#666666]">
                          {card.tileLabel}
                        </span>
                        <span className="w-5 h-5 rounded-full bg-[#B4F03C]" aria-hidden="true" />
                      </div>
                      <div className="border border-black/30 bg-white/90 p-3 text-left">
                        <div className="font-display text-[17px] font-bold leading-[1.1] tracking-[-0.02em] text-black">
                          {card.tileHeadline}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handlePlay(card, e)}
                        className="self-start inline-flex items-center gap-1.5 text-[12px] font-semibold text-black hover:text-[#0225AC] cursor-pointer"
                      >
                        {isPlaying ? <PauseIcon size={14} /> : <PlayIcon size={14} />}
                        <span>{isPlaying ? 'Pause' : 'Play'}</span>
                      </button>
                    </div>
                  ) : (
                    /* Dark obsidian / forest / clean square tile with minimal bottom-left ▶ Play */
                    <div
                      className={`w-[236px] h-[236px] sm:w-[258px] sm:h-[258px] rounded-[22px] p-5 flex flex-col justify-between shadow-[0_22px_40px_-14px_rgba(0,0,0,0.35)] transition-transform duration-300 ${card.tiltClass} group-hover:rotate-0 ${
                        card.tileType === 'clean-white'
                          ? 'bg-white text-black'
                          : card.tileType === 'forest'
                          ? 'bg-[#102521] text-white border border-white/10'
                          : 'bg-[#0E0E0E] text-white border border-white/10'
                      }`}
                    >
                      <div className="font-mono text-[9.5px] uppercase tracking-[0.1em] opacity-65">
                        {card.tileLabel}
                      </div>

                      <div className="space-y-2">
                        <div className="font-display text-[19px] sm:text-[21px] font-bold leading-[1.1] tracking-[-0.025em]">
                          {card.tileHeadline}
                        </div>
                        <p className="text-[12px] leading-snug opacity-75">{card.tileNote}</p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handlePlay(card, e)}
                        className={`self-start inline-flex items-center gap-1.5 text-[12.5px] font-medium cursor-pointer transition-opacity hover:opacity-80 ${
                          isPlaying ? 'text-[#6BFF91]' : ''
                        }`}
                      >
                        {isPlaying ? <PauseIcon size={14} /> : <PlayIcon size={14} />}
                        <span>{isPlaying ? 'Пауза' : 'Play'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Exact Two-Column Monospace Card Footer */}
                <div
                  style={{ color: card.footerFg }}
                  className="relative z-10 flex items-center justify-between gap-2 font-mono text-[11px] tracking-[0.08em] uppercase"
                >
                  <span>{card.footerLeft}</span>
                  <span className="opacity-75">{card.footerRight}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Minimal Editorial Scenario Detail Bar beneath Carousel */}
      <div className="w-full max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 mt-6">
        <div className="border-t border-black/[0.1] pt-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#737373]">
              {activeCard.company}
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[13px] text-[#262626]">
              {activeCard.tasks.map((task) => (
                <li key={task} className="flex items-start gap-2">
                  <CheckCircleIcon size={16} className="text-black shrink-0 mt-0.5" />
                  <span className="leading-snug">{task}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onTestNiche(activeCard.id)}
              className="inline-flex items-center gap-2 h-[44px] px-5 rounded-full bg-black hover:bg-[#FE432A] text-white text-[13px] font-medium transition-colors cursor-pointer"
            >
              <span>Протестировать голосом</span>
              <ArrowRightUpIcon size={16} />
            </button>
            <button
              type="button"
              onClick={onOpenAuth}
              className="inline-flex items-center h-[44px] px-5 rounded-full border border-black/[0.15] hover:border-black bg-white text-black text-[13px] font-medium transition-colors cursor-pointer"
            >
              <span>Под свой прайс</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
