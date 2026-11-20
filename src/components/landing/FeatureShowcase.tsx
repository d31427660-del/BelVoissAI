import React, { useState } from 'react';
import {
  PhoneCallingRoundedIcon,
  ShieldCheckIcon,
  ChatRoundDotsIcon,
  Tuning2Icon,
  SettingsIcon,
  HistoryIcon,
  UserCheckRoundedIcon
} from '@solar-icons/react/bold-duotone';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { SlidingTabs } from '@/components/motion';

export const FeatureShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'agent' | 'logs'>('agent');

  const bentoFeatures = [
    {
      icon: <PhoneCallingRoundedIcon size={20} />,
      badge: 'BYO-SIP',
      title: 'SIP-транк с МТС и А1',
      description: 'Прямое подключение существующих номеров +375 (29/33/44) и городских линий Белтелеком за 5 минут без смены оператора.'
    },
    {
      icon: <Tuning2Icon size={20} />,
      badge: 'База знаний',
      title: 'Строгие рамки прайса',
      description: 'ИИ никогда не выдумывает скидки или несуществующие услуги — консультирует исключительно по вашей базе знаний в BYN.'
    },
    {
      icon: <ChatRoundDotsIcon size={20} />,
      badge: 'Telegram & SMS',
      title: 'Мгновенные карточки и SMS',
      description: 'Отправка заявки руководителю в Telegram за 1 секунду и авто-визитка клиенту с подтверждением времени и адресом.'
    },
    {
      icon: <ShieldCheckIcon size={20} />,
      badge: 'Закон № 99-З',
      title: 'Безопасность и изоляция',
      description: 'Логическая изоляция данных на уровне аккаунта, серверы в РБ и шифрование записей звонков (TLS 1.3) по Закону № 99-З.'
    }
  ];

  return (
    <section id="features" className="py-24 bg-transparent relative scroll-mt-20">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-24">
        
        {/* ================================================================= */}
        {/* PART 1: Real Product Interface (Workspace Mockups)                */}
        {/* ================================================================= */}
        <div className="space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-7 space-y-3">
              <Badge variant="outline" className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border-slate-300 bg-white/80 text-slate-900 text-xs font-medium">
                Интерфейс платформы
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-[44px] text-slate-950 tracking-[-0.03em] leading-[1.08] font-light">
                Управляйте ассистентом так же просто,{' '}
                <span className="font-normal text-slate-950">
                  как обычным мессенджером
                </span>
              </h2>
            </div>

            <div className="lg:col-span-5 flex items-center justify-start lg:justify-end gap-2">
              <SlidingTabs<'agent' | 'logs'>
                ariaLabel="Режим предпросмотра кабинета"
                value={activeTab}
                onChange={setActiveTab}
                tabClassName="px-4 py-1.5 text-xs sm:text-xs"
                options={[
                  {
                    value: 'agent',
                    label: (
                      <span className="inline-flex items-center gap-1.5">
                        <SettingsIcon size={14} />
                        <span>Конструктор ассистента</span>
                      </span>
                    ),
                  },
                  {
                    value: 'logs',
                    label: (
                      <span className="inline-flex items-center gap-1.5">
                        <HistoryIcon size={14} />
                        <span>Журнал звонков</span>
                      </span>
                    ),
                  },
                ]}
              />
            </div>
          </div>

          {/* Interactive Workspace Screen Simulation */}
          <Card className="rounded-2xl border-slate-200/90 bg-white shadow-xl overflow-hidden p-0">
            {/* Window Top Bar */}
            <div className="bg-slate-950 px-5 py-3.5 flex items-center justify-between border-b border-slate-800 text-white">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-xs font-mono text-slate-400 ml-3">
                  voxi.by/dashboard • Личный кабинет
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 font-medium">SIP-шлюз активен</span>
                <span className="text-slate-500 hidden sm:inline">• Баланс: 420 мин</span>
              </div>
            </div>

            {/* Window Content */}
            <div className="p-6 sm:p-8 bg-slate-50/70">
              {activeTab === 'agent' ? (
                /* Tab 1: Agent Constructor Screen Mockup */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left: Settings Panel */}
                  <div className="lg:col-span-7 bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900">Параметры голосового ассистента</h4>
                        <p className="text-xs text-slate-500">Настройка сценария и правил обслуживания</p>
                      </div>
                      <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50 text-[11px]">
                        Готов к приёму
                      </Badge>
                    </div>

                    <div className="space-y-4 text-xs">
                      <div className="space-y-1.5">
                        <label className="font-medium text-slate-700">Имя и голос ассистента</label>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2.5 rounded-lg border-2 border-slate-900 bg-slate-50 flex items-center justify-between">
                            <span className="font-semibold text-slate-900">Анна (48 kHz)</span>
                            <span className="text-[10px] text-emerald-600 font-medium">● Выбран</span>
                          </div>
                          <div className="p-2.5 rounded-lg border border-slate-200 text-slate-600 flex items-center justify-between">
                            <span>Максим (48 kHz)</span>
                            <span className="text-[10px] text-slate-400">Мужской</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-medium text-slate-700">Приветствие при входящем звонке</label>
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 leading-relaxed font-mono text-[11px]">
                          «Здравствуйте! Салон красоты «Эстет», меня зовут Анна. Подсказать свободные окна к мастерам или сориентировать по стоимости в рублях?»
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                          <span className="text-slate-500 block text-[11px]">Интеграция расписания</span>
                          <span className="font-semibold text-slate-900">YCLIENTS (2-Way Sync)</span>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                          <span className="text-slate-500 block text-[11px]">Уведомления руководителя</span>
                          <span className="font-semibold text-slate-900">Telegram-бот @voximanagebot</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Live Preview Panel */}
                  <div className="lg:col-span-5 bg-slate-950 text-white rounded-xl p-6 border border-slate-800 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <UserCheckRoundedIcon size={18} className="text-emerald-400" />
                        <span className="text-xs font-semibold text-white">Тестирование сценария</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">Live Simulator</span>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                        <span className="text-[10px] text-slate-400 font-mono">КЛИЕНТ:</span>
                        <p className="text-slate-200">«Добрый вечер, есть ли окно на маникюр на завтра после семи?»</p>
                      </div>
                      <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/50 space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-emerald-400 font-mono">
                          <span>ВОКСИ (АННА):</span>
                          <span>Отклик: ~0.5с</span>
                        </div>
                        <p className="text-emerald-100">
                          «Да, конечно! Завтра в девятнадцать тридцать свободно окно у топ-мастера Дарьи. Записать вас?»
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>Слот в YCLIENTS: #84910</span>
                      <span className="text-emerald-400">Бронь создана</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Tab 2: Call Logs Screen Mockup */
                <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">Журнал входящих вызовов</h4>
                      <p className="text-xs text-slate-500">Записи, транскрипты и карточки сделок в реальном времени</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs bg-white text-slate-700">
                        Всего вызовов: 148
                      </Badge>
                      <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-800">
                        Успешная запись: 92%
                      </Badge>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100 text-xs">
                    {[
                      {
                        phone: '+375 (29) 614-22-90',
                        operator: 'А1 ВАТС',
                        time: '18:42 (2 мин назад)',
                        duration: '1 мин 18 сек',
                        result: 'Запись на ТО • 140 BYN',
                        status: 'Слот забронирован',
                        statusColor: 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      },
                      {
                        phone: '+375 (33) 308-11-45',
                        operator: 'МТС SIP',
                        time: '18:15 (29 мин назад)',
                        duration: '48 сек',
                        result: 'Консультация по рассрочке',
                        status: 'SMS отправлено',
                        statusColor: 'text-sky-700 bg-sky-50 border-sky-200'
                      },
                      {
                        phone: '+375 (17) 388-00-12',
                        operator: 'Белтелеком',
                        time: '17:50 (54 мин назад)',
                        duration: '2 мин 04 сек',
                        result: 'Острая боль • Хирург 18:30',
                        status: 'Передано в Telegram',
                        statusColor: 'text-amber-700 bg-amber-50 border-amber-200'
                      }
                    ].map((call, idx) => (
                      <div key={idx} className="p-4 sm:px-6 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 font-mono text-sm">{call.phone}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">{call.operator}</span>
                          </div>
                          <p className="text-slate-600">{call.result}</p>
                        </div>
                        <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-1.5 shrink-0">
                          <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-medium ${call.statusColor}`}>
                            {call.status}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">{call.time} • {call.duration}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* ================================================================= */}
        {/* PART 2: 4 Architectural Bento Feature Cards                       */}
        {/* ================================================================= */}
        <div className="space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl space-y-3">
              <Badge variant="outline" className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-slate-300 bg-white/80 text-slate-900 text-xs font-normal">
                Технологический стек Voxi.by
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-[40px] text-slate-950 tracking-[-0.025em] font-light">
                Создано для Беларуси.{' '}
                <span className="font-normal text-slate-950">
                  Готово к высоким нагрузкам.
                </span>
              </h2>
            </div>
            <p className="text-base text-slate-600 max-w-md leading-relaxed font-normal">
              От прямого распознавания минских улиц и расчётов в BYN до надёжного SIP-шлюза — всё работает в едином контуре.
            </p>
          </div>

          {/* Row: 4 Equal Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {bentoFeatures.map((item, index) => (
              <Card
                key={index}
                className="p-6 rounded-2xl border-slate-200/90 bg-white/85 shadow-xs hover:shadow-md hover:bg-white transition-all flex flex-col justify-between space-y-5"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center">
                      {item.icon}
                    </div>
                    <Badge variant="secondary" className="font-mono text-[10px] font-normal px-2.5 py-0.5 rounded-full">
                      {item.badge}
                    </Badge>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-base font-semibold text-slate-950 tracking-tight">
                      {item.title}
                    </h3>
                    <p className="text-slate-600 text-xs leading-relaxed font-normal">
                      {item.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};