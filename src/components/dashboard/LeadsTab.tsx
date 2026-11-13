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

    // Also sync SMS follow-up setting in agent config
    if (agent.callerNotification) {
      onSaveAgent({
        ...agent,
        callerNotification: {
          ...agent.callerNotification,
          isEnabled: smsFollowUpEnabled
        },
        updatedAt: new Date().toISOString()
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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/[0.08]">
        <div>
          <h2 className="text-xl font-medium text-black tracking-tight">
            Заявки и уведомления
          </h2>
          <p className="text-xs text-[#777169] mt-0.5">
            Контакты клиентов, записи на услуги и получение заявок в Telegram
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleSaveTelegram()}
          className="liquid-glass-btn-primary px-5 py-2.5 rounded-[12px] text-xs font-medium text-white flex items-center justify-center gap-2 cursor-pointer shadow-xs self-start sm:self-auto"
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
            className="p-3.5 rounded-[12px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Настройки заявок сохранены! Заявки отправляются в Telegram.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CARD 1: Уведомления о новых заявках в Telegram */}
      <div className="p-5 sm:p-6 rounded-[16px] liquid-glass-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[8px] bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-medium text-black">
                Получение заявок в Telegram
              </h3>
              <p className="text-[11px] text-[#777169]">
                Бот сразу присылает имя клиента, телефон и услугу после завершения звонка
              </p>
            </div>
          </div>

          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={localTg.isEnabled}
              onChange={(e) => setLocalTg({ ...localTg, isEnabled: e.target.checked })}
              className="w-4 h-4 rounded accent-black"
            />
            <span className="text-xs font-medium text-black">Включено</span>
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
                helpText="1. Откройте в Telegram бота @voxi_bot и нажмите кнопку «Старт» (/start).&#10;2. Бот мгновенно пришлёт ваш цифровой Chat ID.&#10;3. Скопируйте цифры и вставьте в это поле.&#10;&#10;Если хотите получать заявки в общий чат с коллегами, просто добавьте бота @voxi_bot в группу и напишите /start."
                helpExample="419283746 (личный чат) или -100192837465 (группа)"
              />
              <input
                id="tg-chat-id"
                type="text"
                value={localTg.chatId}
                onChange={(e) => setLocalTg({ ...localTg, chatId: e.target.value })}
                placeholder="Например: 419283746 или -100192837465"
                className="w-full px-3 py-2 rounded-[8px] bg-white border border-black/[0.12] text-xs text-black font-mono focus:outline-none focus:border-black"
              />
              <p className="text-[10px] text-[#777169] mt-1">
                Чтобы узнать свой ID: откройте в Telegram бота{' '}
                <a
                  href="https://t.me/voxi_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 underline"
                >
                  @voxi_bot
                </a>{' '}
                и нажмите «Старт». Он сразу пришлёт ваш Chat ID.
              </p>
            </div>

            <div className="sm:col-span-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleTestTelegram}
                disabled={isTestingTg || !localTg.chatId}
                className="w-full px-3.5 py-2 rounded-[8px] bg-white hover:bg-black/[0.04] text-black border border-black/[0.12] text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-blue-600" />
                <span>{isTestingTg ? 'Отправляем...' : 'Отправить тест'}</span>
              </button>
            </div>
          </div>
        )}

        {tgTestResult && (
          <div className={`p-2.5 rounded-[8px] text-[11px] font-medium flex items-center gap-1.5 ${
            tgTestResult.ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{tgTestResult.message}</span>
          </div>
        )}

        {/* SMS-визитка клиенту */}
        <div className="pt-3 border-t border-black/[0.06] flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-black">SMS-визитка клиенту сразу после звонка</div>
            <div className="text-[11px] text-[#777169]">
              Отправляет клиенту SMS с адресом, датой записи и телефоном компании
            </div>
          </div>
          <input
            type="checkbox"
            checked={smsFollowUpEnabled}
            onChange={(e) => setSmsFollowUpEnabled(e.target.checked)}
            className="w-4 h-4 rounded accent-black cursor-pointer"
          />
        </div>
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-[12px] liquid-glass-card">
          <div className="text-xs text-[#777169]">Всего звонков</div>
          <div className="text-xl font-medium text-black font-mono mt-1">{callLogs.length}</div>
        </div>

        <div className="p-4 rounded-[12px] liquid-glass-card">
          <div className="text-xs text-[#777169]">Записано клиентов</div>
          <div className="text-xl font-medium text-emerald-700 font-mono mt-1">{totalLeadsCount}</div>
        </div>

        <div className="p-4 rounded-[12px] liquid-glass-card">
          <div className="text-xs text-[#777169]">Сумма заказов по заявкам</div>
          <div className="text-xl font-medium text-black font-mono mt-1">{totalRevenueByn} BYN</div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-[10px] liquid-glass-cream border border-black/[0.06]">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-[8px] text-xs font-medium transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-black text-white shadow-xs'
                : 'text-[#59544F] hover:text-black'
            }`}
          >
            Все ({callLogs.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('lead_captured')}
            className={`px-3 py-1.5 rounded-[8px] text-xs font-medium transition-all cursor-pointer ${
              statusFilter === 'lead_captured'
                ? 'bg-black text-white shadow-xs'
                : 'text-[#59544F] hover:text-black'
            }`}
          >
            С записью ({totalLeadsCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('consultation')}
            className={`px-3 py-1.5 rounded-[8px] text-xs font-medium transition-all cursor-pointer ${
              statusFilter === 'consultation'
                ? 'bg-black text-white shadow-xs'
                : 'text-[#59544F] hover:text-black'
            }`}
          >
            Консультации ({callLogs.filter((c) => c.status === 'consultation').length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#777169] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по имени, номеру, услуге..."
            className="w-full pl-8 pr-3 py-1.5 rounded-[10px] bg-white border border-black/[0.1] text-xs text-black focus:outline-none focus:border-black"
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
                    {log.callerNumber && (
                      <a
                        href={`tel:${log.callerNumber}`}
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
                defaultValue={agent.yclientsConfig?.partnerToken || ''}
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
                defaultValue={agent.yclientsConfig?.companyId || ''}
                className="w-full px-2.5 py-1.5 rounded-[6px] bg-white border border-black/[0.1] text-xs font-mono focus:outline-none focus:border-black"
              />
            </div>
          </div>
        </div>
      </details>
    </div>
  );
};
