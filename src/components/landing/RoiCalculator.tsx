import React, { useState } from 'react';
import { CheckCircleIcon, ArrowRightIcon } from '@solar-icons/react/bold-duotone';

interface RoiCalculatorProps {
  onOpenAuth: () => void;
}

export const RoiCalculator: React.FC<RoiCalculatorProps> = ({ onOpenAuth }) => {
  const calcMode = 'replace_admin';
  const [missedCalls, setMissedCalls] = useState<number>(45);
  const [avgCheck, setAvgCheck] = useState<number>(250);

  const conversionRate = 0.35;
  const lostCustomers = Math.round(missedCalls * conversionRate);
  const lostRevenueByn = Math.round(lostCustomers * avgCheck);

  const humanAdminSalaryByn = 1800;
  // Средний диалог длится около 1.5 минут; при полной замене админа учитываем также дневной поток (+180 звонков)
  const totalBotCalls = calcMode === 'replace_admin' ? missedCalls + 180 : missedCalls;
  const estimatedDialogueMinutes = Math.round(totalBotCalls * 1.5);
  const getRateForMinutes = (mins: number) => {
    if (mins >= 1000) return 0.35;
    if (mins >= 300) return 0.40;
    return 0.45;
  };
  const effectiveRate = getRateForMinutes(estimatedDialogueMinutes);
  const voxiCostByn = Math.max(15, Math.round(estimatedDialogueMinutes * effectiveRate));

  const monthlySalarySavings = calcMode === 'replace_admin' ? Math.max(0, humanAdminSalaryByn - voxiCostByn) : 0;
  const totalMonthlyGainByn =
    calcMode === 'replace_admin'
      ? monthlySalarySavings + lostRevenueByn
      : Math.max(0, lostRevenueByn - voxiCostByn);
  const yearlyGainByn = totalMonthlyGainByn * 12;
  const timesCheaper = Math.max(2, Math.round(humanAdminSalaryByn / voxiCostByn));

  const triggerConfetti = async () => {
    try {
      const { default: confetti } = await import('canvas-confetti');
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#000000', '#44403B', '#777169', '#EBE8E4']
      });
    } catch {
      // ignore
    }
  };

  return (
    <section id="calculator" className="py-24 bg-white scroll-mt-20">
      <div className="max-w-[1080px] mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="mb-12 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#F5F3F1] text-black border border-black/[0.075] text-xs font-normal">
            Экономика бизнеса
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] text-black tracking-[-0.025em] font-light leading-tight">
            Расчет окупаемости в BYN.{' '}
            <span className="text-[#59544F]">
              Прозрачная выгода с первого месяца.
            </span>
          </h2>
        </div>

        {/* ElevenLabs Bento Container (16px radius + Liquid Glass Cream) */}
        <div className="rounded-[16px] liquid-glass-cream p-5 sm:p-8 lg:p-10">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            
            {/* Left Column: Mode Radio + Sliders */}
            <div className="lg:col-span-6 space-y-4">
              {/* Scenario Selector */}
              <div className="p-4 sm:p-5 rounded-[12px] liquid-glass-card space-y-2.5">
                <div className="text-xs font-normal text-[#777169]">
                  Режим работы ИИ-администратора:
                </div>
                <div className="p-3 sm:p-3.5 rounded-[10px] border border-black/[0.08] bg-[#F5F3F1]/70 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-black shrink-0" />
                    <span className="text-xs sm:text-sm font-medium text-black leading-snug">
                      Замена штатного администратора
                    </span>
                  </div>
                  <span className="w-4 h-4 rounded-full border border-black bg-black flex items-center justify-center shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  </span>
                </div>
              </div>

              {/* Slider 1 */}
              <div className="space-y-3 p-5 sm:p-6 rounded-[12px] liquid-glass-card">
                <div className="flex justify-between items-center">
                  <label htmlFor="roi-missed-calls" className="text-xs font-normal text-black">
                    Пропущенные звонки в месяц
                  </label>
                  <span className="text-xs sm:text-sm font-medium text-black bg-[#F5F3F1] border border-black/[0.075] px-3 py-1 rounded-full whitespace-nowrap font-mono">
                    {missedCalls} звонков
                  </span>
                </div>
                <input
                  id="roi-missed-calls"
                  type="range"
                  min="5"
                  max="300"
                  step="5"
                  value={missedCalls}
                  onChange={(e) => setMissedCalls(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#EBE8E4] rounded-full appearance-none cursor-pointer accent-black"
                />
                <div className="flex justify-between text-[11px] text-[#777169]">
                  <span>5</span>
                  <span>150 (средний поток)</span>
                  <span>300</span>
                </div>
              </div>

              {/* Slider 2 */}
              <div className="space-y-3 p-5 sm:p-6 rounded-[12px] liquid-glass-card">
                <div className="flex justify-between items-center">
                  <label htmlFor="roi-avg-check" className="text-xs font-normal text-black">
                    Средний чек услуги
                  </label>
                  <span className="text-xs sm:text-sm font-medium text-black bg-[#F5F3F1] border border-black/[0.075] px-3 py-1 rounded-full whitespace-nowrap font-mono">
                    {avgCheck} BYN
                  </span>
                </div>
                <input
                  id="roi-avg-check"
                  type="range"
                  min="30"
                  max="1500"
                  step="10"
                  value={avgCheck}
                  onChange={(e) => setAvgCheck(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#EBE8E4] rounded-full appearance-none cursor-pointer accent-black"
                />
                <div className="flex justify-between text-[11px] text-[#777169]">
                  <span>30 BYN</span>
                  <span>750 BYN</span>
                  <span>1 500 BYN</span>
                </div>
              </div>

              {/* Lost Revenue Summary */}
              <div className="p-5 sm:p-6 rounded-[12px] liquid-glass-card space-y-1.5">
                <div className="text-xs font-normal text-[#777169]">
                  Потери на необработанных вызовах
                </div>
                <div className="text-2xl sm:text-3xl font-medium text-black tracking-tight">
                  ~{lostRevenueByn.toLocaleString('ru-RU')} BYN / мес
                </div>
                <p className="text-xs text-[#59544F] leading-relaxed font-normal">
                  Около {lostCustomers} потенциальных клиентов ежемесячно уходят к конкурентам, если не получают ответа с первого гудка.
                </p>
              </div>

            </div>

            {/* Right Column: Comparison */}
            <div className="lg:col-span-6 space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Human Admin */}
                <div className="p-5 sm:p-6 rounded-[12px] liquid-glass-card space-y-4">
                  <div className="text-xs font-normal text-[#777169]">
                    Штатный администратор
                  </div>
                  <div>
                    <div className="text-2xl font-medium text-black tracking-tight">
                      1 800 <span className="text-xs font-normal text-[#777169]">BYN/мес</span>
                    </div>
                    <div className="text-[11px] text-[#777169] mt-0.5">
                      + отчисления ФСЗН (~612 BYN)
                    </div>
                  </div>
                  <ul className="text-xs text-[#59544F] space-y-2 border-t border-black/[0.06] pt-3.5 font-normal">
                    <li>— График только 9:00–18:00</li>
                    <li>— Выходные и ночное время</li>
                    <li>— Больничные и отпуска</li>
                    <li>— Ожидание при занятой линии</li>
                  </ul>
                </div>

                {/* Voxi.by: ElevenLabs Signature Obsidian Card with Liquid Glass */}
                <div className="p-5 sm:p-6 rounded-[12px] liquid-glass-dark text-white space-y-4 shadow-sm">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-white">Voxi.by</span>
                    <span className="text-[10px] font-normal px-2.5 py-0.5 rounded-full bg-white/15 text-white border border-white/20">
                      В {timesCheaper} раз выгоднее
                    </span>
                  </div>
                  <div>
                    <div className="text-2xl font-medium text-white tracking-tight whitespace-nowrap">
                      ~{voxiCostByn} <span className="text-xs font-normal text-white/70">BYN/мес</span>
                    </div>
                    <div className="text-[11px] text-white/70 mt-0.5">
                      Только за {estimatedDialogueMinutes} мин ({effectiveRate.toFixed(2)} BYN/мин)
                    </div>
                  </div>
                  <ul className="text-xs text-white/80 space-y-2 border-t border-white/15 pt-3.5 font-normal">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                      <span>0 BYN абонентская плата</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                      <span>Минуты не сгорают в конце месяца</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                      <span>Работает 24/7 без выходных</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                      <span>Заявки сразу в YCLIENTS и Telegram</span>
                    </li>
                  </ul>
                </div>

              </div>

              {/* Net Benefit Card (12px radius inner card with liquid glass) */}
              <div className="p-5 sm:p-6 rounded-[12px] liquid-glass-card space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-normal text-[#777169]">
                    Суммарный финансовый эффект
                  </span>
                  <button 
                    onClick={triggerConfetti}
                    className="text-xs text-black hover:text-[#59544F] font-normal underline whitespace-nowrap cursor-pointer"
                  >
                    Проверить расчет
                  </button>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-2xl sm:text-3xl font-medium text-black tracking-tight whitespace-nowrap">
                      +{totalMonthlyGainByn.toLocaleString('ru-RU')} <span className="text-sm font-normal text-[#777169]">BYN / мес</span>
                    </div>
                    <div className="text-xs text-[#59544F] mt-0.5 font-normal">
                      ~{yearlyGainByn.toLocaleString('ru-RU')}&nbsp;BYN сохраненного бюджета и выручки в год
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onOpenAuth}
                    className="inline-flex items-center justify-center rounded-full liquid-glass-btn-primary text-white px-5 h-11 text-xs font-normal active:scale-[0.98] transition-all shrink-0 whitespace-nowrap cursor-pointer gap-1.5"
                  >
                    <span>Подключить</span>
                    <ArrowRightIcon size={15} />
                  </button>
                </div>

                <div className="text-xs text-[#59544F] pt-3 border-t border-black/[0.06] flex flex-wrap items-center justify-between gap-2 font-normal">
                  {calcMode === 'replace_admin' ? (
                    <>
                      <span className="whitespace-nowrap">Экономия ФОТ: +{monthlySalarySavings.toLocaleString('ru-RU')}&nbsp;BYN</span>
                      <span className="whitespace-nowrap">Возврат лидов: +{lostRevenueByn.toLocaleString('ru-RU')}&nbsp;BYN</span>
                    </>
                  ) : (
                    <>
                      <span className="whitespace-nowrap">Возврат лидов: +{lostRevenueByn.toLocaleString('ru-RU')}&nbsp;BYN</span>
                      <span className="whitespace-nowrap">Расход Voxi: −{voxiCostByn}&nbsp;BYN</span>
                    </>
                  )}
                  <span className="font-medium text-black whitespace-nowrap">Окупаемость с 1–2 заявок</span>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
