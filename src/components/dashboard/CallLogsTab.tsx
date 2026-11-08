import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlayIcon as Play,
  PauseIcon as Pause,
  MagnifierIcon as Search,
  DownloadMinimalisticIcon as Download,
  CloseCircleIcon as X,
  CopyIcon as Copy,
  CheckCircleIcon as CheckCircle2,
  SendSquareIcon as Send,
  VolumeLoudIcon as Volume2,
  SmileCircleIcon,
  DangerCircleIcon,
  TagIcon,
  ShieldCheckIcon as ShieldCheck,
  PhoneCallingRoundedIcon as Phone,
} from '@solar-icons/react/bold-duotone';
import { CallLog, AgentConfig, VoiceId, CallSentiment } from '../../types';
import { VoiceSimulator } from '../../lib/speechSynth';
import { FieldLabel, FieldHint } from './FieldHelp';

interface CallLogsTabProps {
  callLogs: CallLog[];
  agent?: AgentConfig;
}

export const CallLogsTab: React.FC<CallLogsTabProps> = ({ callLogs, agent }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedSentiment, setSelectedSentiment] = useState<string>('all');
  const [selectedFollowUp, setSelectedFollowUp] = useState<string>('all');
  const [activeCallDetail, setActiveCallDetail] = useState<CallLog | null>(null);
  const [playingCallId, setPlayingCallId] = useState<string | null>(null);
  const [activeTurnIdx, setActiveTurnIdx] = useState<number | null>(null);
  const [waveBars, setWaveBars] = useState<number[]>([25, 50, 75, 40, 60, 85, 35, 70, 45, 30]);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [crmSyncToast, setCrmSyncToast] = useState(false);
  const playbackRunRef = useRef(0);
  const playingCallIdRef = useRef<string | null>(null);

  const stopCallPlayback = () => {
    playbackRunRef.current += 1;
    playingCallIdRef.current = null;
    VoiceSimulator.stop();
    setPlayingCallId(null);
    setActiveTurnIdx(null);
  };

  const handleCloseCallDetail = () => {
    stopCallPlayback();
    setActiveCallDetail(null);
  };

  useEffect(() => {
    return () => {
      playbackRunRef.current += 1;
      playingCallIdRef.current = null;
      VoiceSimulator.stop();
    };
  }, []);

  useEffect(() => {
    if (!activeCallDetail) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseCallDetail();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [activeCallDetail]);

  const filteredLogs = callLogs.filter((log) => {
    const query = (searchQuery || '').toLowerCase();
    const callerNum = (log.callerNumber || '').toLowerCase();
    const callerName = (log.callerName || '').toLowerCase();
    const summary = (log.summary || '').toLowerCase();
    const service = (log.capturedData?.service || '').toLowerCase();
    const tagsString = (log.tags || []).join(' ').toLowerCase();

    const matchesSearch =
      callerNum.includes(query) ||
      callerName.includes(query) ||
      summary.includes(query) ||
      service.includes(query) ||
      tagsString.includes(query);

    const matchesStatus = selectedStatus === 'all' || log.status === selectedStatus;
    const matchesSentiment = selectedSentiment === 'all' || (log.sentiment || 'neutral') === selectedSentiment;
    const matchesFollowUp =
      selectedFollowUp === 'all' ||
      (selectedFollowUp === 'sent' && Boolean(log.followUpSent)) ||
      (selectedFollowUp === 'pending' && !log.followUpSent && log.status === 'lead_captured') ||
      (selectedFollowUp === 'none' && !log.followUpSent && log.status !== 'lead_captured');

    return matchesSearch && matchesStatus && matchesSentiment && matchesFollowUp;
  });

  const handlePlayAudio = async (call: CallLog, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (playingCallIdRef.current === call.id) {
      stopCallPlayback();
      return;
    }

    const runId = ++playbackRunRef.current;
    VoiceSimulator.stop();
    playingCallIdRef.current = call.id;
    setPlayingCallId(call.id);

    const botVoice: VoiceId = agent?.voice === 'maxim' ? 'maxim' : 'anna';
    const callerVoice: VoiceId = botVoice === 'maxim' ? 'anna' : 'maxim';
    const turns =
      Array.isArray(call.transcript) && call.transcript.length > 0
        ? call.transcript
        : [{ speaker: 'assistant' as const, text: call.summary || 'Запись разговора', time: '0:01' }];

    for (let idx = 0; idx < turns.length; idx++) {
      if (playbackRunRef.current !== runId || playingCallIdRef.current !== call.id) return;
      setActiveTurnIdx(idx);
      const turn = turns[idx];
      const turnVoice = turn.speaker === 'assistant' ? botVoice : callerVoice;
      await VoiceSimulator.speak(
        turn.text,
        turnVoice,
        undefined,
        undefined,
        (bars: number[]) => setWaveBars(bars.slice(0, 10))
      );
    }

    if (playbackRunRef.current === runId && playingCallIdRef.current === call.id) {
      playingCallIdRef.current = null;
      setPlayingCallId(null);
      setActiveTurnIdx(null);
    }
  };

  const handleCopyPhone = (phone: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleSyncToCrm = (call: CallLog) => {
    const leadLines = [
      `Заявка со звонка (${agent?.companyName || 'Voxi.by'})`,
      `• Клиент: ${call.callerName || 'Не указано'} (${call.callerNumber || 'Номер не определён'})`,
      `• Запрос: ${call.capturedData?.service || call.summary || 'Консультация'}`,
      call.capturedData?.preferredDate ? `• Время: ${call.capturedData.preferredDate}` : null,
      (call.dealValueByn || 0) > 0 ? `• Оценка чека: ~${call.dealValueByn} BYN` : null,
      `• Резюме: ${call.summary || 'Информация зафиксирована'}`
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard?.writeText(leadLines).catch(() => {});
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent('https://voxi.by')}&text=${encodeURIComponent(
      leadLines
    )}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer');

    setCrmSyncToast(true);
    setTimeout(() => setCrmSyncToast(false), 3200);
  };

  const exportToCsv = () => {
    const headers = ['ID,Номер,Имя,Услуга,Дата,Длительность (сек),Статус,Настроение,Теги,Follow-up,Сумма BYN,Суть'];
    const rows = filteredLogs.map(
      (l) =>
        `"${l.id}","${l.callerNumber || ''}","${(l.callerName || '').replace(/"/g, '""')}","${(l.capturedData?.service || '').replace(/"/g, '""')}","${l.timestamp || ''}",${l.durationSeconds || 0},"${l.status || ''}","${l.sentiment || 'neutral'}","${(l.tags || []).join('; ')}","${l.followUpSent ? 'Отправлен' : 'Нет'}",${l.dealValueByn || 0},"${(l.summary || '').replace(/"/g, '""')}"`
    );
    const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `voxi_zayavki_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const getStatusBadge = (status: CallLog['status']) => {
    switch (status) {
      case 'lead_captured':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Заявка получена
          </span>
        );
      case 'consultation':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Вопрос клиента
          </span>
        );
      case 'forwarded':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Переведён сотруднику
          </span>
        );
      case 'voicemail_detected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            Автоответчик (0 BYN)
          </span>
        );
      case 'spam':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Реклама / спам
          </span>
        );
    }
  };

  const getSentimentBadge = (sentiment?: CallSentiment) => {
    switch (sentiment) {
      case 'positive':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs whitespace-nowrap">
            <SmileCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
            <span>Позитивный</span>
          </span>
        );
      case 'negative':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs whitespace-nowrap">
            <DangerCircleIcon className="w-3.5 h-3.5 text-rose-600" />
            <span>Внимание</span>
          </span>
        );
      case 'neutral':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span>Нейтральный</span>
          </span>
        );
    }
  };

  const getFollowUpBadge = (call: CallLog) => {
    if (call.followUpSent) {
      return (
        <span
          title={call.followUpText || 'Follow-up отправлен'}
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 whitespace-nowrap"
        >
          <Send className="w-3 h-3 text-indigo-600" />
          <span>{call.followUpChannel === 'telegram' ? 'Telegram' : 'SMS'} отправлен</span>
        </span>
      );
    }
    if (call.status === 'lead_captured') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span>Ожидает</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] text-slate-400 bg-slate-50 border border-slate-200/60 whitespace-nowrap">
        Не требуется
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Main Table Card */}
      <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/40">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Журнал звонков и заявок клиентов
              </h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200 font-semibold">
                {filteredLogs.length} звонков
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Нажмите на любую строку, чтобы послушать запись беседы, оценить тон разговора и просмотреть отправленный follow-up
            </p>
          </div>

          <button
            type="button"
            onClick={exportToCsv}
            title="Скачать список звонков файлом для Excel"
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs self-start md:self-auto"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Скачать в Excel (CSV)</span>
          </button>
        </div>

        {/* Filter and Search Bar with Explicit Labels & Hints */}
        <div className="p-4 sm:px-5 border-b border-slate-100 space-y-3 bg-white">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            <div className="lg:col-span-6">
              <FieldLabel
                htmlFor="call-logs-search"
                label="Поиск по звонкам"
                helpTitle="Как быстро найти нужный звонок"
                helpText="Введите часть номера телефона, имя клиента, название услуги, ключевой тег или фразу из диалога."
                helpExample="682-14-99, шиномонтаж или Рассрочка"
              />
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  id="call-logs-search"
                  name="search"
                  type="search"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  aria-describedby="call-logs-search-hint"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Имя, телефон, резюме, услуга или тег..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50/80 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
                />
              </div>
              <FieldHint id="call-logs-search-hint">
                Можно искать по последним цифрам телефона, имени, тегу или резюме звонка.
              </FieldHint>
            </div>

            <div className="lg:col-span-6">
              <FieldLabel
                htmlFor="call-logs-filter-all"
                label="Результат разговора"
                helpTitle="Что означают статусы звонков"
                helpText="«Заявка получена» — клиент оставил контакты и время записи. «Вопрос клиента» — бот ответил по ценам или графику. «Переведён сотруднику» — звонок переключили на живого менеджера. «Автоответчик» — сработал AMD (0 списанных минут). «Реклама / спам» — бот вежливо завершил нецелевой звонок."
              />
              <div
                className="flex flex-wrap items-center gap-1.5"
                role="group"
                aria-describedby="call-logs-filter-hint"
              >
                {[
                  { id: 'all', label: 'Все звонки' },
                  { id: 'lead_captured', label: 'Заявки' },
                  { id: 'consultation', label: 'Вопросы' },
                  { id: 'forwarded', label: 'Переведённые' },
                  { id: 'voicemail_detected', label: 'Автоответчик (AMD)' },
                  { id: 'spam', label: 'Спам' }
                ].map((f) => (
                  <button
                    key={f.id}
                    id={f.id === 'all' ? 'call-logs-filter-all' : undefined}
                    type="button"
                    onClick={() => setSelectedStatus(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      selectedStatus === f.id
                        ? 'bg-blue-600 text-white shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 bg-white border border-slate-200/80'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <FieldHint id="call-logs-filter-hint">
                Выберите «Заявки», чтобы видеть только клиентов, готовых к записи.
              </FieldHint>
            </div>
          </div>

          {/* Secondary Quick Filters: Sentiment & Follow-up */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-500 font-semibold text-[11px]">Настроение (Sentiment):</span>
              <div className="inline-flex items-center gap-1 bg-slate-50 p-0.5 rounded-lg border border-slate-200/70">
                {[
                  { id: 'all', label: 'Все' },
                  { id: 'positive', label: 'Позитивные', dot: 'bg-emerald-500' },
                  { id: 'neutral', label: 'Нейтральные', dot: 'bg-slate-400' },
                  { id: 'negative', label: 'Внимание', dot: 'bg-rose-500' }
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSentiment(s.id)}
                    className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all inline-flex items-center gap-1.5 ${
                      selectedSentiment === s.id
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {s.dot && <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />}
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-500 font-semibold text-[11px]">Follow-up:</span>
              <div className="inline-flex items-center gap-1 bg-slate-50 p-0.5 rounded-lg border border-slate-200/70">
                {[
                  { id: 'all', label: 'Все' },
                  { id: 'sent', label: 'Отправлен', dot: 'bg-blue-500' },
                  { id: 'pending', label: 'Ожидает', dot: 'bg-amber-500' },
                  { id: 'none', label: 'Не требуется' }
                ].map((fu) => (
                  <button
                    key={fu.id}
                    type="button"
                    onClick={() => setSelectedFollowUp(fu.id)}
                    className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all inline-flex items-center gap-1.5 ${
                      selectedFollowUp === fu.id
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {fu.dot && <span className={`w-1.5 h-1.5 rounded-full ${fu.dot}`} />}
                    <span>{fu.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-500 font-semibold">
                <th className="py-3 px-4">Клиент и телефон</th>
                <th className="py-3 px-4">1-фразовое резюме и теги</th>
                <th className="py-3 px-4">Настроение</th>
                <th className="py-3 px-4">Follow-up</th>
                <th className="py-3 px-4">Результат</th>
                <th className="py-3 px-4 text-right">Сумма заказа</th>
                <th className="py-3 px-4 text-center">Запись и текст</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    По вашему запросу звонков не найдено. Попробуйте сбросить фильтр или изменить поиск.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((call) => {
                  const isPlaying = playingCallId === call.id;
                  const isSelected = activeCallDetail?.id === call.id;

                  return (
                    <tr
                      key={call.id}
                      tabIndex={0}
                      onClick={() => setActiveCallDetail(call)}
                      onKeyDown={(e) => {
                        if (e.target !== e.currentTarget) return;
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setActiveCallDetail(call);
                        }
                      }}
                      className={`cursor-pointer transition-colors focus:outline-none focus:bg-blue-50/70 ${
                        isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* 1. Client & Phone */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-[11px] shrink-0 border border-blue-100">
                            {call.callerName ? call.callerName.charAt(0) : '—'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">
                              {call.callerName || 'Клиент не назвал имя'}
                            </div>
                            <div className="font-mono text-[11px] text-slate-500 flex items-center gap-1.5">
                              <span>{call.callerNumber}</span>
                              <button
                                type="button"
                                onClick={(e) => handleCopyPhone(call.callerNumber, e)}
                                className="text-slate-400 hover:text-blue-600 transition-colors"
                                title="Скопировать номер"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. 1-Sentence Summary & Tags */}
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="font-medium text-slate-900 leading-snug line-clamp-2" title={call.summary}>
                          {call.summary}
                        </div>
                        {call.tags && call.tags.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 mt-1.5">
                            {call.greetingVariant && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-bold border border-purple-200">
                                A/B: {call.greetingVariant}
                              </span>
                            )}
                            {call.bookedSlot && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-semibold border border-emerald-200">
                                Слот {call.bookedSlot.time} ✓
                              </span>
                            )}
                            {call.callerFollowUpSent && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-semibold border border-blue-200">
                                SMS клиенту ✓
                              </span>
                            )}
                            {call.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200/70"
                              >
                                <TagIcon className="w-2.5 h-2.5 text-slate-400" />
                                <span>{tag}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* 3. Sentiment Badge (зеленый / серый / красный) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getSentimentBadge(call.sentiment)}
                      </td>

                      {/* 4. Follow-up status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getFollowUpBadge(call)}
                      </td>

                      {/* 5. Call Outcome Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(call.status)}
                      </td>

                      {/* 6. Order Value BYN */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold whitespace-nowrap text-slate-900">
                        {call.dealValueByn > 0 ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                            +{call.dealValueByn} BYN
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">—</span>
                        )}
                      </td>

                      {/* 7. Audio & Detail Drawer Button */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => handlePlayAudio(call, e)}
                            className={`p-1.5 rounded-lg border transition-all ${
                              isPlaying
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : 'bg-white hover:bg-blue-50 text-blue-700 border-slate-200'
                            }`}
                            title="Прослушать запись ответа бота"
                          >
                            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveCallDetail(call);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors"
                          >
                            Открыть
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Light Slide-Over Call Detail Drawer */}
      <AnimatePresence>
        {activeCallDetail && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end" role="dialog" aria-modal="true" aria-label="Карточка звонка">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseCallDetail}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-xs transition-opacity"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-full max-w-lg bg-white shadow-2xl z-10 flex flex-col h-full border-l border-slate-200"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 flex items-center justify-center font-bold text-sm shrink-0">
                    {activeCallDetail.callerName ? activeCallDetail.callerName.charAt(0) : '—'}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {activeCallDetail.callerName || 'Клиент не назвал имя'}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                      <span>{activeCallDetail.callerNumber}</span>
                      <button
                        type="button"
                        onClick={(e) => handleCopyPhone(activeCallDetail.callerNumber, e)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Скопировать номер телефона"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {copiedPhone && <span className="text-[10px] text-emerald-600">Скопировано</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getSentimentBadge(activeCallDetail.sentiment)}
                  {getStatusBadge(activeCallDetail.status)}
                  <button
                    type="button"
                    onClick={handleCloseCallDetail}
                    aria-label="Закрыть карточку звонка"
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 voxi-scroll">
                {/* Light Audio Player Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/90 to-indigo-50/50 border border-blue-200/80 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-blue-900 font-semibold flex items-center gap-1.5">
                      <Volume2 className="w-4 h-4 text-blue-600" />
                      <span>Аудиозапись разговора</span>
                    </span>
                    <span className="font-mono text-blue-700 font-bold bg-white px-2 py-0.5 rounded-full border border-blue-100">
                      {activeCallDetail.audioDuration}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={(e) => handlePlayAudio(activeCallDetail, e)}
                      className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shrink-0 shadow-xs transition-all"
                    >
                      {playingCallId === activeCallDetail.id ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4 ml-0.5" />
                      )}
                    </button>

                    <div className="flex-1 flex items-center gap-1 h-8">
                      {waveBars.map((height, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-full bg-blue-200/60 overflow-hidden"
                          style={{ height: '100%' }}
                        >
                          <div
                            className={`w-full transition-all duration-75 ${
                              playingCallId === activeCallDetail.id ? 'bg-blue-600' : 'bg-blue-400/70'
                            }`}
                            style={{ height: `${playingCallId === activeCallDetail.id ? height : 35}%` }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600">
                    Нажмите на кнопку воспроизведения, чтобы прослушать весь диалог по ролям от начала до конца.
                  </p>
                </div>

                {/* 1-Sentence Summary & Tags Card */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Итог звонка (1-фразовое резюме)</span>
                    </span>
                    {getSentimentBadge(activeCallDetail.sentiment)}
                  </div>
                  <p className="text-xs text-slate-800 font-medium leading-relaxed">
                    {activeCallDetail.summary}
                  </p>
                  {activeCallDetail.tags && activeCallDetail.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200/60">
                      {activeCallDetail.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white text-slate-700 text-[11px] font-medium border border-slate-200/80 shadow-2xs"
                        >
                          <TagIcon className="w-2.5 h-2.5 text-blue-600" />
                          <span>{tag}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* AMD Details Card */}
                {activeCallDetail.amdDetails?.detected && (
                  <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200/80 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-purple-900 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-purple-600" />
                        <span>Автоответчик сотовой сети РБ (AMD)</span>
                      </span>
                      <span className="text-[10px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">
                        0 BYN • Баланс сохранён
                      </span>
                    </div>
                    <p className="text-xs text-purple-950 leading-relaxed font-medium">
                      Оператор: <span className="font-bold">{activeCallDetail.amdDetails.carrierName || 'Сотовая сеть РБ'}</span>
                    </p>
                    {activeCallDetail.amdDetails.detectedPhrase && (
                      <p className="text-[11px] text-purple-900 font-mono bg-white/90 p-2.5 rounded-xl border border-purple-200/70 leading-relaxed">
                        «{activeCallDetail.amdDetails.detectedPhrase}»
                      </p>
                    )}
                    <p className="text-[11px] text-purple-700 leading-relaxed">
                      Бот мгновенно определил автоответчик и положил трубку без списания тарифных минут бизнеса.
                    </p>
                  </div>
                )}

                {/* Warm Handoff / Transfer Details Card */}
                {activeCallDetail.transferDetails && (
                  <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-900 flex items-center gap-1.5">
                        <Phone className="w-4 h-4 text-amber-600" />
                        <span>Перевод вызова сотруднику (Warm Handoff)</span>
                      </span>
                      <span className="text-[10px] font-semibold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                        {activeCallDetail.transferDetails.reason === 'conflict'
                          ? 'Претензия клиента'
                          : activeCallDetail.transferDetails.reason === 'complex_query'
                          ? 'Сложный запрос'
                          : 'Запрос человека'}
                      </span>
                    </div>
                    <p className="text-xs text-amber-950 leading-relaxed">
                      Звонок переключен на номер: <span className="font-mono font-bold">{activeCallDetail.transferDetails.targetPhone}</span>
                    </p>
                    {activeCallDetail.transferDetails.summarySentToStaff && (
                      <div className="p-2 rounded-xl bg-white/90 border border-amber-200/70 text-[11px] text-emerald-800 font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Резюме диалога и контекст вопроса переданы дежурному сотруднику до поднятия трубки</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Follow-up Message Card */}
                {activeCallDetail.followUpSent && (
                  <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Автоматический Follow-up ({activeCallDetail.followUpChannel?.toUpperCase() || 'SMS'})</span>
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Доставлен клиенту
                      </span>
                    </div>
                    <p className="text-xs text-indigo-950 font-mono bg-white/80 p-2.5 rounded-xl border border-indigo-100 leading-relaxed">
                      «{activeCallDetail.followUpText}»
                    </p>
                  </div>
                )}

                {/* Direct Caller SMS/Viber Card & A/B Greeting details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeCallDetail.callerFollowUpSent && (
                    <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/80 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-blue-900 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                          <span>SMS-визитка клиенту</span>
                        </span>
                        <span className="text-[10px] text-blue-700 font-semibold">Отправлено</span>
                      </div>
                      <p className="text-[11px] text-slate-700 leading-relaxed bg-white/90 p-2 rounded-lg border border-blue-100">
                        {activeCallDetail.callerFollowUpText || activeCallDetail.followUpText || 'Визитка с адресом и ссылкой на карту отправлена на номер абонента.'}
                      </p>
                    </div>
                  )}

                  {activeCallDetail.bookedSlot && (
                    <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-emerald-900 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Онлайн-слот подтверждён</span>
                        </span>
                        <span className="text-[10px] text-emerald-700 font-mono font-bold">
                          {activeCallDetail.bookedSlot.time}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-700 leading-relaxed bg-white/90 p-2 rounded-lg border border-emerald-100">
                        {activeCallDetail.bookedSlot.date} в {activeCallDetail.bookedSlot.time}. Проверено в онлайн-календаре CRM без конфликтов.
                      </p>
                    </div>
                  )}
                </div>

                {activeCallDetail.greetingVariant && (
                  <div className="px-3 py-2 rounded-xl bg-purple-50/60 border border-purple-200/80 flex items-center justify-between text-xs">
                    <span className="text-purple-900 font-medium">
                      Вариант приветствия (A/B тест):
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-200 text-purple-900 font-bold text-[11px]">
                      Вариант {activeCallDetail.greetingVariant}
                    </span>
                  </div>
                )}

                {/* Extracted Lead Summary */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      Краткая сводка по клиенту
                    </span>
                    {activeCallDetail.dealValueByn > 0 && (
                      <span className="text-xs font-bold font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        +{activeCallDetail.dealValueByn} BYN
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Услуга:</span>
                      <strong className="text-slate-900 font-semibold block leading-snug break-words">
                        {activeCallDetail.capturedData?.service || 'Консультация'}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400 block">Желаемое время:</span>
                      <strong className="text-slate-900 font-semibold block leading-snug break-words">
                        {activeCallDetail.capturedData?.preferredDate || 'Не уточнялось'}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400 block">Город / филиал:</span>
                      <strong className="text-slate-900 font-semibold block leading-snug break-words">
                        {activeCallDetail.capturedData?.cityOrBranch || agent?.address || 'Минск'}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400 block">Готовность к записи:</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                        Горячее обращение
                      </span>
                    </div>
                  </div>
                </div>

                {/* Transcript Messages (Light Theme) */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-800 block">
                    Текст разговора по ролям
                  </span>

                  <div className="space-y-2.5">
                    {activeCallDetail.transcript.map((msg, i) => {
                      const isAi = msg.speaker === 'assistant';
                      const isTurnActive = playingCallId === activeCallDetail.id && activeTurnIdx === i;
                      return (
                        <div
                          key={i}
                          className={`flex flex-col ${isAi ? 'items-start' : 'items-end'}`}
                        >
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-0.5 px-1">
                            <span>
                              {isAi
                                ? `Бот (${agent?.voice === 'maxim' ? 'Максим' : 'Анна'})`
                                : activeCallDetail.callerName || 'Клиент'}
                            </span>
                            <span>•</span>
                            <span className="font-mono">{msg.time}</span>
                          </div>
                          <div
                            className={`p-3 rounded-2xl text-xs max-w-[88%] leading-relaxed transition-all ${
                              isAi
                                ? 'bg-slate-100 text-slate-900 border border-slate-200/80 rounded-tl-sm'
                                : 'bg-blue-600 text-white rounded-tr-sm shadow-2xs'
                            } ${isTurnActive ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
                          >
                            {msg.text}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleSyncToCrm(activeCallDetail)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Переслать заявку в Telegram</span>
                </button>

                <button
                  type="button"
                  onClick={handleCloseCallDetail}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors"
                >
                  Закрыть
                </button>
              </div>

              {crmSyncToast && (
                <div
                  role="status"
                  aria-live="polite"
                  className="absolute bottom-16 left-4 right-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center gap-2 shadow-lg"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Текст заявки скопирован и открыт для пересылки в Telegram!</span>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
