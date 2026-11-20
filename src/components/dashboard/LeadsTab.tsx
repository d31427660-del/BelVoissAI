import React, { useState, useRef, useEffect } from 'react';
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
  DisketteIcon as Save
} from '@solar-icons/react/bold-duotone';
import { CallLog, AgentConfig, TelegramSettings, WebhookSettings, VoiceId } from '../../types';
import { VoiceSimulator } from '../../lib/speechSynth';
import { sendTestTelegramCard } from '../../lib/vapiService';
import { FieldLabel } from './FieldHelp';

interface LeadsTabProps {
  callLogs: CallLog[];
  agent: AgentConfig;
  onSaveAgent: (agent: AgentConfig) => void;
  telegramSettings: TelegramSettings;
  onSaveTelegram: (settings: TelegramSettings) => void;
  webhookSettings?: WebhookSettings;
  onSaveWebhook?: (settings: WebhookSettings) => void;
}

const nativeSwitchAttr = { switch: '' } as React.InputHTMLAttributes<HTMLInputElement>;

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

  // CRM & Webhook integration states
  const [partnerToken, setPartnerToken] = useState(
    agent.yclientsConfig?.platform === 'yclients' ? agent.yclientsConfig?.partnerToken || '' : ''
  );
  const [googleCalendarId, setGoogleCalendarId] = useState(
    agent.yclientsConfig?.googleCalendarId ||
      (agent.yclientsConfig?.platform === 'google_calendar' ? agent.yclientsConfig?.companyId || '' : '')
  );
  const [googleOAuthToken, setGoogleOAuthToken] = useState(
    agent.yclientsConfig?.platform === 'google_calendar' ? agent.yclientsConfig?.partnerToken || '' : ''
  );
  const [webhookUrl, setWebhookUrl] = useState(webhookSettings?.webhookUrl || '');
  const [webhookEnabled, setWebhookEnabled] = useState(webhookSettings?.isEnabled ?? false);

  // SMS follow-up toggle
  const [smsFollowUpEnabled, setSmsFollowUpEnabled] = useState<boolean>(
    agent.callerNotification?.isEnabled ?? true
  );

  useEffect(() => {
    setLocalTg(telegramSettings);
  }, [telegramSettings]);

  useEffect(() => {
    setWebhookUrl(webhookSettings?.webhookUrl || '');
    setWebhookEnabled(webhookSettings?.isEnabled ?? false);
  }, [webhookSettings]);

  useEffect(() => {
    setSmsFollowUpEnabled(agent.callerNotification?.isEnabled ?? true);
    if (agent.yclientsConfig?.platform === 'google_calendar') {
      setGoogleCalendarId(agent.yclientsConfig.googleCalendarId || agent.yclientsConfig.companyId || '');
      setGoogleOAuthToken(agent.yclientsConfig.partnerToken || '');
    } else if (agent.yclientsConfig?.platform === 'yclients') {
      setPartnerToken(agent.yclientsConfig.partnerToken || '');
    }
  }, [agent]);

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
    try {
      void navigator.clipboard?.writeText(phone)?.catch(() => {});
      setCopiedPhoneId(id);
      setTimeout(() => setCopiedPhoneId(null), 2000);
    } catch {
      // ignore clipboard errors
    }
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

    const hasGoogle = Boolean(googleCalendarId.trim() && googleOAuthToken.trim());
    const hasYclients = Boolean(partnerToken.trim());
    const nextPlatform =
      hasGoogle && !hasYclients
        ? 'google_calendar'
        : hasYclients
        ? 'yclients'
        : googleCalendarId.trim()
        ? 'google_calendar'
        : 'none';

    onSaveAgent({
      ...agent,
      callerNotification: agent.callerNotification
        ? {
            ...agent.callerNotification,
            isEnabled: smsFollowUpEnabled
          }
        : {
            isEnabled: smsFollowUpEnabled,
            channel: 'sms',
            provider: 'sms_by',
            template: 'Здравствуйте, {ИМЯ}! Вы записаны в {КОМПАНИЯ} на {ВРЕМЯ}. Наш адрес: {АДРЕС}. Ждём вас!',
            sendMapLink: false,
            notifyOnlyOnLead: true
          },
      yclientsConfig: {
        isEnabled: Boolean(hasYclients || hasGoogle || googleCalendarId.trim()),
        partnerToken: nextPlatform === 'google_calendar' ? googleOAuthToken.trim() : partnerToken.trim(),
        companyId:
          nextPlatform === 'google_calendar' ? googleCalendarId.trim() : agent.yclientsConfig?.companyId || '',
        googleCalendarId: googleCalendarId.trim(),
        platform: nextPlatform,
        autoBookSlots: agent.yclientsConfig?.autoBookSlots ?? false,
        notifyClientSms: agent.yclientsConfig?.notifyClientSms ?? false,
        liveSlotCheckingEnabled: agent.yclientsConfig?.liveSlotCheckingEnabled ?? true
      },
      updatedAt: new Date().toISOString()
    });

    if (onSaveWebhook) {
      onSaveWebhook({
        webhookUrl: webhookUrl.trim(),
        secretKey: webhookSettings?.secretKey || '',
        isEnabled: Boolean(webhookUrl.trim() && webhookEnabled),
        sendFormat: webhookSettings?.sendFormat || 'json_standard'
      });
    }
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

    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;

    return matchesQuery && matchesStatus;
  });

  const totalLeadsCount = callLogs.filter((c) => c.status === 'lead_captured').length;
  const totalRevenueByn = callLogs.reduce((sum, c) => sum + (c.dealValueByn || 0), 0);

  return (
    <form id="active-workspace-form" onSubmit={handleSaveTelegram} className="space-y-6">
      {/* Editorial mono eyebrow rule */}
      <div className="flex items-center justify-between gap-4">
        <div className="inline-flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#737373]">
          <span className="w-1.5 h-1.5 rounded-full bg-black" />
          <span>Журнал звонков · Telegram и CRM</span>
        </div>
        <div className="hidden sm:block h-px flex-1 bg-black/[0.08]" />
        <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#737373]">
          {callLogs.length} ЗАПИСЕЙ
        </span>
      </div>

      {/* Top Dotted Obsidian Header */}
      <div className="voxi-dot-surface p-6 sm:p-8 rounded-[28px] text-white border border-black flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 font-mono text-[10.5px] uppercase tracking-[0.1em] text-[#6BFF91]">
            <Send className="w-3.5 h-3.5" />
            <span>Журнал звонков и лиды</span>
          </div>
          <h1 className="font-display text-2xl sm:text-[30px] font-bold tracking-[-0.035em] leading-[1.1] text-white">
            Заявки и уведомления
          </h1>
          <p className="text-[13px] text-white/70 max-w-xl">
            Контакты клиентов, записи на услуги, аудиозаписи и мгновенная доставка карточек лидов в Telegram.
          </p>
        </div>

        <button
          type="submit"
          className="h-10 px-5 rounded-full bg-[#6BFF91] hover:bg-[#52F07A] text-black text-[12.5px] font-semibold inline-flex items-center justify-center gap-2 cursor-pointer transition-colors self-start lg:self-center shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>Сохранить настройки</span>
        </button>
      </div>

      {/* CARD 1: Уведомления о новых заявках в Telegram и SMS */}
      <section className="p-6 sm:p-7 rounded-[24px] bg-white border border-black/[0.08] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-black/[0.08]">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-[12px] bg-[#0A0A0A] text-[#6BFF91] flex items-center justify-center shrink-0">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display text-[17px] font-bold text-black tracking-[-0.02em]">
                Получение заявок в Telegram
              </h2>
              <p className="text-[12.5px] text-[#737373]">
                Бот сразу присылает имя клиента, телефон и услугу после завершения звонка
              </p>
            </div>
          </div>

          <label htmlFor="tg-enabled-switch" className="inline-flex items-center gap-2.5 cursor-pointer select-none">
            <input
              id="tg-enabled-switch"
              type="checkbox"
              {...nativeSwitchAttr}
              checked={localTg.isEnabled}
              onChange={(e) => setLocalTg({ ...localTg, isEnabled: e.target.checked })}
              className="w-4 h-4 accent-black cursor-pointer"
            />
            <span className="text-[13px] font-semibold text-black">Включено</span>
          </label>
        </div>

        {localTg.isEnabled && (
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end">
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
                className="w-full px-4 py-2.5 min-h-[42px] rounded-[12px] bg-[#F5F5F5] focus:bg-white border border-black/[0.08] focus:border-black text-[13px] text-black font-mono focus:outline-none transition-colors"
              />
              <p className="text-[11.5px] text-[#737373] mt-1.5">
                Чтобы узнать свой ID: откройте в Telegram бота{' '}
                <a
                  href="https://t.me/userinfobot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-black underline underline-offset-4 hover:text-[#0225AC]"
                >
                  @userinfobot
                </a>{' '}
                и нажмите «Старт».
              </p>
            </div>

            <div className="sm:col-span-4 pb-[22px]">
              <button
                type="button"
                onClick={handleTestTelegram}
                disabled={isTestingTg || !localTg.chatId}
                className="w-full h-[42px] px-4 rounded-full bg-black hover:bg-[#171717] text-white text-[12.5px] font-semibold inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-35 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-[#6BFF91]" />
                <span>{isTestingTg ? 'Отправляем...' : 'Отправить тест'}</span>
              </button>
            </div>
          </div>
        )}

        {tgTestResult && (
          <div
            className={`p-3.5 rounded-[14px] text-[12.5px] font-semibold flex items-center gap-2 border ${
              tgTestResult.ok
                ? 'bg-[#0A0A0A] text-white border-black'
                : 'bg-[#FFF5F3] text-[#991B1B] border-[#FE432A]/40'
            }`}
          >
            <CheckCircle2
              className={`w-4 h-4 shrink-0 ${tgTestResult.ok ? 'text-[#6BFF91]' : 'text-[#FE432A]'}`}
            />
            <span>{tgTestResult.message}</span>
          </div>
        )}

        {/* SMS-визитка клиенту */}
        <div className="pt-4 border-t border-black/[0.08] flex items-center justify-between gap-4">
          <label htmlFor="sms-followup-toggle" className="cursor-pointer">
            <div className="text-[13.5px] font-semibold text-black">
              SMS-визитка клиенту сразу после звонка
            </div>
            <div className="text-[12px] text-[#737373] mt-0.5">
              Отправляет клиенту SMS с адресом, датой записи и телефоном компании
            </div>
          </label>
          <input
            id="sms-followup-toggle"
            type="checkbox"
            {...nativeSwitchAttr}
            aria-label="SMS-визитка клиенту сразу после звонка"
            checked={smsFollowUpEnabled}
            onChange={(e) => setSmsFollowUpEnabled(e.target.checked)}
            className="w-4 h-4 accent-black cursor-pointer shrink-0"
          />
        </div>
      </section>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-[24px] bg-[#F5F5F5] border border-black/[0.06]">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-[#737373]">
            Всего звонков
          </div>
          <div className="font-display text-3xl font-bold text-black tracking-[-0.03em] tabular-nums mt-2">
            {callLogs.length}
          </div>
        </div>

        <div className="p-5 rounded-[24px] bg-[#1C3B36] text-white">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-white/65">
            Записано клиентов
          </div>
          <div className="font-display text-3xl font-bold text-[#6BFF91] tracking-[-0.03em] tabular-nums mt-2">
            {totalLeadsCount}
          </div>
        </div>

        <div className="p-5 rounded-[24px] bg-[#D8E738] text-black">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-black/65">
            Сумма заказов
          </div>
          <div className="font-display text-3xl font-bold text-black tracking-[-0.03em] tabular-nums mt-2">
            {totalRevenueByn.toLocaleString('ru-RU')}{' '}
            <span className="font-mono text-base font-semibold text-black/65">BYN</span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-full bg-[#F5F5F5] border border-black/[0.06] self-start">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-colors cursor-pointer ${
              statusFilter === 'all' ? 'bg-black text-white' : 'text-[#525252] hover:text-black'
            }`}
          >
            Все ({callLogs.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('lead_captured')}
            className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-colors cursor-pointer ${
              statusFilter === 'lead_captured' ? 'bg-black text-white' : 'text-[#525252] hover:text-black'
            }`}
          >
            С записью ({totalLeadsCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('consultation')}
            className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-colors cursor-pointer ${
              statusFilter === 'consultation' ? 'bg-black text-white' : 'text-[#525252] hover:text-black'
            }`}
          >
            Консультации ({callLogs.filter((c) => c.status === 'consultation').length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#737373] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по имени, номеру, услуге..."
            className="w-full h-10 pl-9 pr-4 rounded-full bg-[#F5F5F5] focus:bg-white border border-black/[0.08] focus:border-black text-[12.5px] text-black placeholder:text-[#A3A3A3] focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* LEADS LIST */}
      <div className="space-y-3.5">
        {filteredLogs.length === 0 ? (
          <div className="p-10 rounded-[24px] bg-[#F5F5F5] border border-black/[0.06] text-center space-y-2.5">
            <div className="w-11 h-11 rounded-full bg-white border border-black/[0.08] text-black flex items-center justify-center mx-auto">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div className="font-display text-[15px] font-bold text-black">Заявок не найдено</div>
            <p className="text-[12.5px] text-[#737373] max-w-sm mx-auto">
              {searchQuery
                ? 'По вашему запросу ничего не найдено. Попробуйте изменить параметры поиска.'
                : 'Здесь появятся клиенты, записавшиеся через голосового ИИ-администратора.'}
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isLead = log.status === 'lead_captured';
            const isExpanded = expandedCallId === log.id;
            const isPlayingThis = playingCallId === log.id;

            return (
              <article
                key={log.id}
                className="p-5 sm:p-6 rounded-[24px] bg-white border border-black/[0.08] hover:border-black/20 space-y-4 transition-colors"
              >
                {/* Header row of card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 ${
                        isLead
                          ? 'bg-[#0A0A0A] text-[#6BFF91]'
                          : 'bg-[#F5F5F5] text-black border border-black/[0.06]'
                      }`}
                    >
                      <Phone className="w-4 h-4" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-[15px] font-bold text-black">
                          {log.callerName || log.capturedData?.clientName || 'Клиент'}
                        </span>
                        <span
                          className={`font-mono text-[10px] uppercase tracking-[0.08em] font-bold px-2.5 py-0.5 rounded-full ${
                            isLead
                              ? 'bg-[#6BFF91] text-black'
                              : 'bg-[#F5F5F5] text-[#525252] border border-black/[0.08]'
                          }`}
                        >
                          {isLead ? 'Записан' : 'Консультация'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[12.5px] font-mono text-[#525252] mt-0.5">
                        <span>{log.callerNumber}</span>
                        <button
                          type="button"
                          onClick={(e) => handleCopyPhone(log.id, log.callerNumber, e)}
                          className="text-[#737373] hover:text-black cursor-pointer transition-colors"
                          title="Скопировать номер"
                        >
                          {copiedPhoneId === log.id ? (
                            <span className="text-[11px] text-[#15803D] font-sans font-semibold">
                              Скопировано!
                            </span>
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {log.callerNumber &&
                      !log.isTest &&
                      !log.callerNumber.includes('(Тест)') &&
                      log.callerNumber.replace(/[^\d+]/g, '').length >= 7 && (
                        <a
                          href={`tel:${log.callerNumber.replace(/[^\d+]/g, '')}`}
                          className="h-9 px-4 rounded-full bg-black hover:bg-[#171717] text-white text-[12px] font-semibold inline-flex items-center gap-1.5 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 text-[#6BFF91]" />
                          <span>Позвонить</span>
                        </a>
                      )}

                    <button
                      type="button"
                      onClick={(e) => handlePlayAudio(log, e)}
                      className={`h-9 px-4 rounded-full text-[12px] font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer border ${
                        isPlayingThis
                          ? 'bg-black text-[#6BFF91] border-black'
                          : 'bg-[#F5F5F5] hover:bg-black hover:text-white text-black border-black/[0.08]'
                      }`}
                    >
                      {isPlayingThis ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      <span>{isPlayingThis ? 'Остановить' : 'Слушать'}</span>
                    </button>
                  </div>
                </div>

                {/* Details row: Service, Time, Price */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-[16px] bg-[#F5F5F5] border border-black/[0.06] text-[12.5px]">
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#737373] block mb-1">
                      Услуга
                    </span>
                    <span className="font-semibold text-black">
                      {log.capturedData?.service || 'Консультация по услугам'}
                    </span>
                  </div>

                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#737373] block mb-1">
                      Желаемое время
                    </span>
                    <span className="font-semibold text-black flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#525252] shrink-0" />
                      <span>
                        {log.bookedSlot
                          ? `${log.bookedSlot.date || 'Ближайшая дата'}, ${log.bookedSlot.time}`
                          : log.capturedData?.preferredDate || 'Уточняется менеджером'}
                      </span>
                    </span>
                  </div>

                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#737373] block mb-1">
                      Сумма заказа
                    </span>
                    <span className="font-mono font-bold text-black">
                      {log.dealValueByn > 0 ? `${log.dealValueByn} BYN` : 'По прайсу'}
                    </span>
                  </div>
                </div>

                {/* AI Summary */}
                {log.summary && (
                  <p className="text-[12.5px] text-[#525252] leading-relaxed">
                    <strong className="text-black font-semibold">Резюме диалога:</strong> {log.summary}
                  </p>
                )}

                {/* Transcript Disclosure */}
                {log.transcript && log.transcript.length > 0 && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setExpandedCallId(isExpanded ? null : log.id)}
                      className="text-[12px] font-semibold text-black/75 hover:text-black inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{isExpanded ? 'Скрыть текст беседы' : 'Показать текст беседы'}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="mt-3 p-4 rounded-[16px] bg-[#F5F5F5] border border-black/[0.06] space-y-2.5 text-[12.5px]">
                        {log.transcript.map((t, idx) => {
                          const isBot = t.speaker === 'assistant';
                          return (
                            <div
                              key={idx}
                              className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}
                            >
                              <div className="font-mono text-[10px] text-[#737373] mb-1">
                                {isBot ? 'Бот Voxi' : 'Клиент'} · {t.time}
                              </div>
                              <div
                                className={`px-3.5 py-2 rounded-[14px] max-w-[85%] leading-relaxed ${
                                  isBot
                                    ? 'bg-white text-black border border-black/[0.06] rounded-tl-xs'
                                    : 'bg-[#0A0A0A] text-white rounded-tr-xs'
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
              </article>
            );
          })
        )}
      </div>

      {/* DISCLOSURE: Дополнительные интеграции (YClients, Google Календарь, Webhook) */}
      <details className="group rounded-[24px] bg-white border border-black/[0.08] overflow-hidden">
        <summary className="p-5 sm:p-6 flex items-center justify-between text-[13.5px] font-semibold text-black hover:bg-[#F5F5F5] cursor-pointer list-none transition-colors">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-[10px] bg-[#F5F5F5] border border-black/[0.06] flex items-center justify-center shrink-0">
              <CalendarIcon className="w-4 h-4 text-black" />
            </span>
            <span>Дополнительные интеграции (YCLIENTS, Google Календарь, Webhook)</span>
          </div>
          <ChevronDown className="w-4 h-4 text-[#737373] transition-transform group-open:rotate-180" />
        </summary>

        <div className="p-6 pt-4 border-t border-black/[0.08] space-y-4 bg-[#F5F5F5]">
          <p className="text-[12.5px] text-[#525252] leading-relaxed">
            Если ваша компания использует CRM-систему или онлайн-календарь, бот может автоматически проверять свободные окна сотрудников и бронировать слоты без вашего участия.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-[18px] bg-white border border-black/[0.08] space-y-2.5">
              <div className="font-display text-[14px] font-bold text-black">YCLIENTS (онлайн-запись)</div>
              <p className="text-[12px] text-[#737373]">
                Подключение через Partner Token для чтения свободных окон в салонах и клиниках.
              </p>
              <input
                type="text"
                placeholder="Вставьте Partner Token YCLIENTS"
                value={partnerToken}
                onChange={(e) => setPartnerToken(e.target.value)}
                className="w-full px-3.5 py-2 rounded-[10px] bg-[#F5F5F5] focus:bg-white border border-black/[0.08] focus:border-black text-[12px] font-mono focus:outline-none"
              />
            </div>

            <div className="p-4 rounded-[18px] bg-white border border-black/[0.08] space-y-2.5">
              <div className="font-display text-[14px] font-bold text-black">Google Calendar / FreeBusy</div>
              <p className="text-[12px] text-[#737373]">
                Проверка расписания через Google Calendar API в реальном времени.
              </p>
              <input
                type="text"
                placeholder="Calendar ID (например, primary или email)"
                value={googleCalendarId}
                onChange={(e) => setGoogleCalendarId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-[10px] bg-[#F5F5F5] focus:bg-white border border-black/[0.08] focus:border-black text-[12px] font-mono focus:outline-none"
              />
              <input
                type="password"
                placeholder="OAuth2 Access Token"
                value={googleOAuthToken}
                onChange={(e) => setGoogleOAuthToken(e.target.value)}
                className="w-full px-3.5 py-2 rounded-[10px] bg-[#F5F5F5] focus:bg-white border border-black/[0.08] focus:border-black text-[12px] font-mono focus:outline-none"
              />
            </div>

            <div className="p-4 rounded-[18px] bg-white border border-black/[0.08] space-y-2.5 sm:col-span-2">
              <div className="flex items-center justify-between gap-2">
                <div className="font-display text-[14px] font-bold text-black">
                  Webhook (HTTP POST уведомления)
                </div>
                <label htmlFor="webhook-enabled-switch" className="inline-flex items-center gap-2 cursor-pointer text-[12px] font-semibold text-black">
                  <input
                    id="webhook-enabled-switch"
                    type="checkbox"
                    {...nativeSwitchAttr}
                    checked={webhookEnabled}
                    onChange={(e) => setWebhookEnabled(e.target.checked)}
                    className="w-4 h-4 accent-black cursor-pointer"
                  />
                  <span>Включено</span>
                </label>
              </div>
              <p className="text-[12px] text-[#737373]">
                Отправка JSON данных о каждом звонке и зафиксированном лиде на ваш сервер или CRM.
              </p>
              <input
                type="url"
                placeholder="https://crm.company.by/api/voxi-webhook"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full px-3.5 py-2 rounded-[10px] bg-[#F5F5F5] focus:bg-white border border-black/[0.08] focus:border-black text-[12px] font-mono focus:outline-none"
              />
            </div>
          </div>
        </div>
      </details>
    </form>
  );
};
