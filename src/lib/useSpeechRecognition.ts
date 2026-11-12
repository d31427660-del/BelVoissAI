import { useState, useEffect, useRef, useCallback } from 'react';

interface UseSpeechRecognitionOptions {
  onFinalTranscript?: (text: string) => void;
  lang?: string;
  silenceDelayMs?: number;
}

const INCOMPLETE_TRAILING_WORDS = new Set([
  'и', 'а', 'но', 'или', 'либо', 'да', 'ни', 'что', 'чтобы', 'чтоб',
  'потому', 'поскольку', 'так', 'как', 'если', 'когда', 'пока', 'хотя',
  'где', 'куда', 'откуда', 'какой', 'какая', 'какие', 'какое', 'каким', 'каких', 'какую',
  'чей', 'чья', 'чьи', 'сколько', 'насколько', 'почему', 'зачем',
  'в', 'во', 'на', 'с', 'со', 'по', 'за', 'к', 'ко', 'у', 'о', 'об', 'про',
  'для', 'без', 'до', 'от', 'из', 'под', 'над', 'при', 'через', 'между',
  'здравствуйте', 'привет', 'алло', 'ало', 'слушайте', 'добрый', 'доброе', 'день', 'вечер', 'утро',
  'подскажите', 'скажите', 'расскажите', 'пожалуйста', 'будьте', 'добры',
  'хотел', 'хотела', 'хотели', 'хочу', 'могу', 'можно', 'нужно', 'надо', 'бы', 'ли',
  'интересует', 'интересуют', 'вопрос', 'узнать', 'уточнить', 'спросить', 'записаться', 'записать',
  'еще', 'ещё', 'также', 'плюс', 'то', 'вот', 'ну', 'значит', 'короче', 'например'
]);

export function useSpeechRecognition({
  onFinalTranscript,
  lang = 'ru-RU',
  silenceDelayMs = 2200,
}: UseSpeechRecognitionOptions = {}) {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const isCallActiveRef = useRef(false);
  const isBotSpeakingRef = useRef(false);
  const isMutedRef = useRef(false);
  const silenceTimerRef = useRef<number | null>(null);
  const botCooldownTimerRef = useRef<number | null>(null);
  const safariLevelDecayTimerRef = useRef<number | null>(null);
  const lastVoiceActivityAtRef = useRef<number>(0);

  // Speech utterance tracking across both interim and final browser results
  const consumedIndexRef = useRef(0);
  const lastResultsLenRef = useRef(0);
  const carryOverRef = useRef('');
  const utteranceRef = useRef('');
  const prevUtteranceRef = useRef('');

  const onFinalTranscriptRef = useRef(onFinalTranscript);
  useEffect(() => {
    onFinalTranscriptRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setIsSupported(!!SpeechRecognition);
    }
  }, []);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const clearBotCooldownTimer = useCallback(() => {
    if (botCooldownTimerRef.current) {
      window.clearTimeout(botCooldownTimerRef.current);
      botCooldownTimerRef.current = null;
    }
  }, []);

  const stopAudioLevelMeter = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (safariLevelDecayTimerRef.current) {
      window.clearTimeout(safariLevelDecayTimerRef.current);
      safariLevelDecayTimerRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  const startAudioLevelMeter = useCallback(async () => {
    try {
      if (typeof navigator === 'undefined') return;
      // On Safari (macOS/iOS), opening a second getUserMedia audio stream competes
      // with webkitSpeechRecognition for microphone focus — skip getUserMedia on Safari
      // and drive audioLevel from speech recognition events instead.
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      if (isSafari || !navigator.mediaDevices?.getUserMedia) return;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      if (!isCallActiveRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      micStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateMeter = () => {
        if (!analyserRef.current || isBotSpeakingRef.current || isMutedRef.current || !isCallActiveRef.current) {
          setAudioLevel(0);
          animFrameRef.current = requestAnimationFrame(updateMeter);
          return;
        }

        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const level = Math.min(100, Math.round((avg / 128) * 100));
        if (level > 14) {
          lastVoiceActivityAtRef.current = performance.now();
        }
        setAudioLevel(level > 6 ? level : 0);

        animFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch {
      // Audio level meter is optional visual feedback
    }
  }, []);

  const pulseVoiceActivity = useCallback(() => {
    lastVoiceActivityAtRef.current = performance.now();
    if (micStreamRef.current) return; // Already driven by AnalyserNode
    setAudioLevel(45 + Math.round(Math.random() * 35));
    if (safariLevelDecayTimerRef.current) {
      window.clearTimeout(safariLevelDecayTimerRef.current);
    }
    safariLevelDecayTimerRef.current = window.setTimeout(() => {
      setAudioLevel(0);
    }, 380);
  }, []);

  const submitNow = useCallback(() => {
    clearSilenceTimer();
    const clean = utteranceRef.current.trim();

    consumedIndexRef.current = lastResultsLenRef.current;
    carryOverRef.current = '';
    utteranceRef.current = '';
    prevUtteranceRef.current = '';
    setTranscript('');
    setInterimTranscript('');

    if (!clean || clean.length < 2 || isBotSpeakingRef.current || isMutedRef.current || !isCallActiveRef.current) {
      return;
    }

    // Reset current recognition buffer cleanly so old interim segments never repeat on next turn
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
    }

    onFinalTranscriptRef.current?.(clean);
  }, [clearSilenceTimer]);

  const scheduleSilenceSubmit = useCallback(
    (delayMs: number) => {
      clearSilenceTimer();
      silenceTimerRef.current = window.setTimeout(() => {
        if (!utteranceRef.current.trim() || isBotSpeakingRef.current || isMutedRef.current || !isCallActiveRef.current) {
          return;
        }
        // If microphone still detects active human speech (or speech ended <1300ms ago while STT buffers),
        // extend the silence window so long phrases are never cut off mid-sentence.
        const msSinceVoice = performance.now() - lastVoiceActivityAtRef.current;
        if (msSinceVoice < 1300) {
          scheduleSilenceSubmit(Math.max(900, 1400 - msSinceVoice));
          return;
        }
        submitNow();
      }, delayMs);
    },
    [clearSilenceTimer, submitNow]
  );

  const initRecognition = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      consumedIndexRef.current = 0;
      lastResultsLenRef.current = 0;
      setIsListening(true);
      setError(null);
    };

    recognition.onspeechstart = () => {
      if (!isBotSpeakingRef.current && !isMutedRef.current && isCallActiveRef.current) {
        pulseVoiceActivity();
        if (utteranceRef.current.trim()) {
          scheduleSilenceSubmit(Math.max(silenceDelayMs, 2400));
        }
      }
    };

    recognition.onresult = (event: any) => {
      lastResultsLenRef.current = event.results.length;

      // Ignore any sound picked up while bot is speaking or mic is muted
      if (isBotSpeakingRef.current || isMutedRef.current || !isCallActiveRef.current) {
        consumedIndexRef.current = event.results.length;
        return;
      }

      pulseVoiceActivity();

      let sessionParts = '';
      let latestSegmentIsFinal = false;

      for (let i = consumedIndexRef.current; i < event.results.length; i++) {
        const item = event.results[i];
        const seg = item?.[0]?.transcript || '';
        if (seg.trim()) {
          sessionParts += ' ' + seg;
          latestSegmentIsFinal = Boolean(item?.isFinal);
        }
      }

      const fullText = `${carryOverRef.current} ${sessionParts}`.replace(/\s+/g, ' ').trim();
      if (!fullText) return;

      prevUtteranceRef.current = fullText;
      utteranceRef.current = fullText;
      setTranscript(fullText);
      setInterimTranscript(fullText);

      // Adaptive turn-taking silence for long & multi-clause phrases:
      // 1. If the browser STT segment is still interim (!latestSegmentIsFinal), the user is actively speaking:
      //    wait at least 3200ms so ongoing speech is never interrupted.
      // 2. If the phrase so far is short (<= 3 words) or ends with a conjunction, preposition, intro word, or comma,
      //    the user is pausing for breath mid-thought: wait at least 2800ms.
      // 3. Once a complete segment is marked final, wait at least 2200ms (or silenceDelayMs) of genuine silence.
      const words = fullText.split(/\s+/).filter(Boolean);
      const lastWordClean = (words[words.length - 1] || '')
        .toLowerCase()
        .replace(/[^а-яёa-z0-9]/gi, '');
      const endsWithCommaOrDash = /[,:\-—]$/.test(fullText.trim());
      const isIncompleteThought =
        words.length <= 3 ||
        endsWithCommaOrDash ||
        INCOMPLETE_TRAILING_WORDS.has(lastWordClean);

      const baseDelay = Math.max(silenceDelayMs, 2200);
      const targetDelay = !latestSegmentIsFinal
        ? Math.max(baseDelay + 1000, 3200)
        : isIncompleteThought
        ? Math.max(baseDelay + 600, 2800)
        : baseDelay;

      scheduleSilenceSubmit(targetDelay);
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setError('Доступ к микрофону заблокирован. Разрешите микрофон в адресной строке браузера.');
        setIsListening(false);
        return;
      }
      if (event.error === 'audio-capture') {
        setError('Микрофон не найден или занят другим приложением.');
        setIsListening(false);
        return;
      }
      if (event.error === 'network') {
        setError(
          'Ваш браузер блокирует встроенное распознавание речи (часто в Brave / Arc / Firefox). Откройте сайт в Chrome или Safari либо нажмите «Текст» для ввода с клавиатуры.'
        );
      }
    };

    recognition.onend = () => {
      // Preserve any unspoken utterance across automatic browser session restarts
      if (utteranceRef.current.trim() && !isBotSpeakingRef.current && isCallActiveRef.current) {
        carryOverRef.current = utteranceRef.current.trim();
        // Give the user extra time across browser session reconnects so multi-sentence speech isn't cut off
        scheduleSilenceSubmit(Math.max(silenceDelayMs, 2400));
      }
      consumedIndexRef.current = 0;
      lastResultsLenRef.current = 0;

      // DO NOT restart microphone if the bot is currently speaking or thinking (prevents acoustic room echo)
      if (isCallActiveRef.current && !isMutedRef.current && !isBotSpeakingRef.current) {
        try {
          recognition.start();
        } catch {
          window.setTimeout(() => {
            if (
              isCallActiveRef.current &&
              !isMutedRef.current &&
              !isBotSpeakingRef.current &&
              recognitionRef.current === recognition
            ) {
              try {
                recognition.start();
              } catch {
                setIsListening(false);
              }
            }
          }, 120);
        }
      } else {
        setIsListening(false);
      }
    };

    return recognition;
  }, [lang, pulseVoiceActivity, scheduleSilenceSubmit, silenceDelayMs]);

  const startListening = useCallback(() => {
    setError(null);
    isCallActiveRef.current = true;
    isMutedRef.current = false;
    consumedIndexRef.current = 0;
    lastResultsLenRef.current = 0;
    carryOverRef.current = '';
    utteranceRef.current = '';
    prevUtteranceRef.current = '';
    setTranscript('');
    setInterimTranscript('');

    try {
      if (!recognitionRef.current) {
        recognitionRef.current = initRecognition();
      }
      if (!recognitionRef.current) {
        setError(
          'Голосовой ввод с микрофона не поддерживается в этом браузере. Используйте Chrome / Safari либо текстовый ввод ниже.'
        );
        setIsListening(false);
        return;
      }
      try {
        recognitionRef.current.start();
      } catch {
        // Already started
      }
      setIsListening(true);
      startAudioLevelMeter();
    } catch (err: any) {
      setError(err?.message || 'Не удалось запустить микрофон');
    }
  }, [initRecognition, startAudioLevelMeter]);

  const stopListening = useCallback(() => {
    isCallActiveRef.current = false;
    isBotSpeakingRef.current = false;
    isMutedRef.current = false;
    clearSilenceTimer();
    clearBotCooldownTimer();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    stopAudioLevelMeter();
    setIsListening(false);
    setTranscript('');
    setInterimTranscript('');
    carryOverRef.current = '';
    utteranceRef.current = '';
    prevUtteranceRef.current = '';
  }, [clearBotCooldownTimer, clearSilenceTimer, stopAudioLevelMeter]);

  // Soft ignore while bot is thinking/speaking so room echo isn't captured
  const setBotSpeaking = useCallback(
    (speaking: boolean) => {
      clearBotCooldownTimer();
      if (speaking) {
        isBotSpeakingRef.current = true;
        clearSilenceTimer();
        consumedIndexRef.current = lastResultsLenRef.current;
        carryOverRef.current = '';
        utteranceRef.current = '';
        prevUtteranceRef.current = '';
        setTranscript('');
        setInterimTranscript('');
        setAudioLevel(0);
      } else {
        // Short 350ms room-echo decay before opening mic input
        botCooldownTimerRef.current = window.setTimeout(() => {
          if (!isCallActiveRef.current) return;
          isBotSpeakingRef.current = false;
          consumedIndexRef.current = lastResultsLenRef.current;
          if (!isMutedRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch {
              // Already running
            }
          }
        }, 350);
      }
    },
    [clearBotCooldownTimer, clearSilenceTimer]
  );

  const setMuted = useCallback(
    (muted: boolean) => {
      isMutedRef.current = muted;
      if (muted) {
        clearSilenceTimer();
        carryOverRef.current = '';
        utteranceRef.current = '';
        prevUtteranceRef.current = '';
        setTranscript('');
        setInterimTranscript('');
        setAudioLevel(0);
      } else if (isCallActiveRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {
          // Already running
        }
      }
    },
    [clearSilenceTimer]
  );

  useEffect(() => {
    return () => {
      isCallActiveRef.current = false;
      clearSilenceTimer();
      clearBotCooldownTimer();
      stopAudioLevelMeter();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, [clearBotCooldownTimer, clearSilenceTimer, stopAudioLevelMeter]);

  return {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    audioLevel,
    error,
    startListening,
    stopListening,
    setBotSpeaking,
    setMuted,
    submitNow,
  };
}
