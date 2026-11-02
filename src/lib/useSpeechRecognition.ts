import { useState, useEffect, useRef, useCallback } from 'react';

interface UseSpeechRecognitionOptions {
  onFinalTranscript?: (text: string) => void;
  lang?: string;
  silenceDelayMs?: number;
}

export function useSpeechRecognition({
  onFinalTranscript,
  lang = 'ru-RU',
  silenceDelayMs = 1800
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
  const accumulatedSpeechRef = useRef('');

  const onFinalTranscriptRef = useRef(onFinalTranscript);
  useEffect(() => {
    onFinalTranscriptRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      setIsSupported(!!SpeechRecognition);
    }
  }, []);

  const stopAudioLevelMeter = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
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
      if (!navigator.mediaDevices?.getUserMedia) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
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
        setAudioLevel(level > 6 ? level : 0);

        animFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch {
      // Audio level is optional visual aid
    }
  }, []);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const submitNow = useCallback(() => {
    clearSilenceTimer();
    const clean = accumulatedSpeechRef.current.trim();
    if (!clean || clean.length < 2 || isBotSpeakingRef.current || isMutedRef.current) {
      setTranscript('');
      setInterimTranscript('');
      accumulatedSpeechRef.current = '';
      return;
    }

    setTranscript('');
    setInterimTranscript('');
    accumulatedSpeechRef.current = '';

    onFinalTranscriptRef.current?.(clean);
  }, [clearSilenceTimer]);

  const scheduleSilenceSubmit = useCallback((delay = silenceDelayMs) => {
    clearSilenceTimer();
    silenceTimerRef.current = window.setTimeout(() => {
      if (accumulatedSpeechRef.current.trim() && !isBotSpeakingRef.current && isCallActiveRef.current) {
        submitNow();
      }
    }, delay);
  }, [clearSilenceTimer, silenceDelayMs, submitNow]);

  const initRecognition = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      // Ignore all audio while bot is speaking or mic is muted
      if (isBotSpeakingRef.current || isMutedRef.current || !isCallActiveRef.current) {
        return;
      }

      let currentInterim = '';
      let currentFinal = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        const text = item[0]?.transcript || '';
        if (item.isFinal) {
          currentFinal += ' ' + text;
        } else {
          currentInterim += ' ' + text;
        }
      }

      if (currentFinal.trim()) {
        accumulatedSpeechRef.current = (accumulatedSpeechRef.current + ' ' + currentFinal).trim();
      }

      const displayFull = (accumulatedSpeechRef.current + ' ' + currentInterim).trim();
      if (displayFull) {
        setTranscript(accumulatedSpeechRef.current);
        setInterimTranscript(displayFull);

        // Schedule submit on silence
        scheduleSilenceSubmit();
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') return;
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setError('Доступ к микрофону заблокирован. Разрешите микрофон в браузере.');
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      // Keep recognition alive while call is active
      if (isCallActiveRef.current && !isMutedRef.current) {
        try {
          recognition.start();
        } catch {
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    return recognition;
  }, [lang, scheduleSilenceSubmit]);

  const startListening = useCallback(() => {
    setError(null);
    isCallActiveRef.current = true;
    isMutedRef.current = false;
    accumulatedSpeechRef.current = '';
    setTranscript('');
    setInterimTranscript('');

    try {
      if (!recognitionRef.current) {
        recognitionRef.current = initRecognition();
      }
      if (!recognitionRef.current) {
        setError('Голосовой ввод с микрофона не поддерживается в этом браузере. Используйте Chrome / Safari либо быстрые текстовые реплики ниже.');
        setIsListening(false);
        return;
      }
      try {
        recognitionRef.current.start();
      } catch {}
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

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    stopAudioLevelMeter();
    setIsListening(false);
    setTranscript('');
    setInterimTranscript('');
    accumulatedSpeechRef.current = '';
  }, [clearSilenceTimer, stopAudioLevelMeter]);

  // Soft ignore when bot is speaking — leaves audio engine running without aborting!
  const setBotSpeaking = useCallback((speaking: boolean) => {
    if (speaking) {
      isBotSpeakingRef.current = true;
      clearSilenceTimer();
      setTranscript('');
      setInterimTranscript('');
      accumulatedSpeechRef.current = '';
      setAudioLevel(0);
    } else {
      // 500ms delay to let room echo decay before opening the gates to mic input
      setTimeout(() => {
        if (!isCallActiveRef.current) return;
        isBotSpeakingRef.current = false;
      }, 500);
    }
  }, [clearSilenceTimer]);

  const setMuted = useCallback((muted: boolean) => {
    isMutedRef.current = muted;
    if (muted) {
      clearSilenceTimer();
      setTranscript('');
      setInterimTranscript('');
      accumulatedSpeechRef.current = '';
      setAudioLevel(0);
    }
  }, [clearSilenceTimer]);

  useEffect(() => {
    return () => {
      isCallActiveRef.current = false;
      clearSilenceTimer();
      stopAudioLevelMeter();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, [clearSilenceTimer, stopAudioLevelMeter]);

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
    submitNow
  };
}
