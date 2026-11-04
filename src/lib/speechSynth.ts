// Neural TTS & audio wave controller for Voxi.by
// Uses Yandex SpeechKit studio MP3 cache (cache-busted) + live-streamed Yandex SpeechKit API v1 (/api/tts)

import { PhoneticRule, VoiceId } from '../types';

const VOICE_CACHE_VERSION = 'yc3';

export class VoiceSimulator {
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static sharedAudio: HTMLAudioElement | null = null;
  private static currentAudio: HTMLAudioElement | null = null;
  private static currentObjectUrl: string | null = null;
  private static activeToken = 0;
  private static isSpeaking = false;
  private static waveInterval: number | null = null;
  private static manifestCache: Record<string, string> | null = null;
  private static manifestPromise: Promise<Record<string, string>> | null = null;
  private static phoneticRules: PhoneticRule[] = [];

  /**
   * Unlocks a reusable HTMLAudioElement inside a user click gesture
   * using a valid 44-byte silent PCM WAV so async TTS responses play reliably in Safari & Chrome.
   */
  public static unlock() {
    if (typeof window === 'undefined') return;
    try {
      if (!this.sharedAudio) {
        this.sharedAudio = new Audio();
      }
      if (!this.isSpeaking) {
        this.sharedAudio.src =
          'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
        this.sharedAudio.volume = 0;
        const p = this.sharedAudio.play();
        if (p) {
          p.then(() => {
            if (this.sharedAudio && !this.isSpeaking) {
              this.sharedAudio.pause();
              this.sharedAudio.volume = 1;
            }
          }).catch(() => {
            if (this.sharedAudio) this.sharedAudio.volume = 1;
          });
        }
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
      this.manifestPromise = fetch(`/voices/manifest.json?v=${VOICE_CACHE_VERSION}`)
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

  private static revokeObjectUrl() {
    if (this.currentObjectUrl) {
      URL.revokeObjectURL(this.currentObjectUrl);
      this.currentObjectUrl = null;
    }
  }

  public static speak(
    text: string,
    voiceName: VoiceId = 'anna',
    onStart?: () => void,
    onEnd?: () => void,
    onWaveformUpdate?: (waveLevels: number[]) => void
  ): Promise<void> {
    return new Promise((resolve) => {
      this.stop();
      const token = ++this.activeToken;

      const runNeuralPlayback = async () => {
        const manifest = await this.loadManifest();
        if (token !== this.activeToken) {
          resolve();
          return;
        }

        const spokenText = this.applyPhonetics(text);
        const textWithAnna = spokenText.replace(/меня зовут (Максим|Дмитрий)/gi, 'меня зовут Анна');
        const textWithMaxim = spokenText.replace(/меня зовут (Анна|Дмитрий)/gi, 'меня зовут Максим');

        const key = this.normalizeKey(voiceName, spokenText);
        const dmitryKey = this.normalizeKey('dmitry', spokenText);
        const maximKey = this.normalizeKey('maxim', spokenText);
        const annaKey = this.normalizeKey('anna', spokenText);
        const rawKey = this.normalizeKey(voiceName, text);
        const rawDmitryKey = this.normalizeKey('dmitry', text);
        const rawMaximKey = this.normalizeKey('maxim', text);

        const annaVariantKey = this.normalizeKey(voiceName, textWithAnna);
        const maximVariantKey = this.normalizeKey(voiceName, textWithMaxim);
        const dmitryAnnaVariantKey = this.normalizeKey('dmitry', textWithAnna);
        const dmitryMaximVariantKey = this.normalizeKey('dmitry', textWithMaxim);

        const cachedPath =
          manifest[key] ||
          (voiceName === 'maxim'
            ? manifest[maximKey] ||
              manifest[dmitryKey] ||
              manifest[rawMaximKey] ||
              manifest[rawDmitryKey] ||
              manifest[maximVariantKey] ||
              manifest[dmitryMaximVariantKey] ||
              manifest[dmitryAnnaVariantKey]
            : undefined) ||
          ((voiceName as string) === 'dmitry'
            ? manifest[dmitryKey] ||
              manifest[maximKey] ||
              manifest[rawDmitryKey] ||
              manifest[rawMaximKey] ||
              manifest[dmitryMaximVariantKey] ||
              manifest[maximVariantKey] ||
              manifest[dmitryAnnaVariantKey]
            : undefined) ||
          manifest[annaVariantKey] ||
          manifest[maximVariantKey] ||
          (spokenText === text ? manifest[rawKey] : undefined) ||
          (voiceName !== 'anna' ? manifest[annaKey] || manifest[this.normalizeKey('anna', textWithAnna)] : undefined);

        // Append cache-buster ?v=yc3 to static MP3s so browsers never play stale pre-SpeechKit files
        const audioUrl = cachedPath
          ? `${cachedPath}?v=${VOICE_CACHE_VERSION}`
          : `/api/tts?voice=${encodeURIComponent(voiceName)}&text=${encodeURIComponent(spokenText)}`;

        let started = false;
        const handleStart = () => {
          if (started || token !== this.activeToken) return;
          started = true;
          this.isSpeaking = true;
          onStart?.();
          this.startWaveformAnimation(onWaveformUpdate);
        };

        const handleFinish = () => {
          if (token !== this.activeToken) {
            resolve();
            return;
          }
          this.currentAudio = null;
          this.revokeObjectUrl();
          this.isSpeaking = false;
          this.stopWaveformAnimation();
          onEnd?.();
          resolve();
        };

        try {
          // If cached static MP3, load directly without full-blob fetch delay
          if (cachedPath) {
            const audio = this.sharedAudio || new Audio();
            this.sharedAudio = audio;
            audio.onplay = handleStart;
            audio.onended = handleFinish;
            audio.onerror = () => {
              if (token !== this.activeToken) return;
              this.speakBrowserFallback(text, voiceName, onStart, onEnd, onWaveformUpdate, resolve);
            };
            audio.volume = 1;
            audio.src = audioUrl;
            this.currentAudio = audio;
            handleStart();
            await audio.play();
            return;
          }

          // Dynamic synthesis with 6s timeout so neural voice streams smoothly without falling back to robotic voice
          const res = await fetch(audioUrl, {
            signal: AbortSignal.timeout(6000),
          });
          if (token !== this.activeToken) {
            resolve();
            return;
          }
          if (!res.ok) {
            throw new Error(`TTS HTTP ${res.status}`);
          }
          const blob = await res.blob();
          if (token !== this.activeToken) {
            resolve();
            return;
          }

          this.revokeObjectUrl();
          const objectUrl = URL.createObjectURL(blob);
          this.currentObjectUrl = objectUrl;

          const audio = this.sharedAudio || new Audio();
          this.sharedAudio = audio;
          audio.onplay = handleStart;
          audio.onended = handleFinish;
          audio.onerror = handleFinish;
          audio.volume = 1;
          audio.src = objectUrl;
          this.currentAudio = audio;

          handleStart();
          await audio.play();
        } catch {
          if (token !== this.activeToken) {
            resolve();
            return;
          }
          this.currentAudio = null;
          this.revokeObjectUrl();
          this.speakBrowserFallback(text, voiceName, onStart, onEnd, onWaveformUpdate, resolve);
        }
      };

      runNeuralPlayback();
    });
  }

  public static stop() {
    this.activeToken += 1;
    if (this.currentAudio) {
      try {
        this.currentAudio.onplay = null;
        this.currentAudio.onended = null;
        this.currentAudio.onerror = null;
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch {
        // ignore
      }
      this.currentAudio = null;
    }
    this.revokeObjectUrl();
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
    voiceName: VoiceId,
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
    if (voiceName === 'maxim') {
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

    const token = this.activeToken;
    let finished = false;
    const finishOnce = () => {
      if (finished || token !== this.activeToken) return;
      finished = true;
      this.isSpeaking = false;
      this.stopWaveformAnimation();
      onEnd?.();
      resolve?.();
    };

    utterance.onstart = () => {
      this.isSpeaking = true;
      onStart?.();
      this.startWaveformAnimation(onWaveformUpdate);
    };
    utterance.onend = finishOnce;
    utterance.onerror = finishOnce;

    // Watchdog in case browser speechSynthesis stalls
    window.setTimeout(finishOnce, Math.min(Math.max(text.length * 90, 3500), 12000));

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
