<?php
/**
 * Voxi.by — Конфигурация подключения к БД MySQL в ISPmanager (hoster.by)
 *
 * Как заполнить на хостинге:
 * 1. В ISPmanager откройте «Базы данных» -> «Создать базу данных» (тип MySQL).
 * 2. Впишите ниже Имя БД (DB_NAME), Пользователя (DB_USER) и Пароль (DB_PASS),
 *    ЛИБО задайте их в файле .env рядом с папкой сайта (www/.env или www/voxi.by/.env).
 * 3. Все таблицы создадутся АВТОМАТИЧЕСКИ при первом открытии сайта!
 */

if (!defined('VOXI_API_BOOT')) {
    http_response_code(403);
    exit('Forbidden');
}

return [
    // --- 1. База данных MySQL / MariaDB (ISPmanager) ---
    'db_host' => getenv('DB_HOST') ?: 'localhost',
    'db_port' => getenv('DB_PORT') ?: '3306',
    'db_name' => getenv('DB_NAME') ?: '', // <-- Например: 'u123456_voxi'
    'db_user' => getenv('DB_USER') ?: '', // <-- Например: 'u123456_voxi'
    'db_pass' => getenv('DB_PASS') ?: '', // <-- Пароль пользователя БД из ISPmanager

    // --- 2. Yandex SpeechKit + YandexGPT Lite (опционально) ---
    'yandex_api_key'   => getenv('YANDEX_GPT_API_KEY') ?: (getenv('YANDEX_API_KEY') ?: ''),
    'yandex_iam_token' => getenv('YANDEX_IAM_TOKEN') ?: '',
    'yandex_folder_id' => getenv('YANDEX_FOLDER_ID') ?: '',

    // --- 3. Платёжный шлюз bePaid (ЕРИП + карты РБ в BYN) ---
    'bepaid_shop_id'         => getenv('BEPAID_SHOP_ID') ?: '',
    'bepaid_secret_key'      => getenv('BEPAID_SECRET_KEY') ?: '',
    'bepaid_test_mode'       => (getenv('BEPAID_TEST_MODE') ?: 'true') !== 'false',
    'bepaid_erip_service_no' => getenv('BEPAID_ERIP_SERVICE_NO') ?: '99999999',
    'public_site_url'        => getenv('PUBLIC_SITE_URL') ?: '',

    // --- 4. Резервный нейросетевой синтез речи (если ключ Yandex ещё не указан) ---
    'fallback_tts_url' => getenv('FALLBACK_TTS_URL') ?: 'https://telerobot.vercel.app/api/tts',
];
