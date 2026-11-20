import React from 'react';
import { ArrowRightUpIcon } from '@solar-icons/react/bold-duotone';
import { ScrollReveal } from './ScrollReveal';

/**
 * 1-to-1 shopify.design Staggered Editorial Typography Section ("Remote by design. Together in...")
 * transformed 100% into Voxi.by's Belarus Telephony, CRM & Human Handoff architecture.
 */
export const TelephonyIntegrations: React.FC = () => {
  return (
    <section
      id="integrations"
      className="bg-white py-20 lg:py-32 scroll-mt-10 overflow-x-clip"
    >
      <div className="w-full max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
        {/* Top Monumental Vermilion Red Heading (mirrors "Remote by design.") */}
        <ScrollReveal>
          <div className="mb-4 sm:mb-6 lg:pl-[18%]">
            <h2 className="font-display font-bold text-[#FE432A] text-[46px] sm:text-[84px] lg:text-[118px] leading-[0.94] tracking-[-0.048em]">
              Связь 24/7
              <br />
              по всей Беларуси.
            </h2>
          </div>
        </ScrollReveal>

        {/* Staggered Giant Black Display Rows with Tucked Micro-Mono Metadata */}
        <div className="space-y-2 sm:space-y-1 font-display font-bold text-black text-[42px] sm:text-[78px] lg:text-[112px] leading-[0.95] tracking-[-0.048em]">
          {/* Row 1 */}
          <ScrollReveal>
            <div className="flex flex-wrap items-baseline gap-x-4 lg:pl-[4%]">
              <span>Подключаем</span>
            </div>
          </ScrollReveal>

          {/* Row 2: A1 & MTS + right mono annotation */}
          <ScrollReveal delayMs={40}>
            <div className="flex flex-wrap items-end gap-x-4 gap-y-2 lg:pl-[24%]">
              <span>А1 и МТС</span>
              <span className="font-mono text-[10px] sm:text-[11px] font-normal uppercase tracking-[0.09em] leading-[1.35] text-black pb-2 sm:pb-3">
                SIP.A1.BY · SIP.MTS.BY
                <br />
                0 BYN BYO-SIP
              </span>
            </div>
          </ScrollReveal>

          {/* Row 3: left mono annotation + Unitalk */}
          <ScrollReveal delayMs={80}>
            <div className="flex flex-wrap items-end gap-x-4 gap-y-2 lg:pl-[34%]">
              <span className="font-mono text-[10px] sm:text-[11px] font-normal uppercase tracking-[0.09em] leading-[1.35] text-black pb-2 sm:pb-3 order-2 sm:order-1">
                ОБЛАЧНАЯ АТС,
                <br />
                БЕЛТЕЛЕКОМ 017
              </span>
              <span className="order-1 sm:order-2">Unitalk</span>
            </div>
          </ScrollReveal>

          {/* Row 4: Exact inline rounded live card between words (mirrors "New [studio] York"!) */}
          <ScrollReveal delayMs={120}>
            <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-3 lg:pl-[14%] py-1">
              <span>Ваша</span>
              <a
                href="#pricing"
                className="group inline-flex flex-col justify-between w-[196px] sm:w-[244px] h-[98px] sm:h-[118px] rounded-[18px] bg-[#0A0A0A] text-white p-3.5 sm:p-4 align-middle hover:bg-[#1C3B36] transition-colors tracking-normal leading-normal"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.1em] text-[#6BFF91] leading-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#6BFF91]" />
                    <span>ЖИВОЙ ПЕРЕВОД</span>
                  </span>
                  <ArrowRightUpIcon size={15} className="text-white/75 group-hover:text-white shrink-0" />
                </div>
                <div className="font-sans text-[12.5px] sm:text-[13.5px] font-medium tracking-normal leading-[1.3] text-white">
                  Сложный вопрос →
                  <br />
                  перевод на менеджера
                </div>
              </a>
              <span>CRM</span>
              <span className="font-mono text-[10px] sm:text-[11px] font-normal uppercase tracking-[0.09em] leading-[1.35] text-black self-end pb-2 sm:pb-3">
                YCLIENTS, BITRIX24,
                <br />
                AMOCRM, 1С
              </span>
            </div>
          </ScrollReveal>

          {/* Row 5: left mono + Telegram */}
          <ScrollReveal delayMs={160}>
            <div className="flex flex-wrap items-end gap-x-4 gap-y-2 lg:pl-[36%]">
              <span className="font-mono text-[10px] sm:text-[11px] font-normal uppercase tracking-[0.09em] leading-[1.35] text-black pb-2 sm:pb-3 order-2 sm:order-1">
                КАРТОЧКА ЛИДА
                <br />
                ЗА 1 СЕКУНДУ
              </span>
              <span className="order-1 sm:order-2">Telegram</span>
            </div>
          </ScrollReveal>

          {/* Row 6: Таблицы + right mono */}
          <ScrollReveal delayMs={200}>
            <div className="flex flex-wrap items-end gap-x-4 gap-y-2 lg:pl-[20%]">
              <span>Таблицы</span>
              <span className="font-mono text-[10px] sm:text-[11px] font-normal uppercase tracking-[0.09em] leading-[1.35] text-black pb-2 sm:pb-3">
                GOOGLE SHEETS · WEBHOOK
                <br />
                ЗАКОН РБ № 99-З
              </span>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};
