import React, { useState } from 'react';
import { CheckCircleIcon, ArrowRightIcon } from '@solar-icons/react/bold-duotone';

interface RoiCalculatorProps {
  onOpenAuth: () => void;
}

export const RoiCalculator: React.FC<RoiCalculatorProps> = ({ onOpenAuth }) => {
  const [missedCalls, setMissedCalls] = useState<number>(45);
  const [avgCheck, setAvgCheck] = useState<number>(250);

  const conversionRate = 0.35;
  const lostCustomers = Math.round(missedCalls * conversionRate);
  const lostRevenueByn = Math.round(lostCustomers * avgCheck);

  const humanAdminSalaryByn = 1800;
  // Средний диалог длится около 1.5 минут
  const estimatedDialogueMinutes = Math.round(missedCalls * 1.5);
  // Расчет по базовой ставке (0.45 BYN/мин)
  const voxiCostByn = Math.max(15, Math.round(estimatedDialogueMinutes * 0.45));

  const monthlySalarySavings = humanAdminSalaryByn - voxiCostByn;
  const totalMonthlyGainByn = monthlySalarySavings + lostRevenueByn;
  const yearlyGainByn = totalMonthlyGainByn * 12;
  const timesCheaper = Math.round(humanAdminSalaryByn / voxiCostByn);

  const triggerConfetti = async () => {
    try {
      const { default: confetti } = await import('canvas-confetti');
      confetti({
        particleCount: 65,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#2563eb', '#10b981', '#4f46e5', '#f59e0b']
      });
    } catch {
      // ignore
    }
  };

  return (
    <section id="calculator" className="py-24 bg-[#ffffff]">
      <div className="max-w-[1080px] mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="mb-14 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold">
            Экономика бизнеса
          </div>
          <h2 className="apple-heading text-3xl sm:text-4xl lg:text-[44px] text-[#1d1d1f]">
            Расчет окупаемости в BYN.{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-[#2563eb] bg-clip-text text-transparent">
              Прозрачная выгода с первого месяца.
            </span>
          </h2>
        </div>

        {/* Main Calculator Bento Card (Ultra-Rounded) */}
        <div className="rounded-[44px] sm:rounded-[52px] bg-gradient-to-b from-slate-50 to-blue-50/30 border border-slate-200/80 p-7 sm:p-10">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Sliders */}
            <div className="lg:col-span-6 space-y-5">
              
              {/* Slider 1 */}
              <div className="space-y-3 p-6 rounded-[32px] bg-[#ffffff] border border-slate-200/70">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-[#1d1d1f]">
                    Пропущенные звонки в месяц
                  </label>
                  <span className="text-sm font-bold text-[#2563eb] bg-blue-50 px-3 py-1 rounded-full whitespace-nowrap">
                    {missedCalls} звонков
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="300"
                  step="5"
                  value={missedCalls}
                  onChange={(e) => setMissedCalls(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#2563eb]"
                />
                <div className="flex justify-between text-[11px] text-[#86868b]">
                  <span>5</span>
                  <span>150 (средний поток)</span>
                  <span>300</span>
                </div>
              </div>

              {/* Slider 2 */}
              <div className="space-y-3 p-6 rounded-[32px] bg-[#ffffff] border border-slate-200/70">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-[#1d1d1f]">
                    Средний чек услуги
                  </label>
                  <span className="text-sm font-bold text-[#2563eb] bg-blue-50 px-3 py-1 rounded-full whitespace-nowrap">
                    {avgCheck} BYN
                  </span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="1500"
                  step="10"
                  value={avgCheck}
                  onChange={(e) => setAvgCheck(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#2563eb]"
                />
                <div className="flex justify-between text-[11px] text-[#86868b]">
                  <span>30 BYN</span>
                  <span>750 BYN</span>
                  <span>1 500 BYN</span>
                </div>
              </div>

              {/* Lost Revenue Summary */}
              <div className="p-6 rounded-[32px] bg-rose-50/60 border border-rose-100 space-y-1.5">
                <div className="text-xs font-semibold text-rose-600">
                  Потери на необработанных вызовах
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-rose-600 tracking-tight">
                  ~{lostRevenueByn.toLocaleString('ru-RU')} BYN / мес
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Около {lostCustomers} потенциальных клиентов ежемесячно уходят к конкурентам, если не получают ответа с первого гудка.
                </p>
              </div>

            </div>

            {/* Right Column: Comparison */}
            <div className="lg:col-span-6 space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Human Admin */}
                <div className="p-6 rounded-[32px] bg-[#ffffff] border border-slate-200/70 space-y-4">
                  <div className="text-xs font-medium text-[#86868b]">
                    Штатный администратор
                  </div>
                  <div>
                    <div className="text-2xl font-semibold text-[#1d1d1f] tracking-tight">
                      1 800 <span className="text-xs font-normal text-[#86868b]">BYN/мес</span>
                    </div>
                    <div className="text-[11px] text-[#86868b] mt-0.5">
                      + отчисления ФСЗН (~612 BYN)
                    </div>
                  </div>
                  <ul className="text-xs text-[#86868b] space-y-2 border-t border-slate-100 pt-3.5">
                    <li>— График только 9:00–18:00</li>
                    <li>— Выходные и ночное время</li>
                    <li>— Больничные и отпуска</li>
                    <li>— Ожидание при занятой линии</li>
                  </ul>
                </div>

                {/* Voxi.by */}
                <div className="p-6 rounded-[32px] bg-gradient-to-br from-[#1e3a8a] via-[#2563eb] to-[#4f46e5] text-[#ffffff] shadow-lg shadow-blue-500/20 space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#ffffff]">Voxi.by</span>
                    <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-400/25 text-emerald-200 border border-emerald-300/30">
                      В {timesCheaper} раз выгоднее
                    </span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[#ffffff] tracking-tight whitespace-nowrap">
                      ~{voxiCostByn} <span className="text-xs font-normal text-blue-100">BYN/мес</span>
                    </div>
                    <div className="text-[11px] text-blue-100 mt-0.5">
                      Только за {estimatedDialogueMinutes} мин разговора (0.45 BYN/мин)
                    </div>
                  </div>
                  <ul className="text-xs text-[#ffffff] space-y-2 border-t border-white/15 pt-3.5">
                    <li className="flex items-center gap-2">
                      <CheckCircleIcon size={15} className="text-emerald-300 shrink-0" />
                      <span>0 BYN абонентская плата</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircleIcon size={15} className="text-emerald-300 shrink-0" />
                      <span>Минуты не сгорают в конце месяца</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircleIcon size={15} className="text-emerald-300 shrink-0" />
                      <span>Работает 24/7 без выходных</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircleIcon size={15} className="text-emerald-300 shrink-0" />
                      <span>Заявки сразу в YCLIENTS и Telegram</span>
                    </li>
                  </ul>
                </div>

              </div>

              {/* Net Benefit Card */}
              <div className="p-6 rounded-[32px] bg-[#ffffff] border border-emerald-200 shadow-apple-card space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-emerald-600">
                    Суммарный финансовый эффект
                  </span>
                  <button 
                    onClick={triggerConfetti}
                    className="text-xs text-[#2563eb] hover:opacity-70 font-semibold underline whitespace-nowrap"
                  >
                    Проверить расчет
                  </button>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-3xl font-bold text-emerald-600 tracking-tight whitespace-nowrap">
                      +{totalMonthlyGainByn.toLocaleString('ru-RU')} <span className="text-base font-medium text-slate-500">BYN / мес</span>
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      ~{yearlyGainByn.toLocaleString('ru-RU')}&nbsp;BYN сохраненного бюджета и выручки в год
                    </div>
                  </div>

                  <button
                    onClick={onOpenAuth}
                    className="px-6 py-3.5 rounded-full bg-gradient-to-r from-[#2563eb] to-[#4f46e5] hover:from-[#1d4ed8] hover:to-[#4338ca] text-[#ffffff] font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 transition-all shrink-0 whitespace-nowrap"
                  >
                    <span>Подключить</span>
                    <ArrowRightIcon size={15} />
                  </button>
                </div>

                <div className="text-xs text-slate-600 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <span className="whitespace-nowrap">Экономия ФОТ: +{monthlySalarySavings}&nbsp;BYN</span>
                  <span className="whitespace-nowrap">Возврат лидов: +{lostRevenueByn.toLocaleString('ru-RU')}&nbsp;BYN</span>
                  <span className="font-semibold text-emerald-600 whitespace-nowrap">Окупаемость за 3 дня</span>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
