import { AgentConfig, BusinessNiche, SipSettings, TelegramSettings, WebhookSettings, MinutePackage } from '../types';

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
  firstMessage: NICHE_TEMPLATES.driving_school.firstMessage,
  // Caller Direct Notification
  callerNotification: {
    isEnabled: true,
    channel: 'sms',
    provider: 'sms_by',
    template: 'Здравствуйте, {ИМЯ}! Вы записаны в {КОМПАНИЯ} ({УСЛУГА}). Время: {ВРЕМЯ}. Адрес: {АДРЕС}. Тел: {ТЕЛЕФОН}',
    sendMapLink: true,
    notifyOnlyOnLead: true,
    senderName: 'Voxi'
  },
  systemPrompt: '',
  yclientsConfig: {
    isEnabled: false,
    companyId: '',
    partnerToken: '',
    platform: 'none',
    autoBookSlots: false,
    notifyClientSms: false,
    selectedStaff: 'all',
    liveSlotCheckingEnabled: false,
    slotDurationMinutes: 60,
    availableDaysAhead: 14
  },
  isActive: true,
  updatedAt: new Date().toISOString()
};

export const DEFAULT_SIP_SETTINGS: SipSettings = {
  provider: 'mts',
  sipServer: 'sip.mts.by:5060',
  sipLogin: '',
  callerId: '',
  status: 'disconnected',
  byoSipMode: true,
  fallbackEnabled: true,
  fallbackPhone: '',
  fallbackTrigger: 'human_request',
  // Warm Handoff & SIP Transfer
  warmTransferEnabled: true,
  transferNumber: '',
  transferPhone: '',
  transferTriggers: ['human_request', 'conflict_or_complaint', 'complex_query'],
  whisperMessage: 'Минутку, перевожу вас на старшего администратора. Я уже передаю коллеге суть вопроса, оставайтесь на линии...',
  sendSummaryBeforeTransfer: true,
  sendTelegramSummaryOnTransfer: true,
  piiMaskingEnabled: true,
  recordingDisclaimerEnabled: true,
  disclaimerText: 'В целях контроля качества обслуживания разговор записывается согласно Закону № 99-З.'
};

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
