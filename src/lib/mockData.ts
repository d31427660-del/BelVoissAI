import { AgentConfig, CallLog, BusinessNiche, SipSettings, TelegramSettings, WebhookSettings, PhoneticRule, MysteryAuditItem, MinutePackage } from '../types';

export const MINUTE_PACKAGES: MinutePackage[] = [
  {
    id: 'pack_100',
    name: 'Старт',
    minutes: 100,
    priceByn: 45,
    ratePerMinute: 0.45,
    badge: 'Для пробы и вечеров',
    isPopular: false,
    description: 'Идеально для перехвата звонков после 19:00, в обед и выходные дни (~65 принятых заявок).'
  },
  {
    id: 'pack_300',
    name: 'Оптимальный',
    minutes: 300,
    priceByn: 120,
    ratePerMinute: 0.40,
    badge: 'Популярный выбор',
    isPopular: true,
    savingsPercent: 11,
    description: 'Полноценный автоответчик 24/7 для салонов, СТО и автошкол со стабильным трафиком (~200 диалогов).'
  },
  {
    id: 'pack_1000',
    name: 'Масштаб / Сеть',
    minutes: 1000,
    priceByn: 350,
    ratePerMinute: 0.35,
    badge: 'Максимальная выгода',
    isPopular: false,
    savingsPercent: 22,
    description: 'Для клиник, сетей автосервисов и компаний с высоким потоком входящих обращений (~700 диалогов).'
  }
];

export const PHONETIC_PRESETS: Record<'toponyms' | 'surnames' | 'abbr', PhoneticRule[]> = {
  toponyms: [
    {
      id: 'ph-pobediteley',
      word: 'Победителей',
      stressed: 'Победи́телей',
      ttsReplacement: 'Победителей',
      category: 'toponym',
      samplePhrase: 'Ждём вас в Минске на проспекте Победителей, восемьдесят девять.',
      enabled: true,
    },
    {
      id: 'ph-pritytskogo',
      word: 'Притыцкого',
      stressed: 'Приты́цкого',
      ttsReplacement: 'Притыцкого',
      category: 'toponym',
      samplePhrase: 'Наш второй филиал расположен рядом с метро Каменная Горка на улице Притыцкого.',
      enabled: true,
    },
    {
      id: 'ph-nemiga',
      word: 'Немига',
      stressed: 'Неми́га (Нями́га)',
      ttsReplacement: 'Немига',
      category: 'toponym',
      samplePhrase: 'Удобный подъезд из центра города со стороны улицы Немига.',
      enabled: true,
    },
    {
      id: 'ph-sharangovicha',
      word: 'Шаранговича',
      stressed: 'Шаранго́вича',
      ttsReplacement: 'Шаранговича',
      category: 'toponym',
      samplePhrase: 'Автодром и учебный класс находятся на улице Шаранговича, девятнадцать.',
      enabled: true,
    },
    {
      id: 'ph-surganova',
      word: 'Сурганова',
      stressed: 'Сурга́нова',
      ttsReplacement: 'Сурганова',
      category: 'toponym',
      samplePhrase: 'Мы находимся на улице Сурганова, двадцать четыре, возле метро Академия Наук.',
      enabled: true,
    },
    {
      id: 'ph-timiryazeva',
      word: 'Тимирязева',
      stressed: 'Тимиря́зева',
      ttsReplacement: 'Тимирязева',
      category: 'toponym',
      samplePhrase: 'Свободный бокс автосервиса ждёт вас на улице Тимирязева, сто двадцать один.',
      enabled: true,
    },
    {
      id: 'ph-kalvariyskaya',
      word: 'Кальварийская',
      stressed: 'Кальвари́йская',
      ttsReplacement: 'Кальварийская',
      category: 'toponym',
      samplePhrase: 'Клиника расположена на улице Кальварийская, в двух минутах от метро Молодёжная.',
      enabled: true,
    },
    {
      id: 'ph-zhdanovichi',
      word: 'Ждановичи',
      stressed: 'Жда́новичи',
      ttsReplacement: 'Ждановичи',
      category: 'toponym',
      samplePhrase: 'Удобный выезд на МКАД в сторону района Ждановичи.',
      enabled: true,
    },
  ],
  surnames: [
    {
      id: 'ph-lukashevich',
      word: 'Лукашевич',
      stressed: 'Лукаше́вич',
      ttsReplacement: 'Лукашевич',
      category: 'surname',
      samplePhrase: 'На завтра в одиннадцать тридцать открыта запись к стоматологу-хирургу Лукашевичу.',
      enabled: true,
    },
    {
      id: 'ph-zhdanovich',
      word: 'Жданович',
      stressed: 'Ждано́вич',
      ttsReplacement: 'Жданович',
      category: 'surname',
      samplePhrase: 'Приём ведёт врач высшей категории Жданович Елена Викторовна.',
      enabled: true,
    },
    {
      id: 'ph-kovalyonok',
      word: 'Ковалёнок',
      stressed: 'Ковалё́нок',
      ttsReplacement: 'Ковалёнок',
      category: 'surname',
      samplePhrase: 'Вас примет ведущий специалист клиники доктор Ковалёнок.',
      enabled: true,
    },
    {
      id: 'ph-stankevich',
      word: 'Станкевич',
      stressed: 'Станке́вич',
      ttsReplacement: 'Станкевич',
      category: 'surname',
      samplePhrase: 'Старший мастер приёмки Станкевич уже подготовил диагностический лист.',
      enabled: true,
    },
    {
      id: 'ph-bogdanovich',
      word: 'Богданович',
      stressed: 'Богдано́вич',
      ttsReplacement: 'Богданович',
      category: 'surname',
      samplePhrase: 'Инструктор по вождению Богданович встретит вас у метро Восток.',
      enabled: true,
    },
  ],
  abbr: [
    {
      id: 'ph-byn',
      word: 'BYN',
      stressed: 'белору́сских рубле́й',
      ttsReplacement: 'белорусских рублей',
      category: 'abbr',
      samplePhrase: 'Стоимость комплексной диагностики составляет тридцать пять белорусских рублей.',
      enabled: true,
    },
    {
      id: 'ph-erip',
      word: 'ЕРИП',
      stressed: 'систе́му ЕРИ́П',
      ttsReplacement: 'систему ЕРИП',
      category: 'abbr',
      samplePhrase: 'Оплатить обучение можно без комиссии через систему ЕРИП в любом мобильном банке.',
      enabled: true,
    },
    {
      id: 'ph-klkt',
      word: 'КЛКТ',
      stressed: 'три-дэ томогра́фия',
      ttsReplacement: 'три-дэ томография',
      category: 'abbr',
      samplePhrase: 'Перед имплантацией прямо в клинике выполняется три-дэ томография челюсти.',
      enabled: true,
    },
    {
      id: 'ph-akpp',
      word: 'АКПП',
      stressed: 'коро́бка автома́т',
      ttsReplacement: 'коробка автомат',
      category: 'abbr',
      samplePhrase: 'Обучение доступно на новых автомобилях с коробкой автомат.',
      enabled: true,
    },
  ],
};

export const NICHE_TEMPLATES: Record<BusinessNiche, {
  name: string;
  label: string;
  icon: string;
  companyName: string;
  city: string;
  address: string;
  phone: string;
  workingHours: string;
  firstMessage: string;
  pricingAndServices: string;
  knowledgeBase: string;
  defaultAvgCheck: number;
  sampleCallerAudio: string;
}> = {
  driving_school: {
    name: 'Автошкола',
    label: 'Автошколы',
    icon: 'Car',
    companyName: 'Автошкола "Драйв-Минск"',
    city: 'Минск',
    address: 'ул. Сурганова, 24 (ст.м. Академия Наук) и пр-т Дзержинского, 104',
    phone: '+375 (29) 112-44-55',
    workingHours: 'Пн-Пт: 09:00 - 20:00, Сб: 10:00 - 16:00, Вс: выходной',
    firstMessage: 'Здравствуйте! Автошкола "Драйв-Минск", меня зовут Анна. Разговор записывается. Чтобы переключиться на менеджера, скажите «соедините с менеджером». Подскажите, вас интересует обучение на категорию B или восстановление навыков вождения?',
    pricingAndServices: `1. Полный курс категории "B" (теория + 50 часов вождения): 1050 BYN + топливо (около 280 BYN).
2. Оплата в 4 этапа беспроцентной рассрочки.
3. Дополнительное вождение с инструктором на автодроме ГАИ (Серова, 1): 45 BYN за 1.5 часа (МКПП), 50 BYN (АКПП).
4. Восстановление навыков вождения: пакет из 5 занятий — 220 BYN.
5. Утренние группы (09:30), вечерние (18:30) и группы выходного дня (Сб-Вс 10:00).`,
    knowledgeBase: `Срок обучения: 3-3.5 месяца.
Автопарк: новые Volkswagen Polo и Renault Sandero (механика и автомат).
Собственный автодром: рядом с метро Восток и Серова.
Медкомиссия: можно пройти в 24-й поликлинике спецмедосмотров на Филимонова, 53. Помогаем с направлением.
Внутренний экзамен бесплатный, сдача в ГАИ организованно всей группой на машинах автошколы.`,
    defaultAvgCheck: 1050,
    sampleCallerAudio: 'Хочу узнать про вечернюю группу на категорию B возле метро Академия Наук и сколько первый взнос?'
  },

  auto_service: {
    name: 'Автосервис (СТО)',
    label: 'Автосервисы (СТО)',
    icon: 'Wrench',
    companyName: 'СТО "Минск-Моторс Экспресс"',
    city: 'Минск',
    address: 'ул. Тимирязева, 121 (район Ждановичи)',
    phone: '+375 (44) 730-88-00',
    workingHours: 'Ежедневно с 08:30 до 20:30 без обеда',
    firstMessage: 'Добрый день! СТО "Минск-Моторс", меня зовут Анна. Разговор записывается. Чтобы переключиться на менеджера, скажите «соедините с менеджером». Чем могу помочь вашему автомобилю?',
    pricingAndServices: `1. Компьютерная диагностика двигателя и электронных систем Launch / Autel: 40 BYN.
2. Комплексная диагностика подвески на вибростенде: 35 BYN (при ремонте у нас — БЕСПЛАТНО).
3. Замена моторного масла и фильтра: 30 BYN (масло можно наше со скидкой 15% — Shell, Castrol, Motul, Eni).
4. Замена передних тормозных колодок: от 45 BYN.
5. Сезонный шиномонтаж 4 колес с балансировкой: R15-R16 — 60 BYN, R17-R18 — 75 BYN, R19-R21 — 95 BYN.
6. Заправка и антибактериальная чистка автокондиционера: от 70 BYN.`,
    knowledgeBase: `Гарантия на все виды слесарных работ — 6 месяцев или 10 000 км пробега.
Собственный склад автозапчастей с доставкой за 40 минут по оптовым ценам.
Комфортная зона ожидания с зерновым кофе, Wi-Fi и мониторами с камер наблюдения ремзоны.
Принимаем карты Халва, Карта Покупок (рассрочка до 3 месяцев). Безналичный расчет для юрлиц с НДС.`,
    defaultAvgCheck: 280,
    sampleCallerAudio: 'Добрый день, стучит спереди на кочках в Volkswagen Passat B8, можно записаться на диагностику сегодня после 18:00?'
  },

  medical_clinic: {
    name: 'Медицинский центр / Стоматология',
    label: 'Стоматологии и Клиники',
    icon: 'Stethoscope',
    companyName: 'Стоматологический центр "Дент-Престиж"',
    city: 'Минск',
    address: 'пр-т Победителей, 89 (ст.м. Пушкинская / Спортивная)',
    phone: '+375 (17) 365-20-20',
    workingHours: 'Пн-Сб: 08:00 - 21:00, Вс: 09:00 - 18:00',
    firstMessage: 'Здравствуйте! Стоматология "Дент-Престиж", администратор Анна. Разговор записывается. Чтобы переключиться на менеджера, скажите «соедините с менеджером». Желаете записаться на консультацию или вас беспокоит острая боль?',
    pricingAndServices: `1. Консультация стоматолога-терапевта + составление плана лечения: 35 BYN (бесплатно при лечении).
2. Профессиональная гигиена полости рта (ультразвук + Air-Flow + полировка + фторирование): 160 BYN за обе челюсти.
3. Лечение кариеса со светоотверждаемой фотополимерной пломбой (Filtek / Estelite): от 110 до 180 BYN.
4. Дентальная имплантация (имплант корейский Osstem / Megagen): от 850 BYN, швейцарский Straumann — от 1650 BYN.
5. 3D-компьютерная томография (КЛКТ) зубов: 45 BYN.`,
    knowledgeBase: `Прием пациентов с острой зубной болью ведется без очереди в день обращения.
Все виды лечения проводятся с современной безопасной анестезией (Ubistesin / Ultracain).
Работаем с медицинскими страховыми полисами: Белгосстрах, Ингосстрах, Белнефтестрах, ТАСК, Купала, Кентавр.
Детский кабинет с мультфильмами на потолке и безболезненной адаптацией.`,
    defaultAvgCheck: 210,
    sampleCallerAudio: 'Здравствуйте! Ноет зуб под пломбой второй день, есть ли окно к врачу на завтра утром?'
  },

  beauty_salon: {
    name: 'Салон красоты / Барбершоп',
    label: 'Салоны красоты',
    icon: 'Scissors',
    companyName: 'Салон красоты & Барбершоп "Лофт Бьюти"',
    city: 'Минск',
    address: 'ул. Октябрьская, 19Б (ст.м. Первомайская)',
    phone: '+375 (29) 688-99-11',
    workingHours: 'Ежедневно с 10:00 до 22:00',
    firstMessage: 'Приветствуем в "Лофт Бьюти"! Меня зовут Анна. Разговор записывается. Чтобы переключиться на менеджера, скажите «соедините с менеджером». Какую услугу для вас забронировать: стрижку, окрашивание или уход?',
    pricingAndServices: `1. Мужская стрижка + мытье головы + стайлинг: 55 BYN.
2. Комплекс "Стрижка + моделирование бороды горячим полотенцем": 85 BYN.
3. Женская модельная стрижка с укладкой феном: от 70 до 95 BYN.
4. Сложное окрашивание (Airtouch / Shatush / Balayage): от 220 до 380 BYN.
5. Маникюр с долговременным покрытием гель-лак Luxio: 65 BYN.
6. Архитектура и долговременная укладка бровей: 50 BYN.`,
    knowledgeBase: `Бесплатные напитки для гостей: свежесваренный капучино, латте, авторский травяной чай или крафтовый сидр.
Мастера категорий Top и Pro с опытом от 4 лет.
Уютная атмосфера с приятным лоу-фай плейлистом и удобными массажными креслами.
Онлайн-запись и напоминания в Telegram за 3 часа до визита.`,
    defaultAvgCheck: 95,
    sampleCallerAudio: 'Привет! Хочу записаться на маникюр с покрытием на пятницу около 18:30 к топ-мастеру.'
  },

  custom: {
    name: 'Свой бизнес',
    label: 'Свой бизнес',
    icon: 'Sparkles',
    companyName: 'Моя Компания',
    city: 'Минск',
    address: 'ул. Немига, 5',
    phone: '+375 (29) 100-00-00',
    workingHours: 'Пн-Пт: 09:00 - 18:00',
    firstMessage: 'Здравствуйте! Вас приветствует компания, меня зовут Анна. Разговор записывается. Чтобы переключиться на менеджера, скажите «соедините с менеджером». Чем могу вам помочь?',
    pricingAndServices: 'Внесите перечень ваших ключевых услуг, товаров и цены в BYN.',
    knowledgeBase: 'Внесите ответы на частые вопросы клиентов, условия доставки, адрес и правила работы.',
    defaultAvgCheck: 150,
    sampleCallerAudio: 'Добрый день, подскажите ваши цены и как к вам проехать?'
  }
};

export const INITIAL_CALL_LOGS: CallLog[] = [
  {
    id: 'call-bel-101',
    niche: 'driving_school',
    callerNumber: '+375 (29) 682-14-99',
    callerName: 'Максим Ковалёв',
    timestamp: '2026-10-24 12:48',
    durationSeconds: 104,
    audioDuration: '1:44',
    status: 'lead_captured',
    dealValueByn: 1050,
    summary: 'Клиент Максим Ковалёв записан на вечернюю категорию B (Сурганова, 24) с рассрочкой в 4 платежа.',
    sentiment: 'positive',
    tags: ['Запись', 'Категория B', 'Рассрочка', 'Сурганова'],
    greetingVariant: 'A',
    followUpSent: true,
    followUpChannel: 'sms',
    followUpText: 'Здравствуйте, Максим! Вы записаны в вечернюю группу кат. B на Сурганова, 24 (старт 28.10 в 18:30). Документы для медкомиссии: паспорт, 2 фото 3х4.',
    callerFollowUpSent: true,
    callerFollowUpChannel: 'sms',
    callerFollowUpText: 'Здравствуйте! Вы записаны в Автошкола «Драйв-Минск» (Категория B). Время: 18:30. Адрес: ул. Сурганова, 24. Схема: https://yandex.by/maps/-/CDe1V',
    bookedSlot: {
      date: '2026-10-28',
      time: '18:30',
      service: 'Категория B (полный курс, механика)',
      isRealtimeChecked: true
    },
    capturedData: {
      clientName: 'Максим Ковалёв',
      phone: '+375 (29) 682-14-99',
      service: 'Категория B (полный курс, механика)',
      preferredDate: '28 октября (старт вечерней группы)',
      preferredTime: '18:30',
      cityOrBranch: 'ул. Сурганова, 24 (м. Академия Наук)',
      estimatedPriceByn: 1050,
      urgency: 'high'
    },
    transcript: [
      { speaker: 'assistant', text: 'Здравствуйте! Автошкола "Драйв-Минск", меня зовут Анна. Подскажите, вас интересует обучение на категорию B или восстановление навыков?', time: '0:02' },
      { speaker: 'caller', text: 'Добрый день! Хочу пойти на категорию B. Но мне подходит только вечернее время, работаю до шести.', time: '0:12' },
      { speaker: 'assistant', text: 'Отлично! У нас как раз открыт набор в вечернюю группу на Сурганова, 24 — это рядом с метро Академия Наук. Занятия начинаются в 18:30, дважды в неделю. Вам будет удобно это расписание?', time: '0:22' },
      { speaker: 'caller', text: 'Да, идеально. А сколько сейчас стоит курс и можно ли частями платить?', time: '0:34' },
      { speaker: 'assistant', text: 'Стоимость полного курса составляет 1050 белорусских рублей. Мы предоставляем честную рассрочку на 4 равных платежа по 262 рубля 50 копеек на весь период обучения (3.5 месяца). Первый взнос нужен только к началу занятий.', time: '0:48' },
      { speaker: 'caller', text: 'Супер, запишите меня. Меня зовут Максим Ковалёв.', time: '1:02' },
      { speaker: 'assistant', text: 'Зафиксировала, Максим! Номер для связи +375 29 682-14-99. Отправляю вам SMS со списком документов для медкомиссии и договором. Ждём вас на первое организационное собрание 28 октября!', time: '1:25' },
      { speaker: 'caller', text: 'Спасибо большое, Анна! До свидания.', time: '1:38' },
      { speaker: 'assistant', text: 'Всего доброго! Будем рады видеть вас среди наших курсантов.', time: '1:42' }
    ]
  },
  {
    id: 'call-bel-101b',
    niche: 'driving_school',
    callerNumber: '+375 (44) 715-42-10',
    callerName: 'Алина Романовская',
    timestamp: '2026-10-24 11:30',
    durationSeconds: 86,
    audioDuration: '1:26',
    status: 'lead_captured',
    dealValueByn: 220,
    summary: 'Запись на 5 занятий по восстановлению навыков вождения на АКПП (пр-т Дзержинского, 104).',
    sentiment: 'positive',
    tags: ['Запись', 'АКПП', 'Восстановление', 'Дзержинского'],
    greetingVariant: 'B',
    followUpSent: true,
    callerFollowUpSent: true,
    callerFollowUpChannel: 'sms',
    followUpChannel: 'telegram',
    followUpText: 'Алина, добрый день! Запись подтверждена: суббота 26.10 в 11:00, пр-т Дзержинского, 104. Инструктор Павел, VW Polo (АКПП).',
    capturedData: {
      clientName: 'Алина Романовская',
      phone: '+375 (44) 715-42-10',
      service: 'Восстановление навыков вождения (5 занятий АКПП)',
      preferredDate: '26 октября (суббота)',
      preferredTime: '11:00',
      cityOrBranch: 'пр-т Дзержинского, 104',
      estimatedPriceByn: 220,
      urgency: 'medium'
    },
    transcript: [
      { speaker: 'assistant', text: 'Здравствуйте! Автошкола "Драйв-Минск", меня зовут Анна. Подскажите, вас интересует обучение на категорию B или восстановление навыков?', time: '0:02' },
      { speaker: 'caller', text: 'Здравствуйте! Права получила 3 года назад, но почти не ездила. Хочу взять несколько уроков на автомате.', time: '0:12' },
      { speaker: 'assistant', text: 'С удовольствием поможем! У нас есть специальный пакет из 5 занятий по восстановлению навыков на новом Volkswagen Polo с коробкой автомат. Стоимость пакета — 220 белорусских рублей. В каком районе вам удобнее начать?', time: '0:26' },
      { speaker: 'caller', text: 'Мне удобно на проспекте Дзержинского, желательно в эту субботу утром.', time: '0:40' },
      { speaker: 'assistant', text: 'В субботу в 11:00 у инструктора Павла свободно окно на Дзержинского, 104. Подскажите ваше имя для брони?', time: '0:52' },
      { speaker: 'caller', text: 'Алина Романовская. Запишите, пожалуйста.', time: '1:05' },
      { speaker: 'assistant', text: 'Записала вас, Алина! Суббота, 11:00, пр-т Дзержинского, 104. Детали отправила в Telegram. До встречи!', time: '1:20' }
    ]
  },
  {
    id: 'call-bel-101c',
    niche: 'driving_school',
    callerNumber: '+375 (29) 390-18-55',
    callerName: 'Денис Кравцов',
    timestamp: '2026-10-24 10:05',
    durationSeconds: 68,
    audioDuration: '1:08',
    status: 'lead_captured',
    dealValueByn: 1050,
    summary: 'Запись Дениса Кравцова в группу выходного дня на АКПП и отправка памятки по медкомиссии.',
    sentiment: 'positive',
    tags: ['Запись', 'АКПП', 'Выходные', 'Медкомиссия'],
    greetingVariant: 'B',
    callerFollowUpSent: true,
    callerFollowUpChannel: 'sms',
    followUpSent: true,
    followUpChannel: 'sms',
    followUpText: 'Денис, место в группе выходного дня забронировано (старт 02.11 в 10:00). 24-я поликлиника: ул. Филимонова, 53.',
    capturedData: {
      clientName: 'Денис Кравцов',
      phone: '+375 (29) 390-18-55',
      service: 'Категория B (группа выходного дня, АКПП)',
      preferredDate: '2 ноября (суббота)',
      preferredTime: '10:00',
      cityOrBranch: 'ул. Сурганова, 24',
      estimatedPriceByn: 1050,
      urgency: 'high'
    },
    transcript: [
      { speaker: 'assistant', text: 'Здравствуйте! Автошкола "Драйв-Минск", меня зовут Анна. Слушаю вас!', time: '0:02' },
      { speaker: 'caller', text: 'Подскажите, есть ли у вас группа выходного дня на автомат? В будни в командировках.', time: '0:11' },
      { speaker: 'assistant', text: 'Да, конечно! Группа выходного дня занимается по субботам и воскресеньям с 10:00. Стоимость полного курса — 1050 BYN с рассрочкой на 4 этапа. Забронировать место?', time: '0:25' },
      { speaker: 'caller', text: 'Да, меня зовут Денис Кравцов. И подскажите, где проходить медкомиссию?', time: '0:38' },
      { speaker: 'assistant', text: 'Забронировала место за вами, Денис! Медкомиссию можно пройти в 24-й поликлинике на Филимонова, 53 — я уже отправила список документов вам в SMS.', time: '0:56' }
    ]
  },
  {
    id: 'call-bel-102',
    niche: 'auto_service',
    callerNumber: '+375 (33) 345-81-20',
    callerName: 'Ольга Николаевна',
    timestamp: '2026-10-24 11:15',
    durationSeconds: 78,
    audioDuration: '1:18',
    status: 'lead_captured',
    dealValueByn: 280,
    summary: 'Запись на шиномонтаж R16 и диагностику подвески Renault Duster на субботу 14:00.',
    sentiment: 'positive',
    tags: ['Запись', 'Шиномонтаж', 'СТО', 'Тимирязева'],
    followUpSent: true,
    followUpChannel: 'sms',
    followUpText: 'Ольга, ждём ваш Renault Duster в субботу 26.10 к 14:00 на Тимирязева, 121 (бокс №3). Шиномонтаж R16 + диагностика.',
    capturedData: {
      clientName: 'Ольга Николаевна',
      phone: '+375 (33) 345-81-20',
      service: 'Сезонный шиномонтаж R16 + диагностика подвески',
      preferredDate: '26 октября (суббота)',
      preferredTime: '14:00',
      cityOrBranch: 'ул. Тимирязева, 121',
      vehicleOrDetails: 'Renault Duster 2019',
      estimatedPriceByn: 95,
      urgency: 'medium'
    },
    transcript: [
      { speaker: 'assistant', text: 'Добрый день! СТО "Минск-Моторс". Меня зовут Анна. Чем могу помочь вашему автомобилю?', time: '0:02' },
      { speaker: 'caller', text: 'Здравствуйте. Нужно переобуть Рено Дастер на зимнюю резину и глянуть подвеску, что-то поскрипывает.', time: '0:11' },
      { speaker: 'assistant', text: 'С удовольствием поможем! Какой радиус колес у вашего Дастера? Обычно это R16.', time: '0:19' },
      { speaker: 'caller', text: 'Да, именно шестнадцатый.', time: '0:24' },
      { speaker: 'assistant', text: 'Стоимость полного шиномонтажа четырех колес с балансировкой — 60 BYN. Диагностика подвески стоит 35 BYN, но если решите делать ремонт у нас, она будет абсолютно бесплатной! Есть свободный подъемник на субботу, 26 октября, в 14:00. Бронируем?', time: '0:38' },
      { speaker: 'caller', text: 'Да, запишите на субботу в два часа, пожалуйста. За рулем я, Ольга.', time: '0:56' },
      { speaker: 'assistant', text: 'Записала вас, Ольга! Суббота, 14:00, бокс №3 на Тимирязева, 121. Выслала подтверждение в Вайбер. Хорошего дня!', time: '1:08' },
      { speaker: 'caller', text: 'Спасибо, приеду!', time: '1:16' }
    ]
  },
  {
    id: 'call-bel-103',
    niche: 'medical_clinic',
    callerNumber: '+375 (44) 591-03-77',
    callerName: 'Виктор Сергеевич',
    timestamp: '2026-10-24 09:20',
    durationSeconds: 92,
    audioDuration: '1:32',
    status: 'lead_captured',
    dealValueByn: 850,
    summary: 'Консультация по имплантации зубов Osstem. Записан на 3D-снимок КТ и консультацию хирурга-имплантолога.',
    sentiment: 'positive',
    tags: ['Запись', 'Имплантация', 'Osstem', '3D КТ'],
    followUpSent: true,
    followUpChannel: 'sms',
    followUpText: 'Виктор Сергеевич, приём у доктора Громова назначен на завтра в 11:30 (пр-т Победителей, 89). 3D КТ челюсти включено в план приёма.',
    capturedData: {
      clientName: 'Виктор Сергеевич',
      phone: '+375 (44) 591-03-77',
      service: 'Консультация имплантолога + 3D КТ',
      preferredDate: 'Завтра, 11:30',
      preferredTime: '11:30',
      cityOrBranch: 'пр-т Победителей, 89',
      estimatedPriceByn: 850,
      urgency: 'high'
    },
    transcript: [
      { speaker: 'assistant', text: 'Здравствуйте! Стоматология "Дент-Престиж", слушаю вас. Желаете записаться на прием или вас беспокоит острая боль?', time: '0:02' },
      { speaker: 'caller', text: 'Здравствуйте. Нет, острой боли нет, нужно вставить нижний жевательный зуб. Хочу про импланты узнать.', time: '0:14' },
      { speaker: 'assistant', text: 'Мы ставим сертифицированные корейские импланты Osstem и премиальные швейцарские Straumann с пожизненной гарантией. Базовая стоимость импланта Osstem — от 850 BYN. Перед установкой требуется 3D томография челюсти.', time: '0:28' },
      { speaker: 'caller', text: 'А томографию у вас на месте можно сделать?', time: '0:45' },
      { speaker: 'assistant', text: 'Да, у нас собственный 3D-томограф KaVo. Снимок делается за 2 минуты, стоимость 45 BYN, и доктор сразу на приеме составит точный план. Могу предложить завтра в 11:30 к доктору Громову.', time: '0:56' },
      { speaker: 'caller', text: 'Давайте, подходит. Меня зовут Виктор Сергеевич.', time: '1:12' },
      { speaker: 'assistant', text: 'Отлично, Виктор Сергеевич! Записала вас на завтра, 11:30, проспект Победителей, 89. До встречи!', time: '1:24' }
    ]
  },
  {
    id: 'call-bel-103b',
    niche: 'medical_clinic',
    callerNumber: '+375 (29) 764-19-08',
    callerName: 'Екатерина Леонидовна',
    timestamp: '2026-10-24 14:10',
    durationSeconds: 74,
    audioDuration: '1:14',
    status: 'lead_captured',
    dealValueByn: 160,
    summary: 'Запись на комплексную гигиену полости рта Air-Flow по полису Белгосстрах на завтра в 18:30.',
    sentiment: 'positive',
    tags: ['Запись', 'Air-Flow', 'Белгосстрах', 'Страховка'],
    followUpSent: true,
    followUpChannel: 'sms',
    followUpText: 'Екатерина Леонидовна, запись на гигиену Air-Flow: завтра 18:30, пр-т Победителей, 89. Не забудьте взять полис Белгосстрах.',
    capturedData: {
      clientName: 'Екатерина Леонидовна',
      phone: '+375 (29) 764-19-08',
      service: 'Профессиональная гигиена полости рта (Air-Flow)',
      preferredDate: 'Завтра, 18:30',
      preferredTime: '18:30',
      cityOrBranch: 'пр-т Победителей, 89',
      estimatedPriceByn: 160,
      urgency: 'medium'
    },
    transcript: [
      { speaker: 'assistant', text: 'Здравствуйте! Стоматология "Дент-Престиж", меня зовут Анна. Слушаю вас!', time: '0:02' },
      { speaker: 'caller', text: 'Добрый день! Подскажите, сколько стоит ультразвуковая чистка зубов и принимаете ли вы по страховке Белгосстрах?', time: '0:12' },
      { speaker: 'assistant', text: 'Комплексная гигиена обеих челюстей с Air-Flow и фторированием стоит 160 белорусских рублей. С полисами Белгосстрах мы работаем напрямую! Записать вас на завтра вечером в 18:30?', time: '0:27' },
      { speaker: 'caller', text: 'Отлично, запишите на 18:30. Екатерина Леонидовна.', time: '0:46' },
      { speaker: 'assistant', text: 'Записала вас, Екатерина Леонидовна! Не забудьте взять паспорт и карточку застрахованного. Ждём вас завтра в 18:30 на Победителей, 89!', time: '1:04' }
    ]
  },
  {
    id: 'call-bel-102b',
    niche: 'auto_service',
    callerNumber: '+375 (29) 188-40-52',
    callerName: 'Игорь Станкевич',
    timestamp: '2026-10-24 19:42',
    durationSeconds: 82,
    audioDuration: '1:22',
    status: 'lead_captured',
    dealValueByn: 145,
    summary: 'Вечерняя запись на замену масла и передних колодок Volkswagen Passat B8. Оплата картой Халва.',
    sentiment: 'positive',
    tags: ['Запись', 'Замена масла', 'Тормоза', 'Халва'],
    followUpSent: true,
    followUpChannel: 'sms',
    followUpText: 'Игорь, бокс забронирован на завтра в 09:30 (ул. Тимирязева, 121). Принимаем оплату картой Халва.',
    capturedData: {
      clientName: 'Игорь Станкевич',
      phone: '+375 (29) 188-40-52',
      service: 'Замена моторного масла + передних колодок',
      preferredDate: 'Завтра в 09:30',
      preferredTime: '09:30',
      cityOrBranch: 'ул. Тимирязева, 121',
      vehicleOrDetails: 'VW Passat B8 2.0 TDI',
      estimatedPriceByn: 145,
      urgency: 'high'
    },
    transcript: [
      { speaker: 'assistant', text: 'Добрый вечер! СТО "Минск-Моторс". Чем могу помочь вашему автомобилю?', time: '0:02' },
      { speaker: 'caller', text: 'Здравствуйте, нужно поменять масло и передние колодки на Пассат Б8. Сколько по работе и есть ли Халва?', time: '0:14' },
      { speaker: 'assistant', text: 'Замена масла с фильтром стоит 30 белорусских рублей, замена передних тормозных колодок — 45 рублей. Карту Халва принимаем с рассрочкой до 3 месяцев! Могу записать вас на завтра в 09:30 утра.', time: '0:31' },
      { speaker: 'caller', text: 'Да, давайте на 9:30. Зовут Игорь.', time: '0:52' },
      { speaker: 'assistant', text: 'Готово, Игорь! Бокс забронирован на завтра в 09:30 на Тимирязева, 121. Хорошего вечера!', time: '1:08' }
    ]
  },
  {
    id: 'call-bel-106',
    niche: 'beauty_salon',
    callerNumber: '+375 (29) 614-77-33',
    callerName: 'Дарья Мельникова',
    timestamp: '2026-10-24 20:15',
    durationSeconds: 88,
    audioDuration: '1:28',
    status: 'lead_captured',
    dealValueByn: 290,
    summary: 'Запись на сложное окрашивание Airtouch к топ-стилисту на пятницу в 17:30.',
    sentiment: 'positive',
    tags: ['Запись', 'Airtouch', 'Топ-стилист', 'Пятница'],
    followUpSent: true,
    followUpChannel: 'telegram',
    followUpText: 'Дарья, в пятницу в 17:30 ждём вас в "Лофт Бьюти" на Airtouch (ул. Октябрьская, 19Б).',
    capturedData: {
      clientName: 'Дарья Мельникова',
      phone: '+375 (29) 614-77-33',
      service: 'Сложное окрашивание Airtouch + уход',
      preferredDate: 'Пятница, 17:30',
      preferredTime: '17:30',
      cityOrBranch: 'ул. Октябрьская, 19Б',
      estimatedPriceByn: 290,
      urgency: 'high'
    },
    transcript: [
      { speaker: 'assistant', text: 'Приветствуем в "Лофт Бьюти"! Меня зовут Анна. Какую услугу для вас забронировать: стрижку, окрашивание или уход?', time: '0:02' },
      { speaker: 'caller', text: 'Добрый вечер! Хочу записаться на сложное окрашивание Аиртач на среднюю длину в эту пятницу вечером.', time: '0:14' },
      { speaker: 'assistant', text: 'Сложное окрашивание Airtouch на среднюю длину у топ-мастера стоит около 290 белорусских рублей, включая тонирование и уход. В пятницу свободно окошко на 17:30 на Октябрьской, 19Б. Подойдёт это время?', time: '0:32' },
      { speaker: 'caller', text: 'Да, отлично! Запишите Дарью Мельникову.', time: '0:51' },
      { speaker: 'assistant', text: 'Записала вас, Дарья! В пятницу в 17:30 ждём вас в "Лофт Бьюти" с ароматным капучино. Напоминание придёт в Telegram за 3 часа до визита!', time: '1:12' }
    ]
  },
  {
    id: 'call-bel-106b',
    niche: 'beauty_salon',
    callerNumber: '+375 (44) 502-88-19',
    callerName: 'Артём Савицкий',
    timestamp: '2026-10-24 13:25',
    durationSeconds: 64,
    audioDuration: '1:04',
    status: 'lead_captured',
    dealValueByn: 85,
    summary: 'Запись на комплекс «Мужская стрижка + моделирование бороды» на сегодня в 19:00.',
    sentiment: 'positive',
    tags: ['Запись', 'Стрижка + Борода', 'Сегодня', 'Барбер'],
    followUpSent: true,
    followUpChannel: 'sms',
    followUpText: 'Артём, запись подтверждена: сегодня в 19:00 (ул. Октябрьская, 19Б). Ждём вас!',
    capturedData: {
      clientName: 'Артём Савицкий',
      phone: '+375 (44) 502-88-19',
      service: 'Мужская стрижка + моделирование бороды',
      preferredDate: 'Сегодня в 19:00',
      preferredTime: '19:00',
      cityOrBranch: 'ул. Октябрьская, 19Б',
      estimatedPriceByn: 85,
      urgency: 'medium'
    },
    transcript: [
      { speaker: 'assistant', text: 'Приветствуем в "Лофт Бьюти"! Меня зовут Анна. Какую услугу для вас забронировать?', time: '0:02' },
      { speaker: 'caller', text: 'Привет! Есть окно сегодня вечером на мужскую стрижку и бороду?', time: '0:10' },
      { speaker: 'assistant', text: 'Да! Комплекс «Стрижка плюс моделирование бороды горячим полотенцем» стоит 85 белорусских рублей. У старшего барбера свободно окно сегодня в 19:00. Забронировать?', time: '0:24' },
      { speaker: 'caller', text: 'Супер, пишите на 19:00, Артём.', time: '0:38' },
      { speaker: 'assistant', text: 'Записала вас, Артём! Сегодня в 19:00, улица Октябрьская, 19Б. До встречи!', time: '0:52' }
    ]
  },
  {
    id: 'call-bel-104',
    niche: 'driving_school',
    callerNumber: '+375 (25) 902-61-14',
    callerName: 'Неизвестный',
    timestamp: '2026-10-24 04:12',
    durationSeconds: 45,
    audioDuration: '0:45',
    status: 'consultation',
    dealValueByn: 0,
    summary: 'Ночной звонок (04:12 утра). Вопрос о графике работы и стоимости теории. ИИ предоставил полную информацию без участия человека.',
    sentiment: 'neutral',
    tags: ['Консультация', 'Ночной звонок', 'График'],
    followUpSent: false,
    capturedData: {
      service: 'Уточнение графика работы',
      urgency: 'normal'
    },
    transcript: [
      { speaker: 'assistant', text: 'Здравствуйте! Автошкола "Драйв-Минск", меня зовут Анна. Слушаю вас!', time: '0:02' },
      { speaker: 'caller', text: 'А вы сейчас работаете? Во сколько завтра открывается офис на Сурганова?', time: '0:10' },
      { speaker: 'assistant', text: 'Наш офис работает с понедельника по пятницу с 9 утра до 8 вечера. Вы можете оставить свой номер, и наш менеджер перезвонит вам ровно в 9:00, либо я могу записать вас в группу прямо сейчас!', time: '0:22' },
      { speaker: 'caller', text: 'А, понял, спасибо, я днем перезвоню.', time: '0:35' },
      { speaker: 'assistant', text: 'Хорошо! Будем ждать вашего звонка. Приятной ночи!', time: '0:40' }
    ]
  },
  {
    id: 'call-bel-107',
    niche: 'auto_service',
    callerNumber: '+375 (29) 554-12-88',
    callerName: 'Павел Василевский',
    timestamp: '2026-10-23 18:20',
    durationSeconds: 110,
    audioDuration: '1:50',
    status: 'forwarded',
    dealValueByn: 0,
    summary: 'Претензия по срокам поставки кузовных деталей после ДТП. Звонок оперативно переведён на управляющего СТО.',
    sentiment: 'negative',
    tags: ['Претензия', 'Перевод', 'Срочно'],
    followUpSent: false,
    transferDetails: {
      targetPhone: '+375 (29) 700-11-22',
      reason: 'conflict',
      summarySentToStaff: true
    },
    capturedData: {
      clientName: 'Павел Василевский',
      phone: '+375 (29) 554-12-88',
      service: 'Уточнение сроков кузовного ремонта',
      urgency: 'high'
    },
    transcript: [
      { speaker: 'assistant', text: 'Добрый день! СТО "Минск-Моторс", меня зовут Анна. Чем могу помочь?', time: '0:02' },
      { speaker: 'caller', text: 'Здравствуйте! Я оставлял у вас машину неделю назад, обещали бампер через три дня, а до сих пор никто не перезвонил! В чем дело?', time: '0:14' },
      { speaker: 'assistant', text: 'Павел, понимаю ваше беспокойство. Заказные позиции могут задерживаться на таможне, но я прямо сейчас переключаю вас на старшего мастера приёмки для точного статуса по вашей машине.', time: '0:28' },
      { speaker: 'caller', text: 'Давайте, соединяйте быстрее.', time: '0:42' },
      { speaker: 'assistant', text: 'Перевожу вызов. Пожалуйста, оставайтесь на линии.', time: '0:48' }
    ]
  },
  {
    id: 'call-bel-105',
    niche: 'driving_school',
    callerNumber: '+375 (17) 200-11-22',
    callerName: 'Спам / Реклама канцтоваров',
    timestamp: '2026-10-23 16:40',
    durationSeconds: 22,
    audioDuration: '0:22',
    status: 'spam',
    dealValueByn: 0,
    summary: 'Автоматический спам-звонок с предложением поставки бумаги А4. ИИ вежливо отказал и сэкономил время персонала.',
    sentiment: 'neutral',
    tags: ['Спам', 'Отказ'],
    followUpSent: false,
    capturedData: {
      urgency: 'normal'
    },
    transcript: [
      { speaker: 'assistant', text: 'Здравствуйте! Автошкола "Драйв-Минск", Анна. Слушаю вас!', time: '0:02' },
      { speaker: 'caller', text: 'Добрый день, предлагаем оптовые поставки офисной бумаги SvetoCopy в Минске...', time: '0:08' },
      { speaker: 'assistant', text: 'Спасибо за предложение, но наша компания не заинтересована в закупках бумаги. Хорошего дня!', time: '0:17' }
    ]
  },
  {
    id: 'call-bel-amd-108',
    niche: 'auto_service',
    callerNumber: '+375 (29) 991-00-11',
    callerName: 'МТС Автоответчик (Исходящий)',
    timestamp: '2026-10-23 15:10',
    durationSeconds: 3,
    audioDuration: '0:03',
    status: 'voicemail_detected',
    dealValueByn: 0,
    costByn: 0.00,
    summary: 'Сработал автоответчик оператора МТС («Абонент временно недоступен»). Бот мгновенно положил трубку, баланс минут защищен (0 BYN списано).',
    sentiment: 'neutral',
    tags: ['AMD', 'Автоответчик МТС', '0 BYN', 'Защита минут'],
    followUpSent: false,
    amdDetails: {
      detected: true,
      carrierName: 'МТС Беларусь',
      detectedPhrase: 'Абонент временно недоступен, пожалуйста, перезвоните позже',
      savedCostByn: 0.45
    },
    capturedData: {
      service: 'Определение автоответчика AMD',
      urgency: 'normal'
    },
    transcript: [
      { speaker: 'caller', text: 'Вас приветствует МТС. Абонент временно недоступен. Пожалуйста, оставьте сообщение после сигнала...', time: '0:01' },
      { speaker: 'assistant', text: '[AMD Детектор]: Обнаружен автоответчик сотового оператора. Мгновенный сброс для защиты минут бизнеса.', time: '0:02' }
    ]
  }
];

export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  id: 'agent-bel-default',
  name: 'Анна — Автошкола "Драйв-Минск"',
  niche: 'driving_school',
  voice: 'anna',
  speechRate: 1.0,
  formality: 'friendly',
  companyName: NICHE_TEMPLATES.driving_school.companyName,
  city: NICHE_TEMPLATES.driving_school.city,
  address: NICHE_TEMPLATES.driving_school.address,
  phone: NICHE_TEMPLATES.driving_school.phone,
  workingHours: NICHE_TEMPLATES.driving_school.workingHours,
  pricingAndServices: NICHE_TEMPLATES.driving_school.pricingAndServices,
  knowledgeBase: NICHE_TEMPLATES.driving_school.knowledgeBase,
  knowledgeDocuments: [
    {
      id: 'doc-drive-price',
      name: 'Прайс-лист_и_условия_рассрочки_2026.pdf',
      sizeKb: 340,
      size: '340 КБ',
      type: 'pdf',
      uploadedAt: '2026-10-20 14:10',
      status: 'ready',
      extractedText: 'ПРАЙС-ЛИСТ АВТОШКОЛЫ «ДРАЙВ-МИНСК»:\n1. Полный курс кат. B (механика) — 1050 BYN (рассрочка на 4 этапа по 262.50 BYN).\n2. Полный курс кат. B (автомат) — 1150 BYN.\n3. Восстановление навыков вождения — 220 BYN (пакет из 5 занятий).\nФилиалы: Сурганова, 24 и пр-т Дзержинского, 104.',
      parsedText: 'ПРАЙС-ЛИСТ АВТОШКОЛЫ «ДРАЙВ-МИНСК»:\n1. Полный курс кат. B (механика) — 1050 BYN (рассрочка на 4 этапа по 262.50 BYN).\n2. Полный курс кат. B (автомат) — 1150 BYN.\n3. Восстановление навыков вождения — 220 BYN (пакет из 5 занятий).\nФилиалы: Сурганова, 24 и пр-т Дзержинского, 104.',
      summary: 'Тарифы на кат. B, условия 4-этапной рассрочки и адреса 2 филиалов.',
      chunkCount: 3,
      chunks: [
        'Тарифы кат. B: механика 1050 BYN (рассрочка 4 этапа по 262.50 BYN), автомат 1150 BYN.',
        'Восстановление навыков вождения: 220 BYN за пакет из 5 практических занятий.',
        'Адреса филиалов: ул. Сурганова, 24 (метро Академия Наук) и пр-т Дзержинского, 104.'
      ]
    },
    {
      id: 'doc-drive-faq',
      name: 'Регламент_медкомиссии_24_поликлиника.docx',
      sizeKb: 120,
      size: '120 КБ',
      type: 'docx',
      uploadedAt: '2026-10-21 09:30',
      status: 'ready',
      extractedText: 'СПИСОК ДОКУМЕНТОВ ДЛЯ МЕДКОМИССИИ (ул. Филимонова, 53):\nПаспорт гражданина РБ, 2 матовые фотографии 3х4 см, выписка из поликлиники по месту жительства за последние 5 лет.',
      parsedText: 'СПИСОК ДОКУМЕНТОВ ДЛЯ МЕДКОМИССИИ (ул. Филимонова, 53):\nПаспорт гражданина РБ, 2 матовые фотографии 3х4 см, выписка из поликлиники по месту жительства за последние 5 лет.',
      summary: 'Требования к медкомиссии водителей.',
      chunkCount: 1,
      chunks: [
        '24-я спецполиклиника (ул. Филимонова, 53): паспорт гражданина РБ, 2 фото 3х4 матовые, выписка за последние 5 лет.'
      ]
    }
  ],
  firstMessage: NICHE_TEMPLATES.driving_school.firstMessage,
  // A/B Testing of Greetings
  abTestingEnabled: true,
  greetingA: 'Здравствуйте! Автошкола «Драйв-Минск», меня зовут Анна. Разговор записывается. Чтобы переключиться на менеджера, скажите «соедините с менеджером». Чем могу помочь?',
  greetingB: 'Добрый день! Автошкола «Драйв-Минск», меня зовут Анна. Разговор записывается. Чтобы переключиться на менеджера, скажите «соедините с менеджером». Набор в вечерние группы на категорию B открыт — слушаю вас!',
  greetingSplitPercent: 50,
  // Conversational Filler Phrases
  fillerPhrasesEnabled: true,
  fillerPhrasesDelayMs: 900,
  // Caller Direct Notification
  callerNotification: {
    isEnabled: true,
    channel: 'sms',
    provider: 'sms_by',
    template: 'Здравствуйте! Вы записаны в {КОМПАНИЯ} ({УСЛУГА}). Время: {ВРЕМЯ}. Адрес: {АДРЕС}. Схема проезда: https://yandex.by/maps/-/CDe1V. Тел: +375 (29) 112-44-55',
    sendMapLink: true,
    notifyOnlyOnLead: true,
    senderName: 'Voxi-Drive'
  },
  // Website Click-to-Call Widget
  webWidgetConfig: {
    isEnabled: true,
    primaryColor: '#000000',
    position: 'bottom-right',
    buttonText: 'Позвонить администратору',
    welcomeMessage: 'Здравствуйте! Я голосовой ИИ-администратор. Могу ответить на любые вопросы по тарифам, расписанию и записать вас на удобное время.',
    autoOpenDelaySec: 0,
    showWaveform: true,
    accentTitle: 'Звонок администратору 24/7'
  },
  systemPrompt: '',
  phoneticRules: [
    ...PHONETIC_PRESETS.toponyms.slice(0, 5),
    ...PHONETIC_PRESETS.surnames.slice(0, 2),
    ...PHONETIC_PRESETS.abbr.slice(0, 2),
  ],
  yclientsConfig: {
    isEnabled: true,
    companyId: '849201',
    partnerToken: '',
    platform: 'yclients',
    autoBookSlots: true,
    notifyClientSms: true,
    selectedStaff: 'all',
    liveSlotCheckingEnabled: true,
    slotDurationMinutes: 60,
    availableDaysAhead: 14
  },
  isActive: true,
  updatedAt: new Date().toISOString()
};

export const DEFAULT_SIP_SETTINGS: SipSettings = {
  provider: 'mts',
  sipServer: 'sip.mts.by:5060',
  sipLogin: '375291124455_voxi',
  callerId: '+375 (29) 112-44-55',
  status: 'connected',
  lastPing: '2026-10-24 12:55',
  byoSipMode: true,
  fallbackEnabled: true,
  fallbackPhone: '+375 (29) 700-11-22',
  fallbackTrigger: 'human_request',
  // Warm Handoff & SIP Transfer
  warmTransferEnabled: true,
  transferNumber: '+375 (29) 700-11-22',
  transferPhone: '+375 (29) 700-11-22',
  transferTriggers: ['human_request', 'conflict_or_complaint', 'complex_query'],
  whisperMessage: 'Минутку, перевожу вас на старшего администратора. Я уже передаю коллеге суть вопроса, оставайтесь на линии...',
  sendSummaryBeforeTransfer: true,
  sendTelegramSummaryOnTransfer: true,
  // AMD - Answering Machine Detection
  amdEnabled: true,
  amdSensitivity: 'normal',
  amdHangupImmediately: true,
  amdProtectMinutes: true,
  piiMaskingEnabled: true,
  recordingDisclaimerEnabled: true,
  disclaimerText: 'В целях контроля качества обслуживания разговор записывается согласно Закону № 99-З.'
};

export const INITIAL_MYSTERY_LEADS: MysteryAuditItem[] = [
  {
    id: 'myst-1',
    companyName: 'СТО "АвтоРем-Сервис"',
    niche: 'auto_service' as const,
    city: 'Минск (ул. Шаранговича)',
    phone: '+375 (29) 641-88-22',
    callTime: 'Вчера в 20:18 (четверг)',
    callStatus: 'no_answer' as const,
    ringsCount: 7,
    lostEstimatedByn: 280,
    aiDemoAudioText: 'Добрый вечер! СТО АвтоРем-Сервис, администратор Анна. Мастера уже ушли, но я могу записать ваш авто на замену колодок или диагностику подвески на завтра с 9 утра. Какая у вас марка машины?',
    pitchMessage: 'Здравствуйте! Вчера в 20:18 мы звонили записаться на замену масла и колодок — трубку никто не снял (клиент ушёл к конкурентам, потеряно ~280 BYN). Послушайте, как за 0.5 секунды на этот вызов ответил бы ваш ИИ-администратор Voxi (прикрепили 25-сек демо).'
  },
  {
    id: 'myst-2',
    companyName: 'Салон красоты "Монро Студио"',
    niche: 'beauty_salon' as const,
    city: 'Минск (пр-т Победителей)',
    phone: '+375 (33) 312-55-90',
    callTime: 'Суббота в 19:40',
    callStatus: 'busy' as const,
    ringsCount: 4,
    lostEstimatedByn: 140,
    aiDemoAudioText: 'Здравствуйте! Студия красоты Монро, меня зовут Полина. Администратор рассчитывает гостя, но я с радостью запишу вас на сложное окрашивание или маникюр к топ-мастеру. На какой день вам подобрать окошко?',
    pitchMessage: 'Добрый день! В субботу в 19:40 в вашем салоне была занята линия (упущен чек ~140 BYN). Voxi AI перехватывает параллельные звонки за 0.5 сек и сразу заносит запись в YCLIENTS / DIKIDI без участия администратора.'
  },
  {
    id: 'myst-3',
    companyName: 'Автошкола "Вираж-Плюс"',
    niche: 'driving_school' as const,
    city: 'Брест (ул. Московская)',
    phone: '+375 (29) 819-00-11',
    callTime: 'Воскресенье в 16:15',
    callStatus: 'no_answer' as const,
    ringsCount: 8,
    lostEstimatedByn: 1050,
    aiDemoAudioText: 'Здравствуйте! Автошкола Вираж-Плюс, слушаю вас! У нас как раз открыт набор в новую вечернюю группу на категорию B в Бресте со стартом через неделю. Желаете забронировать место в рассрочку?',
    pitchMessage: 'Приветствуем! В воскресенье в 16:15 звонили узнать про категорию B в Бресте — никто не ответил (потерян курсант на 1050 BYN). Voxi AI консультирует по категориям и записывает в группы 24/7 даже по выходным.'
  }
];

export const DEFAULT_TELEGRAM_SETTINGS: TelegramSettings = {
  botToken: '',
  chatId: '',
  isEnabled: false,
  notifyOnLead: true,
  notifyOnMissed: true
};

export const DEFAULT_WEBHOOK_SETTINGS: WebhookSettings = {
  webhookUrl: '',
  secretKey: '',
  isEnabled: false,
  sendFormat: 'bitrix24'
};
