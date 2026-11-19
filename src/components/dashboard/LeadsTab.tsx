import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PhoneCallingRoundedIcon as Phone,
  SendSquareIcon as Send,
  CheckCircleIcon as CheckCircle2,
  CopyIcon as Copy,
  PlayIcon as Play,
  PauseIcon as Pause,
  MagnifierIcon as Search,
  AltArrowDownIcon as ChevronDown,
  CalendarIcon,
  ClockCircleIcon as Clock,
  ChatRoundDotsIcon as MessageSquare,
  ShieldCheckIcon as ShieldCheck,
  DisketteIcon as Save,
  RefreshIcon as RefreshCw
} from '@solar-icons/react/bold-duotone';
import { CallLog, AgentConfig, TelegramSettings, WebhookSettings, VoiceId } from '../../types';
import { VoiceSimulator } from '../../lib/speechSynth';
import { sendTestTelegramCard } from '../../lib/vapiService';
import { FieldLabel, FieldHint } from './FieldHelp';

interface LeadsTabProps {
  callLogs: CallLog[];
  agent: AgentConfig;
  onSaveAgent: (agent: AgentConfig) => void;
  telegramSettings: TelegramSettings;
  onSaveTelegram: (settings: TelegramSettings) => void;
  webhookSettings?: WebhookSettings;
  onSaveWebhook?: (settings: WebhookSettings) => void;
}

export const LeadsTab: React.FC<LeadsTabProps> = ({
  callLogs,
  agent,
  onSaveAgent,
  telegramSettings,
  onSaveTelegram,
  webhookSettings,
  onSaveWebhook
}) => {
  const [localTg, setLocalTg] = useState<TelegramSettings>(telegramSettings);
  const [isTestingTg, setIsTestingTg] = useState(false);
  const [tgTestResult, setTgTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [tgSaveSuccess, setTgSaveSuccess] = useState(false);

  // CRM & Webhook integration states
  const [partnerToken, setPartnerToken] = useState(agent.yclientsConfig?.partnerToken || '');
  const [googleCalendarId, setGoogleCalendarId] = useState(
    agent.yclientsConfig?.googleCalendarId ||
      (agent.yclientsConfig?.platform === 'google_calendar' ? agent.yclientsConfig?.companyId || '' : '')
  );
  const [webhookUrl, setWebhookUrl] = useState(webhookSettings?.webhookUrl || '');
  const [webhookEnabled, setWebhookEnabled] = useState(webhookSettings?.isEnabled ?? false);

  // SMS follow-up toggle
  const [smsFollowUpEnabled, setSmsFollowUpEnabled] = useState<boolean>(
    agent.callerNotification?.isEnabled ?? true
  );

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'lead_captured' | 'consultation'>('all');
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);

  // Audio playback states
  const [playingCallId, setPlayingCallId] = useState<string | null>(null);
  const playbackRunRef = useRef(0);
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      playbackRunRef.current += 1;
      VoiceSimulator.stop();
    };
  }, []);

  const handleCopyPhone = (id: string, phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedPhoneId(id);
    setTimeout(() => setCopiedPhoneId(null), 2000);
  };

  const handlePlayAudio = async (call: CallLog, e: React.MouseEvent) => {
    e.stopPropagation();
    if (playingCallId === call.id) {
      playbackRunRef.current += 1;
      VoiceSimulator.stop();
      setPlayingCallId(null);
      return;
    }

    const runId = ++playbackRunRef.current;
    VoiceSimulator.stop();
    setPlayingCallId(call.id);

    const botVoice: VoiceId = agent.voice === 'maxim' ? 'maxim' : 'anna';
    const callerVoice: VoiceId = botVoice === 'maxim' ? 'anna' : 'maxim';
    const turns =
      call.transcript.length > 0
        ? call.transcript
        : [{ speaker: 'assistant' as const, text: call.summary, time: '0:01' }];

    for (const turn of turns) {
      if (playbackRunRef.current !== runId) return;
      const voiceForTurn = turn.speaker === 'assistant' ? botVoice : callerVoice;
      await VoiceSimulator.speak(turn.text, voiceForTurn);
    }

    if (playbackRunRef.current === runId) {
      setPlayingCallId(null);
    }
  };

  const handleSaveTelegram = (e?: React.FormEvent) => {
    e?.preventDefault();
    onSaveTelegram(localTg);

    // Sync SMS follow-up, YCLIENTS, and Google Calendar settings in agent config
    onSaveAgent({
      ...agent,
      callerNotification: agent.callerNotification ? {
        ...agent.callerNotification,
        isEnabled: smsFollowUpEnabled
      } : {
        isEnabled: smsFollowUpEnabled,
        channel: 'sms',
        provider: 'sms_by',
        template: 'Здравствуйте, {ИМЯ}! Вы записаны в {КОМПАНИЯ} на {ВРЕМЯ}. Наш адрес: {АДРЕС}. Ждём вас!',
        sendMapLink: false,
        notifyOnlyOnLead: true
      },
      yclientsConfig: {
        isEnabled: Boolean(partnerToken.trim() || googleCalendarId.trim()),
        partnerToken: partnerToken.trim(),
        companyId: agent.yclientsConfig?.companyId || '',
        googleCalendarId: googleCalendarId.trim(),
        platform: partnerToken.trim() ? 'yclients' : (googleCalendarId.trim() ? 'google_calendar' : 'none'),
        autoBookSlots: agent.yclientsConfig?.autoBookSlots ?? false,
        notifyClientSms: agent.yclientsConfig?.notifyClientSms ?? false,
        liveSlotCheckingEnabled: agent.yclientsConfig?.liveSlotCheckingEnabled ?? true
      },
      updatedAt: new Date().toISOString()
    });

    // Save Webhook settings if handler provided
    if (onSaveWebhook) {
      onSaveWebhook({
        webhookUrl: webhookUrl.trim(),
        secretKey: webhookSettings?.secretKey || '',
        isEnabled: Boolean(webhookUrl.trim() && webhookEnabled),
        sendFormat: webhookSettings?.sendFormat || 'json_standard'
      });
    }

    setTgSaveSuccess(true);
    setTimeout(() => setTgSaveSuccess(false), 3000);
  };

  const handleTestTelegram = async () => {
    setIsTestingTg(true);
    setTgTestResult(null);
    const res = await sendTestTelegramCard({
      botToken: localTg.botToken || undefined,
      chatId: localTg.chatId || '',
      companyName: agent.companyName
    });
    setIsTestingTg(false);
    setTgTestResult(res);
  };

  const filteredLogs = callLogs.filter((log) => {
    const q = searchQuery.toLowerCase().trim();
    const callerNum = (log.callerNumber || '').toLowerCase();
    const callerName = (log.callerName || '').toLowerCase();
    const summary = (log.summary || '').toLowerCase();
    const service = (log.capturedData?.service || '').toLowerCase();

    const matchesQuery =
      !q ||
      callerNum.includes(q) ||
      callerName.includes(q) ||
      summary.includes(q) ||
      service.includes(q);

    const matchesStatus =
      statusFilter === 'all' || log.status === statusFilter;

    return matchesQuery && matchesStatus;
  });

  const totalLeadsCount = callLogs.filter((c) => c.status === 'lead_captured').length;
  const totalRevenueByn = callLogs.reduce((sum, c) => sum + (c.dealValueByn || 0), 0);

  return (
    <form id="active-workspace-form" onSubmit={handleSaveTelegram} className="space-y-6 max-w-4xl mx-auto">
      {/* Top Dark Hero Header */}
      <div className="p-6 rounded-3xl bg-[#141417] text-white border border-white/10 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
        <div
          className="pointer-events-none absolute -top-20 -right-16 w-64 h-64 rounded-full opacity-25"
          style={{
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.55) 0%, rgba(16, 185, 129, 0.25) 60%, transparent 75%)'
          }}
        />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[11px] font-semibold mb-1.5">
            <Send className="w-3.5 h-3.5" />
            <span>Журнал звонков и лиды</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Заявки и уведомления
          </h2>
          <p className="text-xs text-zinc-300 mt-0.5">
            Контакты клиентов, записи на услуги и мгновенная доставка лидов в Telegram
          </p>
        </div>

        <button
          type="submit"
          className="relative z-10 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2.5 rounded-full text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm self-start sm:self-auto shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>Сохранить настройки</span>
        </button>
      </div>

      {/* Save Success Alert */}
      <AnimatePresence>
        {tgSaveSuccess && (
          <motion.div
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-semibold"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Настройки заявок и интеграций успешно сохранены!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CARD 1: Уведомления о новых заявках в Telegram */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Получение заявок в Telegram
              </h3>
              <p className="text-xs text-slate-500">
                Бот сразу присылает имя клиента, телефон и услугу после завершения звонка
              </p>
            </div>
          </div>

          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={localTg.isEnabled}
              onChange={(e) => setLocalTg({ ...localTg, isEnabled: e.target.checked })}
              className="w-4 h-4 rounded accent-blue-600"
            />
            <span className="text-xs font-semibold text-slate-900">Включено</span>
          </label>
        </div>

        {localTg.isEnabled && (
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-8">
              <FieldLabel
                htmlFor="tg-chat-id"
                label="Chat ID вашего Telegram (личный или группа)"
                required
                helpTriggerLabel="Где взять ID?"
                helpTitle="Как узнать свой ID в Telegram за 5 секунд"
                helpText="1. Откройте в Telegram бота @userinfobot (https://t.me/userinfobot) и нажмите кнопку «Старт» (/start).&#10;2. Бот мгновенно пришлёт ваш цифровой Id (например: 419283746).&#10;3. Скопируйте цифры и вставьте в это поле.&#10;&#10;Если хотите получать заявки в группу с коллегами, просто добавьте @userinfobot в группу или перешлите сообщение из группы."
                helpExample="419283746 (личный чат) или -100192837465 (группа)"
              />
              <input
                id="tg-chat-id"
                type="text"
                value={localTg.chatId}
                onChange={(e) => setLocalTg({ ...localTg, chatId: e.target.value })}
                placeholder="Например: 419283746 или -100192837465"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50/70 focus:bg-white border border-slate-300 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-600"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Чтобы узнать свой ID: откройте в Telegram бота{' '}
                <a
                  href="https://t.me/userinfobot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-blue-600 underline hover:text-blue-800"
                >
                  @userinfobot
                </a>{' '}
                и нажмите «Старт». Он сразу пришлёт ваш цифровой Id.
              </p>
            </div>

            <div className="sm:col-span-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleTestTelegram}
                disabled={isTestingTg || !localTg.chatId}
                className="w-full px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-blue-600" />
                <span>{isTestingTg ? 'Отправляем...' : 'Отправить тест'}</span>
              </button>
            </div>
          </div>
        )}

        {tgTestResult && (
          <div className={`p-2.5 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 ${
            tgTestResult.ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{tgTestResult.message}</span>
          </div>
        )}

        {/* SMS-визитка клиенту */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-900">SMS-визитка клиенту сразу после звонка</div>
            <div className="text-[11px] text-slate-500">
              Отправляет клиенту SMS с адресом, датой записи и телефоном компании
            </div>
          </div>
          <input
            id="sms-followup-toggle"
            type="checkbox"
            aria-label="SMS-визитка клиенту сразу после звонка"
            checked={smsFollowUpEnabled}
            onChange={(e) => setSmsFollowUpEnabled(e.target.checked)}
            className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
          />
        </div>
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Всего звонков</div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1">{callLogs.length}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-emerald-200/90 shadow-xs">
          <div className="text-xs font-semibold text-emerald-700">Записано клиентов</div>
          <div className="text-2xl font-extrabold text-emerald-700 font-mono mt-1">{totalLeadsCount}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-amber-200/90 shadow-xs">
          <div className="text-xs font-semibold text-amber-800">Сумма заказов по заявкам</div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1">{totalRevenueByn} BYN</div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Все ({callLogs.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('lead_captured')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'lead_captured'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            С записью ({totalLeadsCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('consultation')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'consultation'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Консультации ({callLogs.filter((c) => c.status === 'consultation').length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по имени, номеру, услуге..."
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
          />
        </div>
      </div>

      {/* LEADS LIST */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="p-8 rounded-[16px] liquid-glass-card text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-black/[0.04] text-[#777169] flex items-center justify-center mx-auto">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div className="text-xs font-medium text-black">Заявок не найдено</div>
            <p className="text-[11px] text-[#777169]">
              {searchQuery
                ? 'По вашему запросу ничего не найдено. Попробуйте изменить параметры поиска.'
                : 'Здесь появятся клиенты, записавшиеся через бота.'}
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isLead = log.status === 'lead_captured';
            const isExpanded = expandedCallId === log.id;
            const isPlayingThis = playingCallId === log.id;

            return (
              <div
                key={log.id}
                className="p-4 sm:p-5 rounded-[16px] liquid-glass-card space-y-3 transition-all border border-black/[0.06] hover:border-black/[0.12]"
              >
                {/* Header row of card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 ${
                        isLead
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      <Phone className="w-4 h-4" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-black">
                          {log.callerName || log.capturedData?.clientName || 'Клиент'}
                        </span>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            isLead
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {isLead ? 'Записан' : 'Консультация'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-mono text-[#59544F] mt-0.5">
                        <span>{log.callerNumber}</span>
                        <button
                          type="button"
                          onClick={(e) => handleCopyPhone(log.id, log.callerNumber, e)}
                          className="text-[#777169] hover:text-black cursor-pointer"
                          title="Скопировать номер"
                        >
                          {copiedPhoneId === log.id ? (
                            <span className="text-[10px] text-emerald-600 font-sans">Скопировано!</span>
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {log.callerNumber && !log.isTest && !log.callerNumber.includes('(Тест)') && log.callerNumber.replace(/[^\d+]/g, '').length >= 7 && (
                      <a
                        href={`tel:${log.callerNumber.replace(/[^\d+]/g, '')}`}
                        className="px-3 py-1.5 rounded-[8px] bg-black text-white text-xs font-medium inline-flex items-center gap-1.5 hover:bg-black/80 transition-colors"
                      >
                        <Phone className="w-3 h-3" />
                        <span>Позвонить</span>
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={(e) => handlePlayAudio(log, e)}
                      className="px-3 py-1.5 rounded-[8px] bg-white hover:bg-black/[0.04] text-black border border-black/[0.12] text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {isPlayingThis ? <Pause className="w-3 h-3 text-blue-600" /> : <Play className="w-3 h-3 text-black" />}
                      <span>{isPlayingThis ? 'Остановить' : 'Слушать'}</span>
                    </button>
                  </div>
                </div>

                {/* Details row: Service, Time, Price */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-[10px] liquid-glass-cream text-xs">
                  <div>
                    <span className="text-[10px] text-[#777169] block">Выбранная услуга:</span>
                    <span className="font-medium text-black">
                      {log.capturedData?.service || 'Консультация по услугам'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#777169] block">Желаемое время:</span>
                    <span className="font-medium text-black flex items-center gap-1">
                      <Clock className="w-3 h-3 text-black shrink-0" />
                      <span>
                        {log.bookedSlot
                          ? `${log.bookedSlot.date || 'Ближайшая дата'}, ${log.bookedSlot.time}`
                          : log.capturedData?.preferredDate || 'Уточняется менеджером'}
                      </span>
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#777169] block">Сумма заказа:</span>
                    <span className="font-medium text-emerald-700 font-mono">
                      {log.dealValueByn > 0 ? `${log.dealValueByn} BYN` : 'По прайсу'}
                    </span>
                  </div>
                </div>

                {/* AI Summary */}
                {log.summary && (
                  <p className="text-[11px] text-[#59544F] leading-relaxed">
                    <strong className="text-black font-medium">Резюме диалога:</strong> {log.summary}
                  </p>
                )}

                {/* Transcript Disclosure */}
                {log.transcript && log.transcript.length > 0 && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setExpandedCallId(isExpanded ? null : log.id)}
                      className="text-[11px] font-medium text-black/70 hover:text-black inline-flex items-center gap-1 cursor-pointer"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>{isExpanded ? 'Скрыть текст беседы' : 'Показать текст беседы'}</span>
                      <ChevronDown
                        className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="mt-2 p-3 rounded-[10px] bg-white border border-black/[0.06] space-y-2 text-xs">
                        {log.transcript.map((t, idx) => {
                          const isBot = t.speaker === 'assistant';
                          return (
                            <div
                              key={idx}
                              className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}
                            >
                              <div className="text-[9px] text-[#777169] mb-0.5">
                                {isBot ? 'Бот Voxi' : 'Клиент'} • {t.time}
                              </div>
                              <div
                                className={`px-3 py-1.5 rounded-[10px] max-w-[85%] text-xs leading-relaxed ${
                                  isBot
                                    ? 'bg-black/[0.04] text-black rounded-tl-none'
                                    : 'bg-black text-white rounded-tr-none'
                                }`}
                              >
                                {t.text}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* DISCLOSURE: Дополнительные интеграции (YClients, Google Календарь, Webhook) */}
      <details className="group rounded-[16px] liquid-glass-card overflow-hidden">
        <summary className="p-4 sm:p-5 flex items-center justify-between text-xs font-medium text-black hover:bg-black/[0.02] cursor-pointer list-none transition-colors">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-black shrink-0" />
            <span>Дополнительные интеграции (YCLIENTS, Google Календарь, Webhook)</span>
          </div>
          <ChevronDown className="w-4 h-4 text-[#777169] transition-transform group-open:rotate-180" />
        </summary>

        <div className="p-5 pt-3 border-t border-black/[0.06] space-y-4 liquid-glass-cream">
          <div className="text-xs text-[#59544F] leading-relaxed">
            Если ваша компания использует CRM-систему или онлайн-календарь, бот может автоматически проверять свободные окна сотрудников и бронировать слоты без вашего участия.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-[10px] bg-white border border-black/[0.08] space-y-2">
              <div className="text-xs font-medium text-black">YCLIENTS (онлайн-запись)</div>
              <p className="text-[11px] text-[#777169]">
                Подключение через Partner Token для чтения свободных окон в салонах и клиниках.
              </p>
              <input
                type="text"
                placeholder="Вставьте Partner Token YCLIENTS"
                value={partnerToken}
                onChange={(e) => setPartnerToken(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-[6px] bg-white border border-black/[0.1] text-xs font-mono focus:outline-none focus:border-black"
              />
            </div>

            <div className="p-3 rounded-[10px] bg-white border border-black/[0.08] space-y-2">
              <div className="text-xs font-medium text-black">Google Calendar / FreeBusy</div>
              <p className="text-[11px] text-[#777169]">
                Проверка расписания через Google Calendar API в реальном времени.
              </p>
              <input
                type="text"
                placeholder="Вставьте Calendar ID / OAuth Token"
                value={googleCalendarId}
                onChange={(e) => setGoogleCalendarId(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-[6px] bg-white border border-black/[0.1] text-xs font-mono focus:outline-none focus:border-black"
              />
            </div>

            <div className="p-3 rounded-[10px] bg-white border border-black/[0.08] space-y-2 sm:col-span-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-black">Webhook (HTTP POST уведомления)</div>
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-[#777169]">
                  <input
                    type="checkbox"
                    checked={webhookEnabled}
                    onChange={(e) => setWebhookEnabled(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-black focus:ring-0 cursor-pointer"
                  />
                  <span>Включено</span>
                </label>
              </div>
              <p className="text-[11px] text-[#777169]">
                Отправка JSON данных о каждом звонке и зафиксированном лиде на ваш сервер или CRM.
              </p>
              <input
                type="url"
                placeholder="https://crm.company.by/api/voxi-webhook"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-[6px] bg-white border border-black/[0.1] text-xs font-mono focus:outline-none focus:border-black"
              />
            </div>
          </div>
        </div>
      </details>
    </form>
  );
};
