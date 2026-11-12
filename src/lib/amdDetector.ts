/**
 * Answering Machine Detection (AMD) for Belarusian Telephony Providers:
 * - МТС Беларусь (+375 29 2xx/5xx/7xx/8xx, +375 33)
 * - А1 Беларусь (+375 29 1xx/3xx/6xx/9xx, +375 44)
 * - life:) Беларусь (+375 25)
 * - Белтелеком (городские номера)
 */

export interface AmdDetectionResult {
  isVoicemail: boolean;
  carrierName?: 'МТС РБ' | 'А1 РБ' | 'life:) РБ' | 'Белтелеком' | 'Общий автоответчик';
  matchedPhrase?: string;
  recommendedAction: 'hangup_immediately' | 'continue_call';
  confidence: number;
}

export const BELARUS_CARRIER_VOICEMAIL_PATTERNS: Array<{
  carrier: 'МТС РБ' | 'А1 РБ' | 'life:) РБ' | 'Белтелеком' | 'Общий автоответчик';
  patterns: RegExp[];
}> = [
  {
    carrier: 'МТС РБ',
    patterns: [
      /абонент временно недоступен/i,
      /абонент часова недаступны/i,
      /голосовая почта мтс/i,
      /голосавая пошта мтс/i,
      /переадресация на голосовой почтовый ящик/i,
      /абонент находится вне зоны действия сети мтс/i,
      /абонент не может ответить на ваш звонок/i,
    ],
  },
  {
    carrier: 'А1 РБ',
    patterns: [
      /вызываемый абонент отключен/i,
      /вызываемый абонент отключён/i,
      /знаходицца па-за зонай дзеяння сеткі а1/i,
      /па-за зонай дзеяння/i,
      /находится вне зоны действия сети а1/i,
      /оставьте сообщение после звукового сигнала/i,
      /пакіньце паведамленне пасля гукавога сігналу/i,
      /вызываемый телефонный аппарат выключен/i,
    ],
  },
  {
    carrier: 'life:) РБ',
    patterns: [
      /абанент не адказвае/i,
      /абанент зараз размаўляе/i,
      /голосовой ящик лайф/i,
      /абонент life временно недоступен/i,
      /линия перегружена/i,
    ],
  },
  {
    carrier: 'Белтелеком',
    patterns: [
      /набранный вами номер не существует/i,
      /набраны вамі нумар не існуе/i,
      /изменился порядок набора номера/i,
      /абонент временно заблокирован/i,
      /линия повреждена/i,
    ],
  },
  {
    carrier: 'Общий автоответчик',
    patterns: [
      /после гудка/i,
      /после сигнала/i,
      /почтовый ящик переполнен/i,
      /автоответчик/i,
      /запись сообщения/i,
      /press 1 to leave a message/i,
      /the subscriber is temporarily unavailable/i,
    ],
  },
];

/**
 * Analyzes audio transcript or telephony speech-to-text chunk to detect carrier voicemails.
 */
export function detectCarrierVoicemail(text: string): AmdDetectionResult {
  const clean = text.toLowerCase().trim();
  if (!clean || clean.length < 5) {
    return {
      isVoicemail: false,
      recommendedAction: 'continue_call',
      confidence: 0,
    };
  }

  for (const group of BELARUS_CARRIER_VOICEMAIL_PATTERNS) {
    for (const pattern of group.patterns) {
      if (pattern.test(clean)) {
        return {
          isVoicemail: true,
          carrierName: group.carrier,
          matchedPhrase: clean.slice(0, 80),
          recommendedAction: 'hangup_immediately',
          confidence: 0.98,
        };
      }
    }
  }

  return {
    isVoicemail: false,
    recommendedAction: 'continue_call',
    confidence: 0,
  };
}

/**
 * Quick check if incoming transcript indicates a human wants to transfer
 * or has a complaint / dispute.
 */
export function detectWarmTransferRequest(
  text: string,
  triggers: ('human_request' | 'conflict' | 'complex_query')[] = ['human_request', 'conflict', 'complex_query']
): {
  isTransferRequested: boolean;
  reason?: 'human_request' | 'conflict' | 'complex_query';
  triggerPhrase?: string;
} {
  const clean = text.toLowerCase().trim();

  // 1. Human request
  if (triggers.includes('human_request')) {
    const humanMatch =
      /(?:позовите|соедините|соедини|переведите|переведи|переключите|переключи|дайте|дай|хочу|нужен|поговорить с|разговаривать с|свяжите с)\s*(?:меня\s+)?(?:с\s+|на\s+)?(?:(?:живого|живым|дежурного|старшего|главного)\s+)?(?:человек|человеком|оператор|оператором|менеджер|менеджером|администратор|администратором|директор|директором|руководител|специалист|девушк)|живой\s+оператор|живой\s+менеджер|живой\s+человек|хватит\s+робота|не\s+робот|не\s+хочу\s+(?:говорить\s+)?с\s+роботом|дай\s+человека|переведи\s+на\s+человека|^(?:на\s+|к\s+)?(?:менеджер[ауом]?|оператор[ауом]?|живого\s+менеджера|живого\s+оператора)[.!?\s]*$/i;
    const isLooseHumanReq =
      (clean.includes('оператор') || clean.includes('человек') || clean.includes('менеджер') || clean.includes('администратор')) &&
      (clean.includes('соедини') || clean.includes('позови') || clean.includes('переключи') || clean.includes('переведи') || clean.includes('дайте') || clean.includes('свяжи') || clean.includes('живой') || clean.includes('живым'));

    if (humanMatch.test(clean) || isLooseHumanReq) {
      return {
        isTransferRequested: true,
        reason: 'human_request',
        triggerPhrase: 'Запрос живого сотрудника',
      };
    }
  }

  // 2. Conflict or complaint
  if (triggers.includes('conflict')) {
    const conflictMatch =
      /жалоба|претензия|верните деньги|обман|мошенники|хамство|подам в суд|жалобную книгу|не согласен с ценой|ужасное обслуживание/i;
    if (conflictMatch.test(clean)) {
      return {
        isTransferRequested: true,
        reason: 'conflict',
        triggerPhrase: 'Конфликтная ситуация / Претензия',
      };
    }
  }

  // 3. Complex query outside scope
  if (triggers.includes('complex_query')) {
    const complexMatch =
      /сложный вопрос|нестандартная ситуация|тендер|бухгалтерия|безналичный расчет с юрлицом|оптовые поставки|договор сотрудничества/i;
    if (complexMatch.test(clean)) {
      return {
        isTransferRequested: true,
        reason: 'complex_query',
        triggerPhrase: 'Сложный корпоративный запрос',
      };
    }
  }

  return {
    isTransferRequested: false,
  };
}
