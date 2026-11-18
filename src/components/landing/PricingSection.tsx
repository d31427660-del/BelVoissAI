import React, { useState } from 'react';
import {
  CheckCircleIcon,
  PhoneCallingRoundedIcon,
  ArrowRightIcon,
  HelpIcon
} from '@solar-icons/react/bold-duotone';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardTitle } from '@/components/ui/card';

interface PricingSectionProps {
  onOpenAuth: () => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onOpenAuth }) => {
  const [billingPeriod, setBillingPeriod] = useState<'payg' | 'packages'>('packages');

  return (
    <section id="pricing" className="py-24 bg-transparent border-t border-black/[0.06] scroll-mt-20">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-16">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <Badge
            variant="outline"
            className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border-slate-300 bg-white/80 text-slate-900 text-xs font-medium shadow-xs"
          >
            Прозрачные тарифы в BYN
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] text-slate-950 tracking-[-0.025em] font-light leading-tight">
            Платите только за то время,{' '}
            <span className="font-normal text-slate-950">когда ассистент говорит</span>
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Без скрытых платежей, без блокировок и без обязательной привязки карты. Оплата в белорусских рублях через bePaid и ЕРИП.
          </p>

          {/* Toggle switcher */}
          <div className="pt-4 flex justify-center">
            <div className="inline-flex p-1 rounded-full bg-slate-200/80 border border-slate-300/80">
              <button
                type="button"
                onClick={() => setBillingPeriod('packages')}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  billingPeriod === 'packages'
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                Пакеты минут со скидкой
              </button>
              <button
                type="button"
                onClick={() => setBillingPeriod('payg')}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  billingPeriod === 'payg'
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                Поминутная оплата (PAYG)
              </button>
            </div>
          </div>
        </div>

        {billingPeriod === 'packages' ? (
          /* Package Tiers */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
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
                  <p className="text-xs text-slate-600">Чтобы протестировать сценарий и голос на реальных вызовах</p>
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
                    <span>15 минут голосовых диалогов</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon size={16} className="text-emerald-500 shrink-0" />
                    <span>Все 5 отраслевых сценариев РБ</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon size={16} className="text-emerald-500 shrink-0" />
                    <span>Голоса Анна и Максим (48 kHz)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon size={16} className="text-emerald-500 shrink-0" />
                    <span>Интеграция с Telegram</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon size={16} className="text-emerald-500 shrink-0" />
                    <span>Без привязки банковской карты</span>
                  </li>
                </ul>
              </div>

              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={onOpenAuth}
                className="w-full rounded-full border-slate-300 hover:bg-slate-100 text-slate-900 text-xs font-medium cursor-pointer"
              >
                Попробовать бесплатно
              </Button>
            </Card>

            {/* Tier 2: Popular Business */}
            <Card className="rounded-2xl bg-neutral-950 text-white border-neutral-800 p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <Badge className="bg-emerald-500 hover:bg-emerald-500 text-slate-950 font-semibold text-[11px]">
                  Популярный
                </Badge>
              </div>

              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs font-medium text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                    Оптимальный
                  </Badge>
                </div>

                <div className="space-y-1">
                  <CardTitle className="text-2xl font-bold text-white">Бизнес • 300 мин</CardTitle>
                  <p className="text-xs text-zinc-300">Для салонов красоты, СТО и автошкол со стабильным потоком звонков</p>
                </div>

                <div className="pt-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white">119</span>
                    <span className="text-base font-semibold text-zinc-300">BYN</span>
                  </div>
                  <span className="text-xs text-emerald-400 font-mono">0.39 BYN за минуту (экономия 15%)</span>
                </div>

                <ul className="space-y-2.5 text-xs text-zinc-200 border-t border-neutral-800 pt-4">
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon size={16} className="text-emerald-400 shrink-0" />
                    <span><strong>300 минут</strong> голосовых диалогов</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon size={16} className="text-emerald-400 shrink-0" />
                    <span>Синхронизация с YCLIENTS / Bitrix24 / 1C</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon size={16} className="text-emerald-400 shrink-0" />
                    <span>SMS и Telegram-карточки лидов</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon size={16} className="text-emerald-400 shrink-0" />
                    <span>Подключение линии МТС, А1 или Белтелеком</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon size={16} className="text-emerald-400 shrink-0" />
                    <span>Минуты не сгорают в конце месяца</span>
                  </li>
                </ul>
              </div>

              <Button
                type="button"
                size="lg"
                onClick={onOpenAuth}
                className="w-full rounded-full bg-white hover:bg-slate-100 text-slate-950 text-xs font-semibold cursor-pointer shadow-md"
              >
                Подключить тариф
              </Button>
            </Card>

            {/* Tier 3: Pro */}
            <Card className="rounded-2xl border-slate-200/90 bg-white/80 p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-xs hover:shadow-md transition-all">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs font-medium text-slate-700 bg-slate-50 border-slate-200">
                    Высокая нагрузка
                  </Badge>
                  <span className="text-xs text-emerald-600 font-mono font-medium">-25%</span>
                </div>

                <div className="space-y-1">
                  <CardTitle className="text-2xl font-bold text-slate-950">Корпоративный • 800 мин</CardTitle>
                  <p className="text-xs text-slate-600">Для медцентров, сетей филиалов и пиковых сезонов продаж</p>
                </div>

                <div className="pt-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-slate-950">269</span>
                    <span className="text-base font-semibold text-slate-700">BYN</span>
                  </div>
                  <span className="text-xs text-emerald-600 font-mono">0.34 BYN за минуту</span>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-4">
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon size={16} className="text-emerald-500 shrink-0" />
                    <span><strong>800 минут</strong> разговоров</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon size={16} className="text-emerald-500 shrink-0" />
                    <span>Приоритетная линия обработки (SLA 99.9%)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon size={16} className="text-emerald-500 shrink-0" />
                    <span>Персональный менеджер и помощь в настройке</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon size={16} className="text-emerald-500 shrink-0" />
                    <span>Акты сдачи-приёмки для юрлиц РБ</span>
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
                onClick={onOpenAuth}
                className="w-full rounded-full border-slate-900 bg-slate-900 text-white hover:bg-slate-800 text-xs font-medium cursor-pointer"
              >
                Выбрать 800 минут
              </Button>
            </Card>
          </div>
        ) : (
          /* PAYG Option */
          <Card className="rounded-2xl border-slate-200/90 bg-white/90 p-8 sm:p-10 shadow-sm max-w-3xl mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-3">
                <Badge variant="outline" className="text-xs text-slate-700">Постоплата или пополнение от 10 BYN</Badge>
                <h3 className="text-2xl font-semibold text-slate-950">Поминутный тариф (PAYG)</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Идеально, если количество звонков сложно предугадать. Оплата списывается строго посекундно только за фактическое время диалога.
                </p>
                <div className="flex items-baseline gap-1 pt-2">
                  <span className="text-4xl font-extrabold text-slate-950">0.45</span>
                  <span className="text-sm font-semibold text-slate-700">BYN / мин</span>
                </div>
              </div>

              <div className="space-y-3 bg-slate-50 p-5 rounded-xl border border-slate-200/80 text-xs text-slate-700">
                <div className="flex items-center gap-2 font-medium text-slate-900">
                  <CheckCircleIcon size={16} className="text-emerald-600" />
                  <span>15 бесплатных минут при регистрации</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircleIcon size={16} className="text-emerald-600" />
                  <span>0 BYN абонентская плата платформы</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircleIcon size={16} className="text-emerald-600" />
                  <span>Пополнение через ЕРИП или банковскую карту</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircleIcon size={16} className="text-emerald-600" />
                  <span>7 дней на оплату счёта без блокировки бота</span>
                </div>
              </div>
            </div>

            <div className="pt-2 text-center">
              <Button
                type="button"
                size="lg"
                onClick={onOpenAuth}
                className="rounded-full bg-slate-900 hover:bg-slate-800 text-white px-8 text-xs font-medium cursor-pointer"
              >
                Начать с 15 бесплатных минут →
              </Button>
            </div>
          </Card>
        )}

        {/* Telephony Option Pill */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white/70 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900 shrink-0">
              <PhoneCallingRoundedIcon size={20} />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <span>Подключение телефонного номера</span>
                <Badge variant="outline" className="text-[10px] font-mono">А1 • МТС • Белтелеком</Badge>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Используйте свой существующий номер бесплатно (BYO-SIP) или подключите выделенный номер А1 ВАТС за 15 BYN/мес.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenAuth}
            className="rounded-full border-slate-300 text-slate-900 text-xs font-medium shrink-0 cursor-pointer"
          >
            Подробнее в кабинете
          </Button>
        </div>

      </div>
    </section>
  );
};