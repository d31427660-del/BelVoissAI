import { AgentConfig, SipSettings, VoiceId } from '../types';
import { YclientsService } from './yclientsService';

export function generateSystemPrompt(config: Partial<AgentConfig>): string {
  const voiceName = config.voice === 'maxim' ? 'Максим' : 'Анна';
  const formalityNote = config.formality === 'formal' 
    ? 'Общайся строго вежливо, в уважительном деловом тоне, обращаясь на "Вы".' 
    : 'Общайся доброжелательно, приветливо, тепло и заботливо, обращаясь на уважительное "Вы".';

  const yclientsBlock = config.yclientsConfig && config.yclientsConfig.isEnabled
    ? YclientsService.getPromptInstruction(config.yclientsConfig, config.niche || 'driving_school', config.voice)
    : '';

  return `Ты — ${voiceName}, профессиональный, быстрый и тактичный голосовой телефонный ИИ-администратор компании "${config.companyName || 'Компания'}" в городе ${config.city || 'Минск'}, Беларусь.

### ТВОЯ ЦЕЛЬ:
1. Ответить на звонок мгновенно (за 0.5 секунды) и в начале разговора обязательно предупредить клиента, что разговор записывается, а для переключения на живого менеджера достаточно сказать «соедините с менеджером».
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
${yclientsBlock}
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
    description: 'Теплый, заботливый и четкий женский голос администратора. Идеально для автошкол, медцентров и салонов.',
    vapiVoiceId: '21m00Tcm4TlvDq8ikWAM' // Rachel / ElevenLabs style
  },
  maxim: {
    name: 'Максим',
    gender: 'male',
    description: 'Спокойный, уверенный мужской голос мастера-консультанта. Идеально для СТО, автосервисов и B2B.',
    vapiVoiceId: 'ErXwobaYiN019PkySvjV' // Antoni
  }
};

export async function syncWithVapiApi(
  apiKey: string,
  config: AgentConfig,
  sipSettings?: Partial<SipSettings>
): Promise<{ success: boolean; assistantId?: string; webhookUrl?: string; message: string; payload?: unknown }> {
  try {
    const res = await fetch('/api/telephony', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'sync_assistant',
        apiKey: apiKey?.trim() || '',
        config,
        sipSettings: sipSettings || {},
      }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.ok) {
      return {
        success: true,
        assistantId: data.assistantId,
        webhookUrl: data.webhookUrl,
        message: data.message || 'Ассистент успешно синхронизирован с Vapi.ai!',
      };
    }
    return {
      success: false,
      message: data?.error || `Ошибка синхронизации с Vapi (HTTP ${res.status})`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Не удалось связаться с серверным шлюзом /api/telephony',
    };
  }
}

export async function testSipNode(params: {
  sipServer: string;
  sipLogin: string;
  callerId: string;
}): Promise<{ ok: boolean; message: string; latencyMs?: number }> {
  try {
    const res = await fetch('/api/telephony', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'test_sip',
        ...params,
      }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.ok) {
      return { ok: true, message: data.message, latencyMs: data.latencyMs };
    }
    return { ok: false, message: data?.error || `Ошибка проверки SIP (HTTP ${res.status})` };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Сетевая ошибка при проверке SIP-узла' };
  }
}

export async function testFallbackPhone(params: {
  fallbackPhone: string;
  assistantId?: string;
  vapiApiKey?: string;
}): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch('/api/telephony', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'test_fallback',
        ...params,
      }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.ok) {
      return { ok: true, message: data.message };
    }
    return { ok: false, message: data?.error || `Ошибка проверки номера перевода (HTTP ${res.status})` };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Сетевая ошибка при проверке перевода' };
  }
}

export async function sendTestTelegramCard(params: {
  botToken?: string;
  chatId: string;
  companyName?: string;
}): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch('/api/telephony', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'test_telegram',
        ...params,
      }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.ok) {
      return { ok: true, message: data.message };
    }
    return { ok: false, message: data?.error || `Ошибка отправки в Telegram (HTTP ${res.status})` };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Сетевая ошибка при обращении к Telegram шлюзу' };
  }
}
