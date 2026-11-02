// Neural TTS & audio wave controller for Voxi.by
// Uses pre-generated studio MP3 cache + live-streamed Yandex SpeechKit API v1 (/api/tts)

import { PhoneticRule } from '../types';

export class VoiceSimulator {
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static sharedAudio: HTMLAudioElement | null = null;
  private static currentAudio: HTMLAudioElement | null = null;
  private static isSpeaking = false;
  private static waveInterval: number | null = null;
  private static manifestCache: Record<string, string> | null = null;
  private static manifestPromise: Promise<Record<string, string>> | null = null;
  private static phoneticRules: PhoneticRule[] = [];

  /**
   * Unlocks a reusable HTMLAudioElement inside a user click gesture
   * so async TTS responses after /api/chat play reliably in Safari & Chrome.
   */
  public static unlock() {
    if (typeof window === 'undefined') return;
    try {
      if (!this.sharedAudio) {
        this.sharedAudio = new Audio();
      }
      // Minimal 1-sample silent WAV to bless element under user activation
      this.sharedAudio.src =
        'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
      this.sharedAudio.volume = 0;
      const p = this.sharedAudio.play();
      if (p) {
        p.then(() => {
          if (this.sharedAudio && this.currentAudio !== this.sharedAudio) {
            this.sharedAudio.pause();
            this.sharedAudio.volume = 1;
          }
        }).catch(() => {
          if (this.sharedAudio) this.sharedAudio.volume = 1;
        });
      }
    } catch {
      // ignore
    }
  }

  public static setPhoneticRules(rules: PhoneticRule[]) {
    this.phoneticRules = rules || [];
  }

  public static applyPhonetics(text: string, rules: PhoneticRule[] = this.phoneticRules): string {
    if (!rules || rules.length === 0) return text;
    let output = text;
    for (const rule of rules) {
      if (!rule.enabled || !rule.word.trim() || !rule.ttsReplacement.trim()) continue;
      if (rule.word.trim() === rule.ttsReplacement.trim()) continue;
      const escaped = rule.word.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'gi');
      output = output.replace(regex, rule.ttsReplacement.trim());
    }
    return output;
  }

  private static normalizeKey(voice: string, text: string): string {
    const norm = text
      .trim()
      .replace(/["«»]/g, '')
      .replace(/\s+/g, ' ');
    return `${voice.toLowerCase()}:${norm}`;
  }

  private static async loadManifest(): Promise<Record<string, string>> {
    if (this.manifestCache) return this.manifestCache;
    if (!this.manifestPromise) {
      this.manifestPromise = fetch('/voices/manifest.json')
        .then((res) => (res.ok ? res.json() : {}))
        .catch(() => ({}))
        .then((data) => {
          this.manifestCache = data || {};
          return this.manifestCache!;
        });
    }
    return this.manifestPromise;
  }

  public static getVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices().filter((v) => v.lang.startsWith('ru') || v.lang.startsWith('be'));
  }

  public static speak(
    text: string,
    voiceName: 'anna' | 'dmitry' | 'polina' | 'maxim' = 'anna',
    onStart?: () => void,
    onEnd?: () => void,
    onWaveformUpdate?: (waveLevels: number[]) => void
  ): Promise<void> {
    return new Promise((resolve) => {
      this.stop();

      const runNeuralPlayback = async () => {
        const manifest = await this.loadManifest();
        const spokenText = this.applyPhonetics(text);
        const key = this.normalizeKey(voiceName, spokenText);
        const fallbackKey = this.normalizeKey(voiceName === 'maxim' ? 'dmitry' : voiceName === 'polina' ? 'anna' : voiceName, spokenText);
        const rawKey = this.normalizeKey(voiceName, text);

        // 1. Check pre-cached studio neural MP3 first for instant playback, otherwise use live /api/tts neural stream
        const audioUrl =
          manifest[key] ||
          manifest[fallbackKey] ||
          (spokenText === text ? manifest[rawKey] : undefined) ||
          `/api/tts?voice=${encodeURIComponent(voiceName)}&text=${encodeURIComponent(spokenText)}`;

        const audio = this.sharedAudio || new Audio();
        this.sharedAudio = audio;
        audio.onplay = null;
        audio.onended = null;
        audio.onerror = null;
        audio.volume = 1;
        audio.preload = 'auto';
        audio.src = audioUrl;
        this.currentAudio = audio;

        let started = false;
        const handleStart = () => {
          if (started) return;
          started = true;
          this.isSpeaking = true;
          onStart?.();
          this.startWaveformAnimation(onWaveformUpdate);
        };

        const handleFinish = () => {
          if (this.currentAudio === audio) {
            this.currentAudio = null;
          }
          this.isSpeaking = false;
          this.stopWaveformAnimation();
          onEnd?.();
          resolve();
        };

        audio.onplay = handleStart;
        audio.onended = handleFinish;
        audio.onerror = () => {
          if (this.currentAudio === audio) {
            this.currentAudio = null;
          }
          // Fallback to browser synthesis only if network/file fails
          this.speakBrowserFallback(text, voiceName, onStart, onEnd, onWaveformUpdate, resolve);
        };

        try {
          handleStart();
          await audio.play();
        } catch {
          if (this.currentAudio === audio) {
            this.currentAudio = null;
          }
          this.speakBrowserFallback(text, voiceName, onStart, onEnd, onWaveformUpdate, resolve);
        }
      };

      runNeuralPlayback();
    });
  }

  public static stop() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio.onended = null;
        this.currentAudio.onerror = null;
      } catch {
        // ignore
      }
      this.currentAudio = null;
    }
    if (this.synth) {
      this.synth.cancel();
    }
    this.isSpeaking = false;
    this.stopWaveformAnimation();
  }

  public static getSpeakingStatus(): boolean {
    return this.isSpeaking;
  }

  private static startWaveformAnimation(onWaveformUpdate?: (waveLevels: number[]) => void) {
    if (!onWaveformUpdate) return;
    this.stopWaveformAnimation();

    let tick = 0;
    this.waveInterval = window.setInterval(() => {
      tick += 0.35;
      // Natural human speech envelope (smoothly modulated sine + subtle organic jitter)
      const levels = Array.from({ length: 16 }, (_, i) => {
        const wave = Math.sin(tick + i * 0.55) * 0.5 + 0.5;
        const envelope = Math.sin(tick * 0.45) * 0.3 + 0.7;
        const jitter = (Math.random() - 0.5) * 18;
        return Math.max(14, Math.min(98, Math.round(20 + wave * envelope * 68 + jitter)));
      });
      onWaveformUpdate(levels);
    }, 65);
  }

  private static stopWaveformAnimation() {
    if (this.waveInterval) {
      clearInterval(this.waveInterval);
      this.waveInterval = null;
    }
  }

  private static speakBrowserFallback(
    text: string,
    voiceName: 'anna' | 'dmitry' | 'polina' | 'maxim',
    onStart?: () => void,
    onEnd?: () => void,
    onWaveformUpdate?: (waveLevels: number[]) => void,
    resolve?: () => void
  ) {
    if (!this.synth) {
      this.simulateAudio(text, onStart, onEnd, onWaveformUpdate, resolve);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    const ruVoices = this.getVoices();
    if (voiceName === 'dmitry' || voiceName === 'maxim') {
      const male = ruVoices.find(
        (v) =>
          v.name.toLowerCase().includes('yuri') ||
          v.name.toLowerCase().includes('male') ||
          v.name.toLowerCase().includes('dmitry')
      );
      if (male) utterance.voice = male;
      utterance.pitch = 0.95;
      utterance.rate = 1.0;
    } else {
      const female = ruVoices.find(
        (v) =>
          v.name.toLowerCase().includes('milena') ||
          v.name.toLowerCase().includes('female') ||
          v.name.toLowerCase().includes('anna')
      );
      if (female) utterance.voice = female;
      utterance.pitch = 1.0;
      utterance.rate = 1.0;
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      onStart?.();
      this.startWaveformAnimation(onWaveformUpdate);
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.stopWaveformAnimation();
      onEnd?.();
      resolve?.();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      this.stopWaveformAnimation();
      onEnd?.();
      resolve?.();
    };

    this.synth.speak(utterance);
  }

  private static simulateAudio(
    text: string,
    onStart?: () => void,
    onEnd?: () => void,
    onWaveformUpdate?: (waveLevels: number[]) => void,
    onFinish?: () => void
  ) {
    onStart?.();
    this.startWaveformAnimation(onWaveformUpdate);
    const duration = Math.min(Math.max(text.length * 55, 2000), 7000);
    setTimeout(() => {
      this.stopWaveformAnimation();
      onEnd?.();
      onFinish?.();
    }, duration);
  }
}
