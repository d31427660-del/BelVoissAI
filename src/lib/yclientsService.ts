import { BusinessNiche, YclientsSlotConfig } from '../types';

export interface YclientsStaffMember {
  id: number;
  name: string;
  specialization: string;
  rating: number;
}

export interface YclientsSlot {
  time: string;
  staffId: number;
  staffName: string;
  isAvailable: boolean;
}

export interface YclientsBookingResult {
  success: boolean;
  recordId: number;
  bookingCode: string;
  staffName: string;
  date: string;
  time: string;
  service: string;
  message: string;
}

export const DEFAULT_YCLIENTS_CONFIG: YclientsSlotConfig = {
  isEnabled: true,
  companyId: '849201',
  partnerToken: '',
  platform: 'yclients',
  autoBookSlots: true,
  notifyClientSms: true,
  selectedStaff: 'all'
};

export const NICHE_STAFF: Record<BusinessNiche, YclientsStaffMember[]> = {
  auto_service: [
    { id: 101, name: 'Павел Станкевич', specialization: 'Старший мастер-приёмщик (Бокс №1)', rating: 4.9 },
    { id: 102, name: 'Андрей Ковалёнок', specialization: 'Диагност / Слесарный цех (Бокс №2)', rating: 4.8 },
    { id: 103, name: 'Сергей Морозов', specialization: 'Мастер шиномонтажа и развала', rating: 4.9 },
  ],
  beauty_salon: [
    { id: 201, name: 'Алина Романовская', specialization: 'Топ-стилист / Сложное окрашивание', rating: 5.0 },
    { id: 202, name: 'Дарья Лукашевич', specialization: 'Мастер ногтевого сервиса', rating: 4.9 },
    { id: 203, name: 'Елена Жданович', specialization: 'Косметолог-эстетист', rating: 4.9 },
  ],
  driving_school: [
    { id: 301, name: 'Александр Богданович', specialization: 'Инструктор кат. B (МКПП, VW Polo)', rating: 4.9 },
    { id: 302, name: 'Павел Романов', specialization: 'Инструктор кат. B (АКПП, Renault)', rating: 5.0 },
  ],
  medical_clinic: [
    { id: 401, name: 'Д-р Лукашевич Д.В.', specialization: 'Стоматолог-хирург / Имплантолог', rating: 5.0 },
    { id: 402, name: 'Д-р Жданович Е.В.', specialization: 'Стоматолог-терапевт высшей кат.', rating: 4.9 },
  ],
  custom: [
    { id: 501, name: 'Дежурный специалист', specialization: 'Первая линия обслуживания', rating: 4.8 }
  ]
};

export class YclientsService {
  /**
   * Получить список специалистов для выбранной ниши
   */
  static getStaffList(niche: BusinessNiche): YclientsStaffMember[] {
    return NICHE_STAFF[niche] || NICHE_STAFF.custom;
  }

  /**
   * Запросить свободные окна (слоты) через YCLIENTS API на выбранную дату
   */
  static async fetchAvailableSlots(
    niche: BusinessNiche,
    dateStr: string = 'завтра',
    staffId?: number
  ): Promise<YclientsSlot[]> {
    // Симуляция обращения к API YCLIENTS (GET /api/v1/book_times/{company_id})
    await new Promise((resolve) => setTimeout(resolve, 350));

    const staffList = this.getStaffList(niche);
    const targetStaff = staffId ? staffList.filter((s) => s.id === staffId) : staffList;

    const baseTimes = ['09:30', '11:00', '14:30', '16:00', '18:30', '19:15'];
    const slots: YclientsSlot[] = [];

    targetStaff.forEach((staff, idx) => {
      // Генерируем 2-3 свободных слота для каждого специалиста
      const availableIndices = idx % 2 === 0 ? [1, 4, 5] : [0, 2, 4];
      baseTimes.forEach((time, tIdx) => {
        slots.push({
          time,
          staffId: staff.id,
          staffName: staff.name,
          isAvailable: availableIndices.includes(tIdx)
        });
      });
    });

    return slots;
  }

  /**
   * Создать бронь слота в расписании (POST /api/v1/book_record/{company_id})
   */
  static async bookSlot(
    clientName: string,
    phone: string,
    serviceName: string,
    date: string,
    time: string,
    staffName: string
  ): Promise<YclientsBookingResult> {
    await new Promise((resolve) => setTimeout(resolve, 400));

    const recordId = Math.floor(100000 + Math.random() * 900000);
    const bookingCode = `YC-${Math.floor(1000 + Math.random() * 9000)}`;

    return {
      success: true,
      recordId,
      bookingCode,
      staffName,
      date,
      time,
      service: serviceName,
      message: `Запись успешно создана в календаре (Код: ${bookingCode}). Клиенту ${clientName} отправлено SMS с подтверждением.`
    };
  }

  /**
   * Сформировать директиву для системного промпта LLM
   */
  static getPromptInstruction(config: YclientsSlotConfig, niche: BusinessNiche, voice?: string): string {
    if (!config.isEnabled) return '';

    const staff = this.getStaffList(niche).map((s) => `${s.name} (${s.specialization})`).join(', ');
    const isMaleVoice = voice === 'dmitry' || voice === 'maxim';
    const bookedVerb = isMaleVoice ? 'записал вас' : 'записала вас';

    return `\nИНТЕГРАЦИЯ СО СЛОТАМИ ОНЛАЙН-РАСПИСАНИЯ (${config.platform.toUpperCase()} API):
- Твоя система синхронизирована с базой слотов ${config.platform.toUpperCase()} (ID компании: ${config.companyId}).
- Специалисты в графике: ${staff}.
- Когда клиент хочет записаться, сначала уточни желаемую дату или половину дня (утро, день, вечер).
- Предложи 2 конкретных свободных слота (например, 11:30 или 18:30) и спроси, какое время забронировать.
- После выбора подтверди запись по шаблону: "Отлично, ${bookedVerb} на [ДАТА] в [ВРЕМЯ] к [СПЕЦИАЛИСТ]. Детали брони отправлены вам по SMS."`;
  }
}
