// Vercel Serverless Function: /api/dispatch-webhook
// Securely relays call leads and test payloads to external CRM / 1C / Make webhooks without browser CORS issues.

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const { webhookUrl, secretKey, sendFormat = 'json_standard', lead = {}, isTest = false } = body;

    if (!webhookUrl || typeof webhookUrl !== 'string' || !/^https?:\/\//i.test(webhookUrl)) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'Укажите корректный URL-адрес обработчика (начинающийся с https:// или http://)' }));
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
