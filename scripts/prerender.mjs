import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '../dist');

const ROUTES = [
  {
    path: '/',
    outputPath: path.join(DIST_DIR, 'index.html'),
    title: 'Voxi.by — Голосовой ИИ-администратор для бизнеса в Беларуси',
    description:
      'Voxi.by — платформа создания голосовых ИИ-администраторов за 5 минут для автошкол, СТО, клиник и салонов Беларуси. 0 BYN абонплата, оплата за минуты через ЕРИП и bePaid, 0 пропущенных звонков.',
    canonical: 'https://voxi.by/',
    ogTitle: 'Voxi.by — Голосовой ИИ-администратор для бизнеса в Беларуси',
    ogDescription:
      'Голосовой телефонный ассистент 24/7 с откликом 0.5 сек на базе Yandex SpeechKit. Интеграция с МТС, А1, YCLIENTS и Telegram. Поминутная оплата в BYN через ЕРИП и bePaid.',
  },
  {
    path: '/offer',
    outputPath: path.join(DIST_DIR, 'offer/index.html'),
    title: 'Публичный договор (оферта) — Voxi.by',
    description:
      'Официальный публичный договор возмездного оказания услуг платформы Voxi.by (ст. 396, 405 ГК РБ). ИП Беляков К. О., УНП 193991846. Порядок расчетов через bePaid и ЕРИП.',
    canonical: 'https://voxi.by/offer',
    ogTitle: 'Публичный договор (оферта) — Voxi.by',
    ogDescription:
      'Официальный публичный договор (оферта) возмездного оказания услуг голосового ИИ-администратора Voxi.by. ИП Беляков К. О., УНП 193991846.',
  },
  {
    path: '/privacy',
    outputPath: path.join(DIST_DIR, 'privacy/index.html'),
    title: 'Политика конфиденциальности (Закон РБ № 99-З) — Voxi.by',
    description:
      'Политика обработки персональных данных клиентов Voxi.by во исполнение Закона Республики Беларусь от 07.05.2021 № 99-З. Оператор: ИП Беляков К. О.',
    canonical: 'https://voxi.by/privacy',
    ogTitle: 'Политика обработки персональных данных — Voxi.by',
    ogDescription:
      'Политика конфиденциальности Voxi.by в соответствии с Законом Республики Беларусь № 99-З «О защите персональных данных». Защита записей вызовов и изоляция аккаунтов.',
  },
  {
    path: '/sla',
    outputPath: path.join(DIST_DIR, 'sla/index.html'),
    title: 'Соглашение об уровне сервиса (SLA 99.9%) — Voxi.by',
    description:
      'Соглашение об уровне качества обслуживания (SLA 99.9%) Voxi.by: 99.9% uptime, задержка голосового отклика 0.5 сек, автоматический SIP Failover на операторов РБ.',
    canonical: 'https://voxi.by/sla',
    ogTitle: 'Соглашение об уровне сервиса (SLA 99.9%) — Voxi.by',
    ogDescription:
      'Регламент доступности сервиса Voxi.by: 99.9% uptime, задержка отклика 450–650 мс, резервное перенаправление на номера администратора.',
  },
];

const MIME_MAP = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function findChromePath() {
  const candidates = [
    process.env.CHROME_PATH,
    process.env.PUPPETEER_EXECUTABLE_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ].filter(Boolean);

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

function startStaticServer(baseDir) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const parsedUrl = new URL(req.url || '/', 'http://localhost');
        let pathname = decodeURIComponent(parsedUrl.pathname);

        // Security check
        const targetPath = path.normalize(path.join(baseDir, pathname));
        if (!targetPath.startsWith(baseDir)) {
          res.statusCode = 403;
          res.end('Forbidden');
          return;
        }

        let filePath = targetPath;
        let isFile = fs.existsSync(filePath) && fs.statSync(filePath).isFile();

        // If directory, check index.html
        if (!isFile && fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
          const tryIndex = path.join(filePath, 'index.html');
          if (fs.existsSync(tryIndex)) {
            filePath = tryIndex;
            isFile = true;
          }
        }

        // SPA fallback: any route without extension serves original index.html
        if (!isFile) {
          const originalIndex = path.join(baseDir, 'index.html');
          if (fs.existsSync(originalIndex)) {
            filePath = originalIndex;
            isFile = true;
          }
        }

        if (!isFile) {
          res.statusCode = 404;
          res.end('Not found');
          return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_MAP[ext] || 'application/octet-stream';
        const content = fs.readFileSync(filePath);

        res.writeHead(200, {
          'Content-Type': contentType,
          'Content-Length': content.length,
          'Access-Control-Allow-Origin': '*',
        });
        res.end(content);
      } catch (err) {
        res.statusCode = 500;
        res.end(String(err));
      }
    });

    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      resolve({
        server,
        port,
        close: () => new Promise((res) => server.close(res)),
      });
    });

    server.on('error', reject);
  });
}

function patchMetadata(html, routeConfig) {
  let patched = html;

  // Replace title
  if (routeConfig.title) {
    patched = patched.replace(/<title>[\s\S]*?<\/title>/i, `<title>${routeConfig.title}</title>`);
  }

  // Replace description
  if (routeConfig.description) {
    patched = patched.replace(
      /<meta\s+name=["']description["']\s+content=["'][\s\S]*?["']\s*\/?>/i,
      `<meta name="description" content="${routeConfig.description}" />`
    );
  }

  // Replace canonical
  if (routeConfig.canonical) {
    patched = patched.replace(
      /<link\s+rel=["']canonical["']\s+href=["'][\s\S]*?["']\s*\/?>/i,
      `<link rel="canonical" href="${routeConfig.canonical}" />`
    );
  }

  // Replace og:title
  if (routeConfig.ogTitle) {
    patched = patched.replace(
      /<meta\s+property=["']og:title["']\s+content=["'][\s\S]*?["']\s*\/?>/i,
      `<meta property="og:title" content="${routeConfig.ogTitle}" />`
    );
    patched = patched.replace(
      /<meta\s+name=["']twitter:title["']\s+content=["'][\s\S]*?["']\s*\/?>/i,
      `<meta name="twitter:title" content="${routeConfig.ogTitle}" />`
    );
  }

  // Replace og:description
  if (routeConfig.ogDescription) {
    patched = patched.replace(
      /<meta\s+property=["']og:description["']\s+content=["'][\s\S]*?["']\s*\/?>/i,
      `<meta property="og:description" content="${routeConfig.ogDescription}" />`
    );
    patched = patched.replace(
      /<meta\s+name=["']twitter:description["']\s+content=["'][\s\S]*?["']\s*\/?>/i,
      `<meta name="twitter:description" content="${routeConfig.ogDescription}" />`
    );
  }

  // Replace og:url
  if (routeConfig.canonical) {
    patched = patched.replace(
      /<meta\s+property=["']og:url["']\s+content=["'][\s\S]*?["']\s*\/?>/i,
      `<meta property="og:url" content="${routeConfig.canonical}" />`
    );
  }

  return patched;
}

async function runPrerender() {
  console.log('🚀 [SSG Prerender] Запуск статического пререндеринга Voxi.by...');

  if (!fs.existsSync(DIST_DIR) || !fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
    throw new Error(`Папка сборки ${DIST_DIR} не найдена. Сначала выполните 'vite build'.`);
  }

  const chromePath = findChromePath();
  if (!chromePath) {
    console.warn('⚠️ [SSG Prerender] Google Chrome / Chromium не найден на этой машине.');
    console.warn('   Пропускаем этап SSG, оставляем SPA-сборку.');
    return;
  }
  console.log(`ℹ️ [SSG Prerender] Используем Chrome: ${chromePath}`);

  // 1. Запуск локального сервера
  const staticServer = await startStaticServer(DIST_DIR);
  console.log(`📡 [SSG Prerender] Локальный сервер запущен на http://127.0.0.1:${staticServer.port}`);

  // 2. Запуск Puppeteer
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1280,800',
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    for (const route of ROUTES) {
      const url = `http://127.0.0.1:${staticServer.port}${route.path}`;
      const startTime = Date.now();
      process.stdout.write(`  ⏳ Рендеринг маршрута ${route.path.padEnd(10)} -> `);

      await page.goto(url, { waitUntil: ['domcontentloaded', 'networkidle2'], timeout: 20000 });

      // Ожидание монтирования React-приложения в контейнер #root
      await page.waitForSelector('#root > *', { timeout: 10000 });

      // Небольшая задержка для завершения анимаций и расчётов разметки
      await new Promise((r) => setTimeout(r, 400));

      const rawHtml = await page.content();
      const finalHtml = patchMetadata(rawHtml, route);

      // Создаем директорию назначения, если нужно
      const targetDir = path.dirname(route.outputPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      fs.writeFileSync(route.outputPath, finalHtml, 'utf-8');
      const sizeKb = (Buffer.byteLength(finalHtml, 'utf-8') / 1024).toFixed(1);
      const elapsed = Date.now() - startTime;
      console.log(`✅ ${route.outputPath.replace(DIST_DIR, 'dist')} (${sizeKb} KB, ${elapsed} ms)`);
    }

    await page.close();
    console.log('🎉 [SSG Prerender] Пререндеринг всех страниц успешно завершён!');
  } finally {
    await browser.close();
    await staticServer.close();
  }
}

runPrerender().catch((err) => {
  console.error('❌ [SSG Prerender] Ошибка во время пререндеринга:', err);
  process.exit(1);
});
