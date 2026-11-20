import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import puppeteer from 'puppeteer-core';

const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 30;
const DURATION_SEC = 15;
const TOTAL_FRAMES = FPS * DURATION_SEC; // 450 frames

const PUBLIC_MP4 = path.resolve('public/voxi-instagram-reel.mp4');
const ARTIFACT_DIR = '/Users/jmaxess/.gemini/antigravity/brain/c97fa18a-f479-4474-a9dd-ee899a38ed36';
const ARTIFACT_MP4 = path.join(ARTIFACT_DIR, 'voxi-instagram-reel.mp4');
const TMP_WAV = path.resolve('public/.tmp-reel-audio.wav');

/**
 * 1. Generate a clean 15-second 44.1kHz stereo WAV soundtrack synced to the 5 scenes:
 * - Warm 120 BPM editorial minimal house/tech pulse
 * - Scene 1 (0.0s): Incoming call double-bell & sub drop
 * - Scene 2 (2.8s): Missed call low warning tone -> (3.6s) Mint 0.5s instant pickup chime
 * - Scene 3 (5.2s): Live voice synth cadence modulated with the equalizer
 * - Scene 4 (9.0s): Booking confirmed bright triad chime + cascade ticks (10.3s, 10.6s, 10.9s)
 * - Scene 5 (12.2s): Resolving warm chord + final CTA shimmer
 */
function generateSyncedWav(outputPath) {
  const sampleRate = 44100;
  const numSamples = sampleRate * DURATION_SEC;
  const left = new Float32Array(numSamples);
  const right = new Float32Array(numSamples);

  const addNote = (startSec, durSec, freq, amp, type = 'sine', pan = 0) => {
    const startIdx = Math.max(0, Math.floor(startSec * sampleRate));
    const endIdx = Math.min(numSamples, Math.floor((startSec + durSec) * sampleRate));
    for (let i = startIdx; i < endIdx; i++) {
      const localT = (i - startIdx) / sampleRate;
      const progress = localT / durSec;
      const attack = Math.min(1, localT / 0.012);
      const decay = Math.exp(-3.8 * progress) * (1 - Math.pow(progress, 4));
      const env = attack * decay;

      let sig = 0;
      const phase = 2 * Math.PI * freq * localT;
      if (type === 'sine') {
        sig = Math.sin(phase) + 0.25 * Math.sin(phase * 2);
      } else if (type === 'warm') {
        sig = Math.sin(phase) + 0.45 * Math.sin(phase * 2) + 0.15 * Math.sin(phase * 3);
      } else if (type === 'bell') {
        sig = Math.sin(phase) + 0.6 * Math.sin(phase * 2.01) + 0.25 * Math.sin(phase * 4.02);
      }
      const sample = sig * amp * env;
      left[i] += sample * (1 - Math.max(0, pan) * 0.4);
      right[i] += sample * (1 + Math.min(0, pan) * 0.4);
    }
  };

  const addKick = (startSec, amp = 0.28) => {
    const durSec = 0.22;
    const startIdx = Math.floor(startSec * sampleRate);
    const endIdx = Math.min(numSamples, Math.floor((startSec + durSec) * sampleRate));
    let phase = 0;
    for (let i = startIdx; i < endIdx; i++) {
      const localT = (i - startIdx) / sampleRate;
      const freq = 48 + 95 * Math.exp(-localT * 28);
      phase += (2 * Math.PI * freq) / sampleRate;
      const env = Math.exp(-localT * 11);
      const s = Math.sin(phase) * amp * env;
      left[i] += s;
      right[i] += s;
    }
  };

  const addTick = (startSec, freq = 1800, amp = 0.12) => {
    addNote(startSec, 0.045, freq, amp, 'bell', 0);
  };

  // 120 BPM subtle pulse (every 0.5s)
  const scale = [220, 261.63, 329.63, 392.0, 440, 523.25]; // A minor9 / C major7 editorial palette
  for (let beat = 0; beat < 30; beat++) {
    const t = beat * 0.5;
    addKick(t, beat % 2 === 0 ? 0.24 : 0.15);
    // Subtle off-beat arpeggio plucks
    const arpFreq = scale[(beat * 2) % scale.length];
    addNote(t + 0.25, 0.22, arpFreq, 0.08, 'warm', (beat % 2 === 0 ? -1 : 1) * 0.4);
  }

  // Warm background pad chords
  const padChords = [
    { start: 0.0, dur: 2.8, freqs: [110, 220, 261.63, 329.63] },
    { start: 2.8, dur: 2.4, freqs: [98, 196, 246.94, 293.66] },
    { start: 5.2, dur: 3.8, freqs: [130.81, 261.63, 329.63, 392.0] },
    { start: 9.0, dur: 3.2, freqs: [146.83, 293.66, 349.23, 440.0] },
    { start: 12.2, dur: 2.8, freqs: [110, 220, 261.63, 329.63, 392.0] },
  ];
  for (const ch of padChords) {
    for (let idx = 0; idx < ch.freqs.length; idx++) {
      addNote(ch.start, ch.dur, ch.freqs[idx], 0.045, 'warm', idx % 2 === 0 ? -0.3 : 0.3);
    }
  }

  // Scene 1 (0.15s & 1.2s): Incoming phone ring double-chime
  addNote(0.18, 0.35, 659.25, 0.16, 'bell', -0.2);
  addNote(0.28, 0.4, 880.0, 0.18, 'bell', 0.2);
  addNote(1.35, 0.35, 659.25, 0.14, 'bell', -0.2);
  addNote(1.45, 0.4, 880.0, 0.16, 'bell', 0.2);

  // Scene 2 (2.85s): Missed call dull drop, then (3.65s) 0.5 sec Voxi bright mint pickup!
  addNote(2.85, 0.35, 185.0, 0.18, 'warm', 0);
  addNote(3.65, 0.28, 523.25, 0.2, 'bell', -0.2);
  addNote(3.75, 0.45, 783.99, 0.22, 'bell', 0.2);
  addNote(3.86, 0.55, 1046.5, 0.22, 'bell', 0);

  // Scene 3 (5.25s & 6.8s): Chat message pops
  addTick(5.4, 987.77, 0.16);
  addNote(6.6, 0.25, 587.33, 0.16, 'bell', -0.15);
  addNote(6.7, 0.38, 880.0, 0.18, 'bell', 0.15);

  // Scene 4 (9.05s): Lead captured confirmation triad + 3 niche card ticks
  addNote(9.05, 0.3, 523.25, 0.2, 'bell', -0.25);
  addNote(9.15, 0.35, 659.25, 0.2, 'bell', 0);
  addNote(9.26, 0.55, 783.99, 0.22, 'bell', 0.25);
  addNote(9.38, 0.7, 1046.5, 0.2, 'bell', 0);
  addTick(10.35, 1318.5, 0.14);
  addTick(10.65, 1567.98, 0.14);
  addTick(10.95, 1760.0, 0.15);

  // Scene 5 (12.25s): Final CTA reveal chord
  addNote(12.25, 1.4, 440.0, 0.15, 'bell', -0.3);
  addNote(12.33, 1.5, 523.25, 0.15, 'bell', 0.3);
  addNote(12.42, 1.6, 659.25, 0.17, 'bell', -0.15);
  addNote(12.52, 1.8, 880.0, 0.18, 'bell', 0.15);

  // Fade out last 0.45s
  const fadeSamples = Math.floor(0.45 * sampleRate);
  for (let i = 0; i < fadeSamples; i++) {
    const idx = numSamples - 1 - i;
    const gain = i / fadeSamples;
    left[idx] *= gain;
    right[idx] *= gain;
  }

  // Encode 16-bit PCM Stereo WAV
  const dataSize = numSamples * 4;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(2, 22); // 2 channels
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 4, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const l = Math.max(-0.96, Math.min(0.96, left[i]));
    const r = Math.max(-0.96, Math.min(0.96, right[i]));
    buf.writeInt16LE(Math.floor(l * 32767), offset);
    buf.writeInt16LE(Math.floor(r * 32767), offset + 2);
    offset += 4;
  }

  fs.writeFileSync(outputPath, buf);
}

/**
 * HTML template containing the deterministic 1080x1920 Canvas renderer
 */
const HTML_RENDERER = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { width: 1080px; height: 1920px; overflow: hidden; background: #FFFFFF; }
    canvas { display: block; width: 1080px; height: 1920px; }
  </style>
</head>
<body>
  <canvas id="stage" width="1080" height="1920"></canvas>
  <script>
    const WIDTH = 1080;
    const HEIGHT = 1920;
    const canvas = document.getElementById('stage');
    const ctx = canvas.getContext('2d');

    const SANS = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif';
    const MONO = '"SF Mono", Menlo, monospace';

    function clamp(v, min = 0, max = 1) {
      return Math.max(min, Math.min(max, v));
    }
    function easeOutCubic(x) {
      const t = clamp(x);
      return 1 - Math.pow(1 - t, 3);
    }
    function easeOutExpo(x) {
      const t = clamp(x);
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }
    function easeInOutCubic(x) {
      const t = clamp(x);
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    function springOut(x) {
      const t = clamp(x);
      if (t === 0 || t === 1) return t;
      return 1 - Math.exp(-6.5 * t) * Math.cos(11 * t);
    }

    function roundRect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
    }

    function fillRoundRect(x, y, w, h, r, color) {
      ctx.fillStyle = color;
      roundRect(x, y, w, h, r);
      ctx.fill();
    }

    function strokeRoundRect(x, y, w, h, r, color, lineWidth = 2) {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      roundRect(x, y, w, h, r);
      ctx.stroke();
    }

    // Draw the "Call -> Booking Check" brand icon
    function drawVoxiMark(x, y, size, bg = '#0A0A0A', barColor = '#FFFFFF', checkColor = '#6BFF91') {
      ctx.save();
      ctx.translate(x, y);
      const scale = size / 512;
      ctx.scale(scale, scale);

      fillRoundRect(0, 0, 512, 512, 120, bg);
      strokeRoundRect(2, 2, 508, 508, 118, 'rgba(255,255,255,0.14)', 6);

      fillRoundRect(104, 224, 38, 84, 19, barColor);
      fillRoundRect(168, 168, 38, 156, 19, barColor);

      ctx.beginPath();
      ctx.moveTo(236, 244);
      ctx.lineTo(294, 334);
      ctx.lineTo(406, 164);
      ctx.strokeStyle = checkColor;
      ctx.lineWidth = 44;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      ctx.restore();
    }

    function drawDotSurface(x, y, w, h, r = 0, bg = '#090909', dotColor = 'rgba(255,255,255,0.13)') {
      ctx.save();
      if (r > 0) {
        roundRect(x, y, w, h, r);
        ctx.clip();
      }
      ctx.fillStyle = bg;
      ctx.fillRect(x, y, w, h);

      ctx.fillStyle = dotColor;
      const step = 34;
      for (let gx = x + 18; gx < x + w; gx += step) {
        for (let gy = y + 18; gy < y + h; gy += step) {
          ctx.beginPath();
          ctx.arc(gx, gy, 1.7, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    function drawEditorialHeader(t, dark = false) {
      const fg = dark ? '#FFFFFF' : '#0A0A0A';
      const muted = dark ? 'rgba(255,255,255,0.55)' : '#737373';
      const line = dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';

      // Top brand bar
      drawVoxiMark(72, 92, 64, dark ? '#161616' : '#0A0A0A', '#FFFFFF', '#6BFF91');
      ctx.fillStyle = fg;
      ctx.font = \`800 44px \${SANS}\`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('voxi', 152, 125);
      const voxiW = ctx.measureText('voxi').width;
      ctx.fillStyle = dark ? '#6BFF91' : '#737373';
      ctx.fillText('.by', 152 + voxiW, 125);

      // Right status pill
      const pillW = 310;
      const pillX = WIDTH - 72 - pillW;
      fillRoundRect(pillX, 96, pillW, 56, 28, dark ? 'rgba(255,255,255,0.08)' : '#F5F5F5');
      strokeRoundRect(pillX, 96, pillW, 56, 28, line, 2);

      // Pulsing green dot
      const pulse = 0.65 + 0.35 * Math.sin(t * 8);
      ctx.fillStyle = \`rgba(107, 255, 145, \${pulse * 0.35})\`;
      ctx.beginPath();
      ctx.arc(pillX + 32, 124, 13, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#16A34A';
      ctx.beginPath();
      ctx.arc(pillX + 32, 124, 6.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = fg;
      ctx.font = \`600 20px \${MONO}\`;
      ctx.textAlign = 'left';
      ctx.fillText('24/7 · БЕЛАРУСЬ', pillX + 54, 125);

      // Hairline divider
      ctx.fillStyle = line;
      ctx.fillRect(72, 184, WIDTH - 144, 2);

      // Bottom progress bar
      const prog = clamp(t / ${DURATION_SEC});
      fillRoundRect(72, HEIGHT - 84, WIDTH - 144, 8, 4, dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)');
      fillRoundRect(72, HEIGHT - 84, (WIDTH - 144) * prog, 8, 4, '#6BFF91');
    }

    // SCENE 1 (0.0s - 2.8s): Hook — "Клиент звонит в 20:15. Кто ответит?"
    function renderScene1(t) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      drawEditorialHeader(t, false);

      // Mono eyebrow
      const p0 = easeOutCubic(t / 0.45);
      ctx.save();
      ctx.globalAlpha = p0;
      ctx.fillStyle = '#737373';
      ctx.font = \`600 22px \${MONO}\`;
      ctx.textAlign = 'left';
      ctx.fillText('01 · ПРОБЛЕМА БИЗНЕСА В РБ', 72, 255);
      ctx.restore();

      // Big Kinetic Display Headline
      const lines = [
        { text: 'Клиент звонит', delay: 0.08, color: '#0A0A0A' },
        { text: 'в 20:15.', delay: 0.22, color: '#0A0A0A' },
        { text: 'Кто ответит?', delay: 0.42, color: '#FE432A' },
      ];

      lines.forEach((ln, idx) => {
        const p = springOut((t - ln.delay) / 0.55);
        const a = easeOutCubic((t - ln.delay) / 0.35);
        ctx.save();
        ctx.globalAlpha = a;
        ctx.translate(0, (1 - p) * 70);
        ctx.fillStyle = ln.color;
        ctx.font = \`800 108px \${SANS}\`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(ln.text, 72, 310 + idx * 124);
        ctx.restore();
      });

      // Subheadline
      const pSub = easeOutCubic((t - 0.65) / 0.45);
      ctx.save();
      ctx.globalAlpha = pSub;
      ctx.fillStyle = '#525252';
      ctx.font = \`500 34px \${SANS}\`;
      ctx.fillText('Мастера в ремзоне. Администратор занят.', 72, 740);
      ctx.fillText('Каждый пропущенный звонок — потерянный заказ.', 72, 790);
      ctx.restore();

      // Incoming Call Dark Card with ringing vibration
      const cardP = springOut((t - 0.5) / 0.6);
      const cardA = easeOutCubic((t - 0.5) / 0.4);
      const shake = t > 1.1 ? Math.sin(t * 48) * 5 * Math.max(0, Math.sin(t * 4)) : 0;

      ctx.save();
      ctx.globalAlpha = cardA;
      ctx.translate(shake, (1 - cardP) * 110);

      drawDotSurface(72, 900, WIDTH - 144, 490, 44, '#090909');
      strokeRoundRect(72, 900, WIDTH - 144, 490, 44, 'rgba(255,255,255,0.14)', 2);

      // Incoming badge
      fillRoundRect(124, 956, 360, 52, 26, 'rgba(254, 67, 42, 0.18)');
      strokeRoundRect(124, 956, 360, 52, 26, '#FE432A', 2);
      ctx.fillStyle = '#FE432A';
      ctx.beginPath();
      ctx.arc(156, 982, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = \`700 20px \${MONO}\`;
      ctx.fillText('ВХОДЯЩИЙ ВЫЗОВ · 20:15', 180, 983);

      // Caller number
      ctx.fillStyle = '#FFFFFF';
      ctx.font = \`800 64px \${MONO}\`;
      ctx.fillText('+375 (29) 345-12-90', 124, 1085);

      ctx.fillStyle = 'rgba(255,255,255,0.68)';
      ctx.font = \`500 32px \${SANS}\`;
      ctx.fillText('Алексей · Запись на ТО и замену масла', 124, 1155);

      // Bottom status row inside card
      fillRoundRect(124, 1230, WIDTH - 248, 104, 28, 'rgba(255,255,255,0.07)');
      ctx.fillStyle = '#D8E738';
      ctx.font = \`700 28px \${MONO}\`;
      ctx.fillText('ОЖИДАЕМЫЙ ЧЕК: +120 BYN', 160, 1283);

      ctx.fillStyle = '#FE432A';
      ctx.textAlign = 'right';
      const rings = Math.min(5, 1 + Math.floor(t * 2));
      ctx.fillText(\`ГУДКИ (\${rings})...\`, WIDTH - 160, 1283);

      ctx.restore();

      // Bottom niche pills
      const niches = ['СТО и Автосервисы', 'Автошколы', 'Медцентры'];
      let nx = 72;
      niches.forEach((n, i) => {
        const np = easeOutCubic((t - 0.9 - i * 0.12) / 0.4);
        ctx.save();
        ctx.globalAlpha = np;
        ctx.font = \`600 26px \${SANS}\`;
        const w = ctx.measureText(n).width + 56;
        fillRoundRect(nx, 1450, w, 68, 34, '#F5F5F5');
        strokeRoundRect(nx, 1450, w, 68, 34, 'rgba(0,0,0,0.08)', 2);
        ctx.fillStyle = '#0A0A0A';
        ctx.textAlign = 'left';
        ctx.fillText(n, nx + 28, 1485);
        nx += w + 18;
        ctx.restore();
      });
    }

    // SCENE 2 (2.8s - 5.2s): Before vs After ("Пропущенный −120 BYN" vs "Voxi.by · 0.5 сек")
    function renderScene2(t) {
      const lt = t - 2.8;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      drawEditorialHeader(t, false);

      ctx.fillStyle = '#737373';
      ctx.font = \`600 22px \${MONO}\`;
      ctx.textAlign = 'left';
      ctx.fillText('02 · ДО И ПОСЛЕ ПОДКЛЮЧЕНИЯ VOXI.BY', 72, 250);

      // TOP CARD: WITHOUT VOXI (Missed Call)
      const p1 = springOut(lt / 0.45);
      ctx.save();
      ctx.translate(0, (1 - p1) * 60);
      fillRoundRect(72, 295, WIDTH - 144, 430, 40, '#F5F5F5');
      strokeRoundRect(72, 295, WIDTH - 144, 430, 40, 'rgba(0,0,0,0.08)', 2);

      ctx.font = \`700 20px \${MONO}\`;
      const tag1 = '✕ БЕЗ VOXI · ОБЫЧНАЯ ЛИНИЯ';
      const tag1W = ctx.measureText(tag1).width + 52;
      fillRoundRect(120, 342, tag1W, 48, 24, '#FEE2E2');
      ctx.fillStyle = '#B91C1C';
      ctx.fillText(tag1, 146, 367);

      ctx.fillStyle = '#0A0A0A';
      ctx.font = \`800 56px \${SANS}\`;
      ctx.fillText('Перезвон через 2 часа', 120, 460);

      ctx.fillStyle = '#525252';
      ctx.font = \`500 32px \${SANS}\`;
      ctx.fillText('Клиент не ждёт на гудках — он уже', 120, 530);
      ctx.fillText('записался в соседний сервис.', 120, 574);

      ctx.font = \`700 25px \${MONO}\`;
      const lossTxt = 'ПОТЕРЯ: −120 BYN С 1 ЗВОНКА';
      const lossW = ctx.measureText(lossTxt).width + 64;
      fillRoundRect(120, 620, lossW, 64, 32, '#FE432A');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(lossTxt, 152, 653);
      ctx.restore();

      // BOTTOM CARD: WITH VOXI (0.5 sec Dotted Obsidian Slam at lt = 0.65s)
      const p2 = springOut((lt - 0.55) / 0.55);
      const a2 = easeOutCubic((lt - 0.55) / 0.35);
      ctx.save();
      ctx.globalAlpha = a2;
      ctx.translate(0, (1 - p2) * 140);

      drawDotSurface(72, 770, WIDTH - 144, 830, 44, '#090909');
      strokeRoundRect(72, 770, WIDTH - 144, 830, 44, '#6BFF91', 3);

      // Neon Mint badge
      ctx.font = \`800 21px \${MONO}\`;
      const mintTag = '✓ С VOXI.BY · ИИ НА ЛИНИИ 24/7';
      const mintW = ctx.measureText(mintTag).width + 60;
      fillRoundRect(124, 830, mintW, 54, 27, '#6BFF91');
      ctx.fillStyle = '#0A0A0A';
      ctx.fillText(mintTag, 154, 858);

      // Giant 0.5 сек metric
      ctx.fillStyle = '#FFFFFF';
      ctx.font = \`800 186px \${SANS}\`;
      ctx.fillText('0.5 сек', 120, 1045);

      ctx.fillStyle = '#6BFF91';
      ctx.font = \`700 42px \${SANS}\`;
      ctx.fillText('Мгновенный ответ с первого гудка', 124, 1155);

      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.font = \`500 32px \${SANS}\`;
      ctx.fillText('Живой голос Yandex SpeechKit · Понимает', 124, 1230);
      ctx.fillText('белорусский контекст, цены в BYN и адреса.', 124, 1276);

      // Bottom telephony pills inside dark card
      const ops = ['А1 ВАТС', 'МТС', 'Unitalk', 'Белтелеком'];
      let ox = 124;
      ops.forEach((op) => {
        ctx.font = \`700 24px \${MONO}\`;
        const w = ctx.measureText(op).width + 48;
        fillRoundRect(ox, 1360, w, 64, 32, 'rgba(255,255,255,0.1)');
        strokeRoundRect(ox, 1360, w, 64, 32, 'rgba(255,255,255,0.18)', 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(op, ox + 24, 1393);
        ox += w + 16;
      });

      fillRoundRect(124, 1460, WIDTH - 248, 84, 24, '#1C3B36');
      ctx.fillStyle = '#6BFF91';
      ctx.font = \`700 28px \${MONO}\`;
      ctx.fillText('100% ЗВОНКОВ ПРИНЯТО · 0 ПРОПУЩЕННЫХ', 164, 1503);

      ctx.restore();
    }

    // SCENE 3 (5.2s - 9.0s): Live Voice Call + Waveform + Chat Dialogue
    function renderScene3(t) {
      const lt = t - 5.2;
      drawDotSurface(0, 0, WIDTH, HEIGHT, 0, '#090909');
      drawEditorialHeader(t, true);

      // Eyebrow
      ctx.fillStyle = '#6BFF91';
      ctx.font = \`700 22px \${MONO}\`;
      ctx.textAlign = 'left';
      ctx.fillText('03 · ЖИВОЙ ПРИМЕР ЗВОНКА · СТО «АВТОРИТЕТ МИНСК»', 72, 250);

      // Top Voice Visualizer Card
      fillRoundRect(72, 295, WIDTH - 144, 330, 40, '#141414');
      strokeRoundRect(72, 295, WIDTH - 144, 330, 40, 'rgba(255,255,255,0.14)', 2);

      drawVoxiMark(120, 343, 88, '#0A0A0A', '#FFFFFF', '#6BFF91');
      ctx.fillStyle = '#FFFFFF';
      ctx.font = \`800 38px \${SANS}\`;
      ctx.fillText('Анна · ИИ-администратор Voxi', 234, 372);

      ctx.fillStyle = '#6BFF91';
      ctx.font = \`600 22px \${MONO}\`;
      const callSec = (1 + Math.floor(lt * 2.5)).toString().padStart(2, '0');
      ctx.fillText(\`● В ЭФИРЕ · 00:\${callSec} · ЗАДЕРЖКА 0.5 СЕК\`, 234, 414);

      // 28 Animated Waveform Bars
      const numBars = 28;
      const barW = 16;
      const gap = 14;
      const totalBarW = numBars * barW + (numBars - 1) * gap;
      const startX = (WIDTH - totalBarW) / 2;
      const centerY = 528;

      for (let i = 0; i < numBars; i++) {
        const wave1 = Math.sin(t * 14 + i * 0.55);
        const wave2 = Math.cos(t * 9 - i * 0.35);
        const env = Math.sin((i / (numBars - 1)) * Math.PI);
        const h = 22 + Math.abs(wave1 * 0.6 + wave2 * 0.4) * 96 * env;
        const isMint = i % 3 !== 0;
        fillRoundRect(
          startX + i * (barW + gap),
          centerY - h / 2,
          barW,
          h,
          8,
          isMint ? '#6BFF91' : '#FFFFFF'
        );
      }

      // Message 1: Caller Bubble
      const m1P = springOut((lt - 0.15) / 0.5);
      const m1A = easeOutCubic((lt - 0.15) / 0.35);
      ctx.save();
      ctx.globalAlpha = m1A;
      ctx.translate(0, (1 - m1P) * 70);

      fillRoundRect(72, 675, WIDTH - 200, 290, 36, '#1B1B1B');
      strokeRoundRect(72, 675, WIDTH - 200, 290, 36, 'rgba(255,255,255,0.14)', 2);

      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = \`600 20px \${MONO}\`;
      ctx.fillText('КЛИЕНТ (АЛЕКСЕЙ) · 00:02', 120, 730);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = \`600 36px \${SANS}\`;
      ctx.fillText('«Добрый вечер! Нужно заменить масло', 120, 795);
      ctx.fillText('и проверить подвеску на Passat B8', 120, 845);
      ctx.fillText('завтра утром. Есть окно?»', 120, 895);
      ctx.restore();

      // Message 2: Voxi AI Bubble (Pure White + Neon Mint Tag)
      const m2P = springOut((lt - 1.25) / 0.55);
      const m2A = easeOutCubic((lt - 1.25) / 0.35);
      ctx.save();
      ctx.globalAlpha = m2A;
      ctx.translate(0, (1 - m2P) * 90);

      fillRoundRect(128, 1015, WIDTH - 200, 410, 36, '#FFFFFF');

      ctx.font = \`700 19px \${MONO}\`;
      const aiTag = '● VOXI ИИ · СВЕРКА С КАЛЕНДАРЁМ';
      const aiTagW = ctx.measureText(aiTag).width + 52;
      fillRoundRect(176, 1060, aiTagW, 46, 23, '#0A0A0A');
      ctx.fillStyle = '#6BFF91';
      ctx.fillText(aiTag, 202, 1084);

      ctx.fillStyle = '#0A0A0A';
      ctx.font = \`700 36px \${SANS}\`;
      ctx.fillText('«Да, Алексей! На завтра свободно окно', 176, 1165);
      ctx.fillText('в 10:30 утра. Комплекс выйдет 120 BYN.', 176, 1215);
      ctx.fillText('Записала вас и отправила SMS с адресом!»', 176, 1265);

      // Action chips inside AI bubble
      ctx.font = \`800 21px \${MONO}\`;
      const chip1 = '✓ СЛОТ 10:30 БРОНЬ';
      const chip1W = ctx.measureText(chip1).width + 48;
      fillRoundRect(176, 1320, chip1W, 58, 29, '#6BFF91');
      ctx.fillStyle = '#0A0A0A';
      ctx.fillText(chip1, 200, 1350);

      const chip2 = '✓ SMS ОТПРАВЛЕНО';
      const chip2W = ctx.measureText(chip2).width + 48;
      fillRoundRect(176 + chip1W + 16, 1320, chip2W, 58, 29, '#D8E738');
      ctx.fillStyle = '#0A0A0A';
      ctx.fillText(chip2, 176 + chip1W + 40, 1350);

      ctx.restore();

      // Bottom live speed bar
      const bA = easeOutCubic((lt - 1.9) / 0.4);
      ctx.save();
      ctx.globalAlpha = bA;
      fillRoundRect(72, 1480, WIDTH - 144, 110, 30, '#1C3B36');
      ctx.fillStyle = '#6BFF91';
      ctx.font = \`700 28px \${MONO}\`;
      ctx.textAlign = 'center';
      ctx.fillText('ЗАЯВКА МГНОВЕННО УЛЕТАЕТ В TELEGRAM И CRM ↗', WIDTH / 2, 1536);
      ctx.restore();
    }

    // SCENE 4 (9.0s - 12.2s): Ready Lead Card + 3 Niche / Integration Cards
    function renderScene4(t) {
      const lt = t - 9.0;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      drawEditorialHeader(t, false);

      ctx.fillStyle = '#737373';
      ctx.font = \`600 22px \${MONO}\`;
      ctx.textAlign = 'left';
      ctx.fillText('04 · ГОТОВАЯ КАРТОЧКА ЛИДА ЗА 1 СЕКУНДУ', 72, 250);

      // Headline
      const hP = springOut(lt / 0.45);
      ctx.save();
      ctx.translate(0, (1 - hP) * 50);
      ctx.fillStyle = '#0A0A0A';
      ctx.font = \`800 72px \${SANS}\`;
      ctx.fillText('Живой звонок →', 72, 345);
      ctx.fillText('Готовая запись в CRM', 72, 430);
      ctx.restore();

      // Lead Card (Obsidian + White + Acid Lime)
      const cP = springOut((lt - 0.15) / 0.55);
      ctx.save();
      ctx.translate(0, (1 - cP) * 80);

      fillRoundRect(72, 495, WIDTH - 144, 540, 40, '#F5F5F5');
      strokeRoundRect(72, 495, WIDTH - 144, 540, 40, 'rgba(0,0,0,0.1)', 2);

      // Lead header
      drawVoxiMark(120, 545, 84, '#0A0A0A', '#FFFFFF', '#6BFF91');
      ctx.fillStyle = '#0A0A0A';
      ctx.font = \`800 42px \${SANS}\`;
      ctx.fillText('Алексей (VW Passat B8)', 228, 572);

      ctx.fillStyle = '#525252';
      ctx.font = \`600 28px \${MONO}\`;
      ctx.fillText('+375 (29) 345-12-90', 228, 616);

      // Status pill right
      fillRoundRect(WIDTH - 340, 552, 220, 56, 28, '#6BFF91');
      ctx.fillStyle = '#0A0A0A';
      ctx.font = \`800 22px \${MONO}\`;
      ctx.textAlign = 'center';
      ctx.fillText('✓ ЗАПИСАН', WIDTH - 230, 581);

      // 3 data tiles inside lead card
      ctx.textAlign = 'left';
      fillRoundRect(120, 670, WIDTH - 240, 145, 26, '#FFFFFF');
      strokeRoundRect(120, 670, WIDTH - 240, 145, 26, 'rgba(0,0,0,0.07)', 2);
      ctx.fillStyle = '#737373';
      ctx.font = \`600 19px \${MONO}\`;
      ctx.fillText('ВЫБРАННАЯ УСЛУГА И ВРЕМЯ ЗАПИСИ', 156, 716);
      ctx.fillStyle = '#0A0A0A';
      ctx.font = \`700 29px \${SANS}\`;
      ctx.fillText('Диагностика подвески + замена масла · Завтра 10:30', 156, 770);

      // Bottom row of lead card: Telegram + BYN Value
      fillRoundRect(120, 845, 510, 140, 26, '#0A0A0A');
      ctx.fillStyle = '#6BFF91';
      ctx.font = \`700 20px \${MONO}\`;
      ctx.fillText('● ДОСТАВЛЕНО ЗА 1 СЕК', 156, 895);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = \`700 32px \${SANS}\`;
      ctx.fillText('Telegram + YCLIENTS + SMS', 156, 945);

      fillRoundRect(654, 845, 306, 140, 26, '#D8E738');
      ctx.fillStyle = '#0A0A0A';
      ctx.font = \`700 20px \${MONO}\`;
      ctx.fillText('СУММА ЗАКАЗА', 690, 895);
      ctx.font = \`800 52px \${MONO}\`;
      ctx.fillText('+120 BYN', 690, 952);

      ctx.restore();

      // 3 Cascading Niche / Value Cards below
      const cards = [
        {
          delay: 1.15,
          bg: '#1C3B36',
          fg: '#FFFFFF',
          accent: '#6BFF91',
          tag: '01 · АВТОБИЗНЕС И СТО',
          title: 'Запись на ТО и шиномонтаж, пока мастера в ремзоне',
        },
        {
          delay: 1.45,
          bg: '#0225AC',
          fg: '#FFFFFF',
          accent: '#6BFF91',
          tag: '02 · КЛИНИКИ И АВТОШКОЛЫ',
          title: 'Подбор врача, запись на пробное занятие 24/7',
        },
        {
          delay: 1.75,
          bg: '#D8E738',
          fg: '#0A0A0A',
          accent: '#0A0A0A',
          tag: '03 · ТЕЛЕФОНИЯ БЕЛАРУСИ',
          title: 'А1 · МТС · Unitalk · Белтелеком — запуск за 5 минут',
        },
      ];

      cards.forEach((c, idx) => {
        const cp = springOut((lt - c.delay) / 0.45);
        const ca = easeOutCubic((lt - c.delay) / 0.3);
        const y = 1075 + idx * 178;
        ctx.save();
        ctx.globalAlpha = ca;
        ctx.translate((1 - cp) * 90, 0);
        fillRoundRect(72, y, WIDTH - 144, 156, 32, c.bg);

        ctx.fillStyle = c.accent;
        ctx.font = \`700 20px \${MONO}\`;
        ctx.fillText(c.tag, 120, y + 48);

        ctx.fillStyle = c.fg;
        ctx.font = \`700 32px \${SANS}\`;
        ctx.fillText(c.title, 120, y + 104);
        ctx.restore();
      });
    }

    // SCENE 5 (12.2s - 15.0s): Final CTA & Offer
    function renderScene5(t) {
      const lt = t - 12.2;
      drawDotSurface(0, 0, WIDTH, HEIGHT, 0, '#090909');
      drawEditorialHeader(t, true);

      // Center large logo mark
      const lP = springOut(lt / 0.55);
      ctx.save();
      ctx.translate(WIDTH / 2, 390);
      ctx.scale(lP, lP);
      drawVoxiMark(-110, -110, 220, '#161616', '#FFFFFF', '#6BFF91');
      ctx.restore();

      // Acid Lime Tariff Pill
      const pPill = springOut((lt - 0.15) / 0.5);
      ctx.save();
      ctx.globalAlpha = easeOutCubic((lt - 0.15) / 0.35);
      ctx.translate(0, (1 - pPill) * 40);
      fillRoundRect(210, 550, WIDTH - 420, 68, 34, '#D8E738');
      ctx.fillStyle = '#0A0A0A';
      ctx.font = \`800 25px \${MONO}\`;
      ctx.textAlign = 'center';
      ctx.fillText('ТАРИФ 0.45 BYN/МИН · АБОНПЛАТА 0 BYN', WIDTH / 2, 585);
      ctx.restore();

      // Big Closing Headline
      const h1P = springOut((lt - 0.25) / 0.55);
      ctx.save();
      ctx.translate(0, (1 - h1P) * 70);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = \`800 104px \${SANS}\`;
      ctx.fillText('0 пропущенных.', WIDTH / 2, 740);
      ctx.fillStyle = '#6BFF91';
      ctx.fillText('Запись 24/7.', WIDTH / 2, 860);
      ctx.restore();

      ctx.fillStyle = 'rgba(255,255,255,0.72)';
      ctx.font = \`500 36px \${SANS}\`;
      ctx.textAlign = 'center';
      ctx.fillText('Голосовой ИИ-администратор для бизнеса в Беларуси', WIDTH / 2, 975);

      // 3 Benefit Checklist Rows
      const perks = [
        '15 бесплатных минут диалогов сразу после регистрации',
        'Не нужна привязка банковской карты на старте',
        'Оплата в BYN: Карта (bePaid) и система «Расчёт» (ЕРИП)',
      ];
      perks.forEach((pk, idx) => {
        const pp = easeOutCubic((lt - 0.45 - idx * 0.12) / 0.35);
        const y = 1060 + idx * 86;
        ctx.save();
        ctx.globalAlpha = pp;
        fillRoundRect(110, y, WIDTH - 220, 70, 22, 'rgba(255,255,255,0.07)');
        ctx.fillStyle = '#6BFF91';
        ctx.font = \`800 28px \${MONO}\`;
        ctx.textAlign = 'left';
        ctx.fillText('✓', 148, y + 37);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = \`600 28px \${SANS}\`;
        ctx.fillText(pk, 192, y + 37);
        ctx.restore();
      });

      // Giant Neon Mint Primary CTA Button with pulse
      const ctaP = springOut((lt - 0.7) / 0.55);
      const pulseScale = 1 + 0.015 * Math.sin(t * 9);
      ctx.save();
      ctx.translate(WIDTH / 2, 1455);
      ctx.scale(ctaP * pulseScale, ctaP * pulseScale);

      fillRoundRect(-430, -68, 860, 136, 68, '#6BFF91');
      ctx.fillStyle = '#0A0A0A';
      ctx.font = \`800 44px \${SANS}\`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('voxi.by · Попробовать +15 мин ↗', 0, 0);
      ctx.restore();

      // Footer legal line
      ctx.fillStyle = 'rgba(255,255,255,0.48)';
      ctx.font = \`600 21px \${MONO}\`;
      ctx.textAlign = 'center';
      ctx.fillText('ЗАКОН РБ № 99-З · ИП БЕЛЯКОВ К. О. · УНП 193991846', WIDTH / 2, 1625);
    }

    window.renderFrameAt = function(frameIndex) {
      const t = frameIndex / ${FPS};
      ctx.textBaseline = 'middle';

      if (t < 2.8) {
        renderScene1(t);
      } else if (t < 5.2) {
        renderScene2(t);
      } else if (t < 9.0) {
        renderScene3(t);
      } else if (t < 12.2) {
        renderScene4(t);
      } else {
        renderScene5(t);
      }

      // Smooth 0.18s flash/cut transition at scene boundaries
      const boundaries = [2.8, 5.2, 9.0, 12.2];
      for (const b of boundaries) {
        const dist = Math.abs(t - b);
        if (dist < 0.09) {
          const alpha = (1 - dist / 0.09) * 0.25;
          ctx.fillStyle = \`rgba(107, 255, 145, \${alpha})\`;
          ctx.fillRect(0, 0, WIDTH, HEIGHT);
        }
      }

      return canvas.toDataURL('image/jpeg', 0.94);
    };
  </script>
</body>
</html>`;

async function main() {
  console.log('🎵 [1/3] Генерация синхронизированной аудиодорожки (15 сек, 44.1kHz Stereo WAV)...');
  generateSyncedWav(TMP_WAV);

  console.log('🎬 [2/3] Запуск Chrome и рендеринг 450 кадров (1080×1920, 30 FPS) в FFmpeg...');
  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });
  await page.setContent(HTML_RENDERER);

  const ffmpeg = spawn(
    '/opt/homebrew/bin/ffmpeg',
    [
      '-y',
      '-f', 'image2pipe',
      '-vcodec', 'mjpeg',
      '-framerate', String(FPS),
      '-i', '-',
      '-i', TMP_WAV,
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '18',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-shortest',
      '-movflags', '+faststart',
      PUBLIC_MP4,
    ],
    { stdio: ['pipe', 'inherit', 'inherit'] }
  );

  const previewFrames = new Map([
    [45, 'voxi-reel-scene1-hook.jpg'],
    [130, 'voxi-reel-scene2-05sec.jpg'],
    [235, 'voxi-reel-scene3-dialogue.jpg'],
    [340, 'voxi-reel-scene4-lead.jpg'],
    [420, 'voxi-reel-scene5-cta.jpg'],
  ]);

  for (let f = 0; f < TOTAL_FRAMES; f++) {
    const dataUrl = await page.evaluate((idx) => window.renderFrameAt(idx), f);
    const base64 = dataUrl.slice('data:image/jpeg;base64,'.length);
    const buf = Buffer.from(base64, 'base64');

    if (previewFrames.has(f)) {
      const fname = previewFrames.get(f);
      fs.writeFileSync(path.join(ARTIFACT_DIR, fname), buf);
    }

    const canContinue = ffmpeg.stdin.write(buf);
    if (!canContinue) {
      await new Promise((resolve) => ffmpeg.stdin.once('drain', resolve));
    }
  }

  ffmpeg.stdin.end();
  await new Promise((resolve, reject) => {
    ffmpeg.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`FFmpeg exited ${code}`))));
  });

  await browser.close();
  if (fs.existsSync(TMP_WAV)) fs.unlinkSync(TMP_WAV);

  fs.copyFileSync(PUBLIC_MP4, ARTIFACT_MP4);
  const stat = fs.statSync(PUBLIC_MP4);
  console.log(`✅ [3/3] Готово! Ролик сохранён: ${PUBLIC_MP4} (${(stat.size / (1024 * 1024)).toFixed(2)} MB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
