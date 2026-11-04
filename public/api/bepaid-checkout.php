<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if (strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET')) !== 'POST') {
    header('Allow: POST');
    voxi_json(['error' => 'Method Not Allowed'], 405);
}

$shopId = trim((string)($VOXI_CONFIG['bepaid_shop_id'] ?? ''));
$secretKey = trim((string)($VOXI_CONFIG['bepaid_secret_key'] ?? ''));

if ($shopId === '' || $secretKey === '') {
    voxi_json([
        'configured' => false,
        'message' => 'Шлюз bePaid ещё не активирован (не заданы bepaid_shop_id и bepaid_secret_key в api/config.php).',
    ], 503);
}

$packages = [
    'pack_100' => ['minutes' => 100, 'priceByn' => 45, 'name' => 'Старт (100 минут)'],
    'pack_300' => ['minutes' => 300, 'priceByn' => 120, 'name' => 'Бизнес (300 минут)'],
    'pack_1000' => ['minutes' => 1000, 'priceByn' => 350, 'name' => 'Сеть / Колл-центр (1000 минут)'],
];

$body = voxi_read_json_body();
$packageId = (string)($body['packageId'] ?? '');
$customMinutes = isset($body['customMinutes']) && is_numeric($body['customMinutes']) ? (float)$body['customMinutes'] : null;
$paymentMethod = (string)($body['paymentMethod'] ?? 'card');
$userId = trim((string)($body['userId'] ?? 'guest')) ?: 'guest';
$email = trim((string)($body['email'] ?? ''));
$companyName = trim((string)($body['companyName'] ?? ''));

$minutes = 300;
$amountByn = 120;
$description = 'Пополнение баланса Voxi.by — 300 минут';

if ($packageId !== '' && isset($packages[$packageId])) {
    $pkg = $packages[$packageId];
    $minutes = (int)$pkg['minutes'];
    $amountByn = (int)$pkg['priceByn'];
    $description = 'Voxi.by — пакет «' . $pkg['name'] . '»';
} elseif ($customMinutes !== null && $customMinutes >= 50 && $customMinutes <= 10000) {
    $minutes = (int)round($customMinutes);
    $rate = $minutes >= 1000 ? 0.35 : ($minutes >= 300 ? 0.40 : 0.45);
    $amountByn = (int)round($minutes * $rate);
    $description = "Voxi.by — пополнение на {$minutes} минут";
}

$amountKopecks = (int)round($amountByn * 100);
$isTest = (bool)($VOXI_CONFIG['bepaid_test_mode'] ?? true);
$host = (string)($_SERVER['HTTP_HOST'] ?? 'voxi.by');
$siteUrl = rtrim((string)($VOXI_CONFIG['public_site_url'] ?: "https://{$host}"), '/');
$trackingId = "{$userId}:{$minutes}:" . round(microtime(true) * 1000);
$eripServiceNo = (string)($VOXI_CONFIG['bepaid_erip_service_no'] ?: '99999999');

$checkout = [
    'test' => $isTest,
    'transaction_type' => 'payment',
    'attempts' => 3,
    'settings' => [
        'success_url' => "{$siteUrl}/?payment=success&minutes={$minutes}",
        'decline_url' => "{$siteUrl}/?payment=declined",
        'fail_url' => "{$siteUrl}/?payment=failed",
        'cancel_url' => "{$siteUrl}/?payment=cancelled",
        'notification_url' => "{$siteUrl}/api/bepaid-webhook",
        'language' => 'ru',
        'customer_fields' => ['visible' => ['email']],
    ],
    'order' => [
        'currency' => 'BYN',
        'amount' => $amountKopecks,
        'description' => $description,
        'tracking_id' => $trackingId,
    ],
    'customer' => $email !== '' ? ['email' => $email] : new stdClass(),
];

if ($paymentMethod === 'erip') {
    $checkout['payment_method'] = [
        'types' => ['erip'],
        'erip' => [
            'order_id' => substr((string)time(), -8),
            'account_number' => $email !== '' ? $email : ($userId !== 'guest' ? $userId : 'voxi-client'),
            'service_no' => $eripServiceNo,
            'service_info' => [
                $description,
                $companyName !== '' ? "Клиент: {$companyName}" : 'ИП Беляков К.О., УНП 193991846',
            ],
        ],
    ];
} else {
    $checkout['payment_method'] = [
        'types' => ['credit_card', 'erip'],
    ];
}

$basicAuth = base64_encode("{$shopId}:{$secretKey}");
$ch = curl_init('https://checkout.bepaid.by/ctp/api/checkouts');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 8,
    CURLOPT_HTTPHEADER => [
        "Authorization: Basic {$basicAuth}",
        'Content-Type: application/json',
        'Accept: application/json',
        'X-API-Version: 2',
    ],
    CURLOPT_POSTFIELDS => json_encode(['checkout' => $checkout], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
]);

$rawResp = curl_exec($ch);
$httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$data = is_string($rawResp) ? json_decode($rawResp, true) : null;
$redirectUrl = is_array($data) ? ($data['checkout']['redirect_url'] ?? '') : '';

if ($httpCode < 200 || $httpCode >= 300 || $redirectUrl === '') {
    voxi_json([
        'configured' => true,
        'error' => is_array($data) && !empty($data['message'])
            ? (string)$data['message']
            : 'Ошибка создания платёжной сессии bePaid',
    ], 502);
}

voxi_json([
    'configured' => true,
    'redirectUrl' => (string)$redirectUrl,
    'token' => (string)($data['checkout']['token'] ?? ''),
]);
