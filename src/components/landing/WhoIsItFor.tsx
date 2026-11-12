import React, { useState, useEffect } from 'react';
import { 
  WheelAngleIcon, 
  GarageIcon, 
  StethoscopeIcon, 
  ScissorsIcon, 
  CheckCircleIcon, 
  VolumeLoudIcon, 
  ArrowRightIcon
} from '@solar-icons/react/bold-duotone';
import { NICHE_TEMPLATES } from '../../lib/mockData';
import { BusinessNiche } from '../../types';
import { VoiceSimulator } from '../../lib/speechSynth';

interface WhoIsItForProps {
  onSelectNiche: (niche: BusinessNiche) => void;
}

export const WhoIsItFor: React.FC<WhoIsItForProps> = ({ onSelectNiche }) => {
  const [activeTab, setActiveTab] = useState<BusinessNiche>('driving_school');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    return () => {
      VoiceSimulator.stop();
    };
  }, []);

  const tabs: Array<{ id: BusinessNiche; label: string; icon: React.ReactNode }> = [
    {
      id: 'driving_school',
      label: 'Автошколы',
      icon: <WheelAngleIcon size={15} />
    },
    {
      id: 'auto_service',
      label: 'Автосервисы (СТО)',
      icon: <GarageIcon size={15} />
    },
    {
      id: 'medical_clinic',
      label: 'Стоматологии и клиники',
      icon: <StethoscopeIcon size={15} />
    },
    {
      id: 'beauty_salon',
      label: 'Салоны красоты',
      icon: <ScissorsIcon size={15} />
    }
  ];

  const currentTemplate = NICHE_TEMPLATES[activeTab];

  const handlePlaySample = () => {
    if (isPlayingAudio) {
      VoiceSimulator.stop();
      setIsPlayingAudio(false);
    } else {
      VoiceSimulator.speak(
        currentTemplate.firstMessage,
        activeTab === 'auto_service' ? 'maxim' : 'anna',
        () => setIsPlayingAudio(true),
        () => setIsPlayingAudio(false)
      );
    }
  };

  const nicheBenefits: Record<BusinessNiche, {
    title: string;
    description: string;
    problemsSolved: string[];
    avgCheck: string;
    monthlyLeads: string;
    roi: string;
  }> = {
    driving_school: {
      title: 'Автоматическая запись на категорию B и пересдачи',
      description: 'Курсанты часто звонят после 19:00 и в выходные, когда офис закрыт. Ассистент консультирует по расписанию утренних и вечерних групп, условиям рассрочки в 4 этапа, автодрому и медкомиссии, сразу записывая курсанта на вводный урок.',
      problemsSolved: [
        'Прием вечерних звонков от работающих курсантов',
        'Ответы на типовые вопросы про стоимость, топливо и справки',
        'Отправка перечня документов для медкомиссии в SMS и Telegram',
        'Напоминание о практических занятиях и зачетах'
      ],
      avgCheck: '1 050 BYN',
      monthlyLeads: '30–65 записей',
      roi: 'С 1-й записи'
    },
    auto_service: {
      title: 'Запись на ТО, ремонт подвески и шиномонтаж',
      description: 'Во время сезонной загрузки мастера заняты и не успевают отвечать на звонки. Voxi уточняет марку автомобиля, год выпуска и характер неисправности, бронируя свободный подъемник.',
      problemsSolved: [
        'Разгрузка мастеров-приемщиков от рутинных консультаций',
        'Предварительный расчет стоимости работ по прайс-листу',
        'Фиксация модели авто и VIN-номера для подбора запчастей',
        'Автоматическое уведомление о готовности автомобиля'
      ],
      avgCheck: '280 BYN',
      monthlyLeads: '90–140 записей',
      roi: 'За 3 дня'
    },
    medical_clinic: {
      title: 'Запись к профильным врачам и прием с острой болью',
      description: 'Пациент с зубной болью не ждет на линии. Voxi отвечает за 0.5 секунды, определяет срочность обращения, ориентирует по ценам на лечение и КТ-диагностику и подбирает ближайшее окно.',
      problemsSolved: [
        'Мгновенная маршрутизация обращений с острой болью 24/7',
        'Консультация по страховым полисам (Белгосстрах, ТАСК)',
        'Рекомендации по подготовке к приему и диагностике',
        'Снижение процента неявок за счет подтверждения визита'
      ],
      avgCheck: '210 BYN',
      monthlyLeads: '80–160 пациентов',
      roi: 'За 2 дня'
    },
    beauty_salon: {
      title: 'Круглосуточная запись к мастерам за 60 секунд',
      description: 'Клиенты записываются поздно вечером или в выходные дни. Ассистент помогает выбрать услугу и мастера, напоминает о визите и предлагает комплексное обслуживание.',
      problemsSolved: [
        'Подбор удобного окна в расписании мастеров',
        'Непрерывная запись в нерабочее время и праздники',
        'Реактивация постоянных клиентов',
        'Сбор обратной связи после посещения'
      ],
      avgCheck: '95 BYN',
      monthlyLeads: '120–220 записей',
      roi: 'За 4 дня'
    },
    custom: {
      title: 'Индивидуальная настройка под ваш бизнес',
      description: 'Адаптация сценария под сферу услуг, доставку или B2B-компанию.',
      problemsSolved: ['Снижение нагрузки на ФОТ', 'Прием вызовов 24/7', 'Передача лидов в CRM'],
      avgCheck: '150 BYN',
      monthlyLeads: '50+ лидов',
      roi: 'За 3 дня'
    }
  };

  const currentBenefit = nicheBenefits[activeTab];

  return (
    <section id="who" className="py-24 bg-white scroll-mt-20">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        
        {/* ElevenLabs-Style Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#F5F3F1] text-black border border-black/[0.075] text-xs font-normal">
              Отраслевые решения РБ
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-[44px] text-black tracking-[-0.025em] font-light leading-tight">
              Готовые базы знаний.{' '}
              <span className="text-[#59544F]">
                Адаптированы под рынок Беларуси.
              </span>
            </h2>
          </div>

          {/* Segmented Pill Bar (ElevenLabs style) */}
          <div
            role="tablist"
            aria-label="Отрасли бизнеса"
            className="inline-flex items-center gap-1 bg-[#F5F3F1] p-1 rounded-full border border-black/[0.075] overflow-x-auto voxi-scroll self-start lg:self-auto"
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => {
                    setActiveTab(tab.id);
                    VoiceSimulator.stop();
                    setIsPlayingAudio(false);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-normal transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-white text-black shadow-[0_0_0_0.5px_rgba(0,0,0,0.125),0_1px_1px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.04)]'
                      : 'text-[#59544F] hover:text-black'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ElevenLabs Bento Container (Exact 16px radius + Liquid Glass Cream) */}
        <div className="rounded-[16px] liquid-glass-cream p-6 sm:p-8 lg:p-10">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            
            {/* Left Column */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="space-y-2.5">
                <h3 className="text-2xl sm:text-3xl font-medium text-black tracking-tight leading-snug">
                  {currentBenefit.title}
                </h3>
                <p className="text-[#59544F] text-sm sm:text-base leading-relaxed font-normal">
                  {currentBenefit.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {currentBenefit.problemsSolved.map((item, index) => (
                  <div key={index} className="flex items-start gap-2.5 text-xs sm:text-sm text-black">
                    <CheckCircleIcon size={17} className="text-black shrink-0 mt-0.5" />
                    <span className="text-[#59544F]">{item}</span>
                  </div>
                ))}
              </div>

              {/* Metrics Row (12px inner liquid-glass cards) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-black/[0.075]">
                <div className="p-4 rounded-[12px] liquid-glass-card flex sm:flex-col items-center sm:items-start justify-between sm:justify-start">
                  <div className="text-[11px] text-[#777169]">Средний чек</div>
                  <div className="text-sm sm:text-lg font-medium text-black font-mono sm:mt-0.5">{currentBenefit.avgCheck}</div>
                </div>
                <div className="p-4 rounded-[12px] liquid-glass-card flex sm:flex-col items-center sm:items-start justify-between sm:justify-start">
                  <div className="text-[11px] text-[#777169]">Поток в месяц</div>
                  <div className="text-sm sm:text-lg font-medium text-black font-mono sm:mt-0.5">{currentBenefit.monthlyLeads}</div>
                </div>
                <div className="p-4 rounded-[12px] liquid-glass-card flex sm:flex-col items-center sm:items-start justify-between sm:justify-start">
                  <div className="text-[11px] text-[#777169]">Окупаемость</div>
                  <div className="text-sm sm:text-lg font-medium text-black font-mono sm:mt-0.5">{currentBenefit.roi}</div>
                </div>
              </div>

              {/* Action Buttons (ElevenLabs button tokens) */}
              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => onSelectNiche(activeTab)}
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-full liquid-glass-btn-primary text-white px-5 h-11 text-xs sm:text-sm font-normal active:scale-[0.98] transition-all cursor-pointer gap-2"
                >
                  <span>Применить шаблон</span>
                  <ArrowRightIcon size={16} />
                </button>

                <button
                  type="button"
                  onClick={handlePlaySample}
                  className={`w-full sm:w-auto inline-flex items-center justify-center rounded-full px-5 h-11 text-xs sm:text-sm font-normal transition-all cursor-pointer gap-2 active:scale-[0.98] ${
                    isPlayingAudio
                      ? 'liquid-glass-btn-primary text-white'
                      : 'liquid-glass-pill text-black hover:bg-white'
                  }`}
                >
                  <VolumeLoudIcon size={16} />
                  <span>{isPlayingAudio ? 'Остановить' : 'Прослушать приветствие'}</span>
                </button>
              </div>

            </div>

            {/* Right Column: Clean Script Card (12px radius inner card) */}
            <div className="lg:col-span-5">
              <div className="rounded-[12px] liquid-glass-card p-6 space-y-4">
                
                <div className="flex items-center justify-between gap-2 border-b border-black/[0.06] pb-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-black min-w-0">
                    <span className="w-2 h-2 rounded-full bg-black shrink-0" />
                    <span className="truncate">{currentTemplate.companyName}</span>
                  </div>
                  <span className="text-xs font-mono text-[#59544F] font-normal whitespace-nowrap shrink-0">{currentTemplate.phone}</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-4 rounded-[10px] bg-[#F5F3F1]/70 border border-black/[0.06]">
                    <span className="text-[11px] text-[#777169] block mb-1">
                      Адрес и график работы
                    </span>
                    <p className="text-black font-medium">{currentTemplate.address}</p>
                    <p className="text-[#777169] text-[11px] mt-0.5">{currentTemplate.workingHours}</p>
                  </div>

                  {/* ElevenLabs Signature Obsidian Callout with Liquid Glass */}
                  <div className="p-4 rounded-[10px] liquid-glass-dark text-white">
                    <span className="text-[11px] text-white/70 block mb-1 font-normal">
                      Первая фраза ассистента (0.5 сек)
                    </span>
                    <p className="text-white font-normal leading-relaxed">«{currentTemplate.firstMessage}»</p>
                  </div>

                  <div className="p-4 rounded-[10px] bg-[#F5F3F1]/70 border border-black/[0.06]">
                    <span className="text-[11px] text-[#777169] block mb-1">
                      Фрагмент базы знаний
                    </span>
                    <p className="text-[#59544F] line-clamp-3 leading-relaxed font-normal">
                      {currentTemplate.knowledgeBase}
                    </p>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
