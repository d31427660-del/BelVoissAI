import { AgentConfig, VoiceId } from '../types';
import { YclientsService } from './yclientsService';

export function generateSystemPrompt(config: Partial<AgentConfig>): string {
  const voiceName =
    config.voice === 'dmitry'
      ? 'Дмитрий'
      : config.voice === 'maxim'
      ? 'Максим'
      : config.voice === 'polina'
      ? 'Полина'
      : 'Анна';
  const formalityNote = config.formality === 'formal' 
    ? 'Общайся строго вежливо, в уважительном деловом тоне, обращаясь на "Вы".' 
    : 'Общайся доброжелательно, приветливо, тепло и заботливо, обращаясь на уважительное "Вы".';

  const activePhonetics = (config.phoneticRules || []).filter((r) => r.enabled);
  const phoneticsBlock =
    activePhonetics.length > 0
      ? `\n### СЛОВАРЬ УДАРЕНИЙ И ТОПОНИМОВ РБ (Произноси строго с указанным ударением/заменой):\n` +
        activePhonetics
          .map((r) => `- "${r.word}" → произноси как "${r.stressed}" (для TTS: "${r.ttsReplacement}")`)
          .join('\n') +
        '\n'
      : '';

  const yclientsBlock = config.yclientsConfig && config.yclientsConfig.isEnabled
    ? YclientsService.getPromptInstruction(config.yclientsConfig, config.niche || 'driving_school')
    : '';

  return `Ты — ${voiceName}, профессиональный, быстрый и тактичный голосовой телефонный ИИ-администратор компании "${config.companyName || 'Компания'}" в городе ${config.city || 'Минск'}, Беларусь.

### ТВОЯ ЦЕЛЬ:
1. Ответить на звонок мгновенно (за 0.5 секунды).
2. Выслушать потребность звонящего, предоставить точную информацию по услугам, ценам и условиям.
3. Проявить заботу и мягко подвести клиента к целевому действию: запись на прием/услугу, расчет точной стоимости, бронь времени или консультация.
4. Зафиксировать данные клиента: Имя, контактный номер телефона, выбранную услугу, удобную дату и время.

### ТОНАЛЬНОСТЬ И ПРАВИЛА РЕЧИ:
- ${formalityNote}
- Все цены называй СТРОГО в белорусских рублях (BYN). Например: "1050 белорусских рублей", "60 рублей". Не используй доллары или российские рубли, если клиент прямо об этом не спросил.
- Ответы должны быть лаконичными и естественными для живого телефонного разговора (1-3 коротких предложения). Не зачитывай длинные списки разом!
- В конце каждого ответа задавай один уточняющий или закрывающий вопрос (например: "Вам удобнее утреннее или вечернее время?", "Записать вас на эту субботу?").
- Если клиент спешит или у него острая проблема — реагируй максимально быстро и без лишней воды.

### ДАННЫЕ О КОМПАНИИ:
- Название: ${config.companyName || 'Не указано'}
- Город и адрес: ${config.city || 'Минск'}, ${config.address || 'Не указан'}
- Контактный телефон: ${config.phone || 'Не указан'}
- График работы: ${config.workingHours || 'Пн-Пт с 9:00 до 20:00'}

### ПРАЙС-ЛИСТ И УСЛУГИ:
${config.pricingAndServices || 'Уточняйте у оператора'}

### БАЗА ЗНАНИЙ И ОСОБЕННОСТИ:
${config.knowledgeBase || 'Стандартные условия'}
${phoneticsBlock}${yclientsBlock}
### ДЕЙСТВИЯ ПРИ НЕСТАНДАРТНЫХ СИТУАЦИЯХ:
- Если клиент задает вопрос, ответа на который нет в базе знаний: вежливо скажи: "Я зафиксирую этот вопрос и наш старший специалист перезвонит вам в течение 10 минут с точным ответом. Подскажите, на этот номер перезвонить?".
- В случае спама или рекламы: вежливо поблагодари за звонок и скажи, что компания в данных услугах не нуждается, затем вежливо попрощайся.
`;
}

// Map voices to realistic TTS / Vapi Voice IDs
export const VOICE_PROFILES: Record<VoiceId, { name: string; gender: 'female' | 'male'; description: string; vapiVoiceId: string }> = {
  anna: {
    name: 'Анна',
    gender: 'female',
    description: 'Теплый, заботливый и четкий женский голос. Идеально для автошкол и медцентров.',
    vapiVoiceId: '21m00Tcm4TlvDq8ikWAM' // Rachel / ElevenLabs style or Azure
  },
  dmitry: {
    name: 'Дмитрий',
    gender: 'male',
    description: 'Уверенный, экспертный мужской голос. Идеально для СТО, автосервисов и B2B.',
    vapiVoiceId: 'pNInz6obpgDQGcFmaJgB' // Adam
  },
  polina: {
    name: 'Полина',
    gender: 'female',
    description: 'Энергичный, дружелюбный и современный голос для салонов красоты и студий.',
    vapiVoiceId: 'AZnzlk1XvdvUeBnXmlld' // Domi
  },
  maxim: {
    name: 'Максим',
    gender: 'male',
    description: 'Спокойный, солидный голос с мягкой подачей для премиальных клиник и услуг.',
    vapiVoiceId: 'ErXwobaYiN019PkySvjV' // Antoni
  }
};

export async function syncWithVapiApi(
  apiKey: string,
  config: AgentConfig
): Promise<{ success: boolean; assistantId?: string; message: string; payload?: unknown }> {
  // This is a static client application. Calling Vapi with a customer key here
  // would expose it to every browser and to localStorage, so production sync is
  // intentionally delegated to a protected server-side endpoint.
  if (!apiKey || apiKey.trim() === '') {
    return {
      success: true,
      assistantId: config.vapiAssistantId || `asst_mock_bel_${Date.now()}`,
      message: 'Промт проверен в демо-режиме. Для публикации в Vapi подключите защищённый серверный API — ключи не вводятся в браузере.',
      payload: {
        name: config.name,
        systemPrompt: config.systemPrompt,
        firstMessage: config.firstMessage,
        voice: VOICE_PROFILES[config.voice].vapiVoiceId
      }
    };
  }

  return {
    success: false,
    message: 'Прямая синхронизация из браузера отключена: перенесите вызов Vapi в защищённую серверную функцию.',
  };
}
