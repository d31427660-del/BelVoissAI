<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if (strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET')) !== 'POST') {
    header('Allow: POST');
    voxi_json(['error' => 'Method Not Allowed'], 405);
}

$body = voxi_read_json_body();
$webhookUrl = trim((string)($body['webhookUrl'] ?? ''));
$secretKey = trim((string)($body['secretKey'] ?? ''));
$sendFormat = (string)($body['sendFormat'] ?? 'json_standard');
$lead = isset($body['lead']) && is_array($body['lead']) ? $body['lead'] : [];
$isTest = !empty($body['isTest']);

if ($webhookUrl === '' || !preg_match('/^https?:\/\//i', $webhookUrl)) {
    voxi_json(['error' => 'Укажите корректный URL-адрес обработчика (начинающийся с https:// или http://)'], 400);
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
