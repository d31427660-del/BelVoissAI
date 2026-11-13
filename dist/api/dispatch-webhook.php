<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
voxi_csrf_guard();

if (strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET')) !== 'POST') {
    header('Allow: POST');
    voxi_json(['error' => 'Method Not Allowed'], 405);
}

function voxi_is_private_or_internal_ip(string $ip): bool
{
    // Filter private and reserved ranges
    if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
        return true;
    }
    // Block AWS/GCP/Azure link-local metadata (169.254.169.254)
    if (str_starts_with($ip, '169.254.') || str_starts_with($ip, '127.')) {
        return true;
    }
    return false;
}

function voxi_validate_webhook_safety(string $url): ?string
{
    $parts = parse_url($url);
    if (!$parts || empty($parts['host']) || empty($parts['scheme'])) {
        return 'Некорректный адрес вебхука';
    }
    $scheme = strtolower($parts['scheme']);
    if ($scheme !== 'https' && $scheme !== 'http') {
        return 'Разрешены только https:// или http:// протоколы';
    }
    $host = strtolower($parts['host']);
    if ($host === 'localhost' || str_ends_with($host, '.localhost') || str_ends_with($host, '.local') || str_ends_with($host, '.internal')) {
        return 'Запрещено обращаться к локальным адресам';
    }

    $ips = @gethostbynamel($host);
    if (!is_array($ips) || empty($ips)) {
        return 'Не удалось определить IP-адрес узла вебхука';
    }
    foreach ($ips as $ip) {
        if (voxi_is_private_or_internal_ip($ip)) {
            return 'Запрещено обращаться к закрытым IP-адресам внутренней сети хостинга';
        }
    }
    return null;
}

$body = voxi_read_json_body();
$action = trim((string)($body['action'] ?? ''));
$webhookUrl = trim((string)($body['webhookUrl'] ?? ''));
$secretKey = trim((string)($body['secretKey'] ?? ''));
$sendFormat = (string)($body['sendFormat'] ?? 'json_standard');
$lead = isset($body['lead']) && is_array($body['lead']) ? $body['lead'] : [];
$isTest = !empty($body['isTest']);

if ($action === 'caller_notification') {
    $channel = trim((string)($body['channel'] ?? 'sms'));
    $provider = trim((string)($body['provider'] ?? 'sms_by'));
    $recipientRaw = trim((string)($body['recipient'] ?? ''));
    $recipientDigits = preg_replace('/\D+/', '', $recipientRaw) ?? '';
    $messageText = trim((string)($body['message'] ?? ''));
    $senderName = trim((string)($body['senderName'] ?? 'Voxi'));
    $apiKey = trim((string)($body['apiKey'] ?? ''));
    $apiLogin = trim((string)($body['apiLogin'] ?? ''));

    if ($recipientDigits === '' || strlen($recipientDigits) < 9 || $messageText === '') {
        voxi_json(['ok' => false, 'deliveryStatus' => 'failed', 'error' => 'Укажите корректный номер получателя (+375...) и текст сообщения'], 400);
    }

    // 1. SMS.by API v1
    if ($provider === 'sms_by') {
        $token = $apiKey !== '' ? $apiKey : (function_exists('voxi_env') ? voxi_env(['SMS_BY_TOKEN'], '') : (string)(getenv('SMS_BY_TOKEN') ?: ''));
        if ($token === '') {
            voxi_json(['ok' => false, 'deliveryStatus' => 'failed', 'error' => 'Не указан API-токен SMS.by'], 400);
        }
        $qs = http_build_query([
            'token' => $token,
            'message' => $messageText,
            'phone' => $recipientDigits,
        ]);
        $ch = curl_init("https://app.sms.by/api/v1/sendQuickSMS?{$qs}");
        curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT_MS => 6500]);
        $resp = curl_exec($ch);
        $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        $decoded = is_string($resp) ? json_decode($resp, true) : null;
        if ($code >= 200 && $code < 300 && empty($decoded['error'])) {
            voxi_json(['ok' => true, 'deliveryStatus' => 'sent', 'provider' => 'sms_by', 'channel' => $channel, 'recipient' => $recipientRaw, 'providerResponse' => $decoded], 200);
        }
        voxi_json(['ok' => false, 'deliveryStatus' => 'failed', 'error' => (string)($decoded['error'] ?? "Ошибка SMS.by (HTTP {$code})")], 502);
    }

    // 2. RocketSMS.by API
    if ($provider === 'rocketsms') {
        $user = $apiLogin !== '' ? $apiLogin : (function_exists('voxi_env') ? voxi_env(['ROCKETSMS_USERNAME'], '') : (string)(getenv('ROCKETSMS_USERNAME') ?: ''));
        $pass = $apiKey !== '' ? $apiKey : (function_exists('voxi_env') ? voxi_env(['ROCKETSMS_PASSWORD'], '') : (string)(getenv('ROCKETSMS_PASSWORD') ?: ''));
        if ($user === '' || $pass === '') {
            voxi_json(['ok' => false, 'deliveryStatus' => 'failed', 'error' => 'Укажите логин и пароль/ключ RocketSMS.by'], 400);
        }
        $postFields = http_build_query([
            'username' => $user,
            'password' => $pass,
            'phone' => $recipientDigits,
            'text' => $messageText,
            'sender' => $senderName,
        ]);
        $ch = curl_init('https://api.rocketsms.by/simple/send');
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT_MS => 6500,
            CURLOPT_POSTFIELDS => $postFields,
        ]);
        $resp = curl_exec($ch);
        $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        $decoded = is_string($resp) ? json_decode($resp, true) : null;
        if ($code >= 200 && $code < 300 && empty($decoded['error'])) {
            voxi_json(['ok' => true, 'deliveryStatus' => 'sent', 'provider' => 'rocketsms', 'channel' => $channel, 'recipient' => $recipientRaw, 'providerResponse' => $decoded], 200);
        }
        voxi_json(['ok' => false, 'deliveryStatus' => 'failed', 'error' => (string)($decoded['error'] ?? "Ошибка RocketSMS (HTTP {$code})")], 502);
    }

    // 3. Viber Business / Custom Webhook URL
    $viberUrl = $webhookUrl !== '' ? $webhookUrl : (function_exists('voxi_env') ? voxi_env(['VIBER_WEBHOOK_URL'], '') : (string)(getenv('VIBER_WEBHOOK_URL') ?: ''));
    if ($viberUrl === '' || !preg_match('/^https?:\/\//i', $viberUrl)) {
        voxi_json(['ok' => false, 'deliveryStatus' => 'failed', 'error' => 'Укажите Webhook URL для Viber Business / шлюза уведомлений'], 400);
    }
    $safetyErr = voxi_validate_webhook_safety($viberUrl);
    if ($safetyErr !== null) {
        voxi_json(['ok' => false, 'deliveryStatus' => 'failed', 'error' => $safetyErr], 400);
    }
    $headers = ['Content-Type: application/json'];
    if ($apiKey !== '') {
        $headers[] = "Authorization: Bearer {$apiKey}";
    }
    $ch = curl_init($viberUrl);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_TIMEOUT_MS => 6500,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_POSTFIELDS => json_encode([
            'channel' => $channel,
            'recipient' => $recipientRaw,
            'phone' => $recipientDigits,
            'senderName' => $senderName,
            'message' => $messageText,
            'source' => 'Voxi.by',
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    ]);
    $resp = curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($resp !== false && $code >= 200 && $code < 300) {
        voxi_json(['ok' => true, 'deliveryStatus' => 'sent', 'provider' => $provider, 'channel' => $channel, 'recipient' => $recipientRaw], 200);
    }
    voxi_json(['ok' => false, 'deliveryStatus' => 'failed', 'error' => "Ошибка шлюза Viber/Webhook (HTTP {$code})"], 502);
}

if ($webhookUrl === '' || !preg_match('/^https?:\/\//i', $webhookUrl)) {
    voxi_json(['error' => 'Укажите корректный URL-адрес обработчика (начинающийся с https:// или http://)'], 400);
}

$safetyErr = voxi_validate_webhook_safety($webhookUrl);
if ($safetyErr !== null) {
    voxi_json(['error' => $safetyErr], 400);
}

$clientName = (string)($lead['clientName'] ?? 'Тестовый клиент');
$phone = (string)($lead['phone'] ?? '+375 (29) 682-14-99');
$service = (string)($lead['service'] ?? 'Консультация и запись на обслуживание');
$preferredDate = (string)($lead['preferredDate'] ?? 'Сегодня в 18:30');
$summary = (string)($lead['summary'] ?? 'Клиент обратился за консультацией по услугам, зафиксировано удобное время.');
$dealValueByn = (float)($lead['dealValueByn'] ?? 120);

if ($sendFormat === 'bitrix24') {
    $outboundPayload = [
        'fields' => [
            'TITLE' => "Звонок Voxi.by: {$clientName} ({$service})",
            'NAME' => $clientName,
            'PHONE' => [['VALUE' => $phone, 'VALUE_TYPE' => 'WORK']],
            'COMMENTS' => "Услуга: {$service}\nЖелаемое время: {$preferredDate}\n{$summary}",
            'OPPORTUNITY' => $dealValueByn,
            'CURRENCY_ID' => 'BYN',
            'SOURCE_ID' => 'CALL',
        ],
    ];
} elseif ($sendFormat === 'amocrm') {
    $outboundPayload = [[
        'name' => "Заявка со звонка: {$clientName} — {$service}",
        'price' => $dealValueByn,
        'custom_fields_values' => [
            ['field_name' => 'Телефон', 'values' => [['value' => $phone]]],
            ['field_name' => 'Услуга', 'values' => [['value' => $service]]],
            ['field_name' => 'Примечание', 'values' => [['value' => "{$summary} (Желаемое время: {$preferredDate})"]]],
        ],
    ]];
} else {
    $outboundPayload = [
        'event' => $isTest ? 'test.ping' : 'call.completed',
        'timestamp' => (string)($lead['timestamp'] ?? date('c')),
        'isTest' => $isTest,
        'caller' => ['name' => $clientName, 'phone' => $phone],
        'lead' => [
            'service' => $service,
            'preferredDate' => $preferredDate,
            'dealValueByn' => $dealValueByn,
            'urgency' => (string)($lead['urgency'] ?? 'normal'),
        ],
        'summary' => $summary,
        'transcript' => $lead['transcript'] ?? [],
        'source' => 'Voxi.by Telephony Bot',
    ];
}

$headers = [
    'Content-Type: application/json',
    'User-Agent: Voxi-Webhook-Dispatcher/1.0',
];
if ($secretKey !== '') {
    $headers[] = "X-Voxi-Secret: {$secretKey}";
}

$ch = curl_init($webhookUrl);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_TIMEOUT_MS => 6500,
    CURLOPT_HTTPHEADER => $headers,
    CURLOPT_POSTFIELDS => json_encode($outboundPayload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
]);

$respText = curl_exec($ch);
$curlErr = curl_error($ch);
$httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($respText === false) {
    voxi_json([
        'ok' => false,
        'error' => $curlErr !== '' ? $curlErr : 'Сетевая ошибка при отправке вебхука',
    ], 200);
}

voxi_json([
    'ok' => $httpCode >= 200 && $httpCode < 300,
    'status' => $httpCode,
    'statusText' => $httpCode >= 200 && $httpCode < 300 ? 'OK' : "HTTP {$httpCode}",
    'responseText' => mb_substr((string)$respText, 0, 300),
], 200);
