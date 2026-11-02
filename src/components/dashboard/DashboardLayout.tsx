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
  ShieldCheckIcon as ShieldCheck,
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
  onOpenVoiceTest,
  onOpenTopUp,
  onExitToLanding,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'agent' | 'calls' | 'analytics' | 'integrations' | 'mystery'>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  const nicheCallLogs = callLogs.filter(c => !c.niche || c.niche === agent.niche);
  const displayCallLogs = nicheCallLogs.length > 0 ? nicheCallLogs : callLogs;

  const handleGlobalSave = () => {
    onSaveAgent(agent);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2600);
  };

  const primaryNavItems = [
    {
      id: 'overview' as const,
      label: 'Главная',
      subtitle: 'Статус, показатели, звонки',
      icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
      badge: undefined
    },
    {
      id: 'agent' as const,
      label: 'Ассистент',
      subtitle: 'Сфера, голос, контакты (2 мин)',
      icon: <Bot className="w-4 h-4 shrink-0" />,
      badge: undefined
    },
    {
      id: 'calls' as const,
      label: 'Журнал звонков',
      subtitle: 'Заявки клиентов и аудио',
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
      label: 'Телефония и SIP',
      subtitle: 'А1, МТС, трансфер звонков',
      icon: <Network className="w-4 h-4 shrink-0" />,
      badge: 'BYO-SIP'
    },
    {
      id: 'mystery' as const,
      label: 'Тайный звонок (GTM)',
      subtitle: 'Аудит потерь и демо-продажи',
      icon: <Sparkles className="w-4 h-4 shrink-0" />,
      badge: 'PRO'
    }
  ];

  const allNavItems = [...primaryNavItems, ...secondaryNavItems];
  const currentNav = allNavItems.find(n => n.id === activeTab) || primaryNavItems[0];
  const isLowBalance = user.balanceMinutes < 25;
  const balanceByn = (user.balanceMinutes * user.ratePerMinute).toFixed(1);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex font-sans selection:bg-blue-600 selection:text-white">
      
      {/* 1. Left Sidebar (Apple/Linear High-End Workspace) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between transition-transform duration-200 ease-in-out
        lg:static lg:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:shadow-none'}
      `}>
        <div className="p-4 space-y-4">
          
          {/* Workspace Brand & Switcher */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <button
              onClick={onExitToLanding}
              className="flex items-center gap-2.5 text-left group"
              title="Перейти на главную страницу"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1 font-bold text-xs tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                  <span className="text-sm">Voxi</span>
                  <span className="text-[10px] font-bold text-blue-600">.by</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">Workspace РБ</div>
              </div>
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Company Workspace Pill Card */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-900 truncate">
                {agent.companyName}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Линия активна"></span>
            </div>
            <div className="text-[10px] text-slate-500 flex items-center justify-between font-mono">
              <span>{sipSettings.callerId}</span>
              <span className="text-emerald-700 font-medium">МТС SIP</span>
            </div>
          </div>

          {/* Primary Navigation (3 Core Essentials) */}
          <nav className="space-y-1 pt-1">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pb-1">
              Основное:
            </span>
            {primaryNavItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
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
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono shrink-0 ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Advanced / Power Tools Section */}
            <div className="pt-3">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pb-1">
                Связь и рост:
              </span>
              {secondaryNavItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded-xl text-xs font-medium flex items-center justify-between transition-all ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={isActive ? 'text-white' : 'text-slate-400'}>
                        {item.icon}
                      </span>
                      <div className="truncate">
                        <div className="text-xs">{item.label}</div>
                      </div>
                    </div>
                    {item.badge && (
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono shrink-0 ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Test Call Quick Button */}
          <div className="pt-2">
            <button
              onClick={onOpenVoiceTest}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm shadow-blue-500/20 transition-all"
            >
              <Radio className="w-4 h-4 text-white" />
              <span>Тест звонка (0.5 сек)</span>
            </button>
          </div>

        </div>

        {/* Bottom Sidebar: Minute Balance & Actions */}
        <div className="p-4 border-t border-slate-100 space-y-3 bg-slate-50/50">
          
          {/* Minutes Balance Meter */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                <Wallet className="w-3.5 h-3.5 text-[#2563eb]" />
                <span>Баланс:</span>
              </span>
              <span className={`font-mono font-bold text-sm ${isLowBalance ? 'text-amber-600' : 'text-slate-900'}`}>
                {user.balanceMinutes} мин
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>~{balanceByn} BYN</span>
              <span className="text-[10px] text-emerald-600 font-semibold px-1.5 py-0.5 rounded bg-emerald-50">Бессрочные</span>
            </div>

            <button
              onClick={onOpenTopUp}
              className="w-full mt-1 py-1.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#2563eb] text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <span>+ Пополнить минуты</span>
            </button>
          </div>

          {/* Back to Site & Logout Links */}
          <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-200/60">
            {onExitToLanding && (
              <button
                onClick={onExitToLanding}
                className="hover:text-slate-900 flex items-center gap-1 font-medium transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>На сайт</span>
              </button>
            )}

            {onLogout && (
              <button
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
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 lg:hidden"
        ></div>
      )}

      {/* 2. Main Content Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Compact Workspace Topbar (Apple/Linear Style, 56px) */}
        <header className="h-14 sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb Title */}
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 min-w-0">
              <span className="text-slate-400 font-normal hidden sm:inline">Панель управления</span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <span className="truncate">{currentNav.label}</span>
            </div>

            {/* Live Status Pill */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-medium text-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Линия МТС активна • Задержка 0.45с</span>
            </div>

            {/* Quick Balance Topbar Widget */}
            <button
              onClick={onOpenTopUp}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
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

          {/* Right Topbar Actions */}
          <div className="flex items-center gap-2">
            
            <button
              onClick={() => setIsGuideOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Инструкция (3 мин)</span>
            </button>

            <button
              onClick={handleGlobalSave}
              className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-medium flex items-center gap-1.5 transition-all shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Сохранить</span>
            </button>

          </div>

        </header>

        {/* Save confirmation toast */}
        {saveToast && (
          <div className="fixed top-16 right-6 z-50 p-3 rounded-xl bg-slate-900 text-white text-xs flex items-center gap-2 shadow-xl border border-slate-700 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Все настройки ассистента сохранены в базе!</span>
          </div>
        )}

        {/* Tab Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
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
              callLogs={callLogs}
              sipSettings={sipSettings}
              telegramSettings={telegramSettings}
              onNavigateTab={(t) => setActiveTab(t as any)}
              onOpenTopUp={onOpenTopUp}
            />
          )}

          {activeTab === 'integrations' && (
            <IntegrationsTab
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
