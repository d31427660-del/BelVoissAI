import { BusinessNiche, AgentConfig } from '../types';
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

  // 2. Pricing & Cost questions
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
    if (niche === 'driving_school') {
      return `Полный курс обучения на категорию B стоит 1050 белорусских рублей. Теория и 50 часов вождения. Также действует рассрочка на 4 платежа по 262 рубля. Записать вас на вводное собрание?`;
    }
    if (niche === 'auto_service') {
      return `Диагностика подвески стоит 35 рублей, но при ремонте у нас она абсолютно бесплатная! Замена моторного масла — 30 рублей. Какая услуга вас интересует?`;
    }
    if (niche === 'medical_clinic') {
      return `Первичная консультация врача стоит 45 белорусских рублей, комплексная ультразвуковая чистка зубов Air-Flow — 160 рублей. Подсказать по другим процедурам?`;
    }
    if (niche === 'beauty_salon') {
      return `Стрижка и укладка от 45 рублей, маникюр с покрытием гель-лак — 55 рублей, окрашивание волос от 110 рублей. На какую услугу вас записать?`;
    }
    // Generic fallback with custom pricing snippet
    const shortPricing = pricing.split('\n').filter(Boolean).slice(0, 2).join(' ') || 'Уточняйте у администратора';
    return `По стоимости в ${company}: ${shortPricing}. Какая именно услуга вас интересует?`;
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
    if (niche === 'auto_service') {
      return `На завтра у мастера свободно окно в 11:30 и 18:30 (Бокс номер 2). Какое время вам удобнее забронировать?`;
    }
    if (niche === 'beauty_salon') {
      return `На завтра свободно окно к топ-мастеру на 14:00 и 18:30. На какое время вас зафиксировать?`;
    }
    if (niche === 'driving_school') {
      return `Ближайшая группа стартует в понедельник в 18:30 на Сурганова, 24. Подскажите ваше имя, и я отправлю вам бронь места в SMS!`;
    }
    if (niche === 'medical_clinic') {
      return `Доктор принимает сегодня в 17:00, а также есть окно завтра в 10:30. На какое время вас записать?`;
    }
    return `На завтра свободно окно в 11:30 и 16:30. Назовите ваше имя и удобное время, я сразу внесу вас в график!`;
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
