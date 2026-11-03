// Vercel Serverless Function: /api/bepaid-webhook
// Receives payment notifications from bePaid, verifies HTTP Basic Auth credentials,
// and credits minutes atomically in Supabase via SUPABASE_SERVICE_ROLE_KEY.

import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

function timingSafeVerifyBasicAuth(authHeader: string | undefined, shopId: string, secretKey: string): boolean {
  if (!authHeader || !/^basic\s+/i.test(authHeader)) return false;
  try {
    const b64 = authHeader.replace(/^basic\s+/i, '').trim();
    const decoded = Buffer.from(b64, 'base64').toString('utf8');
    const expected = `${shopId}:${secretKey}`;
    const bufDecoded = Buffer.from(decoded, 'utf8');
    const bufExpected = Buffer.from(expected, 'utf8');
    if (bufDecoded.length !== bufExpected.length) return false;
    return crypto.timingSafeEqual(bufDecoded, bufExpected);
  } catch {
    return false;
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end('Method Not Allowed');
    return;
  }

  const shopId = process.env.BEPAID_SHOP_ID?.trim();
  const secretKey = process.env.BEPAID_SECRET_KEY?.trim();

  if (!shopId || !secretKey) {
    res.statusCode = 503;
    res.end('bePaid not configured');
    return;
  }

  if (!timingSafeVerifyBasicAuth(req.headers?.authorization, shopId, secretKey)) {
    res.statusCode = 401;
    res.end('Unauthorized webhook signature');
    return;
  }

  try {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const tx = payload.transaction;

    if (!tx || tx.status !== 'successful') {
      res.statusCode = 200;
      res.end('Ignored non-successful status');
      return;
    }

    // tracking_id format: "<userId>:<minutes>:<timestamp>"
    const trackingParts = String(tx.tracking_id || '').split(':');
    const userId = trackingParts[0];
    const minutes = Number(trackingParts[1] || 0);
    const amountByn = Number(tx.amount || 0) / 100;
    const transactionUid = String(tx.uid || tx.id || '');

    const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    if (supabaseUrl && serviceRoleKey && userId && userId !== 'guest' && minutes > 0) {
      const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      await adminClient.rpc('credit_minutes_from_payment', {
        p_user_id: userId,
        p_minutes: minutes,
        p_amount_byn: amountByn,
        p_payment_method: tx.payment_method_type || 'bepaid',
        p_external_uid: transactionUid,
        p_description: tx.description || `Пополнение через bePaid (+${minutes} мин)`,
      });
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ received: true }));
  } catch {
    res.statusCode = 500;
    res.end('Webhook processing failed');
  }
}
