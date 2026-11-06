import React, { useState, useEffect } from 'react';
import {
  Widget5Icon as DashboardIcon,
  UsersGroupTwoRoundedIcon as UsersIcon,
  ChatRoundDotsIcon,
  WalletMoneyIcon as WalletIcon,
  PhoneCallingRoundedIcon as TelephonyIcon,
  SettingsIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  CloseCircleIcon,
  RefreshIcon,
  ArrowLeftIcon,
  Logout2Icon,
  MagnifierIcon,
  DocumentTextIcon,
  BellIcon
} from '@solar-icons/react/bold-duotone';
import {
  INITIAL_PLATFORM_CLIENTS,
  INITIAL_TRANSACTIONS,
  INITIAL_TELEPHONY_LOGS,
  PlatformClient,
  PlatformTransaction,
  PlatformTelephonyLog
} from '../../lib/adminData';
import { LiveChatTab } from '../dashboard/LiveChatTab';
import { liveChatService } from '../../lib/liveChatService';

interface AdminPanelProps {
  onExitToLanding: () => void;
  onNavigateToUserDashboard?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  onExitToLanding,
  onNavigateToUserDashboard
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return Boolean(sessionStorage.getItem('voxi_admin_auth') === 'true');
  });
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'livechat' | 'billing' | 'telephony' | 'settings'>('overview');
  const [clients, setClients] = useState<PlatformClient[]>(INITIAL_PLATFORM_CLIENTS);
  const [transactions, setTransactions] = useState<PlatformTransaction[]>(INITIAL_TRANSACTIONS);
  const [telephonyLogs] = useState<PlatformTelephonyLog[]>(INITIAL_TELEPHONY_LOGS);
  const [clientSearch, setClientSearch] = useState<string>('');
  const [selectedClientForRefill, setSelectedClientForRefill] = useState<PlatformClient | null>(null);
  const [refillAmountMinutes, setRefillAmountMinutes] = useState<number>(50);
  const [unreadLiveChats, setUnreadLiveChats] = useState<number>(0);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    return liveChatService.subscribe((convs) => {
      const unread = convs.reduce((sum, c) => sum + (c.unreadByAdmin || 0), 0);
      setUnreadLiveChats(unread);
    });
  }, []);

  const showToast = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Master PIN or admin password
    if (pinInput.trim() === '7788' || pinInput.trim() === 'admin2026' || pinInput.trim() === 'voxi') {
      setIsAuthenticated(true);
      sessionStorage.setItem('voxi_admin_auth', 'true');
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('voxi_admin_auth');
    setIsAuthenticated(false);
    setPinInput('');
  };

  const handleQuickAddMinutes = (clientId: string, minutes: number) => {
    setClients((prev) =>
      prev.map((c) => {
        if (c.id === clientId) {
          const nextBal = c.balanceMinutes + minutes;
          return { ...c, balanceMinutes: nextBal };
        }
        return c;
      })
    );
    showToast(`Начислено +${minutes} минут клиенту!`);
    setSelectedClientForRefill(null);
  };

  const handleToggleClientActive = (clientId: string) => {
    setClients((prev) =>
      prev.map((c) => {
        if (c.id === clientId) {
          const nextActive = !c.isActive;
          return { ...c, isActive: nextActive };
        }
        return c;
      })
    );
    showToast('Статус клиента обновлен');
  };

  // KPI calculations
  const totalRevenueByn = transactions
    .filter((t) => t.status === 'successful')
    .reduce((sum, t) => sum + t.amountByn, 0);

  const totalMinutesSpent = clients.reduce((sum, c) => sum + c.spentMinutesTotal, 0);
  const totalActiveClients = clients.filter((c) => c.isActive).length;

  const filteredClients = clients.filter(
    (c) =>
      c.companyName.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.unp.includes(clientSearch) ||
      c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.phone.includes(clientSearch)
  );

  // If not authenticated, render master admin PIN screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center space-y-2 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center mx-auto text-white shadow-xl shadow-blue-500/20">
              <ShieldCheckIcon size={32} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">Панель управления Voxi.by</h1>
            <p className="text-xs text-slate-400">
              Вход для оператора платформы (ИП Беляков К. О. • УНП 193991846)
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Мастер PIN-код или пароль администратора
              </label>
              <input
                type="password"
                autoFocus
                placeholder="Введите PIN (демо: 7788)"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                className={`w-full bg-slate-950 border rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors ${
                  pinError
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-slate-800 focus:border-blue-500'
                }`}
              />
              {pinError && (
                <p className="text-xs text-red-400 mt-1">Неверный PIN-код (используйте 7788)</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-500/25 cursor-pointer"
            >
              Войти в панель администратора
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <button
              type="button"
              onClick={onExitToLanding}
              className="text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeftIcon size={14} />
              Вернуться на сайт
            </button>
            <span className="text-[11px] text-slate-400">Версия платформы 2.4</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onExitToLanding}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            title="Вернуться на главную"
          >
            <ArrowLeftIcon size={16} />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-base font-extrabold tracking-tight text-white">
              Voxi<span className="text-blue-500">.by</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
              MASTER ADMIN
            </span>
          </div>
        </div>

        {/* Global Action Notices */}
        {actionNotice && (
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-medium animate-in fade-in">
            <CheckCircleIcon size={14} />
            <span>{actionNotice}</span>
          </div>
        )}

        <div className="flex items-center gap-2 sm:gap-3">
          {onNavigateToUserDashboard && (
            <button
              type="button"
              onClick={onNavigateToUserDashboard}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
            >
              <span>Кабинет клиента</span>
            </button>
          )}

          <div className="h-4 w-px bg-slate-800 hidden md:block" />

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-medium transition-colors cursor-pointer"
            title="Выйти из админки"
          >
            <Logout2Icon size={14} />
            <span className="hidden sm:inline">Выйти</span>
          </button>
        </div>
      </header>

      {/* Main Layout: Sidebar + Workspace */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 bg-slate-900/60 border-b md:border-b-0 md:border-r border-slate-800/80 p-3 sm:p-4 shrink-0 flex flex-row md:flex-col gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
            }`}
          >
            <DashboardIcon size={18} />
            <span>Сводка платформы</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('clients')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'clients'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <UsersIcon size={18} />
              <span>Клиенты и балансы</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
              {clients.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('livechat')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'livechat'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <ChatRoundDotsIcon size={18} />
              <span>Чат с посетителями</span>
            </div>
            {unreadLiveChats > 0 ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500 text-white font-bold animate-pulse">
                +{unreadLiveChats}
              </span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('billing')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'billing'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
            }`}
          >
            <WalletIcon size={18} />
            <span>Финансы и акты РБ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('telephony')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'telephony'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
            }`}
          >
            <TelephonyIcon size={18} />
            <span>Мониторинг звонков</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
            }`}
          >
            <SettingsIcon size={18} />
            <span>Настройки платформы</span>
          </button>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Top KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span>Выручка платформы</span>
                    <WalletIcon size={18} className="text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold text-white tracking-tight">
                    {totalRevenueByn.toFixed(2)} BYN
                  </div>
                  <div className="text-[11px] text-emerald-400 font-medium mt-1">
                    ↑ bePaid, ЕРИП и безнал
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span>Выговорено минут</span>
                    <TelephonyIcon size={18} className="text-blue-400" />
                  </div>
                  <div className="text-2xl font-bold text-white tracking-tight">
                    {totalMinutesSpent.toFixed(1)} мин
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Средний тариф: 0.40 BYN/мин
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span>Компаний на линии</span>
                    <UsersIcon size={18} className="text-indigo-400" />
                  </div>
                  <div className="text-2xl font-bold text-white tracking-tight">
                    {totalActiveClients} из {clients.length}
                  </div>
                  <div className="text-[11px] text-indigo-400 font-medium mt-1">
                    Минск, Брест (100% SLA)
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span>Экономия через AMD</span>
                    <ShieldCheckIcon size={18} className="text-amber-400" />
                  </div>
                  <div className="text-2xl font-bold text-white tracking-tight">
                    42.50 BYN
                  </div>
                  <div className="text-[11px] text-amber-400 font-medium mt-1">
                    85 автоответчиков отсечено
                  </div>
                </div>
              </div>

              {/* Realtime System Infrastructure Status */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-white">Статус инфраструктуры Беларуси</h2>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30">
                    Все системы в норме (99.9% SLA)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-200">bePaid РБ (ЕРИП / Карты)</div>
                      <div className="text-[11px] text-slate-400">Шлюз платежей онлайн</div>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-200">МТС SIP (sip.mts.by)</div>
                      <div className="text-[11px] text-slate-400">Задержка 24 мс</div>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-200">А1 SIP (sip.a1.by)</div>
                      <div className="text-[11px] text-slate-400">Задержка 26 мс</div>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-200">ISPmanager MySQL (hoster.by)</div>
                      <div className="text-[11px] text-slate-400">Пул соединений активен</div>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  </div>
                </div>
              </div>

              {/* Recent Call Events */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-white">Свежие звонки клиентов</h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab('telephony')}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                  >
                    Посмотреть все →
                  </button>
                </div>

                <div className="divide-y divide-slate-850">
                  {telephonyLogs.slice(0, 3).map((log) => (
                    <div key={log.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                      <div>
                        <div className="font-semibold text-white">{log.companyName}</div>
                        <div className="text-slate-400 text-[11px]">
                          Клиент: <span className="text-slate-300">{log.callerPhone}</span> • Транк: {log.sipTrunk}
                        </div>
                        <p className="text-slate-400 text-[11px] mt-1 bg-slate-950/60 p-2 rounded-lg border border-slate-850">
                          {log.transcriptSnippet}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold">
                          +{log.costByn.toFixed(2)} BYN
                        </span>
                        <div className="text-slate-500 text-[10px] mt-1">{log.timestamp}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CLIENTS & BALANCES */}
          {activeTab === 'clients' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-white">Управление клиентами</h2>
                  <p className="text-xs text-slate-400">
                    Начисление минут, тарификация в BYN и настройка SIP-линий компаний
                  </p>
                </div>

                <div className="w-full sm:w-72 relative">
                  <MagnifierIcon size={16} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Поиск по названию, УНП, телефону..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Clients Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-4 py-3">Организация и УНП</th>
                        <th className="px-4 py-3">Контакты</th>
                        <th className="px-4 py-3">Остаток минут</th>
                        <th className="px-4 py-3">Тариф</th>
                        <th className="px-4 py-3">SIP Оператор</th>
                        <th className="px-4 py-3">Статус</th>
                        <th className="px-4 py-3 text-right">Действия</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {filteredClients.map((client) => (
                        <tr key={client.id} className="hover:bg-slate-850/40 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-white">{client.companyName}</div>
                            <div className="text-[11px] text-slate-400">
                              УНП: <span className="font-mono text-slate-300">{client.unp}</span> • {client.city}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="text-slate-200">{client.name}</div>
                            <div className="text-[11px] text-slate-400">{client.phone}</div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-white text-sm">
                              {client.balanceMinutes.toFixed(1)} мин
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Выговорено: {client.spentMinutesTotal} мин
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="font-semibold text-slate-200">
                              {client.ratePerMinute.toFixed(2)} BYN/мин
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="inline-flex items-center gap-1 uppercase font-semibold text-[11px] text-slate-300">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              {client.sipProvider}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <button
                              type="button"
                              onClick={() => handleToggleClientActive(client.id)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold cursor-pointer transition-colors ${
                                client.isActive
                                  ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                              }`}
                            >
                              {client.isActive ? 'Активен' : 'Пауза'}
                            </button>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedClientForRefill(client);
                                setRefillAmountMinutes(50);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors cursor-pointer"
                            >
                              + Минуты
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Quick Refill Modal */}
              {selectedClientForRefill && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-white text-sm">Начисление минут клиенту</h3>
                      <button
                        type="button"
                        onClick={() => setSelectedClientForRefill(null)}
                        className="text-slate-400 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="text-xs text-slate-300">
                      Компания: <span className="font-semibold text-white">{selectedClientForRefill.companyName}</span>
                      <div className="text-slate-400 mt-0.5">
                        Текущий баланс: {selectedClientForRefill.balanceMinutes} мин
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Сколько минут начислить:
                      </label>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {[15, 50, 100].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setRefillAmountMinutes(m)}
                            className={`py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                              refillAmountMinutes === m
                                ? 'bg-blue-600 border-blue-500 text-white'
                                : 'bg-slate-850 border-slate-750 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            +{m} мин
                          </button>
                        ))}
                      </div>

                      <input
                        type="number"
                        min="1"
                        value={refillAmountMinutes}
                        onChange={(e) => setRefillAmountMinutes(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => handleQuickAddMinutes(selectedClientForRefill.id, refillAmountMinutes)}
                        className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                      >
                        Подтвердить начисление
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedClientForRefill(null)}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs cursor-pointer"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LIVE CHAT (SUPPORT) */}
          {activeTab === 'livechat' && (
            <div className="space-y-4">
              <LiveChatTab onOpenVoiceTest={() => showToast('Тест голосового ассистента')} />
            </div>
          )}

          {/* TAB 4: BILLING & LEGAL */}
          {activeTab === 'billing' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-white">Финансы, Платежи и Акты (РБ)</h2>
                <p className="text-xs text-slate-400">
                  История оплат через bePaid (ЕРИП, карты) и безналичные платежи с актами выполненных работ
                </p>
              </div>

              {/* Transactions Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-4 py-3">Организация</th>
                        <th className="px-4 py-3">Сумма (BYN)</th>
                        <th className="px-4 py-3">Минут</th>
                        <th className="px-4 py-3">Метод оплаты</th>
                        <th className="px-4 py-3">Номер счета / чека</th>
                        <th className="px-4 py-3">Дата и время</th>
                        <th className="px-4 py-3 text-right">Первичный акт</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-850/40 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-white">{tx.clientName}</div>
                            <div className="text-[11px] text-slate-400 font-mono">УНП: {tx.unp}</div>
                          </td>
                          <td className="px-4 py-3.5 font-bold text-white text-sm">
                            {tx.amountByn.toFixed(2)} BYN
                          </td>
                          <td className="px-4 py-3.5 text-slate-300">
                            +{tx.minutesAdded} мин
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300">
                              {tx.paymentMethod === 'bepaid_card' && 'Банковская карта (bePaid)'}
                              {tx.paymentMethod === 'erip' && 'ЕРИП (bePaid)'}
                              {tx.paymentMethod === 'bank_transfer_act' && 'Безнал (р/с)'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 font-mono text-slate-400 text-[11px]">
                            {tx.invoiceNumber}
                          </td>
                          <td className="px-4 py-3.5 text-slate-400 text-[11px]">
                            {tx.createdAt}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => showToast(`Акт выполненных работ ${tx.invoiceNumber} скачан (PDF)`)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ml-auto"
                            >
                              <DocumentTextIcon size={14} />
                              <span>Акт (PDF)</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: TELEPHONY */}
          {activeTab === 'telephony' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-white">Мониторинг телефонии и качества диалогов</h2>
                <p className="text-xs text-slate-400">
                  Живой поток входящих звонков по операторам Беларуси, статистика автоответчиков и распознавания
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl divide-y divide-slate-850">
                {telephonyLogs.map((log) => (
                  <div key={log.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{log.companyName}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300">
                          {log.assistantVoice === 'anna' ? 'Голос: Анна' : 'Голос: Максим'}
                        </span>
                        <span className="text-slate-400 text-[11px] font-mono">{log.timestamp}</span>
                      </div>
                      <div className="text-slate-300">
                        Звонок от: <span className="font-semibold text-white">{log.callerPhone}</span> • Транк: {log.sipTrunk} • Длительность: {log.durationSeconds} сек
                      </div>
                      <p className="text-slate-400 text-xs bg-slate-950 p-2.5 rounded-xl border border-slate-850 mt-2">
                        «{log.transcriptSnippet}»
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-bold text-white text-sm">
                        {log.costByn > 0 ? `+${log.costByn.toFixed(2)} BYN` : '0.00 BYN (AMD)'}
                      </div>
                      <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300">
                        {log.status === 'lead_captured' && 'Заявка зафиксирована'}
                        {log.status === 'transferred' && 'Перевод на менеджера'}
                        {log.status === 'amd_filtered' && 'AMD: робот отсечен'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h2 className="text-base font-bold text-white">Глобальные настройки платформы Voxi.by</h2>
                <p className="text-xs text-slate-400">
                  Реквизиты оператора, базовые тарифы и ключи интеграций
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
                <h3 className="font-semibold text-sm text-white">Юридические реквизиты оператора РБ</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Наименование оператора:</label>
                    <input
                      type="text"
                      readOnly
                      value="ИП Беляков Кирилл Олегович"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">УНП:</label>
                    <input
                      type="text"
                      readOnly
                      value="193991846"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-slate-400 block mb-1">Юридический адрес:</label>
                    <input
                      type="text"
                      readOnly
                      value="Республика Беларусь, г. Минск"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                    />
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
                <h3 className="font-semibold text-sm text-white">Базовые тарифы</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Стартовый тариф за минуту (BYN):</label>
                    <input
                      type="text"
                      defaultValue="0.45"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Оптовый тариф за минуту (BYN):</label>
                    <input
                      type="text"
                      defaultValue="0.35"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Бесплатный демо-лимит при регистрации:</label>
                    <input
                      type="text"
                      defaultValue="15 минут"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => showToast('Настройки тарифов сохранены')}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors cursor-pointer"
                >
                  Сохранить тарифы
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
