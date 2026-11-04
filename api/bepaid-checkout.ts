// Vercel Serverless Function: /api/bepaid-checkout
// Creates a hosted payment token via bePaid Checkout API (https://checkout.bepaid.by/ctp/api/checkouts)
// Supports Belarus BYN payments: ERIP (Raschet) and BELKART / Visa / Mastercard / Mir cards.

const SERVER_PACKAGES: Record<string, { minutes: number; priceByn: number; name: string }> = {
  pack_100: { minutes: 100, priceByn: 45, name: 'Старт (100 минут)' },
  pack_300: { minutes: 300, priceByn: 120, name: 'Бизнес (300 минут)' },
  pack_1000: { minutes: 1000, priceByn: 350, name: 'Сеть / Колл-центр (1000 минут)' },
};

function computeCustomRate(minutes: number): number {
  if (minutes >= 1000) return 0.35;
  if (minutes >= 300) return 0.40;
  return 0.45;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  const shopId = process.env.BEPAID_SHOP_ID?.trim();
  const secretKey = process.env.BEPAID_SECRET_KEY?.trim();

  if (!shopId || !secretKey) {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        configured: false,
        message: 'Шлюз bePaid еще не активирован (не заданы BEPAID_SHOP_ID и BEPAID_SECRET_KEY в Vercel).',
      })
    );
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    let { packageId, customMinutes, paymentMethod, userId, email, companyName } = body;

    // Verify session token if present to prevent userId spoofing
    const authHeader = req.headers?.authorization;
    if (authHeader && typeof authHeader === 'string' && process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const token = authHeader.replace(/^bearer\s+/i, '').trim();
        if (token) {
          const { createClient } = await import('@supabase/supabase-js');
          const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
          const { data } = await sb.auth.getUser(token);
          if (data?.user?.id) {
            userId = data.user.id;
            if (!email) email = data.user.email;
          }
        }
      } catch {
        // Fallback to body-provided userId
      }
    }

    let minutes = 300;
    let amountByn = 120;
    let description = 'Пополнение баланса Voxi.by — 300 минут';

    if (packageId && SERVER_PACKAGES[packageId]) {
      const pkg = SERVER_PACKAGES[packageId];
      minutes = pkg.minutes;
      amountByn = pkg.priceByn;
      description = `Voxi.by — пакет «${pkg.name}»`;
    } else if (typeof customMinutes === 'number' && customMinutes >= 50 && customMinutes <= 10000) {
      minutes = Math.round(customMinutes);
      amountByn = Math.round(minutes * computeCustomRate(minutes));
      description = `Voxi.by — пополнение на ${minutes} минут`;
    }

    const amountKopecks = Math.round(amountByn * 100);
    const isTest = process.env.BEPAID_TEST_MODE !== 'false';
    const siteUrl = (process.env.PUBLIC_SITE_URL || `https://${req.headers?.host || 'voxi.by'}`).replace(/\/$/, '');
    const trackingId = `${userId || 'guest'}:${minutes}:${Date.now()}`;
    const eripServiceNo = process.env.BEPAID_ERIP_SERVICE_NO || '99999999';

    const checkoutPayload: Record<string, any> = {
      checkout: {
        test: isTest,
        transaction_type: 'payment',
        attempts: 3,
        settings: {
          success_url: `${siteUrl}/?payment=success&minutes=${minutes}`,
          decline_url: `${siteUrl}/?payment=declined`,
          fail_url: `${siteUrl}/?payment=failed`,
          cancel_url: `${siteUrl}/?payment=cancelled`,
          notification_url: `${siteUrl}/api/bepaid-webhook`,
          language: 'ru',
          customer_fields: {
            visible: ['email'],
          },
        },
        order: {
          currency: 'BYN',
          amount: amountKopecks,
          description,
          tracking_id: trackingId,
        },
        customer: {
          email: email || undefined,
        },
      },
    };

    if (paymentMethod === 'erip') {
      checkoutPayload.checkout.payment_method = {
        types: ['erip'],
        erip: {
          order_id: Date.now().toString().slice(-8),
          account_number: email || userId || 'voxi-client',
          service_no: eripServiceNo,
          service_info: [description, companyName ? `Клиент: ${companyName}` : 'ИП Беляков К.О., УНП 193991846'],
        },
      };
    } else {
      checkoutPayload.checkout.payment_method = {
        types: ['credit_card', 'erip'],
      };
    }

    const basicAuth = Buffer.from(`${shopId}:${secretKey}`).toString('base64');
    const bpRes = await fetch('https://checkout.bepaid.by/ctp/api/checkouts', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-API-Version': '2',
      },
      body: JSON.stringify(checkoutPayload),
    });

    const data: any = await bpRes.json();

    if (!bpRes.ok || !data?.checkout?.redirect_url) {
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          configured: true,
          error: data?.message || 'Ошибка создания платежной сессии bePaid',
        })
      );
      return;
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        configured: true,
        redirectUrl: data.checkout.redirect_url,
        token: data.checkout.token,
      })
    );
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err?.message || 'Internal payment error' }));
  }
}
