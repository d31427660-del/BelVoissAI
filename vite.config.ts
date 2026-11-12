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

      server.middlewares.use('/api/db', async (req: any, res: any) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        const reqUrl = new URL(req.url || '', 'http://localhost');
        const action = (reqUrl.searchParams.get('action') || '').toLowerCase();

        if (action === 'admin_login' && req.method === 'POST') {
          let rawBody = '';
          for await (const chunk of req) {
            rawBody += chunk;
          }
          const body = rawBody ? JSON.parse(rawBody) : {};
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
          res.end(JSON.stringify({ ok: true, adminToken: 'dev-admin-token', dbConfigured: false }));
          return;
        }

        res.statusCode = 200;
        res.end(
          JSON.stringify({
            ok: true,
            driver: 'dev-local',
            configured: false,
            connected: false,
          })
        );
      });

      server.middlewares.use('/api/live-chat', async (_req: any, res: any) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: true, conversations: [] }));
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
              if (id.includes('/node_modules/@supabase/')) {
                return 'supabase';
              }
            }
          },
        },
      },
    },
  };
});
