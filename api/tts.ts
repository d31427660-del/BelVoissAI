// Vercel Serverless Function: /api/tts
// Synthesizes natural Russian speech via Yandex SpeechKit API v1 (1M chars/month free tier),
// with automatic fallback to msedge-tts when YANDEX_API_KEY is not yet configured.

const VOICE_MAP_YANDEX: Record<string, { voice: string; emotion?: string }> = {
  anna: { voice: 'alena', emotion: 'good' },
  dmitry: { voice: 'filipp' },
  polina: { voice: 'marina', emotion: 'friendly' },
  maxim: { voice: 'alexander' },
};

// Simple per-instance IP sliding rate limiter (45 req / min / IP)
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (bucket.count >= 45) return false;
  bucket.count += 1;
  return true;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, POST');
    res.end('Method Not Allowed');
    return;
  }

  const forwarded = req.headers?.['x-forwarded-for'];
  const clientIp = (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0]) || 'anon';
  if (!checkRateLimit(clientIp)) {
    res.statusCode = 429;
    res.end('Too Many Requests');
    return;
  }

  const rawText = String(req.query?.text ?? req.body?.text ?? '').trim();
  const voiceParam = String(req.query?.voice ?? req.body?.voice ?? 'anna').toLowerCase();

  if (!rawText) {
    res.statusCode = 400;
    res.end('Missing text parameter');
    return;
  }

  // Cap synthesis length at 600 chars to protect Yandex SpeechKit quota
  const cleanText = rawText
    .replace(/["«»]/g, '')
    .replace(/[&<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 600);

  const yandexApiKey = process.env.YANDEX_API_KEY?.trim();
  const yandexIamToken = process.env.YANDEX_IAM_TOKEN?.trim();
  const yandexFolderId = process.env.YANDEX_FOLDER_ID?.trim();

  // 1. Primary Production Engine: Yandex SpeechKit TTS API v1
  if (yandexApiKey || (yandexIamToken && yandexFolderId)) {
    try {
      const profile = VOICE_MAP_YANDEX[voiceParam] || VOICE_MAP_YANDEX.anna;
      const params = new URLSearchParams({
        text: cleanText,
        lang: 'ru-RU',
        voice: profile.voice,
        speed: '1.05',
        format: 'mp3',
      });
      if (profile.emotion) {
        params.set('emotion', profile.emotion);
      }
      // folderId must ONLY be sent when authenticating via IAM token, NOT Service Account Api-Key
      if (!yandexApiKey && yandexFolderId) {
        params.set('folderId', yandexFolderId);
      }

      const authHeader = yandexApiKey
        ? `Api-Key ${yandexApiKey}`
        : `Bearer ${yandexIamToken}`;

      const ycResponse = await fetch('https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize', {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (ycResponse.ok) {
        const audioBuffer = Buffer.from(await ycResponse.arrayBuffer());
        res.statusCode = 200;
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800');
        res.setHeader('X-TTS-Provider', 'yandex-speechkit');
        res.end(audioBuffer);
        return;
      }
    } catch {
      // Fall through to neural fallback if Yandex Cloud is temporarily unreachable
    }
  }

  // 2. Zero-config Neural Fallback (until YANDEX_API_KEY is added in Vercel Settings)
  try {
    const { MsEdgeTTS, OUTPUT_FORMAT } = await import('msedge-tts');
    const edgeVoiceId =
      voiceParam === 'dmitry'
        ? 'en-US-AndrewMultilingualNeural'
        : voiceParam === 'maxim'
        ? 'en-US-BrianMultilingualNeural'
        : voiceParam === 'polina'
        ? 'en-US-AvaMultilingualNeural'
        : 'ru-RU-SvetlanaNeural';

    const tts = new MsEdgeTTS();
    await tts.setMetadata(edgeVoiceId, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3, {
      voiceLocale: 'ru-RU',
    });
    const { audioStream } = tts.toStream(cleanText);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('X-TTS-Provider', 'neural-fallback');

    audioStream.on('data', (chunk: Buffer) => res.write(chunk));
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
    res.end('TTS synthesis error');
  }
}
