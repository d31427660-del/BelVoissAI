import React, { useState } from 'react';
import {
  CheckCircleIcon,
  PhoneCallingRoundedIcon,
  ArrowRightIcon,
  DocumentTextIcon,
  ClockCircleIcon
} from '@solar-icons/react/bold-duotone';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardTitle } from '@/components/ui/card';
import { SlidingTabs } from '@/components/motion';

interface PricingSectionProps {
  onOpenAuth: (packageId?: 'pack_300' | 'pack_1000') => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onOpenAuth }) => {
  const [billingPeriod, setBillingPeriod] = useState<'packages' | 'payg'>('packages');

  return (
    <section id="pricing" className="py-24 bg-transparent border-t border-black/[0.06] scroll-mt-20">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-14">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <Badge
            variant="outline"
            className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border-slate-300 bg-white/80 text-slate-900 text-xs font-medium shadow-xs"
          >
            Тарифы и прозрачный биллинг в BYN
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] text-slate-950 tracking-[-0.025em] font-light leading-tight">
            Оплата только за время диалога.{' '}
            <span className="font-normal text-slate-950">Без скрытых комиссий.</span>
          </h2>
          <p className="text-slate-600 text-xs sm:text-base leading-relaxed">
            Тарифицируется только фактическое время телефонного разговора бота с клиентом — гудки, ожидание соединения и паузы бесплатны. Официальный договор с резидентом РБ (УНП 193991846).
          </p>

          {/* Toggle switcher (DesignBookmark Motion: Tab pill / Plan switch) */}
          <div className="pt-4 flex justify-center">
            <SlidingTabs<'packages' | 'payg'>
              ariaLabel="Формат оплаты"
              value={billingPeriod}
              onChange={setBillingPeriod}
              options={[
                { value: 'packages', label: 'Пакеты минут со скидкой' },
                { value: 'payg', label: 'Поминутная постоплата (PAYG)' },
              ]}
            />
          </div>
        </div>

        {billingPeriod === 'packages' ? (
          /* Package Tiers */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch animate-fadeIn">
            {/* Tier 1: Free Trial */}
            <Card className="rounded-2xl border-slate-200/90 bg-white/80 p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-xs hover:shadow-md transition-all">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs font-medium text-slate-700 bg-slate-50 border-slate-200">
                    Тест-драйв
                  </Badge>
                  <span className="text-xs text-slate-500 font-mono">0 BYN</span>
                </div>

                <div className="space-y-1">
                  <CardTitle className="text-2xl font-bold text-slate-950">Стартовый</CardTitle>
                  <p className="text-xs text-slate-600">Чтобы протестировать сценарий и голос на реальных вызовах клиентов</p>
                </div>

                <div className="pt-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-slate-950">0</span>
                    <span className="text-base font-semibold text-slate-700">BYN</span>
                  </div>
                  <span className="text-xs text-emerald-600 font-medium">15 минут включено бесплатно</span>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-4">
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon size={16} className="text-emerald-500 shrink-0" />
                    <span><strong>15 минут</strong> голосовых звонков в подарок</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon size={16} className="text-emerald-500 shrink-0" />
                    <span>Все 5 отраслевых сценариев РБ</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon size={16} className="text-emerald-500 shrink-0" />
                    <span>Голоса Анна и Максим (48 kHz Neural)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon size={16} className="text-emerald-500 shrink-0" />
                    <span>Интеграция с Telegram-ботом</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon size={16} className="text-emerald-500 shrink-0" />
                    <span><strong>Без привязки банковской карты</strong></span>
                  </li>
                </ul>
              </div>

              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => onOpenAuth()}
                className="w-full rounded-full border-slate-300 hover:bg-slate-100 text-slate-900 text-xs font-medium cursor-pointer"
              >
                Попробовать бесплатно
              </Button>
            </Card>

            {/* Tier 2: 300 minutes Package */}
            <Card className="rounded-2xl bg-neutral-950 text-white border-neutral-800 p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <Badge className="bg-emerald-500 hover:bg-emerald-500 text-slate-950 font-semibold text-[11px]">
                  Выгода −11%
                </Badge>
              </div>

              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs font-medium text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                    Оптимальный
                  </Badge>
                </div>

                <div className="space-y-1">
                  <CardTitle className="text-2xl font-bold text-white">Пакет 300 минут</CardTitle>
                  <p className="text-xs text-zinc-300">Для салонов красоты, СТО, клиник и автошкол со стабильным потоком звонков</p>
                </div>

                <div className="pt-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white">120</span>
                    <span className="text-base font-semibold text-zinc-300">BYN</span>
                  </div>
                  <span className="text-xs text-emerald-400 font-mono">0.40 BYN за минуту (экономия 15 BYN)</span>
                </div>

                <ul className="space-y-2.5 text-xs text-zinc-200 border-t border-neutral-800 pt-4">
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon size={16} className="text-emerald-400 shrink-0" />
                    <span><strong>300 минут</strong> голосовых диалогов</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon size={16} className="text-emerald-400 shrink-0" />
                    <span><strong>Минуты не сгорают</strong> в конце месяца</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon size={16} className="text-emerald-400 shrink-0" />
                    <span>Синхронизация с YCLIENTS / Bitrix24 / 1C</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon size={16} className="text-emerald-400 shrink-0" />
                    <span>SMS и Telegram-карточки сделок</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon size={16} className="text-emerald-400 shrink-0" />
                    <span>Подключение линии МТС, А1 или Белтелеком</span>
                  </li>
                </ul>
              </div>

              <Button
                type="button"
                size="lg"
                onClick={() => onOpenAuth('pack_300')}
                className="w-full rounded-full bg-white hover:bg-slate-100 text-slate-950 text-xs font-semibold cursor-pointer shadow-md"
              >
                Купить пакет 300 минут
              </Button>
            </Card>

            {/* Tier 3: 1000 minutes Package */}
            <Card className="rounded-2xl border-slate-200/90 bg-white/80 p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-xs hover:shadow-md transition-all">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs font-medium text-slate-700 bg-slate-50 border-slate-200">
                    Макс. выгода −22%
                  </Badge>
                  <span className="text-xs text-emerald-600 font-mono font-medium">Экономия 100 BYN</span>
                </div>

                <div className="space-y-1">
                  <CardTitle className="text-2xl font-bold text-slate-950">Пакет 1000 минут</CardTitle>
                  <p className="text-xs text-slate-600">Для медцентров, нескольких филиалов и пиковых сезонов продаж</p>
                </div>

                <div className="pt-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-slate-950">350</span>
                    <span className="text-base font-semibold text-slate-700">BYN</span>
                  </div>
                  <span className="text-xs text-emerald-600 font-mono">0.35 BYN за минуту</span>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-4">
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon size={16} className="text-emerald-500 shrink-0" />
                    <span><strong>1 000 минут</strong> разговоров на балансе</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon size={16} className="text-emerald-500 shrink-0" />
                    <span>Бессрочный остаток (без сгорания)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon size={16} className="text-emerald-500 shrink-0" />
                    <span>Приоритетная линия обработки (SLA 99.9%)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon size={16} className="text-emerald-500 shrink-0" />
                    <span>Единоличные акты оказанных услуг для юрлиц</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon size={16} className="text-emerald-500 shrink-0" />
                    <span>Оплата безналичным расчётом или ЕРИП</span>
                  </li>
                </ul>
              </div>

              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => onOpenAuth('pack_1000')}
                className="w-full rounded-full border-slate-900 bg-slate-900 text-white hover:bg-slate-800 text-xs font-medium cursor-pointer"
              >
                Купить пакет 1000 минут
              </Button>
            </Card>
          </div>
        ) : (
          /* PAYG Option (Transparent Postpaid Model) */
          <Card className="rounded-2xl border-slate-200/90 bg-white/90 p-6 sm:p-10 shadow-sm max-w-3xl mx-auto space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-3">
                <Badge variant="outline" className="text-xs text-slate-700 bg-slate-50 border-slate-200">
                  Постоплатная модель без предоплаты
                </Badge>
                <h3 className="text-2xl font-semibold text-slate-950">Поминутный тариф (PAYG)</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Идеально при нерегулярном потоке звонков. Начните работу прямо сейчас без пополнения счёта. Оплата начисляется строго за фактические минуты звонков.
                </p>
                <div className="flex items-baseline gap-1 pt-2">
                  <span className="text-4xl font-extrabold text-slate-950">0.45</span>
                  <span className="text-sm font-semibold text-slate-700">BYN / мин</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Первые 15 минут — в подарок при регистрации
                </div>
              </div>

              <div className="space-y-3 bg-slate-50 p-5 rounded-xl border border-slate-200/80 text-xs text-slate-700">
                <div className="flex items-start gap-2.5">
                  <ClockCircleIcon size={17} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900 block">Счёт выставляется 1-го числа</span>
                    <span className="text-slate-500 text-[11px]">Автоматический расчёт в 00:05 за прошлый месяц</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircleIcon size={17} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900 block">7 дней на оплату без блокировки</span>
                    <span className="text-slate-500 text-[11px]">Бот продолжает принимать звонки без отключения</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircleIcon size={17} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900 block">Оплата через ЕРИП или картой РБ</span>
                    <span className="text-slate-500 text-[11px]">Через шлюз bePaid без комиссий</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 text-center">
              <Button
                type="button"
                size="lg"
                onClick={() => onOpenAuth()}
                className="w-full sm:w-auto rounded-full bg-slate-900 hover:bg-slate-800 text-white px-6 sm:px-8 text-xs font-medium cursor-pointer h-11"
              >
                <span>Начать на тарифе PAYG с 15 бесплатными минутами →</span>
              </Button>
            </div>
          </Card>
        )}

        {/* Telephony & Accounting Clarification Strip */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Telephone lines */}
          <div className="p-5 rounded-2xl bg-white/70 border border-slate-200/80 flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900 shrink-0 mt-0.5">
              <PhoneCallingRoundedIcon size={20} />
            </div>
            <div className="space-y-1 text-xs">
              <div className="font-semibold text-slate-900 flex items-center gap-2">
                <span>Подключение телефонного номера</span>
                <Badge variant="outline" className="text-[10px] font-mono">0 BYN абонплата</Badge>
              </div>
              <p className="text-slate-600 leading-relaxed">
                <strong>BYO-SIP:</strong> бесплатное подключение вашего действующего номера МТС, А1 или Белтелеком (абонплата 0 BYN). При необходимости аренды нового выделенного номера А1 ВАТС — 15 BYN/мес.
              </p>
            </div>
          </div>

          {/* Card 2: Legal docs for Belarus accountants */}
          <div className="p-5 rounded-2xl bg-white/70 border border-slate-200/80 flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900 shrink-0 mt-0.5">
              <DocumentTextIcon size={20} />
            </div>
            <div className="space-y-1 text-xs">
              <div className="font-semibold text-slate-900 flex items-center gap-2">
                <span>Документы для бухгалтерии РБ</span>
                <Badge variant="outline" className="text-[10px] font-mono text-emerald-700 bg-emerald-50">Минфин № 13</Badge>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Официальный договор-оферта с ИП Беляков К. О. (УНП 193991846) без НДС. Первичные закрывающие документы формируются единоличным актом для 100% списания в расходы компании.
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};