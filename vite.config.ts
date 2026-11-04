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

      server.middlewares.use('/api/chat', async (req: any, res: any) => {
        try {
          let rawBody = '';
          for await (const chunk of req) {
            rawBody += chunk;
          }
          req.body = rawBody ? JSON.parse(rawBody) : {};
          for (const [k, v] of Object.entries(env)) {
            if (v && !process.env[k]) process.env[k] = v;
          }
          const { default: chatHandler } = await import('./api/chat');
          await chatHandler(req, res);
        } catch {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: 'Dev chat handler error' }));
        }
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
          manualChunks: {
            vendor: ['react', 'react-dom'],
            motion: ['framer-motion'],
            icons: ['@solar-icons/react'],
            supabase: ['@supabase/supabase-js'],
          },
        },
      },
    },
  };
});
