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

function voxi_is_db_configured(array $cfg): bool
{
    $dbName = trim((string)($cfg['db_name'] ?? ''));
    $dbUser = trim((string)($cfg['db_user'] ?? ''));
    return $dbName !== '' && $dbUser !== '' && !str_contains($dbName, 'your_');
}

function voxi_ensure_schema(PDO $pdo, string $dbName): void
{
    $markerFile = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR)
        . DIRECTORY_SEPARATOR
        . 'voxi_schema_v1_' . substr(hash('sha256', $dbName), 0, 16) . '.ok';

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
    $headers = [
        $_SERVER['HTTP_AUTHORIZATION'] ?? '',
        $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '',
    ];
    if (function_exists('getallheaders')) {
        $all = getallheaders();
        if (is_array($all)) {
            $headers[] = (string)($all['Authorization'] ?? $all['authorization'] ?? '');
        }
    }
    foreach ($headers as $hdr) {
        if (is_string($hdr) && preg_match('/^Bearer\s+([a-f0-9]{32,128})$/i', trim($hdr), $m)) {
            return strtolower($m[1]);
        }
    }
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
        'samesite' => 'Lax',
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
        'samesite' => 'Lax',
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
