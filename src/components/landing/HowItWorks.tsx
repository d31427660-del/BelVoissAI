import React from 'react';
import { Tuning2Icon, DocumentTextIcon, PhoneCallingRoundedIcon, ArrowRightIcon } from '@solar-icons/react/bold-duotone';

interface HowItWorksProps {
  onOpenAuth: () => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onOpenAuth }) => {
  const steps = [
    {
      num: '01',
      icon: <Tuning2Icon size={20} />,
      iconStyle: 'bg-blue-50 text-[#2563eb] border-blue-100',
      badgeStyle: 'bg-blue-50 text-[#2563eb]',
      title: 'Выберите сферу и голос',
      desc: 'Автошкола, СТО, клиника или салон красоты. Выберите готовый шаблон и голос (Анна или Максим) с чистой дикцией.',
      badge: '1 минута'
    },
    {
      num: '02',
      icon: <DocumentTextIcon size={20} />,
      iconStyle: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      badgeStyle: 'bg-indigo-50 text-indigo-600',
      title: 'Добавьте услуги в BYN',
      desc: 'Укажите актуальные цены в белорусских рублях, адрес и расписание. Платформа автоматически сформирует системную инструкцию.',
      badge: '2 минуты'
    },
    {
      num: '03',
      icon: <PhoneCallingRoundedIcon size={20} />,
      iconStyle: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      badgeStyle: 'bg-emerald-50 text-emerald-600',
      title: 'Подключите линию МТС или А1',
      desc: 'Активируйте SIP-транк или переадресацию вызовов. Готовые карточки клиентов и записи звонков начнут поступать в Telegram и CRM.',
      badge: '2 минуты'
    }
  ];

  return (
    <section className="py-24 bg-slate-50/80">
      <div className="max-w-[1080px] mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="mb-14 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 text-[#2563eb] text-xs font-semibold">
            Быстрый запуск
          </div>
          <h2 className="apple-heading text-3xl sm:text-4xl lg:text-[44px] text-[#1d1d1f]">
            Настройка за 5 минут.{' '}
            <span className="bg-gradient-to-r from-[#2563eb] to-[#4f46e5] bg-clip-text text-transparent">
              Без участия разработчиков.
            </span>
          </h2>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="p-8 rounded-[40px] bg-[#ffffff] border border-slate-200/80 hover:border-blue-200 hover:shadow-apple-card transition-all flex flex-col justify-between space-y-6"
            >
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${step.iconStyle}`}>
                    {step.icon}
                  </div>
                  <span className={`text-xs font-semibold px-3.5 py-1.5 rounded-full ${step.badgeStyle}`}>
                    {step.badge}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-mono text-[#2563eb] font-semibold">
                    Шаг {step.num}
                  </div>
                  <h3 className="text-lg font-semibold text-[#1d1d1f] tracking-tight">
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <button
            onClick={onOpenAuth}
            className="inline-flex items-center gap-2 px-7 py-4 rounded-full bg-gradient-to-r from-[#2563eb] to-[#4f46e5] hover:from-[#1d4ed8] hover:to-[#4338ca] text-[#ffffff] text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
          >
            <span>Перейти к конструктору</span>
            <ArrowRightIcon size={16} />
          </button>
        </div>

      </div>
    </section>
  );
};
