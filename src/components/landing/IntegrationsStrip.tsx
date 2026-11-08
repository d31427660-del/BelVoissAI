import React from 'react';
import {
  PhoneCallingRoundedIcon,
  ServerSquareCloudIcon,
  DatabaseIcon,
  CalendarMarkIcon,
  CpuBoltIcon,
  WalletMoneyIcon,
  CheckCircleIcon,
  ShieldCheckIcon
} from '@solar-icons/react/bold-duotone';

export const IntegrationsStrip: React.FC = () => {
  const integrations = [
    {
      name: 'МТС Беларусь',
      tag: 'sip.mts.by',
      color: 'bg-rose-50 text-rose-600 border-rose-100',
      dot: 'bg-rose-500',
      icon: <PhoneCallingRoundedIcon size={18} />
    },
    {
      name: 'А1 Телеком',
      tag: 'sip.a1.by',
      color: 'bg-amber-50 text-amber-600 border-amber-100',
      dot: 'bg-amber-500',
      icon: <PhoneCallingRoundedIcon size={18} />
    },
    {
      name: 'Белтелеком IMS',
      tag: 'Код 017 / Регионы',
      color: 'bg-blue-50 text-[#2563eb] border-blue-100',
      dot: 'bg-[#2563eb]',
      icon: <ServerSquareCloudIcon size={18} />
    },
    {
      name: 'Bitrix24 CRM',
      tag: 'Лиды и карточки',
      color: 'bg-sky-50 text-sky-600 border-sky-100',
      dot: 'bg-sky-500',
      icon: <DatabaseIcon size={18} />
    },
    {
      name: 'amoCRM',
      tag: 'Автоворонки',
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      dot: 'bg-indigo-500',
      icon: <DatabaseIcon size={18} />
    },
    {
      name: 'YCLIENTS',
      tag: 'Онлайн-расписание',
      color: 'bg-violet-50 text-violet-600 border-violet-100',
      dot: 'bg-violet-500',
      icon: <CalendarMarkIcon size={18} />
    },
    {
      name: '1С:Предприятие',
      tag: 'Webhook / REST',
      color: 'bg-orange-50 text-orange-600 border-orange-100',
      dot: 'bg-orange-500',
      icon: <CpuBoltIcon size={18} />
    },
    {
      name: 'ЕРИП • Безнал РБ',
      tag: 'Расчеты в BYN',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      dot: 'bg-emerald-500',
      icon: <WalletMoneyIcon size={18} />
    }
  ];

  return (
    <section id="integrations" className="pb-16 pt-2 bg-[#ffffff] scroll-mt-20">
      <div className="max-w-[1080px] mx-auto px-4 sm:px-6">
        <div className="rounded-[44px] bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] border border-slate-200/80 p-6 sm:p-8 shadow-apple-card">
          
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircleIcon size={15} />
              </span>
              <span className="text-xs sm:text-sm font-semibold text-[#1d1d1f]">
                Прямая интеграция с телеком-операторами и CRM в Беларуси
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2563eb] bg-blue-50 border border-blue-100 px-3.5 py-1 rounded-full self-start sm:self-auto">
              <ShieldCheckIcon size={15} />
              <span>Подключение за 5 минут без смены номера</span>
            </div>
          </div>

          {/* 8 Integration Pills Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {integrations.map((item, idx) => (
              <div
                key={idx}
                className="group p-3.5 sm:p-4 rounded-[26px] bg-[#ffffff] border border-slate-200/70 hover:border-blue-300 hover:shadow-apple-sm transition-all flex items-center gap-3"
              >
                <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${item.color}`}>
                  {item.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs sm:text-sm font-semibold text-[#1d1d1f] flex items-center gap-1.5">
                    <span className="truncate">{item.name}</span>
                  </div>
                  <div className="text-[11px] text-[#86868b] flex items-center gap-1 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.dot}`} />
                    <span className="truncate">{item.tag}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};
