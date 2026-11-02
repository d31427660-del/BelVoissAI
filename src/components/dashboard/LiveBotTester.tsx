import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PhoneCallingRoundedIcon as Phone,
  EndCallRoundedIcon as PhoneOff,
  VolumeLoudIcon as Volume2,
  SendSquareIcon as Send,
  CpuBoltIcon as Bot,
  UserRoundedIcon as User,
  MicrophoneIcon as Mic,
  Microphone2Icon as MicOff
} from '@solar-icons/react/bold-duotone';
import { AgentConfig } from '../../types';
import { VoiceSimulator } from '../../lib/speechSynth';
import { useSpeechRecognition } from '../../lib/useSpeechRecognition';
import { requestBotReply } from '../../lib/botDialogueEngine';
import { playRingingTone, playHangupSound } from '../../lib/telephonyAudio';

interface LiveBotTesterProps {
  agent: AgentConfig;
}

type CallStatus = 'idle' | 'dialing' | 'connected';

export const LiveBotTester: React.FC<LiveBotTesterProps> = ({ agent }) => {
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [messages, setMessages] = useState<Array<{ speaker: 'assistant' | 'user'; text: string; time: string }>>([]);
  const [inputText, setInputText] = useState('');
  const [isBotSpeaking, setIsBotSpeaking] = useState(false);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [aiProvider, setAiProvider] = useState<'yandexgpt-lite' | 'local-fallback' | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [waveBars, setWaveBars] = useState<number[]>([15, 30, 45, 60, 35, 20, 50, 75, 40, 25]);
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const messagesRef = useRef<Array<{ speaker: 'assistant' | 'user'; text: string; time: string }>>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const ringtoneStopRef = useRef<(() => void) | null>(null);
  const lastBotMessageRef = useRef('');
  const callStatusRef = useRef<CallStatus>('idle');
  const isBotSpeakingRef = useRef(false);

  useEffect(() => {
    callStatusRef.current = callStatus;
  }, [callStatus]);

  useEffect(() => {
    isBotSpeakingRef.current = isBotSpeaking || isBotThinking;
  }, [isBotSpeaking, isBotThinking]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const formatCallTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const speakBotMessage = useCallback((reply: string) => {
    isBotSpeakingRef.current = true;
    setIsBotSpeaking(true);
    speechRecognition.setBotSpeaking(true);
    lastBotMessageRef.current = reply.trim().toLowerCase();

    VoiceSimulator.speak(
      reply,
      agent.voice,
      () => {
        isBotSpeakingRef.current = true;
        setIsBotSpeaking(true);
        speechRecognition.setBotSpeaking(true);
      },
      () => {
        isBotSpeakingRef.current = false;
        setIsBotSpeaking(false);
        speechRecognition.setBotSpeaking(false);
      },
      (bars: number[]) => setWaveBars(bars.slice(0, 10))
    );
  }, [agent.voice]);

  // Handle incoming user query (voice or text)
  const handleSendMessage = useCallback(async (customQuery?: string) => {
    const query = (customQuery || inputText).trim();
    if (!query || callStatusRef.current !== 'connected' || isBotSpeakingRef.current) return;

    // Only discard exact full-sentence echo, never valid short answers like "диагностика" or "ремонт"
    if (lastBotMessageRef.current && query.length >= 25 && lastBotMessageRef.current === query.toLowerCase()) {
      return;
    }

    // Immediately stop mic capture to avoid feedback
    setIsBotThinking(true);
    isBotSpeakingRef.current = true;
    speechRecognition.setBotSpeaking(true);

    const priorHistory = messagesRef.current.map(({ speaker, text }) => ({ speaker, text }));
    const userTime = formatCallTime(callDuration);
    setMessages(prev => [...prev, { speaker: 'user', text: query, time: userTime }]);
    setInputText('');

    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const { reply, provider } = await requestBotReply(query, agent, priorHistory, controller.signal);
      if (callStatusRef.current !== 'connected') return;

      setAiProvider(provider);
      setIsBotThinking(false);
      const aiTime = formatCallTime(callDuration + 1);

      setMessages(prev => [...prev, { speaker: 'assistant', text: reply, time: aiTime }]);
      speakBotMessage(reply);
    } catch {
      isBotSpeakingRef.current = false;
      setIsBotThinking(false);
      if (callStatusRef.current === 'connected') {
        speechRecognition.setBotSpeaking(false);
      }
    }
  }, [agent, callDuration, formatCallTime, inputText, speakBotMessage]);

  // Speech Recognition Hook (snappy 1.35s silence auto-submit)
  const speechRecognition = useSpeechRecognition({
    lang: 'ru-RU',
    silenceDelayMs: 1350,
    onFinalTranscript: (transcript) => {
      if (callStatusRef.current === 'connected' && !isBotSpeakingRef.current && !isMicMuted) {
        handleSendMessage(transcript);
      }
    }
  });

  const {
    isListening,
    interimTranscript,
    audioLevel,
    error: micError,
    startListening,
    stopListening,
    setBotSpeaking,
    setMuted,
    submitNow
  } = speechRecognition;

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTo({
        top: transcriptRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, interimTranscript]);

  useEffect(() => {
    let timer: number | null = null;
    if (callStatus === 'connected') {
      timer = window.setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [callStatus]);

  const handleStartCall = () => {
    callStatusRef.current = 'dialing';
    setCallStatus('dialing');
    setCallDuration(0);
    setIsMicMuted(false);
    setMessages([]);
    VoiceSimulator.stop();
    VoiceSimulator.unlock();

    // Start mic in user gesture
    startListening();
    isBotSpeakingRef.current = true;
    setBotSpeaking(true);

    // 1. Play dial tone
    if (ringtoneStopRef.current) ringtoneStopRef.current();
    ringtoneStopRef.current = playRingingTone();

    // 2. Connect after 1.2s
    setTimeout(() => {
      if (ringtoneStopRef.current) {
        ringtoneStopRef.current();
        ringtoneStopRef.current = null;
      }

      callStatusRef.current = 'connected';
      setCallStatus('connected');

      const welcome = agent.firstMessage || 'Здравствуйте! Чем я могу вам помочь?';
      setMessages([{ speaker: 'assistant', text: welcome, time: '00:01' }]);

      // Speak welcome message FIRST, mic opens automatically after greeting ends
      speakBotMessage(welcome);
    }, 1200);
  };

  const handleEndCall = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (ringtoneStopRef.current) {
      ringtoneStopRef.current();
      ringtoneStopRef.current = null;
    }
    playHangupSound();
    stopListening();
    VoiceSimulator.stop();
    setIsBotSpeaking(false);
    setIsBotThinking(false);
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
    <div className="rounded-3xl bg-[#0c0f18] text-white border border-slate-800 p-5 space-y-4 shadow-xl">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0">
            <Phone className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
              <span>Тестовый SIP-звонок боту</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/70 text-emerald-400 border border-emerald-800/60 whitespace-nowrap flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                0.5 сек отклик
              </span>
              {aiProvider === 'yandexgpt-lite' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-700/60 whitespace-nowrap">
                  YandexGPT Lite
                </span>
              )}
            </h4>
            <p className="text-[11px] text-slate-400 truncate">
              Реальный звонок: говорите в микрофон, робот мгновенно отвечает голосом
            </p>
          </div>
        </div>

        {callStatus === 'connected' && (
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <button
              onClick={toggleMicMute}
              title={isMicMuted ? 'Включить микрофон' : 'Отключить микрофон'}
              className={`p-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 transition-all ${
                isMicMuted
                  ? 'bg-amber-950/50 text-amber-400 border-amber-800 hover:bg-amber-900/50'
                  : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {isMicMuted ? <MicOff className="w-3.5 h-3.5 text-amber-400" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
              <span className="hidden sm:inline text-[11px]">{isMicMuted ? 'Микрофон выкл' : 'Микрофон вкл'}</span>
            </button>

            <span className="text-xs font-mono text-emerald-400 font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-700 whitespace-nowrap">
              {formatCallTime(callDuration)}
            </span>

            <button
              onClick={handleEndCall}
              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs flex items-center gap-1 transition-colors whitespace-nowrap shadow-xs"
            >
              <PhoneOff className="w-3 h-3" />
              <span>Завершить</span>
            </button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {callStatus === 'idle' ? (
          <motion.div
            key="call-idle"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="py-7 text-center space-y-4"
          >
            <div className="relative w-14 h-14 rounded-full bg-slate-800 border border-slate-700 mx-auto flex items-center justify-center text-slate-300">
              <Phone className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h5 className="text-sm font-bold text-white">
                Позвонить боту «{agent.companyName || agent.name}»
              </h5>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Симуляция телефонного разговора: с гудками вызова, распознаванием вашего голоса и голосовыми ответами.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartCall}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 mx-auto"
            >
              <Phone className="w-4 h-4" />
              <span>Начать телефонный звонок</span>
            </motion.button>
          </motion.div>
        ) : callStatus === 'dialing' ? (
          <motion.div
            key="call-dialing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-8 text-center space-y-3"
          >
            <div className="w-12 h-12 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-400 mx-auto flex items-center justify-center">
              <Phone className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="text-sm font-semibold text-white">Идут гудки вызова...</div>
              <div className="text-xs text-blue-400 font-mono">Соединение со шлюзом SIP А1/МТС (0.5 сек)</div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="call-active"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="space-y-3.5"
          >
            
            {/* Active Call Status Bar */}
            <div className={`p-3 rounded-2xl border transition-all ${
              isBotSpeaking
                ? 'bg-blue-950/40 border-blue-800/80'
                : isMicMuted
                ? 'bg-slate-900 border-slate-800'
                : 'bg-emerald-950/40 border-emerald-800/80'
            } flex items-center justify-between`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className={`relative w-9 h-9 rounded-full border flex items-center justify-center shrink-0 ${
                  isBotSpeaking
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm shadow-blue-500/40'
                    : isMicMuted
                    ? 'bg-slate-800 text-slate-400 border-slate-700'
                    : 'bg-emerald-600 text-white border-emerald-500 shadow-sm shadow-emerald-500/40'
                }`}>
                  {isBotSpeaking ? (
                    <Volume2 className="w-4 h-4 animate-pulse" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                  {isBotSpeaking && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-400 rounded-full animate-ping"></span>
                  )}
                  {!isBotSpeaking && !isMicMuted && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse"></span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">
                    {agent.companyName} ({agent.voice === 'dmitry' ? 'Дмитрий' : 'Анна'})
                  </div>
                  <div className="text-[11px] flex items-center gap-1.5 truncate">
                    {isBotThinking ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-indigo-300 font-medium">ИИ формирует ответ...</span>
                        <progress
                          aria-label="Генерация ответа ассистента"
                          className="w-28 h-1 rounded-full overflow-hidden accent-indigo-500"
                        />
                      </div>
                    ) : isBotSpeaking ? (
                      <span className="text-blue-300 font-medium">🔊 Бот отвечает в динамик...</span>
                    ) : isMicMuted ? (
                      <span className="text-slate-400">🔇 Микрофон отключен</span>
                    ) : (
                      <span className="text-emerald-400 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                        Слушаю вас... Говорите в микрофон!
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Dynamic Sound Wave Spectrum */}
              <div className="flex items-center gap-1 h-5 shrink-0 pl-2">
                {waveBars.map((h, i) => {
                  const effectiveHeight = isBotSpeaking 
                    ? h 
                    : (!isMicMuted && audioLevel > 5) 
                    ? Math.max(15, (audioLevel * (1 + (i % 3) * 0.4)))
                    : 18;

                  return (
                    <motion.div
                      key={i}
                      animate={{ height: `${Math.min(100, Math.max(15, effectiveHeight))}%` }}
                      transition={{ duration: 0.08 }}
                      className={`w-1 rounded-full ${
                        isBotSpeaking
                          ? 'bg-blue-400'
                          : (!isMicMuted && audioLevel > 5)
                          ? 'bg-emerald-400'
                          : 'bg-slate-700'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Mic error notice */}
            {micError && (
              <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-800 text-amber-200 text-[11px] flex items-center gap-2">
                <span>⚠️</span>
                <span>{micError}</span>
              </div>
            )}

            {/* Live speech transcription preview with instant submit */}
            {interimTranscript && !isBotSpeaking && !isMicMuted && (
              <motion.div
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-2xl bg-emerald-950/70 border border-emerald-600/70 text-emerald-200 text-xs flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                  <span className="font-semibold text-[11px] text-emerald-300 shrink-0">Вы:</span>
                  <span className="italic truncate">«{interimTranscript}»</span>
                </div>
                <button
                  type="button"
                  onClick={submitNow}
                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] shrink-0 transition-all flex items-center gap-1"
                >
                  <span>Отправить ⏎</span>
                </button>
              </motion.div>
            )}

            {/* Quick Prompts to ask */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="text-[10px] text-slate-400 font-medium">Быстрые фразы:</span>
              <button
                type="button"
                onClick={() => handleSendMessage('Сколько стоят ваши услуги и где вы находитесь?')}
                className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
              >
                "Сколько стоят услуги и где адрес?"
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage('Есть ли рассрочка?')}
                className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
              >
                "Есть ли рассрочка?"
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage('Запишите меня на завтра на 18:30')}
                className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
              >
                "Запишите на 18:30"
              </button>
            </div>

            {/* Transcript Scroll Area */}
            <div
              ref={transcriptRef}
              className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 h-52 overflow-y-auto space-y-2.5 scroll-smooth text-xs"
            >
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2.5 ${m.speaker === 'assistant' ? 'text-slate-200' : 'text-white justify-end'}`}
                >
                  {m.speaker === 'assistant' && (
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 text-[9px] font-bold">
                      ИИ
                    </div>
                  )}
                  <div
                    className={`p-2.5 rounded-2xl max-w-[85%] ${
                      m.speaker === 'assistant'
                        ? 'bg-slate-800 border border-slate-700 text-slate-100'
                        : 'bg-blue-600 text-white text-right'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-0.5 text-[10px] text-slate-400">
                      <span className="font-semibold">{m.speaker === 'assistant' ? agent.name : 'Вы'}</span>
                      <span>{m.time}</span>
                    </div>
                    <p className="leading-relaxed">{m.text}</p>
                  </div>
                  {m.speaker === 'user' && (
                    <div className="w-5 h-5 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center shrink-0 text-[9px] font-bold">
                      <User className="w-3 h-3" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* User Input Bar (Mic + Text fallback) */}
            <form onSubmit={handleSubmitForm} className="flex gap-2">
              <button
                type="button"
                onClick={toggleMicMute}
                title={isMicMuted ? 'Включить микрофон' : 'Отключить микрофон'}
                className={`px-3 py-2 rounded-xl border text-xs flex items-center justify-center transition-all ${
                  isMicMuted 
                    ? 'bg-amber-950/60 text-amber-400 border-amber-800' 
                    : 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                }`}
              >
                {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 animate-pulse" />}
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={isMicMuted ? "Микрофон выключен. Напишите вопрос..." : "Говорите в микрофон или напишите сюда..."}
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
