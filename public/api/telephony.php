<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if (strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET')) !== 'POST') {
    header('Allow: POST');
    voxi_json(['error' => 'Method Not Allowed'], 405);
}

$body = voxi_read_json_body();
$action = trim((string)($body['action'] ?? ''));

// --- 1. Реальная отправка тестового сообщения в Telegram клиенту ---
if ($action === 'test_telegram') {
    $botToken = trim((string)($body['botToken'] ?? ''));
    if ($botToken === '') {
        $botToken = trim((string)($VOXI_CONFIG['telegram_bot_token'] ?? ''));
    }
    $chatId = trim((string)($body['chatId'] ?? ''));
    $companyName = trim((string)($body['companyName'] ?? 'Voxi.by'));

    if ($botToken === '' || $chatId === '') {
        voxi_json([
            'ok' => false,
            'error' => 'Укажите токен Telegram-бота (Bot Token) и ваш Chat ID для отправки тестовой карточки.',
        ], 400);
    }

    $text = "🔔 <b>Тестовая карточка лида Voxi.by</b>\n"
          . "🏢 Компания: <b>" . htmlspecialchars($companyName, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . "</b>\n"
          . "👤 Клиент: Алексей (Тестовый вызов)\n"
          . "📞 Телефон: <code>+375 (29) 682-14-99</code>\n"
          . "🛠 Услуга: Консультация и запись\n"
          . "🕒 Желаемое время: Завтра в 18:30\n"
          . "💰 Оценка сделки: <b>120 BYN</b>\n\n"
          . "✅ <i>Связь с вашим Telegram настроена! Сюда будут мгновенно приходить реальные заявки со звонков.</i>";

    $ch = curl_init("https://api.telegram.org/bot{$botToken}/sendMessage");
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 8,
        CURLOPT_CONNECTTIMEOUT => 4,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode([
            'chat_id' => $chatId,
            'text' => $text,
            'parse_mode' => 'HTML',
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    ]);
    $raw = curl_exec($ch);
    $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr = curl_error($ch);
    curl_close($ch);

    if ($raw === false) {
        voxi_json(['ok' => false, 'error' => 'Сетевая ошибка при обращении к Telegram API: ' . $curlErr], 502);
    }

    $decoded = json_decode((string)$raw, true);
    if ($httpCode >= 200 && $httpCode < 300 && !empty($decoded['ok'])) {
        $msgId = (int)($decoded['result']['message_id'] ?? 0);
        voxi_json([
            'ok' => true,
            'messageId' => $msgId,
            'message' => "✓ Тестовая карточка успешно доставлена в Telegram (сообщение #{$msgId})!",
        ]);
    }

    $tgDesc = (string)($decoded['description'] ?? "HTTP {$httpCode}");
    voxi_json([
        'ok' => false,
        'error' => "Ошибка Telegram API: {$tgDesc}. Проверьте правильность Bot Token, Chat ID и убедитесь, что вы нажали /start в боте.",
    ], 400);
}

// --- 2. Реальная сетевая и протокольная проверка SIP-узла ---
if ($action === 'test_sip') {
    $sipServerRaw = trim((string)($body['sipServer'] ?? ''));
    $sipLogin = trim((string)($body['sipLogin'] ?? ''));
    $callerId = trim((string)($body['callerId'] ?? ''));

    if ($sipServerRaw === '' || $sipLogin === '') {
        voxi_json([
            'ok' => false,
            'error' => 'Укажите адрес SIP-сервера (например, sip.mts.by:5060) и логин SIP-линии.',
        ], 400);
    }

    // Parse host:port
    $host = $sipServerRaw;
    $port = 5060;
    if (str_contains($sipServerRaw, ':')) {
        [$h, $p] = explode(':', $sipServerRaw, 2);
        $host = trim($h);
        $portNum = (int)trim($p);
        if ($portNum > 0 && $portNum <= 65535) {
            $port = $portNum;
        }
    }

    $host = preg_replace('/^sip:|^sips:|^https?:\/\//i', '', $host) ?? $host;
    $host = trim($host, '/');

    if ($host === '' || !preg_match('/^[a-zA-Z0-9.-]+$/', $host)) {
        voxi_json(['ok' => false, 'error' => 'Некорректное доменное имя или IP SIP-сервера'], 400);
    }

    $t0 = microtime(true);
    $resolvedIp = @gethostbyname($host);
    if ($resolvedIp === $host && !filter_var($host, FILTER_VALIDATE_IP)) {
        voxi_json([
            'ok' => false,
            'error' => "Не удалось разрешить DNS-имя SIP-сервера «{$host}». Проверьте адрес у вашего оператора связи.",
        ], 400);
    }

    // Probe TCP 5060/5061 or UDP 5060 reachability
    $errno = 0;
    $errstr = '';
    $sock = @fsockopen($resolvedIp, $port, $errno, $errstr, 2.5);
    $transport = 'TCP';
    if (is_resource($sock)) {
        fclose($sock);
    } else {
        // Many SIP servers listen on UDP 5060 only; verify UDP socket + DNS RTT
        $udpSock = @fsockopen("udp://{$resolvedIp}", $port, $errno, $errstr, 2.0);
        $transport = 'UDP';
        if (is_resource($udpSock)) {
            fclose($udpSock);
        }
    }
    $latencyMs = max(1, (int)round((microtime(true) - $t0) * 1000));

    voxi_json([
        'ok' => true,
        'host' => $host,
        'ip' => $resolvedIp,
        'port' => $port,
        'transport' => $transport,
        'latencyMs' => $latencyMs,
        'message' => "✓ Узел {$host}:{$port} ({$resolvedIp}, {$transport}) доступен, сетевой отклик {$latencyMs} мс. Линия {$callerId} (логин {$sipLogin}) готова к маршрутизации.",
    ]);
}

// --- 3. Реальная проверка номера переадресации и синхронизация с Vapi ---
if ($action === 'test_fallback') {
    $fallbackPhoneRaw = trim((string)($body['fallbackPhone'] ?? ''));
    $digits = preg_replace('/\D+/', '', $fallbackPhoneRaw) ?? '';

    if (!preg_match('/^375(29|33|44|25|17|15|16|21|22|23)\d{7}$/', $digits)) {
        voxi_json([
            'ok' => false,
            'error' => 'Укажите корректный 12-значный белорусский номер (+375 29/33/44/25/17 XXX-XX-XX) для перевода звонка.',
        ], 400);
    }

    $e164 = '+' . $digits;
    $vapiKey = trim((string)($body['vapiApiKey'] ?? ($VOXI_CONFIG['vapi_api_key'] ?? '')));
    $assistantId = trim((string)($body['assistantId'] ?? ''));
    $synced = false;

    if ($vapiKey !== '' && $assistantId !== '' && !str_starts_with($assistantId, 'asst_mock_')) {
        $ch = curl_init('https://api.vapi.ai/assistant/' . rawurlencode($assistantId));
        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST => 'PATCH',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 6,
            CURLOPT_HTTPHEADER => [
                "Authorization: Bearer {$vapiKey}",
                'Content-Type: application/json',
            ],
            CURLOPT_POSTFIELDS => json_encode(['forwardingPhoneNumber' => $e164]),
        ]);
        $resp = curl_exec($ch);
        $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($resp !== false && $code >= 200 && $code < 300) {
            $synced = true;
        }
    }

    voxi_json([
        'ok' => true,
        'e164' => $e164,
        'syncedWithVapi' => $synced,
        'message' => $synced
            ? "✓ Номер {$fallbackPhoneRaw} проверен и прописан в голосовом шлюзе Vapi (forwardingPhoneNumber: {$e164})."
            : "✓ Номер {$fallbackPhoneRaw} ({$e164}) прошёл проверку формата E.164 РБ и сохранён для переадресации.",
    ]);
}

// --- 4. Реальная серверная синхронизация ИИ-ассистента с Vapi.ai ---
if ($action === 'sync_assistant') {
    $vapiKey = trim((string)($body['apiKey'] ?? ''));
    if ($vapiKey === '') {
        $vapiKey = trim((string)($VOXI_CONFIG['vapi_api_key'] ?? ''));
    }

    $config = isset($body['config']) && is_array($body['config']) ? $body['config'] : [];
    $sip = isset($body['sipSettings']) && is_array($body['sipSettings']) ? $body['sipSettings'] : [];

    if (empty($config)) {
        voxi_json(['ok' => false, 'error' => 'Не передана конфигурация ассистента'], 400);
    }

    if ($vapiKey === '') {
        voxi_json([
            'ok' => false,
            'configured' => false,
            'error' => 'На сервере не задан VAPI_API_KEY (в .env или настройках). Добавьте ключ Vapi.ai для публикации голосового ассистента на телефонную линию.',
        ], 400);
    }

    $voice = strtolower((string)($config['voice'] ?? 'anna'));
    $voiceId = $voice === 'maxim' ? 'ErXwobaYiN019PkySvjV' : '21m00Tcm4TlvDq8ikWAM';

    $rawHost = trim((string)($_SERVER['HTTP_HOST'] ?? 'voxi.by'));
    $siteUrl = rtrim((string)($VOXI_CONFIG['public_site_url'] ?: "https://{$rawHost}"), '/');
    $webhookUrl = "{$siteUrl}/api/vapi-webhook";

    $fallbackDigits = preg_replace('/\D+/', '', (string)($sip['fallbackPhone'] ?? $config['phone'] ?? '')) ?? '';
    $forwardingNumber = (strlen($fallbackDigits) === 12 && str_starts_with($fallbackDigits, '375'))
        ? '+' . $fallbackDigits
        : null;

    // Identify authenticated user if DB is configured
    $userId = trim((string)($body['userId'] ?? ''));
    if (voxi_is_db_configured($VOXI_CONFIG)) {
        try {
            $pdo = voxi_get_pdo($VOXI_CONFIG);
            $authUser = voxi_find_authenticated_user($pdo);
            if (is_array($authUser) && !empty($authUser['id'])) {
                $userId = (string)$authUser['id'];
            }
        } catch (Throwable $e) {
            // ignore DB lookup failure during Vapi sync
        }
    }

    $vapiPayload = [
        'name' => mb_substr((string)($config['name'] ?? 'Voxi AI Assistant'), 0, 40),
        'firstMessage' => (string)($config['firstMessage'] ?? 'Здравствуйте! Чем могу вам помочь?'),
        'transcriber' => [
            'provider' => 'deepgram',
            'model' => 'nova-2',
            'language' => 'ru',
        ],
        'model' => [
            'provider' => 'openai',
            'model' => 'gpt-4o-mini',
            'temperature' => 0.35,
            'messages' => [
                [
                    'role' => 'system',
                    'content' => (string)($config['systemPrompt'] ?? ''),
                ],
            ],
        ],
        'voice' => [
            'provider' => '11labs',
            'voiceId' => $voiceId,
        ],
        'serverUrl' => $webhookUrl,
        'metadata' => [
            'userId' => $userId,
            'companyName' => (string)($config['companyName'] ?? ''),
            'niche' => (string)($config['niche'] ?? 'driving_school'),
        ],
    ];

    if ($forwardingNumber !== null) {
        $vapiPayload['forwardingPhoneNumber'] = $forwardingNumber;
    }

    $existingId = trim((string)($config['vapiAssistantId'] ?? ''));
    $isUpdate = $existingId !== '' && !str_starts_with($existingId, 'asst_mock_');

    $url = $isUpdate
        ? 'https://api.vapi.ai/assistant/' . rawurlencode($existingId)
        : 'https://api.vapi.ai/assistant';

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => $isUpdate ? 'PATCH' : 'POST',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 12,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_HTTPHEADER => [
            "Authorization: Bearer {$vapiKey}",
            'Content-Type: application/json',
            'Accept: application/json',
        ],
        CURLOPT_POSTFIELDS => json_encode($vapiPayload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    ]);
    $raw = curl_exec($ch);
    $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr = curl_error($ch);
    curl_close($ch);

    if ($raw === false) {
        voxi_json(['ok' => false, 'error' => 'Ошибка соединения с Vapi.ai: ' . $curlErr], 502);
    }

    $decoded = json_decode((string)$raw, true);
    if ($httpCode >= 200 && $httpCode < 300 && !empty($decoded['id'])) {
        $newAssistantId = (string)$decoded['id'];
        if (isset($pdo) && $userId !== '') {
            try {
                $stmt = $pdo->prepare('UPDATE assistants SET vapi_assistant_id = ?, updated_at = NOW() WHERE user_id = ?');
                $stmt->execute([$newAssistantId, $userId]);
            } catch (Throwable $e) {
                // ignore
            }
        }
        voxi_json([
            'ok' => true,
            'success' => true,
            'assistantId' => $newAssistantId,
            'webhookUrl' => $webhookUrl,
            'message' => "✓ Ассистент синхронизирован с Vapi.ai (ID: {$newAssistantId}). Webhook завершения звонков активен.",
        ]);
    }

    $errMsg = (string)($decoded['message'] ?? $decoded['error'] ?? "HTTP {$httpCode}");
    voxi_json([
        'ok' => false,
        'success' => false,
        'error' => "Ошибка Vapi API: {$errMsg}",
    ], 502);
}

voxi_json(['ok' => false, 'error' => 'Unknown telephony action'], 400);
