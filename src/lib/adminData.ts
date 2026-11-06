export interface PlatformClient {
  id: string;
  name: string;
  companyName: string;
  unp: string;
  niche: 'driving_school' | 'auto_service' | 'medical_clinic' | 'beauty_salon' | 'custom';
  city: string;
  phone: string;
  email: string;
  balanceMinutes: number;
  ratePerMinute: number;
  spentMinutesTotal: number;
  spentBynTotal: number;
  sipProvider: 'mts' | 'a1' | 'life' | 'beltelecom' | 'other';
  sipStatus: 'connected' | 'warning' | 'disconnected';
  isActive: boolean;
  createdAt: string;
  contractNumber: string;
}

export interface PlatformTransaction {
  id: string;
  clientId: string;
  clientName: string;
  unp: string;
  amountByn: number;
  minutesAdded: number;
  paymentMethod: 'bepaid_card' | 'erip' | 'bank_transfer_act';
  status: 'successful' | 'pending' | 'failed';
  invoiceNumber: string;
  createdAt: string;
  actGenerated: boolean;
}

export interface PlatformTelephonyLog {
  id: string;
  clientId: string;
  companyName: string;
  callerPhone: string;
  assistantVoice: 'anna' | 'maxim';
  durationSeconds: number;
  costByn: number;
  sipTrunk: string;
  status: 'completed' | 'lead_captured' | 'transferred' | 'amd_filtered';
  sentiment: 'positive' | 'neutral' | 'negative';
  timestamp: string;
  transcriptSnippet: string;
}

export const INITIAL_PLATFORM_CLIENTS: PlatformClient[] = [
  {
    id: 'cl_1',
    name: 'Беляков Кирилл',
    companyName: 'Автошкола «Салют» (ООО «Салют-Драйв»)',
    unp: '193542109',
    niche: 'driving_school',
    city: 'Минск',
    phone: '+375 (29) 112-44-55',
    email: 'salut-drive@mail.by',
    balanceMinutes: 145.5,
    ratePerMinute: 0.35,
    spentMinutesTotal: 420.0,
    spentBynTotal: 147.0,
    sipProvider: 'mts',
    sipStatus: 'connected',
    isActive: true,
    createdAt: '2026-09-12',
    contractNumber: 'VOXI-26-09-12/1',
  },
  {
    id: 'cl_2',
    name: 'Дмитрий Ковалев',
    companyName: 'СТО «Минск-Авто Сервис»',
    unp: '192874112',
    niche: 'auto_service',
    city: 'Минск',
    phone: '+375 (44) 789-22-11',
    email: 'info@minsk-auto.by',
    balanceMinutes: 82.0,
    ratePerMinute: 0.40,
    spentMinutesTotal: 310.5,
    spentBynTotal: 124.2,
    sipProvider: 'a1',
    sipStatus: 'connected',
    isActive: true,
    createdAt: '2026-09-28',
    contractNumber: 'VOXI-26-09-28/3',
  },
  {
    id: 'cl_3',
    name: 'Елена Васильева',
    companyName: 'Медицинский центр «ДентаМед Люкс»',
    unp: '191004889',
    niche: 'medical_clinic',
    city: 'Минск',
    phone: '+375 (17) 345-90-00',
    email: 'reception@dentamed.by',
    balanceMinutes: 320.0,
    ratePerMinute: 0.45,
    spentMinutesTotal: 1150.0,
    spentBynTotal: 517.5,
    sipProvider: 'beltelecom',
    sipStatus: 'connected',
    isActive: true,
    createdAt: '2026-08-15',
    contractNumber: 'VOXI-26-08-15/2',
  },
  {
    id: 'cl_4',
    name: 'Анна Новикова',
    companyName: 'Салон красоты «Эстетика VIP»',
    unp: '193771203',
    niche: 'beauty_salon',
    city: 'Брест',
    phone: '+375 (29) 555-88-22',
    email: 'brest-beauty@estetika.by',
    balanceMinutes: 18.0,
    ratePerMinute: 0.45,
    spentMinutesTotal: 94.0,
    spentBynTotal: 42.3,
    sipProvider: 'a1',
    sipStatus: 'warning',
    isActive: true,
    createdAt: '2026-10-10',
    contractNumber: 'VOXI-26-10-10/4',
  },
];

export const INITIAL_TRANSACTIONS: PlatformTransaction[] = [
  {
    id: 'tx_101',
    clientId: 'cl_3',
    clientName: 'Медицинский центр «ДентаМед Люкс»',
    unp: '191004889',
    amountByn: 250.0,
    minutesAdded: 555,
    paymentMethod: 'bank_transfer_act',
    status: 'successful',
    invoiceNumber: 'СЧ-2026/11-04',
    createdAt: '2026-11-04 14:20',
    actGenerated: true,
  },
  {
    id: 'tx_102',
    clientId: 'cl_1',
    clientName: 'Автошкола «Салют»',
    unp: '193542109',
    amountByn: 105.0,
    minutesAdded: 300,
    paymentMethod: 'erip',
    status: 'successful',
    invoiceNumber: 'EP-98214',
    createdAt: '2026-11-03 09:45',
    actGenerated: true,
  },
  {
    id: 'tx_103',
    clientId: 'cl_2',
    clientName: 'СТО «Минск-Авто Сервис»',
    unp: '192874112',
    amountByn: 80.0,
    minutesAdded: 200,
    paymentMethod: 'bepaid_card',
    status: 'successful',
    invoiceNumber: 'BP-449102',
    createdAt: '2026-11-01 18:12',
    actGenerated: true,
  },
];

export const INITIAL_TELEPHONY_LOGS: PlatformTelephonyLog[] = [
  {
    id: 'tel_1',
    clientId: 'cl_1',
    companyName: 'Автошкола «Салют»',
    callerPhone: '+375 (29) 612-34-56',
    assistantVoice: 'anna',
    durationSeconds: 142,
    costByn: 0.83,
    sipTrunk: 'sip.mts.by:5060',
    status: 'lead_captured',
    sentiment: 'positive',
    timestamp: '17:48:10',
    transcriptSnippet: 'Клиент записался на категорию В на Тимирязева, 65 на 18:30 субботы.',
  },
  {
    id: 'tel_2',
    clientId: 'cl_3',
    companyName: 'МЦ «ДентаМед Люкс»',
    callerPhone: '+375 (33) 981-22-33',
    assistantVoice: 'anna',
    durationSeconds: 95,
    costByn: 0.71,
    sipTrunk: 'sip.beltelecom.by:5060',
    status: 'lead_captured',
    sentiment: 'positive',
    timestamp: '17:35:04',
    transcriptSnippet: 'Запись на консультацию ортодонта, подтверждено через SMS-визитку.',
  },
  {
    id: 'tel_3',
    clientId: 'cl_2',
    companyName: 'СТО «Минск-Авто»',
    callerPhone: '+375 (44) 700-11-22',
    assistantVoice: 'maxim',
    durationSeconds: 68,
    costByn: 0.45,
    sipTrunk: 'sip.a1.by:5060',
    status: 'transferred',
    sentiment: 'neutral',
    timestamp: '17:12:55',
    transcriptSnippet: 'Сложный вопрос по ремонту АКПП Volvo — выполнен теплый перевод на мастера.',
  },
  {
    id: 'tel_4',
    clientId: 'cl_4',
    companyName: 'Салон «Эстетика VIP»',
    callerPhone: '+375 (29) 222-33-44',
    assistantVoice: 'anna',
    durationSeconds: 8,
    costByn: 0.0,
    sipTrunk: 'sip.a1.by:5060',
    status: 'amd_filtered',
    sentiment: 'neutral',
    timestamp: '16:50:12',
    transcriptSnippet: 'Голосовая почта оператора А1 («Абонент временно недоступен») отфильтрована AMD, баланс сохранен.',
  },
];
