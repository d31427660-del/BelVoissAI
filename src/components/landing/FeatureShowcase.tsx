import React from 'react';
import {
  PhoneCallingRoundedIcon,
  CpuBoltIcon,
  BoltCircleIcon,
  ShieldCheckIcon,
  ChatRoundDotsIcon,
  DatabaseIcon
} from '@solar-icons/react/bold-duotone';

export const FeatureShowcase: React.FC = () => {
  const features = [
    {
      icon: <PhoneCallingRoundedIcon size={22} />,
      iconStyle: 'bg-blue-50 text-[#2563eb] border-blue-100',
      title: 'SIP-транк с МТС и А1',
      description: 'Прямое подключение любых телефонных номеров Беларуси: мобильные МТС (+375 29/33), А1 (+375 29/44), городские линии Белтелеком и UniTalk.'
    },
    {
      icon: <BoltCircleIcon size={22} />,
      iconStyle: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      title: 'Отклик за 0.5 секунды',
      description: 'Низкая задержка обработки звука на базе Vapi.ai и Deepgram Nova-2 обеспечивает темп живого телефонного разговора без искусственных пауз.'
    },
    {
      icon: <CpuBoltIcon size={22} />,
      iconStyle: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      title: 'Автогенерация инструкции',
      description: 'Достаточно выбрать сферу бизнеса, указать прайс-лист в BYN и адрес — система автоматически сформирует точную инструкцию для языковой модели.'
    },
    {
      icon: <ChatRoundDotsIcon size={22} />,
      iconStyle: 'bg-sky-50 text-sky-600 border-sky-100',
      title: 'Отчеты в Telegram за 1 секунду',
      description: 'Сразу после завершения вызова в рабочий чат поступает структурированная карточка с именем клиента, телефоном, выбранной услугой и записью разговора.'
    },
    {
      icon: <DatabaseIcon size={22} />,
      iconStyle: 'bg-violet-50 text-violet-600 border-violet-100',
      title: 'Интеграция с Bitrix24 и amoCRM',
      description: 'Автоматическое создание карточек сделок, контактов и прикрепление расшифровки диалога через стандартные JSON-вебхуки.'
    },
    {
      icon: <ShieldCheckIcon size={22} />,
      iconStyle: 'bg-teal-50 text-teal-600 border-teal-100',
      title: 'Защита данных (Закон РБ №\u00A099‑З)',
      description: 'Изоляция данных на уровне компании с использованием политик Row Level Security (RLS) и соблюдение требований законодательства Республики Беларусь.'
    }
  ];

  return (
    <section id="features" className="py-24 bg-slate-50/80 relative">
      <div id="integrations" className="absolute -top-16" aria-hidden="true" />
      <div className="max-w-[1080px] mx-auto px-4 sm:px-6">
        
        <div className="mb-14 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 text-[#2563eb] text-xs font-semibold">
            Архитектура и интеграции
          </div>
          <h2 className="apple-heading text-3xl sm:text-4xl lg:text-[44px] text-[#1d1d1f]">
            Создано для Беларуси.{' '}
            <span className="bg-gradient-to-r from-[#2563eb] to-[#4f46e5] bg-clip-text text-transparent">
              Готово к высоким нагрузкам.
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((item, index) => (
            <div
              key={index}
              className="p-8 rounded-[40px] bg-[#ffffff] border border-slate-200/80 hover:border-blue-200 hover:shadow-apple-card transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-5 ${item.iconStyle}`}>
                  {item.icon}
                </div>
                <h3 className="text-base font-semibold text-[#1d1d1f] tracking-tight mb-2">
                  {item.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
