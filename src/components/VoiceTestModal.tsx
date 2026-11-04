import React, { useState, useEffect, useRef, useCallback, useId } from 'react';
import { motion } from 'framer-motion';
import {
  EndCallRoundedIcon as PhoneOff,
  PhoneCallingRoundedIcon as Phone,
  MicrophoneIcon as Mic,
  Microphone2Icon as MicOff,
  VolumeLoudIcon as Volume2,
  CloseCircleIcon as Close,
  SendSquareIcon as Send,
  KeyboardIcon as Keyboard,
  CheckCircleIcon as Check,
  MapPointIcon as MapPin,
} from '@solar-icons/react/bold-duotone';
import { NICHE_TEMPLATES } from '../lib/mockData';
import { BusinessNiche, VoiceId, CallLog } from '../types';
import { VoiceSimulator } from '../lib/speechSynth';
import { useSpeechRecognition } from '../lib/useSpeechRecognition';
import {
  requestBotReply,
  NICHE_QUICK_QUESTIONS,
  adaptGreetingForVoice,
  createCallLogFromDialogue,
} from '../lib/botDialogueEngine';
import { playRingingTone, playHangupSound } from '../lib/telephonyAudio';

interface VoiceTestModalProps {
  isOpen: boolean;
  initialNiche?: BusinessNiche;
  initialVoice?: VoiceId;
  onClose: () => void;
  onCallCompleted?: (log: CallLog) => void;
  onProceedToDashboard: (niche: BusinessNiche, voice: VoiceId) => void;
}

type CallState = 'ready' | 'dialing' | 'connected' | 'ended';

const CATEGORY_TABS: Array<{ id: BusinessNiche; shortLabel: string; emoji: string }> = [
  { id: 'driving_school', shortLabel: 'Автошкола', emoji: '🚦' },
  { id: 'auto_service', shortLabel: 'Автосервис', emoji: '🚗' },
  { id: 'medical_clinic', shortLabel: 'Стоматология', emoji: '🦷' },
  { id: 'beauty_salon', shortLabel: 'Салон красоты', emoji: '💇‍♀️' },
];

export const VoiceTestModal: React.FC<VoiceTestModalProps> = ({
  isOpen,
  initialNiche = 'driving_school',
  initialVoice = 'anna',
  onClose,
  onCallCompleted,
  onProceedToDashboard,
}) => {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  const [selectedNiche, setSelectedNiche] = useState<BusinessNiche>(initialNiche);
  const [selectedVoice, setSelectedVoice] = useState<VoiceId>(initialVoice);
  const [callState, setCallState] = useState<CallState>('ready');
  const [callDuration, setCallDuration] = useState(0);
  const [isBotSpeaking, setIsBotSpeaking] = useState(false);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [aiProvider, setAiProvider] = useState<'yandexgpt-lite' | 'local-fallback' | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [customText, setCustomText] = useState('');
  const [transcript, setTranscript] = useState<
    Array<{ speaker: 'assistant' | 'user'; text: string; time: string }>
  >([]);
  const [waveBars, setWaveBars] = useState<number[]>([22, 40, 68, 84, 56, 38, 65, 80, 50, 28]);

  const transcriptScrollRef = useRef<HTMLDivElement | null>(null);
  const transcriptRef = useRef<Array<{ speaker: 'assistant' | 'user'; text: string; time: string }>>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const connectTimerRef = useRef<number | null>(null);
  const ringtoneStopRef = useRef<(() => void) | null>(null);
  const lastBotMessageRef = useRef('');
  const callStateRef = useRef<CallState>('ready');
  const isBotSpeakingRef = useRef(false);
  const selectedNicheRef = useRef<BusinessNiche>(initialNiche);
  const selectedVoiceRef = useRef<VoiceId>(initialVoice);
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
    const niche = selectedNicheRef.current;
    const tmpl = NICHE_TEMPLATES[niche] || NICHE_TEMPLATES.driving_school;
    const log = createCallLogFromDialogue({
      niche,
      companyName: tmpl.companyName,
      address: tmpl.address,
      durationSeconds: callDurationRef.current,
      messages: transcriptRef.current,
    });
    if (log) {
      callLoggedRef.current = true;
      onCallCompletedRef.current?.(log);
    }
  }, []);

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  useEffect(() => {
    isBotSpeakingRef.current = isBotSpeaking || isBotThinking;
  }, [isBotSpeaking, isBotThinking]);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    selectedNicheRef.current = selectedNiche;
  }, [selectedNiche]);

  useEffect(() => {
    selectedVoiceRef.current = selectedVoice;
  }, [selectedVoice]);

  const currentTemplate = NICHE_TEMPLATES[selectedNiche];
  const quickQuestions = NICHE_QUICK_QUESTIONS[selectedNiche] || NICHE_QUICK_QUESTIONS.driving_school;
  const voiceDisplayName = selectedVoice === 'maxim' ? 'Максим' : 'Анна';

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const cleanupActiveCallAudio = useCallback(() => {
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

  // Bot speech handler with soft mic ignore
  const speakBotMessage = useCallback((textToSpeak: string, voiceOverride?: VoiceId) => {
    const activeVoice = voiceOverride ?? selectedVoiceRef.current;
    isBotSpeakingRef.current = true;
    setIsBotSpeaking(true);
    speechRecognition.setBotSpeaking(true);
    lastBotMessageRef.current = textToSpeak.trim().toLowerCase();

    VoiceSimulator.speak(
      textToSpeak,
      activeVoice,
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
      (bars) => {
        setWaveBars(bars.slice(0, 10));
      }
    );
  }, []);

  // Handle incoming message from user — always reads latest selectedNicheRef & selectedVoiceRef
  const handleUserMessage = useCallback(
    async (userQuery: string) => {
      const clean = userQuery.trim();
      if (!clean || callStateRef.current !== 'connected' || isBotSpeakingRef.current) return;

      if (lastBotMessageRef.current && clean.length >= 25 && lastBotMessageRef.current === clean.toLowerCase()) {
        return;
      }

      const activeNiche = selectedNicheRef.current;
      const activeVoice = selectedVoiceRef.current;
      const tmpl = NICHE_TEMPLATES[activeNiche];

      setIsBotThinking(true);
      isBotSpeakingRef.current = true;
      speechRecognition.setBotSpeaking(true);

      const priorHistory = transcriptRef.current.map(({ speaker, text }) => ({ speaker, text }));
      const timeStr = formatTime(callDuration);
      setTranscript((prev) => [...prev, { speaker: 'user', text: clean, time: timeStr }]);
      setCustomText('');

      if (abortControllerRef.current) abortControllerRef.current.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const { reply, provider } = await requestBotReply(
          clean,
          {
            niche: activeNiche,
            companyName: tmpl.companyName,
            city: tmpl.city,
            address: tmpl.address,
            phone: tmpl.phone,
            workingHours: tmpl.workingHours,
            pricingAndServices: tmpl.pricingAndServices,
            knowledgeBase: tmpl.knowledgeBase,
            voice: activeVoice,
          },
          priorHistory,
          controller.signal
        );

        if (callStateRef.current !== 'connected' || selectedNicheRef.current !== activeNiche || controller.signal.aborted) return;

        setAiProvider(provider);
        setIsBotThinking(false);
        const aiTimeStr = formatTime(callDuration + 1);
        setTranscript((prev) => [...prev, { speaker: 'assistant', text: reply, time: aiTimeStr }]);

        speakBotMessage(reply, activeVoice);
      } catch {
        if (controller.signal.aborted) {
          // Newer user speech already started; do not clobber active bot thinking/speaking flags
          return;
        }
        isBotSpeakingRef.current = false;
        setIsBotThinking(false);
        if (callStateRef.current === 'connected') {
          speechRecognition.setBotSpeaking(false);
        }
      }
    },
    [callDuration, speakBotMessage]
  );

  // Speech Recognition Hook
  const speechRecognition = useSpeechRecognition({
    lang: 'ru-RU',
    silenceDelayMs: 750,
    onFinalTranscript: (spoken) => {
      if (callStateRef.current === 'connected' && !isBotSpeakingRef.current && !isMuted) {
        handleUserMessage(spoken);
      }
    },
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
    submitNow,
  } = speechRecognition;

  useEffect(() => {
    if (micError) {
      setShowTextInput(true);
    }
  }, [micError]);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTo({
        top: transcriptScrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [transcript, interimTranscript]);

  // Call timer
  useEffect(() => {
    let timer: number | null = null;
    if (callState === 'connected') {
      timer = window.setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [callState]);

  // Start call lifecycle — accepts optional nicheOverride & voiceOverride so switching category mid-call uses fresh data immediately
  const beginCall = useCallback(
    (nicheOverride?: BusinessNiche, voiceOverride?: VoiceId) => {
      const targetNiche = nicheOverride ?? selectedNicheRef.current;
      const targetVoice = voiceOverride ?? selectedVoiceRef.current;
      const tmpl = NICHE_TEMPLATES[targetNiche];

      cleanupActiveCallAudio();
      callLoggedRef.current = false;

      callStateRef.current = 'dialing';
      setCallState('dialing');
      setCallDuration(0);
      callDurationRef.current = 0;
      setTranscript([]);
      transcriptRef.current = [];
      setIsBotSpeaking(false);
      setIsBotThinking(false);
      setIsMuted(false);
      setCustomText('');
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

        callStateRef.current = 'connected';
        setCallState('connected');

        const welcome = adaptGreetingForVoice(tmpl.firstMessage, targetVoice, tmpl.companyName, tmpl.companyName);
        const firstEntry = [{ speaker: 'assistant' as const, text: welcome, time: '00:01' }];
        transcriptRef.current = firstEntry;
        setTranscript(firstEntry);

        speakBotMessage(welcome, targetVoice);
      }, 1050);
    },
    [cleanupActiveCallAudio, setBotSpeaking, speakBotMessage, startListening]
  );

  const handleSelectCategory = (nextNiche: BusinessNiche) => {
    flushCompletedCallLog();
    selectedNicheRef.current = nextNiche;
    setSelectedNiche(nextNiche);
    setCustomText('');

    if (callStateRef.current === 'connected' || callStateRef.current === 'dialing') {
      // Restart call immediately with the NEW category data
      beginCall(nextNiche, selectedVoiceRef.current);
    } else {
      cleanupActiveCallAudio();
      callStateRef.current = 'ready';
      setCallState('ready');
      setTranscript([]);
      transcriptRef.current = [];
      setCallDuration(0);
      callDurationRef.current = 0;
    }
  };

  const handleSelectVoice = (nextVoice: VoiceId) => {
    flushCompletedCallLog();
    selectedVoiceRef.current = nextVoice;
    setSelectedVoice(nextVoice);
    if (callStateRef.current === 'connected' || callStateRef.current === 'dialing') {
      beginCall(selectedNicheRef.current, nextVoice);
    }
  };

  const handleHangup = useCallback(() => {
    flushCompletedCallLog();
    cleanupActiveCallAudio();
    playHangupSound();
    stopListening();
    isBotSpeakingRef.current = false;
    setIsBotSpeaking(false);
    setIsBotThinking(false);
    callStateRef.current = 'ended';
    setCallState('ended');
  }, [cleanupActiveCallAudio, flushCompletedCallLog, stopListening]);

  // Native <dialog> lifecycle + Safari light-dismiss fallback (Modern Web Guidance)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      selectedNicheRef.current = initialNiche;
      setSelectedNiche(initialNiche);
      selectedVoiceRef.current = initialVoice;
      setSelectedVoice(initialVoice);
      callLoggedRef.current = false;
      callStateRef.current = 'ready';
      setCallState('ready');
      setTranscript([]);
      transcriptRef.current = [];
      setCallDuration(0);
      callDurationRef.current = 0;
      setIsBotSpeaking(false);
      setIsBotThinking(false);
      setAiProvider(null);
      setIsMuted(false);
      setShowTextInput(false);

      if (!dialog.open) {
        try {
          dialog.showModal();
        } catch {
          // ignore
        }
      }
    } else {
      cleanupActiveCallAudio();
      stopListening();
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen, initialNiche, initialVoice, cleanupActiveCallAudio, stopListening]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleNativeClose = () => {
      flushCompletedCallLog();
      cleanupActiveCallAudio();
      stopListening();
      isBotSpeakingRef.current = false;
      setIsBotSpeaking(false);
      setIsBotThinking(false);
      onClose();
    };

    dialog.addEventListener('close', handleNativeClose);

    // Fallback for browsers without <dialog closedby="any"> support (e.g. Safari)
    let handleBackdropClick: ((event: MouseEvent) => void) | null = null;
    if (typeof HTMLDialogElement !== 'undefined' && !('closedBy' in HTMLDialogElement.prototype)) {
      handleBackdropClick = (event: MouseEvent) => {
        if (event.target !== dialog) return;
        // Do not drop ongoing call on accidental backdrop click
        if (callStateRef.current === 'connected' || callStateRef.current === 'dialing') {
          return;
        }
        const rect = dialog.getBoundingClientRect();
        const isDialogContent =
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width;
        if (isDialogContent) return;
        dialog.close();
      };
      dialog.addEventListener('click', handleBackdropClick);
    }

    return () => {
      dialog.removeEventListener('close', handleNativeClose);
      if (handleBackdropClick) {
        dialog.removeEventListener('click', handleBackdropClick);
      }
    };
  }, [cleanupActiveCallAudio, flushCompletedCallLog, onClose, stopListening]);

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
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      {...(callState !== 'connected' && callState !== 'dialing' ? ({ closedby: 'any' } as any) : {})}
      className="m-auto w-[calc(100%-1.5rem)] max-w-lg rounded-3xl bg-white text-slate-900 border border-slate-200/90 shadow-2xl shadow-slate-900/15 p-0 overflow-hidden backdrop:bg-slate-900/35 backdrop:backdrop-blur-xs"
    >
      <div className="flex flex-col max-h-[90vh]">
        {/* Top Bar (Clean Light Header) */}
        <div className="px-5 py-3.5 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                callState === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-blue-600'
              }`}
            />
            <span className="text-xs font-semibold text-slate-700">Тест голоса Voxi.by</span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-semibold">
              {aiProvider === 'yandexgpt-lite' ? 'YandexGPT Lite + SpeechKit' : 'Yandex SpeechKit'}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {callState === 'connected' && (
              <span className="font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px]">
                {formatTime(callDuration)}
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                if (callState === 'connected' || callState === 'dialing') {
                  playHangupSound();
                }
                dialogRef.current?.close();
              }}
              aria-label="Закрыть окно тестирования"
              className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 flex items-center justify-center transition-colors"
            >
              <Close size={18} />
            </button>
          </div>
        </div>

        {/* Category & Voice Selector (Clean 4-pill Grid + Voice Segmented Switch) */}
        <div className="px-5 py-3 bg-white border-b border-slate-100 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-500">Выберите сферу бизнеса:</span>
            <div className="inline-flex items-center p-0.5 rounded-full bg-slate-100 border border-slate-200/80 text-[11px]">
              {[
                { id: 'anna' as const, label: 'Анна (женский)' },
                { id: 'maxim' as const, label: 'Максим (мужской)' },
              ].map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => handleSelectVoice(v.id)}
                  className={`px-2.5 py-1 rounded-full font-semibold transition-all ${
                    selectedVoice === v.id
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CATEGORY_TABS.map((cat) => {
              const active = selectedNiche === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelectCategory(cat.id)}
                  className={`px-2.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 border whitespace-nowrap ${
                    active
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80'
                  }`}
                >
                  <span className="shrink-0">{cat.emoji}</span>
                  <span>{cat.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Light Stage */}
        <div className="p-5 sm:p-6 flex-1 overflow-y-auto voxi-scroll bg-gradient-to-b from-slate-50/60 to-white space-y-4">
          {callState === 'ready' ? (
            <div className="py-4 space-y-5 text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 mx-auto flex items-center justify-center text-emerald-600 shadow-2xs">
                <Phone size={30} />
              </div>

              <div className="space-y-1.5">
                <h2 id={titleId} className="text-xl font-bold text-slate-900">
                  {currentTemplate.companyName}
                </h2>
                <p className="text-xs text-slate-500 font-mono">
                  {currentTemplate.phone} • г. {currentTemplate.city}
                </p>
              </div>

              {/* Live Category Context Preview Card */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 text-left space-y-1.5 shadow-2xs text-xs">
                <div className="flex items-start gap-2 text-slate-700">
                  <MapPin size={15} className="text-blue-600 shrink-0 mt-0.5" />
                  <span>{currentTemplate.address}</span>
                </div>
                <div className="text-[11px] text-slate-500 pl-5">
                  График: {currentTemplate.workingHours} • Голос: <strong className="text-slate-700">{voiceDisplayName}</strong>
                </div>
              </div>

              <button
                type="button"
                autoFocus
                onClick={() => beginCall(selectedNiche, selectedVoice)}
                className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center justify-center gap-2.5 shadow-md shadow-emerald-600/20 transition-all active:scale-[0.99]"
              >
                <Phone size={18} />
                <span>Позвонить боту ({voiceDisplayName})</span>
              </button>
            </div>
          ) : callState !== 'ended' ? (
            <>
              {/* Active Call Identity Header */}
              <div className="text-center space-y-1">
                <h2 id={titleId} className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                  {currentTemplate.companyName}
                </h2>
                <p className="text-xs text-slate-500 font-mono">
                  {currentTemplate.phone} • {currentTemplate.address.split('(')[0].trim()}
                </p>
                <div className="pt-1 flex justify-center">
                  {callState === 'dialing' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs text-blue-700 font-medium">
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                      Гудки вызова... Соединение с линией...
                    </span>
                  ) : isBotThinking ? (
                    <div className="inline-flex flex-col items-center gap-1 px-3 py-1 rounded-2xl bg-indigo-50 border border-indigo-200">
                      <span className="text-xs text-indigo-700 font-medium">
                        {voiceDisplayName} сверяет прайс и формирует ответ...
                      </span>
                      <progress
                        aria-label="Генерация ответа ассистента"
                        className="w-36 h-1 rounded-full overflow-hidden accent-indigo-600"
                      />
                    </div>
                  ) : isBotSpeaking ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs text-blue-700 font-semibold">
                      <Volume2 className="w-4 h-4 text-blue-600 animate-pulse" />
                      {voiceDisplayName} отвечает голосом...
                    </span>
                  ) : isMuted ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium">
                      <MicOff className="w-4 h-4 text-amber-600" />
                      Микрофон выключен
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      Слушаю вас... Говорите в микрофон
                    </span>
                  )}
                </div>
              </div>

              {/* Clean Light Acoustic Voice Orb + Waveform */}
              <div className="flex flex-col items-center gap-2.5 py-1">
                <button
                  type="button"
                  onClick={handleCenterOrbClick}
                  title={interimTranscript ? 'Нажмите для отправки фразы' : 'Микрофон активен'}
                  className="relative w-24 h-24 flex items-center justify-center rounded-full focus:outline-none"
                >
                  <motion.span
                    animate={{
                      scale: isBotThinking
                        ? [1, 1.28, 1]
                        : isBotSpeaking
                        ? [1, 1.24, 1]
                        : !isMuted && audioLevel > 5
                        ? [1, 1.18, 1]
                        : [1, 1.05, 1],
                      opacity: isBotThinking
                        ? [0.55, 0.2, 0.55]
                        : isBotSpeaking
                        ? [0.45, 0.15, 0.45]
                        : [0.3, 0.1, 0.3],
                    }}
                    transition={{ repeat: Infinity, duration: isBotThinking ? 0.9 : 1.6, ease: 'easeInOut' }}
                    className={`absolute inset-0 rounded-full ${
                      isBotThinking
                        ? 'bg-indigo-300'
                        : isBotSpeaking
                        ? 'bg-blue-200'
                        : !isMuted
                        ? 'bg-emerald-200'
                        : 'bg-slate-200'
                    }`}
                  />
                  <span
                    className={`relative w-18 h-18 rounded-full flex items-center justify-center border shadow-sm transition-all ${
                      isBotThinking
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-500/25'
                        : isBotSpeaking
                        ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/25'
                        : !isMuted
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-emerald-500/25'
                        : 'bg-slate-100 text-slate-500 border-slate-300'
                    }`}
                  >
                    {isBotThinking ? (
                      <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    ) : isBotSpeaking ? (
                      <Volume2 className="w-8 h-8 animate-pulse" />
                    ) : !isMuted ? (
                      <Mic className="w-8 h-8" />
                    ) : (
                      <MicOff className="w-8 h-8" />
                    )}
                  </span>
                </button>

                <div className="flex items-center justify-center gap-1 h-5 w-44">
                  {waveBars.map((height, i) => {
                    const effective = isBotSpeaking
                      ? height
                      : !isMuted && audioLevel > 5
                      ? Math.max(22, audioLevel * (1 + (i % 3) * 0.3))
                      : 20;

                    return (
                      <motion.div
                        key={i}
                        animate={{ height: `${Math.min(100, Math.max(18, effective))}%` }}
                        transition={{ duration: 0.08 }}
                        className={`w-1 rounded-full ${
                          isBotSpeaking
                            ? 'bg-blue-500'
                            : !isMuted && audioLevel > 5
                            ? 'bg-emerald-500'
                            : 'bg-slate-300'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Mic warning if blocked */}
              {micError && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs text-left">
                  {micError}
                </div>
              )}

              {/* Live speech preview with immediate SEND button */}
              {interimTranscript && !isBotSpeaking && !isMuted && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex items-center justify-between gap-2 text-left">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                    <span className="font-semibold text-emerald-800 shrink-0">Вы:</span>
                    <span className="italic truncate">«{interimTranscript}»</span>
                  </div>
                  <button
                    type="button"
                    onClick={submitNow}
                    className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] shrink-0 transition-colors"
                  >
                    Отправить ⏎
                  </button>
                </div>
              )}

              {/* Light Transcript Box */}
              <div
                ref={transcriptScrollRef}
                className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/90 text-left space-y-2.5 max-h-44 overflow-y-auto voxi-scroll text-xs"
              >
                {transcript.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${msg.speaker === 'assistant' ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center gap-2 mb-0.5 text-[10px] text-slate-500 px-1">
                      <span className="font-medium">
                        {msg.speaker === 'assistant'
                          ? `${voiceDisplayName} • ${currentTemplate.companyName}`
                          : 'Вы'}
                      </span>
                      <span>{msg.time}</span>
                    </div>
                    <div
                      className={`p-3 rounded-2xl max-w-[86%] leading-relaxed ${
                        msg.speaker === 'assistant'
                          ? 'bg-white text-slate-800 border border-slate-200/90 shadow-2xs'
                          : 'bg-blue-600 text-white shadow-2xs'
                      }`}
                    >
                      <p>{msg.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Dynamic Category-Specific Quick Prompts */}
              <div className="space-y-1.5 text-left">
                <span className="text-[11px] text-slate-500 font-semibold">
                  Быстрые вопросы для сферы «{currentTemplate.name}»:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {quickQuestions.map((q) => (
                    <button
                      key={q.label}
                      type="button"
                      onClick={() => handleUserMessage(q.query)}
                      className="px-3 py-1.5 rounded-full bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 text-xs font-medium transition-colors shadow-2xs"
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Input Fallback */}
              {showTextInput && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (customText.trim()) handleUserMessage(customText.trim());
                  }}
                  className="flex gap-2 pt-1"
                >
                  <input
                    type="text"
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.nativeEvent.isComposing) {
                        e.preventDefault();
                      }
                    }}
                    placeholder="Напишите вопрос, если неудобно говорить вслух..."
                    className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                  />
                  <button
                    type="submit"
                    disabled={!customText.trim()}
                    aria-label="Отправить сообщение"
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-40 flex items-center gap-1 transition-colors"
                  >
                    <Send size={15} />
                  </button>
                </form>
              )}
            </>
          ) : (
            /* Call Ended Summary Screen (Light Theme) */
            <div className="py-5 space-y-5 text-center max-w-sm mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 mx-auto flex items-center justify-center text-emerald-600">
                <Check size={28} />
              </div>
              <div className="space-y-1">
                <h2 id={titleId} className="text-lg font-bold text-slate-900">
                  Звонок завершён
                </h2>
                <p className="text-xs text-slate-500 font-mono">
                  {currentTemplate.companyName} • {formatTime(callDuration)}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 text-left space-y-2">
                <div className="text-slate-900 font-semibold">Итог тестового вызова:</div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Голосовой движок:</span>
                  <span className="font-semibold text-slate-900">Yandex SpeechKit ({voiceDisplayName})</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Языковая модель:</span>
                  <span className="font-semibold text-indigo-700">YandexGPT Lite</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Передача заявки в CRM / Telegram:</span>
                  <span className="font-semibold text-emerald-700">Готово</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => beginCall(selectedNiche, selectedVoice)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors"
                >
                  <Phone size={16} />
                  <span>Позвонить ещё раз</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    flushCompletedCallLog();
                    dialogRef.current?.close();
                    onProceedToDashboard(selectedNiche, selectedVoice);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-semibold text-xs transition-colors"
                >
                  Настроить под себя
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Phone Action Bar (Light Theme) */}
        {callState === 'connected' && (
          <div className="px-3 sm:px-5 py-3 bg-white border-t border-slate-200/80 flex flex-wrap items-center justify-center gap-2 sm:gap-4">
            <button
              type="button"
              onClick={toggleMute}
              className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isMuted
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {isMuted ? <MicOff size={17} /> : <Mic size={17} className="text-emerald-600" />}
              <span>{isMuted ? 'Вкл. микрофон' : 'Микрофон'}</span>
            </button>

            <button
              type="button"
              onClick={handleHangup}
              title="Завершить вызов"
              className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center gap-2 shadow-sm shadow-rose-600/25 transition-all active:scale-95"
            >
              <PhoneOff size={18} />
              <span>Завершить</span>
            </button>

            <button
              type="button"
              onClick={() => setShowTextInput((prev) => !prev)}
              className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                showTextInput
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <Keyboard size={17} />
              <span>Текст</span>
            </button>
          </div>
        )}
      </div>
    </dialog>
  );
};
