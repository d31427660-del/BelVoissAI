import React from 'react';
import {
  PhoneCallingRoundedIcon,
  ServerSquareCloudIcon,
  DatabaseIcon,
  CalendarMarkIcon,
  CpuBoltIcon,
  WalletMoneyIcon,
  ArrowRightIcon
} from '@solar-icons/react/bold-duotone';

export const IntegrationsStrip: React.FC = () => {
  const integrations = [
    {
      name: 'МТС Беларусь',
      tag: 'sip.mts.by • Прямой SIP',
      badge: '99.98% SLA',
      accent: 'group-hover:text-black',
      dot: 'bg-emerald-500',
      icon: <PhoneCallingRoundedIcon size={18} />
    },
    {
      name: 'А1 Телеком',
      tag: 'sip.a1.by • Виртуальная АТС',
      badge: '480ms RTT',
      accent: 'group-hover:text-black',
      dot: 'bg-emerald-500',
      icon: <PhoneCallingRoundedIcon size={18} />
    },
    {
      name: 'Белтелеком IMS',
      tag: 'Код 017 и областные линии',
      badge: 'BYO-SIP',
      accent: 'group-hover:text-black',
      dot: 'bg-black',
      icon: <ServerSquareCloudIcon size={18} />
    },
    {
      name: 'YCLIENTS',
      tag: 'Сверка свободных слотов 24/7',
      badge: '2-Way Sync',
      accent: 'group-hover:text-black',
      dot: 'bg-black',
      icon: <CalendarMarkIcon size={18} />
    },
    {
      name: 'Bitrix24 CRM',
      tag: 'Автосоздание лидов и сделок',
      badge: 'REST API',
      accent: 'group-hover:text-black',
      dot: 'bg-black',
      icon: <DatabaseIcon size={18} />
    },
    {
      name: 'amoCRM',
      tag: 'Карточки звонков и записи',
      badge: 'Webhook',
      accent: 'group-hover:text-black',
      dot: 'bg-black',
      icon: <DatabaseIcon size={18} />
    },
    {
      name: '1С:Предприятие',
      tag: 'Интеграция с учетной базой',
      badge: 'JSON / HTTP',
      accent: 'group-hover:text-black',
      dot: 'bg-black',
      icon: <CpuBoltIcon size={18} />
    },
    {
      name: 'ЕРИП • bePaid',
      tag: 'Официальные расчеты в BYN',
      badge: 'УНП 193991846',
      accent: 'group-hover:text-black',
      dot: 'bg-emerald-500',
      icon: <WalletMoneyIcon size={18} />
    }
  ];

  return (
    <section id="integrations" className="py-14 bg-[#ffffff] border-y border-black/[0.06] scroll-mt-20">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        
        {/* ElevenLabs-Style Section Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-7">
          <h2 className="text-xs sm:text-sm font-semibold text-[#71717a] tracking-tight">
            Единый контур связи с телеком-операторами, платёжными системами и CRM Беларуси
          </h2>
          <a
            href="#features"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0a0a0c] hover:underline transition-all self-start sm:self-auto"
          >
            <span>Архитектура подключения за 5 минут</span>
            <ArrowRightIcon size={14} />
          </a>
        </div>

        {/* Architectural Hairline Grid with Liquid Glass (ElevenLabs 2-Row Matrix Style) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 rounded-[16px] border border-black/[0.07] bg-black/[0.05] gap-[1px] overflow-hidden shadow-xs">
          {integrations.map((item, idx) => (
            <div
              key={idx}
              className="group bg-white/85 hover:bg-white backdrop-blur-md p-5 sm:p-6 transition-all flex flex-col justify-between gap-4"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="w-9 h-9 rounded-[10px] liquid-glass-pill group-hover:bg-black group-hover:text-white text-[#777169] flex items-center justify-center transition-colors">
                  {item.icon}
                </div>
                <span className="font-mono text-[10px] font-normal px-2.5 py-0.5 rounded-full liquid-glass-pill text-[#777169] group-hover:bg-black group-hover:text-white transition-colors">
                  {item.badge}
                </span>
              </div>

              <div>
                <div className="text-sm font-bold text-[#0a0a0c] tracking-tight transition-colors">
                  {item.name}
                </div>
                <div className="text-xs text-[#71717a] flex items-center gap-1.5 mt-1">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.dot}`} />
                  <span className="truncate">{item.tag}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
