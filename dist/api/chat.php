<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if (strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET')) !== 'POST') {
    header('Allow: POST');
    voxi_json(['error' => 'Method Not Allowed'], 405);
}

$yandexApiKey = trim((string)($VOXI_CONFIG['yandex_api_key'] ?? ''));
$yandexIamToken = trim((string)($VOXI_CONFIG['yandex_iam_token'] ?? ''));
$yandexFolderId = trim((string)($VOXI_CONFIG['yandex_folder_id'] ?? ''));

if ($yandexFolderId === '' || ($yandexApiKey === '' && $yandexIamToken === '')) {
    voxi_json([
        'configured' => false,
        'error' => 'YANDEX_FOLDER_ID or YANDEX_API_KEY is not configured yet',
    ], 503);
}

$cbFile = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'voxi_yc_llm_cb.txt';
if (is_file($cbFile)) {
    $brokenUntil = (int)@file_get_contents($cbFile);
    if (time() < $brokenUntil) {
        voxi_json([
            'configured' => false,
            'error' => 'YandexGPT upstream in cooldown, using instant local fallback',
        ], 503);
    }
}

$body = voxi_read_json_body();
$mode = ($body['mode'] ?? 'dialogue') === 'generate_prompt' ? 'generate_prompt' : 'dialogue';
$ctx = isset($body['context']) && is_array($body['context']) ? $body['context'] : [];

$voice = strtolower((string)($ctx['voice'] ?? 'anna'));
$assistantName = $voice === 'maxim' ? 'Максим' : 'Анна';
$company = mb_substr((string)($ctx['companyName'] ?? 'компания'), 0, 120);
$city = mb_substr((string)($ctx['city'] ?? 'Минск'), 0, 60);
$address = mb_substr((string)($ctx['address'] ?? ''), 0, 200);
$workingHours = mb_substr((string)($ctx['workingHours'] ?? ''), 0, 160);
$phone = mb_substr((string)($ctx['phone'] ?? ''), 0, 60);
$pricing = mb_substr((string)($ctx['pricingAndServices'] ?? ''), 0, 1500);
$kb = mb_substr((string)($ctx['knowledgeBase'] ?? ''), 0, 1500);
$customPrompt = mb_substr((string)($ctx['systemPrompt'] ?? ''), 0, 1500);

if ($mode === 'generate_prompt') {
    $maxTokens = 550;
    $temperature = 0.45;
    $parts = array_filter([
        'Составь готовый, четкий системный промпт на русском языке для телефонного голосового ИИ-администратора бизнеса в Беларуси.',
        "Имя администратора: {$assistantName}.",
        "Организация: «{$company}» ({$city}).",
        $address !== '' ? "Адрес: {$address}." : '',
        $workingHours !== '' ? "График работы: {$workingHours}." : '',
        $phone !== '' ? "Телефон для перевода на живого специалиста: {$phone}." : '',
        $pricing !== '' ? "Прайс-лист и услуги (в BYN):\n{$pricing}" : '',
        'Требования к промпту: укажи роль, тон общения по телефону (короткие фразы по 1–2 предложения без списков), правила называния цен строго в белорусских рублях (BYN), алгоритм записи клиента (узнать услугу, удобный день/время и имя) и условие перевода звонка на менеджера в сложных случаях. Объем — до 1200 символов.',
    ]);
    $messages = [
        ['role' => 'system', 'text' => 'Ты — ведущий архитектор голосовых телефонных ИИ-ассистентов для бизнеса в Республике Беларусь.'],
        ['role' => 'user', 'text' => implode("\n", $parts)],
    ];
} else {
    $maxTokens = 240;
    $temperature = 0.35;
    $query = mb_substr(trim((string)($body['query'] ?? '')), 0, 500);
    if ($query === '') {
        voxi_json(['error' => 'Missing query'], 400);
    }

    $sysParts = array_filter([
        "Ты — живой телефонный ИИ-администратор {$assistantName} компании «{$company}» ({$city}, Беларусь).",
        'Ты разговариваешь с клиентом ПО ТЕЛЕФОНУ в реальном времени. Твой ответ сразу озвучивается синтезатором речи.',
        'СТРОГИЕ ПРАВИЛА ФОРМАТА:',
        '- Отвечай КОРОТКО и естественно: 1–3 лаконичных предложения (максимум 35–45 слов), как вежливый живой администратор по телефону.',
        '- КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО использовать списки, маркеры, звездочки (*), решетки (#), эмодзи и спецсимволы — пиши только чистый связный текст для озвучки.',
        '- Все цены называй строго в белорусских рублях (например: «120 белорусских рублей» или «120 рублей», не используй российские рубли или доллары).',
        '- Опирайся ТОЛЬКО на данные компании ниже. Не выдумывай несуществующие акции или адреса.',
        '- В конце реплики мягко веди клиента к целевому действию (запись на удобное время, уточнение марки авто / услуги или номера телефона).',
        $address !== '' ? "Адрес компании: {$address}." : '',
        $workingHours !== '' ? "График работы: {$workingHours}." : '',
        $phone !== '' ? "Контактный телефон для перевода на специалиста: {$phone}." : '',
        $pricing !== '' ? "Прайс-лист и услуги:\n{$pricing}" : '',
        $kb !== '' ? "База знаний:\n{$kb}" : '',
        $customPrompt !== '' ? "Дополнительные инструкции бизнеса:\n{$customPrompt}" : '',
    ]);

    $messages = [['role' => 'system', 'text' => implode("\n", $sysParts)]];
    $rawHistory = isset($body['history']) && is_array($body['history']) ? array_slice($body['history'], -8) : [];
    foreach ($rawHistory as $item) {
        if (!is_array($item)) {
            continue;
        }
        $txt = mb_substr(trim((string)($item['text'] ?? '')), 0, 500);
        if ($txt !== '') {
            $messages[] = [
                'role' => ($item['speaker'] ?? '') === 'assistant' ? 'assistant' : 'user',
                'text' => $txt,
            ];
        }
    }
    $messages[] = ['role' => 'user', 'text' => $query];
}

$authHeader = $yandexApiKey !== '' ? "Api-Key {$yandexApiKey}" : "Bearer {$yandexIamToken}";
$ch = curl_init('https://llm.api.cloud.yandex.net/foundationModels/v1/completion');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT_MS => 1200,
    CURLOPT_TIMEOUT_MS => 1800,
    CURLOPT_HTTPHEADER => [
        "Authorization: {$authHeader}",
        'Content-Type: application/json',
        "x-folder-id: {$yandexFolderId}",
    ],
    CURLOPT_POSTFIELDS => json_encode([
        'modelUri' => "gpt://{$yandexFolderId}/yandexgpt-lite/latest",
        'completionOptions' => [
            'stream' => false,
            'temperature' => $temperature,
            'maxTokens' => $maxTokens,
        ],
        'messages' => $messages,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
]);

$rawResp = curl_exec($ch);
$httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($rawResp === false || $httpCode < 200 || $httpCode >= 300) {
    $cooldown = ($httpCode === 401 || $httpCode === 403) ? 300 : 120;
    @file_put_contents($cbFile, (string)(time() + $cooldown));
    voxi_json([
        'configured' => false,
        'error' => 'YandexGPT upstream error or timeout',
        'status' => $httpCode,
    ], ($httpCode === 401 || $httpCode === 403) ? 503 : 502);
}

$data = json_decode((string)$rawResp, true);
$rawReply = trim((string)($data['result']['alternatives'][0]['message']['text'] ?? ''));

if ($rawReply === '') {
    voxi_json(['error' => 'Empty response from YandexGPT'], 502);
}

header('X-LLM-Provider: yandexgpt-lite');

if ($mode === 'generate_prompt') {
    voxi_json([
        'systemPrompt' => $rawReply,
        'provider' => 'yandexgpt-lite',
    ]);
}

$sanitized = preg_replace('/[*#_`~>]+/u', '', $rawReply) ?? $rawReply;
$sanitized = preg_replace('/\[([^\]]+)\]\([^)]+\)/u', '$1', $sanitized) ?? $sanitized;
$sanitized = trim(preg_replace('/\s+/u', ' ', $sanitized) ?? $sanitized);

voxi_json([
    'reply' => $sanitized,
    'provider' => 'yandexgpt-lite',
]);
