import React, { useState } from 'react';
import {
  CheckCircleIcon,
  ArrowRightUpIcon,
  PhoneCallingRoundedIcon,
  DocumentTextIcon,
  ClockCircleIcon,
} from '@solar-icons/react/bold-duotone';
import { SlidingTabs } from '@/components/motion';
import { ScrollReveal } from './ScrollReveal';

interface ValueAndPricingProps {
  onOpenAuth: (packageId?: 'pack_300' | 'pack_1000') => void;
}

export const ValueAndPricing: React.FC<ValueAndPricingProps> = ({ onOpenAuth }) => {
  // Interactive Value Calculator State (BYN)
  const [callsPerDay, setCallsPerDay] = useState<number>(30);
  const [missedPercent, setMissedPercent] = useState<number>(20);
  const [averageCheck, setAverageCheck] = useState<number>(80);

  // Billing Mode Toggle
  const [billingMode, setBillingMode] = useState<'packages' | 'payg'>('packages');

  // Calculator math (conservative 40% conversion of answered missed calls into real bookings)
  const callsPerMonth = callsPerDay * 30;
  const missedCallsPerMonth = Math.round(callsPerMonth * (missedPercent / 100));
  const savedBookings = Math.round(missedCallsPerMonth * 0.4);
  const savedRevenueMonth = savedBookings * averageCheck;
  const estimatedMinutesMonth = Math.max(1, Math.round(missedCallsPerMonth * 1.5));
  const effectiveRate =
    estimatedMinutesMonth >= 1000 ? 0.35 : estimatedMinutesMonth >= 300 ? 0.4 : 0.45;
  const voxiCostMonth = Math.max(5, Math.round(estimatedMinutesMonth * effectiveRate));
  const netGainMonth = Math.max(0, savedRevenueMonth - voxiCostMonth);
  const paybackBookings = averageCheck > 0 ? Math.max(1, Math.ceil(voxiCostMonth / averageCheck)) : 1;

  const sliderStyle = (min: number, max: number, value: number): React.CSSProperties =>
    ({
      '--attr-min': min,
      '--attr-max': max,
      '--control-value': value,
    }) as React.CSSProperties;

  return (
    <section
      id="calculator"
      className="bg-white py-20 lg:py-28 scroll-mt-10"
    >
      <div className="w-full max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 space-y-20 lg:space-y-28">
        {/* PART 1: Value / ROI Calculator in BYN */}
        <div className="space-y-10">
          <div className="flex items-center gap-4">
            <span className="font-mono text-[11px] tracking-[0.11em] uppercase text-black shrink-0">
              КАЛЬКУЛЯТОР ЦЕННОСТИ · BYN
            </span>
            <div className="h-px flex-1 bg-black/[0.08]" aria-hidden="true" />
            <span className="font-mono text-[11px] tracking-[0.11em] uppercase text-[#737373] shrink-0">
              РАСЧЁТ ОКУПАЕМОСТИ
            </span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <h2 className="font-display font-bold text-black text-[40px] sm:text-[62px] lg:text-[80px] leading-[0.95] tracking-[-0.045em] max-w-3xl">
              Сколько выручки
              <br />
              остаётся в кассе
            </h2>

            <p className="max-w-sm text-[15px] sm:text-[16px] leading-relaxed text-[#525252]">
              Подставьте объём звонков и средний чек вашей компании — калькулятор покажет
              сохранённую выручку в BYN и стоимость Voxi.by в месяц.
            </p>
          </div>

          <ScrollReveal>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              {/* Left 7 Cols: Crisp Controls Card */}
              <div className="lg:col-span-7 rounded-[28px] bg-[#F5F5F5] border border-black/[0.08] p-7 sm:p-9 lg:p-10 flex flex-col justify-between gap-8">
                <div className="space-y-7">
                  {/* Slider 1 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <label
                        htmlFor="calc-calls-day"
                        className="text-[14px] sm:text-[15px] font-medium text-black"
                      >
                        Входящих звонков в день
                      </label>
                      <span className="font-mono text-[14px] font-semibold text-black bg-white border border-black/[0.08] px-3 py-1 rounded-full tabular-nums">
                        {callsPerDay} / день
                      </span>
                    </div>
                    <input
                      id="calc-calls-day"
                      type="range"
                      min={5}
                      max={150}
                      step={5}
                      value={callsPerDay}
                      aria-valuetext={`${callsPerDay} входящих звонков в день`}
                      style={sliderStyle(5, 150, callsPerDay)}
                      onChange={(e) => setCallsPerDay(Number(e.target.value))}
                      className="voxi-editorial-slider"
                    />
                    <div className="flex justify-between font-mono text-[10.5px] text-[#737373]">
                      <span>5</span>
                      <span>50</span>
                      <span>100</span>
                      <span>150</span>
                    </div>
                  </div>

                  {/* Slider 2 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <label
                        htmlFor="calc-missed-pct"
                        className="text-[14px] sm:text-[15px] font-medium text-black"
                      >
                        Доля пропущенных вызовов (вечер, пик, выходные)
                      </label>
                      <span className="font-mono text-[14px] font-semibold text-[#C82A14] bg-[#FE432A]/12 px-3 py-1 rounded-full tabular-nums">
                        {missedPercent}%
                      </span>
                    </div>
                    <input
                      id="calc-missed-pct"
                      type="range"
                      min={5}
                      max={50}
                      step={5}
                      value={missedPercent}
                      aria-valuetext={`${missedPercent} процентов пропущенных вызовов`}
                      style={sliderStyle(5, 50, missedPercent)}
                      onChange={(e) => setMissedPercent(Number(e.target.value))}
                      className="voxi-editorial-slider voxi-editorial-slider--vermilion"
                    />
                    <div className="flex justify-between font-mono text-[10.5px] text-[#737373]">
                      <span>5%</span>
                      <span>20% (среднее по РБ)</span>
                      <span>50%</span>
                    </div>
                  </div>

                  {/* Slider 3 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <label
                        htmlFor="calc-avg-check"
                        className="text-[14px] sm:text-[15px] font-medium text-black"
                      >
                        Средний чек услуги / заказа (BYN)
                      </label>
                      <span className="font-mono text-[14px] font-semibold text-black bg-white border border-black/[0.08] px-3 py-1 rounded-full tabular-nums">
                        {averageCheck} BYN
                      </span>
                    </div>
                    <input
                      id="calc-avg-check"
                      type="range"
                      min={20}
                      max={500}
                      step={10}
                      value={averageCheck}
                      aria-valuetext={`${averageCheck} белорусских рублей`}
                      style={sliderStyle(20, 500, averageCheck)}
                      onChange={(e) => setAverageCheck(Number(e.target.value))}
                      className="voxi-editorial-slider"
                    />
                    <div className="flex justify-between font-mono text-[10.5px] text-[#737373]">
                      <span>20 BYN</span>
                      <span>150 BYN</span>
                      <span>300 BYN</span>
                      <span>500 BYN</span>
                    </div>
                  </div>
                </div>

                {/* Conservative Assumption Note */}
                <div className="pt-5 border-t border-black/[0.08] flex flex-wrap items-center justify-between gap-2 text-[12px] text-[#525252]">
                  <span>
                    Расчёт при консервативной конверсии 40% отвеченных вызовов в запись и средней длительности 1.5 мин.
                  </span>
                </div>
              </div>

              {/* Right 5 Cols: Pure Obsidian Value Summary */}
              <div className="lg:col-span-5 rounded-[28px] bg-[#0A0A0A] text-white p-7 sm:p-9 lg:p-10 flex flex-col justify-between gap-7">
                <div className="space-y-6">
                  <div>
                    <span className="editorial-mono text-white/55">
                      СОХРАНЁННАЯ ВЫРУЧКА В МЕСЯЦ
                    </span>
                    <div className="mt-2 font-display text-[42px] sm:text-[52px] font-extrabold leading-none tracking-[-0.04em] text-[#6BFF91] tabular-nums">
                      +{netGainMonth.toLocaleString('ru-RU')} BYN
                    </div>
                    <p className="mt-2 text-[13px] text-white/65">
                      чистый эффект за вычетом расходов на минуты Voxi.by
                    </p>
                  </div>

                  <dl className="space-y-3.5 border-y border-white/[0.1] py-5 text-[13.5px]">
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-white/65">Спасённых звонков в месяц</dt>
                      <dd className="font-mono font-semibold text-white tabular-nums">
                        {missedCallsPerMonth} вызовов
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-white/65">Дополнительных записей (~40%)</dt>
                      <dd className="font-mono font-semibold text-white tabular-nums">
                        ~{savedBookings} клиентов
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-white/65">Объём речи (~1.5 мин/звонок)</dt>
                      <dd className="font-mono text-white/85 tabular-nums">
                        ~{estimatedMinutesMonth} мин · {effectiveRate.toFixed(2)} BYN/мин
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 pt-2 border-t border-white/[0.08]">
                      <dt className="text-white/80 font-medium">Расчётная стоимость Voxi</dt>
                      <dd className="font-mono font-semibold text-[#D8E738] tabular-nums">
                        ~{voxiCostMonth} BYN / мес
                      </dd>
                    </div>
                  </dl>

                  <div className="flex items-start gap-2.5 text-[13px] text-white/80">
                    <CheckCircleIcon size={18} className="text-[#6BFF91] shrink-0 mt-0.5" />
                    <span>
                      {paybackBookings === 1
                        ? 'Сервис окупается уже с 1-го спасённого визита клиента.'
                        : `Сервис окупается с первых ${paybackBookings} спасённых записей.`}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenAuth()}
                  className="w-full h-12 px-6 rounded-full bg-white hover:bg-[#6BFF91] text-black text-[14px] font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span>Сохранить эти звонки бесплатно</span>
                  <ArrowRightUpIcon size={17} />
                </button>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* PART 2: Transparent BYN Pricing */}
        <div id="pricing" className="pt-8 space-y-12 scroll-mt-12">
          <div className="flex items-center gap-4">
            <span className="font-mono text-[11px] tracking-[0.11em] uppercase text-black shrink-0">
              ТАРИФЫ В BYN
            </span>
            <div className="h-px flex-1 bg-black/[0.08]" aria-hidden="true" />
            <span className="font-mono text-[11px] tracking-[0.11em] uppercase text-[#737373] shrink-0">
              ЕРИП · BEPAID · УНП 193991846
            </span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-2xl space-y-4">
              <h2 className="font-display font-bold text-black text-[40px] sm:text-[62px] lg:text-[78px] leading-[0.95] tracking-[-0.045em]">
                Платите только
                <br />
                за минуты речи
              </h2>
              <p className="text-[15px] leading-relaxed text-[#525252]">
                Гудки, ожидание и тишина не тарифицируются. Официальный договор с резидентом РБ
                (ИП Беляков К. О., УНП 193991846), оплата в BYN через ЕРИП и bePaid.
              </p>
            </div>

            <div className="shrink-0">
              <SlidingTabs<'packages' | 'payg'>
                ariaLabel="Формат оплаты тарифов Voxi.by"
                value={billingMode}
                onChange={setBillingMode}
                className="bg-[#F5F5F5] border-black/[0.08]"
                options={[
                  { value: 'packages', label: 'Пакеты минут (−22%)' },
                  { value: 'payg', label: 'Поминутно (PAYG)' },
                ]}
              />
            </div>
          </div>

          {billingMode === 'packages' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
              {/* Tier 1: Starter */}
              <ScrollReveal delayMs={0}>
                <div className="h-full rounded-[28px] bg-[#F5F5F5] border border-black/[0.08] p-7 sm:p-8 flex flex-col justify-between gap-8">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="editorial-mono text-[#525252]">ТЕСТ-ДРАЙВ</span>
                      <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-full bg-white border border-black/[0.08] text-black">
                        БЕЗ КАРТЫ
                      </span>
                    </div>

                    <div>
                      <h3 className="font-display text-[24px] font-bold text-black">Стартовый</h3>
                      <p className="mt-1.5 text-[13.5px] text-[#525252] leading-relaxed">
                        Протестировать голос, сценарий и запись в Telegram на реальных вызовах.
                      </p>
                    </div>

                    <div className="pt-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-display text-[48px] font-extrabold leading-none tracking-[-0.04em] text-black">
                          0
                        </span>
                        <span className="font-mono text-[14px] font-semibold text-[#525252]">
                          BYN
                        </span>
                      </div>
                      <div className="mt-1.5 font-mono text-[12px] text-[#1C3B36] font-medium">
                        15 минут живых звонков в подарок
                      </div>
                    </div>

                    <ul className="space-y-3 pt-5 border-t border-black/[0.08] text-[13.5px] text-[#262626]">
                      <li className="flex items-start gap-2.5">
                        <CheckCircleIcon size={17} className="text-black shrink-0 mt-0.5" />
                        <span>15 минут голосовых диалогов при регистрации</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircleIcon size={17} className="text-black shrink-0 mt-0.5" />
                        <span>Готовые шаблоны: СТО, автошкола, клиника, SMB</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircleIcon size={17} className="text-black shrink-0 mt-0.5" />
                        <span>Голоса Анна и Максим без роботизированных пауз</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircleIcon size={17} className="text-black shrink-0 mt-0.5" />
                        <span>Мгновенные карточки лидов в Telegram</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenAuth()}
                    className="w-full h-12 rounded-full bg-white border border-black/[0.16] hover:border-black hover:bg-black hover:text-white text-black text-[13.5px] font-medium transition-colors cursor-pointer"
                  >
                    Попробовать бесплатно
                  </button>
                </div>
              </ScrollReveal>

              {/* Tier 2: Business 300 (Featured Obsidian) */}
              <ScrollReveal delayMs={70}>
                <div className="h-full rounded-[28px] bg-[#0A0A0A] text-white p-7 sm:p-8 flex flex-col justify-between gap-8">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between gap-2">
                      <span className="editorial-mono text-[#6BFF91]">ОПТИМАЛЬНЫЙ</span>
                      <span className="font-mono text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-[#D8E738] text-black">
                        Выгода −11%
                      </span>
                    </div>

                    <div>
                      <h3 className="font-display text-[24px] font-bold text-white">
                        Пакет 300 минут
                      </h3>
                      <p className="mt-1.5 text-[13.5px] text-white/70 leading-relaxed">
                        Для СТО, автошкол, клиник и сервисов со стабильным потоком звонков.
                      </p>
                    </div>

                    <div className="pt-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-display text-[48px] font-extrabold leading-none tracking-[-0.04em] text-white">
                          120
                        </span>
                        <span className="font-mono text-[14px] font-semibold text-white/65">
                          BYN
                        </span>
                      </div>
                      <div className="mt-1.5 font-mono text-[12px] text-[#6BFF91]">
                        0.40 BYN / мин · минуты не сгорают
                      </div>
                    </div>

                    <ul className="space-y-3 pt-5 border-t border-white/[0.12] text-[13.5px] text-white/85">
                      <li className="flex items-start gap-2.5">
                        <CheckCircleIcon size={17} className="text-[#6BFF91] shrink-0 mt-0.5" />
                        <span>300 минут (~200 полноценных записей клиентов)</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircleIcon size={17} className="text-[#6BFF91] shrink-0 mt-0.5" />
                        <span>Бессрочный остаток — без ежемесячного сгорания</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircleIcon size={17} className="text-[#6BFF91] shrink-0 mt-0.5" />
                        <span>Подключение А1, МТС, Unitalk или Белтелеком</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircleIcon size={17} className="text-[#6BFF91] shrink-0 mt-0.5" />
                        <span>Синхронизация с YCLIENTS, Bitrix24, amoCRM и 1С</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircleIcon size={17} className="text-[#6BFF91] shrink-0 mt-0.5" />
                        <span>Перевод сложных звонков на живого сотрудника</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenAuth('pack_300')}
                    className="w-full h-12 rounded-full bg-white hover:bg-[#6BFF91] text-black text-[13.5px] font-semibold transition-colors cursor-pointer"
                  >
                    Выбрать пакет 300 минут
                  </button>
                </div>
              </ScrollReveal>

              {/* Tier 3: Scale 1000 */}
              <ScrollReveal delayMs={140}>
                <div className="h-full rounded-[28px] bg-white border border-black/[0.12] p-7 sm:p-8 flex flex-col justify-between gap-8">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between gap-2">
                      <span className="editorial-mono text-[#525252]">МАКСИМАЛЬНАЯ ВЫГОДА</span>
                      <span className="font-mono text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#1C3B36] text-[#6BFF91]">
                        −22%
                      </span>
                    </div>

                    <div>
                      <h3 className="font-display text-[24px] font-bold text-black">
                        Пакет 1 000 минут
                      </h3>
                      <p className="mt-1.5 text-[13.5px] text-[#525252] leading-relaxed">
                        Для медцентров, сетей филиалов, автосервисов в сезон и активной рекламы.
                      </p>
                    </div>

                    <div className="pt-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-display text-[48px] font-extrabold leading-none tracking-[-0.04em] text-black">
                          350
                        </span>
                        <span className="font-mono text-[14px] font-semibold text-[#525252]">
                          BYN
                        </span>
                      </div>
                      <div className="mt-1.5 font-mono text-[12px] text-[#0225AC] font-medium">
                        0.35 BYN / мин · экономия 100 BYN
                      </div>
                    </div>

                    <ul className="space-y-3 pt-5 border-t border-black/[0.08] text-[13.5px] text-[#262626]">
                      <li className="flex items-start gap-2.5">
                        <CheckCircleIcon size={17} className="text-black shrink-0 mt-0.5" />
                        <span>1 000 минут разговоров без срока сгорания</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircleIcon size={17} className="text-black shrink-0 mt-0.5" />
                        <span>Приоритетная линия и SLA 99.9% по договору</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircleIcon size={17} className="text-black shrink-0 mt-0.5" />
                        <span>Единоличные акты по пост. Минфина № 13 для юрлиц</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircleIcon size={17} className="text-black shrink-0 mt-0.5" />
                        <span>Оплата картой (БЕЛКАРТ, Visa, MC) или через ЕРИП</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenAuth('pack_1000')}
                    className="w-full h-12 rounded-full bg-black hover:bg-[#222222] text-white text-[13.5px] font-medium transition-colors cursor-pointer"
                  >
                    Выбрать пакет 1 000 минут
                  </button>
                </div>
              </ScrollReveal>
            </div>
          ) : (
            /* PAYG Postpaid Mode */
            <div className="rounded-[28px] bg-[#F5F5F5] border border-black/[0.08] p-7 sm:p-10 max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <span className="editorial-mono text-[#525252]">ПОСТОПЛАТА БЕЗ ПРЕДОПЛАТЫ</span>
                  <h3 className="font-display text-[30px] font-bold tracking-tight text-black">
                    Поминутный тариф (PAYG)
                  </h3>
                  <p className="text-[14px] leading-relaxed text-[#525252]">
                    Удобно для старта или сезонной нагрузки: платите ровно за проговорённые минуты
                    по итогам месяца без фиксированной абонплаты.
                  </p>
                  <div className="flex items-baseline gap-1.5 pt-2">
                    <span className="font-display text-[48px] font-extrabold leading-none text-black">
                      0.45
                    </span>
                    <span className="font-mono text-[14px] font-semibold text-[#525252]">
                      BYN / мин
                    </span>
                  </div>
                  <div className="font-mono text-[11.5px] text-[#1C3B36]">
                    Первые 15 минут при регистрации — бесплатно
                  </div>
                </div>

                <div className="space-y-3 bg-white rounded-[20px] p-6 border border-black/[0.07] text-[13px]">
                  <div className="flex items-start gap-3">
                    <ClockCircleIcon size={18} className="text-black shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-black">Счёт выставляется 1-го числа</div>
                      <div className="text-[#666666] text-[12px]">
                        Детализация по каждому звонку в личном кабинете
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon size={18} className="text-[#10B981] shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-black">7 дней на оплату без блокировки</div>
                      <div className="text-[#666666] text-[12px]">
                        Администратор не останавливается в середине рабочей недели
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon size={18} className="text-[#10B981] shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-black">ЕРИП, БЕЛКАРТ, Visa, Mastercard</div>
                      <div className="text-[#666666] text-[12px]">
                        Онлайн через шлюз bePaid без валютных комиссий
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenAuth()}
                    className="w-full mt-2 h-11 rounded-full bg-black hover:bg-[#222222] text-white text-[13px] font-medium transition-colors cursor-pointer"
                  >
                    Начать на PAYG (+15 мин бесплатно)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Telephony & Belarus Accounting Clarity Strip */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-[22px] bg-[#F5F5F5] border border-black/[0.06] p-6 flex items-start gap-4">
              <span className="w-10 h-10 rounded-[12px] bg-white border border-black/[0.08] flex items-center justify-center text-black shrink-0">
                <PhoneCallingRoundedIcon size={19} />
              </span>
              <div className="space-y-1 text-[13px]">
                <div className="flex flex-wrap items-center gap-2 font-semibold text-black">
                  <span>Подключение номера</span>
                  <span className="font-mono text-[10.5px] px-2 py-0.5 rounded-full bg-white border border-black/[0.08]">
                    0 BYN BYO-SIP
                  </span>
                </div>
                <p className="text-[#525252] leading-relaxed">
                  Бесплатно подключаем ваш существующий номер А1, МТС, Unitalk или Белтелеком. При
                  необходимости аренды нового выделенного номера А1 ВАТС — 15 BYN/мес.
                </p>
              </div>
            </div>

            <div className="rounded-[22px] bg-[#F5F5F5] border border-black/[0.06] p-6 flex items-start gap-4">
              <span className="w-10 h-10 rounded-[12px] bg-white border border-black/[0.08] flex items-center justify-center text-black shrink-0">
                <DocumentTextIcon size={19} />
              </span>
              <div className="space-y-1 text-[13px]">
                <div className="flex flex-wrap items-center gap-2 font-semibold text-black">
                  <span>Закрывающие документы для РБ</span>
                  <span className="font-mono text-[10.5px] px-2 py-0.5 rounded-full bg-[#D8E738] text-black">
                    Минфин № 13
                  </span>
                </div>
                <p className="text-[#525252] leading-relaxed">
                  Публичный договор с ИП Беляков К. О. (УНП 193991846) без НДС. Единоличные акты
                  оказанных услуг для списания расходов юридических лиц и ИП.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
