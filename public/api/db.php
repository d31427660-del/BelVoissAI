<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

/**
 * Загрузка полного состояния личного кабинета пользователя из MySQL (ISPmanager)
 */
function voxi_load_workspace_bundle(PDO $pdo, array $userRow): array
{
    $userId = (string)$userRow['id'];

    // 1. Ассистент
    $stmtAgent = $pdo->prepare('SELECT * FROM assistants WHERE user_id = ? LIMIT 1');
    $stmtAgent->execute([$userId]);
    $agentRow = $stmtAgent->fetch();
    $agent = null;
    if (is_array($agentRow)) {
        $extra = !empty($agentRow['config_json']) ? json_decode((string)$agentRow['config_json'], true) : [];
        if (!is_array($extra)) {
            $extra = [];
        }
        $agent = array_merge($extra, [
            'id' => (string)$agentRow['id'],
            'name' => (string)$agentRow['name'],
            'niche' => (string)$agentRow['niche'],
            'voice' => (string)$agentRow['voice'],
            'speechRate' => (float)$agentRow['speech_rate'],
            'formality' => (string)$agentRow['formality'],
            'companyName' => (string)$agentRow['company_name'],
            'city' => (string)$agentRow['city'],
            'address' => (string)($agentRow['address'] ?? ''),
            'phone' => (string)($agentRow['phone'] ?? ''),
            'workingHours' => (string)($agentRow['working_hours'] ?? ''),
            'pricingAndServices' => (string)($agentRow['pricing_and_services'] ?? ''),
            'knowledgeBase' => (string)($agentRow['knowledge_base'] ?? ''),
            'firstMessage' => (string)($agentRow['first_message'] ?? ''),
            'systemPrompt' => (string)($agentRow['system_prompt'] ?? ''),
            'vapiAssistantId' => $agentRow['vapi_assistant_id'] ?: ($extra['vapiAssistantId'] ?? null),
            'isActive' => (bool)$agentRow['is_active'],
            'updatedAt' => (string)$agentRow['updated_at'],
        ]);
    }

    // 2. Интеграции
    $stmtInt = $pdo->prepare('SELECT * FROM integrations WHERE user_id = ? LIMIT 1');
    $stmtInt->execute([$userId]);
    $intRow = $stmtInt->fetch();
    $sipSettings = null;
    $telegramSettings = null;
    $webhookSettings = null;
    if (is_array($intRow)) {
        if (!empty($intRow['sip_json'])) {
            $decoded = json_decode((string)$intRow['sip_json'], true);
            if (is_array($decoded)) {
                $sipSettings = $decoded;
            }
        }
        if (!empty($intRow['telegram_json'])) {
            $decoded = json_decode((string)$intRow['telegram_json'], true);
            if (is_array($decoded)) {
                $telegramSettings = $decoded;
            }
        }
        if (!empty($intRow['webhook_json'])) {
            $decoded = json_decode((string)$intRow['webhook_json'], true);
            if (is_array($decoded)) {
                $webhookSettings = $decoded;
            }
        }
    }

    // 3. Журнал звонков (последние 50)
    $stmtLogs = $pdo->prepare(
        'SELECT * FROM call_logs WHERE user_id = ? ORDER BY call_timestamp DESC, created_at DESC LIMIT 50'
    );
    $stmtLogs->execute([$userId]);
    $rows = $stmtLogs->fetchAll();
    $callLogs = [];
    foreach ($rows as $r) {
        $durSec = (int)($r['duration_seconds'] ?? 0);
        $mins = intdiv($durSec, 60);
        $secs = str_pad((string)($durSec % 60), 2, '0', STR_PAD_LEFT);
        $captured = json_decode((string)($r['captured_data'] ?? '{}'), true);
        $transcript = json_decode((string)($r['transcript'] ?? '[]'), true);
        $tsFormatted = !empty($r['call_timestamp'])
            ? date('Y-m-d H:i', strtotime((string)$r['call_timestamp']))
            : date('Y-m-d H:i');

        $callLogs[] = [
            'id' => (string)$r['id'],
            'niche' => $r['niche'] ?: 'driving_school',
            'callerNumber' => (string)$r['caller_number'],
            'callerName' => (string)($r['caller_name'] ?: 'Клиент'),
            'timestamp' => $tsFormatted,
            'durationSeconds' => $durSec,
            'audioDuration' => "{$mins}:{$secs}",
            'costByn' => round((float)($r['cost_byn'] ?? 0), 2),
            'status' => (string)($r['status'] ?: 'consultation'),
            'dealValueByn' => round((float)($r['deal_value_byn'] ?? 0), 2),
            'summary' => (string)($r['summary'] ?? ''),
            'capturedData' => is_array($captured) ? $captured : [],
            'transcript' => is_array($transcript) ? $transcript : [],
        ];
    }

    return [
        'user' => voxi_format_user_session($userRow),
        'agent' => $agent,
        'sipSettings' => $sipSettings,
        'telegramSettings' => $telegramSettings,
        'webhookSettings' => $webhookSettings,
        'callLogs' => $callLogs,
    ];
}

function voxi_issue_session(PDO $pdo, string $userId): string
{
    $rawToken = bin2hex(random_bytes(32));
    $tokenHash = hash('sha256', $rawToken);
    $ip = substr((string)($_SERVER['REMOTE_ADDR'] ?? ''), 0, 64);
    $ua = substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 255);

    // Очистка просроченных сессий пользователя
    $pdo->prepare('DELETE FROM user_sessions WHERE user_id = ? AND expires_at <= NOW()')->execute([$userId]);

    $stmt = $pdo->prepare(
        'INSERT INTO user_sessions (user_id, token_hash, ip_address, user_agent, expires_at)
         VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))'
    );
    $stmt->execute([$userId, $tokenHash, $ip, $ua]);

    voxi_set_session_cookie($rawToken, 30 * 86400);
    return $rawToken;
}

$action = strtolower(trim((string)($_GET['action'] ?? '')));
$method = strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET'));

if ($action === 'status') {
    $configured = voxi_is_db_configured($VOXI_CONFIG);
    if (!$configured) {
        voxi_json([
            'ok' => true,
            'driver' => 'mysql-ispmanager',
            'configured' => false,
            'connected' => false,
        ]);
    }
    try {
        voxi_get_pdo($VOXI_CONFIG);
        voxi_json([
            'ok' => true,
            'driver' => 'mysql-ispmanager',
            'configured' => true,
            'connected' => true,
        ]);
    } catch (Throwable $e) {
        voxi_json([
            'ok' => false,
            'driver' => 'mysql-ispmanager',
            'configured' => true,
            'connected' => false,
            'error' => 'Ошибка подключения к MySQL в ISPmanager. Проверьте DB_NAME, DB_USER и DB_PASS в api/config.php.',
        ], 503);
    }
}

if (!voxi_is_db_configured($VOXI_CONFIG)) {
    voxi_json([
        'ok' => false,
        'configured' => false,
        'error' => 'База данных ISPmanager ещё не указана в api/config.php (заполните db_name, db_user, db_pass).',
    ], 503);
}

try {
    $pdo = voxi_get_pdo($VOXI_CONFIG);
} catch (Throwable $e) {
    voxi_json([
        'ok' => false,
        'configured' => true,
        'error' => 'Не удалось подключиться к БД MySQL на хостинге. Проверьте имя БД, логин и пароль в api/config.php.',
    ], 503);
}

// --- GET ?action=me ---
if ($action === 'me') {
    $userRow = voxi_find_authenticated_user($pdo);
    if (!$userRow) {
        voxi_json(['ok' => true, 'authenticated' => false]);
    }
    $bundle = voxi_load_workspace_bundle($pdo, $userRow);
    voxi_json(array_merge(['ok' => true, 'authenticated' => true], $bundle));
}

if ($method !== 'POST') {
    voxi_json(['ok' => false, 'error' => 'Method Not Allowed'], 405);
}

$body = voxi_read_json_body();

// --- POST ?action=signup ---
if ($action === 'signup') {
    $email = mb_strtolower(trim((string)($body['email'] ?? '')));
    $password = (string)($body['password'] ?? '');
    $companyName = trim((string)($body['companyName'] ?? ''));
    if ($companyName === '') {
        $companyName = 'Моя компания РБ';
    }
    $companyName = mb_substr($companyName, 0, 200);

    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        voxi_json(['ok' => false, 'error' => 'Пожалуйста, введите корректный адрес электронной почты'], 400);
    }
    if (mb_strlen($password) < 6) {
        voxi_json(['ok' => false, 'error' => 'Пароль должен содержать не менее 6 символов'], 400);
    }

    $chk = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
    $chk->execute([$email]);
    if ($chk->fetch()) {
        voxi_json([
            'ok' => false,
            'error' => 'Пользователь с таким email уже зарегистрирован. Пожалуйста, выполните вход',
        ], 409);
    }

    $userId = voxi_uuid();
    $passwordHash = password_hash($password, PASSWORD_BCRYPT);

    $pdo->beginTransaction();
    try {
        $insUser = $pdo->prepare(
            'INSERT INTO users (id, email, password_hash, company_name, niche, balance_minutes, rate_per_minute, spent_minutes, spent_total_byn, consent_99z_accepted_at)
             VALUES (?, ?, ?, ?, ?, 15.00, 0.45, 0.00, 0.00, NOW())'
        );
        $insUser->execute([$userId, $email, $passwordHash, $companyName, 'driving_school']);

        $insTx = $pdo->prepare(
            'INSERT INTO minute_transactions (id, user_id, type, minutes, amount_byn, payment_method, description)
             VALUES (?, ?, ?, 15.00, 0.00, ?, ?)'
        );
        $insTx->execute([
            voxi_uuid(),
            $userId,
            'gift',
            'signup_bonus',
            'Приветственные 15 минут при регистрации в Voxi.by',
        ]);

        $pdo->commit();
    } catch (Throwable $txErr) {
        $pdo->rollBack();
        throw $txErr;
    }

    $token = voxi_issue_session($pdo, $userId);
    $stmtUser = $pdo->prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
    $stmtUser->execute([$userId]);
    $createdUser = $stmtUser->fetch();

    voxi_json([
        'ok' => true,
        'token' => $token,
        'user' => voxi_format_user_session($createdUser),
        'agent' => null,
        'sipSettings' => null,
        'telegramSettings' => null,
        'webhookSettings' => null,
        'callLogs' => [],
    ]);
}

// --- POST ?action=signin ---
if ($action === 'signin') {
    $email = mb_strtolower(trim((string)($body['email'] ?? '')));
    $password = (string)($body['password'] ?? '');

    if ($email === '' || $password === '') {
        voxi_json(['ok' => false, 'error' => 'Укажите email и пароль'], 400);
    }

    $stmt = $pdo->prepare('SELECT * FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $userRow = $stmt->fetch();

    if (!is_array($userRow) || !password_verify($password, (string)$userRow['password_hash'])) {
        voxi_json(['ok' => false, 'error' => 'Неверный адрес электронной почты или пароль'], 401);
    }

    $token = voxi_issue_session($pdo, (string)$userRow['id']);
    $bundle = voxi_load_workspace_bundle($pdo, $userRow);

    voxi_json(array_merge(['ok' => true, 'token' => $token], $bundle));
}

// --- POST ?action=signout ---
if ($action === 'signout') {
    $token = voxi_extract_session_token();
    if ($token !== '') {
        $tokenHash = hash('sha256', $token);
        $pdo->prepare('DELETE FROM user_sessions WHERE token_hash = ?')->execute([$tokenHash]);
    }
    voxi_clear_session_cookie();
    voxi_json(['ok' => true]);
}

// --- POST ?action=reset_password ---
if ($action === 'reset_password') {
    $email = mb_strtolower(trim((string)($body['email'] ?? '')));
    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        voxi_json(['ok' => false, 'error' => 'Пожалуйста, введите корректный адрес электронной почты'], 400);
    }

    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $userRow = $stmt->fetch();

    if (is_array($userRow)) {
        $rawReset = bin2hex(random_bytes(24));
        $resetHash = hash('sha256', $rawReset);
        $pdo->prepare(
            'UPDATE users SET reset_token_hash = ?, reset_token_expires_at = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE id = ?'
        )->execute([$resetHash, $userRow['id']]);

        $host = preg_replace('/[^a-zA-Z0-9.-]/', '', (string)($_SERVER['HTTP_HOST'] ?? 'voxi.by')) ?: 'voxi.by';
        $resetUrl = "https://{$host}/?reset_token={$rawReset}&email=" . urlencode($email);
        $subject = '=?UTF-8?B?' . base64_encode('Восстановление пароля Voxi.by') . '?=';
        $mailBody = "Здравствуйте!\n\nДля смены пароля в личном кабинете Voxi.by перейдите по ссылке (действует 1 час):\n{$resetUrl}\n\nЕсли вы не запрашивали сброс пароля, просто проигнорируйте это письмо.";
        $headers = "From: Voxi.by <noreply@{$host}>\r\nContent-Type: text/plain; charset=UTF-8\r\n";
        @mail($email, $subject, $mailBody, $headers);
    }

    voxi_json([
        'ok' => true,
        'message' => 'Если аккаунт с этим email зарегистрирован, инструкция по восстановлению отправлена на почту.',
    ]);
}

// --- POST ?action=confirm_reset_password ---
if ($action === 'confirm_reset_password') {
    $email = mb_strtolower(trim((string)($body['email'] ?? '')));
    $resetToken = strtolower(trim((string)($body['resetToken'] ?? '')));
    $newPassword = (string)($body['newPassword'] ?? '');

    if ($email === '' || $resetToken === '' || mb_strlen($newPassword) < 6) {
        voxi_json(['ok' => false, 'error' => 'Укажите новый пароль не менее 6 символов'], 400);
    }

    $resetHash = hash('sha256', $resetToken);
    $stmt = $pdo->prepare(
        'SELECT * FROM users WHERE email = ? AND reset_token_hash = ? AND reset_token_expires_at > NOW() LIMIT 1'
    );
    $stmt->execute([$email, $resetHash]);
    $userRow = $stmt->fetch();

    if (!is_array($userRow)) {
        voxi_json(['ok' => false, 'error' => 'Ссылка для сброса пароля устарела или недействительна'], 400);
    }

    $newHash = password_hash($newPassword, PASSWORD_BCRYPT);
    $pdo->prepare(
        'UPDATE users SET password_hash = ?, reset_token_hash = NULL, reset_token_expires_at = NULL WHERE id = ?'
    )->execute([$newHash, $userRow['id']]);

    $token = voxi_issue_session($pdo, (string)$userRow['id']);
    $bundle = voxi_load_workspace_bundle($pdo, $userRow);
    voxi_json(array_merge(['ok' => true, 'token' => $token], $bundle));
}

// Все дальнейшие действия требуют авторизованной сессии
$authUser = voxi_find_authenticated_user($pdo);
if (!$authUser) {
    voxi_json(['ok' => false, 'error' => 'Сессия истекла, пожалуйста войдите заново'], 401);
}
$userId = (string)$authUser['id'];

// --- POST ?action=save_agent ---
if ($action === 'save_agent') {
    $agent = isset($body['agent']) && is_array($body['agent']) ? $body['agent'] : [];
    if (empty($agent)) {
        voxi_json(['ok' => false, 'error' => 'Не переданы настройки ассистента'], 400);
    }

    $agentId = !empty($agent['id']) && strlen((string)$agent['id']) <= 36 ? (string)$agent['id'] : voxi_uuid();
    $name = mb_substr(trim((string)($agent['name'] ?? 'Голосовой ассистент')), 0, 200);
    $niche = mb_substr(trim((string)($agent['niche'] ?? 'driving_school')), 0, 64);
    $voice = mb_substr(trim((string)($agent['voice'] ?? 'anna')), 0, 32);
    $speechRate = max(0.7, min(1.3, (float)($agent['speechRate'] ?? 1.0)));
    $formality = in_array(($agent['formality'] ?? ''), ['formal', 'friendly'], true)
        ? (string)$agent['formality']
        : 'friendly';
    $companyName = mb_substr(trim((string)($agent['companyName'] ?? $authUser['company_name'])), 0, 200);
    $city = mb_substr(trim((string)($agent['city'] ?? 'Минск')), 0, 120);
    $address = mb_substr(trim((string)($agent['address'] ?? '')), 0, 250);
    $phone = mb_substr(trim((string)($agent['phone'] ?? '')), 0, 64);
    $workingHours = mb_substr(trim((string)($agent['workingHours'] ?? '')), 0, 250);
    $pricing = (string)($agent['pricingAndServices'] ?? '');
    $kb = (string)($agent['knowledgeBase'] ?? '');
    $firstMsg = (string)($agent['firstMessage'] ?? '');
    $sysPrompt = (string)($agent['systemPrompt'] ?? '');
    $vapiId = !empty($agent['vapiAssistantId']) ? mb_substr((string)$agent['vapiAssistantId'], 0, 128) : null;
    $isActive = !isset($agent['isActive']) || (bool)$agent['isActive'] ? 1 : 0;
    $configJson = json_encode($agent, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    $stmt = $pdo->prepare(
        'INSERT INTO assistants (
           id, user_id, name, niche, voice, speech_rate, formality,
           company_name, city, address, phone, working_hours,
           pricing_and_services, knowledge_base, first_message, system_prompt,
           config_json, vapi_assistant_id, is_active
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           niche = VALUES(niche),
           voice = VALUES(voice),
           speech_rate = VALUES(speech_rate),
           formality = VALUES(formality),
           company_name = VALUES(company_name),
           city = VALUES(city),
           address = VALUES(address),
           phone = VALUES(phone),
           working_hours = VALUES(working_hours),
           pricing_and_services = VALUES(pricing_and_services),
           knowledge_base = VALUES(knowledge_base),
           first_message = VALUES(first_message),
           system_prompt = VALUES(system_prompt),
           config_json = VALUES(config_json),
           vapi_assistant_id = VALUES(vapi_assistant_id),
           is_active = VALUES(is_active),
           updated_at = NOW()'
    );
    $stmt->execute([
        $agentId, $userId, $name, $niche, $voice, $speechRate, $formality,
        $companyName, $city, $address, $phone, $workingHours,
        $pricing, $kb, $firstMsg, $sysPrompt,
        $configJson, $vapiId, $isActive,
    ]);

    $pdo->prepare('UPDATE users SET company_name = ?, niche = ?, updated_at = NOW() WHERE id = ?')
        ->execute([$companyName, $niche, $userId]);

    voxi_json(['ok' => true]);
}

// --- POST ?action=save_integrations ---
if ($action === 'save_integrations') {
    $stmtCur = $pdo->prepare('SELECT * FROM integrations WHERE user_id = ? LIMIT 1');
    $stmtCur->execute([$userId]);
    $existing = $stmtCur->fetch();

    $sip = isset($body['sipSettings']) && is_array($body['sipSettings'])
        ? $body['sipSettings']
        : (is_array($existing) && !empty($existing['sip_json']) ? json_decode((string)$existing['sip_json'], true) : []);
    $tg = isset($body['telegramSettings']) && is_array($body['telegramSettings'])
        ? $body['telegramSettings']
        : (is_array($existing) && !empty($existing['telegram_json']) ? json_decode((string)$existing['telegram_json'], true) : []);
    $wh = isset($body['webhookSettings']) && is_array($body['webhookSettings'])
        ? $body['webhookSettings']
        : (is_array($existing) && !empty($existing['webhook_json']) ? json_decode((string)$existing['webhook_json'], true) : []);

    $sipProvider = mb_substr((string)($sip['provider'] ?? 'mts'), 0, 64);
    $sipServer = mb_substr((string)($sip['sipServer'] ?? 'sip.mts.by:5060'), 0, 191);
    $sipLogin = mb_substr((string)($sip['sipLogin'] ?? ''), 0, 191);
    $sipCaller = mb_substr((string)($sip['callerId'] ?? ''), 0, 64);
    $sipStatus = mb_substr((string)($sip['status'] ?? 'disconnected'), 0, 32);

    $tgChatId = mb_substr((string)($tg['chatId'] ?? ''), 0, 128);
    $tgEnabled = !empty($tg['isEnabled']) ? 1 : 0;

    $whUrl = mb_substr((string)($wh['webhookUrl'] ?? ''), 0, 512);
    $whEnabled = !empty($wh['isEnabled']) ? 1 : 0;

    $stmt = $pdo->prepare(
        'INSERT INTO integrations (
           id, user_id, sip_provider, sip_server, sip_login, sip_caller_id, sip_status, sip_json,
           telegram_chat_id, telegram_enabled, telegram_json,
           webhook_url, webhook_enabled, webhook_json
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           sip_provider = VALUES(sip_provider),
           sip_server = VALUES(sip_server),
           sip_login = VALUES(sip_login),
           sip_caller_id = VALUES(sip_caller_id),
           sip_status = VALUES(sip_status),
           sip_json = VALUES(sip_json),
           telegram_chat_id = VALUES(telegram_chat_id),
           telegram_enabled = VALUES(telegram_enabled),
           telegram_json = VALUES(telegram_json),
           webhook_url = VALUES(webhook_url),
           webhook_enabled = VALUES(webhook_enabled),
           webhook_json = VALUES(webhook_json),
           updated_at = NOW()'
    );
    $stmt->execute([
        voxi_uuid(),
        $userId,
        $sipProvider,
        $sipServer,
        $sipLogin,
        $sipCaller,
        $sipStatus,
        json_encode($sip, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        $tgChatId,
        $tgEnabled,
        json_encode($tg, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        $whUrl,
        $whEnabled,
        json_encode($wh, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    ]);

    voxi_json(['ok' => true]);
}

// --- POST ?action=record_call ---
if ($action === 'record_call') {
    $log = isset($body['callLog']) && is_array($body['callLog']) ? $body['callLog'] : [];
    if (empty($log)) {
        voxi_json(['ok' => false, 'error' => 'Не переданы данные звонка'], 400);
    }

    $callId = mb_substr(trim((string)($log['id'] ?? ('call-' . time() . '-' . random_int(100, 999)))), 0, 64);
    $niche = mb_substr((string)($log['niche'] ?? 'driving_school'), 0, 64);
    $callerNumber = mb_substr(trim((string)($log['callerNumber'] ?? '+375 (29) 000-00-00')), 0, 64);
    $callerName = mb_substr(trim((string)($log['callerName'] ?? 'Клиент')), 0, 191);
    $durationSec = max(0, (int)($log['durationSeconds'] ?? 0));
    $status = in_array(($log['status'] ?? ''), ['lead_captured', 'consultation', 'forwarded', 'spam'], true)
        ? (string)$log['status']
        : 'consultation';
    $dealValueByn = max(0.0, (float)($log['dealValueByn'] ?? 0));
    $summary = (string)($log['summary'] ?? '');
    $capturedJson = json_encode($log['capturedData'] ?? new stdClass(), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $transcriptJson = json_encode($log['transcript'] ?? [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    $rate = (float)$authUser['rate_per_minute'] > 0 ? (float)$authUser['rate_per_minute'] : 0.45;
    $usedMinutes = max(0.25, round($durationSec / 60, 2));
    $costByn = round($usedMinutes * $rate, 2);

    $pdo->beginTransaction();
    try {
        $chk = $pdo->prepare('SELECT id FROM call_logs WHERE id = ? LIMIT 1');
        $chk->execute([$callId]);
        if (!$chk->fetch()) {
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
                $capturedJson,
                $transcriptJson,
            ]);

            $pdo->prepare(
                'UPDATE users
                 SET balance_minutes = GREATEST(0, balance_minutes - ?),
                     spent_minutes = spent_minutes + ?,
                     spent_total_byn = spent_total_byn + ?,
                     updated_at = NOW()
                 WHERE id = ?'
            )->execute([$usedMinutes, $usedMinutes, $costByn, $userId]);

            $pdo->prepare(
                'INSERT INTO minute_transactions (id, user_id, type, minutes, amount_byn, payment_method, description)
                 VALUES (?, ?, ?, ?, ?, ?, ?)'
            )->execute([
                voxi_uuid(),
                $userId,
                'deduction',
                -$usedMinutes,
                $costByn,
                'call_usage',
                "Звонок {$callerNumber} ({$durationSec} сек)",
            ]);
        }
        $pdo->commit();
    } catch (Throwable $err) {
        $pdo->rollBack();
        throw $err;
    }

    $stmtFresh = $pdo->prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
    $stmtFresh->execute([$userId]);
    $freshUser = $stmtFresh->fetch();

    voxi_json([
        'ok' => true,
        'user' => voxi_format_user_session($freshUser),
    ]);
}

voxi_json(['ok' => false, 'error' => 'Unknown action'], 400);
