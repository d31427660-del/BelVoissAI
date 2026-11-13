<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if (strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET')) !== 'POST') {
    http_response_code(405);
    exit('Method Not Allowed');
}

$shopId = trim((string)($VOXI_CONFIG['bepaid_shop_id'] ?? ''));
$secretKey = trim((string)($VOXI_CONFIG['bepaid_secret_key'] ?? ''));

if ($shopId === '' || $secretKey === '') {
    http_response_code(503);
    exit('bePaid not configured');
}

// Поддержка HTTP Basic Auth под Apache / LSAPI в ISPmanager
$authHeader = (string)($_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
$verified = false;

if (isset($_SERVER['PHP_AUTH_USER'], $_SERVER['PHP_AUTH_PW'])) {
    $actual = $_SERVER['PHP_AUTH_USER'] . ':' . $_SERVER['PHP_AUTH_PW'];
    $verified = hash_equals("{$shopId}:{$secretKey}", $actual);
} elseif (preg_match('/^Basic\s+(.+)$/i', trim($authHeader), $m)) {
    $decoded = base64_decode(trim($m[1]), true);
    if (is_string($decoded)) {
        $verified = hash_equals("{$shopId}:{$secretKey}", $decoded);
    }
}

if (!$verified) {
    http_response_code(401);
    exit('Unauthorized webhook signature');
}

$payload = voxi_read_json_body();
$tx = isset($payload['transaction']) && is_array($payload['transaction']) ? $payload['transaction'] : null;

if (!$tx) {
    http_response_code(200);
    exit('Ignored: missing transaction payload');
}

$status = strtolower((string)($tx['status'] ?? ''));
$txType = strtolower((string)($tx['type'] ?? 'payment'));
$orderId = trim((string)($tx['tracking_id'] ?? ($payload['tracking_id'] ?? '')));
$externalUid = trim((string)($tx['uid'] ?? $tx['id'] ?? ''));
$paidKopecks = (int)round((float)($tx['amount'] ?? 0));
$paidCurrency = strtoupper((string)($tx['currency'] ?? ''));
$paymentMethod = mb_substr(trim((string)($tx['payment_method_type'] ?? 'bepaid')), 0, 64);
$paidIsTest = !empty($tx['test']);

if ($orderId === '' || !voxi_is_db_configured($VOXI_CONFIG)) {
    http_response_code(200);
    exit('Ignored: no order reference or db not configured');
}

try {
    $pdo = voxi_get_pdo($VOXI_CONFIG);
    $pdo->beginTransaction();

    // Блокируем заказ на время обработки: исключает двойное начисление при повторных/параллельных вебхуках
    $stmtOrder = $pdo->prepare('SELECT * FROM payment_orders WHERE id = ? LIMIT 1 FOR UPDATE');
    $stmtOrder->execute([$orderId]);
    $order = $stmtOrder->fetch();

    if (!is_array($order)) {
        $pdo->rollBack();
        error_log("[voxi][bepaid] unknown order {$orderId}");
        http_response_code(200);
        exit('Ignored: unknown order');
    }

    // Обработка неуспешных статусов (failed, declined, expired, canceled)
    if (in_array($status, ['failed', 'declined', 'expired', 'canceled'], true)) {
        if ($order['status'] === 'pending') {
            $pdo->prepare("UPDATE payment_orders SET status = 'failed', external_uid = ? WHERE id = ?")
                ->execute([$externalUid !== '' ? $externalUid : null, $orderId]);
        }
        $pdo->commit();
        voxi_json(['received' => true, 'status' => 'order_marked_failed'], 200);
    }

    // Обработка возврата (refund / void)
    if ($status === 'refunded' || $txType === 'refund' || $txType === 'void') {
        $pdo->prepare("UPDATE payment_orders SET status = 'refunded', external_uid = ? WHERE id = ?")
            ->execute([$externalUid !== '' ? $externalUid : null, $orderId]);
        $pdo->commit();
        error_log("[voxi][bepaid] order {$orderId} was refunded/voided");
        voxi_json(['received' => true, 'status' => 'order_marked_refunded'], 200);
    }

    // Начисляем минуты ТОЛЬКО за успешный платёж (payment / capture)
    if ($status !== 'successful' || !in_array($txType, ['payment', 'capture'], true)) {
        $pdo->commit();
        http_response_code(200);
        exit('Ignored: non-payment or non-successful status');
    }

    if ($order['status'] === 'paid') {
        $pdo->commit();
        voxi_json(['received' => true, 'duplicate' => true], 200);
    }

    // Сверка с серверным заказом: сумма, валюта и режим (тест/бой) должны совпасть
    $mismatch = $paidKopecks !== (int)$order['amount_kopecks']
        || $paidCurrency !== (string)$order['currency']
        || ($paidIsTest && !(bool)($VOXI_CONFIG['bepaid_test_mode'] ?? true));
    if ($mismatch) {
        $pdo->prepare("UPDATE payment_orders SET status = 'mismatch', external_uid = ? WHERE id = ?")
            ->execute([$externalUid, $orderId]);
        $pdo->commit();
        error_log("[voxi][bepaid] order {$orderId} mismatch: paid={$paidKopecks} {$paidCurrency} expected={$order['amount_kopecks']} {$order['currency']}");
        http_response_code(200);
        exit('Ignored: amount mismatch');
    }

    $minutes = (float)$order['minutes'];
    $amountByn = round(((int)$order['amount_kopecks']) / 100, 2);
    $userId = (string)$order['user_id'];

    $pdo->prepare(
        'INSERT INTO minute_transactions (id, user_id, type, minutes, amount_byn, payment_method, external_uid, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )->execute([
        voxi_uuid(), $userId, 'topup', $minutes, $amountByn, $paymentMethod, $externalUid,
        "Пополнение через bePaid (+{$minutes} мин)",
    ]);
    $pdo->prepare('UPDATE users SET balance_minutes = balance_minutes + ?, updated_at = NOW() WHERE id = ?')
        ->execute([$minutes, $userId]);
    $pdo->prepare("UPDATE payment_orders SET status = 'paid', paid_at = NOW(), external_uid = ? WHERE id = ?")
        ->execute([$externalUid, $orderId]);

    $pdo->commit();

    // Мгновенное уведомление создателю платформы в Telegram об успешной оплате
    $payMsg = "💰 <b>Успешная оплата на Voxi.by!</b>\n\n"
            . "💵 Сумма: <b>{$amountByn} BYN</b>\n"
            . "⏱ Начислено: <b>+{$minutes} минут</b>\n"
            . "💳 Способ: <b>" . htmlspecialchars($paymentMethod, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . "</b>\n"
            . "🆔 ID клиента: <code>{$userId}</code>\n"
            . "🧾 Заказ: <code>{$orderId}</code>";
    @voxi_notify_admin_telegram($payMsg);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('[voxi][bepaid] webhook failed: ' . $e->getMessage());
    http_response_code(500);
    exit('Webhook DB processing failed');
}

voxi_json(['received' => true], 200);
