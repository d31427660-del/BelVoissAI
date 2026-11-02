import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PhoneCallingRoundedIcon as PhoneCall, 
  PlayIcon as Play, 
  PauseIcon as Pause, 
  DocumentTextIcon as FileText, 
  MagnifierIcon as Search, 
  DownloadMinimalisticIcon as Download, 
  UserRoundedIcon as User, 
  CloseCircleIcon as X, 
  MagicWand3Icon as Sparkles,
  QuestionCircleIcon as HelpCircle,
  CopyIcon as Copy,
  CheckCircleIcon as CheckCircle2,
  CalendarMinimalisticIcon as Calendar,
  ClockCircleIcon as Clock,
  WalletMoneyIcon as Wallet,
  SendSquareIcon as Send
} from '@solar-icons/react/bold-duotone';
import { CallLog, AgentConfig } from '../../types';
import { VoiceSimulator } from '../../lib/speechSynth';

interface CallLogsTabProps {
  callLogs: CallLog[];
  agent?: AgentConfig;
}

export const CallLogsTab: React.FC<CallLogsTabProps> = ({ callLogs, agent }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activeCallDetail, setActiveCallDetail] = useState<CallLog | null>(null);
  const [playingCallId, setPlayingCallId] = useState<string | null>(null);
  const [waveBars, setWaveBars] = useState<number[]>([20, 50, 80, 40, 60, 90, 30, 70, 45, 25]);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [crmSyncToast, setCrmSyncToast] = useState(false);

  const filteredLogs = callLogs.filter((log) => {
    const matchesSearch = 
      log.callerNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.callerName && log.callerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      log.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.capturedData?.service && log.capturedData.service.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = selectedStatus === 'all' || log.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const handlePlayAudio = (call: CallLog, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (playingCallId === call.id) {
      VoiceSimulator.stop();
      setPlayingCallId(null);
    } else {
      VoiceSimulator.stop();
      setPlayingCallId(call.id);

      const firstAssistantLine = call.transcript.find(t => t.speaker === 'assistant')?.text || call.summary;
      VoiceSimulator.speak(
        firstAssistantLine,
        agent?.voice || 'anna',
        () => setPlayingCallId(call.id),
        () => setPlayingCallId(null),
        (bars: number[]) => setWaveBars(bars.slice(0, 10))
      );
    }
  };

  const handleCopyPhone = (phone: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleSyncToCrm = (call: CallLog) => {
    setCrmSyncToast(true);
    setTimeout(() => setCrmSyncToast(false), 2500);
  };

  const exportToCsv = () => {
    const headers = ['ID,Номер,Имя,Услуга,Дата,Длительность (сек),Статус,Сумма BYN,Суть'];
    const rows = filteredLogs.map(l => 
      `"${l.id}","${l.callerNumber}","${l.callerName || ''}","${l.capturedData?.service || ''}","${l.timestamp}",${l.durationSeconds},"${l.status}",${l.dealValueByn},"${l.summary.replace(/"/g, '""')}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `voxi_leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: CallLog['status']) => {
    switch (status) {
      case 'lead_captured':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Лид собран
          </span>
        );
      case 'consultation':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Консультация
          </span>
        );
      case 'forwarded':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Переведен
          </span>
        );
      case 'spam':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Спам отсеян
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Unified Table Surface (Apple/Linear Style) */}
      <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xs overflow-hidden">
        
        {/* Table Toolbar Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/40">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Журнал вызовов и квалификация лидов
              </h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200 font-semibold">
                {filteredLogs.length} записей
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Входящие звонки на белорусские номера МТС/А1 с мгновенной расшифровкой и расчётом сделки
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportToCsv}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Экспорт CSV</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-3 sm:px-5 sm:py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white">
          
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по номеру (+375...), имени, услуге или филиалу..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-50/80 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'Все звонки' },
              { id: 'lead_captured', label: 'Лиды' },
              { id: 'consultation', label: 'Консультации' },
              { id: 'spam', label: 'Спам' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setSelectedStatus(f.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  selectedStatus === f.id
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 bg-white border border-slate-200/80'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-500 font-semibold">
                <th className="py-3 px-4">Абонент / Клиент</th>
                <th className="py-3 px-4">Запрос / Услуга (AI)</th>
                <th className="py-3 px-4">Дата и время</th>
                <th className="py-3 px-4">Хронометраж</th>
                <th className="py-3 px-4">Статус</th>
                <th className="py-3 px-4 text-right">Сумма BYN</th>
                <th className="py-3 px-4 text-center">Аудио / Инфо</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Звонков по выбранным фильтрам не найдено
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
                        isSelected 
                          ? 'bg-blue-50/60' 
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Caller */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[11px] shrink-0 border border-slate-200/60">
                            {call.callerName ? call.callerName.charAt(0) : '—'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">
                              {call.callerName || 'Не представился'}
                            </div>
                            <div className="font-mono text-[11px] text-slate-500">
                              {call.callerNumber}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Service / Lead Intent */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="truncate font-medium text-slate-900" title={serviceName}>
                          {serviceName}
                        </div>
                        {call.capturedData?.preferredDate && (
                          <div className="text-[10px] text-slate-400 truncate">
                            Дата: {call.capturedData.preferredDate}
                          </div>
                        )}
                      </td>

                      {/* Timestamp */}
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                        {call.timestamp}
                      </td>

                      {/* Duration & Cost */}
                      <td className="py-3.5 px-4 font-mono text-[11px] whitespace-nowrap">
                        <div className="text-slate-700 font-semibold">
                          {call.audioDuration} ({call.durationSeconds}с)
                        </div>
                        <div className="text-[10px] text-slate-400">
                          ~{(call.costByn || Math.max(0.20, Math.round((call.durationSeconds / 60) * 0.45 * 100) / 100)).toFixed(2)} BYN
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(call.status)}
                      </td>

                      {/* Deal Value */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold whitespace-nowrap text-slate-900">
                        {call.dealValueByn > 0 ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                            +{call.dealValueByn} BYN
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">0 BYN</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => handlePlayAudio(call, e)}
                            className={`p-1.5 rounded-lg border transition-all ${
                              isPlaying
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                            title="Слушать ответ ИИ"
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
                            Детали
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

      {/* 2. Slide-Over CRM Drawer (Right Panel without Blocking Table) */}
      <AnimatePresence>
        {activeCallDetail && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveCallDetail(null)}
              className="fixed inset-0 bg-slate-900/25 backdrop-blur-xs transition-opacity"
            />

            {/* Drawer Body */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-full max-w-lg bg-white shadow-2xl z-10 flex flex-col h-full border-l border-slate-200"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 flex items-center justify-center font-bold text-sm shrink-0">
                    {activeCallDetail.callerName ? activeCallDetail.callerName.charAt(0) : '—'}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {activeCallDetail.callerName || 'Неизвестный клиент'}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                      <span>{activeCallDetail.callerNumber}</span>
                      <button 
                        onClick={(e) => handleCopyPhone(activeCallDetail.callerNumber, e)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Скопировать номер"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {copiedPhone && <span className="text-[10px] text-emerald-600">Скопировано!</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getStatusBadge(activeCallDetail.status)}
                  <button
                    onClick={() => setActiveCallDetail(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                
                {/* Audio Player Card */}
                <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3 shadow-sm">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">Запись разговора (SIP МТС)</span>
                    <span className="font-mono text-emerald-400 font-bold">{activeCallDetail.audioDuration}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={(e) => handlePlayAudio(activeCallDetail, e)}
                      className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-sm transition-all"
                    >
                      {playingCallId === activeCallDetail.id ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4 ml-0.5" />
                      )}
                    </button>

                    {/* Animated Waveform Bars */}
                    <div className="flex-1 flex items-center gap-1 h-8">
                      {waveBars.map((height, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-full bg-slate-700 overflow-hidden"
                          style={{ height: '100%' }}
                        >
                          <div
                            className={`w-full transition-all duration-75 ${
                              playingCallId === activeCallDetail.id ? 'bg-blue-400' : 'bg-slate-500'
                            }`}
                            style={{ height: `${playingCallId === activeCallDetail.id ? height : 30}%` }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Сгенерировано нейросетью Voxi с белорусским битрейтом 24 кГц
                  </p>
                </div>

                {/* Extracted CRM Lead Fields */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Карточка лида (квалифицировано ИИ):
                    </span>
                    {activeCallDetail.dealValueByn > 0 && (
                      <span className="text-xs font-bold font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {activeCallDetail.dealValueByn} BYN
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Услуга / Курс:</span>
                      <strong className="text-slate-900 font-semibold block truncate">
                        {activeCallDetail.capturedData?.service || 'Консультация'}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400 block">Желаемое время:</span>
                      <strong className="text-slate-900 font-semibold block truncate">
                        {activeCallDetail.capturedData?.preferredDate || 'Не указано'}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400 block">Филиал / Адрес:</span>
                      <strong className="text-slate-900 font-semibold block truncate">
                        {activeCallDetail.capturedData?.cityOrBranch || agent?.address || 'Минск'}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400 block">Срочность:</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                        Высокая (Горячий лид)
                      </span>
                    </div>
                  </div>

                  {activeCallDetail.summary && (
                    <div className="pt-2 border-t border-slate-200/60 text-xs text-slate-600 leading-relaxed">
                      <strong className="text-slate-900 block mb-0.5">Суть разговора:</strong>
                      {activeCallDetail.summary}
                    </div>
                  )}
                </div>

                {/* Formatted Transcript Messages */}
                <div className="space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Стенограмма диалога:
                  </span>

                  <div className="space-y-2.5">
                    {activeCallDetail.transcript.map((msg, i) => {
                      const isAi = msg.speaker === 'assistant';
                      return (
                        <div
                          key={i}
                          className={`flex flex-col ${isAi ? 'items-start' : 'items-end'}`}
                        >
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-0.5 px-1 font-mono">
                            <span>{isAi ? `Voxi (${agent?.voice === 'dmitry' ? 'Дмитрий' : 'Анна'})` : (activeCallDetail.callerName || 'Клиент')}</span>
                            <span>•</span>
                            <span>{msg.time}</span>
                          </div>
                          <div
                            className={`p-3 rounded-2xl text-xs max-w-[88%] leading-relaxed ${
                              isAi
                                ? 'bg-blue-50 text-slate-900 border border-blue-100 rounded-tl-sm'
                                : 'bg-slate-900 text-white rounded-tr-sm'
                            }`}
                          >
                            {msg.text}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleSyncToCrm(activeCallDetail)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Отправить лид в Telegram / CRM</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveCallDetail(null)}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors"
                >
                  Закрыть
                </button>
              </div>

              {/* Toast for CRM sync */}
              {crmSyncToast && (
                <div className="absolute bottom-16 left-4 right-4 p-3 rounded-xl bg-emerald-600 text-white text-xs flex items-center gap-2 shadow-lg animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Лид успешно передан в Telegram и Bitrix24!</span>
                </div>
              )}

            </motion.div>

          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
