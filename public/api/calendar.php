<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if (strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET')) !== 'POST') {
    header('Allow: POST');
    voxi_json(['error' => 'Method Not Allowed'], 405);
}

$body = voxi_read_json_body();
$action = trim((string)($body['action'] ?? 'check_slots'));
$platform = trim((string)($body['platform'] ?? 'yclients'));
$companyId = trim((string)($body['companyId'] ?? ''));
$partnerToken = trim((string)($body['partnerToken'] ?? ''));

if ($platform !== 'yclients' && $platform !== 'google_calendar') {
    voxi_json(['ok' => false, 'error' => 'Поддерживаются только YCLIENTS и Google Calendar'], 400);
}

if ($companyId === '' || $partnerToken === '') {
    voxi_json([
        'ok' => false,
        'configured' => false,
        'error' => $platform === 'google_calendar'
            ? 'Укажите Calendar ID и OAuth2 Access Token для Google Calendar'
            : 'Укажите ID филиала и Partner/User Token для YCLIENTS',
    ], 400);
}

function voxi_http_json(string $url, string $method = 'GET', array $headers = [], ?array $payload = null): array
{
    $ch = curl_init($url);
    $opts = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_CONNECTTIMEOUT => 4,
        CURLOPT_HTTPHEADER => $headers,
    ];
    if ($method === 'POST') {
        $opts[CURLOPT_POST] = true;
        $opts[CURLOPT_POSTFIELDS] = json_encode($payload ?? [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
    curl_setopt_array($ch, $opts);
    $raw = curl_exec($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);

    if ($raw === false) {
        return ['status' => 0, 'error' => $err ?: 'Network error', 'data' => null];
    }
    $decoded = json_decode((string)$raw, true);
    return ['status' => $status, 'error' => null, 'data' => is_array($decoded) ? $decoded : null, 'raw' => $raw];
}

// 1. Test connection
if ($action === 'test_connection') {
    if ($platform === 'yclients') {
        $res = voxi_http_json(
            'https://api.yclients.com/api/v1/book_staff/' . rawurlencode($companyId),
            'GET',
            [
                "Authorization: Bearer {$partnerToken}",
                'Accept: application/vnd.yclients.v2+json',
                'Content-Type: application/json',
            ]
        );
        if ($res['status'] >= 200 && $res['status'] < 300 && !empty($res['data']['success'])) {
            $staff = is_array($res['data']['data'] ?? null) ? $res['data']['data'] : [];
            voxi_json([
                'ok' => true,
                'platform' => 'yclients',
                'staffCount' => count($staff),
                'message' => 'YCLIENTS подключён. Найдено специалистов: ' . count($staff),
            ]);
        }
        $msg = (string)($res['data']['meta']['message'] ?? $res['error'] ?? ('HTTP ' . $res['status']));
        voxi_json(['ok' => false, 'error' => "Ошибка YCLIENTS: {$msg}"], 400);
    }

    // Google Calendar
    $res = voxi_http_json(
        'https://www.googleapis.com/calendar/v3/calendars/' . rawurlencode($companyId),
        'GET',
        [
            "Authorization: Bearer {$partnerToken}",
            'Accept: application/json',
        ]
    );
    if ($res['status'] >= 200 && $res['status'] < 300 && !empty($res['data']['id'])) {
        $summary = (string)($res['data']['summary'] ?? $companyId);
        voxi_json([
            'ok' => true,
            'platform' => 'google_calendar',
            'summary' => $summary,
            'message' => "Google Calendar подключён: «{$summary}»",
        ]);
    }
    $msg = (string)($res['data']['error']['message'] ?? $res['error'] ?? ('HTTP ' . $res['status']));
    voxi_json(['ok' => false, 'error' => "Ошибка Google Calendar: {$msg}"], 400);
}

// 2. Check available slots
if ($action === 'check_slots') {
    $isoDate = preg_match('/^\d{4}-\d{2}-\d{2}$/', (string)($body['isoDate'] ?? ''))
        ? (string)$body['isoDate']
        : date('Y-m-d');

    if ($platform === 'yclients') {
        $headers = [
            "Authorization: Bearer {$partnerToken}",
            'Accept: application/vnd.yclients.v2+json',
            'Content-Type: application/json',
        ];
        $staffId = (int)($body['staffId'] ?? 0);
        if ($staffId <= 0) {
            $staffRes = voxi_http_json(
                'https://api.yclients.com/api/v1/book_staff/' . rawurlencode($companyId),
                'GET',
                $headers
            );
            if ($staffRes['status'] >= 200 && $staffRes['status'] < 300 && !empty($staffRes['data']['data'][0]['id'])) {
                $staffId = (int)$staffRes['data']['data'][0]['id'];
            }
        }
        if ($staffId <= 0) {
            voxi_json(['ok' => false, 'error' => 'Не удалось получить список специалистов YCLIENTS'], 400);
        }

        $timesRes = voxi_http_json(
            'https://api.yclients.com/api/v1/book_times/' . rawurlencode($companyId) . '/' . $staffId . '/' . $isoDate,
            'GET',
            $headers
        );
        if ($timesRes['status'] >= 200 && $timesRes['status'] < 300 && is_array($timesRes['data']['data'] ?? null)) {
            $slots = [];
            foreach ($timesRes['data']['data'] as $item) {
                $t = (string)($item['time'] ?? '');
                if ($t !== '') {
                    $slots[] = substr($t, 0, 5);
                }
            }
            voxi_json([
                'ok' => true,
                'isLiveApi' => true,
                'platform' => 'yclients',
                'isoDate' => $isoDate,
                'staffId' => $staffId,
                'availableSlots' => array_values(array_unique($slots)),
            ]);
        }
        $msg = (string)($timesRes['data']['meta']['message'] ?? $timesRes['error'] ?? ('HTTP ' . $timesRes['status']));
        voxi_json(['ok' => false, 'error' => "Ошибка YCLIENTS book_times: {$msg}"], 502);
    }

    // Google Calendar FreeBusy
    $fbRes = voxi_http_json(
        'https://www.googleapis.com/calendar/v3/freeBusy',
        'POST',
        [
            "Authorization: Bearer {$partnerToken}",
            'Content-Type: application/json',
            'Accept: application/json',
        ],
        [
            'timeMin' => "{$isoDate}T00:00:00+03:00",
            'timeMax' => "{$isoDate}T23:59:59+03:00",
            'timeZone' => 'Europe/Minsk',
            'items' => [['id' => $companyId]],
        ]
    );

    if ($fbRes['status'] < 200 || $fbRes['status'] >= 300 || !is_array($fbRes['data']['calendars'] ?? null)) {
        $msg = (string)($fbRes['data']['error']['message'] ?? $fbRes['error'] ?? ('HTTP ' . $fbRes['status']));
        voxi_json(['ok' => false, 'error' => "Ошибка Google Calendar freeBusy: {$msg}"], 502);
    }

    $calData = $fbRes['data']['calendars'][$companyId] ?? reset($fbRes['data']['calendars']);
    $busyRanges = is_array($calData['busy'] ?? null) ? $calData['busy'] : [];

    $candidateTimes = ['09:00', '10:30', '12:00', '13:30', '15:00', '16:30', '18:00', '19:30'];
    $availableSlots = [];
    foreach ($candidateTimes as $timeStr) {
        $slotStart = strtotime("{$isoDate} {$timeStr}:00 Europe/Minsk");
        $slotEnd = $slotStart + 3600;
        $isBusy = false;
        foreach ($busyRanges as $b) {
            $bStart = strtotime((string)($b['start'] ?? ''));
            $bEnd = strtotime((string)($b['end'] ?? ''));
            if ($bStart && $bEnd && $slotStart < $bEnd && $slotEnd > $bStart) {
                $isBusy = true;
                break;
            }
        }
        if (!$isBusy) {
            $availableSlots[] = $timeStr;
        }
    }

    voxi_json([
        'ok' => true,
        'isLiveApi' => true,
        'platform' => 'google_calendar',
        'isoDate' => $isoDate,
        'availableSlots' => $availableSlots,
    ]);
}

// 3. Book slot
if ($action === 'book_slot') {
    $isoDate = preg_match('/^\d{4}-\d{2}-\d{2}$/', (string)($body['isoDate'] ?? ''))
        ? (string)$body['isoDate']
        : date('Y-m-d');
    $time = preg_match('/^\d{2}:\d{2}$/', (string)($body['time'] ?? ''))
        ? (string)$body['time']
        : '18:30';
    $clientName = trim((string)($body['clientName'] ?? 'Клиент Voxi.by'));
    $phone = trim((string)($body['phone'] ?? ''));
    $service = trim((string)($body['service'] ?? 'Консультация / Запись'));

    if ($platform === 'yclients') {
        $staffId = (int)($body['staffId'] ?? 0);
        $res = voxi_http_json(
            'https://api.yclients.com/api/v1/book_record/' . rawurlencode($companyId),
            'POST',
            [
                "Authorization: Bearer {$partnerToken}",
                'Accept: application/vnd.yclients.v2+json',
                'Content-Type: application/json',
            ],
            [
                'phone' => $phone,
                'fullname' => $clientName,
                'email' => '',
                'comment' => "Запись через ИИ-администратора Voxi.by ({$service})",
                'appointments' => [
                    [
                        'id' => 1,
                        'services' => [],
                        'staff_id' => $staffId,
                        'datetime' => "{$isoDate} {$time}:00",
                    ],
                ],
            ]
        );
        if ($res['status'] >= 200 && $res['status'] < 300 && !empty($res['data']['success'])) {
            $recordId = (int)($res['data']['data'][0]['record_id'] ?? 0);
            voxi_json([
                'ok' => true,
                'isLiveApi' => true,
                'recordId' => $recordId,
                'bookingCode' => 'YC-' . ($recordId ?: rand(1000, 9999)),
                'message' => "Запись создана в YCLIENTS на {$isoDate} в {$time}",
            ]);
        }
        $msg = (string)($res['data']['meta']['message'] ?? $res['error'] ?? ('HTTP ' . $res['status']));
        voxi_json(['ok' => false, 'error' => "Не удалось создать запись в YCLIENTS: {$msg}"], 502);
    }

    // Google Calendar Event
    $startTs = strtotime("{$isoDate} {$time}:00 Europe/Minsk");
    $endIso = date('Y-m-d\TH:i:sP', $startTs + 3600);
    $startIso = date('Y-m-d\TH:i:sP', $startTs);

    $res = voxi_http_json(
        'https://www.googleapis.com/calendar/v3/calendars/' . rawurlencode($companyId) . '/events',
        'POST',
        [
            "Authorization: Bearer {$partnerToken}",
            'Content-Type: application/json',
            'Accept: application/json',
        ],
        [
            'summary' => "{$service} — {$clientName}",
            'description' => "Клиент: {$clientName}\nТелефон: {$phone}\nУслуга: {$service}\nИсточник: Voxi.by",
            'start' => ['dateTime' => $startIso, 'timeZone' => 'Europe/Minsk'],
            'end' => ['dateTime' => $endIso, 'timeZone' => 'Europe/Minsk'],
        ]
    );
    if ($res['status'] >= 200 && $res['status'] < 300 && !empty($res['data']['id'])) {
        voxi_json([
            'ok' => true,
            'isLiveApi' => true,
            'bookingCode' => (string)$res['data']['id'],
            'message' => "Событие создано в Google Calendar на {$isoDate} в {$time}",
        ]);
    }
    $msg = (string)($res['data']['error']['message'] ?? $res['error'] ?? ('HTTP ' . $res['status']));
    voxi_json(['ok' => false, 'error' => "Не удалось создать событие в Google Calendar: {$msg}"], 502);
}

voxi_json(['ok' => false, 'error' => 'Unknown action'], 400);
