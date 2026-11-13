<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

// Токен бота: читаем из URL-параметра ?token=... или из конфигурации .env
$botToken = trim((string)($_GET['token'] ?? ($VOXI_CONFIG['telegram_bot_token'] ?? '')));
$webhookSecret = trim((string)($VOXI_CONFIG['telegram_webhook_secret'] ?? ''));
$method = strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET'));

// --- 1. Проверка статуса вебхука прямо из браузера (Диагностика) ---
// Пример: GET /api/telegram-webhook.php?action=check&token=YOUR_BOT_TOKEN
if (isset($_GET['action']) && $_GET['action'] === 'check') {
    $tokenToCheck = $botToken;
    if ($tokenToCheck === '') {
        voxi_json(['ok' => false, 'error' => 'Укажите токен бота: ?action=check&token=123:ABC...'], 400);
    }
    $ch = curl_init("https://api.telegram.org/bot{$tokenToCheck}/getWebhookInfo");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
    ]);
    $rawRes = curl_exec($ch);
    $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $parsed = json_decode((string)$rawRes, true) ?: [];
    voxi_json([
        'ok' => true,
        'httpCode' => $httpCode,
        'webhookInfo' => $parsed['result'] ?? $parsed,
    ]);
}

// --- 2. Вспомогательное действие: регистрация вебхука в Telegram (Setup) ---
// Пример вызова: GET /api/telegram-webhook.php?action=setup&pin=YOUR_ADMIN_PIN
if (isset($_GET['action']) && $_GET['action'] === 'setup') {
    $pin = trim((string)($_GET['pin'] ?? ''));
    $masterPin = trim((string)($VOXI_CONFIG['admin_master_pin'] ?? ''));
    if ($masterPin === '' || !hash_equals($masterPin, $pin)) {
        voxi_json(['ok' => false, 'error' => 'Неверный PIN-код администратора'], 401);
    }
    if ($botToken === '') {
        voxi_json(['ok' => false, 'error' => 'TELEGRAM_BOT_TOKEN не задан в .env'], 503);
    }

    $siteUrl = rtrim((string)($VOXI_CONFIG['public_site_url'] ?? 'https://voxi.by'), '/');
    $webhookUrl = "{$siteUrl}/api/telegram-webhook.php";

    $postData = [
        'url' => $webhookUrl,
        'allowed_updates' => ['message', 'callback_query', 'my_chat_member'],
        'drop_pending_updates' => true,
    ];
    if ($webhookSecret !== '') {
        $postData['secret_token'] = $webhookSecret;
    }

    $ch = curl_init("https://api.telegram.org/bot{$botToken}/setWebhook");
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode($postData),
    ]);
    $rawRes = curl_exec($ch);
    $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $parsed = json_decode((string)$rawRes, true) ?: [];
    voxi_json([
        'ok' => !empty($parsed['ok']),
        'webhookUrl' => $webhookUrl,
        'telegramResponse' => $parsed,
    ], $httpCode >= 200 && $httpCode < 300 ? 200 : 500);
}

// --- 2. Проверка метода входящего вебхука (Telegram всегда шлёт POST) ---
if ($method !== 'POST') {
    header('Allow: POST');
    voxi_json(['error' => 'Method Not Allowed. This endpoint receives Telegram Bot Webhooks.'], 405);
}

// Проверка секретного токена вебхука Telegram, если он настроен
if ($webhookSecret !== '') {
    $incomingSecret = (string)($_SERVER['HTTP_X_TELEGRAM_BOT_API_SECRET_TOKEN'] ?? '');
    if ($incomingSecret === '' || !hash_equals($webhookSecret, $incomingSecret)) {
        voxi_json(['error' => 'Unauthorized telegram webhook secret'], 401);
    }
}

if ($botToken === '') {
    // Тихо отвечаем 200, чтобы Telegram не спамил ретраями
    voxi_json(['ok' => false, 'error' => 'TELEGRAM_BOT_TOKEN not configured'], 200);
}

$update = voxi_read_json_body();
if (!is_array($update) || empty($update)) {
    voxi_json(['ok' => true, 'ignored' => 'empty_payload'], 200);
}

// Функция быстрой отправки сообщения в Telegram
function voxi_tg_reply(string $botToken, string|int $chatId, string $htmlText, ?array $replyMarkup = null): void
{
    $payload = [
        'chat_id' => $chatId,
        'text' => $htmlText,
        'parse_mode' => 'HTML',
        'disable_web_page_preview' => false,
    ];
    if ($replyMarkup !== null) {
        $payload['reply_markup'] = $replyMarkup;
    }

    $ch = curl_init("https://api.telegram.org/bot{$botToken}/sendMessage");
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 8,
        CURLOPT_CONNECTTIMEOUT => 4,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    ]);
    $res = curl_exec($ch);
    $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);

    if ($httpCode !== 200) {
        error_log("[voxi_tg] sendMessage failed (HTTP {$httpCode}): err={$err} res={$res}");
    }
}

$message = $update['message'] ?? null;
if (!is_array($message) || empty($message['chat'])) {
    // Могут приходить callback_query или статусы участников — подтверждаем 200 OK
    voxi_json(['ok' => true], 200);
}

$chat = $message['chat'];
$chatId = $chat['id'] ?? null;
$chatType = (string)($chat['type'] ?? 'private');
$chatTitle = (string)($chat['title'] ?? 'Рабочая группа');
$from = $message['from'] ?? [];
$userName = trim((string)($from['first_name'] ?? 'пользователь'));
$rawText = trim((string)($message['text'] ?? ''));

if ($chatId === null) {
    voxi_json(['ok' => true], 200);
}

// --- Обработка команд ---
$cmd = mb_strtolower(explode(' ', $rawText)[0] ?? '');
// Поддержка команд вида /start@bot_username
$cmd = explode('@', $cmd)[0];

if ($cmd === '/start' || $cmd === '/id') {
    if ($chatType === 'private') {
        $reply = "👋 <b>Здравствуйте, " . htmlspecialchars($userName, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . "!</b>\n\n"
               . "Я официальный бот платформы голосовых ИИ-ассистентов <b>Voxi.by</b> в Беларуси 🇧🇾.\n"
               . "Я мгновенно присылаю карточки клиентов, согласованные записи в календарь и аудиозаписи звонков прямо в ваш Telegram.\n\n"
               . "🆔 <b>Ваш Chat ID:</b> <code>{$chatId}</code>\n"
               . "<i>(нажмите на номер, чтобы скопировать)</i>\n\n"
               . "📋 <b>Как подключить уведомления:</b>\n"
               . "1. Скопируйте ваш <b>Chat ID</b> выше.\n"
               . "2. Откройте личный кабинет <a href=\"https://voxi.by/dashboard\">Voxi.by</a> → вкладка <b>«Интеграции»</b> → блок <b>Telegram</b>.\n"
               . "3. Вставьте номер в поле <b>«ID вашего чата или группы»</b> и нажмите кнопку <b>«Отправить тест в Telegram»</b>.\n\n"
               . "👥 <i>Хотите получать заявки в группу с коллегами? Добавьте меня в вашу рабочую группу и отправьте команду <code>/id</code>.</i>";

        $keyboard = [
            'inline_keyboard' => [
                [
                    ['text' => '🌐 Открыть кабинет Voxi.by', 'url' => 'https://voxi.by/dashboard'],
                    ['text' => '🔔 Отправить пример лида', 'callback_data' => 'sample_lead'],
                ]
            ]
        ];

        voxi_tg_reply($botToken, $chatId, $reply, $keyboard);
    } else {
        // Команда в группе или супергруппе
        $reply = "👥 <b>Рабочая группа подключена к Voxi.by!</b>\n\n"
               . "🏢 Группа: <b>" . htmlspecialchars($chatTitle, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . "</b>\n"
               . "🆔 <b>ID этой группы:</b> <code>{$chatId}</code>\n"
               . "<i>(нажмите на номер, чтобы скопировать)</i>\n\n"
               . "Скопируйте этот номер и вставьте в кабинете <a href=\"https://voxi.by/dashboard\">Voxi.by</a> в разделе <b>Интеграции → Telegram</b>. Все новые звонки и заявки будут автоматически приходить сюда всей команде!";

        voxi_tg_reply($botToken, $chatId, $reply);
    }
} elseif ($cmd === '/test' || ($update['callback_query']['data'] ?? '') === 'sample_lead') {
    $targetId = $chatId ?? ($update['callback_query']['message']['chat']['id'] ?? null);
    if ($targetId) {
        $sampleText = "🔔 <b>Пример карточки лида со звонка Voxi.by</b>\n\n"
                    . "🏢 Компания: <b>Автошкола «Драйв-Минск»</b>\n"
                    . "👤 Клиент: <b>Алексей Смирнов</b>\n"
                    . "📱 Телефон: <code>+375 (29) 682-14-99</code>\n"
                    . "🛠 Запрос: <b>Категория «B» (вечерняя группа)</b>\n"
                    . "🕒 Запись в календарь: <b>Среда, 18:30 (ул. Тимирязева, 65)</b>\n"
                    . "⏱ Длительность звонка: <b>1 мин 25 сек</b> (списано 1.4 мин)\n"
                    . "💰 Оценка сделки: <b>1 250 BYN</b>\n\n"
                    . "📝 <b>Резюме диалога от нейросети:</b>\n"
                    . "<i>Клиент уточнил условия рассрочки на 3 этапа и график вождения. Слот в онлайн-календаре забронирован на среду в 18:30. Клиенту автоматически отправлена SMS-визитка с картой проезда.</i>\n\n"
                    . "✅ <i>Связь с Telegram работает стабильно!</i>";

        voxi_tg_reply($botToken, $targetId, $sampleText);
    }
} elseif ($cmd === '/help') {
    $helpText = "ℹ️ <b>Справка Voxi.by Telegram Bot</b>\n\n"
              . "• <code>/start</code> или <code>/id</code> — узнать ваш персональный Chat ID для кабинета\n"
              . "• <code>/test</code> — посмотреть образец карточки входящего лида\n"
              . "• <code>/help</code> — это справочное сообщение\n\n"
              . "Вопросы по подключению и телефонии: @jmaxess или <a href=\"https://voxi.by\">voxi.by</a>";

    voxi_tg_reply($botToken, $chatId, $helpText);
}

// Завершаем обработку вебхука с кодом 200 OK
voxi_json(['ok' => true], 200);
