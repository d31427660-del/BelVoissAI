import React, { useState } from 'react';
import {
  Widget5Icon as LayoutDashboard,
  CpuBoltIcon as Bot,
  PhoneCallingRoundedIcon as PhoneCall,
  ChecklistIcon,
  SoundwaveCircleIcon as Radio,
  ArrowLeftIcon as ArrowLeft,
  Logout2Icon as LogOut,
  QuestionCircleIcon as HelpCircle,
  CheckCircleIcon as CheckCircle2,
  HamburgerMenuIcon as Menu,
  CloseCircleIcon as X,
  WalletMoneyIcon as Wallet
} from '@solar-icons/react/bold-duotone';
import { AgentConfig, CallLog, SipSettings, TelegramSettings, WebhookSettings, UserSession } from '../../types';
import { SimpleOverviewTab } from './SimpleOverviewTab';
import { SimpleAgentTab } from './SimpleAgentTab';
import { LeadsTab } from './LeadsTab';
import { PhoneTab } from './PhoneTab';
import { BillingTab } from './BillingTab';
import { GuideModal } from './GuideModal';
import { VOXI_CONTACTS, TelegramIcon, WhatsAppIcon } from '../../lib/contacts';

interface DashboardLayoutProps {
  user: UserSession;
  onUserUpdated?: (user: UserSession) => void;
  agent: AgentConfig;
  onSaveAgent: (agent: AgentConfig) => void;
  sipSettings: SipSettings;
  onSaveSip: (settings: SipSettings) => void;
  telegramSettings: TelegramSettings;
  onSaveTelegram: (settings: TelegramSettings) => void;
  webhookSettings: WebhookSettings;
  onSaveWebhook: (settings: WebhookSettings) => void;
  vapiApiKey: string;
  onSaveVapiApiKey: (key: string) => void;
  callLogs: CallLog[];
  onCallCompleted?: (log: CallLog) => void;
  onOpenVoiceTest: () => void;
  onOpenTopUp: () => void;
  initialSelectedPackage?: 'pack_300' | 'pack_1000' | null;
  onInitialPackageConsumed?: () => void;
  onExitToLanding?: () => void;
  onLogout?: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  user,
  onUserUpdated,
  agent,
  onSaveAgent,
  sipSettings,
  onSaveSip,
  telegramSettings,
  onSaveTelegram,
  webhookSettings,
  onSaveWebhook,
  callLogs,
  onCallCompleted,
  onOpenVoiceTest,
  initialSelectedPackage,
  onInitialPackageConsumed,
  onExitToLanding,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'agent' | 'leads' | 'phone' | 'billing'>(
    initialSelectedPackage ? 'billing' : 'overview'
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  React.useEffect(() => {
    if (initialSelectedPackage) {
      setActiveTab('billing');
    }
  }, [initialSelectedPackage]);

  const handleSaveAgentWithToast = (updatedAgent: AgentConfig) => {
    onSaveAgent(updatedAgent);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2600);
  };

  const handleGlobalSave = () => {
    const activeForm = document.getElementById('active-workspace-form') as HTMLFormElement | null;
    if (activeForm) {
      activeForm.requestSubmit();
    } else {
      handleSaveAgentWithToast(agent);
    }
  };

  const navigateToBillingPayment = () => {
    setActiveTab('billing');
    setIsMobileMenuOpen(false);
    setTimeout(() => {
      const el = document.getElementById('payment-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 80);
  };

  const leadsCount = callLogs.filter((c) => c.status === 'lead_captured').length || callLogs.length;
  const billing = user.billing;
  const freeMins = billing ? billing.freeMinutesRemaining : (user.balanceMinutes || 0);
  const unpaidDebtByn = billing ? billing.unpaidDebtByn : 0;
  const creditLimitByn = billing?.creditLimitByn ?? 100;
  const isSuspended = billing?.billingStatus === 'suspended' || (billing?.overdueInvoicesCount || 0) > 0 || unpaidDebtByn > creditLimitByn;
  const isBotOnline = agent.isActive && !isSuspended;
  const isOwnSip = billing ? billing.numberRentalMode === 'own_sip' : Boolean(sipSettings.byoSipMode);

  // Save button in header should only appear on tabs that actually have editable settings forms
  const hasEditableFormOnTab = activeTab === 'agent' || activeTab === 'leads' || activeTab === 'phone';

  const primaryNavItems = [
    {
      id: 'overview' as const,
      label: 'Главная',
      subtitle: 'Статус бота и сводка',
      icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200/70',
      badge: undefined
    },
    {
      id: 'agent' as const,
      label: 'Настройка бота',
      subtitle: 'Голос, услуги и график',
      icon: <Bot className="w-4 h-4 shrink-0" />,
      iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-200/70',
      badge: undefined
    },
    {
      id: 'leads' as const,
      label: 'Заявки',
      subtitle: 'Контакты и Telegram',
      icon: <ChecklistIcon className="w-4 h-4 shrink-0" />,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-200/70',
      badge: `${leadsCount}`
    },
    {
      id: 'phone' as const,
      label: 'Телефония',
      subtitle: 'Номер и перевод',
      icon: <PhoneCall className="w-4 h-4 shrink-0" />,
      iconBg: 'bg-teal-50 text-teal-600 border-teal-200/70',
      badge: isOwnSip ? '0 BYN' : '15 BYN'
    },
    {
      id: 'billing' as const,
      label: 'Тариф и оплата',
      subtitle: 'Калькулятор, Карта и ЕРИП',
      icon: <Wallet className="w-4 h-4 shrink-0" />,
      iconBg: 'bg-amber-50 text-amber-600 border-amber-200/70',
      badge: `${(user.ratePerMinute || 0.45).toFixed(2)} BYN`
    }
  ];

  const allNavItems = primaryNavItems;
  const currentNav = allNavItems.find((n) => n.id === activeTab) || primaryNavItems[0];

  const renderNavButton = (item: typeof allNavItems[number]) => {
    const isActive = activeTab === item.id;
    return (
      <button
        key={item.id}
        type="button"
        aria-current={isActive ? 'page' : undefined}
        onClick={() => {
          setActiveTab(item.id);
          setIsMobileMenuOpen(false);
        }}
        className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer relative ${
          isActive
            ? 'bg-slate-900 text-white shadow-sm font-semibold'
            : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100/80 font-medium'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
              isActive ? 'bg-white/15 text-white border-white/20' : item.iconBg
            }`}
          >
            {item.icon}
          </span>
          <div className="truncate">
            <div className={isActive ? 'font-semibold text-white' : 'font-semibold text-slate-900'}>
              {item.label}
            </div>
            <div className={`text-[10px] font-normal truncate ${isActive ? 'text-zinc-300' : 'text-slate-500'}`}>
              {item.subtitle}
            </div>
          </div>
        </div>
        {item.badge && (
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold shrink-0 ${
              isActive
                ? 'bg-amber-400 text-slate-950'
                : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <div
      className="min-h-screen text-slate-900 flex font-sans selection:bg-slate-900 selection:text-white relative overflow-x-hidden"
      style={{
        backgroundColor: '#F3F5F8',
        backgroundImage: `
          radial-gradient(1100px 600px at 18% 0%, rgba(59, 130, 246, 0.06) 0%, transparent 60%),
          radial-gradient(1000px 550px at 88% 12%, rgba(245, 158, 11, 0.07) 0%, transparent 55%),
          radial-gradient(1100px 700px at 80% 80%, rgba(16, 185, 129, 0.05) 0%, transparent 55%)
        `
      }}
    >
      {/* 1. Left Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-[268px] shrink-0 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out
          lg:static lg:translate-x-0
          ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:shadow-none'}
        `}
      >
        <div className="p-4 space-y-4">
          {/* Workspace Brand */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <button
              type="button"
              onClick={onExitToLanding}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
              title="Перейти на главную страницу сайта"
            >
              <div
                className="w-8 h-8 rounded-lg bg-slate-900 p-[1px] transition-transform group-hover:scale-105 shrink-0"
                aria-hidden="true"
              >
                <div className="w-full h-full rounded-[7px] bg-white flex items-center justify-center gap-[2.5px]">
                  <span className="w-[2.5px] h-3 rounded-full bg-slate-900" />
                  <span className="w-[2.5px] h-3 rounded-full bg-slate-900" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-0.5 font-bold text-xs tracking-tight text-slate-900 group-hover:opacity-80 transition-opacity">
                  <span className="text-sm font-bold">Voxi</span>
                  <span className="text-xs font-semibold font-mono text-slate-500">.by</span>
                </div>
                <div className="text-[10px] text-slate-500 font-medium">Личный кабинет</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Закрыть меню"
              className="lg:hidden p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Company Status Pill */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-900 truncate">
                {agent.companyName || user.companyName || 'Моя компания'}
              </span>
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  isBotOnline ? 'bg-emerald-500 animate-pulse' : isSuspended ? 'bg-rose-500' : 'bg-slate-400'
                }`}
                title={isBotOnline ? 'Бот принимает звонки' : isSuspended ? 'Приостановлен из-за лимита' : 'Бот на паузе'}
              />
            </div>
            <div className="text-[11px] text-slate-500 flex items-center justify-between">
              <span className="font-mono truncate">{sipSettings.callerId || 'Линия не указана'}</span>
              <span className={isBotOnline ? 'text-emerald-700 font-semibold' : isSuspended ? 'text-rose-600 font-semibold' : 'text-slate-500'}>
                {isBotOnline ? 'На линии' : isSuspended ? 'Лимит превышен' : 'Пауза'}
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1 pt-1" aria-label="Разделы кабинета">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pb-1">
              Разделы кабинета
            </span>
            {primaryNavItems.map(renderNavButton)}
          </nav>
        </div>

        {/* Bottom Sidebar: Compact Single-Action Billing Summary */}
        <div className="p-4 border-t border-slate-200 space-y-3 bg-slate-50/70">
          <div className="space-y-2 p-3.5 rounded-2xl bg-white border border-amber-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-bold text-slate-900">
                <Wallet className="w-4 h-4 text-amber-600" />
                <span>Баланс минут:</span>
              </span>
              <span className="font-mono font-extrabold text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {freeMins.toFixed(1)} мин
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-600">
              <span>К оплате за месяц:</span>
              <strong className={`font-mono ${isSuspended ? 'text-rose-600' : 'text-slate-900'}`}>
                {unpaidDebtByn.toFixed(2)} BYN
              </strong>
            </div>

            <button
              type="button"
              onClick={navigateToBillingPayment}
              className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer text-center"
            >
              {unpaidDebtByn > 0 ? 'Оплатить картой / ЕРИП' : 'Тарифы и пополнение →'}
            </button>
          </div>

          {/* Quick Manager Contacts */}
          <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 space-y-1.5 text-[11px]">
            <div className="text-slate-600 font-semibold flex items-center justify-between">
              <span>Персональный менеджер</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full font-semibold">
                Онлайн
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <a
                href={VOXI_CONTACTS.telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={`Написать менеджеру в Telegram (${VOXI_CONTACTS.telegramHandle})`}
                className="flex-1 py-1.5 px-2 rounded-lg bg-sky-50 hover:bg-[#0088cc] hover:text-white text-sky-800 border border-sky-200/70 font-semibold text-[10px] flex items-center justify-center gap-1 transition-colors"
              >
                <TelegramIcon size={11} />
                <span>Telegram</span>
              </a>
              <a
                href={VOXI_CONTACTS.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Написать менеджеру в WhatsApp"
                className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-50 hover:bg-[#25D366] hover:text-white text-emerald-800 border border-emerald-200/70 font-semibold text-[10px] flex items-center justify-center gap-1 transition-colors"
              >
                <WhatsAppIcon size={11} />
                <span>WhatsApp</span>
              </a>
              <a
                href={VOXI_CONTACTS.phoneTel}
                title={`Позвонить: ${VOXI_CONTACTS.phoneDisplay}`}
                className="py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-800 font-mono font-semibold text-[10px] flex items-center justify-center transition-colors"
              >
                Тел
              </a>
            </div>
          </div>

          <div className="pt-1 flex items-center justify-between text-xs text-slate-500">
            {onExitToLanding && (
              <button
                type="button"
                onClick={onExitToLanding}
                className="hover:text-slate-900 flex items-center gap-1 font-medium transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>На сайт</span>
              </button>
            )}

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="hover:text-rose-600 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                title="Выйти из аккаунта"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Выход</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Backdrop overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* 2. Main Content Canvas */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Compact Workspace Topbar */}
        <header className="h-14 sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Открыть меню разделов"
              className="lg:hidden p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-slate-900 min-w-0 shrink">
              <span className="text-slate-400 hidden md:inline font-medium">Кабинет</span>
              <span className="text-slate-300 hidden md:inline">/</span>
              <span className="truncate font-bold">{currentNav.label}</span>
            </div>

            <div
              className={`hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-semibold shrink-0 ${
                isBotOnline
                  ? 'bg-emerald-50 border-emerald-200/80 text-emerald-800'
                  : isSuspended
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isBotOnline ? 'bg-emerald-500 animate-pulse' : isSuspended ? 'bg-rose-500' : 'bg-slate-400'
                }`}
              />
              <span>
                {isBotOnline
                  ? 'Бот на линии • отвечает за 0.5 сек'
                  : isSuspended
                  ? 'Приём звонков приостановлен (превышен лимит)'
                  : 'Бот поставлен на паузу'}
              </span>
            </div>

            {activeTab !== 'billing' && (
              <button
                type="button"
                onClick={() => setActiveTab('billing')}
                title="Открыть раздел тарифов, калькулятора и оплаты"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200/90 transition-all cursor-pointer shrink-0"
              >
                <Wallet className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="whitespace-nowrap">
                  {freeMins > 0 ? `Баланс: ${freeMins.toFixed(0)} мин` : `${unpaidDebtByn.toFixed(2)} BYN`}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full ml-0.5 font-bold whitespace-nowrap bg-amber-500 text-slate-950">
                  Тариф и оплата
                </span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsGuideOpen(true)}
              title="Краткая пошаговая шпаргалка по запуску"
              className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Как запустить?</span>
            </button>

            {hasEditableFormOnTab ? (
              <button
                type="button"
                onClick={handleGlobalSave}
                title="Сохранить текущие настройки"
                className="px-3 sm:px-4 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs whitespace-nowrap"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="hidden sm:inline">Сохранить изменения</span>
                <span className="sm:hidden">Сохранить</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenVoiceTest}
                title="Проверить диалог с ботом голосом или текстом"
                className="px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <Radio className="w-3.5 h-3.5 text-white" />
                <span>Тестовый звонок</span>
              </button>
            )}
          </div>
        </header>

        {/* Light Save Confirmation Toast */}
        {saveToast && (
          <div
            role="status"
            aria-live="polite"
            className="fixed top-16 right-6 z-50 p-3.5 rounded-xl bg-emerald-50 text-emerald-900 text-xs font-semibold flex items-center gap-2 shadow-lg border border-emerald-200"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Изменения успешно сохранены!</span>
          </div>
        )}

        {/* Tab Body */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'overview' && (
            <SimpleOverviewTab
              user={user}
              agent={agent}
              callLogs={callLogs}
              sipSettings={sipSettings}
              onNavigateTab={(t) => {
                if (t === 'calls' || t === 'leads') setActiveTab('leads');
                else if (t === 'integrations' || t === 'phone') setActiveTab('phone');
                else if (t === 'agent') setActiveTab('agent');
                else if (t === 'billing') setActiveTab('billing');
                else setActiveTab('overview');
              }}
              onOpenVoiceTest={onOpenVoiceTest}
              onToggleActive={() => onSaveAgent({ ...agent, isActive: !agent.isActive })}
              onOpenTopUp={navigateToBillingPayment}
            />
          )}

          {activeTab === 'agent' && (
            <SimpleAgentTab
              agent={agent}
              onSaveAgent={handleSaveAgentWithToast}
              onCallCompleted={onCallCompleted}
            />
          )}

          {activeTab === 'leads' && (
            <LeadsTab
              callLogs={callLogs}
              agent={agent}
              onSaveAgent={handleSaveAgentWithToast}
              telegramSettings={telegramSettings}
              onSaveTelegram={onSaveTelegram}
              webhookSettings={webhookSettings}
              onSaveWebhook={onSaveWebhook}
            />
          )}

          {activeTab === 'phone' && (
            <PhoneTab
              agent={agent}
              onSaveAgent={handleSaveAgentWithToast}
              sipSettings={sipSettings}
              onSaveSip={onSaveSip}
              onUserUpdated={onUserUpdated}
            />
          )}

          {activeTab === 'billing' && (
            <BillingTab
              user={user}
              sipSettings={sipSettings}
              onSaveSip={onSaveSip}
              onUserUpdated={onUserUpdated}
              onNavigateTab={(t) => setActiveTab(t)}
              initialSelectedPackage={initialSelectedPackage}
              onInitialPackageConsumed={onInitialPackageConsumed}
            />
          )}
        </div>
      </div>

      {/* Guide Modal */}
      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
};
