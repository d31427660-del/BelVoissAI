import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  EndCallRoundedIcon as PhoneOff,
  PhoneCallingRoundedIcon as Phone,
  MicrophoneIcon as Mic,
  Microphone2Icon as MicOff,
  VolumeLoudIcon as Volume2,
  CloseCircleIcon as Close,
  SendSquareIcon as Send,
  KeyboardIcon as Keyboard,
  CheckCircleIcon as Check
} from '@solar-icons/react/bold-duotone';
import { NICHE_TEMPLATES } from '../lib/mockData';
import { BusinessNiche, VoiceId } from '../types';
import { VoiceSimulator } from '../lib/speechSynth';
import { useSpeechRecognition } from '../lib/useSpeechRecognition';
import { requestBotReply } from '../lib/botDialogueEngine';
import { playRingingTone, playHangupSound } from '../lib/telephonyAudio';

interface VoiceTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToDashboard: () => void;
}

type CallState = 'ready' | 'dialing' | 'connected' | 'ended';

export const VoiceTestModal: React.FC<VoiceTestModalProps> = ({
  isOpen,
  onClose,
  onProceedToDashboard
}) => {
  const [selectedNiche, setSelectedNiche] = useState<BusinessNiche>('driving_school');
  const [selectedVoice, setSelectedVoice] = useState<VoiceId>('anna');
  const [callState, setCallState] = useState<CallState>('ready');
  const [callDuration, setCallDuration] = useState(0);
  const [isBotSpeaking, setIsBotSpeaking] = useState(false);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [aiProvider, setAiProvider] = useState<'yandexgpt-lite' | 'local-fallback' | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [customText, setCustomText] = useState('');
  const [transcript, setTranscript] = useState<Array<{ speaker: 'assistant' | 'user'; text: string; time: string }>>([]);
  const [waveBars, setWaveBars] = useState<number[]>([25, 45, 75, 90, 60, 40, 70, 85, 55, 30]);

  const transcriptScrollRef = useRef<HTMLDivElement | null>(null);
  const transcriptRef = useRef<Array<{ speaker: 'assistant' | 'user'; text: string; time: string }>>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const ringtoneStopRef = useRef<(() => void) | null>(null);
  const lastBotMessageRef = useRef('');
  const callStateRef = useRef<CallState>('ready');
  const isBotSpeakingRef = useRef(false);

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  useEffect(() => {
    isBotSpeakingRef.current = isBotSpeaking || isBotThinking;
  }, [isBotSpeaking, isBotThinking]);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  const currentTemplate = NICHE_TEMPLATES[selectedNiche];

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Bot speech handler with soft mic ignore
  const speakBotMessage = useCallback((textToSpeak: string) => {
    setIsBotSpeaking(true);
    speechRecognition.setBotSpeaking(true);
    lastBotMessageRef.current = textToSpeak.toLowerCase();

    VoiceSimulator.speak(
      textToSpeak,
      selectedVoice,
      () => {
        setIsBotSpeaking(true);
        speechRecognition.setBotSpeaking(true);
      },
      () => {
        setIsBotSpeaking(false);
        speechRecognition.setBotSpeaking(false);
      },
      (bars) => {
        setWaveBars(bars.slice(0, 10));
      }
    );
  }, [selectedVoice]);

  // Handle incoming message from user
  const handleUserMessage = useCallback(async (userQuery: string) => {
    const clean = userQuery.trim();
    if (!clean || callStateRef.current !== 'connected' || isBotSpeakingRef.current) return;

    // Discard echo of bot's own phrase
    if (lastBotMessageRef.current && lastBotMessageRef.current.includes(clean.toLowerCase()) && clean.length < 25) {
      return;
    }

    // Immediately flag bot busy so recognition ignores room echo
    setIsBotThinking(true);
    isBotSpeakingRef.current = true;
    speechRecognition.setBotSpeaking(true);

    const priorHistory = transcriptRef.current.map(({ speaker, text }) => ({ speaker, text }));
    const timeStr = formatTime(callDuration);
    setTranscript(prev => [...prev, { speaker: 'user', text: clean, time: timeStr }]);
    setCustomText('');

    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const { reply, provider } = await requestBotReply(
        clean,
        {
          niche: selectedNiche,
          companyName: currentTemplate.companyName,
          city: currentTemplate.city,
          address: currentTemplate.address,
          phone: currentTemplate.phone,
          workingHours: currentTemplate.workingHours,
          pricingAndServices: currentTemplate.pricingAndServices,
          knowledgeBase: currentTemplate.knowledgeBase,
          voice: selectedVoice,
        },
        priorHistory,
        controller.signal
      );

      if (callStateRef.current !== 'connected') return;

      setAiProvider(provider);
      setIsBotThinking(false);
      const aiTimeStr = formatTime(callDuration + 1);
      setTranscript(prev => [...prev, { speaker: 'assistant', text: reply, time: aiTimeStr }]);

      speakBotMessage(reply);
    } catch {
      setIsBotThinking(false);
      if (callStateRef.current === 'connected') {
        speechRecognition.setBotSpeaking(false);
      }
    }
  }, [callDuration, currentTemplate, selectedNiche, selectedVoice, speakBotMessage]);

  // Speech Recognition Hook (1.8s silence delay for calm conversation)
  const speechRecognition = useSpeechRecognition({
    lang: 'ru-RU',
    silenceDelayMs: 1800,
    onFinalTranscript: (spoken) => {
      if (callStateRef.current === 'connected' && !isBotSpeakingRef.current && !isMuted) {
        handleUserMessage(spoken);
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

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTo({
        top: transcriptScrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [transcript, interimTranscript]);

  // Call timer
  useEffect(() => {
    let timer: number | null = null;
    if (callState === 'connected') {
      timer = window.setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [callState]);

  // Start call lifecycle: User clicks "Начать звонок"
  const beginCall = () => {
    setCallState('dialing');
    setCallDuration(0);
    setTranscript([]);
    setIsMuted(false);
    setShowTextInput(false);
    setCustomText('');
    VoiceSimulator.stop();

    // Start microphone during this user gesture so browser gives permission immediately
    startListening();
    setBotSpeaking(true); // ignore audio while dialing and bot speaks greeting

    // 1. Play dial tone
    if (ringtoneStopRef.current) ringtoneStopRef.current();
    ringtoneStopRef.current = playRingingTone();

    // 2. Connect after 1.2s
    setTimeout(() => {
      if (ringtoneStopRef.current) {
        ringtoneStopRef.current();
        ringtoneStopRef.current = null;
      }

      setCallState('connected');

      const welcome = currentTemplate.firstMessage;
      setTranscript([{ speaker: 'assistant', text: welcome, time: '00:01' }]);

      // 3. Bot speaks greeting (mic opens right after greeting ends)
      speakBotMessage(welcome);
    }, 1200);
  };

    // Reset state on open/close
  useEffect(() => {
    if (isOpen) {
      setCallState('ready');
      setTranscript([]);
      setCallDuration(0);
      setIsBotSpeaking(false);
      setIsBotThinking(false);
      setAiProvider(null);
      setIsMuted(false);
      setShowTextInput(false);
    } else {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      if (ringtoneStopRef.current) {
        ringtoneStopRef.current();
        ringtoneStopRef.current = null;
      }
      VoiceSimulator.stop();
      stopListening();
    }
  }, [isOpen]);

  const handleHangup = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (ringtoneStopRef.current) {
      ringtoneStopRef.current();
      ringtoneStopRef.current = null;
    }
    playHangupSound();
    VoiceSimulator.stop();
    stopListening();
    setIsBotSpeaking(false);
    setIsBotThinking(false);
    setCallState('ended');
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    setMuted(next);
  };

  const handleCenterOrbClick = () => {
    if (callState !== 'connected' || isBotSpeaking || isBotThinking) return;

    if (interimTranscript.trim()) {
      submitNow();
    } else if (isMuted) {
      toggleMute();
    } else if (!isListening) {
      startListening();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      {/* Phone modal container */}
      <div className="relative w-full max-w-lg rounded-[36px] bg-[#0c0f18] text-white border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header / Telecom Line Bar */}
        <div className="px-5 py-3.5 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${callState === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400'}`} />
            <span className="font-mono text-[11px] text-slate-300">
              МТС • А1 SIP Trunk
            </span>
            {aiProvider === 'yandexgpt-lite' && (
              <span className="px-2 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 text-[10px] font-semibold">
                YandexGPT Lite
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {callState === 'connected' && (
              <span className="font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-full text-[11px]">
                {formatTime(callDuration)}
              </span>
            )}
            <button
              onClick={() => {
                handleHangup();
                onClose();
              }}
              className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <Close size={16} />
            </button>
          </div>
        </div>

        {/* Niche & Voice Quick Selector */}
        <div className="px-5 py-2.5 bg-slate-900/40 border-b border-slate-800/60 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar text-xs">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] text-slate-400">Сфера:</span>
            {(['driving_school', 'auto_service', 'medical_clinic', 'beauty_salon'] as BusinessNiche[]).map((n) => (
              <button
                key={n}
                onClick={() => {
                  setSelectedNiche(n);
                  if (callState === 'connected' || callState === 'dialing') {
                    beginCall();
                  }
                }}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                  selectedNiche === n
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {NICHE_TEMPLATES[n].name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-auto">
            <button
              onClick={() => setSelectedVoice('anna')}
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                selectedVoice === 'anna' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Анна
            </button>
            <button
              onClick={() => setSelectedVoice('dmitry')}
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                selectedVoice === 'dmitry' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Дмитрий
            </button>
          </div>
        </div>

        {/* Main Stage */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5 flex flex-col items-center text-center">
          
          {callState === 'ready' ? (
            /* Ready to Call Screen */
            <div className="py-8 space-y-5 my-auto max-w-sm">
              <div className="relative w-16 h-16 rounded-full bg-slate-800 border border-slate-700 mx-auto flex items-center justify-center text-emerald-400">
                <Phone size={30} />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xl font-bold text-white">
                  {currentTemplate.companyName}
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  {currentTemplate.phone} • {currentTemplate.city}
                </p>
                <p className="text-xs text-slate-400 pt-1">
                  Нажмите кнопку ниже, чтобы начать голосовой разговор с ИИ-ассистентом.
                </p>
              </div>

              <button
                onClick={beginCall}
                className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-600/30 transition-all active:scale-98"
              >
                <Phone size={18} />
                <span>Начать звонок</span>
              </button>
            </div>
          ) : callState !== 'ended' ? (
            /* Active Call Screen */
            <>
              {/* Caller Identity */}
              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  {currentTemplate.companyName}
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  {currentTemplate.phone} • {currentTemplate.city}
                </p>
                <div className="pt-1">
                  {callState === 'dialing' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-blue-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                      Гудки вызова... Соединение со шлюзом РБ...
                    </span>
                  ) : isBotThinking ? (
                    <div className="inline-flex flex-col items-center gap-1">
                      <span className="text-xs text-indigo-300 font-medium">
                        ИИ формирует ответ по прайсу...
                      </span>
                      <progress
                        aria-label="Генерация ответа ассистента"
                        className="w-36 h-1 rounded-full overflow-hidden accent-indigo-500"
                      />
                    </div>
                  ) : isBotSpeaking ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-blue-300 font-medium">
                      <Volume2 className="w-4 h-4 text-blue-400 animate-pulse" />
                      {selectedVoice === 'dmitry' ? 'Дмитрий' : 'Анна'} отвечает в динамик...
                    </span>
                  ) : isMuted ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-medium">
                      <MicOff className="w-4 h-4" />
                      Микрофон выключен (нажмите кнопку ниже)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      Слушаю вас... Говорите в микрофон!
                    </span>
                  )}
                </div>
              </div>

              {/* Pulsing Acoustic Voice Orb (Clickable to send or trigger mic) */}
              <div 
                onClick={handleCenterOrbClick}
                className="relative my-2 w-36 h-36 flex items-center justify-center select-none cursor-pointer"
                title={interimTranscript ? "Нажмите для отправки фразы" : "Микрофон активен"}
              >
                <motion.div
                  animate={{
                    scale: isBotSpeaking ? [1, 1.35, 1] : (!isMuted && audioLevel > 5) ? [1, 1.25, 1] : [1, 1.05, 1],
                    opacity: isBotSpeaking ? [0.6, 0.15, 0.6] : (!isMuted && audioLevel > 5) ? [0.5, 0.1, 0.5] : [0.2, 0.05, 0.2]
                  }}
                  transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
                  className={`absolute inset-0 rounded-full blur-xl ${
                    isBotSpeaking 
                      ? 'bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400' 
                      : (!isMuted && audioLevel > 5)
                      ? 'bg-gradient-to-tr from-emerald-500 via-teal-400 to-green-500'
                      : !isBotSpeaking && !isMuted
                      ? 'bg-gradient-to-tr from-emerald-600 to-teal-500'
                      : 'bg-gradient-to-tr from-slate-700 to-slate-900'
                  }`}
                />

                <div className={`relative w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                  isBotSpeaking
                    ? 'bg-gradient-to-br from-blue-500 via-indigo-600 to-blue-700 text-white shadow-blue-500/50 scale-105'
                    : (!isMuted && audioLevel > 5)
                    ? 'bg-gradient-to-br from-emerald-500 via-teal-600 to-green-700 text-white shadow-emerald-500/40 scale-105'
                    : !isBotSpeaking && !isMuted
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                    : 'bg-slate-800 text-slate-300 shadow-slate-900/40'
                }`}>
                  {isBotSpeaking ? (
                    <Volume2 className="w-10 h-10 animate-pulse" />
                  ) : !isMuted ? (
                    <Mic className="w-10 h-10" />
                  ) : (
                    <MicOff className="w-10 h-10 text-slate-500" />
                  )}
                </div>
              </div>

              {/* Live Spectrum Waveform Bars */}
              <div className="flex items-center justify-center gap-1 h-6 w-48">
                {waveBars.map((height, i) => {
                  const effective = isBotSpeaking
                    ? height
                    : (!isMuted && audioLevel > 5)
                    ? Math.max(20, audioLevel * (1 + (i % 3) * 0.3))
                    : 18;

                  return (
                    <motion.div
                      key={i}
                      animate={{ height: `${Math.min(100, Math.max(15, effective))}%` }}
                      transition={{ duration: 0.08 }}
                      className={`w-1 rounded-full ${
                        isBotSpeaking
                          ? 'bg-blue-400'
                          : (!isMuted && audioLevel > 5)
                          ? 'bg-emerald-400'
                          : 'bg-slate-700'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Mic warning if blocked */}
              {micError && (
                <div className="w-full p-2.5 rounded-xl bg-amber-950/70 border border-amber-800/80 text-amber-200 text-xs text-left">
                  ⚠️ {micError}
                </div>
              )}

              {/* Live speech preview with immediate SEND button */}
              {interimTranscript && !isBotSpeaking && !isMuted && (
                <motion.div
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full p-3 rounded-2xl bg-emerald-950/70 border border-emerald-600/70 text-emerald-200 text-xs flex items-center justify-between gap-2 text-left"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                    <span className="font-semibold text-emerald-300 shrink-0">Вы:</span>
                    <span className="italic truncate">«{interimTranscript}»</span>
                  </div>
                  <button
                    onClick={submitNow}
                    className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] shrink-0 transition-all flex items-center gap-1"
                  >
                    <span>Отправить ⏎</span>
                  </button>
                </motion.div>
              )}

              {/* Transcript Drawer */}
              <div
                ref={transcriptScrollRef}
                className="w-full p-4 rounded-2xl bg-slate-900/70 border border-slate-800 text-left space-y-2.5 max-h-40 overflow-y-auto scroll-smooth text-xs"
              >
                {transcript.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${msg.speaker === 'assistant' ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center gap-2 mb-0.5 text-[10px] text-slate-400">
                      <span>{msg.speaker === 'assistant' ? currentTemplate.name : 'Вы'}</span>
                      <span>{msg.time}</span>
                    </div>
                    <div
                      className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                        msg.speaker === 'assistant'
                          ? 'bg-slate-800/90 text-slate-100 border border-slate-700/60'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      <p>{msg.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Prompts */}
              <div className="w-full space-y-1.5 text-left">
                <span className="text-[11px] text-slate-400 font-medium">Быстрые вопросы (нажмите для проверки):</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => handleUserMessage('Сколько стоят ваши услуги и есть ли рассрочка?')}
                    className="px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                  >
                    💰 Сколько стоит?
                  </button>
                  <button
                    onClick={() => handleUserMessage('Где вы находитесь и какой адрес?')}
                    className="px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                  >
                    📍 Где вы находитесь?
                  </button>
                  <button
                    onClick={() => handleUserMessage('Запишите меня на завтра на 18:30')}
                    className="px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                  >
                    📅 Запишите на 18:30
                  </button>
                  <button
                    onClick={() => handleUserMessage('Есть ли рассрочка без переплат?')}
                    className="px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                  >
                    💳 Есть рассрочка?
                  </button>
                </div>
              </div>

              {/* Text Input Toggleable Fallback */}
              {showTextInput && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (customText.trim()) handleUserMessage(customText.trim());
                  }}
                  className="w-full flex gap-2"
                >
                  <input
                    type="text"
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="Напишите вопрос, если неудобно говорить вслух..."
                    className="flex-1 px-4 py-2.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!customText.trim()}
                    className="px-4 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold disabled:opacity-40 flex items-center gap-1"
                  >
                    <Send size={14} />
                  </button>
                </form>
              )}
            </>
          ) : (
            /* Call Ended Summary Screen */
            <div className="py-8 space-y-5 text-center my-auto">
              <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 mx-auto flex items-center justify-center text-slate-400">
                <Check size={28} className="text-emerald-400" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-white">Вызов завершен</h4>
                <p className="text-xs text-slate-400 font-mono">
                  Длительность разговора: {formatTime(callDuration)}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 text-left space-y-1.5 max-w-sm mx-auto">
                <div className="text-slate-400 font-semibold mb-1">Результат симуляции SIP:</div>
                <div className="flex items-center justify-between text-[11px]">
                  <span>Задержка отклика TTS:</span>
                  <span className="font-mono text-emerald-400 font-bold">0.48 сек</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span>Линия связи:</span>
                  <span className="font-mono text-slate-200">МТС / А1 Trunk</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span>Синхронизация CRM:</span>
                  <span className="text-emerald-400">Лид зафиксирован</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={beginCall}
                  className="px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg transition-all"
                >
                  <Phone size={16} />
                  <span>Позвонить еще раз</span>
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onProceedToDashboard();
                  }}
                  className="px-6 py-3 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors"
                >
                  В личный кабинет
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Bottom Phone Action Bar */}
        {callState === 'connected' && (
          <div className="p-5 bg-slate-900/80 border-t border-slate-800/80 flex items-center justify-center gap-5">
            {/* Mute Mic Button */}
            <button
              onClick={toggleMute}
              title={isMuted ? 'Включить микрофон' : 'Отключить микрофон'}
              className={`w-13 h-13 rounded-full flex flex-col items-center justify-center gap-1 transition-all ${
                isMuted
                  ? 'bg-amber-600/20 text-amber-400 border border-amber-500/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
              }`}
            >
              {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              <span className="text-[9px] font-medium">{isMuted ? 'Вкл. микр' : 'Микрофон'}</span>
            </button>

            {/* End Call Button (Big Red) */}
            <button
              onClick={handleHangup}
              title="Завершить вызов"
              className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 transition-transform active:scale-95"
            >
              <PhoneOff size={26} />
            </button>

            {/* Text Input Toggle */}
            <button
              onClick={() => setShowTextInput(prev => !prev)}
              title="Открыть клавиатуру"
              className={`w-13 h-13 rounded-full flex flex-col items-center justify-center gap-1 transition-all ${
                showTextInput
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
              }`}
            >
              <Keyboard size={20} />
              <span className="text-[9px] font-medium">Текст</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
