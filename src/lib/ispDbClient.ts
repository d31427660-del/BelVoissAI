import {
  AgentConfig,
  CallLog,
  SipSettings,
  TelegramSettings,
  UserSession,
  WebhookSettings,
} from '../types';

// Сессия живёт ТОЛЬКО в HttpOnly-cookie (недоступна JS). В localStorage хранится лишь непсекретный флаг-подсказка,
// чтобы не делать лишний запрос /me для анонимных посетителей лендинга.
const SESSION_HINT_KEY = 'voxi_has_session';

export interface IspWorkspaceBundle {
  user: UserSession;
  agent: AgentConfig | null;
  sipSettings: SipSettings | null;
  telegramSettings: TelegramSettings | null;
  webhookSettings: WebhookSettings | null;
  callLogs: CallLog[];
}

export interface IspDbStatus {
  available: boolean;
  configured: boolean;
  connected: boolean;
  error?: string;
}

let cachedStatusPromise: Promise<IspDbStatus> | null = null;

export function hasSessionHint(): boolean {
  try {
    return localStorage.getItem(SESSION_HINT_KEY) === '1';
  } catch {
    return false;
  }
}

function setSessionHint(active: boolean): void {
  try {
    if (active) localStorage.setItem(SESSION_HINT_KEY, '1');
    else localStorage.removeItem(SESSION_HINT_KEY);
  } catch {
    // ignore storage errors
  }
}

async function callIspDb(
  action: string,
  options: { method?: 'GET' | 'POST'; body?: Record<string, unknown> } = {}
): Promise<{ status: number; isJson: boolean; data: any }> {
  const method = options.method || 'GET';
  const headers: Record<string, string> = {
    'X-Requested-With': 'XMLHttpRequest',
  };
  if (method === 'POST') {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`/api/db?action=${encodeURIComponent(action)}`, {
    method,
    credentials: 'same-origin',
    headers,
    body: method === 'POST' ? JSON.stringify(options.body || {}) : undefined,
  });

  const contentType = (res.headers.get('content-type') || '').toLowerCase();
  if (!contentType.includes('application/json')) {
    return { status: res.status, isJson: false, data: null };
  }

  const data = await res.json().catch(() => null);
  return { status: res.status, isJson: true, data };
}

/**
 * Проверяет доступность и готовность БД MySQL на хостинге ISPmanager (/api/db)
 */
export function getIspDbStatus(forceRefresh = false): Promise<IspDbStatus> {
  if (!cachedStatusPromise || forceRefresh) {
    cachedStatusPromise = callIspDb('status')
      .then(({ isJson, data }) => {
        if (!isJson || !data || typeof data !== 'object') {
          return { available: false, configured: false, connected: false };
        }
        return {
          available: true,
          configured: Boolean(data.configured),
          connected: Boolean(data.connected),
          error: data.error ? String(data.error) : undefined,
        };
      })
      .catch(() => ({ available: false, configured: false, connected: false }));
  }
  return cachedStatusPromise;
}

export async function ispGetMe(): Promise<IspWorkspaceBundle | null> {
  try {
    const { isJson, data } = await callIspDb('me');
    if (!isJson || !data?.authenticated || !data?.user) {
      setSessionHint(false);
      return null;
    }
    setSessionHint(true);
    return {
      user: data.user as UserSession,
      agent: (data.agent as AgentConfig) || null,
      sipSettings: (data.sipSettings as SipSettings) || null,
      telegramSettings: (data.telegramSettings as TelegramSettings) || null,
      webhookSettings: (data.webhookSettings as WebhookSettings) || null,
      callLogs: Array.isArray(data.callLogs) ? (data.callLogs as CallLog[]) : [],
    };
  } catch {
    return null;
  }
}

export async function ispSignUp(
  email: string,
  password: string,
  companyName: string
): Promise<IspWorkspaceBundle> {
  const { isJson, data } = await callIspDb('signup', {
    method: 'POST',
    body: { email, password, companyName },
  });

  if (!isJson || !data) {
    throw new Error('Сервер базы данных недоступен');
  }
  if (!data.ok || !data.user) {
    throw new Error(data.error || 'Не удалось создать аккаунт');
  }
  setSessionHint(true);
  return {
    user: data.user as UserSession,
    agent: (data.agent as AgentConfig) || null,
    sipSettings: (data.sipSettings as SipSettings) || null,
    telegramSettings: (data.telegramSettings as TelegramSettings) || null,
    webhookSettings: (data.webhookSettings as WebhookSettings) || null,
    callLogs: Array.isArray(data.callLogs) ? (data.callLogs as CallLog[]) : [],
  };
}

export async function ispSignIn(
  email: string,
  password: string
): Promise<IspWorkspaceBundle> {
  const { isJson, data } = await callIspDb('signin', {
    method: 'POST',
    body: { email, password },
  });

  if (!isJson || !data) {
    throw new Error('Сервер базы данных недоступен');
  }
  if (!data.ok || !data.user) {
    throw new Error(data.error || 'Неверный адрес электронной почты или пароль');
  }
  setSessionHint(true);
  return {
    user: data.user as UserSession,
    agent: (data.agent as AgentConfig) || null,
    sipSettings: (data.sipSettings as SipSettings) || null,
    telegramSettings: (data.telegramSettings as TelegramSettings) || null,
    webhookSettings: (data.webhookSettings as WebhookSettings) || null,
    callLogs: Array.isArray(data.callLogs) ? (data.callLogs as CallLog[]) : [],
  };
}

export async function ispSignOut(): Promise<void> {
  try {
    await callIspDb('signout', { method: 'POST' });
  } catch {
    // ignore network errors on logout
  } finally {
    setSessionHint(false);
  }
}

export async function ispResetPassword(email: string): Promise<string> {
  const { isJson, data } = await callIspDb('reset_password', {
    method: 'POST',
    body: { email },
  });
  if (!isJson || !data?.ok) {
    throw new Error(data?.error || 'Не удалось отправить инструкцию по сбросу пароля');
  }
  return String(
    data.message || 'Если аккаунт существует, ссылка для сброса пароля отправлена на указанный email.'
  );
}

export async function ispConfirmResetPassword(
  email: string,
  resetToken: string,
  newPassword: string
): Promise<IspWorkspaceBundle> {
  const { isJson, data } = await callIspDb('confirm_reset_password', {
    method: 'POST',
    body: { email, resetToken, newPassword },
  });
  if (!isJson || !data?.ok || !data?.user) {
    throw new Error(data?.error || 'Ссылка восстановления устарела или недействительна');
  }
  setSessionHint(true);
  return {
    user: data.user as UserSession,
    agent: (data.agent as AgentConfig) || null,
    sipSettings: (data.sipSettings as SipSettings) || null,
    telegramSettings: (data.telegramSettings as TelegramSettings) || null,
    webhookSettings: (data.webhookSettings as WebhookSettings) || null,
    callLogs: Array.isArray(data.callLogs) ? (data.callLogs as CallLog[]) : [],
  };
}

export async function ispSaveAgent(agent: AgentConfig): Promise<void> {
  const { status, isJson, data } = await callIspDb('save_agent', {
    method: 'POST',
    body: { agent },
  });
  if (!isJson || !data?.ok) {
    if (status === 401) {
      setSessionHint(false);
      throw new Error('Сессия истекла. Пожалуйста, войдите в кабинет повторно.');
    }
    throw new Error(
      (typeof data?.error === 'string' && data.error) ||
        `Не удалось сохранить настройки ассистента (HTTP ${status || 'сети'})`
    );
  }
}

export async function ispSaveIntegrations(payload: {
  sipSettings?: SipSettings;
  telegramSettings?: TelegramSettings;
  webhookSettings?: WebhookSettings;
}): Promise<void> {
  const { status, isJson, data } = await callIspDb('save_integrations', {
    method: 'POST',
    body: payload as Record<string, unknown>,
  });
  if (!isJson || !data?.ok) {
    if (status === 401) {
      setSessionHint(false);
      throw new Error('Сессия истекла. Пожалуйста, войдите в кабинет повторно.');
    }
    throw new Error(
      (typeof data?.error === 'string' && data.error) ||
        `Не удалось сохранить настройки интеграций (HTTP ${status || 'сети'})`
    );
  }
}

export async function ispRecordCall(callLog: CallLog): Promise<UserSession | null> {
  const { isJson, data } = await callIspDb('record_call', {
    method: 'POST',
    body: { callLog },
  });
  if (isJson && data?.ok && data?.user) {
    return data.user as UserSession;
  }
  return null;
}

export async function ispAdminLogin(pin: string): Promise<{
  ok: boolean;
  adminToken?: string;
  dbConfigured?: boolean;
  serverResponded: boolean;
}> {
  try {
    const { isJson, data } = await callIspDb('admin_login', {
      method: 'POST',
      body: { pin },
    });
    if (!isJson || !data || typeof data !== 'object') {
      return { ok: false, serverResponded: false };
    }
    return {
      ok: Boolean(data.ok),
      adminToken: data.adminToken ? String(data.adminToken) : undefined,
      dbConfigured: Boolean(data.dbConfigured),
      serverResponded: true,
    };
  } catch {
    return { ok: false, serverResponded: false };
  }
}

export interface IspAdminDataResult {
  dbConnected: boolean;
  configured?: boolean;
  error?: string;
  details?: string;
  hint?: string;
  envLoaded?: boolean;
  envFile?: string | null;
  searchPaths?: string[];
  dbHost?: string;
  dbName?: string;
  dbUser?: string;
  clients: any[];
  transactions: any[];
  telephonyLogs: any[];
  monthlyInvoices: any[];
}

export async function ispFetchAdminData(adminToken: string): Promise<IspAdminDataResult | null> {
  try {
    const { isJson, data } = await callIspDb('admin_data', {
      method: 'POST',
      body: { adminToken },
    });
    if (!isJson || !data || typeof data !== 'object') {
      return null;
    }
    if (!data.ok || !data.dbConnected) {
      return {
        dbConnected: false,
        configured: Boolean(data.configured),
        error: data.error ? String(data.error) : 'Не удалось загрузить данные из БД MySQL (HTTP 503)',
        details: data.details ? String(data.details) : undefined,
        hint: data.hint ? String(data.hint) : undefined,
        envLoaded: Boolean(data.envLoaded),
        envFile: data.envFile ? String(data.envFile) : null,
        searchPaths: Array.isArray(data.searchPaths) ? data.searchPaths : undefined,
        dbHost: data.dbHost ? String(data.dbHost) : undefined,
        dbName: data.dbName ? String(data.dbName) : undefined,
        dbUser: data.dbUser ? String(data.dbUser) : undefined,
        clients: [],
        transactions: [],
        telephonyLogs: [],
        monthlyInvoices: [],
      };
    }
    return {
      dbConnected: true,
      configured: true,
      clients: Array.isArray(data.clients) ? data.clients : [],
      transactions: Array.isArray(data.transactions) ? data.transactions : [],
      telephonyLogs: Array.isArray(data.telephonyLogs) ? data.telephonyLogs : [],
      monthlyInvoices: Array.isArray(data.monthlyInvoices) ? data.monthlyInvoices : [],
    };
  } catch {
    return null;
  }
}

export async function ispAdminAddMinutes(
  adminToken: string,
  clientId: string,
  minutes: number
): Promise<{
  ok: boolean;
  newBalanceMinutes?: number;
  amountByn?: number;
  transactionId?: string;
}> {
  try {
    const { isJson, data } = await callIspDb('admin_add_minutes', {
      method: 'POST',
      body: { adminToken, clientId, minutes },
    });
    if (isJson && data?.ok) {
      return {
        ok: true,
        newBalanceMinutes: Number(data.newBalanceMinutes),
        amountByn: Number(data.amountByn),
        transactionId: data.transactionId ? String(data.transactionId) : undefined,
      };
    }
    return { ok: false };
  } catch {
    return { ok: false };
  }
}

export async function ispAdminToggleClient(
  adminToken: string,
  clientId: string,
  isActive: boolean
): Promise<boolean> {
  try {
    const { isJson, data } = await callIspDb('admin_toggle_client', {
      method: 'POST',
      body: { adminToken, clientId, isActive },
    });
    return Boolean(isJson && data?.ok);
  } catch {
    return false;
  }
}

export async function ispAdminUpdateClientSip(
  adminToken: string,
  payload: {
    clientId: string;
    assignedDid: string;
    sipProvider?: string;
    sipServer?: string;
    sipLogin?: string;
    sipPassword?: string;
    vapiAssistantId?: string;
  }
): Promise<boolean> {
  try {
    const { isJson, data } = await callIspDb('admin_update_client_sip', {
      method: 'POST',
      body: { adminToken, ...payload },
    });
    return Boolean(isJson && data?.ok);
  } catch {
    return false;
  }
}

export async function ispUpdateNumberRentalMode(
  numberRentalMode: 'rental' | 'own_sip'
): Promise<UserSession | null> {
  try {
    const { isJson, data } = await callIspDb('update_number_rental_mode', {
      method: 'POST',
      body: { numberRentalMode },
    });
    if (isJson && data?.ok && data?.user) {
      return data.user as UserSession;
    }
    return null;
  } catch {
    return null;
  }
}

export async function ispAdminCloseMonth(
  adminToken: string,
  periodYm?: string
): Promise<{ ok: boolean; closedCount?: number; overdueSuspendedCount?: number }> {
  try {
    const { isJson, data } = await callIspDb('admin_close_month', {
      method: 'POST',
      body: { adminToken, periodYm: periodYm || '' },
    });
    if (isJson && data?.ok) {
      return {
        ok: true,
        closedCount: Number(data.closedCount || 0),
        overdueSuspendedCount: Number(data.overdueSuspendedCount || 0),
      };
    }
    return { ok: false };
  } catch {
    return { ok: false };
  }
}

export async function ispAdminMarkInvoicePaid(
  adminToken: string,
  invoiceId: string
): Promise<boolean> {
  try {
    const { isJson, data } = await callIspDb('admin_mark_invoice_paid', {
      method: 'POST',
      body: { adminToken, invoiceId },
    });
    return Boolean(isJson && data?.ok);
  } catch {
    return false;
  }
}

export async function ispAdminUpdateClientBilling(
  adminToken: string,
  payload: {
    clientId: string;
    creditLimitByn: number;
    ratePerMinute: number;
    numberRentalMode: 'rental' | 'own_sip';
    billingStatus: 'active' | 'grace' | 'suspended';
  }
): Promise<boolean> {
  try {
    const { isJson, data } = await callIspDb('admin_update_client_billing', {
      method: 'POST',
      body: { adminToken, ...payload },
    });
    return Boolean(isJson && data?.ok);
  } catch {
    return false;
  }
}
