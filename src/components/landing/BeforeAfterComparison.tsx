import React, { useState, useEffect } from 'react';
import {
  CallDroppedRoundedIcon,
  PhoneCallingRoundedIcon,
  CheckCircleIcon,
  PlayIcon,
  PauseIcon,
} from '@solar-icons/react/bold-duotone';
import { VoiceSimulator } from '../../lib/speechSynth';
import { ScrollReveal } from './ScrollReveal';

export const BeforeAfterComparison: React.FC = () => {
  const [playingSide, setPlayingSide] = useState<'old' | 'voxi' | null>(null);

  useEffect(() => {
    return () => {
      VoiceSimulator.stop();
    };
  }, []);

  const togglePlay = (side: 'old' | 'voxi') => {
    if (playingSide === side) {
      VoiceSimulator.stop();
      setPlayingSide(null);
      return;
    }
    VoiceSimulator.unlock();
    VoiceSimulator.stop();
    setPlayingSide(side);

    if (side === 'old') {
      VoiceSimulator.speak(
        'Здравствуйте... Если вы хотите записаться... нажмите один... Для соединения с оператором... ожидайте на линии...',
        'maxim',
        () => setPlayingSide('old'),
        () => setPlayingSide(null)
      );
    } else {
      VoiceSimulator.speak(
        'Здравствуйте! СТО «Минск-Моторс Экспресс», меня зовут Анна. У нас как раз есть свободный подъемник на сегодня в 18:30. Записать вас?',
        'anna',
        () => setPlayingSide('voxi'),
        () => setPlayingSide(null)
      );
    }
  };

  return (
    <section
      id="benchmark"
      className="bg-white py-20 lg:py-28 scroll-mt-10"
    >
      <div className="w-full max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 space-y-12 lg:space-y-14">
        {/* Top Metadata Hairline (shopify.design editorial strip) */}
        <div className="flex items-center gap-4">
          <span className="font-mono text-[11px] tracking-[0.11em] uppercase text-black shrink-0">
            ДО / ПОСЛЕ VOXI.BY
          </span>
          <div className="h-px flex-1 bg-black/[0.08]" aria-hidden="true" />
          <span className="font-mono text-[11px] tracking-[0.11em] uppercase text-[#737373] shrink-0">
            0 ПРОПУЩЕННЫХ ВЫЗОВОВ
          </span>
        </div>

        {/* Monumental Pure Editorial Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <h2 className="font-display font-bold text-black text-[40px] sm:text-[62px] lg:text-[82px] leading-[0.95] tracking-[-0.045em] max-w-3xl">
            Что происходит,
            <br />
            когда линия занята
          </h2>

          <p className="max-w-sm text-[15px] sm:text-[16px] leading-relaxed text-[#525252]">
            До 30% звонков в Беларуси приходится на пик загрузки, обед и время после 18:30.
            Перезвон через пару часов почти всегда означает потерю оплаченного рекламой лида.
          </p>
        </div>

        {/* Side-by-Side Architectural Comparison Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
          {/* BEFORE CARD: Gallery Light + Vermilion Loss Accents */}
          <ScrollReveal>
            <div className="h-full rounded-[28px] bg-[#F5F5F5] border border-black/[0.08] p-7 sm:p-9 lg:p-10 flex flex-col justify-between gap-8">
              <div className="space-y-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-full bg-[#FE432A]/12 text-[#FE432A] flex items-center justify-center">
                      <CallDroppedRoundedIcon size={18} />
                    </span>
                    <span className="editorial-mono text-black font-semibold">ДО · БЕЗ VOXI.BY</span>
                  </div>
                  <span className="font-mono text-[11px] uppercase tracking-wider px-3 py-1 rounded-full bg-[#FE432A]/12 text-[#C82A14] font-semibold">
                    −35–45% лидов
                  </span>
                </div>

                <div>
                  <h3 className="font-display text-[26px] sm:text-[32px] font-bold leading-[1.08] tracking-[-0.03em] text-black">
                    Пропущенный вызов и перезвон через 2–12 часов
                  </h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-[#525252]">
                    Администратор занят на ресепшене или уже ушёл домой. Клиент слышит долгие гудки или
                    устаревшее меню «нажмите 1» и звонит следующему номеру из поиска.
                  </p>
                </div>

                {/* Minute-by-Minute Loss Timeline */}
                <ol className="space-y-3 border-t border-black/[0.08] pt-6">
                  <li className="flex items-start gap-3.5 rounded-[18px] bg-white p-4 border border-black/[0.05]">
                    <span className="font-mono text-[11px] font-semibold text-[#FE432A] shrink-0 pt-0.5 tabular-nums">
                      20:14
                    </span>
                    <div className="text-[13px] sm:text-[14px] text-[#262626] leading-snug">
                      <strong className="font-semibold text-black block">
                        5 гудков — трубку никто не берёт
                      </strong>
                      Клиент искал СТО или клинику с мобильного. На рекламу уже списалось 4–12 BYN.
                    </div>
                  </li>
                  <li className="flex items-start gap-3.5 rounded-[18px] bg-white p-4 border border-black/[0.05]">
                    <span className="font-mono text-[11px] font-semibold text-[#FE432A] shrink-0 pt-0.5 tabular-nums">
                      20:16
                    </span>
                    <div className="text-[13px] sm:text-[14px] text-[#262626] leading-snug">
                      <strong className="font-semibold text-black block">
                        Клиент звонит конкуренту
                      </strong>
                      Там ответили сразу — запись на 18:30 ушла в другую компанию.
                    </div>
                  </li>
                  <li className="flex items-start gap-3.5 rounded-[18px] bg-white p-4 border border-black/[0.05]">
                    <span className="font-mono text-[11px] font-semibold text-[#737373] shrink-0 pt-0.5 tabular-nums">
                      10:25
                    </span>
                    <div className="text-[13px] sm:text-[14px] text-[#262626] leading-snug">
                      <strong className="font-semibold text-black block">
                        Утренний перезвон менеджера впустую
                      </strong>
                      «Спасибо, я уже записался вчера в другое место».
                    </div>
                  </li>
                </ol>
              </div>

              {/* Subtle Comparison Audio Button */}
              <div className="pt-5 border-t border-black/[0.08] flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => togglePlay('old')}
                  className={`inline-flex items-center gap-2 h-11 px-5 rounded-full text-[13px] font-medium border transition-colors cursor-pointer ${
                    playingSide === 'old'
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-black border-black/[0.15] hover:border-black'
                  }`}
                >
                  {playingSide === 'old' ? <PauseIcon size={15} /> : <PlayIcon size={15} />}
                  <span>
                    {playingSide === 'old' ? 'Остановить' : 'Как звучит старый IVR'}
                  </span>
                </button>
                <span className="editorial-mono text-[#737373]">ПАУЗА 3.5 СЕК · СБРОС</span>
              </div>
            </div>
          </ScrollReveal>

          {/* AFTER CARD: Pure Obsidian + Neon Mint Highlights */}
          <ScrollReveal delayMs={80}>
            <div className="h-full rounded-[28px] bg-[#0A0A0A] text-white p-7 sm:p-9 lg:p-10 flex flex-col justify-between gap-8">
              <div className="space-y-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-full bg-[#6BFF91]/15 text-[#6BFF91] flex items-center justify-center">
                      <PhoneCallingRoundedIcon size={18} />
                    </span>
                    <span className="editorial-mono text-white font-semibold">
                      ПОСЛЕ · С VOXI.BY 24/7
                    </span>
                  </div>
                  <span className="font-mono text-[11px] uppercase tracking-wider px-3 py-1 rounded-full bg-[#6BFF91] text-black font-semibold">
                    0 пропущенных
                  </span>
                </div>

                <div>
                  <h3 className="font-display text-[26px] sm:text-[32px] font-bold leading-[1.08] tracking-[-0.03em] text-white">
                    Мгновенный ответ за 0.5 сек и готовая запись в графике
                  </h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-white/70">
                    Voxi.by берёт трубку с первого гудка в любое время суток, разговаривает как
                    компетентный администратор, называет цены в BYN и сразу фиксирует визит.
                  </p>
                </div>

                {/* Minute-by-Minute Saved Timeline */}
                <ol className="space-y-3 border-t border-white/[0.1] pt-6">
                  <li className="flex items-start gap-3.5 rounded-[18px] bg-white/[0.06] p-4 border border-white/[0.08]">
                    <span className="font-mono text-[11px] font-semibold text-[#6BFF91] shrink-0 pt-0.5 tabular-nums">
                      20:14:00
                    </span>
                    <div className="text-[13px] sm:text-[14px] text-white/80 leading-snug">
                      <strong className="font-semibold text-white block">
                        Ответ за 0.5 секунды без гудков
                      </strong>
                      Живое приветствие от имени вашей компании. Клиент не успевает положить трубку.
                    </div>
                  </li>
                  <li className="flex items-start gap-3.5 rounded-[18px] bg-white/[0.06] p-4 border border-white/[0.08]">
                    <span className="font-mono text-[11px] font-semibold text-[#6BFF91] shrink-0 pt-0.5 tabular-nums">
                      20:14:35
                    </span>
                    <div className="text-[13px] sm:text-[14px] text-white/80 leading-snug">
                      <strong className="font-semibold text-white block">
                        Консультация в BYN и подбор окна
                      </strong>
                      Уточнил услугу, проверил расписание и предложил удобный слот на завтра в 18:30.
                    </div>
                  </li>
                  <li className="flex items-start gap-3.5 rounded-[18px] bg-white/[0.06] p-4 border border-white/[0.08]">
                    <span className="font-mono text-[11px] font-semibold text-[#6BFF91] shrink-0 pt-0.5 tabular-nums">
                      20:15:00
                    </span>
                    <div className="text-[13px] sm:text-[14px] text-white/80 leading-snug">
                      <strong className="font-semibold text-white block">
                        Запись в CRM + уведомление в Telegram
                      </strong>
                      Утром команда видит готовое расписание, а клиент уже получил SMS с адресом.
                    </div>
                  </li>
                </ol>
              </div>

              {/* Voxi Live Studio Audio Button */}
              <div className="pt-5 border-t border-white/[0.1] flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => togglePlay('voxi')}
                  className={`inline-flex items-center gap-2 h-11 px-5 rounded-full text-[13px] font-medium transition-colors cursor-pointer ${
                    playingSide === 'voxi'
                      ? 'bg-[#6BFF91] text-black'
                      : 'bg-white text-black hover:bg-[#F5F5F5]'
                  }`}
                >
                  {playingSide === 'voxi' ? <PauseIcon size={15} /> : <PlayIcon size={15} />}
                  <span>
                    {playingSide === 'voxi' ? 'Остановить' : 'Послушать ответ Voxi.by'}
                  </span>
                </button>
                <span className="editorial-mono text-[#6BFF91] flex items-center gap-1.5">
                  <CheckCircleIcon size={14} />
                  <span>ОТКЛИК 0.5 СЕК</span>
                </span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};
