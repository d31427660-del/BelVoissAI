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
  VolumeLoudIcon as Volume2
} from '@solar-icons/react/bold-duotone';
import { CallLog, AgentConfig } from '../../types';
import { VoiceSimulator } from '../../lib/speechSynth';
import { FieldLabel, FieldHint } from './FieldHelp';

interface CallLogsTabProps {
  callLogs: CallLog[];
  agent?: AgentConfig;
}

export const CallLogsTab: React.FC<CallLogsTabProps> = ({ callLogs, agent }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activeCallDetail, setActiveCallDetail] = useState<CallLog | null>(null);
  const [playingCallId, setPlayingCallId] = useState<string | null>(null);
  const [activeTurnIdx, setActiveTurnIdx] = useState<number | null>(null);
  const [waveBars, setWaveBars] = useState<number[]>([25, 50, 75, 40, 60, 85, 35, 70, 45, 30]);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [crmSyncToast, setCrmSyncToast] = useState(false);
  const playbackRunRef = useRef(0);

  useEffect(() => {
    return () => {
      playbackRunRef.current += 1;
      VoiceSimulator.stop();
    };
  }, []);

  const filteredLogs = callLogs.filter((log) => {
    const matchesSearch =
      log.callerNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.callerName && log.callerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      log.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.capturedData?.service && log.capturedData.service.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = selectedStatus === 'all' || log.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handlePlayAudio = async (call: CallLog, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (playingCallId === call.id) {
      playbackRunRef.current += 1;
      VoiceSimulator.stop();
      setPlayingCallId(null);
      setActiveTurnIdx(null);
      return;
    }

    const runId = ++playbackRunRef.current;
    VoiceSimulator.stop();
    setPlayingCallId(call.id);

    const botVoice = agent?.voice || 'anna';
    const callerVoice = botVoice === 'dmitry' ? 'anna' : 'dmitry';
    const turns =
      call.transcript.length > 0
        ? call.transcript
        : [{ speaker: 'assistant' as const, text: call.summary, time: '0:01' }];

    for (let idx = 0; idx < turns.length; idx++) {
      if (playbackRunRef.current !== runId) return;
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

    if (playbackRunRef.current === runId) {
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
      `📞 Заявка со звонка (${agent?.companyName || 'Voxi.by'})`,
      `👤 Клиент: ${call.callerName || 'Не указано'} (${call.callerNumber})`,
      `🛠 Запрос: ${call.capturedData?.service || call.summary}`,
      call.capturedData?.preferredDate ? `🕒 Время: ${call.capturedData.preferredDate}` : null,
      call.dealValueByn > 0 ? `💰 Оценка чека: ~${call.dealValueByn} BYN` : null,
      `📝 Резюме: ${call.summary}`
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
    const headers = ['ID,Номер,Имя,Услуга,Дата,Длительность (сек),Статус,Сумма BYN,Суть'];
    const rows = filteredLogs.map(
      (l) =>
        `"${l.id}","${l.callerNumber}","${(l.callerName || '').replace(/"/g, '""')}","${(l.capturedData?.service || '').replace(/"/g, '""')}","${l.timestamp}",${l.durationSeconds},"${l.status}",${l.dealValueByn},"${l.summary.replace(/"/g, '""')}"`
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
      case 'spam':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Реклама / спам
          </span>
        );
    }
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
              Нажмите на любую строку, чтобы послушать запись беседы и прочитать текст диалога
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
        <div className="p-4 sm:px-5 border-b border-slate-100 grid grid-cols-1 lg:grid-cols-12 gap-4 bg-white items-start">
          <div className="lg:col-span-6">
            <FieldLabel
              htmlFor="call-logs-search"
              label="Поиск по звонкам"
              helpTitle="Как быстро найти нужный звонок"
              helpText="Введите часть номера телефона, имя клиента или название услуги — таблица сразу отфильтрует подходящие разговоры."
              helpExample="682-14-99 или шиномонтаж"
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
                placeholder="Имя клиента, номер телефона или услуга..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50/80 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
              />
            </div>
            <FieldHint id="call-logs-search-hint">
              Можно искать по последним цифрам телефона, имени или названию услуги.
            </FieldHint>
          </div>

          <div className="lg:col-span-6">
            <FieldLabel
              htmlFor="call-logs-filter-all"
              label="Показать по результату разговора"
              helpTitle="Что означают статусы звонков"
              helpText="«Заявка получена» — клиент оставил контакты и время записи. «Вопрос клиента» — бот ответил по ценам или графику. «Переведён сотруднику» — звонок переключили на живого менеджера. «Реклама / спам» — бот вежливо завершил нецелевой звонок."
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

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-500 font-semibold">
                <th className="py-3 px-4">Клиент и телефон</th>
                <th className="py-3 px-4">Чем интересовался</th>
                <th className="py-3 px-4">Когда звонил</th>
                <th className="py-3 px-4">Длительность</th>
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
                  const serviceName = call.capturedData?.service || call.summary;

                  return (
                    <tr
                      key={call.id}
                      onClick={() => setActiveCallDetail(call)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-[11px] shrink-0 border border-blue-100">
                            {call.callerName ? call.callerName.charAt(0) : '—'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">
                              {call.callerName || 'Клиент не назвал имя'}
                            </div>
                            <div className="font-mono text-[11px] text-slate-500">
                              {call.callerNumber}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="truncate font-medium text-slate-900" title={serviceName}>
                          {serviceName}
                        </div>
                        {call.capturedData?.preferredDate && (
                          <div className="text-[11px] text-slate-400 truncate">
                            Удобное время: {call.capturedData.preferredDate}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                        {call.timestamp}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] whitespace-nowrap">
                        <div className="text-slate-700 font-semibold">{call.audioDuration}</div>
                        <div className="text-[10px] text-slate-400">
                          расход ~
                          {(
                            call.costByn ||
                            Math.max(0.2, Math.round((call.durationSeconds / 60) * 0.45 * 100) / 100)
                          ).toFixed(2)}{' '}
                          BYN
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(call.status)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold whitespace-nowrap text-slate-900">
                        {call.dealValueByn > 0 ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                            +{call.dealValueByn} BYN
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">—</span>
                        )}
                      </td>

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
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveCallDetail(null)}
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
                  {getStatusBadge(activeCallDetail.status)}
                  <button
                    type="button"
                    onClick={() => setActiveCallDetail(null)}
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

                  {activeCallDetail.summary && (
                    <div className="pt-2.5 border-t border-slate-200/70 text-xs text-slate-600 leading-relaxed">
                      <strong className="text-slate-900 block mb-0.5">О чём договорились:</strong>
                      {activeCallDetail.summary}
                    </div>
                  )}
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
                                ? `Бот (${agent?.voice === 'dmitry' ? 'Дмитрий' : 'Анна'})`
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
                  onClick={() => setActiveCallDetail(null)}
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
