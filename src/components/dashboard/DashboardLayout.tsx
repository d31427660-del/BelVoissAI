import React, { useState, useEffect } from 'react';
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
import { GuideModal } from './GuideModal';
import { VOXI_CONTACTS, TelegramIcon, WhatsAppIcon } from '../../lib/contacts';

interface DashboardLayoutProps {
  user: UserSession;
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
  onExitToLanding?: () => void;
  onLogout?: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  user,
  agent,
  onSaveAgent,
  sipSettings,
  onSaveSip,
  telegramSettings,
  onSaveTelegram,
  webhookSettings,
  onSaveWebhook,
  vapiApiKey,
  onSaveVapiApiKey,
  callLogs,
  onCallCompleted,
  onOpenVoiceTest,
  onOpenTopUp,
  onExitToLanding,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'agent' | 'leads' | 'phone'>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

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

  const leadsCount = callLogs.filter((c) => c.status === 'lead_captured').length || callLogs.length;

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
      label: 'Подключение номера',
      subtitle: 'Телефон и перевод звонков',
      icon: <PhoneCall className="w-4 h-4 shrink-0" />,
      badge: undefined
    }
  ];

  const allNavItems = primaryNavItems;
  const currentNav = allNavItems.find(n => n.id === activeTab) || primaryNavItems[0];
  const billing = user.billing;
  const freeMins = billing ? billing.freeMinutesRemaining : (user.balanceMinutes || 0);
  const unpaidDebtByn = billing ? billing.unpaidDebtByn : 0;
  const isSuspended = billing?.billingStatus === 'suspended' || (billing?.overdueInvoicesCount || 0) > 0;

  const renderNavButton = (item: typeof allNavItems[number]) => {
    const isActive = activeTab === item.id;
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => {
          setActiveTab(item.id);
          setIsMobileMenuOpen(false);
        }}
        className={`w-full text-left p-2.5 rounded-[12px] text-xs font-normal flex items-center justify-between transition-all cursor-pointer ${
          isActive
            ? 'liquid-glass-btn-primary text-white shadow-xs'
            : 'text-[#59544F] hover:text-black hover:bg-black/[0.04]'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={isActive ? 'text-white' : 'text-[#777169]'}>
            {item.icon}
          </span>
          <div className="truncate">
            <div className={isActive ? 'font-medium' : 'font-normal'}>{item.label}</div>
            <div className={`text-[10px] font-normal truncate ${isActive ? 'text-white/70' : 'text-[#777169]'}`}>
              {item.subtitle}
            </div>
          </div>
        </div>
        {item.badge && (
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono shrink-0 ${
              isActive ? 'bg-white/20 text-white' : 'liquid-glass-pill text-black'
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
      className="min-h-screen text-black flex font-sans selection:bg-black selection:text-white relative overflow-x-hidden"
      style={{
        backgroundColor: '#FAF7F2',
        backgroundImage: `
          radial-gradient(1300px 750px at 15% 5%, rgba(255, 142, 84, 0.24) 0%, transparent 60%),
          radial-gradient(1100px 650px at 85% 15%, rgba(251, 191, 36, 0.18) 0%, transparent 55%),
          radial-gradient(1200px 800px at 80% 50%, rgba(255, 150, 95, 0.16) 0%, transparent 55%),
          radial-gradient(1100px 750px at 15% 75%, rgba(255, 118, 62, 0.20) 0%, transparent 60%)
        `
      }}
    >
      {/* Luminous Warm Ambient Orbs */}
      <div
        className="pointer-events-none fixed top-0 left-[5%] w-[650px] h-[650px] rounded-full overflow-hidden z-0"
        style={{
          background: 'radial-gradient(circle, rgba(255, 142, 84, 0.20) 0%, rgba(251, 146, 60, 0.08) 45%, transparent 70%)',
          transform: 'translateZ(0)'
        }}
      />
      <div
        className="pointer-events-none fixed top-[35%] right-0 w-[680px] h-[680px] rounded-full overflow-hidden z-0"
        style={{
          background: 'radial-gradient(circle, rgba(251, 191, 36, 0.16) 0%, rgba(255, 150, 95, 0.08) 45%, transparent 70%)',
          transform: 'translateZ(0)'
        }}
      />
      <div
        className="pointer-events-none fixed bottom-0 left-[20%] w-[620px] h-[620px] rounded-full overflow-hidden z-0"
        style={{
          background: 'radial-gradient(circle, rgba(255, 118, 62, 0.16) 0%, rgba(251, 191, 36, 0.07) 45%, transparent 70%)',
          transform: 'translateZ(0)'
        }}
      />

      {/* 1. Left Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-[#FAF7F2]/85 backdrop-blur-xl border-r border-black/[0.06] flex flex-col justify-between transition-transform duration-200 ease-in-out
          lg:static lg:translate-x-0
          ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:shadow-none'}
        `}
      >
        <div className="p-4 space-y-4">
          {/* Workspace Brand */}
          <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
            <button
              type="button"
              onClick={onExitToLanding}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
              title="Перейти на главную страницу сайта"
            >
              <div
                className="w-7 h-7 rounded-lg bg-black p-[1px] transition-transform group-hover:scale-105 shrink-0"
                aria-hidden="true"
              >
                <div className="w-full h-full rounded-[7px] bg-white flex items-center justify-center gap-[2.5px]">
                  <span className="w-[2.5px] h-3 rounded-full bg-black" />
                  <span className="w-[2.5px] h-3 rounded-full bg-black" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-0.5 font-semibold text-xs tracking-tight text-black group-hover:opacity-80 transition-opacity">
                  <span className="text-sm font-semibold">Voxi</span>
                  <span className="text-xs font-medium font-mono text-[#777169]">.by</span>
                </div>
                <div className="text-[10px] text-[#777169]">Личный кабинет</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Закрыть меню"
              className="lg:hidden p-1 text-[#777169] hover:text-black cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Company Status Pill */}
          <div className="p-2.5 rounded-[12px] bg-white/70 backdrop-blur-xs border border-black/[0.06] space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-medium text-black truncate">
                {agent.companyName || user.companyName || 'Моя компания'}
              </span>
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  agent.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'
                }`}
                title={agent.isActive ? 'Бот принимает звонки' : 'Бот на паузе'}
              />
            </div>
            <div className="text-[10px] text-[#777169] flex items-center justify-between">
              <span className="font-mono truncate">{sipSettings.callerId}</span>
              <span className={agent.isActive ? 'text-emerald-700 font-medium' : 'text-[#777169]'}>
                {agent.isActive ? 'Включен' : 'Пауза'}
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1 pt-1" aria-label="Разделы кабинета">
            <span className="block text-[10px] font-medium text-[#777169] uppercase tracking-wider px-2 pb-1">
              Разделы
            </span>
            {primaryNavItems.map(renderNavButton)}
          </nav>
        </div>

        {/* Bottom Sidebar: Monthly Postpaid Billing */}
        <div className="p-4 border-t border-black/[0.06] space-y-3 bg-[#FAF7F2]/60">
          <div className="space-y-2 p-3.5 rounded-[12px] liquid-glass-card">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-normal text-black">
                <Wallet className="w-3.5 h-3.5 text-black" />
                <span>К оплате за месяц:</span>
              </span>
              <span className={`font-mono font-medium text-sm ${isSuspended ? 'text-rose-600' : 'text-black'}`}>
                {unpaidDebtByn.toFixed(2)} BYN
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#777169]">
              <span>
                {freeMins > 0 ? `Бонус: ${freeMins.toFixed(1)} мин` : `Тариф: ${(user.ratePerMinute || 0.45).toFixed(2)} BYN/мин`}
              </span>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${
                isSuspended
                  ? 'text-rose-700 bg-rose-50 border-rose-200'
                  : 'text-emerald-700 bg-emerald-50 border-emerald-200/60'
              }`}>
                {isSuspended ? 'Просрочка' : 'Постоплата'}
              </span>
            </div>

            <button
              type="button"
              onClick={onOpenTopUp}
              className={`w-full mt-1 py-1.5 px-3 rounded-full text-xs font-normal transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                isSuspended
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'liquid-glass-pill text-black hover:bg-white'
              }`}
            >
              <span>{unpaidDebtByn > 0 ? 'Счета и оплата' : 'Детализация месяца'}</span>
            </button>
          </div>

          {/* Quick Manager Contacts */}
          <div className="p-2.5 rounded-[12px] bg-white/60 border border-black/[0.06] space-y-1.5 text-[11px]">
            <div className="text-[#777169] font-medium flex items-center justify-between">
              <span>Персональный менеджер</span>
              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full font-medium">Онлайн</span>
            </div>
            <div className="flex items-center gap-1.5">
              <a
                href={VOXI_CONTACTS.telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={`Написать менеджеру в Telegram (${VOXI_CONTACTS.telegramHandle})`}
                className="flex-1 py-1 px-2 rounded-md bg-black/[0.04] hover:bg-[#0088cc] hover:text-white text-black font-medium text-[10px] flex items-center justify-center gap-1 transition-colors"
              >
                <TelegramIcon size={11} />
                <span>Telegram</span>
              </a>
              <a
                href={VOXI_CONTACTS.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Написать менеджеру в WhatsApp"
                className="flex-1 py-1 px-2 rounded-md bg-black/[0.04] hover:bg-[#25D366] hover:text-white text-black font-medium text-[10px] flex items-center justify-center gap-1 transition-colors"
              >
                <WhatsAppIcon size={11} />
                <span>WhatsApp</span>
              </a>
              <a
                href={VOXI_CONTACTS.phoneTel}
                title={`Позвонить: ${VOXI_CONTACTS.phoneDisplay}`}
                className="py-1 px-2 rounded-md bg-black/[0.04] hover:bg-black hover:text-white text-black font-mono text-[10px] flex items-center justify-center transition-colors"
              >
                Тел
              </a>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-[#777169] border-t border-black/[0.06]">
            {onExitToLanding && (
              <button
                type="button"
                onClick={onExitToLanding}
                className="hover:text-black flex items-center gap-1 font-normal transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>На сайт</span>
              </button>
            )}

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="hover:text-rose-600 flex items-center gap-1 font-normal transition-colors cursor-pointer"
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
          className="fixed inset-0 bg-black/20 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* 2. Main Content Canvas */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Compact Workspace Topbar */}
        <header className="h-14 sticky top-0 z-30 bg-[#FAF7F2]/85 backdrop-blur-md border-b border-black/[0.06] px-4 sm:px-6 flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Открыть меню разделов"
              className="lg:hidden p-1.5 rounded-lg text-[#777169] hover:text-black hover:bg-black/[0.04] cursor-pointer shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-normal text-black min-w-0 shrink">
              <span className="text-[#777169] hidden md:inline">Кабинет</span>
              <span className="text-black/20 hidden md:inline">/</span>
              <span className="truncate font-medium">{currentNav.label}</span>
            </div>

            <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full liquid-glass-pill text-[11px] font-normal text-black shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{agent.isActive ? 'Бот на линии • отвечает за 0.5 сек' : 'Бот поставлен на паузу'}</span>
            </div>

            <button
              type="button"
              onClick={onOpenTopUp}
              title="Счета и досрочная оплата за месяц"
              className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-xs font-normal liquid-glass-pill text-black hover:bg-white transition-all cursor-pointer shrink-0"
            >
              <Wallet className="w-3.5 h-3.5 text-black shrink-0" />
              <span className="whitespace-nowrap">{unpaidDebtByn.toFixed(2)} BYN</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ml-0.5 font-normal whitespace-nowrap ${
                isSuspended ? 'bg-rose-600 text-white' : 'bg-black text-white'
              }`}>
                {isSuspended ? 'Оплатить долг' : 'Счёт месяца'}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsGuideOpen(true)}
              title="Краткая пошаговая шпаргалка по запуску"
              className="px-3 py-1.5 rounded-full liquid-glass-pill text-black text-xs font-normal flex items-center gap-1.5 transition-colors cursor-pointer hover:bg-white"
            >
              <HelpCircle className="w-3.5 h-3.5 text-black" />
              <span className="hidden sm:inline">Как запустить?</span>
            </button>

            <button
              type="button"
              onClick={handleGlobalSave}
              title="Сохранить текущие настройки бота"
              className="px-4 py-1.5 rounded-full liquid-glass-btn-primary text-white text-xs font-normal flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              <span>Сохранить</span>
            </button>
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
                else setActiveTab('overview');
              }}
              onOpenVoiceTest={onOpenVoiceTest}
              onToggleActive={() => onSaveAgent({ ...agent, isActive: !agent.isActive })}
              onOpenTopUp={onOpenTopUp}
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
