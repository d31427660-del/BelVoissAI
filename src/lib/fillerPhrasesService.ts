/**
 * Conversational Filler Phrases & Ambient Audio Cues
 * Masks LLM / Network latency (> 800-1000ms) with natural conversational fillers:
 * - Pricing / services: "Так, сейчас гляну в прайс-листе..."
 * - Scheduling / booking: "Секундочку, сверяюсь с расписанием..."
 * - Address / locations: "Минутку, смотрю точный адрес филиала..."
 * - General queries: "Секунду, уточняю информацию..."
 */

import { VoiceId } from '../types';

export type FillerIntent = 'pricing' | 'schedule' | 'location' | 'general' | 'warm_transfer';

export interface FillerPhraseConfig {
  intent: FillerIntent;
  phrases: {
    anna: string[];
    maxim: string[];
  };
}

export const FILLER_PHRASE_CATALOG: Record<FillerIntent, { anna: string[]; maxim: string[] }> = {
  pricing: {
    anna: [
      'Так, секундочку, сверяюсь с актуальным прайс-листом...',
      'Минутку, сейчас точно посмотрю стоимость...',
      'Секунду, открываю тарифы и действующие акции...',
    ],
    maxim: [
      'Так, секунду, сверяюсь с прайсом...',
      'Минутку, сейчас уточню точную стоимость...',
      'Один момент, открываю прейскурант...',
    ],
  },
  schedule: {
    anna: [
      'Секундочку, сверяюсь с расписанием свободных окон...',
      'Минутку, смотрю доступное время в журнале записи...',
      'Так, один момент, проверяю график мастеров...',
    ],
    maxim: [
      'Секунду, сверяюсь с графиком свободных окон...',
      'Минутку, открываю календарь записей...',
      'Один момент, смотрю доступные слоты на эту дату...',
    ],
  },
  location: {
    anna: [
      'Минутку, смотрю точный адрес и ориентиры филиала...',
      'Секундочку, уточняю ближайшую станцию метро и парковку...',
    ],
    maxim: [
      'Один момент, смотрю схему проезда и точный адрес...',
      'Минутку, уточняю ориентиры филиала...',
    ],
  },
  warm_transfer: {
    anna: [
      'Минутку, уже соединяю вас со старшим специалистом, оставайтесь на линии...',
      'Секундочку, переключаю на старшего администратора...',
    ],
    maxim: [
      'Один момент, перевожу вас на старшего сотрудника, не вешайте трубку...',
      'Минутку, соединяю со специалистом...',
    ],
  },
  general: {
    anna: [
      'Так, секундочку, уточняю детали...',
      'Минутку, сейчас подскажу...',
      'Секунду, проверяю информацию...',
    ],
    maxim: [
      'Один момент, уточняю детали...',
      'Минутку, сейчас посмотрю...',
      'Секунду, проверяю...',
    ],
  },
};

/**
 * Detect the intent of caller's question to choose the most fitting filler phrase.
 */
export function detectFillerIntent(query: string): FillerIntent {
  const q = query.toLowerCase();

  if (/переведи|человек|оператор|администратор|начальник|директор|живой|жалоба|претензи/i.test(q)) {
    return 'warm_transfer';
  }
  if (/скольк|стоим|цена|прайс|тариф|стоит|оплат|рассрочк|скидк|дешев|рубл|копе/i.test(q)) {
    return 'pricing';
  }
  if (/запис|свободн|окн|слот|врем|когда|сегодня|завтра|пятниц|суббот|воскрес|утр|вечер|18:30|19:00|часов|расписан/i.test(q)) {
    return 'schedule';
  }
  if (/где|адрес|город|улиц|метро|доеха|филиал|кабинет|располож/i.test(q)) {
    return 'location';
  }

  return 'general';
}

/**
 * Get random filler phrase tailored to voice and caller query.
 */
export function getFillerPhrase(query: string, voice: VoiceId = 'anna'): string {
  const intent = detectFillerIntent(query);
  const voiceKey = voice === 'maxim' ? 'maxim' : 'anna';
  const phrases = FILLER_PHRASE_CATALOG[intent][voiceKey];
  const randomIndex = Math.floor(Math.random() * phrases.length);
  return phrases[randomIndex];
}

/**
 * Ambient Subtle Audio Generator using Web Audio API
 * Generates faint keyboard typing sounds or soft office presence
 */
let ambientAudioCtx: AudioContext | null = null;

export function playSoftKeyboardCue(): void {
  try {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    if (!ambientAudioCtx || ambientAudioCtx.state === 'closed') {
      ambientAudioCtx = new AudioCtx();
    }
    if (ambientAudioCtx.state === 'suspended') {
      ambientAudioCtx.resume().catch(() => {});
    }

    const now = ambientAudioCtx.currentTime;
    
    // Simulate 2-3 soft discrete key clicks
    for (let i = 0; i < 3; i++) {
      const clickTime = now + i * 0.12 + Math.random() * 0.04;
      const osc = ambientAudioCtx.createOscillator();
      const gain = ambientAudioCtx.createGain();
      const filter = ambientAudioCtx.createBiquadFilter();

      // Bandpass around 1200-2400 Hz for subtle plastic key tap
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1600 + Math.random() * 600, clickTime);
      filter.Q.setValueAtTime(3.0, clickTime);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140 + Math.random() * 80, clickTime);

      // Very soft gain (-32dB to -36dB)
      gain.gain.setValueAtTime(0.0001, clickTime);
      gain.gain.exponentialRampToValueAtTime(0.015, clickTime + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, clickTime + 0.035);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ambientAudioCtx.destination);

      osc.start(clickTime);
      osc.stop(clickTime + 0.04);
    }
  } catch {
    // Audio context may be restricted by autoplay policy
  }
}
