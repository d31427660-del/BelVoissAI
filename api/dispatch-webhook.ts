// Vercel Serverless Function: /api/dispatch-webhook
// Securely relays call leads and test payloads to external CRM / 1C / Make webhooks without browser CORS issues.
// Protected against SSRF (Server-Side Request Forgery) attacks and rate-limited.

import dns from 'node:dns/promises';

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (bucket.count >= 20) return false;
  bucket.count += 1;
  return true;
}

function isPrivateOrReservedIp(ip: string): boolean {
  // IPv4 checks
  if (ip.includes('.')) {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) return true;
    const [a, b] = parts;
    if (a === 0) return true; // 0.0.0.0/8
    if (a === 127) return true; // 127.0.0.0/8 loopback
    if (a === 10) return true; // 10.0.0.0/8 private
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12 private
    if (a === 192 && b === 168) return true; // 192.168.0.0/16 private
    if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local & cloud metadata
    if (a === 100 && b >= 64 && b <= 127) return true; // Carrier-grade NAT
    if (a >= 224) return true; // Multicast & broadcast
    return false;
  }
  // IPv6 checks
  const lower = ip.toLowerCase();
  if (lower === '::1' || lower === '::' || lower.startsWith('fe80:') || lower.startsWith('fc') || lower.startsWith('fd')) {
    return true;
  }
  return false;
}

async function validateWebhookUrlSafety(rawUrl: string): Promise<{ safe: boolean; error?: string }> {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return { safe: false, error: 'Разрешены только протоколы https:// или http://' };
    }
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal')
    ) {
      return { safe: false, error: 'Запрещено отправлять вебхуки на локальные и внутренние адреса' };
    }

    // Resolve DNS and check all IPs
    const lookup = await dns.lookup(hostname, { all: true });
    for (const record of lookup) {
      if (isPrivateOrReservedIp(record.address)) {
        return { safe: false, error: 'Запрещено обращаться к закрытым IP-адресам внутренней сети' };
      }
    }
    return { safe: true };
  } catch {
    return { safe: false, error: 'Не удалось разрешить адрес узла вебхука' };
  }
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
    res.end(JSON.stringify({ error: 'Слишком много запросов. Подождите минуту перед повтором' }));
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const { action, webhookUrl, secretKey, sendFormat = 'json_standard', lead = {}, isTest = false } = body;

    if (action === 'caller_notification' && (!webhookUrl || typeof webhookUrl !== 'string' || !/^https?:\/\//i.test(webhookUrl))) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(
        JSON.stringify({
          ok: true,
          status: 200,
          deliveryStatus: 'simulated',
          channel: body.channel || 'sms',
          recipient: body.recipient || '',
        })
      );
      return;
    }

    if (!webhookUrl || typeof webhookUrl !== 'string' || !/^https?:\/\//i.test(webhookUrl)) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'Укажите корректный URL-адрес обработчика (начинающийся с https:// или http://)' }));
      return;
    }

    const safety = await validateWebhookUrlSafety(webhookUrl.trim());
    if (!safety.safe) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: safety.error || 'Небезопасный URL вебхука' }));
      return;
    }

    const clientName = lead.clientName || 'Тестовый клиент';
    const phone = lead.phone || '+375 (29) 682-14-99';
    const service = lead.service || 'Консультация и запись на обслуживание';
    const preferredDate = lead.preferredDate || 'Сегодня в 18:30';
    const summary = lead.summary || 'Клиент обратился за консультацией по услугам, зафиксировано удобное время.';
    const dealValueByn = Number(lead.dealValueByn || 120);

    let outboundPayload: any = null;

    if (sendFormat === 'bitrix24') {
      outboundPayload = {
        fields: {
          TITLE: `Звонок Voxi.by: ${clientName} (${service})`,
          NAME: clientName,
          PHONE: [{ VALUE: phone, VALUE_TYPE: 'WORK' }],
          COMMENTS: `Услуга: ${service}\nЖелаемое время: ${preferredDate}\n${summary}`,
          OPPORTUNITY: dealValueByn,
          CURRENCY_ID: 'BYN',
          SOURCE_ID: 'CALL',
        },
      };
    } else if (sendFormat === 'amocrm') {
      outboundPayload = [
        {
          name: `Заявка со звонка: ${clientName} — ${service}`,
          price: dealValueByn,
          custom_fields_values: [
            {
              field_name: 'Телефон',
              values: [{ value: phone }],
            },
            {
              field_name: 'Услуга',
              values: [{ value: service }],
            },
            {
              field_name: 'Примечание',
              values: [{ value: `${summary} (Желаемое время: ${preferredDate})` }],
            },
          ],
        },
      ];
    } else {
      outboundPayload = {
        event: isTest ? 'test.ping' : 'call.completed',
        timestamp: lead.timestamp || new Date().toISOString(),
        isTest,
        caller: {
          name: clientName,
          phone,
        },
        lead: {
          service,
          preferredDate,
          dealValueByn,
          urgency: lead.urgency || 'normal',
        },
        summary,
        transcript: lead.transcript || [],
        source: 'Voxi.by Telephony Bot',
      };
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Voxi-Webhook-Dispatcher/1.0',
    };

    if (secretKey && typeof secretKey === 'string' && secretKey.trim()) {
      headers['X-Voxi-Secret'] = secretKey.trim();
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6500);

    const targetRes = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(outboundPayload),
      redirect: 'error',
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    const responseText = await targetRes.text().catch(() => '');

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(
      JSON.stringify({
        ok: targetRes.ok,
        status: targetRes.status,
        statusText: targetRes.statusText,
        responseText: responseText.slice(0, 300),
      })
    );
  } catch (err: any) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(
      JSON.stringify({
        ok: false,
        error: err?.name === 'AbortError' ? 'Таймаут соединения (сервер не ответил за 6.5 секунд)' : err?.message || 'Сетевая ошибка при отправке вебхука',
      })
    );
  }
}
