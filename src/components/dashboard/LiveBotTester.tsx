import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PhoneCallingRoundedIcon as Phone,
  EndCallRoundedIcon as PhoneOff,
  VolumeLoudIcon as Volume2,
  SendSquareIcon as Send,
  UserRoundedIcon as User,
  MicrophoneIcon as Mic,
  Microphone2Icon as MicOff,
} from '@solar-icons/react/bold-duotone';
import { AgentConfig, CallLog } from '../../types';
import { NICHE_TEMPLATES } from '../../lib/mockData';
import { VoiceSimulator } from '../../lib/speechSynth';
import { useSpeechRecognition } from '../../lib/useSpeechRecognition';
import {
  requestBotReply,
  NICHE_QUICK_QUESTIONS,
  adaptGreetingForVoice,
  createCallLogFromDialogue,
} from '../../lib/botDialogueEngine';
import { playRingingTone, playHangupSound } from '../../lib/telephonyAudio';

interface LiveBotTesterProps {
  agent: AgentConfig;
  onCallCompleted?: (log: CallLog) => void;
}

type CallStatus = 'idle' | 'dialing' | 'connected';

export const LiveBotTester: React.FC<LiveBotTesterProps> = ({ agent, onCallCompleted }) => {
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [messages, setMessages] = useState<
    Array<{ speaker: 'assistant' | 'user'; text: string; time: string }>
  >([]);
  const [inputText, setInputText] = useState('');
  const [isBotSpeaking, setIsBotSpeaking] = useState(false);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [aiProvider, setAiProvider] = useState<'yandexgpt-lite' | 'local-fallback' | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [waveBars, setWaveBars] = useState<number[]>([18, 32, 48, 64, 38, 24, 52, 74, 42, 26]);

  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const messagesRef = useRef<Array<{ speaker: 'assistant' | 'user'; text: string; time: string }>>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const connectTimerRef = useRef<number | null>(null);
  const ringtoneStopRef = useRef<(() => void) | null>(null);
  const lastBotMessageRef = useRef('');
  const callStatusRef = useRef<CallStatus>('idle');
  const isBotSpeakingRef = useRef(false);
  const isBotThinkingRef = useRef(false);
  const agentRef = useRef<AgentConfig>(agent);
  const prevNicheRef = useRef(agent.niche);
  const callDurationRef = useRef(0);
  const callLoggedRef = useRef(false);
  const onCallCompletedRef = useRef(onCallCompleted);

  useEffect(() => {
    onCallCompletedRef.current = onCallCompleted;
  }, [onCallCompleted]);

  useEffect(() => {
    callDurationRef.current = callDuration;
  }, [callDuration]);

  const flushCompletedCallLog = useCallback(() => {
    if (callLoggedRef.current) return;
    const liveAgent = agentRef.current;
    const log = createCallLogFromDialogue({
      niche: liveAgent.niche,
      companyName: liveAgent.companyName,
      address: liveAgent.address,
      phone: liveAgent.phone,
      transferPhone: liveAgent.phone,
      durationSeconds: callDurationRef.current,
      messages: messagesRef.current,
      callerNotification: liveAgent.callerNotification,
    });
    if (log) {
      callLoggedRef.current = true;
      onCallCompletedRef.current?.(log);
    }
  }, []);

  useEffect(() => {
    agentRef.current = agent;
  }, [agent]);

  useEffect(() => {
    callStatusRef.current = callStatus;
  }, [callStatus]);

  useEffect(() => {
    isBotThinkingRef.current = isBotThinking;
    isBotSpeakingRef.current = isBotSpeaking || isBotThinking;
  }, [isBotSpeaking, isBotThinking]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const voiceLabel = agent.voice === 'maxim' ? 'Максим' : 'Анна';

  const quickQuestions =
    NICHE_QUICK_QUESTIONS[agent.niche] || NICHE_QUICK_QUESTIONS.driving_school;

  const formatCallTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const cleanupCallAudio = useCallback(() => {
    if (connectTimerRef.current) {
      window.clearTimeout(connectTimerRef.current);
      connectTimerRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (ringtoneStopRef.current) {
      ringtoneStopRef.current();
      ringtoneStopRef.current = null;
    }
    VoiceSimulator.stop();
  }, []);

  const speakBotMessage = useCallback((reply: string, voiceOverride?: AgentConfig['voice']) => {
    const activeVoice = voiceOverride ?? agentRef.current.voice;
    isBotSpeakingRef.current = true;
    setIsBotSpeaking(true);
    speechRecognition.setBotSpeaking(true);
    lastBotMessageRef.current = reply.trim().toLowerCase();

    VoiceSimulator.speak(
      reply,
      activeVoice,
      () => {
        isBotSpeakingRef.current = true;
        setIsBotSpeaking(true);
        speechRecognition.setBotSpeaking(true);
      },
      () => {
        setIsBotSpeaking(false);
        if (!isBotThinkingRef.current) {
          isBotSpeakingRef.current = false;
          speechRecognition.setBotSpeaking(false);
        }
      },
      (bars: number[]) => setWaveBars(bars.slice(0, 10))
    );
  }, []);

  // Handle incoming user query — always uses live agentRef.current data
  const handleSendMessage = useCallback(
    async (customQuery?: string) => {
      const query = (customQuery ?? inputText).trim();
      if (!query || callStatusRef.current !== 'connected') return;

      // Barge-in: stop any active bot playback when user sends input or clicks a prompt chip
      VoiceSimulator.stop();
      isBotSpeakingRef.current = false;
      setIsBotSpeaking(false);

      if (lastBotMessageRef.current && query.length >= 25 && lastBotMessageRef.current === query.toLowerCase()) {
        return;
      }

      const liveAgent = agentRef.current;

      setIsBotThinking(true);
      isBotThinkingRef.current = true;
      isBotSpeakingRef.current = true;
      speechRecognition.setBotSpeaking(true);

      const priorHistory = messagesRef.current.map(({ speaker, text }) => ({ speaker, text }));
      const userTime = formatCallTime(callDuration);
      setMessages((prev) => [...prev, { speaker: 'user', text: query, time: userTime }]);
      setInputText('');

      if (abortControllerRef.current) abortControllerRef.current.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const { reply, provider } = await requestBotReply(
          query,
          liveAgent,
          priorHistory,
          controller.signal
        );
        if (callStatusRef.current !== 'connected' || controller.signal.aborted) return;

        let cleanReply = reply.replace(/\[(AMD_VOICEMAIL_DETECTED|WARM_TRANSFER_TRIGGERED)[^\]]*\]\s*/g, '').trim();
        if (!cleanReply) {
          if (reply.includes('[WARM_TRANSFER_TRIGGERED:')) {
            cleanReply = 'Перевожу вас на старшего администратора, секунду...';
          } else if (reply.includes('[AMD_VOICEMAIL_DETECTED:')) {
            const carrier = reply.match(/\[AMD_VOICEMAIL_DETECTED:(.*?)\]/)?.[1] || 'МТС / А1';
            cleanReply = `Обнаружен автоответчик сотового оператора (${carrier}). Вызов завершён без списания баланса.`;
          }
        }

        setAiProvider(provider);
        isBotThinkingRef.current = false;
        setIsBotThinking(false);
        const aiTime = formatCallTime(callDuration + 1);

        setMessages((prev) => [...prev, { speaker: 'assistant', text: cleanReply, time: aiTime }]);
        speakBotMessage(cleanReply, liveAgent.voice);
      } catch {
        if (controller.signal.aborted) {
          // Newer user speech already started; do not clobber active bot thinking/speaking flags
          return;
        }
        isBotThinkingRef.current = false;
        isBotSpeakingRef.current = false;
        setIsBotThinking(false);
        if (callStatusRef.current === 'connected') {
          speechRecognition.setBotSpeaking(false);
        }
      }
    },
    [callDuration, formatCallTime, inputText, speakBotMessage]
  );

  // Speech Recognition Hook
  const speechRecognition = useSpeechRecognition({
    lang: 'ru-RU',
    silenceDelayMs: 2200,
    onFinalTranscript: (transcript) => {
      if (callStatusRef.current === 'connected' && !isBotSpeakingRef.current && !isMicMuted) {
        handleSendMessage(transcript);
      }
    },
  });

  const {
    interimTranscript,
    audioLevel,
    error: micError,
    startListening,
    stopListening,
    setBotSpeaking,
    setMuted,
    submitNow,
  } = speechRecognition;

  // Reset stale call session automatically when user switches business category on the left
  useEffect(() => {
    if (prevNicheRef.current !== agent.niche) {
      flushCompletedCallLog();
      prevNicheRef.current = agent.niche;
      cleanupCallAudio();
      stopListening();
      isBotSpeakingRef.current = false;
      setIsBotSpeaking(false);
      setIsBotThinking(false);
      setMessages([]);
      messagesRef.current = [];
      setCallDuration(0);
      callDurationRef.current = 0;
      callStatusRef.current = 'idle';
      setCallStatus('idle');
    }
  }, [agent.niche, cleanupCallAudio, flushCompletedCallLog, stopListening]);

  useEffect(() => {
    return () => {
      flushCompletedCallLog();
      cleanupCallAudio();
    };
  }, [cleanupCallAudio, flushCompletedCallLog]);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTo({
        top: transcriptRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, interimTranscript]);

  useEffect(() => {
    let timer: number | null = null;
    if (callStatus === 'connected') {
      timer = window.setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [callStatus]);

  const handleStartCall = () => {
    const liveAgent = agentRef.current;
    const tmpl = NICHE_TEMPLATES[liveAgent.niche] || NICHE_TEMPLATES.driving_school;

    cleanupCallAudio();
    callLoggedRef.current = false;
    callStatusRef.current = 'dialing';
    setCallStatus('dialing');
    setCallDuration(0);
    callDurationRef.current = 0;
    setIsMicMuted(false);
    setMessages([]);
    messagesRef.current = [];
    VoiceSimulator.unlock();

    startListening();
    isBotSpeakingRef.current = true;
    setBotSpeaking(true);

    ringtoneStopRef.current = playRingingTone();

    connectTimerRef.current = window.setTimeout(() => {
      connectTimerRef.current = null;
      if (ringtoneStopRef.current) {
        ringtoneStopRef.current();
        ringtoneStopRef.current = null;
      }

      callStatusRef.current = 'connected';
      setCallStatus('connected');

      const latestAgent = agentRef.current;
      const voiceLabel = latestAgent.voice === 'maxim' ? 'Максим' : 'Анна';
      const cleanCompany = latestAgent.companyName || 'наша компания';
      const defaultGreeting = `Здравствуйте! Вас приветствует ${cleanCompany}. Меня зовут ${voiceLabel}. Разговор записывается в целях контроля качества. Чтобы переключиться на менеджера, скажите «соедините с менеджером». Чем могу вам помочь?`;
      const chosenGreeting = latestAgent.firstMessage || defaultGreeting;
      const welcome = adaptGreetingForVoice(
        chosenGreeting,
        latestAgent.voice,
        cleanCompany,
        'Компания'
      );
      const initialMsg = [{ speaker: 'assistant' as const, text: welcome, time: '00:01' }];
      messagesRef.current = initialMsg;
      setMessages(initialMsg);

      speakBotMessage(welcome, latestAgent.voice);
    }, 1050);
  };

  const handleEndCall = () => {
    flushCompletedCallLog();
    cleanupCallAudio();
    playHangupSound();
    stopListening();
    isBotSpeakingRef.current = false;
    setIsBotSpeaking(false);
    setIsBotThinking(false);
    callStatusRef.current = 'idle';
    setCallStatus('idle');
  };

  const toggleMicMute = () => {
    const next = !isMicMuted;
    setIsMicMuted(next);
    setMuted(next);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      handleSendMessage(inputText.trim());
    }
  };

  return (
    <div className="rounded-3xl bg-white text-slate-900 border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Clean Light Header */}
      <div className="px-5 py-4 bg-slate-50/90 border-b border-slate-200/80 space-y-3">
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-xs">
              <Phone className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                <span>Тест голоса и диалога</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 whitespace-nowrap">
                  {aiProvider === 'yandexgpt-lite' ? 'YandexGPT Lite' : 'SpeechKit'}
                </span>
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Говорите в микрофон или тестируйте вопросы по вашему прайсу
              </p>
            </div>
          </div>
        </div>

        {callStatus === 'connected' && (
          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={toggleMicMute}
              title={isMicMuted ? 'Включить микрофон' : 'Отключить микрофон'}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isMicMuted
                  ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {isMicMuted ? (
                <MicOff className="w-3.5 h-3.5 text-amber-600" />
              ) : (
                <Mic className="w-3.5 h-3.5 text-emerald-600" />
              )}
              <span className="text-[11px]">{isMicMuted ? 'Микрофон выкл' : 'Микрофон вкл'}</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-emerald-700 font-bold px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 whitespace-nowrap">
                {formatCallTime(callDuration)}
              </span>

              <button
                type="button"
                onClick={handleEndCall}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap shadow-2xs"
              >
                <PhoneOff className="w-3.5 h-3.5" />
                <span>Завершить</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5">
        <AnimatePresence mode="wait">
          {callStatus === 'idle' ? (
            <motion.div
              key="call-idle"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="py-5 text-center space-y-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 mx-auto flex items-center justify-center text-emerald-600">
                <Phone className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h5 className="text-sm font-bold text-slate-900">
                  {agent.companyName || 'Ваша организация'}
                </h5>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Голос: <strong className="text-slate-700">{voiceLabel}</strong> • {agent.address.split('(')[0].trim()}
                </p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto pt-1">
                  Проверьте, как ИИ-администратор отвечает по вашим текущим настройкам и прайсу.
                </p>
              </div>
              <button
                type="button"
                onClick={handleStartCall}
                className="w-full py-3 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                <span>Начать тестовый звонок</span>
              </button>
            </motion.div>
          ) : callStatus === 'dialing' ? (
            <motion.div
              key="call-dialing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-8 text-center space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 mx-auto flex items-center justify-center">
                <Phone className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-bold text-slate-900">Идут гудки вызова...</div>
                <div className="text-xs text-blue-600 font-medium">{agent.companyName}</div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="call-active"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="space-y-3.5"
            >
              {/* Active Call Status Card (Light Theme) */}
              <div
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2 ${
                  isBotThinking
                    ? 'bg-indigo-50/70 border-indigo-200'
                    : isBotSpeaking
                    ? 'bg-blue-50/70 border-blue-200'
                    : isMicMuted
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-emerald-50/70 border-emerald-200'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      isBotSpeaking || isBotThinking
                        ? 'bg-blue-600 text-white'
                        : isMicMuted
                        ? 'bg-slate-200 text-slate-500'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {isBotSpeaking ? (
                      <Volume2 className="w-4 h-4 animate-pulse" />
                    ) : isMicMuted ? (
                      <MicOff className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 leading-snug break-words">
                      {agent.companyName} ({voiceLabel})
                    </div>
                    <div className="text-[11px] mt-0.5">
                      {isBotThinking ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-indigo-700 font-medium">Формирует ответ по прайсу...</span>
                          <progress
                            aria-label="Генерация ответа ассистента"
                            className="w-28 h-1 rounded-full overflow-hidden accent-indigo-600"
                          />
                        </div>
                      ) : isBotSpeaking ? (
                        <span className="text-blue-700 font-semibold">{voiceLabel} отвечает в динамик...</span>
                      ) : isMicMuted ? (
                        <span className="text-slate-500">Микрофон отключен</span>
                      ) : (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          Слушаю вас... Говорите!
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sound Wave Bars */}
                <div className="flex items-center gap-1 h-5 shrink-0 pl-1">
                  {waveBars.map((h, i) => {
                    const effectiveHeight = isBotSpeaking
                      ? h
                      : !isMicMuted && audioLevel > 5
                      ? Math.max(18, audioLevel * (1 + (i % 3) * 0.35))
                      : 20;

                    return (
                      <motion.div
                        key={i}
                        animate={{ height: `${Math.min(100, Math.max(18, effectiveHeight))}%` }}
                        transition={{ duration: 0.08 }}
                        className={`w-1 rounded-full ${
                          isBotSpeaking
                            ? 'bg-blue-500'
                            : !isMicMuted && audioLevel > 5
                            ? 'bg-emerald-500'
                            : 'bg-slate-300'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Mic Error Notice */}
              {micError && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
                  {micError}
                </div>
              )}

              {/* Live Speech Transcription Preview */}
              {interimTranscript && !isBotSpeaking && !isMicMuted && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex items-center justify-between gap-2">
                  <div className="flex items-start gap-1.5 min-w-0">
                    <span className="w-2 h-2 mt-1 rounded-full bg-emerald-500 animate-ping shrink-0" />
                    <span className="font-semibold text-[11px] text-emerald-800 shrink-0">Вы:</span>
                    <span className="italic break-words leading-snug">«{interimTranscript}»</span>
                  </div>
                  <button
                    type="button"
                    onClick={submitNow}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] shrink-0 transition-colors"
                  >
                    Отправить ⏎
                  </button>
                </div>
              )}

              {/* Dynamic Category Quick Prompts */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {quickQuestions.slice(0, 3).map((q) => (
                  <button
                    key={q.label}
                    type="button"
                    onClick={() => handleSendMessage(q.query)}
                    className="px-2.5 py-1 rounded-full bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 text-[11px] font-medium transition-colors"
                  >
                    {q.label}
                  </button>
                ))}
              </div>

              {/* Light Transcript Scroll Area */}
              <div
                ref={transcriptRef}
                className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/90 h-56 overflow-y-auto space-y-2.5 voxi-scroll text-xs"
              >
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-2 ${
                      m.speaker === 'assistant' ? 'justify-start' : 'justify-end'
                    }`}
                  >
                    {m.speaker === 'assistant' && (
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 text-[9px] font-bold mt-0.5">
                        ИИ
                      </div>
                    )}
                    <div
                      className={`p-3 rounded-2xl max-w-[85%] ${
                        m.speaker === 'assistant'
                          ? 'bg-white border border-slate-200/90 text-slate-800 shadow-2xs'
                          : 'bg-blue-600 text-white shadow-2xs'
                      }`}
                    >
                      <div
                        className={`flex items-center justify-between gap-3 mb-1 text-[10px] ${
                          m.speaker === 'assistant' ? 'text-slate-500' : 'text-blue-100'
                        }`}
                      >
                        <span className="font-semibold truncate">
                          {m.speaker === 'assistant'
                            ? `${voiceLabel} • ${agent.companyName}`
                            : 'Вы'}
                        </span>
                        <span className="shrink-0">{m.time}</span>
                      </div>
                      <p className="leading-relaxed">{m.text}</p>
                    </div>
                    {m.speaker === 'user' && (
                      <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Clean Light Input Bar */}
              <form onSubmit={handleSubmitForm} className="flex gap-2">
                <button
                  type="button"
                  onClick={toggleMicMute}
                  title={isMicMuted ? 'Включить микрофон' : 'Отключить микрофон'}
                  className={`px-3 py-2.5 rounded-xl border text-xs flex items-center justify-center transition-all shrink-0 ${
                    isMicMuted
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {isMicMuted ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.nativeEvent.isComposing) {
                      e.preventDefault();
                    }
                  }}
                  placeholder={
                    isMicMuted
                      ? 'Микрофон выключен — напишите вопрос...'
                      : 'Говорите или напишите вопрос...'
                  }
                  className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-blue-600"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  aria-label="Отправить сообщение"
                  className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all disabled:opacity-40 shrink-0 flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
