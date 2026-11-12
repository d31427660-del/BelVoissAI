// Vercel Serverless Function: /api/calendar
// Real two-way integration with YCLIENTS REST API v2 and Google Calendar API v3

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const action = String(body.action || 'check_slots').trim();
    const platform = String(body.platform || 'yclients').trim();
    const companyId = String(body.companyId || '').trim();
    const partnerToken = String(body.partnerToken || '').trim();

    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (platform !== 'yclients' && platform !== 'google_calendar') {
      res.statusCode = 400;
      res.end(JSON.stringify({ ok: false, error: 'Поддерживаются только YCLIENTS и Google Calendar' }));
      return;
    }

    if (!companyId || !partnerToken) {
      res.statusCode = 400;
      res.end(
        JSON.stringify({
          ok: false,
          configured: false,
          error:
            platform === 'google_calendar'
              ? 'Укажите Calendar ID и OAuth2 Access Token для Google Calendar'
              : 'Укажите ID филиала и Partner/User Token для YCLIENTS',
        })
      );
      return;
    }

    if (action === 'test_connection') {
      if (platform === 'yclients') {
        const apiRes = await fetch(`https://api.yclients.com/api/v1/book_staff/${encodeURIComponent(companyId)}`, {
          headers: {
            Authorization: `Bearer ${partnerToken}`,
            Accept: 'application/vnd.yclients.v2+json',
            'Content-Type': 'application/json',
          },
        });
        const data: any = await apiRes.json().catch(() => null);
        if (apiRes.ok && data?.success) {
          const staff = Array.isArray(data.data) ? data.data : [];
          res.statusCode = 200;
          res.end(
            JSON.stringify({
              ok: true,
              platform: 'yclients',
              staffCount: staff.length,
              message: `YCLIENTS подключён. Найдено специалистов: ${staff.length}`,
            })
          );
          return;
        }
        res.statusCode = 400;
        res.end(JSON.stringify({ ok: false, error: `Ошибка YCLIENTS: ${data?.meta?.message || apiRes.status}` }));
        return;
      }

      const gRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(companyId)}`, {
        headers: {
          Authorization: `Bearer ${partnerToken}`,
          Accept: 'application/json',
        },
      });
      const gData: any = await gRes.json().catch(() => null);
      if (gRes.ok && gData?.id) {
        res.statusCode = 200;
        res.end(
          JSON.stringify({
            ok: true,
            platform: 'google_calendar',
            summary: gData.summary || companyId,
            message: `Google Calendar подключён: «${gData.summary || companyId}»`,
          })
        );
        return;
      }
      res.statusCode = 400;
      res.end(JSON.stringify({ ok: false, error: `Ошибка Google Calendar: ${gData?.error?.message || gRes.status}` }));
      return;
    }

    if (action === 'check_slots') {
      const isoDate = /^\d{4}-\d{2}-\d{2}$/.test(String(body.isoDate || ''))
        ? String(body.isoDate)
        : new Date().toISOString().slice(0, 10);

      if (platform === 'yclients') {
        const headers = {
          Authorization: `Bearer ${partnerToken}`,
          Accept: 'application/vnd.yclients.v2+json',
          'Content-Type': 'application/json',
        };
        let staffId = Number(body.staffId || 0);
        if (!staffId) {
          const staffRes = await fetch(`https://api.yclients.com/api/v1/book_staff/${encodeURIComponent(companyId)}`, {
            headers,
          });
          const staffData: any = await staffRes.json().catch(() => null);
          if (staffRes.ok && staffData?.data?.[0]?.id) {
            staffId = Number(staffData.data[0].id);
          }
        }
        if (!staffId) {
          res.statusCode = 400;
          res.end(JSON.stringify({ ok: false, error: 'Не удалось получить список специалистов YCLIENTS' }));
          return;
        }

        const timesRes = await fetch(
          `https://api.yclients.com/api/v1/book_times/${encodeURIComponent(companyId)}/${staffId}/${isoDate}`,
          { headers }
        );
        const timesData: any = await timesRes.json().catch(() => null);
        if (timesRes.ok && Array.isArray(timesData?.data)) {
          const slots = Array.from(
            new Set(timesData.data.map((i: any) => String(i.time || '').slice(0, 5)).filter(Boolean))
          );
          res.statusCode = 200;
          res.end(
            JSON.stringify({
              ok: true,
              isLiveApi: true,
              platform: 'yclients',
              isoDate,
              staffId,
              availableSlots: slots,
            })
          );
          return;
        }
        res.statusCode = 502;
        res.end(JSON.stringify({ ok: false, error: `Ошибка YCLIENTS book_times: ${timesData?.meta?.message || timesRes.status}` }));
        return;
      }

      const fbRes = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${partnerToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          timeMin: `${isoDate}T00:00:00+03:00`,
          timeMax: `${isoDate}T23:59:59+03:00`,
          timeZone: 'Europe/Minsk',
          items: [{ id: companyId }],
        }),
      });
      const fbData: any = await fbRes.json().catch(() => null);
      if (!fbRes.ok || !fbData?.calendars) {
        res.statusCode = 502;
        res.end(JSON.stringify({ ok: false, error: `Ошибка Google Calendar freeBusy: ${fbData?.error?.message || fbRes.status}` }));
        return;
      }

      const cal = fbData.calendars[companyId] || Object.values(fbData.calendars)[0] || {};
      const busyRanges: Array<{ start: string; end: string }> = Array.isArray((cal as any).busy) ? (cal as any).busy : [];
      const candidates = ['09:00', '10:30', '12:00', '13:30', '15:00', '16:30', '18:00', '19:30'];

      const availableSlots = candidates.filter((t) => {
        const slotStart = Date.parse(`${isoDate}T${t}:00+03:00`);
        const slotEnd = slotStart + 3600_000;
        return !busyRanges.some((b) => {
          const bStart = Date.parse(b.start);
          const bEnd = Date.parse(b.end);
          return !isNaN(bStart) && !isNaN(bEnd) && slotStart < bEnd && slotEnd > bStart;
        });
      });

      res.statusCode = 200;
      res.end(
        JSON.stringify({
          ok: true,
          isLiveApi: true,
          platform: 'google_calendar',
          isoDate,
          availableSlots,
        })
      );
      return;
    }

    if (action === 'book_slot') {
      const isoDate = /^\d{4}-\d{2}-\d{2}$/.test(String(body.isoDate || ''))
        ? String(body.isoDate)
        : new Date().toISOString().slice(0, 10);
      const time = /^\d{2}:\d{2}$/.test(String(body.time || '')) ? String(body.time) : '18:30';
      const clientName = String(body.clientName || 'Клиент Voxi.by').trim();
      const phone = String(body.phone || '').trim();
      const service = String(body.service || 'Консультация / Запись').trim();

      if (platform === 'yclients') {
        const staffId = Number(body.staffId || 0);
        const bookRes = await fetch(`https://api.yclients.com/api/v1/book_record/${encodeURIComponent(companyId)}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${partnerToken}`,
            Accept: 'application/vnd.yclients.v2+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone,
            fullname: clientName,
            email: '',
            comment: `Запись через ИИ-администратора Voxi.by (${service})`,
            appointments: [{ id: 1, services: [], staff_id: staffId, datetime: `${isoDate} ${time}:00` }],
          }),
        });
        const bookData: any = await bookRes.json().catch(() => null);
        if (bookRes.ok && bookData?.success) {
          const recordId = Number(bookData?.data?.[0]?.record_id || 0);
          res.statusCode = 200;
          res.end(
            JSON.stringify({
              ok: true,
              isLiveApi: true,
              recordId,
              bookingCode: `YC-${recordId || Math.floor(1000 + Math.random() * 9000)}`,
              message: `Запись создана в YCLIENTS на ${isoDate} в ${time}`,
            })
          );
          return;
        }
        res.statusCode = 502;
        res.end(JSON.stringify({ ok: false, error: `Ошибка YCLIENTS: ${bookData?.meta?.message || bookRes.status}` }));
        return;
      }

      const startMs = Date.parse(`${isoDate}T${time}:00+03:00`);
      const endIso = new Date(startMs + 3600_000).toISOString();
      const startIso = new Date(startMs).toISOString();

      const evRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(companyId)}/events`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${partnerToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            summary: `${service} — ${clientName}`,
            description: `Клиент: ${clientName}\nТелефон: ${phone}\nУслуга: ${service}\nИсточник: Voxi.by`,
            start: { dateTime: startIso, timeZone: 'Europe/Minsk' },
            end: { dateTime: endIso, timeZone: 'Europe/Minsk' },
          }),
        }
      );
      const evData: any = await evRes.json().catch(() => null);
      if (evRes.ok && evData?.id) {
        res.statusCode = 200;
        res.end(
          JSON.stringify({
            ok: true,
            isLiveApi: true,
            bookingCode: evData.id,
            message: `Событие создано в Google Calendar на ${isoDate} в ${time}`,
          })
        );
        return;
      }
      res.statusCode = 502;
      res.end(JSON.stringify({ ok: false, error: `Ошибка Google Calendar: ${evData?.error?.message || evRes.status}` }));
      return;
    }

    res.statusCode = 400;
    res.end(JSON.stringify({ ok: false, error: 'Unknown action' }));
  } catch (err: any) {
    res.statusCode = 500;
    res.end(JSON.stringify({ ok: false, error: err?.message || 'Internal calendar error' }));
  }
}
