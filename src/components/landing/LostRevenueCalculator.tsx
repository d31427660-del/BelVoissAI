import React, { useState } from 'react';
import { CalculatorIcon, CheckCircleIcon, ArrowRightIcon } from '@solar-icons/react/bold-duotone';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { MarkerText } from '@/components/motion';

interface LostRevenueCalculatorProps {
  onOpenAuth: () => void;
}

export const LostRevenueCalculator: React.FC<LostRevenueCalculatorProps> = ({ onOpenAuth }) => {
  const [callsPerDay, setCallsPerDay] = useState<number>(25);
  const [missedPercent, setMissedPercent] = useState<number>(20);
  const [averageCheck, setAverageCheck] = useState<number>(65);

  // Calculations
  const callsPerMonth = callsPerDay * 30;
  const missedCallsPerMonth = Math.round(callsPerMonth * (missedPercent / 100));
  // Conservative estimate: 40% of missed calls would have converted into orders
  const lostOrders = Math.round(missedCallsPerMonth * 0.4);
  const lostRevenueMonth = lostOrders * averageCheck;
  // Estimate ~1.5 min per handled missed call, priced by actual Voxi tiers (0.35 / 0.40 / 0.45 BYN/min)
  const estimatedMinutesMonth = Math.max(1, Math.round(missedCallsPerMonth * 1.5));
  const ratePerMin = estimatedMinutesMonth >= 1000 ? 0.35 : estimatedMinutesMonth >= 300 ? 0.40 : 0.45;
  const voxiCostMonth = Math.max(5, Math.round(estimatedMinutesMonth * ratePerMin));
  const netProfitRetained = Math.max(0, lostRevenueMonth - voxiCostMonth);
  const paybackCalls = averageCheck > 0 ? Math.max(1, Math.ceil(voxiCostMonth / averageCheck)) : 1;

  return (
    <section id="calculator" className="py-20 bg-transparent border-t border-black/[0.06] scroll-mt-20">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        
        <Card className="rounded-3xl border-slate-200/90 bg-white/90 shadow-lg p-6 sm:p-10 lg:p-12 relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left: Sliders & Controls */}
            <div className="lg:col-span-7 space-y-7">
              <div className="space-y-2">
                <Badge
                  variant="outline"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-slate-300 bg-white text-slate-900 text-xs font-medium"
                >
                  <CalculatorIcon size={14} className="text-emerald-600" />
                  <span>Калькулятор потерь выручки</span>
                </Badge>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-light text-slate-950 tracking-tight">
                  Сколько денег теряет бизнес на{' '}
                  <MarkerText colorClass="bg-amber-300/55" className="font-normal text-slate-950">
                    пропущенных звонках?
                  </MarkerText>
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Вечером после 19:00, в обеденный перерыв и на выходных клиенты уходят к конкурентам, если не дозваниваются с первой попытки.
                </p>
              </div>

              {/* Sliders */}
              <div className="space-y-5">
                {/* Slider 1: Calls per day */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-700">Входящих звонков в день:</span>
                    <span className="font-mono font-semibold text-slate-950 text-sm bg-slate-100 px-2.5 py-0.5 rounded-md">
                      {callsPerDay} звонков
                    </span>
                  </div>
                  <input
                    type="range"
                    aria-label="Входящих звонков в день"
                    min="5"
                    max="150"
                    step="5"
                    value={callsPerDay}
                    onChange={(e) => setCallsPerDay(Number(e.target.value))}
                    className="w-full accent-slate-950 cursor-pointer h-2 bg-slate-200 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>5</span>
                    <span>50</span>
                    <span>100</span>
                    <span>150</span>
                  </div>
                </div>

                {/* Slider 2: Missed % */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-700">Процент неотвеченных вызовов (вечер, занято):</span>
                    <span className="font-mono font-semibold text-rose-600 text-sm bg-rose-50 px-2.5 py-0.5 rounded-md">
                      {missedPercent}%
                    </span>
                  </div>
                  <input
                    type="range"
                    aria-label="Процент неотвеченных вызовов"
                    min="5"
                    max="50"
                    step="5"
                    value={missedPercent}
                    onChange={(e) => setMissedPercent(Number(e.target.value))}
                    className="w-full accent-rose-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>5%</span>
                    <span>20% (среднее по РБ)</span>
                    <span>50%</span>
                  </div>
                </div>

                {/* Slider 3: Average check */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-700">Средний чек вашей услуги в BYN:</span>
                    <span className="font-mono font-semibold text-slate-950 text-sm bg-slate-100 px-2.5 py-0.5 rounded-md">
                      {averageCheck} BYN
                    </span>
                  </div>
                  <input
                    type="range"
                    aria-label="Средний чек услуги в BYN"
                    min="15"
                    max="500"
                    step="5"
                    value={averageCheck}
                    onChange={(e) => setAverageCheck(Number(e.target.value))}
                    className="w-full accent-slate-950 cursor-pointer h-2 bg-slate-200 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>15 BYN</span>
                    <span>150 BYN</span>
                    <span>300 BYN</span>
                    <span>500 BYN</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Revenue Loss Summary Box */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl bg-neutral-950 text-white p-6 sm:p-8 space-y-6 shadow-xl border border-neutral-800">
                <div className="space-y-1">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                    Расчётная потеря выручки
                  </span>
                  <div className="text-3xl sm:text-4xl font-extrabold text-rose-400 font-mono">
                    <MarkerText colorClass="bg-rose-500/25">
                      ~{lostRevenueMonth.toLocaleString('ru-RU')} BYN
                    </MarkerText>
                  </div>
                  <p className="text-xs text-neutral-400">
                    каждый месяц из-за {missedCallsPerMonth} пропущенных звонков
                  </p>
                </div>

                <div className="space-y-3 border-y border-neutral-800 py-4 text-xs text-zinc-300">
                  <div className="flex justify-between items-center">
                    <span>Упущенных заказов в месяц:</span>
                    <span className="font-mono font-semibold text-white">~{lostOrders} клиентов</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Стоимость Voxi в месяц:</span>
                    <span className="font-mono font-semibold text-emerald-400">~{voxiCostMonth} BYN</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-semibold pt-1 border-t border-neutral-800/80 gap-2">
                    <span className="text-white">Возврат в кассу с Voxi:</span>
                    <MarkerText colorClass="bg-emerald-500/25" className="font-mono text-emerald-400 whitespace-nowrap shrink-0">
                      +{netProfitRetained.toLocaleString('ru-RU')} BYN/мес
                    </MarkerText>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-zinc-300">
                    <CheckCircleIcon size={16} className="text-emerald-400 shrink-0" />
                    <span>
                      {netProfitRetained > 0
                        ? paybackCalls === 1
                          ? `Окупаемость платформы — уже с первого спасённого заказа (~${estimatedMinutesMonth} мин/мес)`
                          : `Окупаемость платформы — с первых ${paybackCalls} спасённых заказов (~${estimatedMinutesMonth} мин/мес)`
                        : `На малом объёме (~${estimatedMinutesMonth} мин/мес) выгоднее поминутная оплата без абонплаты`}
                    </span>
                  </div>

                  <Button
                    type="button"
                    size="lg"
                    onClick={onOpenAuth}
                    className="w-full rounded-full bg-white hover:bg-neutral-100 text-slate-950 text-xs font-semibold h-11 transition-all cursor-pointer shadow-md gap-2"
                  >
                    <span>Сохранить эти звонки бесплатно</span>
                    <ArrowRightIcon size={16} />
                  </Button>
                </div>
              </div>
            </div>

          </div>
        </Card>

      </div>
    </section>
  );
};