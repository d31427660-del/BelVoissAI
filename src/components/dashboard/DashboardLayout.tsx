import React, { useState, useEffect } from 'react';
import {
  Widget5Icon as LayoutDashboard,
  CpuBoltIcon as Bot,
  ShareCircleIcon as Network,
  PhoneCallingRoundedIcon as PhoneCall,
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
import { IntegrationsTab } from './IntegrationsTab';
import { CallLogsTab } from './CallLogsTab';
import { GuideModal } from './GuideModal';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'agent' | 'calls' | 'integrations'>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  const handleGlobalSave = () => {
    const activeForm = document.getElementById('active-workspace-form') as HTMLFormElement | null;
    if (activeForm) {
      activeForm.requestSubmit();
    } else {
      onSaveAgent(agent);
    }
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2600);
  };

  const primaryNavItems = [
    {
      id: 'overview' as const,
      label: 'Главная',
      subtitle: 'Статус бота и быстрые шаги',
      icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
      badge: undefined
    },
    {
      id: 'agent' as const,
      label: 'Настройка бота',
      subtitle: 'Голос, услуги и цены',
      icon: <Bot className="w-4 h-4 shrink-0" />,
      badge: undefined
    },
    {
      id: 'calls' as const,
      label: 'Журнал звонков',
      subtitle: 'Заявки и записи бесед',
      icon: <PhoneCall className="w-4 h-4 shrink-0" />,
      badge: `${callLogs.length}`
    },
    {
      id: 'integrations' as const,
      label: 'Номер и заявки',
      subtitle: 'Телефон, YCLIENTS, SMS, Telegram',
      icon: <Network className="w-4 h-4 shrink-0" />,
      badge: undefined
    }
  ];

  const allNavItems = primaryNavItems;
  const currentNav = allNavItems.find(n => n.id === activeTab) || primaryNavItems[0];
  const isLowBalance = (user.balanceMinutes || 0) < 25;
  const balanceByn = ((user.balanceMinutes || 0) * (user.ratePerMinute || 0.45)).toFixed(1);

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
    <div className="min-h-screen bg-[#F5F3F1] text-black flex font-sans selection:bg-black selection:text-white">
      {/* 1. Left Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white/80 backdrop-blur-xl border-r border-black/[0.06] flex flex-col justify-between transition-transform duration-200 ease-in-out
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
          <div className="p-2.5 rounded-[12px] bg-[#F5F3F1]/70 border border-black/[0.06] space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-medium text-black truncate">
                {agent.companyName}
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

        {/* Bottom Sidebar: Minute Balance & Actions */}
        <div className="p-4 border-t border-black/[0.06] space-y-3 bg-[#F5F3F1]/40">
          <div className="space-y-2 p-3.5 rounded-[12px] liquid-glass-card">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-normal text-black">
                <Wallet className="w-3.5 h-3.5 text-black" />
                <span>Остаток минут:</span>
              </span>
              <span className={`font-mono font-medium text-sm ${isLowBalance ? 'text-amber-600' : 'text-black'}`}>
                {user.balanceMinutes} мин
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#777169]">
              <span>~{balanceByn} BYN</span>
              <span className="text-[10px] text-emerald-700 font-medium px-1.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/60">
                Не сгорают
              </span>
            </div>

            <button
              type="button"
              onClick={onOpenTopUp}
              className="w-full mt-1 py-1.5 px-3 rounded-full liquid-glass-pill text-black text-xs font-normal transition-colors flex items-center justify-center gap-1.5 cursor-pointer hover:bg-white"
            >
              <span>+ Пополнить баланс</span>
            </button>
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
      <div className="flex-1 flex flex-col min-w-0">
        {/* Compact Workspace Topbar */}
        <header className="h-14 sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-black/[0.06] px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Открыть меню разделов"
              className="lg:hidden p-1.5 rounded-lg text-[#777169] hover:text-black hover:bg-black/[0.04] cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs font-normal text-black min-w-0">
              <span className="text-[#777169] hidden sm:inline">Кабинет</span>
              <span className="text-black/20 hidden sm:inline">/</span>
              <span className="truncate font-medium">{currentNav.label}</span>
            </div>

            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full liquid-glass-pill text-[11px] font-normal text-black">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{agent.isActive ? 'Бот на линии • отвечает за 0.5 сек' : 'Бот поставлен на паузу'}</span>
            </div>

            <button
              type="button"
              onClick={onOpenTopUp}
              title="Пополнить пакет минут"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-normal liquid-glass-pill text-black hover:bg-white transition-all cursor-pointer"
            >
              <Wallet className="w-3.5 h-3.5 text-black" />
              <span>{user.balanceMinutes} мин</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black text-white ml-0.5 font-normal">
                + Пополнить
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
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
              onNavigateTab={(t) => setActiveTab(t)}
              onOpenVoiceTest={onOpenVoiceTest}
              onToggleActive={() => onSaveAgent({ ...agent, isActive: !agent.isActive })}
              onOpenTopUp={onOpenTopUp}
            />
          )}

          {activeTab === 'agent' && (
            <SimpleAgentTab
              agent={agent}
              onSaveAgent={onSaveAgent}
              onCallCompleted={onCallCompleted}
            />
          )}

          {activeTab === 'calls' && (
            <CallLogsTab
              callLogs={callLogs}
              agent={agent}
            />
          )}

          {activeTab === 'integrations' && (
            <IntegrationsTab
              agent={agent}
              onSaveAgent={onSaveAgent}
              sipSettings={sipSettings}
              onSaveSip={onSaveSip}
              telegramSettings={telegramSettings}
              onSaveTelegram={onSaveTelegram}
              webhookSettings={webhookSettings}
              onSaveWebhook={onSaveWebhook}
              vapiApiKey={vapiApiKey}
              onSaveVapiApiKey={onSaveVapiApiKey}
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
