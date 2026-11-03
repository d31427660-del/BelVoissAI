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
      icon: <WheelAngleIcon size={16} />
    },
    {
      id: 'auto_service',
      label: 'Автосервисы (СТО)',
      icon: <GarageIcon size={16} />
    },
    {
      id: 'medical_clinic',
      label: 'Стоматологии и клиники',
      icon: <StethoscopeIcon size={16} />
    },
    {
      id: 'beauty_salon',
      label: 'Салоны красоты',
      icon: <ScissorsIcon size={16} />
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
        activeTab === 'auto_service' ? 'dmitry' : 'anna',
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
    <section id="who" className="py-24 bg-[#ffffff]">
      <div className="max-w-[1080px] mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="mb-12 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 text-[#2563eb] text-xs font-semibold">
            Отраслевые решения
          </div>
          <h2 className="apple-heading text-3xl sm:text-4xl lg:text-[44px] text-[#1d1d1f]">
            Готовые базы знаний.{' '}
            <span className="bg-gradient-to-r from-[#2563eb] to-[#4f46e5] bg-clip-text text-transparent">
              Адаптированы под рынок Беларуси.
            </span>
          </h2>
        </div>

        {/* Apple Segmented Pill Bar */}
        <div className="inline-flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-full flex-wrap mb-10">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  VoiceSimulator.stop();
                  setIsPlayingAudio(false);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#2563eb] text-[#ffffff] shadow-md shadow-blue-500/20'
                    : 'text-slate-600 hover:text-[#1d1d1f]'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Tab Bento Card (Ultra-Rounded) */}
        <div className="rounded-[44px] sm:rounded-[52px] bg-gradient-to-b from-slate-50 to-blue-50/30 border border-slate-200/70 p-7 sm:p-10">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Column */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="space-y-2.5">
                <h3 className="text-2xl sm:text-3xl font-semibold text-[#1d1d1f] tracking-tight leading-snug">
                  {currentBenefit.title}
                </h3>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                  {currentBenefit.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {currentBenefit.problemsSolved.map((item, index) => (
                  <div key={index} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#1d1d1f]">
                    <CheckCircleIcon size={17} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              {/* Metrics Row */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-200/80">
                <div className="p-4 rounded-[28px] bg-[#ffffff] border border-slate-100">
                  <div className="text-[11px] text-[#86868b]">Средний чек</div>
                  <div className="text-base sm:text-lg font-bold text-[#2563eb] mt-0.5">{currentBenefit.avgCheck}</div>
                </div>
                <div className="p-4 rounded-[28px] bg-[#ffffff] border border-slate-100">
                  <div className="text-[11px] text-[#86868b]">Поток в месяц</div>
                  <div className="text-base sm:text-lg font-bold text-[#1d1d1f] mt-0.5">{currentBenefit.monthlyLeads}</div>
                </div>
                <div className="p-4 rounded-[28px] bg-[#ffffff] border border-slate-100">
                  <div className="text-[11px] text-[#86868b]">Окупаемость</div>
                  <div className="text-base sm:text-lg font-bold text-emerald-600 mt-0.5">{currentBenefit.roi}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={() => onSelectNiche(activeTab)}
                  className="px-6 py-3.5 rounded-full bg-gradient-to-r from-[#2563eb] to-[#4f46e5] hover:from-[#1d4ed8] hover:to-[#4338ca] text-[#ffffff] font-semibold text-xs flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all"
                >
                  <span>Применить шаблон</span>
                  <ArrowRightIcon size={16} />
                </button>

                <button
                  onClick={handlePlaySample}
                  className={`px-6 py-3.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-colors ${
                    isPlayingAudio
                      ? 'bg-[#2563eb] text-[#ffffff]'
                      : 'bg-[#ffffff] hover:bg-blue-50 text-[#2563eb] border border-blue-200'
                  }`}
                >
                  <VolumeLoudIcon size={16} />
                  <span>{isPlayingAudio ? 'Остановить' : 'Прослушать приветствие'}</span>
                </button>
              </div>

            </div>

            {/* Right Column: Clean Script Card */}
            <div className="lg:col-span-5">
              <div className="rounded-[36px] bg-[#ffffff] border border-slate-200/80 shadow-apple-card p-6 sm:p-7 space-y-4">
                
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#1d1d1f] min-w-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                    <span className="truncate">{currentTemplate.companyName}</span>
                  </div>
                  <span className="text-xs font-mono text-[#2563eb] font-medium whitespace-nowrap shrink-0">{currentTemplate.phone}</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-4 rounded-[24px] bg-slate-50">
                    <span className="text-[11px] text-[#86868b] block mb-1">
                      Адрес и график работы
                    </span>
                    <p className="text-[#1d1d1f] font-medium">{currentTemplate.address}</p>
                    <p className="text-[#86868b] text-[11px] mt-0.5">{currentTemplate.workingHours}</p>
                  </div>

                  <div className="p-4 rounded-[24px] bg-gradient-to-br from-[#2563eb] to-[#4f46e5] text-[#ffffff] shadow-md shadow-blue-500/15">
                    <span className="text-[11px] text-blue-100 block mb-1 font-medium">
                      Первая фраза ассистента (0.5 сек)
                    </span>
                    <p className="text-[#ffffff] font-normal leading-relaxed">«{currentTemplate.firstMessage}»</p>
                  </div>

                  <div className="p-4 rounded-[24px] bg-slate-50">
                    <span className="text-[11px] text-[#86868b] block mb-1">
                      Фрагмент базы знаний
                    </span>
                    <p className="text-[#1d1d1f] line-clamp-3 leading-relaxed">
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
