import React, { useState } from 'react';
import {
  PhoneCallingRoundedIcon,
  CalendarMarkIcon,
  WalletMoneyIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  DocumentTextIcon
} from '@solar-icons/react/bold-duotone';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

type IntegrationTab = 'telephony' | 'crm' | 'finance';

export const IntegrationsStrip: React.FC = () => {
  const [activeTab, setActiveTab] = useState<IntegrationTab>('telephony');

  const tabs = [
    {
      id: 'telephony' as const,
      label: 'Телефония и SIP РБ',
      badge: 'МТС • А1 • Белтелеком',
      icon: <PhoneCallingRoundedIcon size={16} />
    },
    {
      id: 'crm' as const,
      label: 'CRM, запись и учёт',
      badge: 'YCLIENTS • CRM • 1C',
      icon: <CalendarMarkIcon size={16} />
    },
    {
      id: 'finance' as const,
      label: 'Биллинг и право РБ',
      badge: 'ЕРИП • bePaid • 99-З',
      icon: <WalletMoneyIcon size={16} />
    }
  ];

  return (
    <section id="integrations" className="py-20 bg-transparent border-y border-black/[0.06] scroll-mt-20">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-10">
        
        {/* Header Row with Context */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <Badge
              variant="outline"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-slate-300 bg-white/80 text-slate-900 text-xs font-medium"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Единый контур интеграций Беларуси</span>
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-slate-950 tracking-tight">
              Работает с вашим действующим номером,{' '}
              <span className="font-normal text-slate-950">
                CRM-системой и бухгалтерией
              </span>
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Без покупки дорогостоящих аппаратных АТС и без смены привычных операторов связи. Подключение занимает от 5 до 15 минут.
            </p>
          </div>

          <a
            href="#features"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-800 hover:text-black hover:underline transition-all self-start md:self-auto shrink-0"
          >
            <span>Посмотреть экран конструктора</span>
            <ArrowRightIcon size={14} />
          </a>
        </div>

        {/* Category Switcher Tabs */}
        <div className="flex justify-center">
          <div className="flex flex-wrap sm:inline-flex justify-center p-1 sm:p-1.5 rounded-2xl bg-slate-200/80 border border-slate-300/80 gap-1 w-full sm:w-auto">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-slate-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-white/40'
                  }`}
                >
                  <span className={isActive ? 'text-slate-950' : 'text-slate-500'}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab 1: Telephony in Belarus */}
        {activeTab === 'telephony' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: MTS */}
              <Card className="rounded-2xl border-slate-200/90 bg-white/90 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center font-bold text-xs">
                      МТС
                    </div>
                    <Badge variant="outline" className="text-xs font-mono font-medium text-emerald-700 bg-emerald-50 border-emerald-200">
                      99.9% SLA
                    </Badge>
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-semibold text-slate-950">МТС Беларусь (sip.mts.by)</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Прямой SIP-транк с номерами +375 (29/33). Сохраняем ваш текущий тариф мобильной связи — звонки не перетарифицируются.
                    </p>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5">
                  <CheckCircleIcon size={14} className="text-emerald-500 shrink-0" />
                  <span>Минский шлюз • Отклик до 0.5 сек</span>
                </div>
              </Card>

              {/* Card 2: A1 */}
              <Card className="rounded-2xl border-slate-200/90 bg-white/90 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold text-xs">
                      А1
                    </div>
                    <Badge variant="outline" className="text-xs font-mono font-medium text-emerald-700 bg-emerald-50 border-emerald-200">
                      sip.a1.by
                    </Badge>
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-semibold text-slate-950">А1 Телеком & ВАТС</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Интеграция с номерами +375 (29/44) или подключение Виртуальной АТС А1. Также доступна аренда нового номера за 15 BYN/мес.
                    </p>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5">
                  <CheckCircleIcon size={14} className="text-emerald-500 shrink-0" />
                  <span>Без перепрошивки оборудования</span>
                </div>
              </Card>

              {/* Card 3: Beltelecom */}
              <Card className="rounded-2xl border-slate-200/90 bg-white/90 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-xs">
                      БТК
                    </div>
                    <Badge variant="outline" className="text-xs font-mono font-medium text-slate-700 bg-slate-50 border-slate-200">
                      Код (017) IMS
                    </Badge>
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-semibold text-slate-950">Белтелеком (Городские линии)</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Подключение городских телефонных номеров Минска и всех областных центров по протоколу IMS / SIP без потери входящей линии.
                    </p>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5">
                  <CheckCircleIcon size={14} className="text-emerald-500 shrink-0" />
                  <span>Поддержка многоканальных очередей</span>
                </div>
              </Card>
            </div>

            {/* Bottom info banner for telephony */}
            <div className="p-4 rounded-xl bg-slate-100/90 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-950">BYO-SIP (Bring Your Own SIP):</span>
                <span>Подключайте уже существующие номера МТС, А1, Белтелеком, UniTalk или Zadarma — 0 BYN за интеграцию.</span>
              </div>
              <span className="font-mono text-emerald-700 font-medium shrink-0">Без смены оператора</span>
            </div>
          </div>
        )}

        {/* Tab 2: CRM & Calendars */}
        {activeTab === 'crm' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* YCLIENTS */}
              <Card className="rounded-2xl border-slate-200/90 bg-white/90 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold text-xs">
                      YC
                    </div>
                    <Badge variant="outline" className="text-[11px] font-mono text-emerald-700 bg-emerald-50">
                      2-Way Sync
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-slate-950">YCLIENTS</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Онлайн-проверка свободных окон мастеров и боксов СТО прямо во время диалога. Автоматическое создание записи без накладок.
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  Сверка слота за 120 мс
                </div>
              </Card>

              {/* Bitrix24 */}
              <Card className="rounded-2xl border-slate-200/90 bg-white/90 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center font-bold text-xs">
                      Б24
                    </div>
                    <Badge variant="outline" className="text-[11px] font-mono text-slate-700 bg-slate-50">
                      REST API
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-slate-950">Bitrix24 CRM</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Мгновенное создание лида или сделки в воронке, постановка задачи менеджеру и прикрепление аудиозаписи вызова.
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  Облачная и коробочная версии
                </div>
              </Card>

              {/* amoCRM */}
              <Card className="rounded-2xl border-slate-200/90 bg-white/90 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold text-xs">
                      amo
                    </div>
                    <Badge variant="outline" className="text-[11px] font-mono text-slate-700 bg-slate-50">
                      Webhooks
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-slate-950">amoCRM</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Автоматическая фиксация тегов («Запись на ТО», «Рассрочка»), передача бюджета в BYN и карточки звонка за 1 секунду.
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  Мгновенный триггер в Digital Pipeline
                </div>
              </Card>

              {/* 1C */}
              <Card className="rounded-2xl border-slate-200/90 bg-white/90 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold text-xs">
                      1С
                    </div>
                    <Badge variant="outline" className="text-[11px] font-mono text-slate-700 bg-slate-50">
                      JSON / HTTP
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-slate-950">1С:Предприятие</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Интеграция с учетными базами для проверки остатков товаров, прайс-листов в BYN и синхронизации статусов заказов.
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  Совместимо с 1С 8.3 РБ
                </div>
              </Card>
            </div>

            {/* Bottom info banner for CRM */}
            <div className="p-4 rounded-xl bg-slate-100/90 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-950">Уведомления без задержек:</span>
                <span>Каждый звонок также отправляет готовую карточку лида руководителю в Telegram за 1 секунду.</span>
              </div>
              <span className="font-mono text-slate-800 font-medium shrink-0">@voximanagebot</span>
            </div>
          </div>
        )}

        {/* Tab 3: Finance, Payments & Law */}
        {activeTab === 'finance' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* bePaid */}
              <Card className="rounded-2xl border-slate-200/90 bg-white/90 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold text-xs">
                      💳
                    </div>
                    <Badge variant="outline" className="text-xs font-mono font-medium text-emerald-700 bg-emerald-50 border-emerald-200">
                      bePaid.by
                    </Badge>
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-semibold text-slate-950">Интернет-эквайринг картами РБ</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Оплата в белорусских рублях картами БЕЛКАРТ, Visa, Mastercard любых белорусских банков без скрытых валютных конверсий.
                    </p>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5">
                  <CheckCircleIcon size={14} className="text-emerald-500 shrink-0" />
                  <span>Шлюз ООО «ИКомЧардж»</span>
                </div>
              </Card>

              {/* ERIP */}
              <Card className="rounded-2xl border-slate-200/90 bg-white/90 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                      ЕРИП
                    </div>
                    <Badge variant="outline" className="text-xs font-mono font-medium text-slate-800 bg-slate-50 border-slate-200">
                      АИС «Расчёт»
                    </Badge>
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-semibold text-slate-950">Оплата через ЕРИП по QR-коду</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Мгновенное выставление счёта в мобильный банк: оплата через дерево ЕРИП или с помощью динамического QR-кода без комиссии.
                    </p>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5">
                  <CheckCircleIcon size={14} className="text-emerald-500 shrink-0" />
                  <span>Моментальное зачисление минут</span>
                </div>
              </Card>

              {/* Legal 99-Z & Minfin */}
              <Card className="rounded-2xl border-slate-200/90 bg-white/90 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold text-xs">
                      <ShieldCheckIcon size={20} />
                    </div>
                    <Badge variant="outline" className="text-xs font-mono font-medium text-amber-800 bg-amber-50 border-amber-200">
                      УНП 193991846
                    </Badge>
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-semibold text-slate-950">Закон № 99-З и акты Минфина</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Хранение данных в РБ. Единоличные акты оказанных услуг по постановлению Минфина № 13 для официального списания расходов юрлиц.
                    </p>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5">
                  <DocumentTextIcon size={14} className="text-slate-700 shrink-0" />
                  <span>Официальный договор-оферта РБ</span>
                </div>
              </Card>
            </div>

            {/* Bottom info banner for Finance */}
            <div className="p-4 rounded-xl bg-slate-100/90 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-950">Прозрачный биллинг:</span>
                <span>Расчёты в BYN без НДС. Счета выставляются 1-го числа месяца с 7-дневной отсрочкой без блокировки бота.</span>
              </div>
              <span className="font-mono text-emerald-700 font-medium shrink-0">Без блокировки сервиса</span>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};