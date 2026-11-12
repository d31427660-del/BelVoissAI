import React, { useState, useRef, useEffect } from 'react';
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
  AltArrowRightIcon as ChevronRight,
  CpuBoltIcon as Bot,
  ShareCircleIcon as Network
} from '@solar-icons/react/bold-duotone';
import { AgentConfig, CallLog, SipSettings, UserSession, VoiceId } from '../../types';
import { VoiceSimulator } from '../../lib/speechSynth';

interface SimpleOverviewTabProps {
  user: UserSession;
  agent: AgentConfig;
  callLogs: CallLog[];
  sipSettings: SipSettings;
  onNavigateTab: (tab: 'overview' | 'agent' | 'calls' | 'integrations') => void;
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
  const playbackRunRef = useRef(0);

  useEffect(() => {
    return () => {
      playbackRunRef.current += 1;
      VoiceSimulator.stop();
    };
  }, []);

  const totalCalls = callLogs.length;
  const savedRevenueByn = callLogs.reduce((sum, c) => sum + (c.dealValueByn || 0), 0);
  const recentCalls = callLogs.slice(0, 3);

  const handlePlayAudio = async (call: CallLog) => {
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

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. Main Status Hero Card */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
              agent.isActive
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : 'bg-slate-100 text-slate-400 border border-slate-200'
            }`}
          >
            <PhoneCall className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                {agent.companyName}
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                  agent.isActive
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    agent.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                  }`}
                />
                {agent.isActive ? 'Принимает звонки 24/7' : 'Поставлен на паузу'}
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Голос бота: <strong>{agent.voice === 'maxim' ? 'Максим' : 'Анна'}</strong> • Номер компании:{' '}
              <strong className="text-slate-700">{sipSettings.callerId}</strong>
            </p>
          </div>
        </div>

        {/* Master Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
          <button
            type="button"
            onClick={onOpenVoiceTest}
            title="Позвонить боту через микрофон компьютера или телефона"
            className="px-5 h-10 rounded-full liquid-glass-btn-primary text-white text-xs font-normal flex items-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
          >
            <Radio className="w-4 h-4" />
            <span>Позвонить боту (тест)</span>
          </button>

          <button
            type="button"
            onClick={onToggleActive}
            title={agent.isActive ? 'Временно отключить ответы бота' : 'Снова включить ответы бота на звонки'}
            className={`px-5 h-10 rounded-full text-xs font-normal transition-all cursor-pointer ${
              agent.isActive
                ? 'liquid-glass-pill text-black hover:bg-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {agent.isActive ? 'Поставить на паузу' : 'Включить прием звонков'}
          </button>
        </div>
      </div>

      {/* 2. Simple 3-Step Launch Checklist */}
      <div className="p-5 sm:p-6 rounded-[16px] liquid-glass-card space-y-4">
        <div>
          <h3 className="text-sm font-medium text-black">
            Быстрая настройка в 3 простых шага
          </h3>
          <p className="text-xs text-[#777169] mt-0.5">
            Нажмите на любой шаг, чтобы заполнить данные своей компании — внутри есть подсказки к каждому полю
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => onNavigateTab('agent')}
            className="p-4 rounded-[12px] liquid-glass-cream hover:bg-white text-left transition-all group space-y-1.5 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-black">
                <Bot className="w-4 h-4 text-black" />
                <span>1. Услуги, цены и голос</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-[#777169] group-hover:text-black group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-[11px] text-[#59544F] leading-relaxed">
              Напишите название компании, график работы и прайс-лист простыми словами.
            </p>
          </button>

          <button
            type="button"
            onClick={onOpenVoiceTest}
            className="p-4 rounded-[12px] liquid-glass-cream hover:bg-white text-left transition-all group space-y-1.5 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-black">
                <Radio className="w-4 h-4 text-black" />
                <span>2. Проверка диалога</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-[#777169] group-hover:text-black group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-[11px] text-[#59544F] leading-relaxed">
              Позвоните боту прямо с экрана и проверьте ответы на вопросы голосом или текстом.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('integrations')}
            className="p-4 rounded-[12px] liquid-glass-cream hover:bg-white text-left transition-all group space-y-1.5 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-black">
                <Network className="w-4 h-4 text-black" />
                <span>3. Номер и Telegram</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-[#777169] group-hover:text-black group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-[11px] text-[#59544F] leading-relaxed">
              Укажите, куда присылать заявки в Telegram и какой номер подключить.
            </p>
          </button>
        </div>
      </div>

      {/* 3. Three Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-[12px] liquid-glass-card space-y-2">
          <div className="flex items-center justify-between text-[#777169] text-xs">
            <span className="font-normal">Принято звонков ботом</span>
            <div className="w-8 h-8 rounded-[8px] bg-black text-white flex items-center justify-center">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-medium text-black tracking-tight font-mono">
            {totalCalls}
          </div>
          <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {totalCalls > 0
                ? 'Все клиенты получили ответ с первого гудка'
                : 'Готов принять первый тестовый или рабочий звонок'}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('calls')}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2 text-left hover:border-emerald-300 transition-all group"
          title="Открыть журнал звонков"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-medium group-hover:text-emerald-700 transition-colors">
              Сохраненные заказы
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            +{savedRevenueByn} <span className="text-base font-semibold text-slate-500">BYN</span>
          </div>
          <p className="text-[11px] text-emerald-700 font-medium flex items-center justify-between">
            <span>Вечерние и выходные звонки</span>
            <span>Журнал звонков →</span>
          </p>
        </button>

        <div className="p-5 rounded-[12px] liquid-glass-card space-y-2">
          <div className="flex items-center justify-between text-[#777169] text-xs">
            <span className="font-normal">Минуты на балансе</span>
            <div className="w-8 h-8 rounded-[8px] bg-black text-white flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-medium text-black tracking-tight flex items-baseline justify-between font-mono">
            <div>
              {user.balanceMinutes}{' '}
              <span className="text-base font-normal text-[#777169]">мин</span>
            </div>
            {onOpenTopUp && (
              <button
                type="button"
                onClick={onOpenTopUp}
                className="text-xs px-3 py-1 rounded-full liquid-glass-pill text-black hover:bg-white font-normal transition-colors cursor-pointer"
              >
                + Пополнить
              </button>
            )}
          </div>
          <p className="text-[11px] text-[#777169] flex items-center justify-between font-mono">
            <span>~{((user.balanceMinutes || 0) * (user.ratePerMinute || 0.45)).toFixed(1)} BYN</span>
            <span className="text-emerald-700 font-sans">Не сгорают в конце месяца</span>
          </p>
        </div>
      </div>

      {/* 4. Recent Call Leads Section */}
      <div className="p-6 rounded-[16px] liquid-glass-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
          <div>
            <h3 className="text-base font-medium text-black">
              Последние заявки со звонков
            </h3>
            <p className="text-xs text-[#777169]">
              Нажмите на кнопку воспроизведения, чтобы послушать ответ бота
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('calls')}
            className="text-xs font-normal text-black hover:underline flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Все звонки ({callLogs.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-black/[0.06]">
          {recentCalls.length === 0 ? (
            <div className="py-8 text-center space-y-2.5">
              <p className="text-xs text-[#777169]">
                В журнале пока нет звонков. Проверьте бота голосом — тестовый диалог сразу появится здесь!
              </p>
              <button
                type="button"
                onClick={onOpenVoiceTest}
                className="px-4 py-2 rounded-full liquid-glass-btn-primary text-white text-xs font-normal inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Сделать пробный звонок</span>
              </button>
            </div>
          ) : (
            recentCalls.map((call) => (
            <div
              key={call.id}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
            >
              <div className="flex items-start sm:items-center gap-3">
                <button
                  type="button"
                  onClick={() => handlePlayAudio(call)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                    playingCallId === call.id
                      ? 'liquid-glass-btn-primary text-white'
                      : 'liquid-glass-pill text-black hover:bg-white'
                  }`}
                  title="Послушать запись ответа"
                >
                  {playingCallId === call.id ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4 ml-0.5" />
                  )}
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
                  {call.timestamp.split(' ')[1] || call.timestamp}
                </span>
              </div>
            </div>
            ))
          )}
        </div>
      </div>

      {/* 5. Calm Data Safety Footer */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3 text-xs text-slate-600">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
        <span>
          <strong className="text-slate-800">Безопасная работа в Беларуси:</strong> ваши контакты и записи разговоров защищены и обрабатываются в соответствии с законодательством РБ.
        </span>
      </div>
    </div>
  );
};
