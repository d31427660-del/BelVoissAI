import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  PhoneCallingRoundedIcon as PhoneCall, 
  WalletMoneyIcon as Wallet, 
  ClockCircleIcon as Clock,
  PlayIcon as Play,
  PauseIcon as Pause,
  CheckCircleIcon as CheckCircle2,
  ArrowRightIcon as ArrowRight,
  ShieldCheckIcon as ShieldCheck,
  SoundwaveCircleIcon as Radio,
  UserRoundedIcon as UserIcon,
  AltArrowRightIcon as ChevronRight
} from '@solar-icons/react/bold-duotone';
import { AgentConfig, CallLog, SipSettings, UserSession } from '../../types';
import { VoiceSimulator } from '../../lib/speechSynth';

interface SimpleOverviewTabProps {
  user: UserSession;
  agent: AgentConfig;
  callLogs: CallLog[];
  sipSettings: SipSettings;
  onNavigateTab: (tab: 'overview' | 'agent' | 'calls' | 'analytics') => void;
  onOpenVoiceTest: () => void;
  onToggleActive: () => void;
  onOpenTopUp?: () => void;
}

export const SimpleOverviewTab: React.FC<SimpleOverviewTabProps> = ({
  user,
  agent,
  callLogs,
  sipSettings,
  onNavigateTab,
  onOpenVoiceTest,
  onToggleActive,
  onOpenTopUp
}) => {
  const [playingCallId, setPlayingCallId] = useState<string | null>(null);

  const totalCalls = callLogs.length || 142;
  const savedRevenueByn = 3850;
  const minutesRemaining = user.balanceMinutes;

  const recentCalls = callLogs.slice(0, 3);

  const handlePlayAudio = (call: CallLog) => {
    if (playingCallId === call.id) {
      VoiceSimulator.stop();
      setPlayingCallId(null);
      return;
    }

    setPlayingCallId(call.id);
    const textToSpeak = call.transcript[0]?.text || call.summary;
    VoiceSimulator.speak(
      textToSpeak,
      agent.voice,
      () => {},
      () => setPlayingCallId(null)
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* 1. Main Status Hero Card (Clear, Calm, Apple-style) */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
            agent.isActive 
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
              : 'bg-slate-100 text-slate-400 border border-slate-200'
          }`}>
            <PhoneCall className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                {agent.companyName}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                agent.isActive 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                <span className={`w-2 h-2 rounded-full ${agent.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                {agent.isActive ? 'Принимает звонки' : 'На паузе'}
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Голос: <strong>{agent.voice === 'dmitry' ? 'Дмитрий' : 'Анна'}</strong> • Подключен к номеру: <strong className="text-slate-700">{sipSettings.callerId}</strong>
            </p>
          </div>
        </div>

        {/* Master Action Buttons */}
        <div className="flex items-center gap-3 self-start md:self-center">
          <button
            onClick={onOpenVoiceTest}
            className="px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <Radio className="w-4 h-4" />
            <span>Тестовый звонок боту</span>
          </button>

          <button
            onClick={onToggleActive}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-xs ${
              agent.isActive
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {agent.isActive ? 'Поставить на паузу' : 'Включить прием звонков'}
          </button>
        </div>
      </div>

      {/* 2. Three Key Metrics (Big, Simple, Understandable) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Metric 1: Принято вызовов */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-medium">Принято звонков ИИ</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {totalCalls}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            0 пропущенных звонков
          </p>
        </div>

        {/* Metric 2: Спасенная выручка */}
        <div 
          onClick={() => onNavigateTab('analytics')}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2 cursor-pointer hover:border-emerald-300 transition-all group"
          title="Открыть подробную аналитику и графики ROI"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-medium group-hover:text-emerald-700 transition-colors">Спасенная выручка (ROI)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            +{savedRevenueByn} <span className="text-base font-semibold text-slate-500">BYN</span>
          </div>
          <p className="text-[11px] text-emerald-700 font-medium flex items-center justify-between">
            <span>Звонки после 19:00 и в сб-вс</span>
            <span>Графики →</span>
          </p>
        </div>

        {/* Metric 3: Остаток минут */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-medium">Остаток минут на балансе</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563eb] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-baseline justify-between">
            <div>
              {user.balanceMinutes} <span className="text-base font-semibold text-slate-500">мин</span>
            </div>
            {onOpenTopUp && (
              <button
                onClick={onOpenTopUp}
                className="text-xs px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#2563eb] font-semibold transition-colors"
              >
                + Пополнить
              </button>
            )}
          </div>
          <p className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>~{(user.balanceMinutes * user.ratePerMinute).toFixed(1)} BYN на счете</span>
            <span className="text-emerald-600 font-medium">Бессрочные</span>
          </p>
        </div>

      </div>

      {/* 3. Recent Call Leads Section (Clean List, 1-Click Play) */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Свежие принятые звонки
            </h3>
            <p className="text-xs text-slate-500">
              Клиенты, которых бот проконсультировал и записал
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('calls')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
          >
            <span>Смотреть все ({callLogs.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {recentCalls.map((call) => (
            <div key={call.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
              <div className="flex items-start sm:items-center gap-3">
                <button
                  type="button"
                  onClick={() => handlePlayAudio(call)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    playingCallId === call.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-600'
                  }`}
                  title="Прослушать запись разговора"
                >
                  {playingCallId === call.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {call.callerName || 'Новый клиент'}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {call.callerNumber}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">
                    {call.summary}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:self-center pl-12 sm:pl-0">
                <span className="text-xs font-bold font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  +{call.dealValueByn} BYN
                </span>
                <span className="text-[11px] text-slate-400">
                  {call.timestamp.split(' ')[1]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Easy Quick Actions (One-click guidance) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div 
          onClick={() => onNavigateTab('agent')}
          className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/60 to-indigo-50/40 border border-blue-200/80 cursor-pointer hover:border-blue-300 transition-all group flex items-center justify-between"
        >
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-blue-900 group-hover:text-blue-700 flex items-center gap-1.5">
              <span>Изменить цены, график или голос</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </h4>
            <p className="text-[11px] text-slate-600">
              Простая настройка без технических терминов за 2 минуты
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-semibold text-slate-800 block">Белорусский комплаенс 99-З:</span>
              <span>Серверы в Минске (beCloud), ПДн защищены</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
