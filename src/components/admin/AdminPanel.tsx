import React, { useState, useEffect } from 'react';
import {
  Widget5Icon as DashboardIcon,
  UsersGroupTwoRoundedIcon as UsersIcon,
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
  PlatformClient,
  PlatformTransaction,
  PlatformTelephonyLog
} from '../../lib/adminData';
import {
  ispAdminLogin,
  ispFetchAdminData,
  ispAdminAddMinutes,
  ispAdminToggleClient,
} from '../../lib/ispDbClient';

interface AdminPanelProps {
  onExitToLanding: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onExitToLanding }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(sessionStorage.getItem('voxi_admin_auth') === 'true' && sessionStorage.getItem('voxi_admin_token'));
  });
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'billing' | 'telephony' | 'settings'>('overview');
  const [clients, setClients] = useState<PlatformClient[]>([]);
  const [transactions, setTransactions] = useState<PlatformTransaction[]>([]);
  const [telephonyLogs, setTelephonyLogs] = useState<PlatformTelephonyLog[]>([]);
  const [adminToken, setAdminToken] = useState<string>(() => {
    try {
      return sessionStorage.getItem('voxi_admin_token') || '';
    } catch {
      return '';
    }
  });
  const [isDbConnected, setIsDbConnected] = useState<boolean>(false);
  const [clientSearch, setClientSearch] = useState<string>('');
  const [selectedClientForRefill, setSelectedClientForRefill] = useState<PlatformClient | null>(null);
  const [refillAmountMinutes, setRefillAmountMinutes] = useState<number>(50);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  // Единственный источник данных — БД MySQL (/api/db?action=admin_data). Никаких локальных копий и демо-данных.
  const [dataError, setDataError] = useState<string | null>(null);
  const loadAdminData = React.useCallback(async () => {
    if (!adminToken) return;
    const remote = await ispFetchAdminData(adminToken);
    if (!remote || !remote.dbConnected) {
      setIsDbConnected(false);
      setDataError('Не удалось загрузить данные из БД. Проверьте подключение MySQL и повторите.');
      return;
    }
    setIsDbConnected(true);
    setDataError(null);
    setClients(remote.clients as PlatformClient[]);
    setTransactions(remote.transactions as PlatformTransaction[]);
    setTelephonyLogs(remote.telephonyLogs as PlatformTelephonyLog[]);
  }, [adminToken]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void loadAdminData();
  }, [isAuthenticated, loadAdminData]);

  const showToast = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleOpenCompletionAct = (tx: PlatformTransaction) => {
    const esc = (val: string) =>
      String(val || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const safeClientName = esc(tx.clientName);
    const safeUnp = esc(tx.unp);
    const safeInvoice = esc(tx.invoiceNumber);
    const safeDate = esc(tx.createdAt.split(',')[0] || new Date().toLocaleDateString('ru-RU'));
    const unitRate = tx.minutesAdded > 0 ? (tx.amountByn / tx.minutesAdded).toFixed(2) : '0.45';

    const actHtml = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>Акт сдачи-приёмки оказанных услуг по счёту ${safeInvoice}</title>
<style>
  body { font-family: Arial, "Helvetica Neue", sans-serif; font-size: 10pt; line-height: 1.4; color: #111; margin: 30px; }
  h1 { font-size: 13pt; margin: 0 0 10px 0; text-align: center; text-transform: uppercase; }
  .sub { text-align: center; font-size: 9.5pt; color: #444; margin-bottom: 18px; }
  .meta { margin-bottom: 14px; font-size: 10pt; }
  table.act-table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 9.5pt; }
  table.act-table th, table.act-table td { border: 1px solid #333; padding: 6px 8px; }
  table.act-table th { background: #f2f2f2; text-align: center; }
  .text-right { text-align: right; }
  .text-center { text-align: center; }
  .signs { width: 100%; margin-top: 32px; border-collapse: collapse; }
  .signs td { width: 50%; vertical-align: top; padding-right: 16px; font-size: 9.5pt; }
  @media print { body { margin: 10mm; } }
</style>
</head>
<body>
  <h1>АКТ сдачи-приёмки оказанных услуг № ${safeInvoice}</h1>
  <div class="sub">г. Минск • Дата составления: ${safeDate} г.</div>

  <div class="meta">
    <p><strong>Исполнитель:</strong> Индивидуальный предприниматель Беляков Кирилл Олегович, УНП 193991846, 220045, Республика Беларусь, г. Минск, ул. Наполеона Орды, д. 11, кв. 58, р/с BY88ALFA30132G19399184600000 в ЗАО «Альфа-Банк», БИК ALFABY2X.</p>
    <p><strong>Заказчик:</strong> ${safeClientName}, УНП ${safeUnp}.</p>
    <p><strong>Основание:</strong> Публичный договор (оферта) возмездного оказания услуг Voxi.by, счёт № ${safeInvoice}.</p>
  </div>

  <table class="act-table">
    <thead>
      <tr>
        <th style="width: 6%;">№</th>
        <th>Наименование оказанных услуг</th>
        <th style="width: 10%;">Кол-во</th>
        <th style="width: 8%;">Ед.</th>
        <th style="width: 15%;">Цена (BYN)</th>
        <th style="width: 16%;">Сумма (BYN)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="text-center">1</td>
        <td>Предоставление доступа к облачной платформе голосовых ИИ-ассистентов Voxi.by (пакет ${tx.minutesAdded} минут телефонных диалогов)</td>
        <td class="text-center">${tx.minutesAdded}</td>
        <td class="text-center">мин.</td>
        <td class="text-right">${unitRate}</td>
        <td class="text-right"><strong>${tx.amountByn.toFixed(2)}</strong></td>
      </tr>
    </tbody>
  </table>

  <p class="text-right"><strong>Итого оказано услуг на сумму: ${tx.amountByn.toFixed(2)} BYN (Без НДС, гл. 32 НК РБ).</strong></p>
  <p style="font-size: 9pt; color: #333;">Услуги оказаны в полном объёме, в установленные сроки. Заказчик претензий по объёму, качеству и срокам оказания услуг не имеет. Первичный учётный документ составлен единолично в соответствии с постановлением Министерства финансов Республики Беларусь № 13.</p>

  <table class="signs">
    <tr>
      <td>
        <strong>ИСПОЛНИТЕЛЬ:</strong><br>
        ИП Беляков Кирилл Олегович<br>
        УНП 193991846<br><br>
        _______________________ / К.О. Беляков /
      </td>
      <td>
        <strong>ЗАКАЗЧИК:</strong><br>
        ${safeClientName}<br>
        УНП ${safeUnp}<br><br>
        _______________________ / ________________ /
      </td>
    </tr>
  </table>
</body>
</html>`;

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(actHtml);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => {
        try {
          printWin.print();
        } catch {}
      }, 300);
    } else {
      const blob = new Blob(['\uFEFF' + actHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Akt_${tx.invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }
    showToast(`Акт выполненных работ ${tx.invoiceNumber} сформирован`);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = pinInput.trim();
    if (!trimmed) {
      setPinError('Введите мастер PIN-код администратора');
      return;
    }

    // Строгая серверная проверка через /api/db?action=admin_login
    const serverAuth = await ispAdminLogin(trimmed);

    if (serverAuth.ok && serverAuth.adminToken) {
      setAdminToken(serverAuth.adminToken);
      setIsAuthenticated(true);
      sessionStorage.setItem('voxi_admin_auth', 'true');
      sessionStorage.setItem('voxi_admin_token', serverAuth.adminToken);
      setPinError(null);
    } else {
      setPinError(
        serverAuth.serverResponded
          ? 'Неверный мастер PIN-код или ADMIN_MASTER_PIN не настроен в .env на сервере'
          : 'Сервер авторизации (/api/db) недоступен'
      );
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('voxi_admin_auth');
    sessionStorage.removeItem('voxi_admin_token');
    setIsAuthenticated(false);
    setAdminToken('');
    setPinInput('');
  };

  const handleQuickAddMinutes = async (clientId: string, minutes: number) => {
    const safeMinutes = Math.max(1, Math.round(Number(minutes) || 0));
    const result = await ispAdminAddMinutes(adminToken, clientId, safeMinutes);
    if (!result.ok) {
      showToast('Не удалось начислить минуты: сервер отклонил операцию');
      return;
    }
    await loadAdminData();
    showToast(`Начислено +${safeMinutes} минут клиенту`);
    setSelectedClientForRefill(null);
  };

  const handleToggleClientActive = async (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;
    const ok = await ispAdminToggleClient(adminToken, clientId, !client.isActive);
    if (!ok) {
      showToast('Не удалось изменить статус клиента');
      return;
    }
    await loadAdminData();
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
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md liquid-glass-dark border border-white/10 rounded-[16px] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="pointer-events-none absolute -top-20 -right-20 w-44 h-44 rounded-full bg-white/5 blur-3xl" />

          <div className="text-center space-y-2 mb-8">
            <div className="w-14 h-14 rounded-[12px] bg-white text-black flex items-center justify-center mx-auto shadow-md">
              <ShieldCheckIcon size={32} />
            </div>
            <h1 className="text-xl font-medium tracking-tight text-white">Панель управления Voxi.by</h1>
            <p className="text-xs text-[#777169]">
              Вход для оператора платформы (ИП Беляков К. О. • УНП 193991846)
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-normal text-zinc-300 mb-1.5">
                Мастер PIN-код или пароль администратора
              </label>
              <input
                type="password"
                autoFocus
                placeholder="Введите мастер PIN-код из .env"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(null);
                }}
                className={`w-full bg-black/60 border rounded-[12px] px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors ${
                  pinError
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'border-white/10 focus:border-white/30'
                }`}
              />
              {pinError && (
                <p className="text-xs text-rose-400 mt-1">{pinError}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-full bg-white hover:bg-zinc-200 text-black font-normal text-sm transition-all shadow-sm cursor-pointer"
            >
              Войти в панель администратора
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
            <button
              type="button"
              onClick={onExitToLanding}
              className="text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
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
            <span className="text-base font-semibold tracking-tight text-white">
              Voxi<span className="text-[#777169] font-mono font-normal">.by</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-normal bg-white/10 text-white border border-white/15">
              MASTER ADMIN
            </span>
            <span
              className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-normal border ${
                isDbConnected
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-white/5 text-zinc-300 border-white/10'
              }`}
              title={
                isDbConnected
                  ? 'Подключено к боевой БД MySQL (ISPmanager)'
                  : 'Локальная синхронизация + готовность к MySQL (/api/db)'
              }
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isDbConnected ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-400'
                }`}
              />
              {isDbConnected ? 'MySQL: Онлайн' : 'MySQL: нет связи'}
            </span>
          </div>
        </div>

        {/* Global Action Notices */}
        {actionNotice && (
          <div className="fixed bottom-4 right-4 z-50 sm:static sm:inline-flex flex items-center gap-1.5 px-3 py-1.5 sm:py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-normal shadow-lg sm:shadow-none backdrop-blur-md">
            <CheckCircleIcon size={14} />
            <span>{actionNotice}</span>
          </div>
        )}

        <div className="flex items-center gap-2 sm:gap-3">

          <div className="h-4 w-px bg-white/10 hidden md:block" />

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-normal transition-colors cursor-pointer"
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
        <aside className="w-full md:w-64 bg-black/60 border-b md:border-b-0 md:border-r border-white/10 p-3 sm:p-4 shrink-0 flex flex-row md:flex-col gap-1.5 md:gap-1 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`shrink-0 md:w-full whitespace-nowrap flex items-center gap-2.5 md:gap-3 px-3.5 py-2.5 rounded-[12px] text-xs font-normal transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-white text-black shadow-sm font-medium'
                : 'text-zinc-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <DashboardIcon size={18} className="shrink-0" />
            <span>Сводка платформы</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('clients')}
            className={`shrink-0 md:w-full whitespace-nowrap flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-[12px] text-xs font-normal transition-all cursor-pointer ${
              activeTab === 'clients'
                ? 'bg-white text-black shadow-sm font-medium'
                : 'text-zinc-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5 md:gap-3">
              <UsersIcon size={18} className="shrink-0" />
              <span>Клиенты и балансы</span>
            </div>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full shrink-0 ${
              activeTab === 'clients' ? 'bg-black/10 text-black' : 'bg-white/10 text-zinc-300'
            }`}>
              {clients.length}
            </span>
          </button>


          <button
            type="button"
            onClick={() => setActiveTab('billing')}
            className={`shrink-0 md:w-full whitespace-nowrap flex items-center gap-2.5 md:gap-3 px-3.5 py-2.5 rounded-[12px] text-xs font-normal transition-all cursor-pointer ${
              activeTab === 'billing'
                ? 'bg-white text-black shadow-sm font-medium'
                : 'text-zinc-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <WalletIcon size={18} className="shrink-0" />
            <span>Финансы и акты РБ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('telephony')}
            className={`shrink-0 md:w-full whitespace-nowrap flex items-center gap-2.5 md:gap-3 px-3.5 py-2.5 rounded-[12px] text-xs font-normal transition-all cursor-pointer ${
              activeTab === 'telephony'
                ? 'bg-white text-black shadow-sm font-medium'
                : 'text-zinc-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <TelephonyIcon size={18} className="shrink-0" />
            <span>Мониторинг звонков</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`shrink-0 md:w-full whitespace-nowrap flex items-center gap-2.5 md:gap-3 px-3.5 py-2.5 rounded-[12px] text-xs font-normal transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-white text-black shadow-sm font-medium'
                : 'text-zinc-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <SettingsIcon size={18} className="shrink-0" />
            <span>Настройки платформы</span>
          </button>
        </aside>

        {/* Content Area */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {dataError && (
            <div role="alert" className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200 flex items-center justify-between gap-3">
              <span>{dataError}</span>
              <button type="button" onClick={() => void loadAdminData()} className="underline cursor-pointer">Повторить</button>
            </div>
          )}

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

                <div className="divide-y divide-slate-800/80">
                  {telephonyLogs.slice(0, 3).map((log) => (
                    <div key={log.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                      <div>
                        <div className="font-semibold text-white">{log.companyName}</div>
                        <div className="text-slate-400 text-[11px]">
                          Клиент: <span className="text-slate-300">{log.callerPhone}</span> • Транк: {log.sipTrunk}
                        </div>
                        <p className="text-slate-400 text-[11px] mt-1 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
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
                    <tbody className="divide-y divide-slate-800/80">
                      {filteredClients.map((client) => (
                        <tr key={client.id} className="hover:bg-slate-800/40 transition-colors">
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
                              className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-medium text-xs transition-colors cursor-pointer"
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
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-label="Начисление минут клиенту"
                  className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
                >
                  <div className="bg-black border border-white/10 rounded-[16px] p-6 max-w-sm w-full space-y-4 shadow-2xl">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-white text-sm">Начисление минут клиенту</h3>
                      <button
                        type="button"
                        onClick={() => setSelectedClientForRefill(null)}
                        className="text-zinc-400 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="text-xs text-zinc-300">
                      Компания: <span className="font-semibold text-white">{selectedClientForRefill.companyName}</span>
                      <div className="text-zinc-400 mt-0.5">
                        Текущий баланс: {selectedClientForRefill.balanceMinutes} мин
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-normal text-zinc-300 mb-1.5">
                        Сколько минут начислить:
                      </label>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {[15, 50, 100].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setRefillAmountMinutes(m)}
                            className={`py-1.5 rounded-lg text-xs font-normal border transition-colors cursor-pointer ${
                              refillAmountMinutes === m
                                ? 'bg-white border-white text-black font-medium'
                                : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
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
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => handleQuickAddMinutes(selectedClientForRefill.id, refillAmountMinutes)}
                        className="flex-1 py-2.5 rounded-full bg-white hover:bg-zinc-200 text-black font-medium text-xs transition-colors cursor-pointer"
                      >
                        Подтвердить начисление
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedClientForRefill(null)}
                        className="px-4 py-2.5 rounded-full bg-white/10 text-zinc-300 hover:text-white text-xs cursor-pointer"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
                    <tbody className="divide-y divide-slate-800/80">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
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
                              onClick={() => handleOpenCompletionAct(tx)}
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

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl divide-y divide-slate-800/80">
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
                      <p className="text-slate-400 text-xs bg-slate-950 p-2.5 rounded-xl border border-slate-800 mt-2">
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

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
                <h3 className="font-semibold text-sm text-white">Действующие тарифы (только чтение)</h3>
                <p className="text-xs text-slate-400">
                  Тарифы и приветственный бонус задаются на сервере (api/bepaid-checkout.php, api/db.php) и не
                  редактируются из браузера. Для изменения обновите код и задеплойте.
                </p>
                <ul className="text-xs text-slate-300 space-y-1">
                  <li>Старт: 0.45 BYN/мин · от 300 мин: 0.40 · от 1000 мин: 0.35</li>
                  <li>Приветственный бонус при регистрации: 15 минут</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
