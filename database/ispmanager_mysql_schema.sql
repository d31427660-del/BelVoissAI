-- ============================================================================
-- Voxi.by — Production MySQL / MariaDB Schema для ISPmanager (hoster.by)
-- Оператор: ИП Беляков Кирилл Олегович (УНП 193991846, РБ)
-- Кодировка: utf8mb4_unicode_ci, движок: InnoDB
-- ============================================================================
-- Как импортировать в ISPmanager (необязательно — таблицы также создаются
-- автоматически при первом обращении к api/db.php):
--   ISPmanager -> Базы данных -> выбрать БД -> Закачать (или Перейти в phpMyAdmin -> Импорт)
-- ============================================================================

SET NAMES utf8mb4;
SET time_zone = '+03:00';

-- 1. Пользователи и баланс минут
CREATE TABLE IF NOT EXISTS `users` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Сессии авторизации (SHA-256 хэши токенов)
CREATE TABLE IF NOT EXISTS `user_sessions` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Конфигурации голосовых ИИ-ассистентов
CREATE TABLE IF NOT EXISTS `assistants` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Настройки интеграций (SIP РБ, Telegram, Webhook CRM)
CREATE TABLE IF NOT EXISTS `integrations` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Журнал звонков и лидов
CREATE TABLE IF NOT EXISTS `call_logs` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Транзакции минут (пополнения bePaid / ЕРИП, бонусы регистрации и списания)
CREATE TABLE IF NOT EXISTS `minute_transactions` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Платёжные заказы bePaid: сумма и минуты фиксируются на сервере, вебхук сверяется с заказом
CREATE TABLE IF NOT EXISTS `payment_orders` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
