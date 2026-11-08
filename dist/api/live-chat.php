<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dataFile = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'voxi_livechat_store.json';

function getLiveChatData(string $filePath): array {
    if (!is_file($filePath)) {
        return [];
    }
    $fp = @fopen($filePath, 'rb');
    if (!$fp) {
        return [];
    }
    @flock($fp, LOCK_SH);
    $raw = @stream_get_contents($fp);
    @flock($fp, LOCK_UN);
    @fclose($fp);
    if (!$raw) return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function saveLiveChatData(string $filePath, array $data): void {
    if (count($data) > 200) {
        uasort($data, function ($a, $b) {
            return strcmp($b['lastMessageAt'] ?? '', $a['lastMessageAt'] ?? '');
        });
        $data = array_slice($data, 0, 200, true);
    }
    @file_put_contents($filePath, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
}

function resolveTelegramAdminChatId(string $botToken, array $voxiConfig): string {
    $chatId = trim((string)($voxiConfig['telegram_admin_chat_id'] ?? getenv('TELEGRAM_ADMIN_CHAT_ID') ?: getenv('TELEGRAM_CHAT_ID') ?: ''));
    if ($chatId !== '') {
        return $chatId;
    }

    $cacheFile = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'voxi_tg_admin_chat_id.txt';
    if (is_file($cacheFile)) {
        $cached = trim((string)@file_get_contents($cacheFile));
        if ($cached !== '') {
            return $cached;
        }
    }

    $ch = curl_init("https://api.telegram.org/bot{$botToken}/getUpdates?limit=30");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 3,
    ]);
    $raw = curl_exec($ch);
    curl_close($ch);
    if (!$raw) return '';

    $decoded = json_decode((string)$raw, true);
    if (is_array($decoded) && !empty($decoded['ok']) && !empty($decoded['result']) && is_array($decoded['result'])) {
        for ($i = count($decoded['result']) - 1; $i >= 0; $i--) {
            $upd = $decoded['result'][$i];
            $foundId = $upd['message']['chat']['id'] ?? ($upd['edited_message']['chat']['id'] ?? null);
            if ($foundId) {
                $foundStr = (string)$foundId;
                @file_put_contents($cacheFile, $foundStr, LOCK_EX);
                return $foundStr;
            }
        }
    }
    return '';
}

function syncTelegramAdminReplies(string $filePath, array $voxiConfig): void {
    $botToken = trim((string)($voxiConfig['telegram_bot_token'] ?? getenv('TELEGRAM_BOT_TOKEN') ?: '9051705111:AAGD452S-c8yZtcBa6gMV1mxYEUHsG9rZ7U'));
    if ($botToken === '') return;

    $offsetFile = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'voxi_tg_last_update_id.txt';
    $lastUpdateId = is_file($offsetFile) ? (int)trim((string)@file_get_contents($offsetFile)) : 0;
    $offsetQuery = $lastUpdateId > 0 ? '&offset=' . ($lastUpdateId + 1) : '';

    $ch = curl_init("https://api.telegram.org/bot{$botToken}/getUpdates?limit=30{$offsetQuery}");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 3,
    ]);
    $raw = curl_exec($ch);
    curl_close($ch);
    if (!$raw) return;

    $decoded = json_decode((string)$raw, true);
    if (!is_array($decoded) || empty($decoded['ok']) || empty($decoded['result']) || !is_array($decoded['result'])) {
        return;
    }

    $allData = getLiveChatData($filePath);
    $changed = false;
    $chatCacheFile = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'voxi_tg_admin_chat_id.txt';

    foreach ($decoded['result'] as $upd) {
        $updId = (int)($upd['update_id'] ?? 0);
        if ($updId > $lastUpdateId) {
            $lastUpdateId = $updId;
        }
        $msg = $upd['message'] ?? null;
        if (!is_array($msg) || empty($msg['text']) || !empty($msg['from']['is_bot'])) {
            continue;
        }
        if (!empty($msg['chat']['id'])) {
            @file_put_contents($chatCacheFile, (string)$msg['chat']['id'], LOCK_EX);
        }

        $rawText = trim((string)$msg['text']);
        if ($rawText === '/start' || empty($allData)) {
            continue;
        }

        $targetConvId = '';
        $repliedText = (string)($msg['reply_to_message']['text'] ?? '');
        if (preg_match('/Диалог:\s*([^\s\n]+)/u', $repliedText, $m)) {
            $candidate = trim($m[1]);
            if (isset($allData[$candidate])) {
                $targetConvId = $candidate;
            }
        }
        if ($targetConvId === '') {
            uasort($allData, function ($a, $b) {
                return strcmp($b['lastMessageAt'] ?? '', $a['lastMessageAt'] ?? '');
            });
            $firstKey = array_key_first($allData);
            if ($firstKey) {
                $targetConvId = (string)$firstKey;
            }
        }
        if ($targetConvId === '' || !isset($allData[$targetConvId])) {
            continue;
        }

        $tgMsgId = 'tg_reply_' . (string)($msg['message_id'] ?? time());
        $exists = false;
        foreach (($allData[$targetConvId]['messages'] ?? []) as $existingMsg) {
            if (($existingMsg['id'] ?? '') === $tgMsgId) {
                $exists = true;
                break;
            }
        }
        if (!$exists) {
            $createdAt = !empty($msg['date']) ? date('c', (int)$msg['date']) : date('c');
            $storedMsg = [
                'id' => $tgMsgId,
                'conversationId' => $targetConvId,
                'sender' => 'admin',
                'senderName' => 'Администратор Voxi',
                'text' => mb_substr($rawText, 0, 2000),
                'createdAt' => $createdAt,
                'action' => null,
            ];
            $allData[$targetConvId]['messages'][] = $storedMsg;
            $allData[$targetConvId]['lastMessageAt'] = $createdAt;
            $allData[$targetConvId]['lastMessageText'] = $storedMsg['text'];
            $changed = true;
        }
    }

    if ($lastUpdateId > 0) {
        @file_put_contents($offsetFile, (string)$lastUpdateId, LOCK_EX);
    }
    if ($changed) {
        saveLiveChatData($filePath, $allData);
    }
}

function notifyTelegram(array $message, array $conv, array $voxiConfig): void {
    $botToken = trim((string)($voxiConfig['telegram_bot_token'] ?? getenv('TELEGRAM_BOT_TOKEN') ?: '9051705111:AAGD452S-c8yZtcBa6gMV1mxYEUHsG9rZ7U'));
    if ($botToken === '') {
        return;
    }

    $chatId = resolveTelegramAdminChatId($botToken, $voxiConfig);
    if ($chatId === '') {
        return;
    }

    $contact = !empty($conv['visitorContact']) ? "\n📞 Контакт: " . $conv['visitorContact'] : '';
    $city = !empty($conv['visitorCity']) ? " [" . $conv['visitorCity'] . "]" : '';
    $text = "💬 Новое сообщение в онлайн-чате Voxi.by!\n" .
            "👤 От: " . ($conv['visitorName'] ?? 'Посетитель') . "{$city}{$contact}\n" .
            "🆔 Диалог: " . ($conv['id'] ?? '') . "\n\n" .
            "📝 Сообщение:\n" . ($message['text'] ?? '') . "\n\n" .
            "💡 Ответьте (Reply) прямо на это сообщение в Telegram — ваш ответ мгновенно появится у клиента на сайте!";

    $url = "https://api.telegram.org/bot{$botToken}/sendMessage";
    $payload = json_encode([
        'chat_id' => $chatId,
        'text' => $text,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 4,
    ]);
    curl_exec($ch);
    curl_close($ch);
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'POST') {
    $body = voxi_read_json_body();
    $action = $body['action'] ?? $action;

    if ($action === 'send') {
        $convId = trim((string)($body['conversationId'] ?? ''));
        $msg = $body['message'] ?? null;

        if ($convId === '' || !is_array($msg) || empty($msg['text'])) {
            voxi_json(['error' => 'Missing conversationId or message text'], 400);
        }

        $allData = getLiveChatData($dataFile);
        if (!isset($allData[$convId])) {
            $allData[$convId] = [
                'id' => $convId,
                'visitorId' => $body['visitorId'] ?? 'guest',
                'visitorName' => $body['visitorName'] ?? 'Посетитель',
                'visitorContact' => $body['visitorContact'] ?? '',
                'visitorCity' => $body['visitorCity'] ?? 'Минск',
                'startedAt' => date('c'),
                'lastMessageAt' => date('c'),
                'lastMessageText' => (string)$msg['text'],
                'messages' => [],
            ];
        }

        $storedMsg = [
            'id' => $msg['id'] ?? ('msg_' . time() . '_' . substr(md5((string)rand()), 0, 4)),
            'conversationId' => $convId,
            'sender' => $msg['sender'] ?? 'visitor',
            'senderName' => $msg['senderName'] ?? ($msg['sender'] === 'admin' ? 'Администратор Voxi' : $allData[$convId]['visitorName']),
            'text' => mb_substr((string)$msg['text'], 0, 2000),
            'createdAt' => $msg['createdAt'] ?? date('c'),
            'action' => $msg['action'] ?? null,
        ];

        $allData[$convId]['messages'][] = $storedMsg;
        $allData[$convId]['lastMessageAt'] = $storedMsg['createdAt'];
        $allData[$convId]['lastMessageText'] = $storedMsg['text'];

        if (!empty($body['visitorContact'])) {
            $allData[$convId]['visitorContact'] = (string)$body['visitorContact'];
        }
        if (!empty($body['visitorName'])) {
            $allData[$convId]['visitorName'] = (string)$body['visitorName'];
        }

        saveLiveChatData($dataFile, $allData);

        if ($storedMsg['sender'] === 'visitor') {
            notifyTelegram($storedMsg, $allData[$convId], $VOXI_CONFIG);
        }

        voxi_json(['success' => true, 'message' => $storedMsg]);
    }

    if ($action === 'admin_reply') {
        $convId = trim((string)($body['conversationId'] ?? ''));
        $text = trim((string)($body['text'] ?? ''));

        if ($convId === '' || $text === '') {
            voxi_json(['error' => 'Missing conversationId or text'], 400);
        }

        $allData = getLiveChatData($dataFile);
        if (!isset($allData[$convId])) {
            voxi_json(['error' => 'Conversation not found'], 404);
        }

        $storedMsg = [
            'id' => 'admin_msg_' . time() . '_' . substr(md5((string)rand()), 0, 4),
            'conversationId' => $convId,
            'sender' => 'admin',
            'senderName' => 'Администратор Voxi',
            'text' => mb_substr($text, 0, 2000),
            'createdAt' => date('c'),
            'action' => $body['actionType'] ?? null,
        ];

        $allData[$convId]['messages'][] = $storedMsg;
        $allData[$convId]['lastMessageAt'] = $storedMsg['createdAt'];
        $allData[$convId]['lastMessageText'] = $storedMsg['text'];

        saveLiveChatData($dataFile, $allData);
        voxi_json(['success' => true, 'message' => $storedMsg]);
    }
}

if ($method === 'GET') {
    syncTelegramAdminReplies($dataFile, $VOXI_CONFIG);
    if ($action === 'list') {
        $allData = getLiveChatData($dataFile);
        $list = array_values($allData);
        usort($list, function($a, $b) {
            return strcmp($b['lastMessageAt'] ?? '', $a['lastMessageAt'] ?? '');
        });
        voxi_json(['success' => true, 'conversations' => $list]);
    }

    $convId = $_GET['conversationId'] ?? '';
    if ($convId !== '') {
        $allData = getLiveChatData($dataFile);
        voxi_json(['success' => true, 'conversation' => $allData[$convId] ?? null]);
    }
}

voxi_json(['success' => true, 'status' => 'online']);
