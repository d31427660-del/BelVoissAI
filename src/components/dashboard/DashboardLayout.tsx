import React, { useState } from 'react';
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
  MagicWand3Icon as Sparkles,
  GraphNewUpIcon as TrendingUp,
  WalletMoneyIcon as Wallet
} from '@solar-icons/react/bold-duotone';
import { AgentConfig, CallLog, SipSettings, TelegramSettings, WebhookSettings, UserSession } from '../../types';
import { SimpleOverviewTab } from './SimpleOverviewTab';
import { SimpleAgentTab } from './SimpleAgentTab';
import { OverviewTab } from './OverviewTab';
import { IntegrationsTab } from './IntegrationsTab';
import { CallLogsTab } from './CallLogsTab';
import { MysteryCallerTab } from './MysteryCallerTab';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'agent' | 'calls' | 'analytics' | 'integrations' | 'mystery'>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  const displayCallLogs = user.isMock
    ? callLogs.filter((c) => !c.niche || c.niche === agent.niche)
    : callLogs;

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
      badge: `${displayCallLogs.length}`
    },
    {
      id: 'analytics' as const,
      label: 'Аналитика и ROI',
      subtitle: 'Нагрузка 24/7, графики, ФОТ',
      icon: <TrendingUp className="w-4 h-4 shrink-0" />,
      badge: undefined
    }
  ];

  const secondaryNavItems = [
    {
      id: 'integrations' as const,
      label: 'Номер и заявки',
      subtitle: 'Телефон, Telegram и CRM',
      icon: <Network className="w-4 h-4 shrink-0" />,
      badge: undefined
    },
    {
      id: 'mystery' as const,
      label: 'Проверка звонков',
      subtitle: 'Демо-пример для компаний',
      icon: <Sparkles className="w-4 h-4 shrink-0" />,
      badge: undefined
    }
  ];

  const allNavItems = [...primaryNavItems, ...secondaryNavItems];
  const currentNav = allNavItems.find(n => n.id === activeTab) || primaryNavItems[0];
  const isLowBalance = user.balanceMinutes < 25;
  const balanceByn = (user.balanceMinutes * user.ratePerMinute).toFixed(1);

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
        className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
          isActive
            ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={isActive ? 'text-white' : 'text-slate-500'}>
            {item.icon}
          </span>
          <div className="truncate">
            <div>{item.label}</div>
            <div className={`text-[10px] font-normal truncate ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
              {item.subtitle}
            </div>
          </div>
        </div>
        {item.badge && (
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono shrink-0 ${
              isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex font-sans selection:bg-blue-600 selection:text-white">
      {/* 1. Left Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between transition-transform duration-200 ease-in-out
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
              className="flex items-center gap-2.5 text-left group"
              title="Перейти на главную страницу сайта"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-0.5 font-bold text-xs tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                  <span className="text-sm">Voxi</span>
                  <span className="text-xs font-bold text-blue-600">.by</span>
                </div>
                <div className="text-[10px] text-slate-400">Личный кабинет</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Закрыть меню"
              className="lg:hidden p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Company Status Pill */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-900 truncate">
                {agent.companyName}
              </span>
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  agent.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
                title={agent.isActive ? 'Бот принимает звонки' : 'Бот на паузе'}
              />
            </div>
            <div className="text-[10px] text-slate-500 flex items-center justify-between">
              <span className="font-mono truncate">{sipSettings.callerId}</span>
              <span className={agent.isActive ? 'text-emerald-700 font-medium' : 'text-slate-400'}>
                {agent.isActive ? 'Включен' : 'Пауза'}
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1 pt-1" aria-label="Разделы кабинета">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pb-1">
              Основное
            </span>
            {primaryNavItems.map(renderNavButton)}

            <div className="pt-3 space-y-1">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pb-1">
                Подключение и инструменты
              </span>
              {secondaryNavItems.map(renderNavButton)}
            </div>
          </nav>

          {/* Test Call Quick Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={onOpenVoiceTest}
              className="w-full py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              title="Поговорить с ботом через микрофон прямо в браузере"
            >
              <Radio className="w-4 h-4 text-blue-600" />
              <span>Поговорить с ботом (тест)</span>
            </button>
          </div>
        </div>

        {/* Bottom Sidebar: Minute Balance & Actions */}
        <div className="p-4 border-t border-slate-100 space-y-3 bg-slate-50/50">
          <div className="space-y-2 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                <Wallet className="w-3.5 h-3.5 text-[#2563eb]" />
                <span>Остаток минут:</span>
              </span>
              <span className={`font-mono font-bold text-sm ${isLowBalance ? 'text-amber-600' : 'text-slate-900'}`}>
                {user.balanceMinutes} мин
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>~{balanceByn} BYN</span>
              <span className="text-[10px] text-emerald-700 font-semibold px-1.5 py-0.5 rounded bg-emerald-50">
                Не сгорают
              </span>
            </div>

            <button
              type="button"
              onClick={onOpenTopUp}
              className="w-full mt-1 py-1.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#2563eb] text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <span>+ Пополнить баланс</span>
            </button>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-200/60">
            {onExitToLanding && (
              <button
                type="button"
                onClick={onExitToLanding}
                className="hover:text-slate-900 flex items-center gap-1 font-medium transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>На сайт</span>
              </button>
            )}

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="hover:text-rose-600 flex items-center gap-1 font-medium transition-colors"
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
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* 2. Main Content Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Compact Workspace Topbar */}
        <header className="h-14 sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Открыть меню разделов"
              className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 min-w-0">
              <span className="text-slate-400 font-normal hidden sm:inline">Кабинет</span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <span className="truncate">{currentNav.label}</span>
            </div>

            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-medium text-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{agent.isActive ? 'Бот на линии • отвечает за 0.5 сек' : 'Бот поставлен на паузу'}</span>
            </div>

            <button
              type="button"
              onClick={onOpenTopUp}
              title="Пополнить пакет минут"
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                isLowBalance
                  ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
                  : 'bg-blue-50/80 border-blue-200 text-[#2563eb] hover:bg-blue-100'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>{user.balanceMinutes} мин</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white border border-blue-200/80 ml-0.5">
                + Пополнить
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsGuideOpen(true)}
              title="Краткая пошаговая шпаргалка по запуску"
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Как запустить?</span>
            </button>

            <button
              type="button"
              onClick={handleGlobalSave}
              title="Сохранить текущие настройки бота"
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
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
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'overview' && (
            <SimpleOverviewTab
              user={user}
              agent={agent}
              callLogs={displayCallLogs}
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
              callLogs={displayCallLogs}
              agent={agent}
            />
          )}

          {activeTab === 'analytics' && (
            <OverviewTab
              user={user}
              agent={agent}
              callLogs={displayCallLogs}
              sipSettings={sipSettings}
              telegramSettings={telegramSettings}
              onNavigateTab={(t) => setActiveTab(t as any)}
              onOpenTopUp={onOpenTopUp}
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

          {activeTab === 'mystery' && (
            <MysteryCallerTab
              currentVoice={agent.voice}
            />
          )}
        </main>
      </div>

      {/* Guide Modal */}
      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
};
