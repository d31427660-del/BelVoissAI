import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

const VOICE_MAP_YANDEX: Record<string, { voice: string; emotion?: string }> = {
  anna: { voice: 'alena', emotion: 'good' },
  dmitry: { voice: 'filipp' },
  polina: { voice: 'marina' },
  maxim: { voice: 'ermil', emotion: 'good' },
};

function voxiTtsDevPlugin(env: Record<string, string>) {
  let yandexTtsCircuitBrokenUntil = 0;

  return {
    name: 'voxi-tts-dev',
    configureServer(server: any) {
      server.middlewares.use('/api/tts', async (req: any, res: any) => {
        try {
          const url = new URL(req.url || '', 'http://localhost');
          const text = (url.searchParams.get('text') || '').trim();
          const voiceParam = (url.searchParams.get('voice') || 'anna').toLowerCase();

          if (!text) {
            res.statusCode = 400;
            res.end('Missing text');
            return;
          }

          const cleanText = text
            .replace(/\bBYN\b/gi, 'рублей')
            .replace(/["«»]/g, '')
            .replace(/[&<>]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 600);

          const yandexApiKey = (env.YANDEX_API_KEY || process.env.YANDEX_API_KEY || '').trim();
          if (yandexApiKey && Date.now() >= yandexTtsCircuitBrokenUntil) {
            try {
              const profile = VOICE_MAP_YANDEX[voiceParam] || VOICE_MAP_YANDEX.anna;
              const params = new URLSearchParams({
                text: cleanText,
                lang: 'ru-RU',
                voice: profile.voice,
                speed: '1.05',
                format: 'mp3',
              });
              if (profile.emotion) params.set('emotion', profile.emotion);

              const ycRes = await fetch('https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize', {
                method: 'POST',
                headers: {
                  Authorization: `Api-Key ${yandexApiKey}`,
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params.toString(),
                signal: AbortSignal.timeout(1500),
              });

              if (ycRes.ok) {
                const buf = Buffer.from(await ycRes.arrayBuffer());
                res.setHeader('Content-Type', 'audio/mpeg');
                res.setHeader('Cache-Control', 'public, max-age=3600');
                res.setHeader('X-TTS-Provider', 'yandex-speechkit');
                res.end(buf);
                return;
              }

              if (ycRes.status === 401 || ycRes.status === 403) {
                // Key revoked or invalid; circuit-break for 10 minutes so requests complete immediately
                yandexTtsCircuitBrokenUntil = Date.now() + 10 * 60 * 1000;
              }
            } catch {
              yandexTtsCircuitBrokenUntil = Date.now() + 60 * 1000;
            }
          }

          const voiceId =
            voiceParam === 'dmitry'
              ? 'en-US-AndrewMultilingualNeural'
              : voiceParam === 'maxim'
              ? 'en-US-BrianMultilingualNeural'
              : voiceParam === 'polina'
              ? 'en-US-AvaMultilingualNeural'
              : 'ru-RU-SvetlanaNeural';

          const tts = new MsEdgeTTS();
          await tts.setMetadata(voiceId, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3, {
            voiceLocale: 'ru-RU',
          });
          const { audioStream } = tts.toStream(cleanText);

          res.setHeader('Content-Type', 'audio/mpeg');
          res.setHeader('Cache-Control', 'public, max-age=3600');

          audioStream.on('data', (chunk: Buffer) => {
            res.write(chunk);
          });
          audioStream.on('end', () => {
            res.end();
            tts.close();
          });
          audioStream.on('error', () => {
            if (!res.writableEnded) res.end();
            tts.close();
          });
        } catch {
          res.statusCode = 500;
          res.end('TTS error');
        }
      });

      let devUser: any = {
        id: 'dev-user-1',
        email: 'director@company.by',
        companyName: 'СТО «Авторитет Минск»',
        balanceMinutes: 15,
        ratePerMinute: 0.45,
        spentMinutes: 0,
        billing: {
          mode: 'postpaid',
          numberRentalMode: 'own_sip',
          monthlySubscriptionByn: 0,
          creditLimitByn: 100,
          billingStatus: 'active',
          freeMinutesRemaining: 15,
          currentPeriodYm: '2026-11',
          currentInvoice: {
            id: 'inv-dev-202611',
            periodYm: '2026-11',
            invoiceNumber: 'СЧ-202611-001',
            billableMinutes: 0,
            freeMinutesUsed: 0,
            ratePerMinute: 0.45,
            minutesAmountByn: 0,
            subscriptionFeeByn: 0,
            paidEarlyByn: 0,
            totalAmountByn: 0,
            remainingDueByn: 0,
            status: 'open',
            issuedAt: null,
            dueDate: null,
            paidAt: null,
          },
          unpaidDebtByn: 0,
          overdueInvoicesCount: 0,
          invoices: [
            {
              id: 'inv-dev-202611',
              periodYm: '2026-11',
              invoiceNumber: 'СЧ-202611-001',
              billableMinutes: 0,
              freeMinutesUsed: 0,
              ratePerMinute: 0.45,
              minutesAmountByn: 0,
              subscriptionFeeByn: 0,
              paidEarlyByn: 0,
              totalAmountByn: 0,
              remainingDueByn: 0,
              status: 'open',
              issuedAt: null,
              dueDate: null,
              paidAt: null,
            },
          ],
        },
      };
      let devAgent: any = null;
      let devSipSettings: any = {
        provider: 'mts',
        sipServer: 'sip.mts.by:5060',
        sipLogin: '375296001020',
        callerId: '+375 (29) 600-10-20',
        assignedDid: '+375 (44) 500-10-01',
        status: 'connected',
        byoSipMode: true,
        fallbackEnabled: true,
        fallbackPhone: '+375 (29) 600-10-20',
        fallbackTrigger: 'human_request',
        warmTransferEnabled: true,
        transferPhone: '+375 (29) 600-10-20',
        transferTriggers: ['human_request', 'conflict_or_complaint', 'complex_query'],
        whisperMessage: 'Минутку, перевожу звонок на дежурного менеджера...',
        sendTelegramSummaryOnTransfer: true,
        piiMaskingEnabled: true,
        recordingDisclaimerEnabled: true,
        disclaimerText: 'Для контроля качества обслуживания наш разговор записывается.',
      };
      let devTelegramSettings: any = null;
      let devWebhookSettings: any = null;
      let devCallLogs: any[] = [
        {
          id: 'call-dev-1',
          callerNumber: '+375 (29) 345-12-90',
          callerName: 'Алексей (VW Passat B8)',
          timestamp: '2026-11-17 18:40',
          durationSeconds: 68,
          audioDuration: '1:08',
          status: 'lead_captured',
          dealValueByn: 120,
          costByn: 0,
          summary: 'Запись на диагностику подвески и замену масла на завтра в 10:30.',
          capturedData: {
            clientName: 'Алексей',
            phone: '+375 (29) 345-12-90',
            service: 'Диагностика подвески + замена масла',
            preferredDate: 'Завтра, 10:30',
          },
          transcript: [
            { speaker: 'assistant', text: 'Здравствуйте! СТО Авторитет Минск, меня зовут Анна. Чем могу вам помочь?', time: '0:01' },
            { speaker: 'caller', text: 'Добрый вечер, хочу записаться на диагностику подвески и замену масла завтра утром.', time: '0:07' },
            { speaker: 'assistant', text: 'Отлично! На завтра свободно окно в 10:30 утра. Записать вас?', time: '0:13' },
          ],
        },
      ];

      server.middlewares.use('/api/db', async (req: any, res: any) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        const reqUrl = new URL(req.url || '', 'http://localhost');
        const action = (reqUrl.searchParams.get('action') || '').toLowerCase();

        let rawBody = '';
        if (req.method === 'POST') {
          for await (const chunk of req) {
            rawBody += chunk;
          }
        }
        const body = rawBody ? JSON.parse(rawBody) : {};

        if (action === 'admin_login' && req.method === 'POST') {
          const pin = String(body.pin || '').trim();
          const masterPin = String(env.ADMIN_MASTER_PIN || env.VOXI_ADMIN_PIN || '').trim();
          if (!masterPin) {
            res.statusCode = 503;
            res.end(JSON.stringify({ ok: false, error: 'ADMIN_MASTER_PIN не задан в .env' }));
            return;
          }
          if (!pin || pin !== masterPin) {
            res.statusCode = 401;
            res.end(JSON.stringify({ ok: false, error: 'Неверный PIN-код' }));
            return;
          }
          res.statusCode = 200;
          res.end(JSON.stringify({ ok: true, adminToken: 'dev-admin-token', dbConfigured: true }));
          return;
        }

        if (action === 'status') {
          res.statusCode = 200;
          res.end(
            JSON.stringify({
              ok: true,
              driver: 'dev-local',
              configured: true,
              connected: true,
            })
          );
          return;
        }

        if (action === 'me') {
          res.statusCode = 200;
          res.end(
            JSON.stringify({
              ok: true,
              authenticated: true,
              user: devUser,
              agent: devAgent,
              sipSettings: devSipSettings,
              telegramSettings: devTelegramSettings,
              webhookSettings: devWebhookSettings,
              callLogs: devCallLogs,
            })
          );
          return;
        }

        if (action === 'signin' || action === 'signup') {
          if (body.email) devUser.email = String(body.email);
          if (body.companyName) devUser.companyName = String(body.companyName);
          res.statusCode = 200;
          res.end(
            JSON.stringify({
              ok: true,
              user: devUser,
              agent: devAgent,
              sipSettings: devSipSettings,
              telegramSettings: devTelegramSettings,
              webhookSettings: devWebhookSettings,
              callLogs: devCallLogs,
            })
          );
          return;
        }

        if (action === 'update_number_rental_mode') {
          const mode = body.numberRentalMode === 'own_sip' ? 'own_sip' : 'rental';
          const subFee = mode === 'own_sip' ? 0 : 15;
          devUser.billing.numberRentalMode = mode;
          devUser.billing.monthlySubscriptionByn = subFee;
          devUser.billing.currentInvoice.subscriptionFeeByn = subFee;
          devUser.billing.currentInvoice.totalAmountByn =
            devUser.billing.currentInvoice.minutesAmountByn + subFee;
          devUser.billing.currentInvoice.remainingDueByn =
            devUser.billing.currentInvoice.totalAmountByn;
          devUser.billing.unpaidDebtByn = devUser.billing.currentInvoice.remainingDueByn;
          devUser.billing.invoices = [devUser.billing.currentInvoice];
          devSipSettings.byoSipMode = mode === 'own_sip';
          res.statusCode = 200;
          res.end(JSON.stringify({ ok: true, user: devUser }));
          return;
        }

        if (action === 'save_agent') {
          if (body.agent) devAgent = body.agent;
          res.statusCode = 200;
          res.end(JSON.stringify({ ok: true }));
          return;
        }

        if (action === 'save_integrations') {
          if (body.sipSettings) devSipSettings = body.sipSettings;
          if (body.telegramSettings) devTelegramSettings = body.telegramSettings;
          if (body.webhookSettings) devWebhookSettings = body.webhookSettings;
          res.statusCode = 200;
          res.end(JSON.stringify({ ok: true }));
          return;
        }

        if (action === 'record_call') {
          if (body.callLog) devCallLogs = [body.callLog, ...devCallLogs];
          res.statusCode = 200;
          res.end(JSON.stringify({ ok: true, user: devUser }));
          return;
        }

        res.statusCode = 200;
        res.end(
          JSON.stringify({
            ok: true,
            driver: 'dev-local',
            configured: true,
            connected: true,
          })
        );
      });

      server.middlewares.use('/api/chat', async (_req: any, res: any) => {
        res.statusCode = 503;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: false, error: 'Local dev mode: PHP backend (/api/chat.php) used in production' }));
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), voxiTtsDevPlugin(env)],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (
                id.includes('/node_modules/react/') ||
                id.includes('/node_modules/react-dom/') ||
                id.includes('/node_modules/scheduler/')
              ) {
                return 'vendor';
              }
              if (id.includes('/node_modules/framer-motion/')) {
                return 'motion';
              }
              if (id.includes('/node_modules/@solar-icons/')) {
                return 'icons';
              }
            }
          },
        },
      },
    },
  };
});
