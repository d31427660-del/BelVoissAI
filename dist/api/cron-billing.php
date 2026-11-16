<?php
declare(strict_types=1);

/**
 * Cron-скрипт ежемесячного биллинга Voxi.by:
 * Рекомендуемое расписание в ISPmanager:
 *   5 0 * * * curl -fsS "https://voxi.by/api/cron-billing?secret=ВАШ_ADMIN_MASTER_PIN" >/dev/null
 * (1-го числа в 00:05 закрывает прошлый месяц и выставляет счета со сроком 7 дней;
 *  в остальные дни проверяет просрочку > 7 дней и ставит неплательщиков на паузу).
 */

require_once __DIR__ . '/bootstrap.php';

$providedSecret = trim((string)($_GET['secret'] ?? ($_SERVER['HTTP_X_CRON_SECRET'] ?? '')));
$expectedPin = trim((string)($VOXI_CONFIG['admin_master_pin'] ?? ''));
$expectedVapi = trim((string)($VOXI_CONFIG['vapi_webhook_secret'] ?? ''));

$authorized = false;
if ($providedSecret !== '') {
    if ($expectedPin !== '' && hash_equals($expectedPin, $providedSecret)) {
        $authorized = true;
    } elseif ($expectedVapi !== '' && hash_equals($expectedVapi, $providedSecret)) {
        $authorized = true;
    }
}

if (!$authorized) {
    voxi_json(['ok' => false, 'error' => 'Unauthorized cron secret'], 401);
}

if (!voxi_is_db_configured($VOXI_CONFIG)) {
    voxi_json(['ok' => false, 'error' => 'Database not configured'], 503);
}

try {
    $pdo = voxi_get_pdo($VOXI_CONFIG);
    $result = voxi_close_month_and_check_overdue($pdo);

    if ($result['closedCount'] > 0 || $result['overdueSuspendedCount'] > 0) {
        @voxi_notify_admin_telegram(
            "📆 <b>Авто-биллинг Voxi.by</b>\n\n"
            . "🧾 Выставлено счетов за месяц: <b>{$result['closedCount']}</b>\n"
            . "⏸ Приостановлено за просрочку (&gt;7 дн): <b>{$result['overdueSuspendedCount']}</b>"
        );
    }

    voxi_json([
        'ok' => true,
        'closedCount' => $result['closedCount'],
        'overdueSuspendedCount' => $result['overdueSuspendedCount'],
        'runAt' => date('Y-m-d H:i:s'),
    ]);
} catch (Throwable $e) {
    error_log('[voxi][cron-billing] ' . $e->getMessage());
    voxi_json(['ok' => false, 'error' => 'Cron billing error'], 500);
}
