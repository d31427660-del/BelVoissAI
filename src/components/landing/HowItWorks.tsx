import React, { useState } from 'react';
import {
  Tuning2Icon,
  DocumentTextIcon,
  PhoneCallingRoundedIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from '@solar-icons/react/bold-duotone';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardTitle } from '@/components/ui/card';
import { StepProgress } from '@/components/motion';

interface HowItWorksProps {
  onOpenAuth: () => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onOpenAuth }) => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      id: 'niche',
      num: '01',
      shortLabel: 'Ниша и голос',
      icon: <Tuning2Icon size={20} />,
      title: 'Выберите сферу и голос',
      desc: 'Автошкола, СТО, клиника или салон красоты. Выберите готовый отраслевой шаблон и голос (Анна или Максим) с чистой дикцией.',
      badge: '1 мин'
    },
    {
      id: 'pricing',
      num: '02',
      shortLabel: 'Прайс в BYN',
      icon: <DocumentTextIcon size={20} />,
      title: 'Добавьте услуги в BYN',
      desc: 'Укажите актуальные цены в белорусских рублях, адрес и расписание. Платформа автоматически сформирует строгую системную инструкцию.',
      badge: '2 мин'
    },
    {
      id: 'telephony',
      num: '03',
      shortLabel: 'Линия МТС / А1',
      icon: <PhoneCallingRoundedIcon size={20} />,
      title: 'Подключите линию МТС или А1',
      desc: 'Активируйте SIP-транк или переадресацию вызовов без смены оператора. Проверка соединения проходит за 15 секунд.',
      badge: '1 мин'
    },
    {
      id: 'live',
      num: '04',
      shortLabel: 'Приём заявок',
      icon: <CheckCircleIcon size={20} />,
      title: 'Получайте заявки 24/7',
      desc: 'Готовые карточки клиентов, записи звонков и бронирования в YCLIENTS/Bitrix24 начнут поступать в Telegram сразу после запуска.',
      badge: '1 мин'
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

        {/* Interactive 4-Step Progress Bar (DesignBookmark Motion: Step progress) */}
        <div className="mb-10 p-5 sm:p-6 rounded-2xl bg-white/85 border border-slate-200/90 shadow-xs">
          <StepProgress
            steps={steps.map((s) => ({
              id: s.id,
              label: s.shortLabel,
              duration: s.badge,
            }))}
            activeStep={activeStep}
            onSelectStep={setActiveStep}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((step, idx) => {
            const isSelected = idx === activeStep;
            return (
              <Card
                key={step.id}
                onClick={() => setActiveStep(idx)}
                className={`rounded-2xl transition-all p-6 flex flex-col justify-between space-y-6 cursor-pointer ${
                  isSelected
                    ? 'border-slate-900 bg-white shadow-md ring-1 ring-slate-900/10'
                    : 'border-slate-200/90 bg-white/80 hover:bg-white shadow-xs hover:shadow-md'
                }`}
              >
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-slate-950 text-white border-slate-950'
                          : 'bg-slate-100 text-slate-900 border-slate-200'
                      }`}
                    >
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
                    <CardTitle className="text-base sm:text-lg font-semibold text-slate-950 tracking-tight">
                      {step.title}
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

      </div>
    </section>
  );
};