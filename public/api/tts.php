<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

$method = strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET'));
if ($method !== 'GET' && $method !== 'POST') {
    header('Allow: GET, POST');
    http_response_code(405);
    exit('Method Not Allowed');
}

$body = $method === 'POST' ? voxi_read_json_body() : [];
$rawText = trim((string)($_GET['text'] ?? $body['text'] ?? ''));
$voiceParam = strtolower(trim((string)($_GET['voice'] ?? $body['voice'] ?? 'anna')));

if ($rawText === '') {
    http_response_code(400);
    exit('Missing text parameter');
}

$cleanText = preg_replace('/\bBYN\b/iu', 'рублей', $rawText) ?? $rawText;
$cleanText = str_replace(['"', '«', '»', '&', '<', '>'], ' ', $cleanText);
$cleanText = trim(preg_replace('/\s+/u', ' ', $cleanText) ?? $cleanText);
$cleanText = mb_substr($cleanText, 0, 600);

$voiceMapYandex = [
    'anna' => ['voice' => 'alena', 'emotion' => 'good'],
    'dmitry' => ['voice' => 'filipp'],
    'polina' => ['voice' => 'marina'],
    'maxim' => ['voice' => 'ermil', 'emotion' => 'good'],
];

$yandexApiKey = trim((string)($VOXI_CONFIG['yandex_api_key'] ?? ''));
$yandexIamToken = trim((string)($VOXI_CONFIG['yandex_iam_token'] ?? ''));
$yandexFolderId = trim((string)($VOXI_CONFIG['yandex_folder_id'] ?? ''));
$cbFile = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'voxi_yc_tts_cb.txt';
$ycCircuitBroken = is_file($cbFile) && time() < (int)@file_get_contents($cbFile);

// 1. Primary: Yandex SpeechKit TTS v1
if (!$ycCircuitBroken && ($yandexApiKey !== '' || ($yandexIamToken !== '' && $yandexFolderId !== ''))) {
    $profile = $voiceMapYandex[$voiceParam] ?? $voiceMapYandex['anna'];
    $params = [
        'text' => $cleanText,
        'lang' => 'ru-RU',
        'voice' => $profile['voice'],
        'speed' => '1.05',
        'format' => 'mp3',
    ];
    if (!empty($profile['emotion'])) {
        $params['emotion'] = $profile['emotion'];
    }
    if ($yandexApiKey === '' && $yandexFolderId !== '') {
        $params['folderId'] = $yandexFolderId;
    }

    $authHeader = $yandexApiKey !== '' ? "Api-Key {$yandexApiKey}" : "Bearer {$yandexIamToken}";
    $ch = curl_init('https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT_MS => 1200,
        CURLOPT_TIMEOUT_MS => 2500,
        CURLOPT_HTTPHEADER => [
            "Authorization: {$authHeader}",
            'Content-Type: application/x-www-form-urlencoded',
        ],
        CURLOPT_POSTFIELDS => http_build_query($params),
    ]);

    $audioBytes = curl_exec($ch);
    $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if (is_string($audioBytes) && $audioBytes !== '' && $httpCode >= 200 && $httpCode < 300) {
        http_response_code(200);
        header('Content-Type: audio/mpeg');
        header('Cache-Control: public, max-age=86400');
        header('X-TTS-Provider: yandex-speechkit');
        header('Content-Length: ' . strlen($audioBytes));
        echo $audioBytes;
        exit;
    }

    $cooldown = 10;
    @file_put_contents($cbFile, (string)(time() + $cooldown));
}

// 2. Fallback: Neural TTS relay (если Yandex ключ ещё не прописан на хостинге)
$fallbackUrl = trim((string)($VOXI_CONFIG['fallback_tts_url'] ?? ''));
if ($fallbackUrl !== '') {
    $target = $fallbackUrl
        . '?voice=' . rawurlencode($voiceParam)
        . '&text=' . rawurlencode($cleanText);

    $ch = curl_init($target);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_CONNECTTIMEOUT_MS => 1200,
        CURLOPT_TIMEOUT_MS => 2300,
    ]);
    $audioBytes = curl_exec($ch);
    $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if (is_string($audioBytes) && $audioBytes !== '' && $httpCode >= 200 && $httpCode < 300) {
        http_response_code(200);
        header('Content-Type: audio/mpeg');
        header('Cache-Control: public, max-age=3600');
        header('X-TTS-Provider: neural-fallback');
        header('Content-Length: ' . strlen($audioBytes));
        echo $audioBytes;
        exit;
    }
}

http_response_code(503);
exit('TTS synthesis unavailable');
