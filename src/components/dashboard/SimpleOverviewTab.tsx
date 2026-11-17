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
import { isMockCompanyOrTest } from '../../lib/botDialogueEngine';

interface SimpleOverviewTabProps {
  user: UserSession;
  agent: AgentConfig;
  callLogs: CallLog[];
  sipSettings: SipSettings;
  onNavigateTab: (tab: 'overview' | 'agent' | 'leads' | 'phone' | 'calls' | 'integrations' | 'billing') => void;
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
  onToggleActive
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
  const freeMins = user.billing?.freeMinutesRemaining ?? user.balanceMinutes ?? 0;
  const unpaidDebtByn = user.billing?.unpaidDebtByn ?? 0;
  const isOwnSip = user.billing ? user.billing.numberRentalMode === 'own_sip' : Boolean(sipSettings.byoSipMode);

  // Реальный статус выполнения 3 шагов настройки
  const effectiveCompany = (agent.companyName || user.companyName || '').trim();
  const isStep1Done = Boolean(
    (effectiveCompany && !isMockCompanyOrTest(effectiveCompany)) &&
      (agent.pricingAndServices?.trim() || agent.businessActivity?.trim() || agent.address?.trim())
  );
  const isStep2Done = totalCalls > 0;
  const isStep3Done = Boolean(
    sipSettings.callerId?.trim() || sipSettings.transferPhone?.trim() || agent.phone?.trim()
  );
  const completedStepsCount = [isStep1Done, isStep2Done, isStep3Done].filter(Boolean).length;

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
      {/* 1. Dark Contrast Hero Card (Главный статус-блок) */}
      <div className="p-6 sm:p-7 rounded-3xl bg-[#141417] text-white border border-white/10 shadow-xl relative overflow-hidden">
        <div
          className="pointer-events-none absolute -top-24 -right-16 w-80 h-80 rounded-full opacity-25"
          style={{
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.5) 0%, rgba(59, 130, 246, 0.25) 55%, transparent 75%)'
          }}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div
              className={`w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                agent.isActive
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-white/10 text-zinc-400 border border-white/15'
              }`}
            >
              <PhoneCall className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  {agent.companyName || user.companyName || 'Моя компания'}
                </h2>
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                    agent.isActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-white/10 text-zinc-300 border border-white/15'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      agent.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-400'
                    }`}
                  />
                  {agent.isActive ? 'Принимает звонки 24/7' : 'Поставлен на паузу'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-300">
                <span>
                  Голос бота: <strong className="text-white">{agent.voice === 'maxim' ? 'Максим' : 'Анна'}</strong>
                </span>
                <span className="text-zinc-600">•</span>
                <span>
                  Номер линии:{' '}
                  <strong className="text-white font-mono">
                    {sipSettings.callerId || '+375 (29) — не указан'}
                  </strong>
                </span>
                <span className="text-zinc-600">•</span>
                <span>
                  Тариф:{' '}
                  <button
                    type="button"
                    onClick={() => onNavigateTab('billing')}
                    className="text-amber-300 hover:text-amber-200 font-semibold underline underline-offset-2 cursor-pointer"
                  >
                    {(user.ratePerMinute || 0.45).toFixed(2)} BYN/мин ({isOwnSip ? 'Свой SIP 0 BYN' : 'А1 ВАТС 15 BYN/мес'})
                  </button>
                </span>
              </div>
            </div>
          </div>

          {/* Master Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center shrink-0">
            <button
              type="button"
              onClick={onOpenVoiceTest}
              title="Позвонить боту через микрофон компьютера или телефона"
              className="px-5 h-10 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
            >
              <Radio className="w-4 h-4" />
              <span>Позвонить боту (тест)</span>
            </button>

            <button
              type="button"
              onClick={onToggleActive}
              title={agent.isActive ? 'Временно отключить ответы бота' : 'Снова включить ответы бота на звонки'}
              className={`px-4 h-10 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                agent.isActive
                  ? 'bg-white/10 hover:bg-white/15 text-white border-white/15'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
              }`}
            >
              {agent.isActive ? 'Поставить на паузу' : 'Включить приём звонков'}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Simple 3-Step Launch Checklist with Real Completion Status */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Быстрая настройка в 3 простых шага
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Нажмите на любой шаг, чтобы заполнить или проверить настройки вашей компании
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <div className="flex items-center gap-1" aria-hidden="true">
              {[isStep1Done, isStep2Done, isStep3Done].map((done, i) => (
                <span
                  key={i}
                  className={`w-6 h-1.5 rounded-full transition-colors ${
                    done ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
            <span
              className={`text-[11px] font-bold px-3 py-1 rounded-full border ${
                completedStepsCount === 3
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-indigo-50 text-indigo-800 border-indigo-200'
              }`}
            >
              {completedStepsCount === 3
                ? '✓ Все 3 шага готовы'
                : `Готово ${completedStepsCount} из 3 шагов`}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Шаг 1 */}
          <button
            type="button"
            onClick={() => onNavigateTab('agent')}
            className={`p-4 rounded-2xl border text-left transition-all group flex flex-col justify-between gap-3 cursor-pointer ${
              isStep1Done
                ? 'bg-emerald-50/35 hover:bg-emerald-50/70 border-emerald-200/90'
                : 'bg-slate-50/80 hover:bg-indigo-50/50 border-slate-200/90 hover:border-indigo-300'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-900">
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isStep1Done ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'
                    }`}
                  >
                    {isStep1Done ? <CheckCircle2 className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </span>
                  <span>1. Услуги, цены и голос</span>
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Укажите сферу бизнеса, адрес, график работы и прайс-лист простыми словами.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px]">
              <span
                className={`px-2 py-0.5 rounded-full font-semibold ${
                  isStep1Done
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-900'
                }`}
              >
                {isStep1Done ? '✓ Заполнено' : 'Требует настройки'}
              </span>
              <span className="text-slate-500 group-hover:text-slate-900 font-medium">
                {isStep1Done ? 'Изменить →' : 'Заполнить →'}
              </span>
            </div>
          </button>

          {/* Шаг 2 */}
          <button
            type="button"
            onClick={onOpenVoiceTest}
            className={`p-4 rounded-2xl border text-left transition-all group flex flex-col justify-between gap-3 cursor-pointer ${
              isStep2Done
                ? 'bg-emerald-50/35 hover:bg-emerald-50/70 border-emerald-200/90'
                : 'bg-slate-50/80 hover:bg-emerald-50/50 border-slate-200/90 hover:border-emerald-300'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-900">
                  <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    {isStep2Done ? <CheckCircle2 className="w-4 h-4" /> : <Radio className="w-4 h-4" />}
                  </span>
                  <span>2. Проверка диалога</span>
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Позвоните боту прямо с экрана и проверьте ответы на вопросы голосом или текстом.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px]">
              <span
                className={`px-2 py-0.5 rounded-full font-semibold ${
                  isStep2Done
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-900'
                }`}
              >
                {isStep2Done ? `✓ Проверено (${totalCalls})` : 'Требует проверки'}
              </span>
              <span className="text-slate-500 group-hover:text-slate-900 font-medium">
                Позвонить →
              </span>
            </div>
          </button>

          {/* Шаг 3 */}
          <button
            type="button"
            onClick={() => onNavigateTab('phone')}
            className={`p-4 rounded-2xl border text-left transition-all group flex flex-col justify-between gap-3 cursor-pointer ${
              isStep3Done
                ? 'bg-emerald-50/35 hover:bg-emerald-50/70 border-emerald-200/90'
                : 'bg-slate-50/80 hover:bg-teal-50/50 border-slate-200/90 hover:border-teal-300'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-900">
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isStep3Done ? 'bg-emerald-100 text-emerald-700' : 'bg-teal-100 text-teal-700'
                    }`}
                  >
                    {isStep3Done ? <CheckCircle2 className="w-4 h-4" /> : <Network className="w-4 h-4" />}
                  </span>
                  <span>3. Подключение номера</span>
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Настройте переадресацию за 10 секунд или свой SIP и укажите номер для перевода.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px]">
              <span
                className={`px-2 py-0.5 rounded-full font-semibold ${
                  isStep3Done
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-900'
                }`}
              >
                {isStep3Done ? '✓ Заполнено' : 'Требует настройки'}
              </span>
              <span className="text-slate-500 group-hover:text-slate-900 font-medium">
                {isStep3Done ? 'Проверить →' : 'Подключить →'}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* 3. Three Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Метрика 1: Звонки */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between text-slate-600 text-xs">
            <span className="font-semibold">Принято звонков ботом</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/80 flex items-center justify-center">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
            {totalCalls}
          </div>
          <p className="text-[11px] text-blue-700 font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>
              {totalCalls > 0
                ? 'Все клиенты получили ответ с первого гудка'
                : 'Готов принять первый тестовый или рабочий звонок'}
            </span>
          </p>
        </div>

        {/* Метрика 2: Сохраненные заказы */}
        <button
          type="button"
          onClick={() => onNavigateTab('leads')}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2.5 text-left hover:border-emerald-300 transition-all group cursor-pointer"
          title="Открыть список заявок"
        >
          <div className="flex items-center justify-between text-slate-600 text-xs">
            <span className="font-semibold group-hover:text-emerald-700 transition-colors">
              Сохранённые заказы
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
            +{savedRevenueByn} <span className="text-base font-bold text-slate-500">BYN</span>
          </div>
          <p className="text-[11px] text-emerald-700 font-semibold flex items-center justify-between">
            <span>Вечерние и выходные звонки</span>
            <span>Все заявки →</span>
          </p>
        </button>

        {/* Метрика 3: Тариф и оплата */}
        <button
          type="button"
          onClick={() => onNavigateTab('billing')}
          className="p-5 rounded-2xl bg-white border border-amber-200/90 hover:border-amber-400 shadow-xs space-y-2.5 text-left transition-all group cursor-pointer"
          title="Открыть раздел Тариф и оплата"
        >
          <div className="flex items-center justify-between text-slate-600 text-xs">
            <span className="font-semibold group-hover:text-amber-800 transition-colors">
              Тариф и счёт за месяц
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
              {unpaidDebtByn.toFixed(2)}{' '}
              <span className="text-base font-bold text-slate-500">BYN</span>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-amber-500 group-hover:bg-amber-400 text-slate-950 font-bold transition-colors shrink-0">
              Тарифы →
            </span>
          </div>
          <div className="text-[11px] text-slate-600 flex items-center justify-between">
            <span className="font-medium text-emerald-700">
              {freeMins > 0
                ? `Бонус: ${freeMins.toFixed(1)} мин (0 BYN)`
                : `Тариф: ${(user.ratePerMinute || 0.45).toFixed(2)} BYN/мин`}
            </span>
            <span className="text-slate-500">Карта / ЕРИП</span>
          </div>
        </button>
      </div>

      {/* 4. Recent Call Leads Section */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Последние заявки со звонков
            </h3>
            <p className="text-xs text-slate-500">
              Нажмите на кнопку воспроизведения, чтобы послушать ответ бота
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('leads')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Все заявки ({callLogs.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {recentCalls.length === 0 ? (
            <div className="py-8 text-center space-y-2.5">
              <p className="text-xs text-slate-500">
                В журнале пока нет звонков. Проверьте бота голосом — тестовый диалог сразу появится здесь!
              </p>
              <button
                type="button"
                onClick={onOpenVoiceTest}
                className="px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
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
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
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
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-3 text-xs text-slate-600">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
        <span>
          <strong className="text-slate-900">Безопасная работа в Беларуси:</strong> ваши контакты и записи разговоров защищены и обрабатываются в соответствии с Законом РБ № 99‑З. ИП Беляков К.О. (УНП 193991846).
        </span>
      </div>
    </div>
  );
};
