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
import { LiveBotTester } from './LiveBotTester';
import { VOXI_CONTACTS, TelegramIcon, WhatsAppIcon } from '../../lib/contacts';

interface DashboardLayoutProps {
  user: UserSession;
  onUserUpdated?: (user: UserSession) => void;
  agent: AgentConfig;
  onSaveAgent: (agent: AgentConfig) => Promise<void> | void;
  sipSettings: SipSettings;
  onSaveSip: (settings: SipSettings) => Promise<void> | void;
  telegramSettings: TelegramSettings;
  onSaveTelegram: (settings: TelegramSettings) => Promise<void> | void;
  webhookSettings: WebhookSettings;
  onSaveWebhook: (settings: WebhookSettings) => Promise<void> | void;
  vapiApiKey: string;
  onSaveVapiApiKey: (key: string) => void;
  callLogs: CallLog[];
  onCallCompleted?: (log: CallLog) => void;
  onOpenVoiceTest: () => void;
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
  const [isLiveTesterOpen, setIsLiveTesterOpen] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialSelectedPackage) {
      setActiveTab('billing');
    }
  }, [initialSelectedPackage]);

  React.useEffect(() => {
    if (!isLiveTesterOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLiveTesterOpen(false);
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [isLiveTesterOpen]);

  const showSaveResult = (ok: boolean, errorMsg?: string) => {
    if (ok) {
      setSaveError(null);
      setSaveToast('Изменения успешно сохранены!');
      window.setTimeout(() => setSaveToast(null), 2600);
    } else {
      setSaveToast(null);
      setSaveError(errorMsg || 'Не удалось сохранить изменения на сервере. Проверьте подключение.');
      window.setTimeout(() => setSaveError(null), 5000);
    }
  };

  const handleSaveAgentWithToast = async (updatedAgent: AgentConfig) => {
    try {
      await onSaveAgent(updatedAgent);
      showSaveResult(true);
    } catch (err: unknown) {
      showSaveResult(false, err instanceof Error ? err.message : undefined);
      throw err;
    }
  };

  const handleSaveSipWithToast = async (nextSip: SipSettings) => {
    try {
      await onSaveSip(nextSip);
      showSaveResult(true);
    } catch (err: unknown) {
      showSaveResult(false, err instanceof Error ? err.message : undefined);
      throw err;
    }
  };

  const handleSaveTelegramWithToast = async (nextTg: TelegramSettings) => {
    try {
      await onSaveTelegram(nextTg);
      showSaveResult(true);
    } catch (err: unknown) {
      showSaveResult(false, err instanceof Error ? err.message : undefined);
      throw err;
    }
  };

  const handleSaveWebhookWithToast = async (nextWh: WebhookSettings) => {
    try {
      await onSaveWebhook(nextWh);
      showSaveResult(true);
    } catch (err: unknown) {
      showSaveResult(false, err instanceof Error ? err.message : undefined);
      throw err;
    }
  };

  const handleGlobalSave = () => {
    const activeForm = document.getElementById('active-workspace-form') as HTMLFormElement | null;
    if (activeForm) {
      activeForm.requestSubmit();
    } else {
      void handleSaveAgentWithToast(agent).catch(() => {});
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

  const leadsCount = callLogs.filter((c) => c.status === 'lead_captured').length;
  const billing = user.billing;
  const freeMins = billing ? billing.freeMinutesRemaining : (user.balanceMinutes || 0);
  const unpaidDebtByn = billing ? billing.unpaidDebtByn : 0;
  const creditLimitByn = billing?.creditLimitByn ?? 100;
  const isSuspended =
    billing?.billingStatus === 'suspended' ||
    (billing?.overdueInvoicesCount || 0) > 0 ||
    unpaidDebtByn > creditLimitByn;
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
      badge: undefined
    },
    {
      id: 'agent' as const,
      label: 'Настройка бота',
      subtitle: 'Голос, услуги и график',
      icon: <Bot className="w-4 h-4 shrink-0" />,
      badge: undefined
    },
    {
      id: 'leads' as const,
      label: 'Заявки',
      subtitle: 'Контакты и Telegram',
      icon: <ChecklistIcon className="w-4 h-4 shrink-0" />,
      badge: `${leadsCount}`
    },
    {
      id: 'phone' as const,
      label: 'Телефония',
      subtitle: 'Номер и перевод',
      icon: <PhoneCall className="w-4 h-4 shrink-0" />,
      badge: isOwnSip ? '0 BYN' : '15 BYN'
    },
    {
      id: 'billing' as const,
      label: 'Тариф и оплата',
      subtitle: 'Карта и ЕРИП',
      icon: <Wallet className="w-4 h-4 shrink-0" />,
      badge: `${(user.ratePerMinute || 0.45).toFixed(2)} BYN`
    }
  ];

  const currentNav = primaryNavItems.find((n) => n.id === activeTab) || primaryNavItems[0];

  const renderNavButton = (item: (typeof primaryNavItems)[number]) => {
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
        className={`group w-full text-left px-3 py-2.5 rounded-[14px] text-[13px] flex items-center justify-between transition-colors cursor-pointer ${
          isActive
            ? 'bg-[#0A0A0A] text-white font-semibold'
            : 'text-[#404040] hover:text-black hover:bg-[#F5F5F5] font-medium'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={`w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 transition-colors ${
              isActive
                ? 'bg-white/10 text-[#6BFF91]'
                : 'bg-[#F5F5F5] group-hover:bg-white text-black border border-black/[0.06]'
            }`}
          >
            {item.icon}
          </span>
          <div className="truncate">
            <div className={`leading-tight ${isActive ? 'font-semibold text-white' : 'font-semibold text-black'}`}>
              {item.label}
            </div>
            <div className={`text-[11px] font-normal truncate mt-0.5 ${isActive ? 'text-white/60' : 'text-[#737373]'}`}>
              {item.subtitle}
            </div>
          </div>
        </div>
        {item.badge && (
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold shrink-0 tabular-nums ${
              isActive
                ? 'bg-[#D8E738] text-black'
                : 'bg-[#F5F5F5] group-hover:bg-white text-[#525252] border border-black/[0.06]'
            }`}
          >
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-white text-black flex font-sans selection:bg-black selection:text-white relative overflow-x-clip">
      {/* 1. Left Editorial Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-[272px] shrink-0 bg-white border-r border-black/[0.08] flex flex-col justify-between transition-transform duration-200 ease-in-out
          lg:sticky lg:top-0 lg:h-screen lg:translate-x-0
          ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:shadow-none'}
        `}
      >
        <div className="p-4 sm:p-5 space-y-5 overflow-y-auto">
          {/* Workspace Brand (matches Landing Navbar) */}
          <div className="flex items-center justify-between pb-4 border-b border-black/[0.08]">
            <button
              type="button"
              onClick={onExitToLanding}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
              title="Перейти на главную страницу сайта"
            >
              <svg
                viewBox="0 0 32 32"
                aria-hidden="true"
                className="w-8 h-8 shrink-0 transition-transform group-hover:scale-105"
              >
                <rect width="32" height="32" rx="9" fill="#0A0A0A" />
                <rect x="6.5" y="14" width="2.4" height="5.2" rx="1.2" fill="#FFFFFF" />
                <rect x="10.5" y="10.5" width="2.4" height="9.8" rx="1.2" fill="#FFFFFF" />
                <path
                  d="M14.8 15.2L18.4 20.9L25.4 10.2"
                  stroke="#6BFF91"
                  strokeWidth="2.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
              <div>
                <div className="font-display font-extrabold text-[17px] tracking-[-0.04em] leading-none text-black">
                  voxi<span className="text-[#737373]">.by</span>
                </div>
                <div className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-[#737373] mt-1">
                  Кабинет
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Закрыть меню"
              className="lg:hidden w-8 h-8 rounded-full flex items-center justify-center text-[#737373] hover:text-black hover:bg-[#F5F5F5] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Company Status Pill */}
          <div className="p-3.5 rounded-[18px] bg-[#F5F5F5] border border-black/[0.06] space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-bold text-black truncate">
                {agent.companyName || user.companyName || 'Моя компания'}
              </span>
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isBotOnline ? 'bg-[#16A34A] animate-pulse' : isSuspended ? 'bg-[#FE432A]' : 'bg-[#A3A3A3]'
                }`}
                title={isBotOnline ? 'Бот принимает звонки' : isSuspended ? 'Приостановлен из-за лимита' : 'Бот на паузе'}
              />
            </div>
            <div className="text-[11px] flex items-center justify-between gap-2">
              <span className="font-mono text-[#737373] truncate">
                {sipSettings.callerId || 'Линия не указана'}
              </span>
              <span
                className={`font-mono text-[10px] uppercase tracking-[0.06em] font-semibold shrink-0 ${
                  isBotOnline ? 'text-[#15803D]' : isSuspended ? 'text-[#FE432A]' : 'text-[#737373]'
                }`}
              >
                {isBotOnline ? 'На линии' : isSuspended ? 'Лимит' : 'Пауза'}
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1" aria-label="Разделы кабинета">
            <span className="block font-mono text-[10px] font-semibold text-[#737373] uppercase tracking-[0.12em] px-3 pb-1.5">
              Навигация
            </span>
            {primaryNavItems.map(renderNavButton)}
          </nav>
        </div>

        {/* Bottom Sidebar: Obsidian Billing Summary + Manager */}
        <div className="p-4 border-t border-black/[0.08] space-y-3 bg-white">
          <div className="space-y-3 p-4 rounded-[20px] bg-[#0A0A0A] text-white">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/60">
                Баланс минут
              </span>
              <span className="font-mono font-bold text-[11px] text-black bg-[#6BFF91] px-2.5 py-0.5 rounded-full tabular-nums">
                {freeMins.toFixed(1)} мин
              </span>
            </div>

            <div className="flex items-baseline justify-between text-[12px] text-white/70">
              <span>К оплате за месяц</span>
              <strong
                className={`font-mono text-[13px] tabular-nums ${
                  isSuspended ? 'text-[#FE432A]' : 'text-white'
                }`}
              >
                {unpaidDebtByn.toFixed(2)} BYN
              </strong>
            </div>

            <button
              type="button"
              onClick={navigateToBillingPayment}
              className="w-full h-9 px-3 rounded-full bg-white hover:bg-[#D8E738] text-black text-[12px] font-semibold transition-colors cursor-pointer text-center"
            >
              {unpaidDebtByn > 0 ? 'Оплатить картой / ЕРИП' : 'Тарифы и пополнение ↗'}
            </button>
          </div>

          {/* Quick Manager Contacts */}
          <div className="p-3 rounded-[16px] bg-[#F5F5F5] border border-black/[0.06] space-y-2 text-[11px]">
            <div className="text-black font-semibold flex items-center justify-between">
              <span>Поддержка 24/7</span>
              <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.06em] text-[#15803D]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                Онлайн
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <a
                href={VOXI_CONTACTS.telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={`Написать менеджеру в Telegram (${VOXI_CONTACTS.telegramHandle})`}
                className="flex-1 h-7 px-2 rounded-full bg-white hover:bg-black hover:text-white text-black border border-black/[0.08] font-semibold text-[10.5px] flex items-center justify-center gap-1 transition-colors"
              >
                <TelegramIcon size={11} />
                <span>TG</span>
              </a>
              <a
                href={VOXI_CONTACTS.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Написать менеджеру в WhatsApp"
                className="flex-1 h-7 px-2 rounded-full bg-white hover:bg-black hover:text-white text-black border border-black/[0.08] font-semibold text-[10.5px] flex items-center justify-center gap-1 transition-colors"
              >
                <WhatsAppIcon size={11} />
                <span>WA</span>
              </a>
              <a
                href={VOXI_CONTACTS.phoneTel}
                title={`Позвонить: ${VOXI_CONTACTS.phoneDisplay}`}
                className="h-7 px-2.5 rounded-full bg-white hover:bg-black hover:text-white text-black border border-black/[0.08] font-mono font-semibold text-[10.5px] flex items-center justify-center transition-colors"
              >
                Тел
              </a>
            </div>
          </div>

          <div className="pt-0.5 px-1 flex items-center justify-between text-[12px] text-[#737373]">
            {onExitToLanding && (
              <button
                type="button"
                onClick={onExitToLanding}
                className="hover:text-black flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>На сайт</span>
              </button>
            )}

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="hover:text-[#FE432A] flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
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
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* 2. Main Content Canvas */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10 bg-white">
        {/* Sticky Editorial Topbar */}
        <header className="h-[64px] sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-black/[0.08] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Открыть меню разделов"
              className="lg:hidden w-9 h-9 rounded-full flex items-center justify-center text-black hover:bg-[#F5F5F5] cursor-pointer shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 min-w-0 shrink">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#737373] hidden md:inline">
                Кабинет
              </span>
              <span className="text-black/20 hidden md:inline">/</span>
              <span className="font-display text-[15px] font-bold tracking-[-0.02em] text-black truncate">
                {currentNav.label}
              </span>
            </div>

            <div
              className={`hidden xl:flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-medium shrink-0 ${
                isBotOnline
                  ? 'bg-[#F5F5F5] border-black/[0.06] text-black'
                  : isSuspended
                  ? 'bg-[#FFF5F3] border-[#FE432A]/30 text-[#B91C1C]'
                  : 'bg-[#F5F5F5] border-black/[0.06] text-[#737373]'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isBotOnline ? 'bg-[#16A34A] animate-pulse' : isSuspended ? 'bg-[#FE432A]' : 'bg-[#A3A3A3]'
                }`}
              />
              <span>
                {isBotOnline
                  ? 'Бот на линии · ответ 0.5 сек'
                  : isSuspended
                  ? 'Приём звонков приостановлен (лимит)'
                  : 'Бот поставлен на паузу'}
              </span>
            </div>

            {activeTab !== 'billing' && (
              <button
                type="button"
                onClick={() => setActiveTab('billing')}
                title="Открыть раздел тарифов, калькулятора и оплаты"
                className="hidden sm:flex items-center gap-2 pl-3 pr-1.5 py-1 rounded-full text-[12px] font-semibold bg-[#F5F5F5] hover:bg-[#EBEBEB] text-black border border-black/[0.06] transition-colors cursor-pointer shrink-0"
              >
                <span className="whitespace-nowrap font-mono text-[11px] tabular-nums">
                  {freeMins > 0 ? `${freeMins.toFixed(0)} мин` : `${unpaidDebtByn.toFixed(2)} BYN`}
                </span>
                <span className="text-[10.5px] px-2.5 py-0.5 rounded-full font-semibold whitespace-nowrap bg-[#D8E738] text-black">
                  Тариф ↗
                </span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsGuideOpen(true)}
              title="Краткая пошаговая шпаргалка по запуску"
              className="h-9 px-3.5 rounded-full bg-white hover:bg-[#F5F5F5] border border-black/[0.12] text-black text-[12px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-black" />
              <span className="hidden sm:inline">Как запустить?</span>
            </button>

            {hasEditableFormOnTab ? (
              <button
                type="button"
                onClick={handleGlobalSave}
                title="Сохранить текущие настройки"
                className="h-9 px-4 rounded-full bg-black hover:bg-[#171717] text-white text-[12px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <CheckCircle2 className="w-4 h-4 text-[#6BFF91] shrink-0" />
                <span className="hidden sm:inline">Сохранить изменения</span>
                <span className="sm:hidden">Сохранить</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsLiveTesterOpen(true)}
                title="Проверить диалог с вашим ботом голосом или текстом"
                className="h-9 px-4 rounded-full bg-black hover:bg-[#171717] text-white text-[12px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Radio className="w-4 h-4 text-[#6BFF91] shrink-0" />
                <span className="hidden sm:inline">Тестовый звонок</span>
                <span className="sm:hidden">Тест</span>
              </button>
            )}
          </div>
        </header>

        {/* Bottom-right Save / Error Toast */}
        {(saveToast || saveError) && (
          <div
            role={saveError ? 'alert' : 'status'}
            aria-live="polite"
            className={`fixed bottom-5 right-5 left-5 sm:left-auto sm:max-w-sm z-50 px-4 py-3.5 rounded-[16px] text-[13px] font-semibold flex items-center gap-2.5 shadow-xl border ${
              saveError
                ? 'bg-[#FFF5F3] text-[#991B1B] border-[#FE432A]/40'
                : 'bg-[#0A0A0A] text-white border-white/10'
            }`}
          >
            <CheckCircle2 className={`w-4 h-4 shrink-0 ${saveError ? 'text-[#FE432A]' : 'text-[#6BFF91]'}`} />
            <span>{saveError || saveToast}</span>
          </div>
        )}

        {/* Tab Body */}
        <div className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8 max-w-[1160px] mx-auto w-full">
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
              onOpenVoiceTest={() => setIsLiveTesterOpen(true)}
              onToggleActive={() => void handleSaveAgentWithToast({ ...agent, isActive: !agent.isActive }).catch(() => {})}
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
              onSaveTelegram={handleSaveTelegramWithToast}
              webhookSettings={webhookSettings}
              onSaveWebhook={handleSaveWebhookWithToast}
            />
          )}

          {activeTab === 'phone' && (
            <PhoneTab
              agent={agent}
              onSaveAgent={handleSaveAgentWithToast}
              sipSettings={sipSettings}
              onSaveSip={handleSaveSipWithToast}
              numberRentalMode={user.billing?.numberRentalMode}
              onUserUpdated={onUserUpdated}
            />
          )}

          {activeTab === 'billing' && (
            <BillingTab
              user={user}
              sipSettings={sipSettings}
              onSaveSip={handleSaveSipWithToast}
              onUserUpdated={onUserUpdated}
              onNavigateTab={(t) => setActiveTab(t)}
              initialSelectedPackage={initialSelectedPackage}
              onInitialPackageConsumed={onInitialPackageConsumed}
            />
          )}
        </div>
      </div>

      {/* Live Bot Tester Modal */}
      {isLiveTesterOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Тестовый звонок вашему боту"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs"
        >
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[24px] bg-white p-5 sm:p-6 shadow-2xl border border-black/[0.1]">
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-black/[0.08]">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-7 h-7 rounded-full bg-black text-[#6BFF91] flex items-center justify-center shrink-0">
                  <Radio className="w-3.5 h-3.5" />
                </span>
                <span className="font-display text-[14px] font-bold text-black truncate">
                  Тест бота · {agent.companyName || user.companyName}
                </span>
              </div>
              <button
                type="button"
                aria-label="Закрыть тестовый звонок"
                onClick={() => setIsLiveTesterOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#737373] hover:text-black hover:bg-[#F5F5F5] cursor-pointer shrink-0 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <LiveBotTester
              agent={agent}
              onCallCompleted={onCallCompleted}
            />
          </div>
        </div>
      )}

      {/* Guide Modal */}
      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
};
