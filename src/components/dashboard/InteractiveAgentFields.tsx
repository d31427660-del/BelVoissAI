import React, { useState, useEffect } from 'react';
import {
  MapPointIcon as MapPin,
  ClockCircleIcon as ClockIcon,
  CloseCircleIcon as CloseCircle,
  PlayIcon as Play,
  PauseIcon as Pause,
  CheckCircleIcon as CheckCircle2,
  WalletMoneyIcon as Wallet
} from '@solar-icons/react/bold-duotone';
import { BusinessNiche, VoiceId } from '../../types';
import { VoiceSimulator } from '../../lib/speechSynth';
import { FieldLabel, FieldHint, AutoGrowTextarea } from './FieldHelp';

/* ============================================================================
 * 1. BELARUS PHONE INPUT (+375 operator pills + live formatting)
 * ========================================================================== */

const BY_OPERATORS = [
  { code: '29', label: '29 (А1/МТС)' },
  { code: '44', label: '44 (А1)' },
  { code: '33', label: '33 (МТС)' },
  { code: '25', label: '25 (life)' },
  { code: '17', label: '17 (Минск)' }
];

export function formatBelarusPhone(raw: string, forcedCode?: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('80') && digits.length >= 4) {
    digits = '375' + digits.slice(2);
  } else if (!digits.startsWith('375') && digits.length > 0) {
    if (['29', '33', '44', '25', '17', '15', '16', '21', '22', '23'].some((c) => digits.startsWith(c))) {
      digits = '375' + digits;
    } else {
      digits = '375' + digits;
    }
  }
  const rest = digits.startsWith('375') ? digits.slice(3, 12) : digits.slice(0, 9);
  const opCode = forcedCode || rest.slice(0, 2);
  const sub = forcedCode ? rest.slice(Math.min(2, rest.length)) : rest.slice(2);

  let formatted = '+375';
  if (opCode.length > 0) {
    formatted += ` (${opCode}`;
    if (opCode.length === 2) formatted += ')';
  }
  if (sub.length > 0) {
    formatted += ` ${sub.slice(0, 3)}`;
  }
  if (sub.length > 3) {
    formatted += `-${sub.slice(3, 5)}`;
  }
  if (sub.length > 5) {
    formatted += `-${sub.slice(5, 7)}`;
  }
  return formatted;
}

interface BelarusPhoneInputProps {
  id: string;
  value: string;
  onChange: (next: string) => void;
}

export const BelarusPhoneInput: React.FC<BelarusPhoneInputProps> = ({ id, value, onChange }) => {
  const digits = value.replace(/\D/g, '');
  const currentCode = digits.startsWith('375') ? digits.slice(3, 5) : '';

  const handleSelectOperator = (code: string) => {
    onChange(formatBelarusPhone(value || '+375 (29) ', code));
  };

  return (
    <div>
      <FieldLabel
        htmlFor={id}
        label="Телефон сотрудника для перевода"
        helpTitle="Зачем нужен телефон сотрудника"
        helpText="Выберите код оператора кнопкой или просто введите номер: цифры отформатируются сами. На этот номер бот переключит клиента, если нужен живой разговор."
        helpExample="+375 (29) 112-44-55"
      />

      {/* Quick Operator Pills (Comfortable Mobile Touch Targets) */}
      <div className="flex flex-wrap items-center gap-1.5 mb-2" role="group" aria-label="Код оператора Беларуси">
        {BY_OPERATORS.map((op) => {
          const active = currentCode === op.code;
          return (
            <button
              key={op.code}
              type="button"
              aria-pressed={active}
              onClick={() => handleSelectOperator(op.code)}
              className={`px-3 py-1.5 min-h-[34px] rounded-lg text-xs font-semibold transition-all border ${
                active
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                  : 'bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border-slate-200'
              }`}
            >
              +{op.code}
            </button>
          );
        })}
      </div>

      <input
        id={id}
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        aria-describedby={`${id}-hint`}
        value={value}
        onChange={(e) => onChange(formatBelarusPhone(e.target.value))}
        placeholder="+375 (29) 112-44-55"
        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600"
      />
      <FieldHint id={`${id}-hint`}>
        Выберите код кнопкой или введите цифры — формат +375 подставится автоматически.
      </FieldHint>
    </div>
  );
};

/* ============================================================================
 * 2. INTERACTIVE ADDRESS & LANDMARK BUILDER (City + Street + Metro + Tags)
 * ========================================================================== */

const BY_CITIES = ['Минск', 'Брест', 'Гродно', 'Гомель', 'Витебск', 'Могилёв', 'Бобруйск', 'Барановичи', 'Борисов'];

const MINSK_METRO_STATIONS = [
  'Каменная Горка',
  'Кунцевщина',
  'Спортивная',
  'Пушкинская',
  'Молодёжная',
  'Фрунзенская',
  'Немига',
  'Октябрьская / Купаловская',
  'Академия Наук',
  'Парк Челюскинцев',
  'Московская',
  'Восток',
  'Уручье',
  'Площадь Якуба Коласа',
  'Площадь Победы',
  'Площадь Ленина / Вокзальная',
  'Институт Культуры',
  'Грушевка',
  'Михалово',
  'Петровщина',
  'Малиновка',
  'Первомайская',
  'Партизанская',
  'Автозаводская',
  'Могилёвская',
  'Аэродромная',
  'Слуцкий Гостинец'
];

const LANDMARK_TAGS = [
  'Бесплатная парковка',
  'Рядом с метро',
  'Отдельный вход',
  '1 этаж',
  'Удобный выезд на МКАД'
];

function parseAddressParts(rawAddress: string) {
  let street = rawAddress || '';
  let metro = '';
  const selectedTags: string[] = [];

  // Extract metro if present like ст.м. Каменная Горка or м. Академия Наук
  const metroMatch = street.match(/(?:ст\.?\s*м\.?|метро)\s*([А-Яа-яЁё\s/-]+?)(?=[,);]|$)/i);
  if (metroMatch) {
    const found = metroMatch[1].trim();
    const matchedStation = MINSK_METRO_STATIONS.find((s) =>
      s.toLowerCase().includes(found.toLowerCase()) || found.toLowerCase().includes(s.toLowerCase())
    );
    metro = matchedStation || found;
  }

  for (const tag of LANDMARK_TAGS) {
    if (street.toLowerCase().includes(tag.toLowerCase())) {
      selectedTags.push(tag);
    }
  }

  // Strip trailing parenthetical landmark block if we generated/parsed one
  street = street
    .replace(/\s*\([^)]*\)\s*$/, '')
    .replace(/^(?:г\.?\s*)?[А-Яа-яЁё-]+\s*,\s*/i, '')
    .trim();

  return { street, metro, selectedTags };
}

function buildFullAddress(city: string, street: string, metro: string, tags: string[]): string {
  let cleanStreet = street.trim();
  if (city) {
    cleanStreet = cleanStreet.replace(new RegExp(`^(?:г\\.?\\s*)?${city}[,\\s]*`, 'i'), '').trim();
  }
  const extras: string[] = [];
  if (city === 'Минск' && metro) {
    extras.push(`ст.м. ${metro}`);
  }
  for (const t of tags) {
    if (!(t === 'Рядом с метро' && metro)) {
      extras.push(t.toLowerCase());
    }
  }
  const base = cleanStreet ? `г. ${city}, ${cleanStreet}` : `г. ${city}`;
  return extras.length > 0 ? `${base} (${extras.join(', ')})` : base;
}

interface InteractiveAddressBuilderProps {
  city: string;
  address: string;
  syncKey: string;
  onChange: (nextCity: string, nextAddress: string) => void;
}

export const InteractiveAddressBuilder: React.FC<InteractiveAddressBuilderProps> = ({
  city,
  address,
  syncKey,
  onChange
}) => {
  const initial = parseAddressParts(address);
  const [localCity, setLocalCity] = useState(city || 'Минск');
  const [street, setStreet] = useState(initial.street);
  const [metro, setMetro] = useState(initial.metro);
  const [tags, setTags] = useState<string[]>(initial.selectedTags);

  useEffect(() => {
    const parsed = parseAddressParts(address);
    setLocalCity(city || 'Минск');
    setStreet(parsed.street);
    setMetro(parsed.metro);
    setTags(parsed.selectedTags);
    // Re-sync only when niche template or external agent changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncKey]);

  const emitChange = (nextCity: string, nextStreet: string, nextMetro: string, nextTags: string[]) => {
    setLocalCity(nextCity);
    setStreet(nextStreet);
    setMetro(nextMetro);
    setTags(nextTags);
    onChange(nextCity, buildFullAddress(nextCity, nextStreet, nextMetro, nextTags));
  };

  const toggleTag = (tag: string) => {
    const nextTags = tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag];
    emitChange(localCity, street, metro, nextTags);
  };

  const previewAddress = buildFullAddress(localCity, street, metro, tags);

  return (
    <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-3">
      <FieldLabel
        htmlFor="agent-street-input"
        label="Адрес и удобный ориентир"
        helpTitle="Как заполнить адрес в пару кликов"
        helpText="Выберите город, впишите только улицу и дом, а станцию метро и особенности входа/парковки отметьте кнопками ниже — бот сам соберёт красивую подсказку маршрута для клиента."
        helpExample="г. Минск, ул. Лобанка, 24 (ст.м. Каменная Горка, бесплатная парковка)"
      />

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
        <div className="sm:col-span-4">
          <label htmlFor="agent-city-select" className="block text-[11px] font-medium text-slate-600 mb-1">
            Город
          </label>
          <select
            id="agent-city-select"
            name="city"
            autoComplete="address-level2"
            value={localCity}
            onChange={(e) => emitChange(e.target.value, street, e.target.value === 'Минск' ? metro : '', tags)}
            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
          >
            {BY_CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className={localCity === 'Минск' ? 'sm:col-span-4' : 'sm:col-span-8'}>
          <label htmlFor="agent-street-input" className="block text-[11px] font-medium text-slate-600 mb-1">
            Улица и номер дома
          </label>
          <input
            id="agent-street-input"
            name="streetAddress"
            type="text"
            autoComplete="address-line1"
            aria-describedby="agent-address-builder-hint"
            value={street}
            onChange={(e) => emitChange(localCity, e.target.value, metro, tags)}
            placeholder="ул. Лобанка, 24"
            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
          />
        </div>

        {localCity === 'Минск' && (
          <div className="sm:col-span-4">
            <label htmlFor="agent-metro-select" className="block text-[11px] font-medium text-slate-600 mb-1">
              Станция метро рядом
            </label>
            <select
              id="agent-metro-select"
              name="metroStation"
              value={metro}
              onChange={(e) => emitChange(localCity, street, e.target.value, tags)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
            >
              <option value="">Без метро</option>
              {MINSK_METRO_STATIONS.map((st) => (
                <option key={st} value={st}>
                  м. {st}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Landmark Chips */}
      <div className="space-y-1.5">
        <span className="block text-[11px] font-medium text-slate-600">
          Быстрые подсказки для клиента (нажмите, чтобы добавить):
        </span>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Ориентиры рядом с адресом">
          {LANDMARK_TAGS.map((tag) => {
            const active = tags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                aria-pressed={active}
                onClick={() => toggleTag(tag)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                  active
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-700 border-slate-200'
                }`}
              >
                {active ? `✓ ${tag}` : `+ ${tag}`}
              </button>
            );
          })}
        </div>
      </div>

      <div
        id="agent-address-builder-hint"
        className="px-3 py-2 rounded-lg bg-white border border-slate-200/80 text-[11px] text-slate-600 flex items-start gap-2"
      >
        <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
        <span className="leading-relaxed break-words">
          Бот скажет клиенту: <strong className="text-slate-900">{previewAddress}</strong>
        </span>
      </div>
    </div>
  );
};

/* ============================================================================
 * 3. INTERACTIVE WORKING HOURS BUILDER (Day pills + Time selects + Presets)
 * ========================================================================== */

const WEEKDAYS = [
  { id: 0, short: 'Пн' },
  { id: 1, short: 'Вт' },
  { id: 2, short: 'Ср' },
  { id: 3, short: 'Чт' },
  { id: 4, short: 'Пт' },
  { id: 5, short: 'Сб' },
  { id: 6, short: 'Вс' }
];

const TIME_SLOTS = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
  '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '23:00'
];

function getTimeSlotOptions(currentVal?: string): string[] {
  if (currentVal && !TIME_SLOTS.includes(currentVal)) {
    return Array.from(new Set([...TIME_SLOTS, currentVal])).sort();
  }
  return TIME_SLOTS;
}

interface ScheduleState {
  is24x7: boolean;
  activeDays: number[];
  openTime: string;
  closeTime: string;
  customWeekendHours: boolean;
  weekendOpen: string;
  weekendClose: string;
  noLunchBreak: boolean;
}

function parseSchedule(raw: string): ScheduleState {
  const lower = (raw || '').toLowerCase();
  if (lower.includes('круглосуточ') || lower.includes('24/7')) {
    return {
      is24x7: true,
      activeDays: [0, 1, 2, 3, 4, 5, 6],
      openTime: '09:00',
      closeTime: '20:00',
      customWeekendHours: false,
      weekendOpen: '10:00',
      weekendClose: '16:00',
      noLunchBreak: true
    };
  }

  const rawMatches = raw.match(/\b\d{1,2}:\d{2}\b/g) || [];
  const times = rawMatches.map((t) => t.padStart(5, '0'));
  const openTime = times[0] || '09:00';
  const closeTime = times[1] || '20:00';
  const hasSecondRange = times.length >= 4;
  const weekendOpen = hasSecondRange ? times[2] : '10:00';
  const weekendClose = hasSecondRange ? times[3] : '16:00';

  let activeDays = [0, 1, 2, 3, 4, 5];
  if (lower.includes('ежедневн') || (lower.includes('пн-сб') && lower.includes('вс:') && !lower.includes('вс: выходн'))) {
    activeDays = [0, 1, 2, 3, 4, 5, 6];
  } else if (lower.includes('пн-пт') && !lower.includes('сб:')) {
    activeDays = [0, 1, 2, 3, 4];
  } else if (lower.includes('вс: выходн') || lower.includes('вс — выходн')) {
    activeDays = [0, 1, 2, 3, 4, 5];
  }

  return {
    is24x7: false,
    activeDays,
    openTime,
    closeTime,
    customWeekendHours: hasSecondRange,
    weekendOpen,
    weekendClose,
    noLunchBreak: lower.includes('без обеда')
  };
}

function formatDayGroup(days: number[]): string {
  if (days.length === 7) return 'Ежедневно';
  if (days.length === 0) return 'По предварительной записи';
  const sorted = [...days].sort((a, b) => a - b);
  // Check contiguous range
  const isContiguous = sorted.every((d, idx) => idx === 0 || d === sorted[idx - 1] + 1);
  if (isContiguous && sorted.length >= 3) {
    return `${WEEKDAYS[sorted[0]].short}–${WEEKDAYS[sorted[sorted.length - 1]].short}`;
  }
  return sorted.map((d) => WEEKDAYS[d].short).join(', ');
}

function serializeSchedule(st: ScheduleState): string {
  if (st.is24x7) return 'Круглосуточно 24/7 без выходных';
  if (st.activeDays.length === 0) return 'По предварительной записи';

  const weekdaysActive = st.activeDays.filter((d) => d <= 4);
  const weekendActive = st.activeDays.filter((d) => d >= 5);
  const offDays = WEEKDAYS.filter((w) => !st.activeDays.includes(w.id)).map((w) => w.short);

  const parts: string[] = [];
  if (st.customWeekendHours && weekendActive.length > 0 && weekdaysActive.length > 0) {
    parts.push(`${formatDayGroup(weekdaysActive)}: ${st.openTime}–${st.closeTime}`);
    parts.push(`${formatDayGroup(weekendActive)}: ${st.weekendOpen}–${st.weekendClose}`);
  } else {
    parts.push(`${formatDayGroup(st.activeDays)}: ${st.openTime}–${st.closeTime}`);
  }

  if (offDays.length > 0 && offDays.length < 7) {
    parts.push(`${offDays.join(', ')}: выходной`);
  }
  if (st.noLunchBreak) {
    parts.push('без обеда');
  }
  return parts.join(', ');
}

interface InteractiveScheduleBuilderProps {
  value: string;
  syncKey: string;
  onChange: (next: string) => void;
}

export const InteractiveScheduleBuilder: React.FC<InteractiveScheduleBuilderProps> = ({
  value,
  syncKey,
  onChange
}) => {
  const [sched, setSched] = useState<ScheduleState>(() => parseSchedule(value));

  useEffect(() => {
    setSched(parseSchedule(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncKey]);

  const update = (patch: Partial<ScheduleState>) => {
    const next = { ...sched, ...patch };
    setSched(next);
    onChange(serializeSchedule(next));
  };

  const toggleDay = (dayId: number) => {
    const exists = sched.activeDays.includes(dayId);
    const nextDays = exists
      ? sched.activeDays.filter((d) => d !== dayId)
      : [...sched.activeDays, dayId].sort((a, b) => a - b);
    update({ is24x7: false, activeDays: nextDays });
  };

  const applyPreset = (preset: 'weekdays_sat' | 'office' | 'daily' | '24x7') => {
    if (preset === '24x7') {
      update({ is24x7: true, activeDays: [0, 1, 2, 3, 4, 5, 6] });
    } else if (preset === 'daily') {
      update({
        is24x7: false,
        activeDays: [0, 1, 2, 3, 4, 5, 6],
        openTime: '09:00',
        closeTime: '21:00',
        customWeekendHours: false
      });
    } else if (preset === 'office') {
      update({
        is24x7: false,
        activeDays: [0, 1, 2, 3, 4],
        openTime: '09:00',
        closeTime: '18:00',
        customWeekendHours: false
      });
    } else {
      update({
        is24x7: false,
        activeDays: [0, 1, 2, 3, 4, 5],
        openTime: '09:00',
        closeTime: '20:00',
        customWeekendHours: true,
        weekendOpen: '10:00',
        weekendClose: '16:00'
      });
    }
  };

  const previewText = serializeSchedule(sched);

  return (
    <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-3">
      <FieldLabel
        htmlFor="schedule-open-time"
        label="График работы"
        helpTitle="Как настроить рабочие дни и часы"
        helpText="Отметьте рабочие дни недели синими кнопками и выберите время открытия и закрытия. Бот будет знать, когда вы открыты, и не запишет клиента на выходной день."
        helpExample="Пн–Пт: 09:00–20:00, Сб: 10:00–16:00, Вс: выходной"
      />

      {/* Quick Presets */}
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Быстрые шаблоны графика">
        {[
          { id: 'weekdays_sat' as const, label: 'Будни + Сб' },
          { id: 'daily' as const, label: 'Без выходных' },
          { id: 'office' as const, label: 'Только Пн–Пт' },
          { id: '24x7' as const, label: 'Круглосуточно 24/7' }
        ].map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => applyPreset(p.id)}
            className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 text-[11px] font-medium transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Day Pills */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5" role="group" aria-label="Рабочие дни недели">
        {WEEKDAYS.map((day) => {
          const isWorking = sched.is24x7 || sched.activeDays.includes(day.id);
          return (
            <button
              key={day.id}
              type="button"
              aria-pressed={isWorking}
              onClick={() => toggleDay(day.id)}
              className={`px-1 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold border transition-all flex flex-col items-center justify-center ${
                isWorking
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                  : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
              }`}
            >
              <span>{day.short}</span>
              <span className={`text-[9px] font-normal ${isWorking ? 'text-blue-100' : 'text-slate-400'}`}>
                {isWorking ? 'раб.' : 'вых.'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Time Selectors */}
      {!sched.is24x7 && (
        <div className="space-y-2.5 pt-0.5">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-600 font-medium min-w-[110px]">Основное время:</span>
            <label htmlFor="schedule-open-time" className="text-slate-500">
              с
            </label>
            <select
              id="schedule-open-time"
              value={sched.openTime}
              onChange={(e) => update({ openTime: e.target.value })}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600"
            >
              {getTimeSlotOptions(sched.openTime).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <label htmlFor="schedule-close-time" className="text-slate-500">
              до
            </label>
            <select
              id="schedule-close-time"
              value={sched.closeTime}
              onChange={(e) => update({ closeTime: e.target.value })}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600"
            >
              {getTimeSlotOptions(sched.closeTime).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <button
              type="button"
              aria-pressed={sched.noLunchBreak}
              onClick={() => update({ noLunchBreak: !sched.noLunchBreak })}
              className={`sm:ml-auto px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                sched.noLunchBreak
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {sched.noLunchBreak ? '✓ Без обеда' : '+ Без обеда'}
            </button>
          </div>

          {sched.activeDays.some((d) => d >= 5) && sched.activeDays.some((d) => d <= 4) && (
            <div className="space-y-2">
              <label htmlFor="schedule-weekend-toggle" className="inline-flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input
                  id="schedule-weekend-toggle"
                  type="checkbox"
                  checked={sched.customWeekendHours}
                  onChange={(e) => update({ customWeekendHours: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 accent-blue-600"
                />
                <span>Сокращённый день в субботу / воскресенье</span>
              </label>

              {sched.customWeekendHours && (
                <div className="flex flex-wrap items-center gap-2 text-xs pl-6">
                  <span className="text-slate-600 font-medium">В выходные:</span>
                  <label htmlFor="schedule-weekend-open" className="text-slate-500">
                    с
                  </label>
                  <select
                    id="schedule-weekend-open"
                    value={sched.weekendOpen}
                    onChange={(e) => update({ weekendOpen: e.target.value })}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    {getTimeSlotOptions(sched.weekendOpen).map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <label htmlFor="schedule-weekend-close" className="text-slate-500">
                    до
                  </label>
                  <select
                    id="schedule-weekend-close"
                    value={sched.weekendClose}
                    onChange={(e) => update({ weekendClose: e.target.value })}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    {getTimeSlotOptions(sched.weekendClose).map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="px-3 py-2 rounded-lg bg-white border border-slate-200/80 text-[11px] text-slate-600 flex items-start gap-2">
        <ClockIcon className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
        <span className="leading-relaxed break-words">
          Итоговый график: <strong className="text-slate-900">{previewText}</strong>
        </span>
      </div>
    </div>
  );
};

/* ============================================================================
 * 4. INTERACTIVE GREETING BUILDER (Templates + Auto Company Sync + Play Audio)
 * ========================================================================== */

function buildGreetingTemplate(
  style: 'friendly' | 'booking' | 'niche',
  companyName: string,
  voice: VoiceId,
  niche: BusinessNiche
): string {
  const cleanCompany = companyName.trim() || 'наша компания';
  const speakerName = voice === 'maxim' ? 'Максим' : 'Анна';
  const autoServiceRole = voice === 'maxim' ? 'мастер-приёмщик' : 'мастер';

  if (style === 'friendly') {
    return `Здравствуйте! ${cleanCompany}, меня зовут ${speakerName}. Чем могу вам помочь?`;
  }
  if (style === 'booking') {
    return `Добрый день! ${cleanCompany}, голосовой помощник ${speakerName}. Подсказать стоимость услуг или записать вас на удобное время?`;
  }

  switch (niche) {
    case 'driving_school':
      return `Здравствуйте! ${cleanCompany}, меня зовут ${speakerName}. Подскажите, вас интересует обучение на категорию B или дополнительные уроки вождения?`;
    case 'auto_service':
      return `Добрый день! ${cleanCompany}, ${autoServiceRole} ${speakerName}. Подскажите, нужна диагностика или плановое обслуживание автомобиля?`;
    case 'medical_clinic':
      return `Здравствуйте! ${cleanCompany}, администратор ${speakerName}. Желаете записаться на приём к врачу или вас беспокоит острая боль?`;
    case 'beauty_salon':
      return `Здравствуйте! ${cleanCompany}, администратор ${speakerName}. На какую процедуру и в какой день вам удобно записаться?`;
    default:
      return `Здравствуйте! ${cleanCompany}, меня зовут ${speakerName}. Чем могу вам помочь?`;
  }
}

interface InteractiveGreetingBuilderProps {
  value: string;
  companyName: string;
  voice: VoiceId;
  niche: BusinessNiche;
  onChange: (next: string) => void;
}

export const InteractiveGreetingBuilder: React.FC<InteractiveGreetingBuilderProps> = ({
  value,
  companyName,
  voice,
  niche,
  onChange
}) => {
  const [activeStyle, setActiveStyle] = useState<'niche' | 'friendly' | 'booking' | 'custom'>('niche');
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    return () => {
      VoiceSimulator.stop();
    };
  }, []);

  const handleChooseStyle = (style: 'niche' | 'friendly' | 'booking') => {
    setActiveStyle(style);
    onChange(buildGreetingTemplate(style, companyName, voice, niche));
  };

  const handlePlayGreeting = () => {
    if (isPlaying) {
      VoiceSimulator.stop();
      setIsPlaying(false);
      return;
    }
    VoiceSimulator.stop();
    VoiceSimulator.speak(
      value || buildGreetingTemplate('friendly', companyName, voice, niche),
      voice,
      () => setIsPlaying(true),
      () => setIsPlaying(false)
    );
  };

  return (
    <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <FieldLabel
          htmlFor="agent-first-message"
          label="Первая фраза бота при ответе на звонок"
          helpTitle="Как работает конструктор приветствия"
          helpText="Выберите один из готовых стилей приветствия кнопкой — туда автоматически подставятся ваше название компании и имя выбранного голоса. Нажмите «Прослушать», чтобы сразу оценить звучание."
          helpExample="Здравствуйте! Автошкола «Все категории», меня зовут Анна. Чем могу вам помочь?"
        />
      </div>

      {/* Style Switcher Pills + Play Audio Button */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Варианты приветствия">
          {[
            { id: 'niche' as const, label: 'Под вашу сферу' },
            { id: 'friendly' as const, label: 'Короткое и тёплое' },
            { id: 'booking' as const, label: 'С предложением записи' }
          ].map((preset) => {
            const active = activeStyle === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                aria-pressed={active}
                onClick={() => handleChooseStyle(preset.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                  active
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-700 border-slate-200'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handlePlayGreeting}
          className="px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-semibold inline-flex items-center gap-1.5 transition-colors"
        >
          {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          <span>{isPlaying ? 'Стоп' : 'Прослушать'}</span>
        </button>
      </div>

      <AutoGrowTextarea
        id="agent-first-message"
        name="firstMessage"
        rows={1}
        aria-describedby="agent-greeting-hint"
        value={value}
        onChange={(e) => {
          setActiveStyle('custom');
          onChange(e.target.value);
        }}
        placeholder="Здравствуйте! Чем могу вам помочь?"
        className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 leading-relaxed focus:outline-none focus:border-blue-600"
      />
      <FieldHint id="agent-greeting-hint">
        Название компании и имя бота обновляются в этой фразе автоматически при их изменении.
      </FieldHint>
    </div>
  );
};

/* ============================================================================
 * 5. INTERACTIVE SERVICES & PRICING BUILDER (Structured Cards + Payment Chips)
 * ========================================================================== */

export interface ServiceRowItem {
  id: string;
  title: string;
  price: string;
  isFrom: boolean;
}

const PAYMENT_PERKS = [
  'Беспроцентная рассрочка',
  'Оплата через ЕРИП',
  'Карта Халва / Карта покупок',
  'Наличные и банковская карта',
  'Безналичный расчёт для юрлиц'
];

const NICHE_QUICK_SERVICES: Record<BusinessNiche, Array<{ title: string; price: string; isFrom: boolean }>> = {
  driving_school: [
    { title: 'Автодром ГАИ (доп. занятие 1.5 ч)', price: '50', isFrom: false },
    { title: 'Пересдача внутреннего экзамена', price: '0', isFrom: false },
    { title: 'Учебная категория B на автомате (АКПП)', price: '1150', isFrom: false }
  ],
  auto_service: [
    { title: 'Развал-схождение 3D', price: '55', isFrom: false },
    { title: 'Замена ремня ГРМ', price: '180', isFrom: true },
    { title: 'Экспресс-осмотр ходовой части', price: '30', isFrom: false }
  ],
  medical_clinic: [
    { title: 'Приём по острой боли в день обращения', price: '45', isFrom: true },
    { title: 'Отбеливание зубов Zoom / Amazing White', price: '420', isFrom: false },
    { title: 'Детский приём стоматолога', price: '55', isFrom: true }
  ],
  beauty_salon: [
    { title: 'Педикюр с покрытием гель-лак', price: '75', isFrom: false },
    { title: 'Ламинирование ресниц', price: '60', isFrom: false },
    { title: 'Уход и восстановление волос', price: '90', isFrom: true }
  ],
  custom: [
    { title: 'Первичная консультация специалиста', price: '0', isFrom: false },
    { title: 'Базовая услуга', price: '50', isFrom: true }
  ]
};

function parseServicesAndPerks(raw: string): { rows: ServiceRowItem[]; perks: string[] } {
  const lines = (raw || '')
    .split('\n')
    .map((l) => l.replace(/^\s*(?:\d+[.)]|[-•*])\s*/, '').trim())
    .filter(Boolean);

  const perks: string[] = [];
  const rows: ServiceRowItem[] = [];

  lines.forEach((line, idx) => {
    const lower = line.toLowerCase();
    // Check if line matches one of our payment perks or is a pure payment condition without BYN
    const matchedPerk = PAYMENT_PERKS.find(
      (p) => lower.includes(p.toLowerCase()) || (lower.includes('рассрочк') && p.includes('рассрочка'))
    );
    if (matchedPerk && !/\d+\s*(?:byn|руб)/i.test(line)) {
      if (!perks.includes(matchedPerk)) perks.push(matchedPerk);
      return;
    }

    // Extract price near BYN or руб./рублей if present
    const bynMatch = line.match(/^(.*?)[:—–-]\s*(от\s*)?(\d+(?:\s*[–-]\s*\d+)?)\s*(?:BYN|руб(?:лей|\.|\b))(.*)$/i);
    if (bynMatch) {
      const cleanTitle = bynMatch[1].trim();
      const extraTail = bynMatch[4]?.replace(/^[.,;\s]+|[.]+$/g, '').trim();
      rows.push({
        id: `srv-${idx}-${Date.now()}`,
        title: extraTail ? `${cleanTitle} (${extraTail})` : cleanTitle,
        price: bynMatch[3].replace(/\s+/g, ''),
        isFrom: Boolean(bynMatch[2])
      });
    } else {
      const anyPrice = line.match(/(от\s*)?(\d+)\s*(?:BYN|руб(?:лей|\.|\b))/i);
      const cleanedTitle = line
        .replace(/(?:[:—–-]\s*)?(?:от\s*)?\d+\s*(?:BYN|руб(?:лей|\.|\b))\.?/gi, '')
        .replace(/[.]+$/, '')
        .trim();
      rows.push({
        id: `srv-${idx}-${Date.now()}`,
        title: cleanedTitle || line,
        price: anyPrice ? anyPrice[2] : '',
        isFrom: Boolean(anyPrice?.[1])
      });
    }
  });

  if (rows.length === 0) {
    rows.push({ id: `srv-default-1`, title: '', price: '', isFrom: false });
  }

  return { rows, perks };
}

function serializeServicesAndPerks(rows: ServiceRowItem[], perks: string[]): string {
  const validRows = rows.filter((r) => r.title.trim().length > 0 || r.price.trim().length > 0);
  const serviceLines = validRows.map((r, idx) => {
    const title = r.title.trim() || `Услуга ${idx + 1}`;
    const cleanPrice = r.price.trim();
    if (!cleanPrice) return `${idx + 1}. ${title}.`;
    if (cleanPrice === '0') return `${idx + 1}. ${title}: бесплатно (0 BYN).`;
    return `${idx + 1}. ${title}: ${r.isFrom ? 'от ' : ''}${cleanPrice} BYN.`;
  });

  const perkLines =
    perks.length > 0 ? [`Условия оплаты: ${perks.join(', ')}.`] : [];

  return [...serviceLines, ...perkLines].join('\n');
}

interface InteractiveServicesBuilderProps {
  value: string;
  niche: BusinessNiche;
  syncKey: string;
  onChange: (next: string) => void;
}

export const InteractiveServicesBuilder: React.FC<InteractiveServicesBuilderProps> = ({
  value,
  niche,
  syncKey,
  onChange
}) => {
  const initial = parseServicesAndPerks(value);
  const [rows, setRows] = useState<ServiceRowItem[]>(initial.rows);
  const [perks, setPerks] = useState<string[]>(initial.perks);

  useEffect(() => {
    const parsed = parseServicesAndPerks(value);
    setRows(parsed.rows);
    setPerks(parsed.perks);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncKey]);

  const commit = (nextRows: ServiceRowItem[], nextPerks: string[]) => {
    setRows(nextRows);
    setPerks(nextPerks);
    onChange(serializeServicesAndPerks(nextRows, nextPerks));
  };

  const updateRow = (id: string, patch: Partial<ServiceRowItem>) => {
    const nextRows = rows.map((r) => (r.id === id ? { ...r, ...patch } : r));
    commit(nextRows, perks);
  };

  const removeRow = (id: string) => {
    const nextRows = rows.length > 1 ? rows.filter((r) => r.id !== id) : [{ id: `srv-empty`, title: '', price: '', isFrom: false }];
    commit(nextRows, perks);
  };

  const addRow = (preset?: { title: string; price: string; isFrom: boolean }) => {
    const newRow: ServiceRowItem = {
      id: `srv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: preset?.title || '',
      price: preset?.price || '',
      isFrom: preset?.isFrom ?? false
    };
    commit([...rows, newRow], perks);
  };

  const togglePerk = (perk: string) => {
    const nextPerks = perks.includes(perk) ? perks.filter((p) => p !== perk) : [...perks, perk];
    commit(rows, nextPerks);
  };

  const quickSuggestions = NICHE_QUICK_SERVICES[niche] || NICHE_QUICK_SERVICES.custom;

  return (
    <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-3.5">
      <div className="flex items-center justify-between gap-2">
        <FieldLabel
          htmlFor={`service-title-${rows[0]?.id || '0'}`}
          label="Услуги и цены (конструктор прайс-листа)"
          helpTriggerLabel="Как заполнять?"
          helpTitle="Интерактивный прайс-лист без ручной разметки"
          helpText="Впишите название услуги слева и цену в BYN справа. Если точная стоимость зависит от сложности работы — нажмите кнопку «от» перед ценой. Если услуга бесплатная — укажите 0."
          helpExample="Диагностика подвески → 35 BYN&#10;Замена тормозных колодок → [от] 45 BYN"
        />
      </div>

      {/* Rows List */}
      <div className="space-y-2.5" aria-describedby="services-builder-hint">
        {rows.map((row, index) => (
          <div
            key={row.id}
            className="p-2.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-start gap-2"
          >
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <span className="w-5 h-5 mt-1.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold flex items-center justify-center shrink-0">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <AutoGrowTextarea
                  id={`service-title-${row.id}`}
                  rows={1}
                  aria-label={`Название услуги ${index + 1}`}
                  value={row.title}
                  onChange={(e) => updateRow(row.id, { title: e.target.value })}
                  placeholder="Название услуги или условия (напр. Замена масла)"
                  className="px-3 py-2 rounded-lg bg-slate-50/70 focus:bg-white border border-slate-200 text-xs text-slate-900 leading-relaxed focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 pl-7 sm:pl-0 sm:pt-0.5 shrink-0">
              <button
                type="button"
                aria-pressed={row.isFrom}
                onClick={() => updateRow(row.id, { isFrom: !row.isFrom })}
                title="Включить приставку «от», если цена ориентировочная"
                className={`px-2 py-2 rounded-lg text-[11px] font-semibold border transition-colors ${
                  row.isFrom
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200'
                }`}
              >
                от
              </button>

              <div className="relative w-28">
                <input
                  type="text"
                  inputMode="numeric"
                  aria-label={`Цена в BYN для услуги ${index + 1}`}
                  value={row.price}
                  onChange={(e) => updateRow(row.id, { price: e.target.value.replace(/[^0-9–-]/g, '') })}
                  placeholder="—"
                  className="w-full pl-2.5 pr-10 py-2 rounded-lg bg-slate-50/70 focus:bg-white border border-slate-200 text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                />
                <span className="absolute right-2.5 top-2 text-[10px] font-bold text-emerald-700 pointer-events-none">
                  BYN
                </span>
              </div>

              <button
                type="button"
                onClick={() => removeRow(row.id)}
                aria-label={`Удалить услугу ${index + 1}`}
                title="Удалить строку"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <CloseCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Service Button + Quick Niche Suggestions */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => addRow()}
          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-2xs"
        >
          <span>+ Добавить свою услугу</span>
        </button>

        {quickSuggestions.map((sug) => {
          const alreadyAdded = rows.some((r) => r.title.toLowerCase() === sug.title.toLowerCase());
          if (alreadyAdded) return null;
          return (
            <button
              key={sug.title}
              type="button"
              onClick={() => addRow(sug)}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 text-[11px] font-medium text-left leading-snug transition-colors"
            >
              + {sug.title} ({sug.isFrom ? 'от ' : ''}{sug.price} BYN)
            </button>
          );
        })}
      </div>

      {/* Payment Conditions & Installment Chips */}
      <div className="pt-2 border-t border-slate-200/70 space-y-1.5">
        <span className="text-[11px] font-medium text-slate-600 flex items-center gap-1.5">
          <Wallet className="w-3.5 h-3.5 text-emerald-600" />
          <span>Способы оплаты и рассрочка (отметьте то, что есть у вас):</span>
        </span>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Способы оплаты и рассрочка">
          {PAYMENT_PERKS.map((perk) => {
            const active = perks.includes(perk);
            return (
              <button
                key={perk}
                type="button"
                aria-pressed={active}
                onClick={() => togglePerk(perk)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all inline-flex items-center gap-1 ${
                  active
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                    : 'bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-800 border-slate-200'
                }`}
              >
                {active && <CheckCircle2 className="w-3 h-3" />}
                <span>{perk}</span>
              </button>
            );
          })}
        </div>
      </div>

      <FieldHint id="services-builder-hint">
        Все суммы в BYN бот автоматически произносит словами («белорусских рублей»).
      </FieldHint>
    </div>
  );
};

export { KnowledgeBaseUploader } from './KnowledgeBaseUploader';

