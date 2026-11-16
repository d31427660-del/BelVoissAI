<?php
declare(strict_types=1);

/**
 * Постоплатный биллинг Voxi.by:
 * - 15 бесплатных минут при регистрации (не идут в счёт месяца)
 * - Абонплата 15.00 BYN/мес за выделенный номер А1 ВАТС (или 0.00 BYN при своей SIP-линии)
 * - Тариф за минуту (по умолчанию 0.45 BYN/мин)
 * - Досрочное погашение в течение месяца
 * - Закрытие месяца 1-го числа в 00:05 + 7 календарных дней на оплату без блокировки
 * - Кредитный лимит (по умолчанию 100 BYN)
 */

function voxi_user_subscription_fee(array $userRow): float
{
    $mode = (string)($userRow['number_rental_mode'] ?? 'rental');
    if ($mode === 'own_sip') {
        return 0.00;
    }
    $fee = (float)($userRow['monthly_subscription_byn'] ?? 15.00);
    return $fee >= 0 ? round($fee, 2) : 15.00;
}

function voxi_get_or_create_open_invoice(PDO $pdo, array $userRow, ?string $periodYm = null): array
{
    $userId = (string)$userRow['id'];
    $ym = $periodYm ?: date('Y-m');

    $stmt = $pdo->prepare('SELECT * FROM monthly_invoices WHERE user_id = ? AND period_ym = ? LIMIT 1');
    $stmt->execute([$userId, $ym]);
    $row = $stmt->fetch();
    if (is_array($row)) {
        return $row;
    }

    $rate = (float)($userRow['rate_per_minute'] ?? 0.45);
    if ($rate <= 0) {
        $rate = 0.45;
    }
    $subFee = voxi_user_subscription_fee($userRow);
    $invId = voxi_uuid();
    $shortId = strtoupper(substr(str_replace('-', '', $userId), 0, 4));
    $invNum = 'СЧ-' . str_replace('-', '', $ym) . '-' . $shortId;

    $stmtIns = $pdo->prepare(
        'INSERT INTO monthly_invoices (
           id, user_id, period_ym, invoice_number,
           billable_minutes, free_minutes_used, rate_per_minute,
           minutes_amount_byn, subscription_fee_byn, paid_early_byn, total_amount_byn, status
         ) VALUES (?, ?, ?, ?, 0.00, 0.00, ?, 0.00, ?, 0.00, ?, ?)'
    );
    $stmtIns->execute([$invId, $userId, $ym, $invNum, $rate, $subFee, $subFee, 'open']);

    $stmt->execute([$userId, $ym]);
    $created = $stmt->fetch();
    return is_array($created) ? $created : [];
}

function voxi_calculate_unpaid_debt(PDO $pdo, string $userId): float
{
    $stmt = $pdo->prepare(
        "SELECT COALESCE(SUM(GREATEST(0, total_amount_byn - paid_early_byn)), 0) AS debt
         FROM monthly_invoices
         WHERE user_id = ? AND status IN ('open', 'issued', 'overdue')"
    );
    $stmt->execute([$userId]);
    $row = $stmt->fetch();
    return round((float)($row['debt'] ?? 0), 2);
}

/**
 * Списывает минуты звонка: сначала из 15 бесплатных минут, остаток — в текущий открытый счёт месяца.
 * Проверяет кредитный лимит и при превышении приостанавливает ассистента.
 * Вызывать внутри активной DB-транзакции или самостоятельно.
 */
function voxi_record_postpaid_usage(
    PDO $pdo,
    string $userId,
    float $usedMinutes,
    string $callId,
    string $callerNumber,
    int $durationSec
): array {
    if ($usedMinutes <= 0) {
        return ['freeUsed' => 0.0, 'billableMinutes' => 0.0, 'billableCost' => 0.0, 'limitExceeded' => false];
    }

    $stmtU = $pdo->prepare('SELECT * FROM users WHERE id = ? LIMIT 1 FOR UPDATE');
    $stmtU->execute([$userId]);
    $userRow = $stmtU->fetch();
    if (!is_array($userRow)) {
        return ['freeUsed' => 0.0, 'billableMinutes' => 0.0, 'billableCost' => 0.0, 'limitExceeded' => false];
    }

    $freeRemaining = max(0.0, (float)($userRow['balance_minutes'] ?? 0));
    $freeUsed = round(min($freeRemaining, $usedMinutes), 2);
    $billableMinutes = round(max(0.0, $usedMinutes - $freeUsed), 2);

    $rate = (float)($userRow['rate_per_minute'] ?? 0.45);
    if ($rate <= 0) {
        $rate = 0.45;
    }
    $billableCost = round($billableMinutes * $rate, 2);

    $pdo->prepare(
        'UPDATE users
         SET balance_minutes = GREATEST(0, balance_minutes - ?),
             spent_minutes = spent_minutes + ?,
             spent_total_byn = spent_total_byn + ?,
             updated_at = NOW()
         WHERE id = ?'
    )->execute([$freeUsed, $usedMinutes, $billableCost, $userId]);

    $invoice = voxi_get_or_create_open_invoice($pdo, $userRow);
    if (!empty($invoice['id'])) {
        $pdo->prepare(
            'UPDATE monthly_invoices
             SET free_minutes_used = free_minutes_used + ?,
                 billable_minutes = billable_minutes + ?,
                 minutes_amount_byn = minutes_amount_byn + ?,
                 total_amount_byn = minutes_amount_byn + subscription_fee_byn,
                 updated_at = NOW()
             WHERE id = ?'
        )->execute([$freeUsed, $billableMinutes, $billableCost, $invoice['id']]);
    }

    $desc = $freeUsed > 0 && $billableMinutes <= 0
        ? "Звонок {$callerNumber} ({$durationSec} сек, из 15 бесплатных мин)"
        : "Звонок {$callerNumber} ({$durationSec} сек, в счёт месяца)";

    $pdo->prepare(
        'INSERT INTO minute_transactions (id, user_id, type, minutes, amount_byn, payment_method, external_uid, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )->execute([
        voxi_uuid(),
        $userId,
        'call',
        -$usedMinutes,
        -$billableCost,
        'postpaid_monthly',
        $callId,
        $desc,
    ]);

    // Проверка кредитного лимита
    $creditLimit = (float)($userRow['credit_limit_byn'] ?? 100.00);
    if ($creditLimit <= 0) {
        $creditLimit = 100.00;
    }
    $unpaidDebt = voxi_calculate_unpaid_debt($pdo, $userId);
    $limitExceeded = $unpaidDebt > $creditLimit;

    if ($limitExceeded && (string)($userRow['billing_status'] ?? 'active') !== 'suspended') {
        $pdo->prepare("UPDATE users SET billing_status = 'suspended', updated_at = NOW() WHERE id = ?")
            ->execute([$userId]);
        $pdo->prepare('UPDATE assistants SET is_active = 0, updated_at = NOW() WHERE user_id = ?')
            ->execute([$userId]);

        $company = htmlspecialchars((string)($userRow['company_name'] ?? 'Клиент'), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        @voxi_notify_admin_telegram(
            "⚠️ <b>Превышен кредитный лимит!</b>\n\n"
            . "🏢 Компания: <b>{$company}</b>\n"
            . "💳 Долг: <b>{$unpaidDebt} BYN</b> (лимит: {$creditLimit} BYN)\n"
            . "⏸ Ассистент автоматически поставлен на паузу до оплаты."
        );
    }

    return [
        'freeUsed' => $freeUsed,
        'billableMinutes' => $billableMinutes,
        'billableCost' => $billableCost,
        'limitExceeded' => $limitExceeded,
        'unpaidDebtByn' => $unpaidDebt,
    ];
}

/**
 * Восстанавливает статус клиента после оплаты счёта, если нет просроченных счетов и лимит не превышен.
 */
function voxi_sync_user_billing_status(PDO $pdo, string $userId): void
{
    $stmtU = $pdo->prepare('SELECT credit_limit_byn, billing_status FROM users WHERE id = ? LIMIT 1');
    $stmtU->execute([$userId]);
    $u = $stmtU->fetch();
    if (!is_array($u)) {
        return;
    }

    $stmtOver = $pdo->prepare("SELECT COUNT(*) FROM monthly_invoices WHERE user_id = ? AND status = 'overdue'");
    $stmtOver->execute([$userId]);
    $overdueCount = (int)$stmtOver->fetchColumn();

    $debt = voxi_calculate_unpaid_debt($pdo, $userId);
    $limit = (float)($u['credit_limit_byn'] ?? 100.00);

    if ($overdueCount === 0 && $debt <= $limit) {
        $pdo->prepare("UPDATE users SET billing_status = 'active', updated_at = NOW() WHERE id = ?")
            ->execute([$userId]);
        $pdo->prepare('UPDATE assistants SET is_active = 1, updated_at = NOW() WHERE user_id = ?')
            ->execute([$userId]);
    }
}

/**
 * Закрытие прошлых открытых месяцев (выставление счетов со сроком оплаты 7 дней)
 * и перевод просроченных (> 7 дней) счетов в статус overdue с блокировкой бота.
 */
function voxi_close_month_and_check_overdue(PDO $pdo, ?string $forcePeriodYm = null): array
{
    $currentYm = date('Y-m');
    $closedCount = 0;
    $overdueSuspendedCount = 0;

    // 1. Закрываем все open счета за прошлые периоды (или указанный период)
    if ($forcePeriodYm !== null && preg_match('/^\d{4}-\d{2}$/', $forcePeriodYm)) {
        $stmtOpen = $pdo->prepare("SELECT * FROM monthly_invoices WHERE status = 'open' AND period_ym = ?");
        $stmtOpen->execute([$forcePeriodYm]);
    } else {
        $stmtOpen = $pdo->prepare("SELECT * FROM monthly_invoices WHERE status = 'open' AND period_ym < ?");
        $stmtOpen->execute([$currentYm]);
    }

    $openInvoices = $stmtOpen->fetchAll();
    foreach ($openInvoices as $inv) {
        $remainingDue = round((float)$inv['total_amount_byn'] - (float)$inv['paid_early_byn'], 2);
        if ($remainingDue <= 0.009) {
            $pdo->prepare(
                "UPDATE monthly_invoices
                 SET status = 'paid', issued_at = COALESCE(issued_at, NOW()), paid_at = NOW(), updated_at = NOW()
                 WHERE id = ?"
            )->execute([$inv['id']]);
        } else {
            $pdo->prepare(
                "UPDATE monthly_invoices
                 SET status = 'issued', issued_at = NOW(), due_date = DATE_ADD(NOW(), INTERVAL 7 DAY), updated_at = NOW()
                 WHERE id = ?"
            )->execute([$inv['id']]);
        }
        $closedCount++;
    }

    // 2. Проверяем просроченные счета (более 7 календарных дней после выставления)
    $stmtOver = $pdo->query(
        "SELECT id, user_id FROM monthly_invoices WHERE status = 'issued' AND due_date IS NOT NULL AND due_date < NOW()"
    );
    $overdueRows = $stmtOver ? $stmtOver->fetchAll() : [];
    foreach ($overdueRows as $ov) {
        $pdo->prepare("UPDATE monthly_invoices SET status = 'overdue', updated_at = NOW() WHERE id = ?")
            ->execute([$ov['id']]);
        $pdo->prepare("UPDATE users SET billing_status = 'suspended', updated_at = NOW() WHERE id = ?")
            ->execute([$ov['user_id']]);
        $pdo->prepare('UPDATE assistants SET is_active = 0, updated_at = NOW() WHERE user_id = ?')
            ->execute([$ov['user_id']]);
        $overdueSuspendedCount++;
    }

    return [
        'closedCount' => $closedCount,
        'overdueSuspendedCount' => $overdueSuspendedCount,
    ];
}

/**
 * Собирает полную сводку биллинга для личного кабинета пользователя.
 */
function voxi_build_billing_summary(PDO $pdo, array $userRow): array
{
    $userId = (string)$userRow['id'];
    $currentYm = date('Y-m');

    // Убедимся, что для текущего месяца есть открытый счёт
    voxi_get_or_create_open_invoice($pdo, $userRow, $currentYm);

    $stmtInv = $pdo->prepare(
        'SELECT * FROM monthly_invoices WHERE user_id = ? ORDER BY period_ym DESC LIMIT 12'
    );
    $stmtInv->execute([$userId]);
    $rows = $stmtInv->fetchAll();

    $invoices = [];
    $currentInvoice = null;
    $unpaidDebtByn = 0.0;
    $overdueCount = 0;

    foreach ($rows as $r) {
        $total = round((float)$r['total_amount_byn'], 2);
        $paidEarly = round((float)$r['paid_early_byn'], 2);
        $remaining = round(max(0.0, $total - $paidEarly), 2);
        $status = (string)$r['status'];

        if (in_array($status, ['open', 'issued', 'overdue'], true)) {
            $unpaidDebtByn += $remaining;
        }
        if ($status === 'overdue') {
            $overdueCount++;
        }

        $item = [
            'id' => (string)$r['id'],
            'periodYm' => (string)$r['period_ym'],
            'invoiceNumber' => (string)$r['invoice_number'],
            'billableMinutes' => round((float)$r['billable_minutes'], 2),
            'freeMinutesUsed' => round((float)$r['free_minutes_used'], 2),
            'ratePerMinute' => round((float)$r['rate_per_minute'], 2),
            'minutesAmountByn' => round((float)$r['minutes_amount_byn'], 2),
            'subscriptionFeeByn' => round((float)$r['subscription_fee_byn'], 2),
            'paidEarlyByn' => $paidEarly,
            'totalAmountByn' => $total,
            'remainingDueByn' => $remaining,
            'status' => $status,
            'issuedAt' => $r['issued_at'] ? date('d.m.Y', strtotime((string)$r['issued_at'])) : null,
            'dueDate' => $r['due_date'] ? date('d.m.Y', strtotime((string)$r['due_date'])) : null,
            'paidAt' => $r['paid_at'] ? date('d.m.Y H:i', strtotime((string)$r['paid_at'])) : null,
        ];

        if ((string)$r['period_ym'] === $currentYm) {
            $currentInvoice = $item;
        }
        $invoices[] = $item;
    }

    return [
        'mode' => 'postpaid',
        'numberRentalMode' => ((string)($userRow['number_rental_mode'] ?? 'rental')) === 'own_sip' ? 'own_sip' : 'rental',
        'monthlySubscriptionByn' => voxi_user_subscription_fee($userRow),
        'creditLimitByn' => round((float)($userRow['credit_limit_byn'] ?? 100.00), 2),
        'billingStatus' => (string)($userRow['billing_status'] ?? 'active'),
        'freeMinutesRemaining' => round((float)($userRow['balance_minutes'] ?? 0), 2),
        'currentPeriodYm' => $currentYm,
        'currentInvoice' => $currentInvoice,
        'unpaidDebtByn' => round($unpaidDebtByn, 2),
        'overdueInvoicesCount' => $overdueCount,
        'invoices' => $invoices,
    ];
}
