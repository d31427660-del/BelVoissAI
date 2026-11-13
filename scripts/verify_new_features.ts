import { checkLiveSlotAvailability, normalizeDateQuery } from '../src/lib/calendarSlotService';
import { formatCallerTemplate } from '../src/lib/callerNotificationService';
import { generateBotReply, createCallLogFromDialogue } from '../src/lib/botDialogueEngine';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('🧪 Запуск тестов новых фичей Voxi.by...\n');

  // 2. CALENDAR TWO-WAY LIVE SLOT CHECKING TEST
  console.log('\n1. Тестирование проверки свободных слотов на лету (Live Function Calling):');
  const normalized = normalizeDateQuery('на завтра');
  assert(normalized.displayDate.length > 0, `Дата 'на завтра' нормализована в: ${normalized.displayDate}`);

  // Free slot test
  const freeResult = await checkLiveSlotAvailability({
    dateQuery: 'завтра',
    timeQuery: '11:30',
    serviceName: 'Диагностика подвески',
  });
  assert(freeResult.isAvailable === true, 'Слот 11:30 корректно определен как свободный');
  assert(freeResult.speechResponse.includes('11:30'), 'Ответ бота подтверждает бронь 11:30');

  // Busy slot conflict test
  const busyResult = await checkLiveSlotAvailability({
    dateQuery: 'завтра',
    timeQuery: '18:00',
    serviceName: 'Категория B',
  });
  assert(busyResult.isAvailable === false, 'Слот 18:00 определен как занятый (коллизия расписания)');
  assert(busyResult.alternativeSlots.length > 0, `Предложены альтернативные слоты: ${busyResult.alternativeSlots.join(', ')}`);
  assert(busyResult.speechResponse.includes('уже занята') && busyResult.speechResponse.includes('свободно в'), 'Бот вежливо объясняет занятость и предлагает альтернативы');

  // 3. CALLER NOTIFICATION SERVICE TEST
  console.log('\n2. Тестирование отправки SMS / Viber визитки клиенту:');
  const template = 'Здравствуйте, {ИМЯ}! Вы записаны в {КОМПАНИЯ} ({УСЛУГА}). Время: {ВРЕМЯ}. Адрес: {АДРЕС}. Тел: {ТЕЛЕФОН}';
  const formatted = formatCallerTemplate(template, {
    clientName: 'Артём',
    companyName: 'СТО «Авторитет»',
    service: 'Замена масла',
    time: '14:00',
    address: 'ул. Тимирязева, 65',
    contactPhone: '+375 (29) 112-44-55',
  });
  assert(formatted.includes('Артём'), 'Шаблон содержит имя клиента');
  assert(formatted.includes('СТО «Авторитет»'), 'Шаблон содержит название компании');
  assert(formatted.includes('14:00'), 'Шаблон содержит время записи');
  assert(formatted.includes('ул. Тимирязева, 65'), 'Шаблон содержит адрес');

  // 4. DIALOGUE ENGINE + CALL LOG TEST
  console.log('\n3. Тестирование интеграции в диалоговый движок и журнал звонков:');
  const conflictReply = generateBotReply('Запишите меня ровно на 18:00 на завтра', {
    niche: 'auto_service',
    companyName: 'СТО «Авторитет»',
    address: 'ул. Тимирязева, 65',
  });
  assert(conflictReply.includes('уже занято') && conflictReply.includes('17:30 или в 18:30'), `Движок диалога обрабатывает конфликт времени на лету: "${conflictReply}"`);

  const mockLog = createCallLogFromDialogue({
    niche: 'auto_service',
    companyName: 'СТО «Авторитет»',
    address: 'ул. Тимирязева, 65',
    durationSeconds: 75,
    callerNotification: {
      isEnabled: true,
      channel: 'sms',
      provider: 'sms_by',
      template,
      sendMapLink: true,
      notifyOnlyOnLead: true,
    },
    messages: [
      { speaker: 'assistant', text: 'Добрый день! СТО Авторитет. Чем могу помочь?', time: '0:01' },
      { speaker: 'user', text: 'Здравствуйте, запишите меня на замену колодок завтра в 18:30. Меня зовут Дмитрий.', time: '0:08' },
      { speaker: 'assistant', text: 'Записала вас на 18:30, Дмитрий!', time: '0:14' },
    ],
  });

  assert(mockLog !== null, 'CallLog успешно создан из диалога');
  assert(mockLog?.status === 'lead_captured', 'Статус звонка определен как lead_captured');
  assert(mockLog?.callerFollowUpSent === true, 'Зафиксирована отправка SMS клиенту (callerFollowUpSent)');
  assert(mockLog?.bookedSlot?.isRealtimeChecked === true, 'Зафиксирован проверенный слот бронирования');
  assert(mockLog?.bookedSlot?.time === '18:30', 'Время слота зафиксировано как 18:30');

  console.log(`\n========================================`);
  console.log(`ИТОГИ ТЕСТА: Пройдено ${passed}, Ошибок ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
