// Vercel Serverless Function: /api/chat
// Live AI brain powered by YandexGPT Lite (ai.languageModels.user) for Voxi.by:
// 1. mode = "dialogue" (default): Real-time phone receptionist replies grounded in client pricing & knowledge base
// 2. mode = "generate_prompt": Generates/improves a structured phone receptionist system prompt for Belarusian SMBs

const rateBuckets = new Map<string, { count: number; resetAt: number }>();
let yandexLlmCircuitBrokenUntil = 0;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (bucket.count >= 25) return false;
  bucket.count += 1;
  return true;
}

function sanitizeSpokenText(text: string): string {
  return text
    .replace(/[*#_`~>]+/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildDialogueSystemPrompt(ctx: Record<string, any>): string {
  const voice = String(ctx.voice || 'anna').toLowerCase();
  const assistantName = voice === 'maxim' ? 'Максим' : 'Анна';
  const company = String(ctx.companyName || 'компания').slice(0, 120);
  const city = String(ctx.city || 'Минск').slice(0, 60);
  const address = String(ctx.address || '').slice(0, 200);
  const workingHours = String(ctx.workingHours || '').slice(0, 160);
  const phone = String(ctx.phone || '').slice(0, 60);
  const pricing = String(ctx.pricingAndServices || '').slice(0, 1500);
  const kb = String(ctx.knowledgeBase || '').slice(0, 1500);
  const customPrompt = String(ctx.systemPrompt || '').slice(0, 1500);

  return [
    `Ты — живой телефонный ИИ-администратор ${assistantName} компании «${company}» (${city}, Беларусь).`,
    'Ты разговариваешь с клиентом ПО ТЕЛЕФОНУ в реальном времени. Твой ответ сразу озвучивается синтезатором речи.',
    'СТРОГИЕ ПРАВИЛА ФОРМАТА:',
    '- Отвечай КОРОТКО и естественно: 1–3 лаконичных предложения (максимум 35–45 слов), как вежливый живой администратор по телефону.',
    '- КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО использовать списки, маркеры, звездочки (*), решетки (#), эмодзи и спецсимволы — пиши только чистый связный текст для озвучки.',
    '- Все цены называй строго в белорусских рублях (например: «120 белорусских рублей» или «120 рублей», не используй российские рубли или доллары).',
    '- Опирайся ТОЛЬКО на данные компании ниже. Не выдумывай несуществующие акции или адреса.',
    '- В конце реплики мягко веди клиента к целевому действию (запись на удобное время, уточнение марки авто / услуги или номера телефона).',
    '- Если клиент просит позвать человека, оператора или соединить со специалистом («соедините с человеком»), ответь строго: «Перевожу вас на старшего администратора, секунду...».',
    address ? `Адрес компании: ${address}.` : '',
    workingHours ? `График работы: ${workingHours}.` : '',
    phone ? `Контактный телефон для перевода на специалиста: ${phone}.` : '',
    pricing ? `Прайс-лист и услуги:\n${pricing}` : '',
    kb ? `База знаний:\n${kb}` : '',
    customPrompt ? `Дополнительные инструкции бизнеса:\n${customPrompt}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

function buildPromptGeneratorInstructions(ctx: Record<string, any>): string {
  const voice = String(ctx.voice || 'anna').toLowerCase();
  const assistantName = voice === 'maxim' ? 'Максим' : 'Анна';
  const company = String(ctx.companyName || 'Компания').slice(0, 120);
  const city = String(ctx.city || 'Минск').slice(0, 60);
  const address = String(ctx.address || '').slice(0, 200);
  const workingHours = String(ctx.workingHours || '').slice(0, 160);
  const phone = String(ctx.phone || '').slice(0, 60);
  const pricing = String(ctx.pricingAndServices || '').slice(0, 1500);

  return [
    'Составь готовый, четкий системный промпт на русском языке для телефонного голосового ИИ-администратора бизнеса в Беларуси.',
    `Имя администратора: ${assistantName}.`,
    `Организация: «${company}» (${city}).`,
    address ? `Адрес: ${address}.` : '',
    workingHours ? `График работы: ${workingHours}.` : '',
    phone ? `Телефон для перевода на живого специалиста: ${phone}.` : '',
    pricing ? `Прайс-лист и услуги (в BYN):\n${pricing}` : '',
    'Требования к промпту: укажи роль, тон общения по телефону (короткие фразы по 1–2 предложения без списков), правила называния цен строго в белорусских рублях (BYN), алгоритм записи клиента (узнать услугу, удобный день/время и имя) и условие перевода звонка на менеджера в сложных случаях. Объем — до 1200 символов.',
  ]
    .filter(Boolean)
    .join('\n');
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  const forwarded = req.headers?.['x-forwarded-for'];
  const clientIp = (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0]) || 'anon';
  if (!checkRateLimit(clientIp)) {
    res.statusCode = 429;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Too Many Requests' }));
    return;
  }

  const yandexApiKey = (process.env.YANDEX_GPT_API_KEY || process.env.YANDEX_API_KEY || '').trim();
  const yandexIamToken = (process.env.YANDEX_IAM_TOKEN || '').trim();
  const yandexFolderId = (process.env.YANDEX_FOLDER_ID || '').trim();

  if (!yandexFolderId || (!yandexApiKey && !yandexIamToken)) {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(
      JSON.stringify({
        configured: false,
        error: 'YANDEX_FOLDER_ID or YANDEX_API_KEY is not configured yet',
      })
    );
    return;
  }

  if (Date.now() < yandexLlmCircuitBrokenUntil) {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(
      JSON.stringify({
        configured: false,
        error: 'YandexGPT upstream in cooldown, using instant local fallback',
      })
    );
    return;
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const mode = body.mode === 'generate_prompt' ? 'generate_prompt' : 'dialogue';
  const context = typeof body.context === 'object' && body.context ? body.context : {};

  let messages: Array<{ role: 'system' | 'user' | 'assistant'; text: string }> = [];
  let maxTokens = 240;
  let temperature = 0.35;

  if (mode === 'generate_prompt') {
    maxTokens = 550;
    temperature = 0.45;
    messages = [
      {
        role: 'system',
        text: 'Ты — ведущий архитектор голосовых телефонных ИИ-ассистентов для бизнеса в Республике Беларусь.',
      },
      {
        role: 'user',
        text: buildPromptGeneratorInstructions(context),
      },
    ];
  } else {
    const query = String(body.query || '').trim().slice(0, 500);
    if (!query) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'Missing query' }));
      return;
    }

    const rawHistory = Array.isArray(body.history) ? body.history.slice(-8) : [];
    const historyMessages = rawHistory
      .map((item: any) => ({
        role: (item?.speaker === 'assistant' ? 'assistant' : 'user') as 'assistant' | 'user',
        text: String(item?.text || '').trim().slice(0, 500),
      }))
      .filter((m: { text: string }) => m.text.length > 0);

    messages = [
      {
        role: 'system',
        text: buildDialogueSystemPrompt(context),
      },
      ...historyMessages,
      {
        role: 'user',
        text: query,
      },
    ];
  }

  try {
    const authHeader = yandexApiKey ? `Api-Key ${yandexApiKey}` : `Bearer ${yandexIamToken}`;

    const ycResponse = await fetch('https://llm.api.cloud.yandex.net/foundationModels/v1/completion', {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
        'x-folder-id': yandexFolderId,
      },
      body: JSON.stringify({
        modelUri: `gpt://${yandexFolderId}/yandexgpt-lite/latest`,
        completionOptions: {
          stream: false,
          temperature,
          maxTokens,
        },
        messages,
      }),
      signal: AbortSignal.timeout(1800),
    });

    if (!ycResponse.ok) {
      if (ycResponse.status === 401 || ycResponse.status === 403) {
        yandexLlmCircuitBrokenUntil = Date.now() + 180_000;
      }
      const errText = await ycResponse.text().catch(() => '');
      res.statusCode = ycResponse.status === 401 || ycResponse.status === 403 ? 503 : 502;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(
        JSON.stringify({
          configured: false,
          error: 'YandexGPT upstream error',
          status: ycResponse.status,
          detail: errText.slice(0, 240),
        })
      );
      return;
    }

    const data: any = await ycResponse.json();
    const rawReply = String(data?.result?.alternatives?.[0]?.message?.text || '').trim();

    if (!rawReply) {
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'Empty response from YandexGPT' }));
      return;
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('X-LLM-Provider', 'yandexgpt-lite');

    if (mode === 'generate_prompt') {
      res.end(
        JSON.stringify({
          systemPrompt: rawReply,
          provider: 'yandexgpt-lite',
        })
      );
      return;
    }

    res.end(
      JSON.stringify({
        reply: sanitizeSpokenText(rawReply),
        provider: 'yandexgpt-lite',
      })
    );
  } catch {
    yandexLlmCircuitBrokenUntil = Date.now() + 120_000;
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'YandexGPT connection timeout or error' }));
  }
}
