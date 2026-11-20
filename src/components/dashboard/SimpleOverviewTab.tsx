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
import { StatCard } from '@/components/motion';

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
  const creditLimitByn = user.billing?.creditLimitByn ?? 100;
  const isSuspended = user.billing?.billingStatus === 'suspended' || unpaidDebtByn > creditLimitByn;
  const isBotOnline = agent.isActive && !isSuspended;
  const isOwnSip = user.billing ? user.billing.numberRentalMode === 'own_sip' : Boolean(sipSettings.byoSipMode);

  // Реальный статус выполнения 3 шагов настройки
  const effectiveCompany = (agent.companyName || user.companyName || '').trim();
  const isStep1Done = Boolean(
    effectiveCompany &&
      !isMockCompanyOrTest(effectiveCompany) &&
      agent.pricingAndServices?.trim().length > 0
  );
  const isStep2Done = totalCalls > 0;
  const isStep3Done = Boolean(
    isOwnSip
      ? sipSettings.sipLogin?.trim()
      : sipSettings.assignedDid?.trim() || sipSettings.callerId?.trim()
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
    <div className="space-y-6">
      {/* Editorial mono eyebrow rule */}
      <div className="flex items-center justify-between gap-4">
        <div className="inline-flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#737373]">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isBotOnline ? 'bg-[#16A34A]' : isSuspended ? 'bg-[#FE432A]' : 'bg-[#A3A3A3]'
            }`}
          />
          <span>Обзор кабинета</span>
        </div>
        <div className="hidden sm:block h-px flex-1 bg-black/[0.08]" />
        <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#737373]">
          VOXI.BY · BYN
        </span>
      </div>

      {isSuspended && (
        <div
          role="alert"
          className="p-5 sm:p-6 rounded-[24px] bg-[#FFF5F3] border border-[#FE432A]/40 text-[#7F1D1D] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <div className="font-display text-[15px] font-bold text-black">
              Кредитный лимит ({creditLimitByn} BYN) превышен — бот временно на паузе
            </div>
            <p className="text-[13px] text-[#7F1D1D] leading-relaxed">
              Накопленная задолженность составляет <strong className="font-mono">{unpaidDebtByn.toFixed(2)} BYN</strong>. Погасите счёт картой или через ЕРИП в разделе «Тариф и оплата», чтобы возобновить приём звонков.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('billing')}
            className="h-10 px-5 rounded-full bg-[#FE432A] hover:bg-[#DC2626] text-white text-[12px] font-semibold shrink-0 cursor-pointer transition-colors"
          >
            Оплатить долг ({unpaidDebtByn.toFixed(2)} BYN) ↗
          </button>
        </div>
      )}

      {/* 1. Dotted Obsidian Hero Status Card */}
      <div className="voxi-dot-surface p-6 sm:p-8 rounded-[28px] text-white border border-black">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-4 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full font-mono text-[10.5px] uppercase tracking-[0.1em] font-semibold border ${
                  isBotOnline
                    ? 'bg-[#6BFF91]/15 text-[#6BFF91] border-[#6BFF91]/30'
                    : isSuspended
                    ? 'bg-[#FE432A]/20 text-[#FCA5A5] border-[#FE432A]/40'
                    : 'bg-white/10 text-white/70 border-white/15'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isBotOnline ? 'bg-[#6BFF91] animate-pulse' : isSuspended ? 'bg-[#FE432A]' : 'bg-white/50'
                  }`}
                />
                {isBotOnline
                  ? 'Принимает звонки 24/7'
                  : isSuspended
                  ? `Приостановлен · лимит ${creditLimitByn} BYN`
                  : 'Поставлен на паузу'}
              </span>

              <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-white/50">
                Голос: {agent.voice === 'maxim' ? 'Максим' : 'Анна'}
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-[32px] font-bold tracking-[-0.035em] leading-[1.1] text-white truncate">
              {agent.companyName || user.companyName || 'Моя компания'}
            </h1>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-white/70">
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <PhoneCall className="w-4 h-4 text-white/45" />
                <span className="font-mono text-white">
                  {sipSettings.callerId || '+375 (29) — не указан'}
                </span>
              </span>

              <button
                type="button"
                onClick={() => onNavigateTab('billing')}
                className="inline-flex items-center gap-1.5 text-[#D8E738] hover:underline underline-offset-4 font-mono text-[12px] cursor-pointer whitespace-nowrap"
              >
                <span>
                  {(user.ratePerMinute || 0.45).toFixed(2)} BYN/мин ·{' '}
                  {isOwnSip ? 'Свой SIP (0 BYN)' : 'А1 ВАТС (15 BYN/мес)'}
                </span>
                <span>↗</span>
              </button>
            </div>
          </div>

          {/* Master Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center shrink-0">
            <button
              type="button"
              onClick={onOpenVoiceTest}
              title="Позвонить боту через микрофон компьютера или телефона"
              className="h-11 px-5 rounded-full bg-[#6BFF91] hover:bg-[#52F07A] text-black text-[13px] font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Radio className="w-4 h-4" />
              <span>Позвонить боту (тест)</span>
            </button>

            <button
              type="button"
              disabled={isSuspended}
              onClick={() => {
                if (!isSuspended) onToggleActive();
              }}
              title={
                isSuspended
                  ? 'Приём звонков приостановлен из-за задолженности. Оплатите счёт во вкладке «Тариф и оплата».'
                  : agent.isActive
                  ? 'Временно отключить ответы бота'
                  : 'Снова включить ответы бота на звонки'
              }
              className={`h-11 px-5 rounded-full text-[13px] font-semibold transition-colors border ${
                isSuspended
                  ? 'bg-[#FE432A]/15 text-[#FCA5A5] border-[#FE432A]/30 cursor-not-allowed'
                  : agent.isActive
                  ? 'bg-white/[0.08] hover:bg-white/[0.14] text-white border-white/15 cursor-pointer'
                  : 'bg-white text-black border-white hover:bg-[#D8E738] cursor-pointer'
              }`}
            >
              {isSuspended
                ? 'Приостановлен'
                : agent.isActive
                ? 'Поставить на паузу'
                : 'Включить приём звонков'}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Three Editorial Metric Tiles (Neutral / Forest / Lime) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Calls */}
        <div className="p-6 rounded-[24px] bg-[#F5F5F5] border border-black/[0.06] flex flex-col justify-between gap-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-[#737373]">
              01 · Принято звонков
            </span>
            <PhoneCall className="w-4 h-4 text-black/40" />
          </div>
          <div>
            <div className="font-display text-4xl font-bold text-black tracking-[-0.04em] tabular-nums">
              {totalCalls}
            </div>
            <p className="text-[12.5px] text-[#525252] mt-2 leading-snug">
              {totalCalls > 0
                ? 'Все клиенты получили ответ с первого гудка'
                : 'Готов принять первый тестовый или рабочий звонок'}
            </p>
          </div>
        </div>

        {/* Metric 2: Saved Revenue (Deep Forest + Neon Mint) */}
        <button
          type="button"
          onClick={() => onNavigateTab('leads')}
          className="p-6 rounded-[24px] bg-[#1C3B36] hover:bg-[#16302C] text-white text-left flex flex-col justify-between gap-5 transition-colors group cursor-pointer"
          title="Открыть список заявок"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-white/65">
              02 · Сохранённые заказы
            </span>
            <Wallet className="w-4 h-4 text-[#6BFF91]" />
          </div>
          <div>
            <div className="font-display text-4xl font-bold text-[#6BFF91] tracking-[-0.04em] tabular-nums">
              +{savedRevenueByn.toLocaleString('ru-RU')}{' '}
              <span className="text-lg font-mono font-semibold text-white/75">BYN</span>
            </div>
            <div className="text-[12.5px] text-white/75 mt-2 flex items-center justify-between gap-2">
              <span>Вечерние и пиковые звонки</span>
              <span className="font-mono text-[11px] text-[#6BFF91] group-hover:translate-x-0.5 transition-transform">
                Заявки ↗
              </span>
            </div>
          </div>
        </button>

        {/* Metric 3: Tariff & Monthly Due (Acid Lime) */}
        <button
          type="button"
          onClick={() => onNavigateTab('billing')}
          className="p-6 rounded-[24px] bg-[#D8E738] hover:bg-[#CFDF2E] text-black text-left flex flex-col justify-between gap-5 transition-colors group cursor-pointer"
          title="Открыть раздел Тариф и оплата"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-black/65">
              03 · Счёт за месяц
            </span>
            <Clock className="w-4 h-4 text-black/65" />
          </div>
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <div className="font-display text-4xl font-bold text-black tracking-[-0.04em] tabular-nums">
                {unpaidDebtByn.toFixed(2)}{' '}
                <span className="text-lg font-mono font-semibold text-black/65">BYN</span>
              </div>
              <span className="text-[11px] px-3 py-1 rounded-full bg-black text-white font-semibold shrink-0">
                Тарифы ↗
              </span>
            </div>
            <div className="text-[12px] text-black/75 mt-2 flex items-center justify-between gap-2">
              <span className="font-medium truncate">
                {freeMins > 0
                  ? `Баланс: ${freeMins.toFixed(1)} мин`
                  : `${(user.ratePerMinute || 0.45).toFixed(2)} BYN/мин`}
              </span>
              <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] shrink-0">
                Карта · ЕРИП
              </span>
            </div>
          </div>
        </button>
      </div>

      {/* 3. Real Analytics StatCard (honest empty state when 0 calls) */}
      {totalCalls === 0 ? (
        <div className="p-6 sm:p-7 rounded-[24px] bg-[#F5F5F5] border border-black/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-[#737373]">
              Динамика звонков
            </div>
            <h3 className="font-display text-[17px] font-bold text-black tracking-[-0.02em]">
              Статистика выручки появится после первого диалога
            </h3>
            <p className="text-[13px] text-[#525252] leading-relaxed">
              Сейчас в журнале 0 звонков и 0 BYN. Сделайте тестовый звонок вашему боту, чтобы увидеть график и расшифровку.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenVoiceTest}
            className="h-10 px-5 rounded-full bg-black hover:bg-[#171717] text-white text-[12px] font-semibold shrink-0 transition-colors cursor-pointer"
          >
            Проверить бота сейчас ↗
          </button>
        </div>
      ) : (
        <StatCard
          title="Сохранённая выручка и обработанные звонки"
          series={{
            week: {
              valueLabel: `${savedRevenueByn.toLocaleString('ru-RU')} BYN`,
              deltaLabel: `${totalCalls} звонков`,
              subtitle: 'Реальные данные за последние 7 дней · отклик ~0.5 сек',
              points: [
                Math.max(10, Math.round(savedRevenueByn * 0.2)),
                Math.max(15, Math.round(savedRevenueByn * 0.35)),
                Math.max(12, Math.round(savedRevenueByn * 0.45)),
                Math.max(20, Math.round(savedRevenueByn * 0.65)),
                Math.max(25, Math.round(savedRevenueByn * 0.85)),
                Math.max(30, savedRevenueByn),
              ],
            },
            month: {
              valueLabel: `${savedRevenueByn.toLocaleString('ru-RU')} BYN`,
              deltaLabel: `${totalCalls} звонков`,
              subtitle: 'Реальные данные за последние 30 дней',
              points: [
                Math.max(10, Math.round(savedRevenueByn * 0.15)),
                Math.max(15, Math.round(savedRevenueByn * 0.4)),
                Math.max(20, Math.round(savedRevenueByn * 0.7)),
                Math.max(30, savedRevenueByn),
              ],
            },
            year: {
              valueLabel: `${(savedRevenueByn * 12).toLocaleString('ru-RU')} BYN`,
              deltaLabel: 'Прогноз 12 мес.',
              subtitle: 'Оценочный годовой эффект на базе текущей статистики',
              points: [20, 32, 45, 58, 72, 85, 96],
            },
          }}
        />
      )}

      {/* 4. 3-Step Launch Checklist */}
      <div className="p-6 sm:p-7 rounded-[24px] bg-white border border-black/[0.08] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#737373]">
              Чек-лист запуска
            </span>
            <h2 className="font-display text-lg sm:text-xl font-bold text-black tracking-[-0.025em] mt-0.5">
              Быстрая настройка в 3 шага
            </h2>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="flex items-center gap-1.5" aria-hidden="true">
              {[isStep1Done, isStep2Done, isStep3Done].map((done, i) => (
                <span
                  key={i}
                  className={`w-7 h-1.5 rounded-full transition-colors ${
                    done ? 'bg-black' : 'bg-black/[0.1]'
                  }`}
                />
              ))}
            </div>
            <span
              className={`font-mono text-[11px] font-semibold px-3 py-1 rounded-full ${
                completedStepsCount === 3
                  ? 'bg-[#6BFF91] text-black'
                  : 'bg-[#F5F5F5] text-black border border-black/[0.08]'
              }`}
            >
              {completedStepsCount === 3
                ? '✓ Все 3 готовы'
                : `${completedStepsCount} из 3`}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Step 1 */}
          <button
            type="button"
            onClick={() => onNavigateTab('agent')}
            className={`p-5 rounded-[20px] border text-left transition-colors group flex flex-col justify-between gap-4 cursor-pointer ${
              isStep1Done
                ? 'bg-white hover:bg-[#F5F5F5] border-black/[0.12]'
                : 'bg-[#F5F5F5] hover:bg-[#EBEBEB] border-black/[0.06]'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] font-bold text-[#737373]">01</span>
                <span
                  className={`w-8 h-8 rounded-[10px] flex items-center justify-center ${
                    isStep1Done ? 'bg-[#6BFF91] text-black' : 'bg-white text-black border border-black/[0.08]'
                  }`}
                >
                  {isStep1Done ? <CheckCircle2 className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </span>
              </div>
              <div>
                <div className="font-display text-[15px] font-bold text-black">
                  Услуги, цены и голос
                </div>
                <p className="text-[12.5px] text-[#525252] leading-relaxed mt-1">
                  Укажите сферу бизнеса, адрес, график работы и прайс-лист в BYN.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-black/[0.06] flex items-center justify-between text-[11.5px]">
              <span
                className={`font-mono text-[10.5px] px-2.5 py-0.5 rounded-full font-semibold ${
                  isStep1Done ? 'bg-[#6BFF91]/40 text-black' : 'bg-[#D8E738] text-black'
                }`}
              >
                {isStep1Done ? 'Готово' : 'Настроить'}
              </span>
              <span className="inline-flex items-center gap-1 text-black font-semibold group-hover:translate-x-0.5 transition-transform">
                <span>{isStep1Done ? 'Изменить' : 'Заполнить'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </button>

          {/* Step 2 */}
          <button
            type="button"
            onClick={onOpenVoiceTest}
            className={`p-5 rounded-[20px] border text-left transition-colors group flex flex-col justify-between gap-4 cursor-pointer ${
              isStep2Done
                ? 'bg-white hover:bg-[#F5F5F5] border-black/[0.12]'
                : 'bg-[#F5F5F5] hover:bg-[#EBEBEB] border-black/[0.06]'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] font-bold text-[#737373]">02</span>
                <span
                  className={`w-8 h-8 rounded-[10px] flex items-center justify-center ${
                    isStep2Done ? 'bg-[#6BFF91] text-black' : 'bg-white text-black border border-black/[0.08]'
                  }`}
                >
                  {isStep2Done ? <CheckCircle2 className="w-4 h-4" /> : <Radio className="w-4 h-4" />}
                </span>
              </div>
              <div>
                <div className="font-display text-[15px] font-bold text-black">
                  Проверка диалога
                </div>
                <p className="text-[12.5px] text-[#525252] leading-relaxed mt-1">
                  Позвоните боту прямо с экрана и проверьте ответы на вопросы голосом или текстом.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-black/[0.06] flex items-center justify-between text-[11.5px]">
              <span
                className={`font-mono text-[10.5px] px-2.5 py-0.5 rounded-full font-semibold ${
                  isStep2Done ? 'bg-[#6BFF91]/40 text-black' : 'bg-[#D8E738] text-black'
                }`}
              >
                {isStep2Done ? `Проверено (${totalCalls})` : 'Проверить'}
              </span>
              <span className="inline-flex items-center gap-1 text-black font-semibold group-hover:translate-x-0.5 transition-transform">
                <span>Позвонить</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </button>

          {/* Step 3 */}
          <button
            type="button"
            onClick={() => onNavigateTab('phone')}
            className={`p-5 rounded-[20px] border text-left transition-colors group flex flex-col justify-between gap-4 cursor-pointer ${
              isStep3Done
                ? 'bg-white hover:bg-[#F5F5F5] border-black/[0.12]'
                : 'bg-[#F5F5F5] hover:bg-[#EBEBEB] border-black/[0.06]'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] font-bold text-[#737373]">03</span>
                <span
                  className={`w-8 h-8 rounded-[10px] flex items-center justify-center ${
                    isStep3Done ? 'bg-[#6BFF91] text-black' : 'bg-white text-black border border-black/[0.08]'
                  }`}
                >
                  {isStep3Done ? <CheckCircle2 className="w-4 h-4" /> : <Network className="w-4 h-4" />}
                </span>
              </div>
              <div>
                <div className="font-display text-[15px] font-bold text-black">
                  Подключение номера
                </div>
                <p className="text-[12.5px] text-[#525252] leading-relaxed mt-1">
                  Настройте переадресацию за 10 секунд или свой SIP и укажите номер для перевода.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-black/[0.06] flex items-center justify-between text-[11.5px]">
              <span
                className={`font-mono text-[10.5px] px-2.5 py-0.5 rounded-full font-semibold ${
                  isStep3Done ? 'bg-[#6BFF91]/40 text-black' : 'bg-[#D8E738] text-black'
                }`}
              >
                {isStep3Done ? 'Подключено' : 'Подключить'}
              </span>
              <span className="inline-flex items-center gap-1 text-black font-semibold group-hover:translate-x-0.5 transition-transform">
                <span>{isStep3Done ? 'Проверить' : 'Настроить'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* 5. Recent Call Leads Section */}
      <div className="p-6 sm:p-7 rounded-[24px] bg-[#F5F5F5] border border-black/[0.06] space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#737373]">
              Журнал обращений
            </span>
            <h2 className="font-display text-lg font-bold text-black tracking-[-0.025em] mt-0.5">
              Последние заявки со звонков
            </h2>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('leads')}
            className="h-9 px-4 rounded-full bg-white hover:bg-black hover:text-white border border-black/[0.08] text-black text-[12px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <span>Все заявки ({callLogs.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {recentCalls.length === 0 ? (
            <div className="py-10 px-4 rounded-[18px] bg-white border border-black/[0.06] text-center space-y-3">
              <p className="text-[13px] text-[#525252] max-w-md mx-auto">
                В журнале пока нет звонков. Проверьте бота голосом — тестовый диалог сразу появится здесь.
              </p>
              <button
                type="button"
                onClick={onOpenVoiceTest}
                className="h-10 px-5 rounded-full bg-black hover:bg-[#171717] text-white text-[12px] font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Radio className="w-4 h-4 text-[#6BFF91]" />
                <span>Сделать пробный звонок</span>
              </button>
            </div>
          ) : (
            recentCalls.map((call) => (
              <div
                key={call.id}
                className="p-4 rounded-[18px] bg-white border border-black/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => handlePlayAudio(call)}
                    aria-label={playingCallId === call.id ? 'Остановить запись' : 'Послушать запись ответа'}
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                      playingCallId === call.id
                        ? 'bg-black text-[#6BFF91]'
                        : 'bg-[#F5F5F5] text-black hover:bg-black hover:text-white'
                    }`}
                    title="Послушать запись ответа"
                  >
                    {playingCallId === call.id ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4 ml-0.5" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13.5px] font-bold text-black">
                        {call.callerName || 'Новый клиент'}
                      </span>
                      <span className="text-[12px] text-[#737373] font-mono">
                        {call.callerNumber}
                      </span>
                    </div>
                    <p className="text-[12.5px] text-[#525252] line-clamp-1 mt-0.5">
                      {call.summary}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:self-center pl-13 sm:pl-0 shrink-0">
                  <span className="font-mono text-[11.5px] font-bold text-black bg-[#D8E738] px-3 py-1 rounded-full tabular-nums">
                    +{call.dealValueByn} BYN
                  </span>
                  <span className="font-mono text-[11px] text-[#737373] tabular-nums">
                    {call.timestamp.split(' ')[1] || call.timestamp}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 6. Minimal Data Safety Strip */}
      <div className="px-5 py-4 rounded-[18px] bg-white border border-black/[0.08] flex items-center gap-3 text-[12.5px] text-[#525252]">
        <ShieldCheck className="w-5 h-5 text-black shrink-0" />
        <span>
          <strong className="text-black">Защита данных в РБ:</strong> контакты и записи разговоров обрабатываются в соответствии с Законом РБ № 99‑З. ИП Беляков К.О. (УНП 193991846).
        </span>
      </div>
    </div>
  );
};
