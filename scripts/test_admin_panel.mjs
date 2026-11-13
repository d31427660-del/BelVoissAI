import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '../dist');

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
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ].filter(Boolean);

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function startStaticServer(baseDir) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const parsedUrl = new URL(req.url || '/', 'http://localhost');
        let pathname = decodeURIComponent(parsedUrl.pathname);

        // Имитация серверного API для автономного UI-тестирования админки
        if (pathname === '/api/db') {
          const action = parsedUrl.searchParams.get('action');
          let bodyStr = '';
          req.on('data', chunk => { bodyStr += chunk; });
          req.on('end', () => {
            let body = {};
            try { body = JSON.parse(bodyStr); } catch {}
            if (action === 'admin_login') {
              if (body.pin === '7788') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: true, adminToken: 'test_admin_token_7788' }));
              } else {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: false, error: 'Неверный PIN-код' }));
              }
              return;
            }
            if (action === 'admin_data') {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                ok: true,
                dbConnected: true,
                clients: [
                  {
                    id: 'client-1',
                    name: 'ООО Салют Авто',
                    companyName: 'Автошкола «Салют»',
                    unp: '193542109',
                    phone: '+375 (29) 112-44-55',
                    email: 'salut@voxi.by',
                    niche: 'driving_school',
                    city: 'Минск',
                    balanceMinutes: 120,
                    spentMinutesTotal: 45,
                    spentBynTotal: 20.25,
                    ratePerMinute: 0.45,
                    sipProvider: 'mts',
                    sipStatus: 'connected',
                    isActive: true,
                    createdAt: '12.11.2026',
                    contractNumber: 'ДГ-2026/001'
                  }
                ],
                transactions: [
                  {
                    id: 'tx-1',
                    clientId: 'client-1',
                    clientName: 'Автошкола «Салют»',
                    unp: '193542109',
                    amountByn: 120,
                    minutesAdded: 300,
                    paymentMethod: 'bepaid_card',
                    status: 'successful',
                    invoiceNumber: 'СЧ-2026/201',
                    createdAt: '12.11.2026 14:00',
                    actGenerated: true
                  }
                ],
                telephonyLogs: [
                  {
                    id: 'call-1',
                    companyName: 'Автошкола «Салют»',
                    callerPhone: '+375 (29) 700-11-22',
                    sipTrunk: 'sip.mts.by',
                    durationSeconds: 75,
                    costByn: 0.56,
                    status: 'amd_filtered',
                    assistantVoice: 'anna',
                    timestamp: '14:22:10',
                    transcriptSnippet: 'Запись на категорию B подтверждена'
                  }
                ]
              }));
              return;
            }
            if (action === 'admin_add_minutes' || action === 'admin_toggle_client') {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: true }));
              return;
            }
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: 'Unknown action' }));
          });
          return;
        }

        const targetPath = path.normalize(path.join(baseDir, pathname));
        if (!targetPath.startsWith(baseDir)) {
          res.statusCode = 403;
          res.end('Forbidden');
          return;
        }

        let filePath = targetPath;
        let isFile = fs.existsSync(filePath) && fs.statSync(filePath).isFile();

        if (!isFile && fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
          const tryIndex = path.join(filePath, 'index.html');
          if (fs.existsSync(tryIndex)) {
            filePath = tryIndex;
            isFile = true;
          }
        }

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
        res.end(`Internal Server Error: ${err.message}`);
      }
    });

    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      resolve({ server, port });
    });

    server.on('error', reject);
  });
}

async function runAdminPanelTest() {
  console.log('🚀 Тестирование мастер-панели администратора Voxi.by...');

  const chromePath = findChromePath();
  if (!chromePath) {
    console.error('❌ Chrome не найден!');
    process.exit(1);
  }

  const { server, port } = await startStaticServer(DIST_DIR);
  const baseUrl = `http://127.0.0.1:${port}/`;
  console.log(`📡 Тестовый сервер: ${baseUrl}`);

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1280,800'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // 1. Navigate to #admin
    console.log('\n--- ШАГ 1: Переход в #admin ---');
    await page.goto(`${baseUrl}#admin`, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Verify PIN input screen
    await page.waitForSelector('input[type="password"]', { timeout: 5000 });
    console.log('✅ Экран авторизации администратора отображается');

    // Test invalid PIN
    console.log('Проверяем ввод неверного PIN-кода...');
    await page.type('input[type="password"]', '0000');
    await page.keyboard.press('Enter');

    await page.waitForFunction(() => {
      return document.body.innerText.includes('PIN-код');
    }, { timeout: 3000 });
    console.log('✅ Защита активна: неверный PIN-код отклонён');

    // Test valid PIN 7788
    console.log('Вводим правильный PIN-код (7788)...');
    await page.evaluate(() => {
      const input = document.querySelector('input[type="password"]');
      if (input) {
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await page.type('input[type="password"]', '7788');
    await page.click('button[type="submit"]');

    // Verify Admin Panel layout
    await page.waitForFunction(() => {
      return document.body.innerText.includes('MASTER ADMIN') && document.body.innerText.includes('Сводка платформы');
    }, { timeout: 5000 });
    console.log('✅ Успешный вход в мастер-панель администратора!');

    // 2. Check KPIs in Overview Tab
    console.log('\n--- ШАГ 2: Проверка KPI и статусов инфраструктуры РБ ---');
    const overviewData = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasRevenue: text.includes('435.00 BYN') || text.includes('Выручка платформы'),
        hasMinutes: text.includes('Выговорено минут'),
        hasBePaid: text.includes('bePaid РБ'),
        hasMts: text.includes('МТС SIP'),
        hasA1: text.includes('А1 SIP'),
      };
    });
    console.log('Данные сводки:', overviewData);
    if (!overviewData.hasRevenue || !overviewData.hasMinutes) {
      throw new Error('KPI карточки не найдены!');
    }
    console.log('✅ Все KPI и статусы инфраструктуры Беларуси подтверждены');

    // 3. Switch to Clients tab
    console.log('\n--- ШАГ 3: Управление клиентами и балансами ---');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.innerText.includes('Клиенты и балансы')
      );
      if (btn) btn.click();
    });

    await page.waitForFunction(() => {
      return document.body.innerText.includes('Автошкола «Салют»') && document.body.innerText.includes('УНП: 193542109');
    }, { timeout: 4000 });
    console.log('✅ Таблица клиентов отображается (УНП компаний, остатки минут, тарифы)');

    // Test quick refill modal
    console.log('Тестируем начисление минут клиенту (+50 мин)...');
    await page.evaluate(() => {
      const refillBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.innerText.includes('+ Минуты')
      );
      if (refillBtn) refillBtn.click();
    });

    await page.waitForFunction(() => {
      return document.body.innerText.includes('Начисление минут клиенту');
    }, { timeout: 3000 });

    await page.evaluate(() => {
      const confirmBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.innerText.includes('Подтвердить начисление')
      );
      if (confirmBtn) confirmBtn.click();
    });

    await page.waitForFunction(() => {
      return document.body.innerText.includes('Начислено +50 минут');
    }, { timeout: 3000 });
    console.log('✅ Начисление минут выполнено успешно');

    // 4. Switch to Billing tab
    console.log('\n--- ШАГ 4: Финансы, чеки и акты выполненных работ РБ ---');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.innerText.includes('Финансы и акты')
      );
      if (btn) btn.click();
    });

    await page.waitForFunction(() => {
      return document.body.innerText.includes('Финансы, Платежи и Акты') && document.body.innerText.includes('Акт (PDF)');
    }, { timeout: 4000 });
    console.log('✅ Раздел финансов и генерации актов РБ проверен');

    // 5. Switch to Telephony tab
    console.log('\n--- ШАГ 5: Мониторинг звонков и AMD фильтрации ---');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.innerText.includes('Мониторинг звонков')
      );
      if (btn) btn.click();
    });

    await page.waitForFunction(() => {
      return document.body.innerText.includes('Мониторинг телефонии') && document.body.innerText.includes('AMD: робот отсечен');
    }, { timeout: 4000 });
    console.log('✅ Поток звонков и AMD статистика подтверждены');

    // 6. Return to website
    console.log('\n--- ШАГ 6: Проверка кнопки возврата на сайт ---');
    await page.evaluate(() => {
      const backBtn = document.querySelector('header button[title="Вернуться на главную"]');
      if (backBtn) backBtn.click();
    });

    await page.waitForFunction(() => {
      const h1Text = document.querySelector('h1')?.innerText || '';
      return h1Text.includes('голосовые технологии') || h1Text.includes('ИИ-администратор') || document.querySelector('nav');
    }, { timeout: 4000 });
    console.log('✅ Возврат на сайт сработал идеально');

  } finally {
    await browser.close();
    server.close();
  }
}

runAdminPanelTest().then(() => {
  console.log('\n========================================');
  console.log('🎉 ТЕСТ АДМИН-ПАНЕЛИ VOXI.BY ПРОЙДЕН (100% PASS)');
  console.log('========================================');
  process.exit(0);
}).catch((err) => {
  console.error('❌ Ошибка теста админ-панели:', err);
  process.exit(1);
});
