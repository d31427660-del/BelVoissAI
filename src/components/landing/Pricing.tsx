import React, { useState } from 'react';
import { 
  CheckCircleIcon, 
  ArrowRightIcon, 
  ShieldCheckIcon,
  WalletMoneyIcon,
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
    <section id="pricing" className="py-24 bg-white scroll-mt-20">
      <div className="max-w-[1080px] mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F5F3F1] text-black text-xs font-normal border border-black/[0.075]">
            <WalletMoneyIcon size={15} className="text-black" />
            <span>0 BYN абонентская плата • Оплата только за минуты</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-[46px] text-black tracking-[-0.025em] font-light leading-tight">
            Честная поминутная оплата.{' '}
            <span className="text-[#59544F]">
              Минуты никогда не сгорают.
            </span>
          </h2>

          <p className="text-[#59544F] text-sm sm:text-base leading-relaxed font-normal">
            Забудьте о ежемесячных подписках. Вы пополняете баланс минут и расходуете их только тогда, когда робот принимает реальные входящие звонки от ваших клиентов.
          </p>

          {/* Value Badges Pill Strip */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5F3F1] text-[#59544F] border border-black/[0.075] font-normal">
              <CheckCircleIcon size={14} className="text-black" />
              15 минут в подарок при регистрации
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5F3F1] text-[#59544F] border border-black/[0.075] font-normal">
              <CheckCircleIcon size={14} className="text-black" />
              Все интеграции и фичи включены
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5F3F1] text-[#59544F] border border-black/[0.075] font-normal">
              <CheckCircleIcon size={14} className="text-black" />
              Несгораемый баланс
            </span>
          </div>
        </div>

        {/* 3 Package Cards Grid (ElevenLabs 16px radius cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch mb-14">
          {MINUTE_PACKAGES.map((pkg) => {
            const isPop = pkg.isPopular;
            return (
              <div
                key={pkg.id}
                className={`rounded-[16px] p-7 sm:p-8 flex flex-col justify-between relative transition-all duration-300 ${
                  isPop
                    ? 'liquid-glass-dark text-white -translate-y-1 shadow-xl'
                    : 'liquid-glass-cream text-black hover:border-black/20'
                }`}
              >
                <div>
                  {/* Header Tag */}
                  <div className="flex items-center justify-between mb-5">
                    <span className={`text-xs px-3 py-1 rounded-full font-normal ${
                      isPop
                        ? 'bg-white/15 text-white border border-white/20'
                        : 'liquid-glass-pill text-black'
                    }`}>
                      {pkg.badge || 'Пакет минут'}
                    </span>

                    {pkg.savingsPercent && (
                      <span className={`inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full ${
                        isPop ? 'bg-white/15 text-white' : 'liquid-glass-btn-primary text-white'
                      }`}>
                        <FlameIcon size={12} />
                        −{pkg.savingsPercent}%
                      </span>
                    )}
                  </div>

                  {/* Title & Minutes */}
                  <h3 className={`text-xl sm:text-2xl font-medium tracking-tight mb-1.5 ${isPop ? 'text-white' : 'text-black'}`}>
                    {pkg.name}
                  </h3>
                  
                  <div className={`text-xs font-mono mb-6 ${isPop ? 'text-white/70' : 'text-[#777169]'}`}>
                    ● {pkg.minutes} минут диалогов
                  </div>

                  <p className={`text-xs leading-relaxed mb-6 font-normal ${isPop ? 'text-white/80' : 'text-[#59544F]'}`}>
                    {pkg.description}
                  </p>

                  {/* Price */}
                  <div className={`mb-6 pb-6 border-b ${isPop ? 'border-white/15' : 'border-black/[0.075]'}`}>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-4xl sm:text-5xl font-medium tracking-tight ${isPop ? 'text-white' : 'text-black'}`}>
                        {pkg.priceByn}
                      </span>
                      <span className={`text-sm font-medium ${isPop ? 'text-white/70' : 'text-[#59544F]'}`}>
                        BYN
                      </span>
                      <span className={`ml-auto text-xs font-mono px-2 py-0.5 rounded ${
                        isPop ? 'bg-white/10 text-white/90' : 'bg-black/[0.04] text-[#59544F]'
                      }`}>
                        {pkg.ratePerMinute.toFixed(2)} BYN / мин
                      </span>
                    </div>
                  </div>

                  {/* Features List */}
                  <ul className="space-y-2.5 text-xs mb-8 font-normal">
                    <li className="flex items-center gap-2">
                      <CheckCircleIcon size={15} className={`shrink-0 ${isPop ? 'text-white' : 'text-black'}`} />
                      <span className={isPop ? 'text-white/90' : 'text-[#59544F]'}>
                        ~{Math.round(pkg.minutes / 1.5)} обработанных клиентов
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircleIcon size={15} className={`shrink-0 ${isPop ? 'text-white' : 'text-black'}`} />
                      <span className={isPop ? 'text-white/90' : 'text-[#59544F]'}>
                        0 BYN абонплаты за сервис
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircleIcon size={15} className={`shrink-0 ${isPop ? 'text-white' : 'text-black'}`} />
                      <span className={isPop ? 'text-white/90' : 'text-[#59544F]'}>
                        Минуты не сгорают никогда
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Card Button */}
                <div>
                  <button
                    type="button"
                    onClick={() => handleAction(pkg)}
                    className={`w-full h-11 rounded-full text-xs font-normal transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] ${
                      isPop
                        ? 'bg-white text-black hover:bg-[#FDFCFC]'
                        : 'liquid-glass-pill text-black hover:bg-white'
                    }`}
                  >
                    <span>Выбрать {pkg.minutes} минут</span>
                    <ArrowRightIcon size={14} />
                  </button>

                  <p className={`text-[11px] text-center mt-3 font-normal ${isPop ? 'text-white/60' : 'text-[#777169]'}`}>
                    +15 минут в подарок новому клиенту
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom Minutes Bento Calculator (ElevenLabs 16px container + 12px inner card) */}
        <div className="rounded-[16px] liquid-glass-cream p-6 sm:p-8 lg:p-10 mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full liquid-glass-pill text-black text-xs font-normal">
                Калькулятор минут
              </div>
              <h3 className="text-xl sm:text-2xl font-medium text-black">
                Нужен индивидуальный объем? Рассчитайте точную стоимость
              </h3>
              <p className="text-xs sm:text-sm text-[#59544F] leading-relaxed font-normal">
                Передвигайте бегунок, чтобы рассчитать бюджет для вашего бизнеса. Чем больше объем — тем выгоднее цена за минуту (до 0.35 BYN).
              </p>

              <div className="pt-3 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <label htmlFor="pricing-custom-minutes" className="font-normal text-[#59544F]">
                    Желаемый объем минут:
                  </label>
                  <span className="text-xs sm:text-sm font-medium text-black bg-white border border-black/[0.08] px-3 py-1 rounded-full font-mono shadow-2xs">
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
                  className="w-full h-1.5 bg-[#EBE8E4] rounded-full appearance-none cursor-pointer accent-black"
                />
                <div className="flex justify-between text-[11px] text-[#777169] font-mono">
                  <span>50 мин</span>
                  <span>500 мин</span>
                  <span>1 000 мин (скидка 22%)</span>
                  <span>2 000 мин</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 p-6 sm:p-7 rounded-[12px] liquid-glass-card flex flex-col justify-between space-y-5">
              <div>
                <span className="text-xs text-[#777169] font-normal block mb-1">Итоговая стоимость:</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-medium text-black tracking-tight">
                    {customCostByn}
                  </span>
                  <span className="text-base font-medium text-black">BYN</span>
                </div>
                <div className="text-xs text-[#777169] mt-1 font-normal">
                  Тариф: <strong className="text-black font-medium">{currentRate.toFixed(2)} BYN / мин</strong> (без абонплаты)
                </div>
              </div>

              <div className="border-t border-black/[0.06] pt-3.5 space-y-2 text-xs text-[#59544F] font-normal">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon size={14} className="text-black shrink-0" />
                  <span>Хватит на ~{approxCalls} подробных консультаций</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircleIcon size={14} className="text-black shrink-0" />
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
                className="w-full h-11 rounded-full liquid-glass-btn-primary text-white font-normal text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
              >
                <span>Выбрать {customMinutes} минут ({customCostByn} BYN)</span>
                <ArrowRightIcon size={15} />
              </button>
            </div>

          </div>
        </div>

        {/* Transparent Guarantee Strip (ElevenLabs 16px container) */}
        <div className="p-6 sm:p-8 rounded-[16px] liquid-glass-cream flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-[#59544F]">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-[10px] liquid-glass-card flex items-center justify-center shrink-0 text-black">
              <ShieldCheckIcon size={22} />
            </div>
            <div>
              <strong className="text-black block font-medium text-sm mb-0.5">
                Все возможности платформы включены в каждый звонок
              </strong>
              Единый стандарт: интеграция с YCLIENTS / CRM, Telegram-уведомления, подключение номеров МТС и А1, аудиозаписи и соблюдение Закона РБ № 99-З. Никаких доплат.
            </div>
          </div>

          <a
            href="#calculator"
            className="px-5 h-10 inline-flex items-center rounded-full liquid-glass-pill text-black hover:bg-white font-normal whitespace-nowrap transition-colors text-xs shrink-0 cursor-pointer"
          >
            Сравнить с зарплатой администратора →
          </a>
        </div>

      </div>
    </section>
  );
};
