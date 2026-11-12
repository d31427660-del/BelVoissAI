import React from 'react';
import {
  Tuning2Icon,
  DocumentTextIcon,
  PhoneCallingRoundedIcon,
  ArrowRightIcon,
  ShieldCheckIcon
} from '@solar-icons/react/bold-duotone';

interface HowItWorksProps {
  onOpenAuth: () => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onOpenAuth }) => {
  const steps = [
    {
      num: '01',
      icon: <Tuning2Icon size={20} />,
      title: 'Выберите сферу и голос',
      desc: 'Автошкола, СТО, клиника или салон красоты. Выберите готовый шаблон и голос (Анна или Максим) с чистой дикцией и поддержкой A/B-приветствий.',
      badge: '1 минута'
    },
    {
      num: '02',
      icon: <DocumentTextIcon size={20} />,
      title: 'Добавьте услуги в BYN',
      desc: 'Укажите актуальные цены в белорусских рублях, адрес и расписание. Платформа автоматически сформирует строгую системную инструкцию.',
      badge: '2 минуты'
    },
    {
      num: '03',
      icon: <PhoneCallingRoundedIcon size={20} />,
      title: 'Подключите линию МТС или А1',
      desc: 'Активируйте SIP-транк или переадресацию вызовов. Готовые карточки клиентов и записи звонков начнут поступать в Telegram и CRM.',
      badge: '2 минуты'
    }
  ];

  const safetyPillars = [
    {
      title: 'Защита от галлюцинаций',
      desc: 'Ассистент озвучивает только те цены и услуги в BYN, которые зафиксированы в вашей базе знаний.'
    },
    {
      title: 'Защита от отклонений и регламенты',
      desc: 'Ассистент строго следует сценарию компании и при необходимости переводит звонок на дежурного сотрудника.'
    },
    {
      title: 'Закон РБ № 99‑З и локализация',
      desc: 'Обязательное уведомление о записи разговора и полная RLS-изоляция персональных данных клиентов.'
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-16">
        
        {/* PART 1: 3-Step Launch Architecture with Liquid Glass */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full liquid-glass-pill text-black text-xs font-normal">
                Быстрый запуск
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-[44px] text-black tracking-[-0.025em] font-light leading-tight">
                Настройка за 5 минут.{' '}
                <span className="text-[#59544F]">
                  Без участия разработчиков.
                </span>
              </h2>
            </div>

            <button
              type="button"
              onClick={onOpenAuth}
              className="self-start sm:self-auto inline-flex items-center justify-center gap-2 px-5 h-11 rounded-full liquid-glass-btn-primary text-white text-xs sm:text-sm font-normal active:scale-[0.98] transition-all cursor-pointer shadow-xs"
            >
              <span>Перейти к конструктору</span>
              <ArrowRightIcon size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="p-7 sm:p-8 rounded-[16px] liquid-glass-cream hover:bg-white/90 transition-all flex flex-col justify-between space-y-6"
              >
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-[10px] liquid-glass-pill flex items-center justify-center text-black">
                      {step.icon}
                    </div>
                    <span className="text-xs font-mono font-normal px-3 py-1 rounded-full liquid-glass-pill text-black">
                      {step.badge}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-mono text-[#777169] font-normal">
                      ШАГ {step.num}
                    </div>
                    <h3 className="text-lg font-medium text-black tracking-tight">
                      {step.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#59544F] leading-relaxed font-normal">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PART 2: ElevenLabs "Safety, built in" 3-Pillar Section with Liquid Glass */}
        <div className="rounded-[16px] liquid-glass-cream p-6 sm:p-8 lg:p-9">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/[0.075]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[10px] liquid-glass-pill text-black flex items-center justify-center">
                <ShieldCheckIcon size={22} />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-medium text-black tracking-tight">
                  Надёжность и безопасность, встроенные в ядро
                </h3>
                <p className="text-xs text-[#777169] font-normal">
                  Многоуровневый контроль ответов ИИ и соответствие законодательству Республики Беларусь
                </p>
              </div>
            </div>
            <span className="font-mono text-xs font-normal text-black liquid-glass-pill px-3.5 py-1 rounded-full self-start sm:self-auto">
              SLA 99.9% • Закон № 99‑З
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            {safetyPillars.map((pillar, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-black">
                  <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0" />
                  <span>{pillar.title}</span>
                </div>
                <p className="text-xs sm:text-sm text-[#59544F] leading-relaxed font-normal">
                  {pillar.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
