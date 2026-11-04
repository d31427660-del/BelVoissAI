import React, { useState } from 'react';
import { 
  CheckCircleIcon, 
  ArrowRightIcon, 
  ShieldCheckIcon,
  ClockCircleIcon,
  WalletMoneyIcon,
  PhoneCallingRoundedIcon,
  FlameIcon
} from '@solar-icons/react/bold-duotone';
import { MINUTE_PACKAGES } from '../../lib/mockData';
import { MinutePackage } from '../../types';

interface PricingProps {
  onSelectPackage?: (pkg: MinutePackage) => void;
  onOpenAuth: () => void;
}

export const Pricing: React.FC<PricingProps> = ({ onSelectPackage, onOpenAuth }) => {
  const [customMinutes, setCustomMinutes] = useState<number>(300);

  // Dynamic rate calculation based on volume
  const getRateForMinutes = (mins: number) => {
    if (mins >= 1000) return 0.35;
    if (mins >= 300) return 0.40;
    return 0.45;
  };

  const currentRate = getRateForMinutes(customMinutes);
  const customCostByn = Math.round(customMinutes * currentRate);
  const approxCalls = Math.round(customMinutes / 1.5);

  const handleAction = (pkg?: MinutePackage) => {
    if (pkg && onSelectPackage) {
      onSelectPackage(pkg);
    } else {
      onOpenAuth();
    }
  };

  return (
    <section id="pricing" className="py-24 bg-[#ffffff] scroll-mt-20">
      <div className="max-w-[1080px] mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/80">
            <WalletMoneyIcon size={16} className="text-emerald-600" />
            <span>0 BYN абонентская плата • Оплата только за минуты</span>
          </div>

          <h2 className="apple-heading text-3xl sm:text-4xl lg:text-[46px] text-[#1d1d1f] tracking-tight leading-tight">
            Честная поминутная оплата.{' '}
            <span className="bg-gradient-to-r from-[#2563eb] via-indigo-600 to-emerald-600 bg-clip-text text-transparent">
              Минуты никогда не сгорают.
            </span>
          </h2>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Забудьте о ежемесячных подписках. Вы пополняете баланс минут и расходуете их только тогда, когда робот принимает реальные входящие звонки от ваших клиентов.
          </p>

          {/* Value Badges Pill Strip */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
              <CheckCircleIcon size={14} className="text-emerald-500" />
              15 минут в подарок при регистрации
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
              <CheckCircleIcon size={14} className="text-emerald-500" />
              Все интеграции и фичи включены
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
              <CheckCircleIcon size={14} className="text-emerald-500" />
              Несгораемый баланс
            </span>
          </div>
        </div>

        {/* 3 Package Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch mb-14">
          {MINUTE_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className={`rounded-[38px] p-7 sm:p-8 flex flex-col justify-between relative transition-all duration-300 ${
                pkg.isPopular
                  ? 'bg-gradient-to-b from-[#1e3a8a] via-[#1d4ed8] to-[#1e1b4b] text-[#ffffff] shadow-2xl shadow-blue-500/25 ring-2 ring-[#2563eb] -translate-y-1'
                  : 'bg-slate-50 border border-slate-200/80 text-[#1d1d1f] hover:border-blue-300 hover:shadow-lg'
              }`}
            >
              <div>
                {/* Header Tag */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    pkg.isPopular ? 'bg-white/20 text-blue-100' : 'bg-blue-50 text-[#2563eb]'
                  }`}>
                    {pkg.badge || 'Пакет минут'}
                  </span>

                  {pkg.savingsPercent && (
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[11px] font-bold">
                      <FlameIcon size={13} />
                      −{pkg.savingsPercent}%
                    </span>
                  )}
                </div>

                {/* Package Name & Minutes */}
                <h3 className="text-2xl font-bold tracking-tight mb-1">
                  {pkg.name}
                </h3>
                <div className={`text-sm font-medium mb-4 flex items-center gap-1.5 ${
                  pkg.isPopular ? 'text-blue-200' : 'text-slate-500'
                }`}>
                  <ClockCircleIcon size={16} />
                  <span>{pkg.minutes} минут диалогов</span>
                </div>

                <p className={`text-xs leading-relaxed min-h-[44px] mb-6 ${
                  pkg.isPopular ? 'text-blue-100/90' : 'text-slate-600'
                }`}>
                  {pkg.description}
                </p>

                {/* Price Display */}
                <div className={`flex items-baseline gap-1.5 mb-6 pb-6 border-b ${
                  pkg.isPopular ? 'border-white/15' : 'border-slate-200'
                }`}>
                  <span className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                    {pkg.priceByn}
                  </span>
                  <span className="text-sm font-semibold">BYN</span>
                  <span className={`text-xs ml-auto font-mono px-2 py-0.5 rounded-md ${
                    pkg.isPopular ? 'bg-white/15 text-blue-100' : 'bg-slate-200/80 text-slate-700'
                  }`}>
                    {pkg.ratePerMinute.toFixed(2)} BYN / мин
                  </span>
                </div>

                {/* What is included in this volume */}
                <div className="space-y-2.5 text-xs">
                  <div className={`flex items-center gap-2 ${pkg.isPopular ? 'text-blue-100' : 'text-slate-700'}`}>
                    <PhoneCallingRoundedIcon size={15} className="shrink-0 text-emerald-400" />
                    <span>~{Math.round(pkg.minutes / 1.5)} обработанных клиентов</span>
                  </div>
                  <div className={`flex items-center gap-2 ${pkg.isPopular ? 'text-blue-100' : 'text-slate-700'}`}>
                    <CheckCircleIcon size={15} className="shrink-0 text-emerald-400" />
                    <span>0 BYN абонплаты за сервис</span>
                  </div>
                  <div className={`flex items-center gap-2 ${pkg.isPopular ? 'text-blue-100' : 'text-slate-700'}`}>
                    <CheckCircleIcon size={15} className="shrink-0 text-emerald-400" />
                    <span>Минуты не сгорают никогда</span>
                  </div>
                </div>
              </div>

              {/* Package CTA */}
              <div className="pt-8">
                <button
                  onClick={() => handleAction(pkg)}
                  className={`w-full py-3.5 rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                    pkg.isPopular
                      ? 'bg-[#ffffff] hover:bg-blue-50 text-[#2563eb] shadow-md shadow-blue-900/30 font-bold'
                      : 'bg-[#2563eb] hover:bg-[#1d4ed8] text-[#ffffff] shadow-sm'
                  }`}
                >
                  <span>Выбрать {pkg.minutes} минут</span>
                  <ArrowRightIcon size={16} />
                </button>
                <p className={`text-[11px] text-center mt-2.5 ${pkg.isPopular ? 'text-blue-200' : 'text-slate-500'}`}>
                  +15 минут в подарок новому клиенту
                </p>
              </div>

            </div>
          ))}
        </div>

        {/* Interactive Custom Minute Estimator Bento Card */}
        <div className="rounded-[40px] bg-slate-50 border border-slate-200/90 p-7 sm:p-10 mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/80 text-[#2563eb] text-xs font-semibold">
                Калькулятор минут
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#1d1d1f]">
                Нужен индивидуальный объем? Рассчитайте точную стоимость
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Передвигайте бегунок, чтобы рассчитать бюджет для вашего бизнеса. Чем больше объем — тем выгоднее цена за минуту (до 0.35 BYN).
              </p>

              <div className="pt-4 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <label htmlFor="pricing-custom-minutes" className="font-medium text-slate-700">
                    Желаемый объем минут:
                  </label>
                  <span className="text-sm font-bold text-[#2563eb] bg-blue-50 border border-blue-200/80 px-3 py-1 rounded-full font-mono">
                    {customMinutes} минут (~{approxCalls} звонков)
                  </span>
                </div>
                <input
                  id="pricing-custom-minutes"
                  type="range"
                  min="50"
                  max="2000"
                  step="25"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#2563eb]"
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>50 мин</span>
                  <span>500 мин</span>
                  <span>1 000 мин (скидка 22%)</span>
                  <span>2 000 мин</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 p-6 sm:p-7 rounded-[32px] bg-white border border-slate-200/80 shadow-apple-card flex flex-col justify-between space-y-5">
              <div>
                <span className="text-xs text-slate-500 font-medium block mb-1">Итоговая стоимость:</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-black text-[#1d1d1f] tracking-tight">
                    {customCostByn}
                  </span>
                  <span className="text-base font-bold text-slate-800">BYN</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Тариф: <strong className="text-slate-800 font-semibold">{currentRate.toFixed(2)} BYN / мин</strong> (без абонплаты)
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3.5 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon size={14} className="text-emerald-500 shrink-0" />
                  <span>Хватит на ~{approxCalls} подробных консультаций</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircleIcon size={14} className="text-emerald-500 shrink-0" />
                  <span>Бессрочное действие без абонентской платы</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  handleAction({
                    id: 'custom',
                    name: 'Индивидуальный объём',
                    minutes: customMinutes,
                    priceByn: customCostByn,
                    ratePerMinute: currentRate,
                    description: `Индивидуальный пакет на ${customMinutes} минут диалогов`
                  })
                }
                className="w-full py-3.5 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <span>Выбрать {customMinutes} минут ({customCostByn} BYN)</span>
                <ArrowRightIcon size={16} />
              </button>
            </div>

          </div>
        </div>

        {/* Transparent Guarantee Strip */}
        <div className="p-6 sm:p-8 rounded-[36px] bg-blue-50/60 border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-600">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#ffffff] border border-blue-200/80 flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheckIcon size={24} className="text-[#2563eb]" />
            </div>
            <div>
              <strong className="text-[#1d1d1f] block font-semibold text-sm mb-0.5">
                Все возможности платформы включены в каждый звонок
              </strong>
              Единый стандарт: интеграция с YCLIENTS / CRM, Telegram-уведомления, подключение номеров МТС и А1, аудиозаписи и соблюдение Закона РБ № 99-З. Никаких доплат.
            </div>
          </div>

          <a
            href="#calculator"
            className="px-6 py-3 rounded-full bg-[#ffffff] border border-blue-200 hover:border-[#2563eb] text-[#2563eb] font-semibold whitespace-nowrap transition-colors shadow-xs"
          >
            Сравнить с зарплатой администратора →
          </a>
        </div>

      </div>
    </section>
  );
};
