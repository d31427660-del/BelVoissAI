<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if (strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET')) !== 'POST') {
    header('Allow: POST');
    voxi_json(['error' => 'Method Not Allowed'], 405);
}

// Verify optional webhook secret
$expectedSecret = trim((string)($VOXI_CONFIG['vapi_webhook_secret'] ?? ''));
if ($expectedSecret !== '') {
    $headerSecret = trim((string)($_SERVER['HTTP_X_VAPI_SECRET'] ?? ''));
    $authHeader = trim((string)($_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? ''));
    if ($headerSecret === '' && preg_match('/^Bearer\s+(.+)$/i', $authHeader, $m)) {
        $headerSecret = trim($m[1]);
    }
    if ($headerSecret === '' || !hash_equals($expectedSecret, $headerSecret)) {
        voxi_json(['error' => 'Unauthorized webhook secret'], 401);
    }
}

$payload = voxi_read_json_body();
$msg = isset($payload['message']) && is_array($payload['message']) ? $payload['message'] : $payload;
$msgType = strtolower(trim((string)($msg['type'] ?? 'end-of-call-report')));

// Acknowledge non-end-of-call events (e.g. status-update, speech-update) with 200 OK
if ($msgType !== 'end-of-call-report' && $msgType !== 'call.completed' && empty($payload['callLog'])) {
    voxi_json(['received' => true, 'ignoredType' => $msgType], 200);
}

$callObj = isset($msg['call']) && is_array($msg['call']) ? $msg['call'] : [];
$analysis = isset($msg['analysis']) && is_array($msg['analysis']) ? $msg['analysis'] : [];
$structured = isset($analysis['structuredData']) && is_array($analysis['structuredData'])
    ? $analysis['structuredData']
    : (isset($msg['capturedData']) && is_array($msg['capturedData']) ? $msg['capturedData'] : []);

$callId = mb_substr(trim((string)($callObj['id'] ?? $msg['callId'] ?? $msg['id'] ?? ('vapi-' . time() . '-' . random_int(100, 999)))), 0, 64);
$assistantId = trim((string)($callObj['assistantId'] ?? $msg['assistantId'] ?? ''));
$meta = isset($callObj['assistant']['metadata']) && is_array($callObj['assistant']['metadata'])
    ? $callObj['assistant']['metadata']
    : (isset($msg['metadata']) && is_array($msg['metadata']) ? $msg['metadata'] : []);

$userId = trim((string)($meta['userId'] ?? $payload['userId'] ?? ''));
$callerNumber = trim((string)($callObj['customer']['number'] ?? $msg['callerNumber'] ?? '+375 (29) 000-00-00'));
$callerName = trim((string)($structured['clientName'] ?? $callObj['customer']['name'] ?? $msg['callerName'] ?? 'Клиент'));
$durationSec = (int)round((float)($msg['durationSeconds'] ?? $callObj['durationSeconds'] ?? 0));
if ($durationSec <= 0 && !empty($callObj['startedAt']) && !empty($callObj['endedAt'])) {
    $durationSec = max(0, strtotime((string)$callObj['endedAt']) - strtotime((string)$callObj['startedAt']));
}
$durationSec = min(7200, max(0, $durationSec));

$endedReason = strtolower((string)($msg['endedReason'] ?? $callObj['endedReason'] ?? ''));
$summary = trim((string)($analysis['summary'] ?? $msg['summary'] ?? 'Звонок обработан голосовым ИИ-администратором Voxi.by.'));
$service = trim((string)($structured['service'] ?? 'Консультация и запись'));
$preferredDate = trim((string)($structured['preferredDate'] ?? ''));
$preferredTime = trim((string)($structured['preferredTime'] ?? ''));
$dealValueByn = max(0.0, (float)($structured['estimatedPriceByn'] ?? $msg['dealValueByn'] ?? 0));

// Map status
$status = 'consultation';
if (str_contains($endedReason, 'voicemail')) {
    $status = 'voicemail_detected';
} elseif (str_contains($endedReason, 'forward') || str_contains($endedReason, 'transfer')) {
    $status = 'forwarded';
} elseif (!empty($structured['service']) || !empty($structured['preferredDate']) || !empty($structured['clientName']) || $dealValueByn > 0) {
    $status = 'lead_captured';
}

// Parse transcript array
$transcript = [];
$rawMessages = $msg['artifact']['messages'] ?? $msg['messages'] ?? $msg['transcript'] ?? [];
if (is_array($rawMessages)) {
    foreach ($rawMessages as $m) {
        if (!is_array($m)) {
            continue;
        }
        $role = strtolower((string)($m['role'] ?? $m['speaker'] ?? ''));
        if ($role === 'system') {
            continue;
        }
        $text = trim((string)($m['message'] ?? $m['content'] ?? $m['text'] ?? ''));
        if ($text === '') {
            continue;
        }
        $transcript[] = [
            'speaker' => ($role === 'user' || $role === 'caller' || $role === 'customer') ? 'caller' : 'assistant',
            'text' => $text,
            'time' => (string)($m['time'] ?? date('H:i')),
        ];
    }
} elseif (is_string($rawMessages) && trim($rawMessages) !== '') {
    $transcript[] = [
        'speaker' => 'assistant',
        'text' => trim($rawMessages),
        'time' => date('H:i'),
    ];
}

if (!voxi_is_db_configured($VOXI_CONFIG)) {
    voxi_json(['received' => true, 'dbConfigured' => false, 'callId' => $callId], 200);
}

try {
    $pdo = voxi_get_pdo($VOXI_CONFIG);

    // Find user_id by assistantId if not explicitly in metadata
    if ($userId === '' && $assistantId !== '') {
        $stmtAsst = $pdo->prepare('SELECT user_id FROM assistants WHERE vapi_assistant_id = ? LIMIT 1');
        $stmtAsst->execute([$assistantId]);
        $foundAsst = $stmtAsst->fetch();
        if (is_array($foundAsst) && !empty($foundAsst['user_id'])) {
            $userId = (string)$foundAsst['user_id'];
        }
    }

    if ($userId === '') {
        voxi_json(['received' => true, 'matchedUser' => false, 'callId' => $callId], 200);
    }

    $stmtUser = $pdo->prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
    $stmtUser->execute([$userId]);
    $userRow = $stmtUser->fetch();
    if (!is_array($userRow)) {
        voxi_json(['received' => true, 'matchedUser' => false, 'callId' => $callId], 200);
    }

    $stmtAgent = $pdo->prepare('SELECT * FROM assistants WHERE user_id = ? LIMIT 1');
    $stmtAgent->execute([$userId]);
    $agentRow = $stmtAgent->fetch();
    $agentConfigExtra = (is_array($agentRow) && !empty($agentRow['config_json']))
        ? (json_decode((string)$agentRow['config_json'], true) ?: [])
        : [];

    $niche = (string)($agentRow['niche'] ?? $meta['niche'] ?? $userRow['niche'] ?? 'driving_school');
    $companyName = (string)($agentRow['company_name'] ?? $userRow['company_name'] ?? 'Компания');
    $companyAddress = (string)($agentRow['address'] ?? '');
    $companyPhone = (string)($agentRow['phone'] ?? '');

    $isVoicemail = ($status === 'voicemail_detected');
    $rate = (float)($userRow['rate_per_minute'] ?? 0.45) > 0 ? (float)$userRow['rate_per_minute'] : 0.45;
    $usedMinutes = ($isVoicemail || $durationSec <= 0) ? 0.0 : max(0.25, round($durationSec / 60, 2));
    $costByn = $isVoicemail ? 0.0 : round($usedMinutes * $rate, 2);

    $capturedData = array_merge($structured, [
        'clientName' => $callerName,
        'phone' => $callerNumber,
        'service' => $service,
        'preferredDate' => $preferredDate,
        'preferredTime' => $preferredTime,
        'estimatedPriceByn' => $dealValueByn,
    ]);

    // 1. Save to call_logs & deduct balance_minutes atomically
    $pdo->beginTransaction();
    $chk = $pdo->prepare('SELECT id FROM call_logs WHERE id = ? LIMIT 1');
    $chk->execute([$callId]);
    $alreadySaved = (bool)$chk->fetch();

    if (!$alreadySaved) {
        $ins = $pdo->prepare(
            'INSERT INTO call_logs (
               id, user_id, niche, caller_number, caller_name, call_timestamp,
               duration_seconds, cost_byn, status, deal_value_byn, summary,
               captured_data, transcript
             ) VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?)'
        );
        $ins->execute([
            $callId,
            $userId,
            $niche,
            $callerNumber,
            $callerName,
            $durationSec,
            $costByn,
            $status,
            $dealValueByn,
            $summary,
            json_encode($capturedData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            json_encode($transcript, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        ]);

        if (!$isVoicemail && $usedMinutes > 0) {
            $pdo->prepare(
                'UPDATE users
                 SET balance_minutes = GREATEST(0, balance_minutes - ?),
                     spent_minutes = spent_minutes + ?,
                     spent_total_byn = spent_total_byn + ?,
                     updated_at = NOW()
                 WHERE id = ?'
            )->execute([$usedMinutes, $usedMinutes, $costByn, $userId]);

            $pdo->prepare(
                'INSERT INTO minute_transactions (id, user_id, type, minutes, amount_byn, payment_method, external_uid, description)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
            )->execute([
                voxi_uuid(),
                $userId,
                'call',
                -$usedMinutes,
                -$costByn,
                'vapi_sip',
                $callId,
                "Звонок {$callerNumber} ({$durationSec} сек)",
            ]);
        }
    }
    $pdo->commit();

    // 2. Post-call notifications (only on first processing)
    if (!$alreadySaved && !$isVoicemail) {
        $stmtInt = $pdo->prepare('SELECT * FROM integrations WHERE user_id = ? LIMIT 1');
        $stmtInt->execute([$userId]);
        $intRow = $stmtInt->fetch();

        $tgConfig = (is_array($intRow) && !empty($intRow['telegram_json']))
            ? (json_decode((string)$intRow['telegram_json'], true) ?: [])
            : [];
        $whConfig = (is_array($intRow) && !empty($intRow['webhook_json']))
            ? (json_decode((string)$intRow['webhook_json'], true) ?: [])
            : [];

        // 2a. Telegram notification to business owner
        $tgBotToken = trim((string)($tgConfig['botToken'] ?? ($VOXI_CONFIG['telegram_bot_token'] ?? '')));
        $tgChatId = trim((string)($tgConfig['chatId'] ?? ''));
        $tgEnabled = !empty($tgConfig['isEnabled']) && $tgBotToken !== '' && $tgChatId !== '';

        if ($tgEnabled) {
            $whenStr = trim("{$preferredDate} {$preferredTime}") ?: 'Уточняется';
            $tgText = "📞 <b>Новый звонок — " . htmlspecialchars($companyName, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . "</b>\n"
                    . "👤 Клиент: <b>" . htmlspecialchars($callerName, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . "</b>\n"
                    . "📱 Номер: <code>" . htmlspecialchars($callerNumber, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . "</code>\n"
                    . "🛠 Услуга: " . htmlspecialchars($service, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . "\n"
                    . "🕒 Время: " . htmlspecialchars($whenStr, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . "\n"
                    . "⏱ Длительность: {$durationSec} сек (списано {$usedMinutes} мин)\n\n"
                    . "📝 <b>Резюме диалога:</b>\n" . htmlspecialchars($summary, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

            $ch = curl_init("https://api.telegram.org/bot{$tgBotToken}/sendMessage");
            curl_setopt_array($ch, [
                CURLOPT_POST => true,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 5,
                CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
                CURLOPT_POSTFIELDS => json_encode([
                    'chat_id' => $tgChatId,
                    'text' => $tgText,
                    'parse_mode' => 'HTML',
                ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            ]);
            @curl_exec($ch);
            curl_close($ch);
        }

        // 2b. External CRM Webhook (Bitrix24 / amoCRM / JSON)
        $whUrl = trim((string)($whConfig['webhookUrl'] ?? ''));
        if (!empty($whConfig['isEnabled']) && preg_match('/^https?:\/\//i', $whUrl)) {
            $sendFormat = (string)($whConfig['sendFormat'] ?? 'json_standard');
            if ($sendFormat === 'bitrix24') {
                $whPayload = [
                    'fields' => [
                        'TITLE' => "Звонок Voxi.by: {$callerName} ({$service})",
                        'NAME' => $callerName,
                        'PHONE' => [['VALUE' => $callerNumber, 'VALUE_TYPE' => 'WORK']],
                        'COMMENTS' => "Услуга: {$service}\nВремя: {$preferredDate} {$preferredTime}\n{$summary}",
                        'OPPORTUNITY' => $dealValueByn,
                        'CURRENCY_ID' => 'BYN',
                        'SOURCE_ID' => 'CALL',
                    ],
                ];
            } elseif ($sendFormat === 'amocrm') {
                $whPayload = [[
                    'name' => "Заявка со звонка: {$callerName} — {$service}",
                    'price' => $dealValueByn,
                    'custom_fields_values' => [
                        ['field_name' => 'Телефон', 'values' => [['value' => $callerNumber]]],
                        ['field_name' => 'Услуга', 'values' => [['value' => $service]]],
                        ['field_name' => 'Примечание', 'values' => [['value' => $summary]]],
                    ],
                ]];
            } else {
                $whPayload = [
                    'event' => 'call.completed',
                    'callId' => $callId,
                    'timestamp' => date('c'),
                    'caller' => ['name' => $callerName, 'phone' => $callerNumber],
                    'lead' => $capturedData,
                    'summary' => $summary,
                    'transcript' => $transcript,
                ];
            }

            $whHeaders = ['Content-Type: application/json', 'User-Agent: Voxi-Webhook-Dispatcher/1.0'];
            if (!empty($whConfig['secretKey'])) {
                $whHeaders[] = 'X-Voxi-Secret: ' . $whConfig['secretKey'];
            }
            $ch = curl_init($whUrl);
            curl_setopt_array($ch, [
                CURLOPT_POST => true,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 5,
                CURLOPT_HTTPHEADER => $whHeaders,
                CURLOPT_POSTFIELDS => json_encode($whPayload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            ]);
            @curl_exec($ch);
            curl_close($ch);
        }

        // 2c. Direct SMS / Viber follow-up to the caller
        $callerNotif = isset($agentConfigExtra['callerNotification']) && is_array($agentConfigExtra['callerNotification'])
            ? $agentConfigExtra['callerNotification']
            : [];
        $callerDigits = preg_replace('/\D+/', '', $callerNumber) ?? '';
        if (!empty($callerNotif['isEnabled']) && strlen($callerDigits) >= 9) {
            $tmpl = (string)($callerNotif['template'] ?? 'Здравствуйте, {ИМЯ}! Вы записаны в {КОМПАНИЯ} ({УСЛУГА}). Время: {ВРЕМЯ}. Адрес: {АДРЕС}. Тел: {ТЕЛЕФОН}');
            $smsText = str_replace(
                ['{ИМЯ}', '{КОМПАНИЯ}', '{УСЛУГА}', '{ДАТА}', '{ВРЕМЯ}', '{АДРЕС}', '{ТЕЛЕФОН}'],
                [
                    $callerName ?: 'клиент',
                    $companyName,
                    $service ?: 'консультацию',
                    $preferredDate ?: 'сегодня',
                    $preferredTime ?: 'по графику',
                    $companyAddress ?: 'г. Минск',
                    $companyPhone ?: '',
                ],
                $tmpl
            );
            $provider = (string)($callerNotif['provider'] ?? 'sms_by');
            $apiKey = trim((string)($callerNotif['apiKey'] ?? ''));
            $apiLogin = trim((string)($callerNotif['apiLogin'] ?? ''));
            $senderName = trim((string)($callerNotif['senderName'] ?? 'Voxi'));

            if ($provider === 'sms_by') {
                $token = $apiKey !== '' ? $apiKey : voxi_env(['SMS_BY_TOKEN'], '');
                if ($token !== '') {
                    $qs = http_build_query(['token' => $token, 'message' => $smsText, 'phone' => $callerDigits]);
                    $ch = curl_init("https://app.sms.by/api/v1/sendQuickSMS?{$qs}");
                    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 5]);
                    @curl_exec($ch);
                    curl_close($ch);
                }
            } elseif ($provider === 'rocketsms') {
                $u = $apiLogin !== '' ? $apiLogin : voxi_env(['ROCKETSMS_USERNAME'], '');
                $p = $apiKey !== '' ? $apiKey : voxi_env(['ROCKETSMS_PASSWORD'], '');
                if ($u !== '' && $p !== '') {
                    $ch = curl_init('https://api.rocketsms.by/simple/send');
                    curl_setopt_array($ch, [
                        CURLOPT_POST => true,
                        CURLOPT_RETURNTRANSFER => true,
                        CURLOPT_TIMEOUT => 5,
                        CURLOPT_POSTFIELDS => http_build_query([
                            'username' => $u,
                            'password' => $p,
                            'phone' => $callerDigits,
                            'text' => $smsText,
                            'sender' => $senderName,
                        ]),
                    ]);
                    @curl_exec($ch);
                    curl_close($ch);
                }
            }
        }
    }

    voxi_json([
        'received' => true,
        'callId' => $callId,
        'userId' => $userId,
        'usedMinutes' => $usedMinutes,
        'costByn' => $costByn,
        'status' => $status,
    ], 200);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    voxi_json(['error' => 'Webhook processing failed'], 500);
}
