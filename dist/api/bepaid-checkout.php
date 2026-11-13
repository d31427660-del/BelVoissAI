<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
voxi_csrf_guard();

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

// Оплата доступна только авторизованным пользователям: userId берётся ИСКЛЮЧИТЕЛЬНО из серверной сессии
if (!voxi_is_db_configured($VOXI_CONFIG)) {
    voxi_json(['configured' => false, 'error' => 'База данных не настроена'], 503);
}
try {
    $pdo = voxi_get_pdo($VOXI_CONFIG);
    $authUser = voxi_find_authenticated_user($pdo);
} catch (Throwable) {
    voxi_json(['error' => 'Сервис временно недоступен'], 503);
}
if (!$authUser) {
    voxi_json(['error' => 'Войдите в личный кабинет, чтобы пополнить баланс'], 401);
}
voxi_enforce_rate_limit('bepaid_checkout', 10, 60);
$userId = (string)$authUser['id'];
$email = (string)$authUser['email'];
$companyName = (string)$authUser['company_name'];

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
$rawHost = trim((string)($_SERVER['HTTP_HOST'] ?? 'voxi.by'));
$hostWithoutPort = strtolower((string)explode(':', $rawHost)[0]);
$allowedHosts = ['voxi.by', 'www.voxi.by', 'localhost', '127.0.0.1'];
$safeSiteUrl = in_array($hostWithoutPort, $allowedHosts, true)
    ? (($hostWithoutPort === 'localhost' || $hostWithoutPort === '127.0.0.1') ? "http://{$rawHost}" : "https://{$rawHost}")
    : 'https://voxi.by';
$siteUrl = rtrim((string)($VOXI_CONFIG['public_site_url'] ?: $safeSiteUrl), '/');
// Заказ фиксирует сумму и минуты НА СЕРВЕРЕ: вебхук доверяет только этому заказу, а не данным из платежа
$orderId = voxi_uuid();
$pdo->prepare(
    'INSERT INTO payment_orders (id, user_id, minutes, amount_kopecks, currency, status, is_test)
     VALUES (?, ?, ?, ?, ?, ?, ?)'
)->execute([$orderId, $userId, $minutes, $amountKopecks, 'BYN', 'pending', $isTest ? 1 : 0]);
$trackingId = $orderId;
$eripServiceNo = (string)($VOXI_CONFIG['bepaid_erip_service_no'] ?: '99999999');

$checkout = [
    'test' => $isTest,
    'transaction_type' => 'payment',
    'attempts' => 3,
    'settings' => [
        'success_url' => "{$siteUrl}/?payment=success",
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
            'account_number' => $email !== '' ? $email : $userId,
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
