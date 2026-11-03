import { BusinessNiche, CallLog } from '../types';
import { NICHE_TEMPLATES } from './mockData';

export interface DialogueContext {
  niche?: BusinessNiche;
  companyName?: string;
  city?: string;
  address?: string;
  phone?: string;
  workingHours?: string;
  pricingAndServices?: string;
  knowledgeBase?: string;
  systemPrompt?: string;
  voice?: string;
}

export interface DialogueTurn {
  speaker: 'assistant' | 'user';
  text: string;
}

export const NICHE_QUICK_QUESTIONS: Record<
  BusinessNiche,
  Array<{ label: string; query: string }>
> = {
  driving_school: [
    { label: 'Сколько стоит категория B?', query: 'Сколько стоит полный курс обучения на категорию B и топливо?' },
    { label: 'Есть ли рассрочка?', query: 'Есть ли рассрочка без переплат на обучение?' },
    { label: 'Где классы и автодром?', query: 'По какому адресу находятся учебные классы и автодром?' },
    { label: 'Запишите в вечернюю группу', query: 'Запишите меня в вечернюю группу на 18:30' },
  ],
  auto_service: [
    { label: 'Замена масла — цена?', query: 'Сколько стоит замена моторного масла и фильтра?' },
    { label: 'Диагностика подвески', query: 'Сколько стоит диагностика подвески и куда подъехать?' },
    { label: 'Запишите сегодня на 18:30', query: 'Можно записаться на диагностику сегодня на 18:30?' },
    { label: 'Есть ли карта Халва?', query: 'Принимаете ли вы карты рассрочки Халва и есть ли гарантия?' },
  ],
  medical_clinic: [
    { label: 'Острая боль — примете сегодня?', query: 'Болит зуб, сможете принять сегодня без очереди?' },
    { label: 'Чистка зубов — стоимость?', query: 'Сколько стоит профессиональная чистка зубов ультразвуком и Air-Flow?' },
    { label: 'Работаете по страховке?', query: 'Принимаете ли вы пациентов по полисам Белгосстрах и Ингосстрах?' },
    { label: 'Запишите на завтра утром', query: 'Запишите меня на консультацию к стоматологу на завтра утром' },
  ],
  beauty_salon: [
    { label: 'Сколько стоит стрижка?', query: 'Подскажите цены на стрижку и окрашивание?' },
    { label: 'Запишите на пятницу 18:30', query: 'Есть ли свободное окно к мастеру в пятницу на 18:30?' },
    { label: 'Где находится салон?', query: 'Подскажите точный адрес салона и график работы?' },
    { label: 'Маникюр и уход', query: 'Сколько стоит комплексный маникюр с покрытием?' },
  ],
  custom: [
    { label: 'Сколько стоят услуги?', query: 'Расскажите про ваши основные услуги и цены' },
    { label: 'Где вы находитесь?', query: 'Подскажите ваш адрес и график работы' },
    { label: 'Запишите на завтра', query: 'Можно записаться на завтра в удобное время?' },
    { label: 'Способы оплаты', query: 'Какие способы оплаты и рассрочки у вас есть?' },
  ],
};

export function adaptGreetingForVoice(
  rawGreeting: string,
  voice: string,
  companyName?: string,
  templateCompanyName?: string
): string {
  let result = rawGreeting || 'Здравствуйте! Чем я могу вам помочь?';
  const voiceLabel =
    voice === 'dmitry' ? 'Дмитрий' : voice === 'maxim' ? 'Максим' : voice === 'polina' ? 'Полина' : 'Анна';

  result = result.replace(/меня зовут (Анна|Дмитрий|Полина|Максим)/gi, `меня зовут ${voiceLabel}`);

  if (companyName && templateCompanyName && companyName.trim() && companyName !== templateCompanyName) {
    result = result.replace(templateCompanyName, companyName.trim());
  }
  return result;
}

/**
 * Intelligent dialogue engine for Voxi.by phone bot simulation.
 * Returns natural, context-aware Russian responses tailored to the business niche and pricing.
 */
export function generateBotReply(query: string, context: DialogueContext): string {
  const q = query.trim().toLowerCase();
  const niche = context.niche || 'driving_school';
  const template = NICHE_TEMPLATES[niche] || NICHE_TEMPLATES.driving_school;

  const company = context.companyName || template.companyName || 'Voxi AI';
  const address = context.address || template.address || 'г. Минск, ул. Сурганова, 24';
  const hours = context.workingHours || template.workingHours || 'Пн-Пт с 09:00 до 20:00';
  const pricing = context.pricingAndServices || template.pricingAndServices || '';

  // 1. Greetings & Audio / Mic check
  if (
    q.includes('привет') ||
    q.includes('здравствуй') ||
    q.includes('добрый день') ||
    q.includes('доброе утро') ||
    q.includes('добрый вечер') ||
    q.includes('алло') ||
    q.includes('ало') ||
    q.includes('слышно') ||
    q.includes('кто это') ||
    q.includes('вы кто')
  ) {
    return `Здравствуйте! Компания ${company}, меня отлично слышно. Чем могу вам помочь? Подсказать по ценам или записать на свободное время?`;
  }

  // 2. Pricing & Cost questions (dynamically reads user's configured pricingAndServices!)
  if (
    q.includes('цен') ||
    q.includes('стоим') ||
    q.includes('скольк') ||
    q.includes('прайс') ||
    q.includes('тариф') ||
    q.includes('расценк') ||
    q.includes('рубл') ||
    q.includes('byn') ||
    q.includes('оплат')
  ) {
    const cleanLines = pricing
      .split('\n')
      .map((line) => line.replace(/^\s*\d+[.)]\s*/, '').trim())
      .filter((line) => line.length > 4 && !line.startsWith('Внесите перечень') && !line.startsWith('Способы оплаты:'));

    if (cleanLines.length > 0) {
      const queryWords = q
        .replace(/[^а-яёa-z0-9\s]/gi, ' ')
        .split(/\s+/)
        .filter((w) => w.length >= 4 && !['сколько', 'стоит', 'стоят', 'цена', 'цены', 'прайс', 'подскажите', 'услуга', 'услуги'].includes(w));

      const matchedLines =
        queryWords.length > 0
          ? cleanLines.filter((line) => {
              const lowerLine = line.toLowerCase();
              return queryWords.some((stem) => lowerLine.includes(stem.slice(0, 4)));
            })
          : [];

      const picked = (matchedLines.length > 0 ? matchedLines.slice(0, 2) : cleanLines.slice(0, 2))
        .map((line) => line.replace(/\bBYN\b/gi, 'белорусских рублей').replace(/\.$/, ''))
        .join('. ');

      return `Сориентирую по стоимости в «${company}»: ${picked}. Записать вас на удобное время?`;
    }

    if (niche === 'driving_school') {
      return `Полный курс обучения на категорию B стоит 1050 белорусских рублей. Теория и 50 часов вождения. Также действует рассрочка на 4 платежа. Записать вас на вводное собрание?`;
    }
    if (niche === 'auto_service') {
      return `Диагностика подвески стоит 35 рублей, но при ремонте у нас она бесплатная! Замена моторного масла — 30 рублей. Какая услуга вас интересует?`;
    }
    if (niche === 'medical_clinic') {
      return `Первичная консультация врача стоит 35 белорусских рублей, комплексная гигиена Air-Flow — 160 рублей. Подсказать по другим процедурам?`;
    }
    if (niche === 'beauty_salon') {
      return `Мужская стрижка — 55 рублей, женская модельная стрижка — от 70 рублей, маникюр с покрытием — 65 рублей. На какую услугу вас записать?`;
    }
    return `Уточните, пожалуйста, какая именно услуга в «${company}» вас интересует, и я сразу назову точную стоимость!`;
  }

  // 3. Location, address, how to get there
  if (
    q.includes('где') ||
    q.includes('адрес') ||
    q.includes('находит') ||
    q.includes('метро') ||
    q.includes('проезд') ||
    q.includes('доехать') ||
    q.includes('район') ||
    q.includes('улиц')
  ) {
    return `Мы находимся по адресу: ${address}. График работы: ${hours}. Вам удобно подъехать сегодня или подсказать ориентир?`;
  }

  // 4. Working hours & weekend availability
  if (
    q.includes('график') ||
    q.includes('режим') ||
    q.includes('до скольк') ||
    q.includes('со скольк') ||
    q.includes('выходн') ||
    q.includes('суббот') ||
    q.includes('воскресен') ||
    q.includes('работаете')
  ) {
    return `Наш график работы: ${hours}. Принимаем по предварительной записи. Подсказать свободные окна на сегодня или завтра?`;
  }

  // 5. Booking, appointment requests
  if (
    q.includes('запис') ||
    q.includes('забронир') ||
    q.includes('свободн') ||
    q.includes('окно') ||
    q.includes('время') ||
    q.includes('завтра') ||
    q.includes('сегодня') ||
    q.includes('вечер') ||
    q.includes('утр') ||
    q.includes('прийти') ||
    q.includes('подъехать')
  ) {
    const shortAddr = address.split('(')[0].trim();
    if (niche === 'auto_service') {
      return `На завтра у мастера свободно окно в 11:30 и 18:30 (${shortAddr}). Какое время вам удобнее забронировать?`;
    }
    if (niche === 'beauty_salon') {
      return `На завтра свободно окно к топ-мастеру на 14:00 и 18:30 (${shortAddr}). На какое время вас зафиксировать?`;
    }
    if (niche === 'driving_school') {
      return `Ближайшая группа стартует в понедельник в 18:30 по адресу ${shortAddr}. Подскажите ваше имя, и я отправлю вам бронь места в SMS!`;
    }
    if (niche === 'medical_clinic') {
      return `Доктор принимает сегодня в 17:00, а также есть окно завтра в 10:30 (${shortAddr}). На какое время вас записать?`;
    }
    return `На завтра свободно окно в 11:30 и 16:30 по адресу ${shortAddr}. Назовите ваше имя и удобное время, я сразу внесу вас в график!`;
  }

  // 6. Agreement & confirmation ("да", "запишите", "18:30", "подходит", "хорошо")
  if (
    q.includes('да') ||
    q.includes('запиш') ||
    q.includes('бронир') ||
    q.includes('согласен') ||
    q.includes('подходит') ||
    q.includes('хорошо') ||
    q.includes('давай') ||
    q.includes('18:30') ||
    q.includes('11:30') ||
    q.includes('14:00') ||
    q.includes('16:30') ||
    q.includes('17:00')
  ) {
    return `Отлично! Время зафиксировано в системе. Я отправила вам подтверждение в SMS и уведомила дежурного специалиста. Будем рады видеть вас в ${company}!`;
  }

  // 7. Installments & payment methods
  if (
    q.includes('рассрочк') ||
    q.includes('частям') ||
    q.includes('кредит') ||
    q.includes('халв') ||
    q.includes('магнит') ||
    q.includes('картой')
  ) {
    return `Да, у нас действует честная беспроцентная рассрочка без переплат! Можно оплачивать картами рассрочки либо равными частями на весь период.`;
  }

  // 8. Specific niche terms
  if (niche === 'driving_school') {
    if (q.includes('медкомисс') || q.includes('справк') || q.includes('поликлиник')) {
      return `Медкомиссию можно пройти в 24-й поликлинике спецмедосмотров на Филимонова 53. Мы выдаем официальное направление от автошколы!`;
    }
    if (q.includes('автодром') || q.includes('гаи') || q.includes('машин') || q.includes('автопарк')) {
      return `У нас новые Volkswagen Polo и Renault Sandero на механике и автомате. Автодром возле метро Восток, а сдачу в ГАИ организуем на наших же машинах.`;
    }
    if (q.includes('инструктор') || q.includes('вождени')) {
      return `Все инструкторы с опытом более 8 лет, вежливые и спокойные. Вождение проходит в удобное для вас время. Оформить заявку?`;
    }
  }

  if (niche === 'auto_service') {
    if (q.includes('масл') || q.includes('фильтр') || q.includes('то')) {
      return `Замена масла занимает около 40 минут. Масла и оригинальные фильтры есть в наличии на складе. Записать вас на сегодня?`;
    }
    if (q.includes('подвеск') || q.includes('стук') || q.includes('диагностик')) {
      return `Мастер проверит ходовую на вибростенде и осмотрит узлы на подъемнике. Если остаетесь на ремонт — диагностика бесплатно! Когда вам удобно приехать?`;
    }
  }

  if (niche === 'medical_clinic') {
    if (q.includes('боль') || q.includes('остр') || q.includes('срочн')) {
      return `С острой болью мы принимаем пациентов вне очереди в течение часа! Приезжайте по адресу ${address}, доктор готов принять вас.`;
    }
  }

  // 9. Goodbyes & Gratitude
  if (
    q.includes('спасибо') ||
    q.includes('благодар') ||
    q.includes('до свидания') ||
    q.includes('пока') ||
    q.includes('всего доброго') ||
    q.includes('хорошего дня')
  ) {
    return `Спасибо за звонок! Если появятся вопросы — мы всегда на связи. Хорошего вам дня, до свидания!`;
  }

  // 10. Default contextual helpful reply
  return `Спасибо за вопрос! Компания «${company}» с радостью поможет. Уточните, пожалуйста: вас интересует расчет точной стоимости, адрес филиала или свободное время для записи?`;
}

/**
 * Requests a live neural reply from YandexGPT Lite via /api/chat,
 * with automatic zero-downtime fallback to generateBotReply().
 */
export async function requestBotReply(
  query: string,
  context: DialogueContext,
  history: DialogueTurn[] = [],
  signal?: AbortSignal
): Promise<{ reply: string; provider: 'yandexgpt-lite' | 'local-fallback' }> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'dialogue',
        query,
        history: history.slice(-8),
        context,
      }),
      signal,
    });

    if (response.ok) {
      const data = await response.json();
      if (data?.reply && typeof data.reply === 'string') {
        return {
          reply: data.reply.trim(),
          provider: 'yandexgpt-lite',
        };
      }
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw err;
    }
  }

  return {
    reply: generateBotReply(query, context),
    provider: 'local-fallback',
  };
}

/**
 * Generates or improves a phone receptionist system prompt via YandexGPT Lite (/api/chat).
 */
export async function requestAiPromptImprovement(
  context: DialogueContext
): Promise<{ systemPrompt: string; provider: 'yandexgpt-lite' } | null> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'generate_prompt',
        context,
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    if (data?.systemPrompt && typeof data.systemPrompt === 'string') {
      return {
        systemPrompt: data.systemPrompt.trim(),
        provider: 'yandexgpt-lite',
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Converts a completed live voice/text test call into a structured CallLog entry
 * so the user immediately sees their test call in «Журнал звонков» and analytics.
 */
export function createCallLogFromDialogue(params: {
  niche: BusinessNiche;
  companyName?: string;
  address?: string;
  durationSeconds: number;
  messages: Array<{ speaker: 'assistant' | 'user'; text: string; time: string }>;
}): CallLog | null {
  const { niche, companyName, address, durationSeconds, messages } = params;
  const userMessages = messages.filter((m) => m.speaker === 'user');
  if (userMessages.length === 0) return null;

  const tmpl = NICHE_TEMPLATES[niche] || NICHE_TEMPLATES.driving_school;
  const combinedUserText = userMessages.map((m) => m.text).join(' ').toLowerCase();

  const isLeadCaptured =
    /запиш|запис|бронир|забронир|18:30|11:30|14:00|16:30|17:00|09:30|10:00|завтра|сегодня|пятниц|суббот|вечерн|согласен|подходит|давай/.test(
      combinedUserText
    );

  const timeMatch = combinedUserText.match(/\b([01]?\d|2[0-3]):[0-5]\d\b/);
  const preferredTime = timeMatch ? timeMatch[0] : isLeadCaptured ? '18:30' : undefined;
  const preferredDate = combinedUserText.includes('сегодня')
    ? `Сегодня${preferredTime ? `, ${preferredTime}` : ''}`
    : combinedUserText.includes('пятниц')
    ? `Пятница${preferredTime ? `, ${preferredTime}` : ''}`
    : combinedUserText.includes('суббот')
    ? `Суббота${preferredTime ? `, ${preferredTime}` : ''}`
    : isLeadCaptured
    ? `Ближайшее окно${preferredTime ? ` (${preferredTime})` : ''}`
    : undefined;

  const nameMatch = userMessages
    .map((m) => m.text)
    .join(' ')
    .match(/(?:меня зовут|зовут|запишите)\s+([А-ЯЁ][а-яё]+(?:\s+[А-ЯЁ][а-яё]+)?)/i);
  const extractedName = nameMatch ? nameMatch[1] : 'Тестовый звонок (Вы)';

  const dealValueByn = isLeadCaptured ? tmpl.defaultAvgCheck : 0;
  const safeDuration = Math.max(durationSeconds, messages.length * 6);
  const mins = Math.floor(safeDuration / 60);
  const secs = String(safeDuration % 60).padStart(2, '0');

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(
    now.getHours()
  )}:${pad(now.getMinutes())}`;

  const firstQuestion = userMessages[0].text;
  const serviceSummary = isLeadCaptured
    ? `Запись через тест бота (${companyName || tmpl.companyName})`
    : `Консультация: «${firstQuestion.slice(0, 55)}${firstQuestion.length > 55 ? '…' : ''}»`;

  return {
    id: `call-live-${Date.now()}`,
    niche,
    callerNumber: '+375 (29) 000-00-00 (Тест)',
    callerName: extractedName,
    timestamp,
    durationSeconds: safeDuration,
    audioDuration: `${mins}:${secs}`,
    costByn: Math.max(0.15, Math.round((safeDuration / 60) * 0.45 * 100) / 100),
    status: isLeadCaptured ? 'lead_captured' : 'consultation',
    dealValueByn,
    summary: `${serviceSummary}. Диалог из ${messages.length} реплик.`,
    capturedData: {
      clientName: extractedName,
      phone: '+375 (29) 000-00-00',
      service: firstQuestion.slice(0, 70),
      preferredDate,
      preferredTime,
      cityOrBranch: address || tmpl.address,
      estimatedPriceByn: dealValueByn || undefined,
      urgency: isLeadCaptured ? 'high' : 'normal',
    },
    transcript: messages.map((m) => ({
      speaker: m.speaker === 'user' ? 'caller' : 'assistant',
      text: m.text,
      time: m.time,
    })),
  };
}
