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
          'Cache-Control': 'no-cache, no-store, must-revalidate',
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

async function runTest() {
  console.log('🚀 Запуск детального тестирования AdminChatWidget в Puppeteer...');

  const chromePath = findChromePath();
  if (!chromePath) {
    console.error('❌ Chrome executable не найден!');
    process.exit(1);
  }
  console.log(`ℹ️ Chrome path: ${chromePath}`);

  const { server, port } = await startStaticServer(DIST_DIR);
  const baseUrl = `http://127.0.0.1:${port}/`;
  console.log(`📡 Локальный сервер запущен: ${baseUrl}`);

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

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore non-critical resource 404s like missing favicon or analytics if any
      consoleErrors.push(text);
      console.log(`⚠️ Browser console error: ${text}`);
    }
  });

  page.on('pageerror', (err) => {
    pageErrors.push(err.toString());
    console.log(`❌ Page error: ${err.toString()}`);
  });

  const testResults = {
    step1_server_open: false,
    step2_floating_button: {
      rendered: false,
      has_chat_text: false,
      has_pulse_indicator: false,
      has_online_badge: false,
      has_minsk_subtitle: false,
    },
    step3_chat_window_open: {
      opened: false,
      has_admin_title: false,
      has_online_status: false,
      has_telegram_link: false,
      has_close_button: false,
      has_belarus_banner: false,
      has_welcome_messages: false,
    },
    step4_interactive_dialogue: {
      quick_question_clicked: false,
      admin_reply_received: false,
      has_byn_prices: false,
      has_action_button: false,
      custom_question_sent: false,
      custom_reply_received: false,
    },
    step5_chat_close: {
      closed: false,
      floating_button_restored: false,
    },
    step6_console_clean: false,
  };

  try {
    // 1. Open page
    console.log('\n--- ШАГ 1: Открытие главной страницы ---');
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    testResults.step1_server_open = true;
    console.log('✅ Главная страница успешно загружена');

    // 2. Check Floating Button
    console.log('\n--- ШАГ 2: Проверка плавающей кнопки в правом нижнем углу ---');
    const buttonSelector = 'button[aria-label="Открыть онлайн-чат с дежурным администратором Voxi.by"]';
    await page.waitForSelector(buttonSelector, { timeout: 5000 });
    testResults.step2_floating_button.rendered = true;

    const buttonDetails = await page.evaluate((sel) => {
      const btn = document.querySelector(sel);
      if (!btn) return null;
      const text = btn.innerText || '';
      const pingSpan = btn.querySelector('.animate-ping');
      const emeraldSpan = btn.querySelector('.bg-emerald-500');
      const hasOnlineBadge = text.includes('Онлайн');
      const hasMinskSub = text.includes('Ответим за 1 минуту • Минск');
      const hasChatText = text.includes('Чат с администратором');
      return {
        text,
        hasPing: Boolean(pingSpan),
        hasEmerald: Boolean(emeraldSpan),
        hasOnlineBadge,
        hasMinskSub,
        hasChatText,
      };
    }, buttonSelector);

    console.log('Кнопка найдена:', buttonDetails);
    testResults.step2_floating_button.has_chat_text = buttonDetails?.hasChatText || false;
    testResults.step2_floating_button.has_pulse_indicator = Boolean(buttonDetails?.hasPing && buttonDetails?.hasEmerald);
    testResults.step2_floating_button.has_online_badge = buttonDetails?.hasOnlineBadge || false;
    testResults.step2_floating_button.has_minsk_subtitle = buttonDetails?.hasMinskSub || false;

    if (!testResults.step2_floating_button.has_chat_text) throw new Error('Текст «Чат с администратором» не найден!');
    if (!testResults.step2_floating_button.has_pulse_indicator) throw new Error('Пульсирующий индикатор онлайна не найден!');
    if (!testResults.step2_floating_button.has_online_badge) throw new Error('Бейдж «Онлайн» не найден!');
    if (!testResults.step2_floating_button.has_minsk_subtitle) throw new Error('Подпись «Ответим за 1 минуту • Минск» не найдена!');
    console.log('✅ Все элементы плавающей кнопки проверены успешно');

    // 3. Open Chat Window
    console.log('\n--- ШАГ 3: Проверка открытия окна чата ---');
    await page.click(buttonSelector);

    const dialogSelector = 'div[role="dialog"][aria-label="Чат с дежурным администратором Voxi.by"]';
    await page.waitForSelector(dialogSelector, { timeout: 3000 });
    testResults.step3_chat_window_open.opened = true;
    console.log('✅ Окно диалога чата открыто');

    const headerAndBanner = await page.evaluate((dialogSel) => {
      const dialog = document.querySelector(dialogSel);
      if (!dialog) return null;
      const dialogText = dialog.innerText || '';
      const hasAdminTitle = dialogText.includes('Администратор Voxi');
      const hasOnlineStatus = dialogText.includes('В сети • Отвечает мгновенно');
      
      const tgLink = dialog.querySelector('a[href*="t.me/voxi_support"]');
      const closeBtn = dialog.querySelector('button[aria-label="Закрыть чат"]');
      const hasBelarusBanner = dialogText.includes('Официальная поддержка в Беларуси (УНП 193991846)');
      
      const hasWelcome1 = dialogText.includes('дежурный администратор платформы Voxi.by в Минске');
      const hasWelcome2 = dialogText.includes('Подскажу по тарифам в BYN');

      return {
        hasAdminTitle,
        hasOnlineStatus,
        hasTgLink: Boolean(tgLink),
        tgHref: tgLink?.getAttribute('href'),
        hasCloseBtn: Boolean(closeBtn),
        hasBelarusBanner,
        hasWelcome1,
        hasWelcome2,
      };
    }, dialogSelector);

    console.log('Шапка и баннер чата:', headerAndBanner);
    testResults.step3_chat_window_open.has_admin_title = headerAndBanner?.hasAdminTitle || false;
    testResults.step3_chat_window_open.has_online_status = headerAndBanner?.hasOnlineStatus || false;
    testResults.step3_chat_window_open.has_telegram_link = headerAndBanner?.hasTgLink || false;
    testResults.step3_chat_window_open.has_close_button = headerAndBanner?.hasCloseBtn || false;
    testResults.step3_chat_window_open.has_belarus_banner = headerAndBanner?.hasBelarusBanner || false;
    testResults.step3_chat_window_open.has_welcome_messages = Boolean(headerAndBanner?.hasWelcome1 && headerAndBanner?.hasWelcome2);

    if (!testResults.step3_chat_window_open.has_admin_title) throw new Error('Заголовок «Администратор Voxi» не найден!');
    if (!testResults.step3_chat_window_open.has_online_status) throw new Error('Статус «В сети • Отвечает мгновенно» не найден!');
    if (!testResults.step3_chat_window_open.has_telegram_link) throw new Error('Ссылка на Telegram @voxi_support не найдена!');
    if (!testResults.step3_chat_window_open.has_close_button) throw new Error('Кнопка закрытия чата не найдена!');
    if (!testResults.step3_chat_window_open.has_belarus_banner) throw new Error('Баннер с УНП 193991846 не найден!');
    if (!testResults.step3_chat_window_open.has_welcome_messages) throw new Error('Приветственные сообщения администратора не найдены!');
    console.log('✅ Все элементы шапки, баннера и приветствия проверены успешно');

    // 4. Interactive Dialogue: Quick Question
    console.log('\n--- ШАГ 4: Интерактивный диалог ---');
    console.log('Кликаем по быстрому вопросу «Сколько стоит минута в BYN?»...');

    const quickChipClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('div[role="dialog"] button'));
      const chip = buttons.find(b => b.innerText && b.innerText.includes('Сколько стоит минута в BYN?'));
      if (chip) {
        chip.click();
        return true;
      }
      return false;
    });

    if (!quickChipClicked) throw new Error('Быстрый вопрос «Сколько стоит минута в BYN?» не найден!');
    testResults.step4_interactive_dialogue.quick_question_clicked = true;

    // Wait for typing indicator and then admin response
    console.log('Ждем ответ администратора...');
    await page.waitForFunction(() => {
      const dialog = document.querySelector('div[role="dialog"]');
      if (!dialog) return false;
      return dialog.innerText.includes('0.35') && dialog.innerText.includes('0.45 BYN');
    }, { timeout: 5000 });

    testResults.step4_interactive_dialogue.admin_reply_received = true;
    testResults.step4_interactive_dialogue.has_byn_prices = true;

    // Check action button in reply
    const actionButtonExists = await page.evaluate(() => {
      const dialog = document.querySelector('div[role="dialog"]');
      if (!dialog) return false;
      const buttons = Array.from(dialog.querySelectorAll('button'));
      return buttons.some(b => b.innerText && b.innerText.includes('Настроить за 5 минут'));
    });
    testResults.step4_interactive_dialogue.has_action_button = actionButtonExists;
    console.log(`Ответ получен: цены 0.35-0.45 BYN найдены, кнопка действия: ${actionButtonExists ? '✅' : '❌'}`);

    // Now send a custom question via text input
    console.log('\nТестируем ввод своего вопроса через поле ввода...');
    const inputSelector = 'div[role="dialog"] input[type="text"]';
    await page.waitForSelector(inputSelector);
    const customQuestion = 'Как подключить номер МТС?';
    await page.type(inputSelector, customQuestion);
    
    // Press Enter to send
    await page.keyboard.press('Enter');
    testResults.step4_interactive_dialogue.custom_question_sent = true;
    console.log(`Отправлен вопрос: "${customQuestion}"`);

    // Wait for admin reply containing MTS info
    await page.waitForFunction(() => {
      const dialog = document.querySelector('div[role="dialog"]');
      if (!dialog) return false;
      return dialog.innerText.includes('sip.mts.by') || dialog.innerText.includes('МТС');
    }, { timeout: 5000 });
    testResults.step4_interactive_dialogue.custom_reply_received = true;
    console.log('✅ Ответ на кастомный вопрос получен (SIP-интеграция МТС sip.mts.by)');

    // 5. Check closing chat via 'X'
    console.log('\n--- ШАГ 5: Проверка закрытия чата по кнопке «X» ---');
    const closeBtnSelector = 'div[role="dialog"] button[aria-label="Закрыть чат"]';
    await page.click(closeBtnSelector);

    // Wait for dialog to disappear
    await page.waitForFunction(() => {
      return document.querySelector('div[role="dialog"]') === null;
    }, { timeout: 3000 });
    testResults.step5_chat_close.closed = true;

    // Check that floating button reappeared
    await page.waitForSelector(buttonSelector, { timeout: 3000 });
    testResults.step5_chat_close.floating_button_restored = true;
    console.log('✅ Окно чата закрыто, плавающая кнопка снова отображается');

    // 6. Console errors check
    console.log('\n--- ШАГ 6: Проверка консоли браузера ---');
    console.log(`Page errors count: ${pageErrors.length}`);
    console.log(`Console errors count: ${consoleErrors.length}`);

    if (pageErrors.length === 0 && consoleErrors.length === 0) {
      testResults.step6_console_clean = true;
      console.log('✅ В консоли 0 ошибок!');
    } else {
      console.log('⚠️ Ошибки консоли:', { pageErrors, consoleErrors });
    }

  } catch (error) {
    console.error('❌ Ошибка во время выполнения теста:', error);
  } finally {
    await browser.close();
    server.close();
  }

  console.log('\n================ИТОГОВЫЙ РЕЗУЛЬТАТ================');
  console.log(JSON.stringify(testResults, null, 2));

  const allPassed =
    testResults.step1_server_open &&
    Object.values(testResults.step2_floating_button).every(Boolean) &&
    Object.values(testResults.step3_chat_window_open).every(Boolean) &&
    Object.values(testResults.step4_interactive_dialogue).every(Boolean) &&
    Object.values(testResults.step5_chat_close).every(Boolean) &&
    testResults.step6_console_clean;

  if (allPassed) {
    console.log('\n🎉 ВСЕ ТЕСТЫ WIDGET ADMIN CHAT УСПЕШНО ПРОЙДЕНЫ (100% PASS)');
    process.exit(0);
  } else {
    console.error('\n❌ ЧАСТЬ ТЕСТОВ НЕ ПРОШЛА');
    process.exit(1);
  }
}

runTest().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
