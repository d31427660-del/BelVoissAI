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
import { GooThinking, StreamingReply, VoiceInputButton } from '@/components/motion';

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
  const isMicMutedRef = useRef(false);

  useEffect(() => {
    isMicMutedRef.current = isMicMuted;
  }, [isMicMuted]);

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
      const userTime = formatCallTime(callDurationRef.current);
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
        const aiTime = formatCallTime(callDurationRef.current + 1);

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
    [formatCallTime, inputText, speakBotMessage]
  );

  // Speech Recognition Hook
  const speechRecognition = useSpeechRecognition({
    lang: 'ru-RU',
    silenceDelayMs: 2200,
    onFinalTranscript: (transcript) => {
      if (callStatusRef.current === 'connected' && !isBotSpeakingRef.current && !isMicMutedRef.current) {
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
    e.stopPropagation();
    if (inputText.trim()) {
      handleSendMessage(inputText.trim());
    }
  };

  return (
    <div className="rounded-[20px] bg-white text-black border border-black/[0.08] overflow-hidden">
      {/* Clean Editorial Header */}
      <div className="px-5 py-4 bg-[#F5F5F5] border-b border-black/[0.08] space-y-3">
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-[12px] bg-[#0A0A0A] flex items-center justify-center text-[#6BFF91] shrink-0">
              <Phone className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="font-display text-[13.5px] font-bold text-black flex items-center gap-2 flex-wrap">
                <span>Тест голоса и диалога</span>
                <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white text-black border border-black/[0.08] whitespace-nowrap">
                  {aiProvider === 'yandexgpt-lite'
                    ? 'YandexGPT Lite'
                    : aiProvider === 'local-fallback'
                    ? 'Локальный режим'
                    : 'SpeechKit'}
                </span>
              </h4>
              <p className="text-[11.5px] text-[#737373] mt-0.5">
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
              className={`px-3 py-1.5 rounded-full border text-[11.5px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isMicMuted
                  ? 'bg-[#D8E738] text-black border-black/15'
                  : 'bg-white text-black border-black/[0.1] hover:bg-black hover:text-white'
              }`}
            >
              {isMicMuted ? (
                <MicOff className="w-3.5 h-3.5" />
              ) : (
                <Mic className="w-3.5 h-3.5 text-[#15803D]" />
              )}
              <span>{isMicMuted ? 'Микрофон выкл' : 'Микрофон вкл'}</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-[11.5px] font-mono text-black font-bold px-2.5 py-1 rounded-full bg-[#6BFF91] whitespace-nowrap tabular-nums">
                {formatCallTime(callDuration)}
              </span>

              <button
                type="button"
                onClick={handleEndCall}
                className="px-3.5 py-1.5 rounded-full bg-[#FE432A] hover:bg-[#DC2626] text-white font-semibold text-[11.5px] flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
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
              <div className="w-14 h-14 rounded-[18px] bg-[#0A0A0A] mx-auto flex items-center justify-center text-[#6BFF91]">
                <Phone className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h5 className="font-display text-[16px] font-bold text-black">
                  {agent.companyName || 'Ваша организация'}
                </h5>
                <p className="text-[12.5px] text-[#525252] max-w-xs mx-auto">
                  Голос: <strong className="text-black">{voiceLabel}</strong>
                  {(agent.address || '').split('(')[0].trim()
                    ? ` · ${(agent.address || '').split('(')[0].trim()}`
                    : ''}
                </p>
                <p className="text-[12px] text-[#737373] max-w-xs mx-auto pt-1">
                  Проверьте, как ИИ-администратор отвечает по вашим текущим настройкам и прайсу.
                </p>
              </div>
              <button
                type="button"
                onClick={handleStartCall}
                className="w-full h-11 px-5 rounded-full bg-black hover:bg-[#171717] text-white font-semibold text-[13px] transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Phone className="w-4 h-4 text-[#6BFF91]" />
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
              <div className="w-12 h-12 rounded-[16px] bg-[#0A0A0A] text-[#6BFF91] mx-auto flex items-center justify-center">
                <Phone className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="font-display text-[15px] font-bold text-black">Идут гудки вызова...</div>
                <div className="text-[12px] text-[#737373] font-medium">{agent.companyName}</div>
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
              {/* Active Call Status Card */}
              <div className="p-3.5 rounded-[16px] bg-[#0A0A0A] text-white flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      isBotSpeaking || isBotThinking
                        ? 'bg-[#6BFF91] text-black'
                        : isMicMuted
                        ? 'bg-white/15 text-white/60'
                        : 'bg-white text-black'
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
                    <div className="text-[12.5px] font-bold text-white leading-snug break-words">
                      {agent.companyName} ({voiceLabel})
                    </div>
                    <div className="text-[11px] mt-0.5">
                      {isBotThinking ? (
                        <GooThinking
                          label="Формирует ответ…"
                          className="py-0.5 px-2 text-[11px] bg-white/10 text-white"
                          dotClassName="bg-[#6BFF91]"
                        />
                      ) : isBotSpeaking ? (
                        <span className="text-[#6BFF91] font-semibold">{voiceLabel} отвечает в динамик...</span>
                      ) : isMicMuted ? (
                        <span className="text-white/55">Микрофон отключен</span>
                      ) : (
                        <span className="text-[#D8E738] font-semibold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#6BFF91] animate-ping" />
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
                            ? 'bg-[#6BFF91]'
                            : !isMicMuted && audioLevel > 5
                            ? 'bg-[#D8E738]'
                            : 'bg-white/25'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Mic Error Notice */}
              {micError && (
                <div className="p-3 rounded-[12px] bg-[#F5F5F5] border border-black/[0.08] text-[#525252] text-[11.5px]">
                  {micError}
                </div>
              )}

              {/* Live Speech Transcription Preview */}
              {interimTranscript && !isBotSpeaking && !isMicMuted && (
                <div className="p-3 rounded-[14px] bg-[#F5F5F5] border border-black/[0.1] text-black text-[12px] flex items-center justify-between gap-2">
                  <div className="flex items-start gap-1.5 min-w-0">
                    <span className="w-2 h-2 mt-1 rounded-full bg-[#16A34A] animate-ping shrink-0" />
                    <span className="font-semibold text-[11px] shrink-0">Вы:</span>
                    <span className="italic break-words leading-snug">«{interimTranscript}»</span>
                  </div>
                  <button
                    type="button"
                    onClick={submitNow}
                    className="px-2.5 py-1 rounded-full bg-black hover:bg-[#171717] text-white font-semibold text-[11px] shrink-0 transition-colors cursor-pointer"
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
                    className="px-3 py-1 rounded-full bg-[#F5F5F5] hover:bg-black text-black hover:text-white border border-black/[0.06] text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    {q.label}
                  </button>
                ))}
              </div>

              {/* Transcript Scroll Area */}
              <div
                ref={transcriptRef}
                className="p-3.5 rounded-[16px] bg-[#F5F5F5] border border-black/[0.06] h-56 overflow-y-auto space-y-2.5 voxi-scroll text-[12px]"
              >
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-2 ${
                      m.speaker === 'assistant' ? 'justify-start' : 'justify-end'
                    }`}
                  >
                    {m.speaker === 'assistant' && (
                      <div className="w-6 h-6 rounded-full bg-black text-[#6BFF91] flex items-center justify-center shrink-0 font-mono text-[9px] font-bold mt-0.5">
                        ИИ
                      </div>
                    )}
                    <div
                      className={`p-3 rounded-[16px] max-w-[85%] ${
                        m.speaker === 'assistant'
                          ? 'bg-white border border-black/[0.06] text-black'
                          : 'bg-[#0A0A0A] text-white'
                      }`}
                    >
                      <div
                        className={`flex items-center justify-between gap-3 mb-1 font-mono text-[9.5px] ${
                          m.speaker === 'assistant' ? 'text-[#737373]' : 'text-white/55'
                        }`}
                      >
                        <span className="font-semibold truncate">
                          {m.speaker === 'assistant'
                            ? `${voiceLabel} · ${agent.companyName}`
                            : 'Вы'}
                        </span>
                        <span className="shrink-0">{m.time}</span>
                      </div>
                      <p className="leading-relaxed">
                        {m.speaker === 'assistant' && idx === messages.length - 1 ? (
                          <StreamingReply text={m.text} />
                        ) : (
                          m.text
                        )}
                      </p>
                    </div>
                    {m.speaker === 'user' && (
                      <div className="w-6 h-6 rounded-full bg-white border border-black/[0.08] text-black flex items-center justify-center shrink-0 mt-0.5">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Input Bar */}
              <form onSubmit={handleSubmitForm} className="flex items-center gap-2">
                <VoiceInputButton
                  isListening={callStatus === 'connected'}
                  isMuted={isMicMuted}
                  isBotSpeaking={isBotSpeaking}
                  durationSeconds={callDuration}
                  audioLevel={audioLevel}
                  onClick={toggleMicMute}
                  className="py-1.5 px-2.5"
                />

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
                  className="flex-1 min-w-0 px-3.5 py-2.5 rounded-full bg-[#F5F5F5] focus:bg-white border border-black/[0.08] focus:border-black text-black placeholder-[#A3A3A3] text-[12px] focus:outline-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  aria-label="Отправить сообщение"
                  className="w-10 h-10 rounded-full bg-black hover:bg-[#171717] text-[#6BFF91] transition-colors disabled:opacity-35 shrink-0 flex items-center justify-center cursor-pointer"
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
