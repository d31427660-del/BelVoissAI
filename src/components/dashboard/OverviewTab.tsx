import React, { useState } from 'react';
import { 
  PhoneCallingRoundedIcon as PhoneCall, 
  UsersGroupRoundedIcon as Users, 
  WalletMoneyIcon as Wallet, 
  GraphNewUpIcon as TrendingUp, 
  MagicWand3Icon as Sparkles, 
  ArrowRightIcon as ArrowRight, 
  SoundwaveCircleIcon as Radio,
  ClockCircleIcon as Clock,
  CalendarMinimalisticIcon as Calendar,
  ShieldCheckIcon as ShieldCheck,
  CheckCircleIcon as CheckCircle2
} from '@solar-icons/react/bold-duotone';
import { AgentConfig, CallLog, SipSettings, TelegramSettings, UserSession } from '../../types';

interface OverviewTabProps {
  user: UserSession;
  agent: AgentConfig;
  callLogs: CallLog[];
  sipSettings: SipSettings;
  telegramSettings: TelegramSettings;
  onNavigateTab: (tab: 'overview' | 'agent' | 'integrations' | 'calls') => void;
  onOpenTopUp?: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  user,
  agent,
  callLogs,
  sipSettings,
  telegramSettings,
  onNavigateTab,
  onOpenTopUp
}) => {
  const [period, setPeriod] = useState<'7d' | '30d'>('7d');
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  const totalCalls = callLogs.length || 142;
  const leadsCount = 89;
  const spentByn = Math.round(user.spentMinutes * user.ratePerMinute);
  const fotSavingsByn = 1800 - spentByn;
  const potentialRevenueByn = 18950;

  const nicheCalls = callLogs.filter(c => !c.niche || c.niche === agent.niche);
  const recentCalls = (nicheCalls.length > 0 ? nicheCalls : callLogs).slice(0, 3);

  // 7-day hourly and daily activity metrics
  const chartData7d = [
    { label: 'Пн', calls: 18, leads: 11, afterHours: 8 },
    { label: 'Вт', calls: 24, leads: 16, afterHours: 12 },
    { label: 'Ср', calls: 21, leads: 14, afterHours: 9 },
    { label: 'Чт', calls: 29, leads: 19, afterHours: 14 },
    { label: 'Пт', calls: 34, leads: 22, afterHours: 18 },
    { label: 'Сб', calls: 22, leads: 15, afterHours: 20 },
    { label: 'Вс', calls: 16, leads: 10, afterHours: 15 },
  ];

  const chartData30d = [
    { label: 'Нед 1', calls: 112, leads: 74, afterHours: 54 },
    { label: 'Нед 2', calls: 138, leads: 88, afterHours: 66 },
    { label: 'Нед 3', calls: 129, leads: 82, afterHours: 61 },
    { label: 'Нед 4', calls: 154, leads: 98, afterHours: 79 },
  ];

  const currentChart = period === '7d' ? chartData7d : chartData30d;
  const maxCalls = Math.max(...currentChart.map(d => d.calls));

  return (
    <div className="space-y-6">
      
      {/* 4 Compact KPI Cards with Deltas (Linear Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Принято вызовов */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-medium">Принято вызовов</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <PhoneCall className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
            {totalCalls} <span className="text-xs font-normal text-slate-400">звонков ({user.spentMinutes || 55} мин)</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +24% за неделю
            </span>
            <span className="text-slate-400">0 пропущенных</span>
          </div>
        </div>

        {/* Card 2: Квалифицировано лидов */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-medium">Квалифицировано лидов</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
            {leadsCount} <span className="text-xs font-normal text-slate-400">клиентов</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-emerald-700 font-semibold">
              Конверсия 62.7%
            </span>
            <span className="text-slate-400">В базу CRM</span>
          </div>
        </div>

        {/* Card 3: Экономия на ФОТ */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-medium">Экономия на ФОТ</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
            {fotSavingsByn.toLocaleString('ru-RU')} <span className="text-xs font-normal text-slate-400 font-bold">BYN/мес</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-indigo-700 font-semibold">
              vs 1 800 BYN в штате
            </span>
            <span className="text-slate-400">минуты: {spentByn} BYN</span>
          </div>
        </div>

        {/* Card 4: Потенциал выручки */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-medium">Выручка по лидам</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
            {potentialRevenueByn.toLocaleString('ru-RU')} <span className="text-xs font-normal text-slate-400 font-bold">BYN</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-emerald-700 font-semibold">
              Ср. чек ~{agent.niche === 'driving_school' ? 1050 : 280} BYN
            </span>
            <span className="text-slate-400">в воронке</span>
          </div>
        </div>

      </div>

      {/* Visual Analytics Chart: 24/7 Call Volume & After-Hours Capture */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-5">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Нагрузка и перехват ночных / вечерних вызовов (24/7)
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Авто-прием 0.5с
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Синяя шкала — всего вызовов, фиолетовая полоса — вызовы после 18:00 и в выходные дни (сохранённая выручка)
            </p>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100/80 p-1 rounded-xl">
            <button
              onClick={() => setPeriod('7d')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                period === '7d' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 дней
            </button>
            <button
              onClick={() => setPeriod('30d')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                period === '30d' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              30 дней
            </button>
          </div>
        </div>

        {/* Visual Bar Chart */}
        <div className="pt-2">
          <div className="h-44 flex items-end gap-3 sm:gap-6 border-b border-slate-100 pb-2">
            {currentChart.map((item, idx) => {
              const heightPercent = Math.round((item.calls / maxCalls) * 100);
              const afterHoursPercent = Math.round((item.afterHours / item.calls) * 100);
              const isHovered = hoveredBar === idx;

              return (
                <div 
                  key={idx} 
                  className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group cursor-pointer relative"
                  onMouseEnter={() => setHoveredBar(idx)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  {/* Hover tooltip */}
                  {isHovered && (
                    <div className="absolute -top-14 z-20 p-2 rounded-lg bg-slate-900 text-white text-[11px] font-mono shadow-xl whitespace-nowrap animate-in fade-in">
                      <div className="font-bold">{item.label}: {item.calls} звонков</div>
                      <div className="text-emerald-400">Лидов: {item.leads} | Ночь/вечер: {item.afterHours}</div>
                    </div>
                  )}

                  <span className="text-[10px] text-slate-400 font-mono">
                    {item.calls}
                  </span>

                  {/* Dual Bar */}
                  <div className="w-full max-w-[48px] rounded-t-xl bg-blue-100 overflow-hidden relative flex flex-col justify-end" style={{ height: `${heightPercent}%` }}>
                    <div 
                      className="w-full bg-gradient-to-t from-blue-600 to-indigo-600 transition-all duration-300 group-hover:brightness-110" 
                      style={{ height: '100%' }}
                    >
                      {/* After hours striped / highlight overlay */}
                      <div 
                        className="w-full bg-indigo-400/50" 
                        style={{ height: `${afterHoursPercent}%` }}
                        title={`${afterHoursPercent}% звонков после окончания рабочего дня`}
                      />
                    </div>
                  </div>

                  <span className="text-xs font-semibold text-slate-700">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-[11px] text-slate-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-blue-600"></span>
                <span>Дневные звонки (08:00 - 18:00)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-indigo-400"></span>
                <span>Вечер и выходные (Перехвачено ИИ)</span>
              </span>
            </div>

            <div className="font-semibold text-slate-800">
              ⚡ 51% звонков обработано вне рабочего времени
            </div>
          </div>
        </div>

      </div>

      {/* 2-Columns: Recent Hot Leads & Infrastructure Health */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left: Recent captured leads */}
        <div className="lg:col-span-8 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-600" />
              <span>Последние квалифицированные заявки</span>
            </h4>
            <button
              onClick={() => onNavigateTab('calls')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>Открыть CRM-таблицу</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {recentCalls.map((call) => (
              <div
                key={call.id}
                onClick={() => onNavigateTab('calls')}
                className="p-3 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50/70 transition-all flex items-center justify-between gap-3 cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                    {call.callerName ? call.callerName.charAt(0) : '—'}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                      {call.callerName || 'Неизвестный клиент'}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {call.capturedData?.service || call.summary}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-mono text-xs font-bold text-emerald-700">
                    {call.dealValueByn > 0 ? `+${call.dealValueByn} BYN` : 'Консультация'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {call.timestamp.slice(11)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Belarus Infrastructure Health */}
        <div className="lg:col-span-4 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Статус каналов связи</span>
            </h4>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              SLA 99.9%
            </span>
          </div>

          <div className="space-y-3 text-xs">
            
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <div>
                  <strong className="block text-slate-900 font-semibold">МТС SIP Шлюз</strong>
                  <span className="text-[10px] text-slate-500 font-mono">{sipSettings.callerId}</span>
                </div>
              </div>
              <span className="text-[11px] font-mono font-semibold text-slate-700">14 мс</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <div>
                  <strong className="block text-slate-900 font-semibold">Telegram Lead Bot</strong>
                  <span className="text-[10px] text-slate-500 font-mono">@voxi_bot</span>
                </div>
              </div>
              <span className="text-[11px] font-mono font-semibold text-emerald-700">Online</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <div>
                  <strong className="block text-slate-900 font-semibold">Дата-центр beCloud</strong>
                  <span className="text-[10px] text-slate-500">Минск, пер. Первомайский</span>
                </div>
              </div>
              <span className="text-[11px] font-mono font-semibold text-emerald-700">Закон 99-З</span>
            </div>

          </div>

          <button
            onClick={() => onNavigateTab('integrations')}
            className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>Настроить телефонию и CRM</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

    </div>
  );
};
