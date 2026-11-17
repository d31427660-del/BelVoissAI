import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
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
          const refHeader = String(req.headers?.referer || '');
          try {
            const refUrl = refHeader ? new URL(refHeader) : null;
            const devSim = refUrl?.searchParams.get('dev_sim');
            const applyDevMinutes = (usedMinutes: number, callId: string, callerName: string, summary: string) => {
              if (devCallLogs.some((c) => c.id === callId)) return;
              devCallLogs = [
                {
                  id: callId,
                  callerNumber: '+375 (29) 777-88-99',
                  callerName,
                  timestamp: '2026-11-17 21:55',
                  durationSeconds: Math.round(usedMinutes * 60),
                  audioDuration: `${Math.floor(usedMinutes)}:00`,
                  status: 'lead_captured',
                  dealValueByn: 90,
                  costByn: 0,
                  summary,
                  capturedData: { clientName: callerName, phone: '+375 (29) 777-88-99', service: summary },
                  transcript: [{ speaker: 'assistant', text: summary, time: '0:01' }],
                },
                ...devCallLogs,
              ];
              const rate = devUser.ratePerMinute > 0 ? devUser.ratePerMinute : 0.45;
              const freeRemaining = Math.max(0, Number(devUser.balanceMinutes || 0));
              const freeUsed = Number(Math.min(freeRemaining, usedMinutes).toFixed(2));
              const billableMinutes = Number(Math.max(0, usedMinutes - freeUsed).toFixed(2));
              const billableCost = Number((billableMinutes * rate).toFixed(2));

              devUser.balanceMinutes = Number(Math.max(0, freeRemaining - freeUsed).toFixed(2));
              devUser.spentMinutes = Number(((devUser.spentMinutes || 0) + usedMinutes).toFixed(2));
              devUser.billing.freeMinutesRemaining = devUser.balanceMinutes;

              const inv = devUser.billing.currentInvoice;
              inv.freeMinutesUsed = Number((inv.freeMinutesUsed + freeUsed).toFixed(2));
              inv.billableMinutes = Number((inv.billableMinutes + billableMinutes).toFixed(2));
              inv.minutesAmountByn = Number((inv.minutesAmountByn + billableCost).toFixed(2));
              inv.totalAmountByn = Number((inv.minutesAmountByn + inv.subscriptionFeeByn).toFixed(2));
              inv.remainingDueByn = Number(Math.max(0, inv.totalAmountByn - inv.paidEarlyByn).toFixed(2));
              devUser.billing.unpaidDebtByn = inv.remainingDueByn;
              devUser.billing.invoices = [inv];

              if (devUser.billing.unpaidDebtByn > (devUser.billing.creditLimitByn || 100)) {
                devUser.billing.billingStatus = 'suspended';
                if (devAgent) devAgent.isActive = false;
              }
            };

            if (devSim === 'reset') {
              devUser.balanceMinutes = 15;
              devUser.spentMinutes = 0;
              devUser.billing.freeMinutesRemaining = 15;
              devUser.billing.billingStatus = 'active';
              devUser.billing.numberRentalMode = 'own_sip';
              devUser.billing.monthlySubscriptionByn = 0;
              devUser.billing.currentInvoice = {
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
              };
              devUser.billing.unpaidDebtByn = 0;
              devUser.billing.invoices = [devUser.billing.currentInvoice];
              devCallLogs = devCallLogs.filter((c) => !c.id.startsWith('call-live-audit-'));
              if (devAgent) devAgent.isActive = true;
            } else if (devSim === 'use_6m') {
              applyDevMinutes(6, 'call-live-audit-1', 'Иван (Тест 6 мин)', 'Запись на шиномонтаж');
            } else if (devSim === 'debt_10m') {
              applyDevMinutes(6, 'call-live-audit-1', 'Иван (Тест 6 мин)', 'Запись на шиномонтаж');
              applyDevMinutes(19, 'call-live-audit-2', 'Пётр (Тест 19 мин)', 'Длительная консультация по ремонту');
            } else if (devSim === 'exceed_limit') {
              applyDevMinutes(6, 'call-live-audit-1', 'Иван (Тест 6 мин)', 'Запись на шиномонтаж');
              applyDevMinutes(19, 'call-live-audit-2', 'Пётр (Тест 19 мин)', 'Длительная консультация по ремонту');
              applyDevMinutes(240, 'call-live-audit-3', 'Пул звонков за месяц (240 мин)', 'Серия входящих звонков клиентов');
            }
          } catch {
            // ignore URL parse error
          }

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
          devUser.billing.currentInvoice.totalAmountByn = Number(
            (devUser.billing.currentInvoice.minutesAmountByn + subFee).toFixed(2)
          );
          devUser.billing.currentInvoice.remainingDueByn = Number(
            Math.max(0, devUser.billing.currentInvoice.totalAmountByn - devUser.billing.currentInvoice.paidEarlyByn).toFixed(2)
          );
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
          const log = body.callLog;
          if (log && typeof log === 'object') {
            if (!devCallLogs.some((c) => c.id === log.id)) {
              devCallLogs = [log, ...devCallLogs];
              const durationSec = Math.min(7200, Math.max(0, Number(log.durationSeconds || 0)));
              const callId = String(log.id || '');
              const isVoicemail = log.status === 'voicemail_detected';
              const isTestCall = Boolean(log.isTest) || callId.startsWith('test-') || callId.startsWith('call-sim-');
              const rate = devUser.ratePerMinute > 0 ? devUser.ratePerMinute : 0.45;
              const usedMinutes = isTestCall || isVoicemail ? 0 : Math.max(0.25, Number((durationSec / 60).toFixed(2)));

              if (usedMinutes > 0) {
                const freeRemaining = Math.max(0, Number(devUser.balanceMinutes || 0));
                const freeUsed = Number(Math.min(freeRemaining, usedMinutes).toFixed(2));
                const billableMinutes = Number(Math.max(0, usedMinutes - freeUsed).toFixed(2));
                const billableCost = Number((billableMinutes * rate).toFixed(2));

                devUser.balanceMinutes = Number(Math.max(0, freeRemaining - freeUsed).toFixed(2));
                devUser.spentMinutes = Number(((devUser.spentMinutes || 0) + usedMinutes).toFixed(2));
                devUser.billing.freeMinutesRemaining = devUser.balanceMinutes;

                const inv = devUser.billing.currentInvoice;
                inv.freeMinutesUsed = Number((inv.freeMinutesUsed + freeUsed).toFixed(2));
                inv.billableMinutes = Number((inv.billableMinutes + billableMinutes).toFixed(2));
                inv.minutesAmountByn = Number((inv.minutesAmountByn + billableCost).toFixed(2));
                inv.totalAmountByn = Number((inv.minutesAmountByn + inv.subscriptionFeeByn).toFixed(2));
                inv.remainingDueByn = Number(Math.max(0, inv.totalAmountByn - inv.paidEarlyByn).toFixed(2));
                devUser.billing.unpaidDebtByn = inv.remainingDueByn;
                devUser.billing.invoices = [inv];

                if (devUser.billing.unpaidDebtByn > (devUser.billing.creditLimitByn || 100)) {
                  devUser.billing.billingStatus = 'suspended';
                  if (devAgent) devAgent.isActive = false;
                }
              }
            }
          }
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

      server.middlewares.use('/api/bepaid-checkout', async (req: any, res: any) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }
        let rawBody = '';
        for await (const chunk of req) {
          rawBody += chunk;
        }
        const body = rawBody ? JSON.parse(rawBody) : {};
        const packages: Record<string, { minutes: number; priceByn: number }> = {
          pack_100: { minutes: 100, priceByn: 45 },
          pack_300: { minutes: 300, priceByn: 120 },
          pack_1000: { minutes: 1000, priceByn: 350 },
        };

        if (body.packageId && packages[body.packageId]) {
          const pkg = packages[body.packageId];
          devUser.balanceMinutes = Number((devUser.balanceMinutes + pkg.minutes).toFixed(2));
          devUser.billing.freeMinutesRemaining = devUser.balanceMinutes;
        } else if (body.customMinutes && Number(body.customMinutes) >= 50) {
          const mins = Math.round(Number(body.customMinutes));
          devUser.balanceMinutes = Number((devUser.balanceMinutes + mins).toFixed(2));
          devUser.billing.freeMinutesRemaining = devUser.balanceMinutes;
        } else if (body.invoiceId || body.payEarly) {
          const inv = devUser.billing.currentInvoice;
          if (inv.remainingDueByn < 0.5) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Сумма к оплате по счёту меньше 0.50 BYN' }));
            return;
          }
          inv.paidEarlyByn = inv.totalAmountByn;
          inv.remainingDueByn = 0;
          devUser.billing.unpaidDebtByn = 0;
          devUser.billing.billingStatus = 'active';
          if (devAgent) devAgent.isActive = true;
          devUser.billing.invoices = [inv];
        } else {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Не указан счёт или пакет для оплаты' }));
          return;
        }

        res.statusCode = 200;
        res.end(
          JSON.stringify({
            configured: true,
            redirectUrl: '/dashboard?payment=success',
            token: 'dev-bepaid-token',
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
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
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
