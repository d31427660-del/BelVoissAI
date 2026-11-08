<?php
/**
 * Voxi.by — Конфигурация подключения к БД MySQL в ISPmanager (hoster.by)
 *
 * Переменные читаются автоматически из:
 * 1. .env файла (в корне сайта или рядом с www)
 * 2. getenv(), $_ENV, $_SERVER
 * 3. Настроек в ISPmanager / окружения хостинга
 *
 * Все 6 таблиц создаются АВТОМАТИЧЕСКИ при первом открытии сайта!
 */

if (!defined('VOXI_API_BOOT')) {
    http_response_code(403);
    exit('Forbidden');
}

$fnEnv = function_exists('voxi_env') ? 'voxi_env' : null;

return [
    // --- 1. База данных MySQL / MariaDB (ISPmanager) ---
    // Хост: 127.0.0.1 (TCP порт 3306) или localhost
    'db_host' => $fnEnv ? voxi_env(['DB_HOST', 'MYSQL_HOST'], '127.0.0.1') : (getenv('DB_HOST') ?: '127.0.0.1'),
    'db_port' => $fnEnv ? voxi_env(['DB_PORT', 'MYSQL_PORT'], '3306') : (getenv('DB_PORT') ?: '3306'),
    'db_name' => $fnEnv ? voxi_env(['DB_NAME', 'DB_DATABASE', 'MYSQL_DATABASE'], 'voxitest') : (getenv('DB_NAME') ?: 'voxitest'),
    'db_user' => $fnEnv ? voxi_env(['DB_USER', 'DB_USERNAME', 'MYSQL_USER'], 'voxiadmin') : (getenv('DB_USER') ?: 'voxiadmin'),
    'db_pass' => $fnEnv ? voxi_env(['DB_PASS', 'DB_PASSWORD', 'MYSQL_PASSWORD', 'DB_PWD'], '') : (getenv('DB_PASS') ?: ''),

    // --- 2. Yandex SpeechKit + YandexGPT Lite (опционально) ---
    'yandex_api_key'   => $fnEnv ? voxi_env(['YANDEX_GPT_API_KEY', 'YANDEX_API_KEY']) : (getenv('YANDEX_GPT_API_KEY') ?: (getenv('YANDEX_API_KEY') ?: '')),
    'yandex_iam_token' => $fnEnv ? voxi_env(['YANDEX_IAM_TOKEN']) : (getenv('YANDEX_IAM_TOKEN') ?: ''),
    'yandex_folder_id' => $fnEnv ? voxi_env(['YANDEX_FOLDER_ID']) : (getenv('YANDEX_FOLDER_ID') ?: ''),

    // --- 3. Платёжный шлюз bePaid (ЕРИП + карты РБ в BYN) ---
    'bepaid_shop_id'         => $fnEnv ? voxi_env(['BEPAID_SHOP_ID']) : (getenv('BEPAID_SHOP_ID') ?: ''),
    'bepaid_secret_key'      => $fnEnv ? voxi_env(['BEPAID_SECRET_KEY']) : (getenv('BEPAID_SECRET_KEY') ?: ''),
    'bepaid_test_mode'       => ($fnEnv ? voxi_env(['BEPAID_TEST_MODE'], 'true') : (getenv('BEPAID_TEST_MODE') ?: 'true')) !== 'false',
    'bepaid_erip_service_no' => $fnEnv ? voxi_env(['BEPAID_ERIP_SERVICE_NO'], '99999999') : (getenv('BEPAID_ERIP_SERVICE_NO') ?: '99999999'),
    'public_site_url'        => $fnEnv ? voxi_env(['PUBLIC_SITE_URL']) : (getenv('PUBLIC_SITE_URL') ?: ''),

    // --- 4. Уведомления администратора в Telegram (онлайн-чат и лиды) ---
    'telegram_bot_token'     => $fnEnv ? voxi_env('TELEGRAM_BOT_TOKEN', voxi_env('VOXI_TELEGRAM_BOT_TOKEN', '')) : (getenv('TELEGRAM_BOT_TOKEN') ?: (getenv('VOXI_TELEGRAM_BOT_TOKEN') ?: '')),
    'telegram_admin_chat_id' => $fnEnv ? voxi_env('TELEGRAM_ADMIN_CHAT_ID', voxi_env('VOXI_TELEGRAM_CHAT_ID', '')) : (getenv('TELEGRAM_ADMIN_CHAT_ID') ?: (getenv('VOXI_TELEGRAM_CHAT_ID') ?: '')),

    // --- 5. Резервный нейросетевой синтез речи ---
    'fallback_tts_url' => $fnEnv ? voxi_env(['FALLBACK_TTS_URL'], 'https://telerobot.vercel.app/api/tts') : (getenv('FALLBACK_TTS_URL') ?: 'https://telerobot.vercel.app/api/tts'),
];
