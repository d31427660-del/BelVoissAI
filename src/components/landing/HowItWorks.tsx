import React from 'react';
import {
  Tuning2Icon,
  DocumentTextIcon,
  PhoneCallingRoundedIcon,
  ArrowRightIcon
} from '@solar-icons/react/bold-duotone';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardTitle } from '@/components/ui/card';

interface HowItWorksProps {
  onOpenAuth: () => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onOpenAuth }) => {
  const steps = [
    {
      num: '01',
      icon: <Tuning2Icon size={20} />,
      title: 'Выберите сферу и голос',
      desc: 'Автошкола, СТО, клиника или салон красоты. Выберите готовый отраслевой шаблон и голос (Анна или Максим) с чистой дикцией.',
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

  return (
    <section id="how-it-works" className="py-24 bg-transparent scroll-mt-20">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl space-y-3">
            <Badge
              variant="outline"
              className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border-slate-300 bg-white/80 text-slate-900 text-xs font-medium shadow-xs"
            >
              Быстрый запуск
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-[44px] text-slate-950 tracking-[-0.025em] font-light leading-tight">
              Настройка за 5 минут.{' '}
              <span className="text-slate-500 font-normal">
                Без участия разработчиков.
              </span>
            </h2>
          </div>

          <Button
            type="button"
            size="lg"
            onClick={onOpenAuth}
            className="self-start sm:self-auto rounded-full bg-slate-900 hover:bg-slate-800 text-white px-6 h-11 text-xs sm:text-sm font-medium transition-all shadow-sm gap-2 cursor-pointer"
          >
            <span>Перейти к конструктору</span>
            <ArrowRightIcon size={16} />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, idx) => (
            <Card
              key={idx}
              className="rounded-2xl border-slate-200/90 bg-white/80 hover:bg-white transition-all shadow-xs hover:shadow-md p-6 sm:p-7 flex flex-col justify-between space-y-6"
            >
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-900 border border-slate-200 flex items-center justify-center">
                    {step.icon}
                  </div>
                  <Badge variant="secondary" className="text-xs font-mono font-medium px-3 py-1 rounded-full">
                    {step.badge}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-mono text-slate-500 font-medium">
                    ШАГ {step.num}
                  </div>
                  <CardTitle className="text-lg font-semibold text-slate-950 tracking-tight">
                    {step.title}
                  </CardTitle>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

      </div>
    </section>
  );
};