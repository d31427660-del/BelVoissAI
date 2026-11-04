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

if (!$tx || ($tx['status'] ?? '') !== 'successful') {
    http_response_code(200);
    exit('Ignored non-successful status');
}

$trackingParts = explode(':', (string)($tx['tracking_id'] ?? ''));
$userId = trim((string)($trackingParts[0] ?? ''));
$minutes = (float)($trackingParts[1] ?? 0);
$amountByn = round(((float)($tx['amount'] ?? 0)) / 100, 2);
$externalUid = trim((string)($tx['uid'] ?? $tx['id'] ?? ''));
$paymentMethod = trim((string)($tx['payment_method_type'] ?? 'bepaid'));
$description = trim((string)($tx['description'] ?? "Пополнение через bePaid (+{$minutes} мин)"));

if (voxi_is_db_configured($VOXI_CONFIG) && $userId !== '' && $userId !== 'guest' && $minutes > 0) {
    try {
        $pdo = voxi_get_pdo($VOXI_CONFIG);
        $pdo->beginTransaction();

        // Защита от повторного начисления по external_uid (идемпотентность)
        $alreadyProcessed = false;
        if ($externalUid !== '') {
            $chk = $pdo->prepare('SELECT id FROM minute_transactions WHERE external_uid = ? LIMIT 1');
            $chk->execute([$externalUid]);
            if ($chk->fetch()) {
                $alreadyProcessed = true;
            }
        }

        if (!$alreadyProcessed) {
            $ins = $pdo->prepare(
                'INSERT INTO minute_transactions (id, user_id, type, minutes, amount_byn, payment_method, external_uid, description)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $ins->execute([
                voxi_uuid(),
                $userId,
                'topup',
                $minutes,
                $amountByn,
                $paymentMethod,
                $externalUid !== '' ? $externalUid : null,
                $description,
            ]);

            $upd = $pdo->prepare(
                'UPDATE users SET balance_minutes = balance_minutes + ?, updated_at = NOW() WHERE id = ?'
            );
            $upd->execute([$minutes, $userId]);
        }

        $pdo->commit();
    } catch (Throwable $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        http_response_code(500);
        exit('Webhook DB processing failed');
    }
}

voxi_json(['received' => true], 200);
