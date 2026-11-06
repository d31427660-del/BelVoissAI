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

const HYDRATION_ERROR_PATTERNS = [
  /Hydration failed/i,
  /did not match/i,
  /server-rendered HTML/i,
  /Text content does not match/i,
  /Minified React error #(?:418|423|425)/i,
  /Expected server HTML to contain/i,
  /There was an error while hydrating/i,
];

let totalPassed = 0;
let totalFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    totalPassed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    totalFailed++;
  }
}

async function runHydrationSuite() {
  console.log('🚀 Запуск тестирования гидратации React 19 и целостности сборки dist/...\n');

  if (!fs.existsSync(DIST_DIR)) {
    console.error(`❌ Каталог dist/ не найден: ${DIST_DIR}`);
    process.exit(1);
  }

  const chromePath = findChromePath();
  if (!chromePath) {
    console.error('❌ Google Chrome не найден в системе');
    process.exit(1);
  }
  console.log(`📍 Chrome path: ${chromePath}`);

  const serverInstance = await startStaticServer(DIST_DIR);
  const baseUrl = `http://127.0.0.1:${serverInstance.port}`;
  console.log(`🌐 Локальный статический сервер запущен на ${baseUrl}\n`);

  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    function setupPageMonitor(page, label) {
      const logs = [];
      const pageErrors = [];
      const hydrationErrors = [];

      page.on('console', (msg) => {
        const text = msg.text();
        const type = msg.type();
        logs.push({ type, text });

        for (const pattern of HYDRATION_ERROR_PATTERNS) {
          if (pattern.test(text)) {
            hydrationErrors.push(`[${label}] Console ${type}: ${text}`);
          }
        }
      });

      page.on('pageerror', (err) => {
        const msg = String(err.message || err);
        pageErrors.push(msg);

        for (const pattern of HYDRATION_ERROR_PATTERNS) {
          if (pattern.test(msg)) {
            hydrationErrors.push(`[${label}] PageError: ${msg}`);
          }
        }
      });

      return { logs, pageErrors, hydrationErrors };
    }

    // =========================================================================
    // ТЕСТ 1: Главная страница / (Проверка гидратации React 19)
    // =========================================================================
    console.log('--- ТЕСТ 1: Главная страница (/) — гидратация и консоль ---');
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    const monitorHome = setupPageMonitor(page, 'HOME');

    const response = await page.goto(`${baseUrl}/`, {
      waitUntil: 'networkidle0',
      timeout: 15000,
    });

    assert(response && response.status() === 200, 'HTTP статус 200 на /');
    assert(
      monitorHome.pageErrors.length === 0,
      `Отсутствие необработанных PageError на / (найдено: ${monitorHome.pageErrors.length})`
    );
    if (monitorHome.pageErrors.length > 0) {
      console.error('    Page errors:', monitorHome.pageErrors);
    }

    assert(
      monitorHome.hydrationErrors.length === 0,
      `Отсутствие ошибок React Hydration на / (найдено: ${monitorHome.hydrationErrors.length})`
    );
    if (monitorHome.hydrationErrors.length > 0) {
      console.error('    Hydration errors:', monitorHome.hydrationErrors);
    }

    const rootHasChildren = await page.$eval('#root', (el) => el.children.length > 0);
    assert(rootHasChildren, 'Элемент #root содержит отрендеренные дочерние компоненты');

    const heroTitle = await page.$eval('h1', (el) => el.textContent?.trim());
    assert(Boolean(heroTitle && heroTitle.length > 10), `H1 заголовок присутствует: "${heroTitle?.slice(0, 45)}..."`);

    // =========================================================================
    // ТЕСТ 2: Интерактивность элементов после гидратации
    // =========================================================================
    console.log('\n--- ТЕСТ 2: Интерактивность элементов после гидратации ---');

    // 2.1 Аккордеон FAQ
    console.log('2.1 Проверка интерактивности аккордеона FAQ:');
    const faqButtons = await page.$$('#faq button[aria-expanded]');
    assert(faqButtons.length >= 2, `Найдено кнопок FAQ: ${faqButtons.length}`);

    if (faqButtons.length >= 2) {
      const initialExpanded = await page.evaluate((btn) => btn.getAttribute('aria-expanded'), faqButtons[1]);
      assert(initialExpanded === 'false', 'Второй элемент FAQ изначально закрыт (aria-expanded="false")');

      await faqButtons[1].click();
      await new Promise((r) => setTimeout(r, 400));

      const newExpanded = await page.evaluate((btn) => btn.getAttribute('aria-expanded'), faqButtons[1]);
      assert(newExpanded === 'true', 'После клика второй элемент FAQ открылся (aria-expanded="true")');
    }

    // 2.2 Калькулятор окупаемости (ROI Slider)
    console.log('\n2.2 Проверка интерактивности ROI калькулятора:');
    const sliderInput = await page.$('#roi-missed-calls');
    assert(sliderInput !== null, 'Слайдер звонков #roi-missed-calls найден');

    if (sliderInput) {
      const initialCallsBadge = await page.evaluate(() => {
        const badge = document.querySelector('label[for="roi-missed-calls"] + span');
        return badge ? badge.textContent?.trim() : null;
      });

      // Update controlled React range input via prototype value setter
      await page.evaluate(() => {
        const input = document.getElementById('roi-missed-calls');
        if (input) {
          const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
          if (nativeSetter) {
            nativeSetter.call(input, '120');
          } else {
            input.value = '120';
          }
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });

      await new Promise((r) => setTimeout(r, 200));

      const updatedCallsBadge = await page.evaluate(() => {
        const badge = document.querySelector('label[for="roi-missed-calls"] + span');
        return badge ? badge.textContent?.trim() : null;
      });

      assert(
        updatedCallsBadge === '120 звонков',
        `Слайдер успешно обновил реактивное состояние: "${initialCallsBadge}" -> "${updatedCallsBadge}"`
      );
    }

    // 2.3 Модальное окно авторизации/демо
    console.log('\n2.3 Проверка открытия и закрытия модального окна (AuthModal):');
    const authBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find((b) => b.textContent && b.textContent.includes('Настроить за 5 минут')) || null;
    });

    if (authBtn && (await authBtn.asElement())) {
      await authBtn.asElement().click();

      // Wait for dialog element to mount and open
      await page.waitForFunction(
        () => {
          const dialog = document.querySelector('dialog[aria-labelledby="auth-modal-title"]');
          return dialog && dialog.open;
        },
        { timeout: 5000 }
      );

      const isDialogOpen = await page.evaluate(() => {
        const dialog = document.querySelector('dialog[aria-labelledby="auth-modal-title"]');
        return dialog ? dialog.open : false;
      });
      assert(isDialogOpen, 'Модальное окно <dialog> успешно открылось (showModal() выполнено)');

      const modalText = await page.$eval('dialog[aria-labelledby="auth-modal-title"]', (el) => el.textContent || '');
      assert(
        modalText.includes('панель') || modalText.includes('Вход') || modalText.includes('Регистрация') || modalText.includes('Демо'),
        'Содержимое модального окна корректно отображается'
      );

      // Close modal by clicking close button inside dialog
      const closeBtn = await page.$('dialog[aria-labelledby="auth-modal-title"] button');
      if (closeBtn) {
        await closeBtn.click();
        await new Promise((r) => setTimeout(r, 300));
        const isClosed = await page.evaluate(() => {
          const dialog = document.querySelector('dialog[aria-labelledby="auth-modal-title"]');
          return !dialog || !dialog.open;
        });
        assert(isClosed, 'Модальное окно успешно закрылось по клику на кнопку закрытия');
      }
    } else {
      console.warn('    Кнопка открытия модального окна не найдена');
    }

    // 2.4 Интерактивность чата с администратором (AdminChatWidget)
    console.log('\n2.4 Проверка работы виджета «Чат с администратором»:');
    const chatBtn = await page.$('button[aria-label*="чат с дежурным администратором"]');
    assert(chatBtn !== null, 'Плавающая кнопка «Чат с администратором» найдена в правом нижнем углу');

    if (chatBtn) {
      await chatBtn.click();
      await new Promise((r) => setTimeout(r, 400));

      const chatDialog = await page.$('div[role="dialog"][aria-label*="Чат с дежурным администратором"]');
      assert(chatDialog !== null, 'Окно чата успешно открылось по клику');

      const adminTitle = await page.$eval('div[role="dialog"]', (el) => el.textContent || '');
      assert(adminTitle.includes('Администратор Voxi'), 'Шапка содержит имя администратора Voxi');

      // Close chat
      const closeChatBtn = await page.$('button[aria-label="Закрыть чат"]');
      if (closeChatBtn) {
        await closeChatBtn.click();
        await new Promise((r) => setTimeout(r, 300));
        const isChatClosed = (await page.$('div[role="dialog"][aria-label*="Чат с дежурным администратором"]')) === null;
        assert(isChatClosed, 'Окно чата успешно закрылось по кнопке закрытия');
      }
    }

    await page.close();

    // =========================================================================
    // ТЕСТ 3: Страницы /offer, /privacy, /sla (целостность, гидратация и модалки)
    // =========================================================================
    console.log('\n--- ТЕСТ 3: Проверка страниц /offer, /privacy, /sla ---');

    const legalRoutes = [
      {
        path: '/offer',
        titlePart: 'договор',
        headingPart: 'Публичный договор',
      },
      {
        path: '/privacy',
        titlePart: 'конфиденциальности',
        headingPart: 'Политика обработки персональных данных',
      },
      {
        path: '/sla',
        titlePart: 'SLA',
        headingPart: 'Соглашение об уровне',
      },
    ];

    for (const route of legalRoutes) {
      console.log(`\n3.${legalRoutes.indexOf(route) + 1} Тестирование маршрута ${route.path}:`);
      const legalPage = await browser.newPage();
      await legalPage.setViewport({ width: 1280, height: 900 });

      const monitor = setupPageMonitor(legalPage, route.path);

      const res = await legalPage.goto(`${baseUrl}${route.path}`, {
        waitUntil: 'networkidle0',
        timeout: 15000,
      });

      assert(res && res.status() === 200, `HTTP статус 200 на ${route.path}`);
      assert(monitor.pageErrors.length === 0, `Отсутствие pageerror на ${route.path}`);
      if (monitor.pageErrors.length > 0) {
        console.error(`    Page errors on ${route.path}:`, monitor.pageErrors);
      }

      assert(monitor.hydrationErrors.length === 0, `Отсутствие ошибок гидратации React на ${route.path}`);
      if (monitor.hydrationErrors.length > 0) {
        console.error(`    Hydration errors on ${route.path}:`, monitor.hydrationErrors);
      }

      const pageTitle = await legalPage.title();
      assert(
        pageTitle.toLowerCase().includes(route.titlePart.toLowerCase()),
        `Title страницы корректен: "${pageTitle}"`
      );

      const dialogContent = await legalPage.evaluate(() => {
        const dialog = document.querySelector('dialog');
        if (dialog && dialog.open) {
          return dialog.textContent || '';
        }
        return document.body.textContent || '';
      });

      assert(
        dialogContent.includes(route.headingPart),
        `Текст документа содержит ожидаемый раздел: "${route.headingPart}"`
      );

      // Verify close button or backdrop works without error
      const closeBtn = await legalPage.$('dialog button');
      if (closeBtn) {
        await closeBtn.click();
        await new Promise((r) => setTimeout(r, 200));
        const isOpen = await legalPage.evaluate(() => {
          const d = document.querySelector('dialog');
          return d ? d.open : false;
        });
        assert(!isOpen, `Диалог закрывается кнопкой закрытия на ${route.path}`);
      }

      await legalPage.close();
    }

    console.log('\n======================================================');
    console.log(`ИТОГИ ТЕСТИРОВАНИЯ ГИДРАТАЦИИ:`);
    console.log(`  Пройдено проверок: ${totalPassed}`);
    console.log(`  Провалено проверок: ${totalFailed}`);
    console.log('======================================================\n');
  } finally {
    if (browser) {
      await browser.close();
    }
    await serverInstance.close();
  }

  if (totalFailed > 0) {
    process.exit(1);
  }
}

runHydrationSuite().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
