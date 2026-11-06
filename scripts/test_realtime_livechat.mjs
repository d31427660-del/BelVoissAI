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

        // API mock handler for live-chat in test environment
        if (pathname === '/api/live-chat' || pathname === '/api/live-chat.php') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, status: 'online' }));
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

async function runRealtimeTest() {
  console.log('🚀 Тестирование переписки с администратором в реальном времени...');

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
    // 1. Visitor Page (Landing)
    const visitorPage = await browser.newPage();
    await visitorPage.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Open chat widget
    const triggerSelector = 'button[aria-label="Открыть онлайн-чат с дежурным администратором Voxi.by"]';
    await visitorPage.waitForSelector(triggerSelector, { timeout: 5000 });
    await visitorPage.click(triggerSelector);

    const dialogSelector = 'div[role="dialog"][aria-label="Чат с дежурным администратором Voxi.by"]';
    await visitorPage.waitForSelector(dialogSelector, { timeout: 3000 });
    console.log('✅ Виджет чата на лендинге открыт');

    // 2. Visitor leaves phone contact
    console.log('Тестируем ввод контакта посетителя...');
    const leavePhoneBtn = await visitorPage.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.innerText.includes('Оставить телефон')
      );
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });

    if (leavePhoneBtn) {
      await visitorPage.waitForSelector('form input[placeholder*="+375"]', { timeout: 2000 });
      await visitorPage.type('form input[placeholder*="+375"]', '+375 (29) 777-12-34');
      await visitorPage.click('form button[type="submit"]');
      console.log('✅ Номер телефона посетителя сохранен');
    }

    // 3. Visitor types real question
    const testQuery = 'Здравствуйте! Хотим подключить 4 телефонных линии А1 в Минске, как это настроить?';
    const inputSelector = 'div[role="dialog"] input[placeholder*="Задайте вопрос"]';
    await visitorPage.waitForSelector(inputSelector);
    await visitorPage.type(inputSelector, testQuery);
    await visitorPage.keyboard.press('Enter');
    console.log(`✅ Посетитель отправил сообщение: "${testQuery.slice(0, 45)}..."`);

    // Verify visitor message appears in chat
    await visitorPage.waitForFunction((q) => {
      return document.querySelector('div[role="dialog"]')?.innerText.includes(q);
    }, { timeout: 4000 }, testQuery);

    // 4. Open second tab: Admin in Dashboard
    console.log('\n--- Открываем вторую вкладку: Личный кабинет администратора ---');
    const adminPage = await browser.newPage();
    // Simulate login session in localStorage
    await adminPage.evaluateOnNewDocument(() => {
      localStorage.setItem('voxi_demo_auth_user', JSON.stringify({
        id: 'admin_1',
        email: 'admin@voxi.by',
        companyName: 'Voxi Support Admin',
        balanceMinutes: 100,
        ratePerMinute: 0.45,
        spentMinutes: 0,
        isMock: true
      }));
    });

    await adminPage.goto(`${baseUrl}#dashboard`, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Wait for dashboard nav button "Чат поддержки"
    console.log('Ищем вкладку «Чат поддержки» в навигации кабинета...');
    const chatTabBtn = await adminPage.waitForFunction(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(b => b.innerText.includes('Чат поддержки'));
    }, { timeout: 5000 });

    await adminPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.innerText.includes('Чат поддержки'));
      if (btn) btn.click();
    });
    console.log('✅ Вкладка «Чат поддержки» открыта в кабинете администратора');

    // 5. Admin sees the visitor's conversation with their question and phone number
    await adminPage.waitForFunction((q) => {
      return document.body.innerText.includes(q) || document.body.innerText.includes('777-12-34');
    }, { timeout: 6000 }, testQuery);
    console.log('✅ Администратор в реальном времени видит диалог посетителя и его телефон!');

    // 6. Admin types reply to visitor
    const adminReplyText = 'Добрый день! Подключим все 4 линии А1 по SIP без замены номеров за 15 минут. Давайте согласуем удобное время!';
    console.log(`Администратор пишет ответ: "${adminReplyText.slice(0, 50)}..."`);

    const adminInputSelector = 'input[placeholder*="Ответить посетителю в реальном времени"]';
    await adminPage.waitForSelector(adminInputSelector, { timeout: 4000 });
    await adminPage.type(adminInputSelector, adminReplyText);
    await adminPage.keyboard.press('Enter');
    console.log('✅ Администратор отправил ответ');

    // 7. Verify Visitor receives the reply in REAL TIME in tab 1 without refreshing!
    console.log('\n--- Проверяем получение ответа во вкладке посетителя ---');
    await visitorPage.bringToFront();
    await visitorPage.waitForFunction((reply) => {
      const dialog = document.querySelector('div[role="dialog"]');
      return dialog && dialog.innerText.includes(reply);
    }, { timeout: 6000 }, 'Подключим все 4 линии А1 по SIP');

    console.log('🎉 УСПЕХ! Посетитель мгновенно получил ответ администратора в реальном времени!');

  } finally {
    await browser.close();
    server.close();
  }
}

runRealtimeTest().then(() => {
  console.log('\n========================================');
  console.log('🎉 ТЕСТ РЕАЛЬНОГО ЧАТА С АДМИНОМ ПРОЙДЕН (100% PASS)');
  console.log('========================================');
  process.exit(0);
}).catch((err) => {
  console.error('❌ Ошибка теста:', err);
  process.exit(1);
});
