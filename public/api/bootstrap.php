<?php
declare(strict_types=1);

define('VOXI_API_BOOT', true);
ini_set('display_errors', '0');
error_reporting(E_ALL);
date_default_timezone_set('Europe/Minsk');

$GLOBALS['VOXI_DOTENV'] = [];

/**
 * Получить переменную окружения из всех доступных источников
 * (включая распарсенный .env массив, $_ENV, $_SERVER, getenv)
 * Поддерживает список альтернативных ключей (псевдонимов)
 */
function voxi_env(string|array $keys, string $default = ''): string
{
    $keyList = is_array($keys) ? $keys : [$keys];

    foreach ($keyList as $k) {
        if (isset($GLOBALS['VOXI_DOTENV'][$k]) && (string)$GLOBALS['VOXI_DOTENV'][$k] !== '') {
            return (string)$GLOBALS['VOXI_DOTENV'][$k];
        }
    }
    foreach ($keyList as $k) {
        if (isset($_ENV[$k]) && (string)$_ENV[$k] !== '') {
            return (string)$_ENV[$k];
        }
    }
    foreach ($keyList as $k) {
        if (isset($_SERVER[$k]) && (string)$_SERVER[$k] !== '') {
            return (string)$_SERVER[$k];
        }
    }
    foreach ($keyList as $k) {
        $val = getenv($k);
        if ($val !== false && (string)$val !== '') {
            return (string)$val;
        }
    }
    return $default;
}

/**
 * Загрузка переменных из .env (проверяет DOCUMENT_ROOT, корень сайта и родительскую папку)
 */
function voxi_load_dotenv(): void
{
    $docRoot = rtrim((string)($_SERVER['DOCUMENT_ROOT'] ?? ''), '/\\');
    // Проверяем файлы от общих к частным (чтобы более близкий .env переопределял)
    $candidates = array_unique(array_filter([
        dirname(__DIR__, 2) . '/.env',
        dirname(__DIR__) . '/.env',
        $docRoot !== '' ? dirname($docRoot) . '/.env' : '',
        $docRoot !== '' ? "{$docRoot}/.env" : '',
        __DIR__ . '/.env',
    ]));

    foreach ($candidates as $envFile) {
        if (!is_file($envFile) || !is_readable($envFile)) {
            continue;
        }
        $lines = @file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if (!is_array($lines)) {
            continue;
        }
        foreach ($lines as $line) {
            $trimmed = trim($line);
            if ($trimmed === '' || str_starts_with($trimmed, '#')) {
                continue;
            }
            $eqPos = strpos($trimmed, '=');
            if ($eqPos === false) {
                continue;
            }
            $key = trim(substr($trimmed, 0, $eqPos));
            $val = trim(substr($trimmed, $eqPos + 1));
            if (
                (str_starts_with($val, '"') && str_ends_with($val, '"')) ||
                (str_starts_with($val, "'") && str_ends_with($val, "'"))
            ) {
                $val = substr($val, 1, -1);
            }
            if ($key !== '') {
                $GLOBALS['VOXI_DOTENV'][$key] = $val;
                @putenv("{$key}={$val}");
                $_ENV[$key] = $val;
                $_SERVER[$key] = $val;
            }
        }
    }
}

voxi_load_dotenv();
$VOXI_CONFIG = require __DIR__ . '/config.php';

function voxi_json(array $payload, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Список доверенных хостов сайта (для проверки Origin / CSRF).
 */
function voxi_allowed_hosts(): array
{
    $cfg = $GLOBALS['VOXI_CONFIG'] ?? [];
    $publicHost = strtolower((string)(parse_url((string)($cfg['public_site_url'] ?? ''), PHP_URL_HOST) ?? ''));
    return array_values(array_filter(array_unique(['voxi.by', 'www.voxi.by', 'localhost', '127.0.0.1', $publicHost])));
}

/**
 * CSRF-защита для эндпоинтов, вызываемых из браузера (cookie-сессия):
 *  1) Origin / Referer (если присутствуют) обязаны принадлежать нашему сайту;
 *  2) обязателен заголовок X-Requested-With: XMLHttpRequest — кросс-сайтовая форма
 *     или <img>/<script> не может его выставить, а fetch с ним требует CORS-preflight,
 *     который мы не разрешаем.
 * Вебхуки платёжных/телефонных систем (server-to-server) эту функцию НЕ вызывают.
 */
function voxi_csrf_guard(): void
{
    $method = strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET'));
    if (in_array($method, ['GET', 'HEAD', 'OPTIONS'], true)) {
        return;
    }
    $source = trim((string)($_SERVER['HTTP_ORIGIN'] ?? ''));
    if ($source === '') {
        $source = trim((string)($_SERVER['HTTP_REFERER'] ?? ''));
    }
    if ($source !== '') {
        $host = strtolower((string)(parse_url($source, PHP_URL_HOST) ?? ''));
        if (!in_array($host, voxi_allowed_hosts(), true)) {
            voxi_json(['ok' => false, 'error' => 'Forbidden: cross-origin request'], 403);
        }
    }
    if (strtolower(trim((string)($_SERVER['HTTP_X_REQUESTED_WITH'] ?? ''))) !== 'xmlhttprequest') {
        voxi_json(['ok' => false, 'error' => 'Forbidden: missing CSRF header'], 403);
    }
}

function voxi_read_json_body(): array
{
    $raw = file_get_contents('php://input');
    if (!is_string($raw) || trim($raw) === '') {
        return [];
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function voxi_uuid(): string
{
    $bytes = random_bytes(16);
    $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
    $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($bytes), 4));
}

function voxi_client_ip(): string
{
    $forwarded = trim((string)($_SERVER['HTTP_X_FORWARDED_FOR'] ?? ''));
    if ($forwarded !== '') {
        $parts = explode(',', $forwarded);
        $candidate = trim((string)$parts[0]);
        if (filter_var($candidate, FILTER_VALIDATE_IP)) {
            return $candidate;
        }
    }
    $remote = trim((string)($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0'));
    return filter_var($remote, FILTER_VALIDATE_IP) ? $remote : '0.0.0.0';
}

function voxi_enforce_rate_limit(string $bucket, int $maxAttempts = 10, int $windowSec = 60): void
{
    $ip = voxi_client_ip();
    $keyHash = substr(hash('sha256', "{$bucket}|{$ip}"), 0, 24);
    $file = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . "voxi_rl_{$keyHash}.json";
    $now = time();

    $fp = @fopen($file, 'c+');
    if (!is_resource($fp)) {
        return;
    }

    @flock($fp, LOCK_EX);
    $raw = @stream_get_contents($fp);
    $state = is_string($raw) && $raw !== '' ? json_decode($raw, true) : null;

    if (!is_array($state) || (int)($state['resetAt'] ?? 0) <= $now) {
        $state = ['count' => 1, 'resetAt' => $now + $windowSec];
    } else {
        $state['count'] = (int)($state['count'] ?? 0) + 1;
    }

    @ftruncate($fp, 0);
    @rewind($fp);
    @fwrite($fp, (string)json_encode($state));
    @fflush($fp);
    @flock($fp, LOCK_UN);
    @fclose($fp);

    if ($state['count'] > $maxAttempts) {
        $retryAfter = max(1, (int)$state['resetAt'] - $now);
        header("Retry-After: {$retryAfter}");
        voxi_json([
            'ok' => false,
            'error' => "Слишком много попыток. Пожалуйста, подождите {$retryAfter} сек. перед повтором.",
        ], 429);
    }
}

function voxi_is_db_configured(array $cfg): bool
{
    $dbName = trim((string)($cfg['db_name'] ?? ''));
    $dbUser = trim((string)($cfg['db_user'] ?? ''));
    $dbPass = (string)($cfg['db_pass'] ?? '');
    if ($dbName === '' || $dbUser === '' || str_contains($dbName, 'your_')) {
        return false;
    }
    if ($dbName === 'voxitest' && $dbUser === 'voxiadmin' && $dbPass === '') {
        $envDbName = voxi_env(['DB_NAME', 'DB_DATABASE', 'MYSQL_DATABASE'], '');
        $envDbPass = voxi_env(['DB_PASS', 'DB_PASSWORD', 'MYSQL_PASSWORD', 'DB_PWD'], '');
        if ($envDbName === '' && $envDbPass === '') {
            return false;
        }
    }
    return true;
}

function voxi_ensure_schema(PDO $pdo, string $dbName): void
{
    $markerFile = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR)
        . DIRECTORY_SEPARATOR
        . 'voxi_schema_v3_' . substr(hash('sha256', $dbName), 0, 16) . '.ok';

    if (is_file($markerFile) && (time() - (int)@filemtime($markerFile)) < 3600) {
        return;
    }

    $statements = [
        "CREATE TABLE IF NOT EXISTS `users` (
          `id` CHAR(36) NOT NULL,
          `email` VARCHAR(191) NOT NULL,
          `password_hash` VARCHAR(255) NOT NULL,
          `company_name` VARCHAR(255) NOT NULL DEFAULT 'Моя компания РБ',
          `niche` VARCHAR(64) NOT NULL DEFAULT 'driving_school',
          `balance_minutes` DECIMAL(10, 2) NOT NULL DEFAULT 15.00,
          `rate_per_minute` DECIMAL(6, 2) NOT NULL DEFAULT 0.45,
          `spent_minutes` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
          `spent_total_byn` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
          `consent_99z_accepted_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
          `reset_token_hash` VARCHAR(64) DEFAULT NULL,
          `reset_token_expires_at` DATETIME DEFAULT NULL,
          `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (`id`),
          UNIQUE KEY `users_email_unique` (`email`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        "CREATE TABLE IF NOT EXISTS `user_sessions` (
          `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          `user_id` CHAR(36) NOT NULL,
          `token_hash` CHAR(64) NOT NULL,
          `ip_address` VARCHAR(64) DEFAULT NULL,
          `user_agent` VARCHAR(255) DEFAULT NULL,
          `expires_at` DATETIME NOT NULL,
          `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (`id`),
          UNIQUE KEY `sessions_token_hash_unique` (`token_hash`),
          KEY `sessions_user_id_idx` (`user_id`),
          KEY `sessions_expires_at_idx` (`expires_at`),
          CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        "CREATE TABLE IF NOT EXISTS `assistants` (
          `id` CHAR(36) NOT NULL,
          `user_id` CHAR(36) NOT NULL,
          `name` VARCHAR(255) NOT NULL,
          `niche` VARCHAR(64) NOT NULL DEFAULT 'driving_school',
          `voice` VARCHAR(32) NOT NULL DEFAULT 'anna',
          `speech_rate` DECIMAL(3, 2) NOT NULL DEFAULT 1.00,
          `formality` VARCHAR(32) NOT NULL DEFAULT 'friendly',
          `company_name` VARCHAR(255) NOT NULL,
          `city` VARCHAR(120) NOT NULL DEFAULT 'Минск',
          `address` VARCHAR(255) DEFAULT NULL,
          `phone` VARCHAR(64) DEFAULT NULL,
          `working_hours` VARCHAR(255) DEFAULT NULL,
          `pricing_and_services` TEXT DEFAULT NULL,
          `knowledge_base` TEXT DEFAULT NULL,
          `first_message` TEXT DEFAULT NULL,
          `system_prompt` TEXT DEFAULT NULL,
          `config_json` LONGTEXT DEFAULT NULL,
          `vapi_assistant_id` VARCHAR(128) DEFAULT NULL,
          `is_active` TINYINT(1) NOT NULL DEFAULT 1,
          `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (`id`),
          UNIQUE KEY `assistants_user_id_unique` (`user_id`),
          CONSTRAINT `fk_assistants_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        "CREATE TABLE IF NOT EXISTS `integrations` (
          `id` CHAR(36) NOT NULL,
          `user_id` CHAR(36) NOT NULL,
          `sip_provider` VARCHAR(64) NOT NULL DEFAULT 'mts',
          `sip_server` VARCHAR(191) NOT NULL DEFAULT 'sip.mts.by:5060',
          `sip_login` VARCHAR(191) DEFAULT NULL,
          `sip_caller_id` VARCHAR(64) DEFAULT NULL,
          `sip_status` VARCHAR(32) NOT NULL DEFAULT 'disconnected',
          `sip_json` LONGTEXT DEFAULT NULL,
          `telegram_chat_id` VARCHAR(128) DEFAULT NULL,
          `telegram_enabled` TINYINT(1) NOT NULL DEFAULT 0,
          `telegram_json` LONGTEXT DEFAULT NULL,
          `webhook_url` VARCHAR(512) DEFAULT NULL,
          `webhook_enabled` TINYINT(1) NOT NULL DEFAULT 0,
          `webhook_json` LONGTEXT DEFAULT NULL,
          `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (`id`),
          UNIQUE KEY `integrations_user_id_unique` (`user_id`),
          CONSTRAINT `fk_integrations_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        "CREATE TABLE IF NOT EXISTS `call_logs` (
          `id` VARCHAR(64) NOT NULL,
          `user_id` CHAR(36) NOT NULL,
          `niche` VARCHAR(64) DEFAULT NULL,
          `caller_number` VARCHAR(64) NOT NULL,
          `caller_name` VARCHAR(191) DEFAULT NULL,
          `call_timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          `duration_seconds` INT UNSIGNED NOT NULL DEFAULT 0,
          `cost_byn` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
          `status` VARCHAR(32) NOT NULL DEFAULT 'consultation',
          `deal_value_byn` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
          `summary` TEXT DEFAULT NULL,
          `captured_data` LONGTEXT NOT NULL,
          `transcript` LONGTEXT NOT NULL,
          `audio_url` VARCHAR(512) DEFAULT NULL,
          `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (`id`),
          KEY `call_logs_user_timestamp_idx` (`user_id`, `call_timestamp`),
          CONSTRAINT `fk_call_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        "CREATE TABLE IF NOT EXISTS `minute_transactions` (
          `id` CHAR(36) NOT NULL,
          `user_id` CHAR(36) NOT NULL,
          `type` VARCHAR(32) NOT NULL,
          `minutes` DECIMAL(10, 2) NOT NULL,
          `amount_byn` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
          `payment_method` VARCHAR(64) DEFAULT NULL,
          `external_uid` VARCHAR(191) DEFAULT NULL,
          `description` VARCHAR(512) DEFAULT NULL,
          `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (`id`),
          UNIQUE KEY `minute_tx_external_uid_unique` (`external_uid`),
          KEY `minute_tx_user_created_idx` (`user_id`, `created_at`),
          CONSTRAINT `fk_minute_tx_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        "CREATE TABLE IF NOT EXISTS `payment_orders` (
          `id` CHAR(36) NOT NULL,
          `user_id` CHAR(36) NOT NULL,
          `minutes` DECIMAL(10, 2) NOT NULL,
          `amount_kopecks` INT UNSIGNED NOT NULL,
          `currency` CHAR(3) NOT NULL DEFAULT 'BYN',
          `status` VARCHAR(16) NOT NULL DEFAULT 'pending',
          `is_test` TINYINT(1) NOT NULL DEFAULT 0,
          `external_uid` VARCHAR(191) DEFAULT NULL,
          `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          `paid_at` DATETIME DEFAULT NULL,
          PRIMARY KEY (`id`),
          KEY `payment_orders_user_idx` (`user_id`, `created_at`),
          CONSTRAINT `fk_payment_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
    ];

    foreach ($statements as $sql) {
        $pdo->exec($sql);
    }

    @file_put_contents($markerFile, (string)time());
}

function voxi_get_pdo(array $cfg): PDO
{
    $primaryHost = trim((string)($cfg['db_host'] ?? '127.0.0.1'));
    if ($primaryHost === '') {
        $primaryHost = '127.0.0.1';
    }
    $port = trim((string)($cfg['db_port'] ?? '3306'));
    $name = trim((string)($cfg['db_name'] ?? 'voxitest'));
    $user = trim((string)($cfg['db_user'] ?? 'voxiadmin'));
    $pass = (string)($cfg['db_pass'] ?? '');

    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];

    $hosts = array_values(array_unique([$primaryHost, '127.0.0.1', 'localhost']));
    $lastException = null;

    foreach ($hosts as $host) {
        try {
            $dsn = "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4";
            $pdo = new PDO($dsn, $user, $pass, $options);
            voxi_ensure_schema($pdo, $name);
            return $pdo;
        } catch (Throwable $e) {
            $lastException = $e;
        }
    }

    throw ($lastException instanceof Exception ? $lastException : new Exception('Database connection failed: ' . ($lastException ? $lastException->getMessage() : 'unknown error')));
}

function voxi_extract_session_token(): string
{
    // Сессия хранится только в HttpOnly-cookie (недоступна из JS => защита от кражи при XSS)
    $cookie = (string)($_COOKIE['voxi_session'] ?? '');
    if (preg_match('/^[a-f0-9]{32,128}$/i', $cookie)) {
        return strtolower($cookie);
    }
    return '';
}

function voxi_set_session_cookie(string $token, int $ttlSeconds = 2592000): void
{
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

    setcookie('voxi_session', $token, [
        'expires' => time() + $ttlSeconds,
        'path' => '/',
        'secure' => $isHttps,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
}

function voxi_clear_session_cookie(): void
{
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

    setcookie('voxi_session', '', [
        'expires' => time() - 3600,
        'path' => '/',
        'secure' => $isHttps,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
}

function voxi_find_authenticated_user(PDO $pdo): ?array
{
    $token = voxi_extract_session_token();
    if ($token === '') {
        return null;
    }
    $tokenHash = hash('sha256', $token);
    $stmt = $pdo->prepare(
        'SELECT u.* FROM user_sessions s
         INNER JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = ? AND s.expires_at > NOW()
         LIMIT 1'
    );
    $stmt->execute([$tokenHash]);
    $row = $stmt->fetch();
    return is_array($row) ? $row : null;
}

function voxi_format_user_session(array $u): array
{
    return [
        'id' => (string)$u['id'],
        'email' => (string)$u['email'],
        'companyName' => (string)$u['company_name'],
        'balanceMinutes' => round((float)$u['balance_minutes'], 2),
        'ratePerMinute' => round((float)$u['rate_per_minute'], 2),
        'spentMinutes' => round((float)$u['spent_minutes'], 2),
        'isMock' => false,
    ];
}

function voxi_smtp_expect($fp, array $allowedCodes): bool
{
    $response = '';
    while (($line = @fgets($fp, 515)) !== false) {
        $response .= $line;
        if (strlen($line) >= 4 && $line[3] === ' ') {
            break;
        }
    }
    $code = (int)substr($response, 0, 3);
    return in_array($code, $allowedCodes, true);
}

function voxi_send_email(array $cfg, string $to, string $subjectText, string $plainBody, string $fallbackHost = 'voxi.by'): bool
{
    $to = trim($to);
    if ($to === '' || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
        return false;
    }

    $smtpHost = trim((string)($cfg['smtp_host'] ?? ''));
    $smtpPort = (int)($cfg['smtp_port'] ?? 465);
    if ($smtpPort <= 0) {
        $smtpPort = 465;
    }
    $smtpUser = trim((string)($cfg['smtp_user'] ?? ''));
    $smtpPass = (string)($cfg['smtp_pass'] ?? '');
    $smtpFrom = trim((string)($cfg['smtp_from'] ?? ''));
    if ($smtpFrom === '' || !filter_var($smtpFrom, FILTER_VALIDATE_EMAIL)) {
        $smtpFrom = ($smtpUser !== '' && filter_var($smtpUser, FILTER_VALIDATE_EMAIL))
            ? $smtpUser
            : "noreply@{$fallbackHost}";
    }
    $encryption = strtolower(trim((string)($cfg['smtp_encryption'] ?? ($smtpPort === 465 ? 'ssl' : 'tls'))));
    $encodedSubject = '=?UTF-8?B?' . base64_encode($subjectText) . '?=';

    // 1. Отправка через аутентифицированный SMTP (SSL 465 / STARTTLS 587), если настроен SMTP_HOST
    if ($smtpHost !== '') {
        $remote = ($encryption === 'ssl' || $smtpPort === 465)
            ? "ssl://{$smtpHost}:{$smtpPort}"
            : "tcp://{$smtpHost}:{$smtpPort}";

        $errNo = 0;
        $errStr = '';
        $fp = @stream_socket_client($remote, $errNo, $errStr, 6);
        if (is_resource($fp)) {
            stream_set_timeout($fp, 6);
            $ok = voxi_smtp_expect($fp, [220]);

            if ($ok) {
                @fwrite($fp, "EHLO {$fallbackHost}\r\n");
                $ok = voxi_smtp_expect($fp, [250]);
            }

            if ($ok && $encryption === 'tls' && $smtpPort !== 465) {
                @fwrite($fp, "STARTTLS\r\n");
                if (voxi_smtp_expect($fp, [220])) {
                    $cryptoOk = @stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
                    if ($cryptoOk) {
                        @fwrite($fp, "EHLO {$fallbackHost}\r\n");
                        $ok = voxi_smtp_expect($fp, [250]);
                    } else {
                        $ok = false;
                    }
                } else {
                    $ok = false;
                }
            }

            if ($ok && $smtpUser !== '' && $smtpPass !== '') {
                @fwrite($fp, "AUTH LOGIN\r\n");
                if (voxi_smtp_expect($fp, [334])) {
                    @fwrite($fp, base64_encode($smtpUser) . "\r\n");
                    if (voxi_smtp_expect($fp, [334])) {
                        @fwrite($fp, base64_encode($smtpPass) . "\r\n");
                        $ok = voxi_smtp_expect($fp, [235]);
                    } else {
                        $ok = false;
                    }
                } else {
                    $ok = false;
                }
            }

            if ($ok) {
                @fwrite($fp, "MAIL FROM:<{$smtpFrom}>\r\n");
                $ok = voxi_smtp_expect($fp, [250]);
            }
            if ($ok) {
                @fwrite($fp, "RCPT TO:<{$to}>\r\n");
                $ok = voxi_smtp_expect($fp, [250, 251]);
            }
            if ($ok) {
                @fwrite($fp, "DATA\r\n");
                $ok = voxi_smtp_expect($fp, [354]);
            }
            if ($ok) {
                $normBody = str_replace(["\r\n", "\r"], "\n", $plainBody);
                $dotStuffed = preg_replace('/^\./m', '..', $normBody) ?? $normBody;
                $smtpBody = str_replace("\n", "\r\n", $dotStuffed);
                $messageId = '<' . bin2hex(random_bytes(12)) . "@{$fallbackHost}>";
                $dateHeader = gmdate('D, d M Y H:i:s +0000');

                $rawEmail = "Date: {$dateHeader}\r\n"
                    . "From: Voxi.by <{$smtpFrom}>\r\n"
                    . "To: <{$to}>\r\n"
                    . "Subject: {$encodedSubject}\r\n"
                    . "Message-ID: {$messageId}\r\n"
                    . "MIME-Version: 1.0\r\n"
                    . "Content-Type: text/plain; charset=UTF-8\r\n"
                    . "Content-Transfer-Encoding: 8bit\r\n\r\n"
                    . "{$smtpBody}\r\n.\r\n";

                @fwrite($fp, $rawEmail);
                $ok = voxi_smtp_expect($fp, [250]);
            }

            @fwrite($fp, "QUIT\r\n");
            @fclose($fp);

            if ($ok) {
                return true;
            }
        }
    }

    // 2. Fallback: локальный MTA хостинга через mail(), если SMTP не задан или недоступен
    $headers = "From: Voxi.by <{$smtpFrom}>\r\n"
        . "Reply-To: {$smtpFrom}\r\n"
        . "MIME-Version: 1.0\r\n"
        . "Content-Type: text/plain; charset=UTF-8\r\n";
    return (bool)@mail($to, $encodedSubject, $plainBody, $headers);
}

/**
 * Мгновенная отправка уведомления администратору платформы в Telegram
 * (о новых регистрациях, оплатах, критических сбоях)
 */
function voxi_notify_admin_telegram(string $htmlText): bool
{
    global $VOXI_CONFIG;
    $botToken = trim((string)($VOXI_CONFIG['telegram_bot_token'] ?? ''));
    if ($botToken === '') {
        return false;
    }

    $adminChatId = trim((string)($VOXI_CONFIG['telegram_admin_chat_id'] ?? ''));
    if ($adminChatId === '') {
        $cacheFile = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'voxi_admin_chat_id.txt';
        if (is_file($cacheFile)) {
            $adminChatId = trim((string)@file_get_contents($cacheFile));
        }
    }

    if ($adminChatId === '') {
        return false;
    }

    $ch = curl_init("https://api.telegram.org/bot{$botToken}/sendMessage");
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 5,
        CURLOPT_CONNECTTIMEOUT => 3,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode([
            'chat_id' => $adminChatId,
            'text' => $htmlText,
            'parse_mode' => 'HTML',
            'disable_web_page_preview' => false,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    ]);
    $res = @curl_exec($ch);
    $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return $httpCode >= 200 && $httpCode < 300;
}
