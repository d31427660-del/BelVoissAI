import React, { useState, useEffect } from 'react';
import {
  WalletMoneyIcon,
  CheckCircleIcon,
  Card2Icon as CreditCardIcon,
  ShieldCheckIcon,
  ArrowRightIcon
} from '@solar-icons/react/bold-duotone';
import { SipSettings, UserSession } from '../../types';
import { ispUpdateNumberRentalMode } from '../../lib/ispDbClient';
import { StorageMeter } from '@/components/motion';

interface BillingTabProps {
  user: UserSession;
  sipSettings: SipSettings;
  onSaveSip: (settings: SipSettings) => void;
  onUserUpdated?: (user: UserSession) => void;
  onNavigateTab?: (tab: 'overview' | 'agent' | 'leads' | 'phone' | 'billing') => void;
  initialSelectedPackage?: 'pack_300' | 'pack_1000' | null;
  onInitialPackageConsumed?: () => void;
}

const DISCOUNT_PACKAGES = [
  {
    id: 'pack_300' as const,
    name: 'Пакет 300 минут',
    minutes: 300,
    priceByn: 120,
    ratePerMinute: 0.40,
    savingsPercent: 11,
    savingsByn: 15,
    badge: 'Выгода −11%'
  },
  {
    id: 'pack_1000' as const,
    name: 'Пакет 1000 минут',
    minutes: 1000,
    priceByn: 350,
    ratePerMinute: 0.35,
    savingsPercent: 22,
    savingsByn: 100,
    badge: 'Макс. выгода −22%'
  }
];

export const BillingTab: React.FC<BillingTabProps> = ({
  user,
  sipSettings,
  onSaveSip,
  onUserUpdated,
  onNavigateTab,
  initialSelectedPackage,
  onInitialPackageConsumed
}) => {
  const billing = user.billing;
  const invoices = billing?.invoices || [];
  const currentOpenInvoice = billing?.currentInvoice || invoices.find((inv) => inv.status === 'open') || null;
  const unpaidClosedInvoices = invoices.filter((inv) => inv.status === 'issued' || inv.status === 'overdue');
  const defaultTargetInvoice = unpaidClosedInvoices[0] || currentOpenInvoice;

  const freeMinsRemaining = billing ? billing.freeMinutesRemaining : (user.balanceMinutes || 0);
  const freeMinsUsed = currentOpenInvoice?.freeMinutesUsed ?? 0;
  const freeMinsTotal = Math.max(15, freeMinsRemaining + freeMinsUsed);
  const freeMinsPercent = Math.min(100, Math.max(0, (freeMinsRemaining / freeMinsTotal) * 100));

  const isOwnSip = billing ? billing.numberRentalMode === 'own_sip' : Boolean(sipSettings.byoSipMode);
  const monthlySubByn = isOwnSip ? 0 : 15;
  const ratePerMin = user.ratePerMinute || 0.45;
  const billableMinsThisMonth = currentOpenInvoice?.billableMinutes ?? 0;
  const minutesCostThisMonth = +(billableMinsThisMonth * ratePerMin).toFixed(2);
  const paidEarlyThisMonth = currentOpenInvoice?.paidEarlyByn ?? 0;
  const currentMonthTotalByn = currentOpenInvoice
    ? currentOpenInvoice.remainingDueByn
    : Math.max(0, +(minutesCostThisMonth + monthlySubByn - paidEarlyThisMonth).toFixed(2));
  const unpaidDebtByn = billing ? billing.unpaidDebtByn : currentMonthTotalByn;
  const creditLimitByn = billing?.creditLimitByn ?? 100;
  const isSuspended = billing?.billingStatus === 'suspended' || unpaidDebtByn > creditLimitByn;

  // Interactive Calculator State (calls per day)
  const [callsPerDay, setCallsPerDay] = useState<number>(10);
  const estimatedMonthlyCalls = callsPerDay * 30;
  const estimatedMonthlyMinutes = estimatedMonthlyCalls; // avg ~1 min per call
  const basePostpaidCostByn = +(estimatedMonthlyMinutes * 0.45 + monthlySubByn).toFixed(2);
  const recommendedRate = estimatedMonthlyMinutes >= 1000 ? 0.35 : estimatedMonthlyMinutes >= 300 ? 0.40 : 0.45;
  const optimizedCostByn = +(estimatedMonthlyMinutes * recommendedRate + monthlySubByn).toFixed(2);
  const monthlySavingsByn = Math.max(0, Math.round(basePostpaidCostByn - optimizedCostByn));

  // Payment Selection State
  const [selectedTarget, setSelectedTarget] = useState<'pack_300' | 'pack_1000' | 'custom' | 'postpaid'>(
    initialSelectedPackage || (unpaidDebtByn >= 0.5 ? 'postpaid' : 'pack_300')
  );

  useEffect(() => {
    if (initialSelectedPackage) {
      setSelectedTarget(initialSelectedPackage);
      onInitialPackageConsumed?.();
    }
  }, [initialSelectedPackage, onInitialPackageConsumed]);
  const [customMinutes, setCustomMinutes] = useState<string>('100');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'erip'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rentalSavedNotice, setRentalSavedNotice] = useState<string | null>(null);

  const rawCustomMins = parseInt(customMinutes || '0', 10) || 0;
  const isCustomValid = rawCustomMins >= 50 && rawCustomMins <= 10000;
  const clampedCustomMins = Math.max(50, Math.min(10000, rawCustomMins || 50));
  const customRate = clampedCustomMins >= 1000 ? 0.35 : clampedCustomMins >= 300 ? 0.40 : 0.45;
  const customAmountByn = +(clampedCustomMins * customRate).toFixed(2);

  const handleToggleRentalMode = async (useOwnSip: boolean) => {
    const updatedSip: SipSettings = {
      ...sipSettings,
      byoSipMode: useOwnSip
    };
    onSaveSip(updatedSip);
    setRentalSavedNotice(
      useOwnSip
        ? 'Режим «Свой SIP» — 0 BYN/мес за номер'
        : 'Режим «Номер А1 ВАТС» — 15 BYN/мес'
    );
    setTimeout(() => setRentalSavedNotice(null), 3500);

    const freshUser = await ispUpdateNumberRentalMode(useOwnSip ? 'own_sip' : 'rental');
    if (freshUser && onUserUpdated) {
      onUserUpdated(freshUser);
    }
  };

  // Compute active payment summary
  let activeMinutes = 0;
  let activeRate = ratePerMin;
  let activeAmountByn = 0;
  let activeTitle = '';

  if (selectedTarget === 'postpaid') {
    activeMinutes = defaultTargetInvoice ? defaultTargetInvoice.billableMinutes : billableMinsThisMonth;
    activeRate = defaultTargetInvoice ? defaultTargetInvoice.ratePerMinute : ratePerMin;
    activeAmountByn = defaultTargetInvoice ? defaultTargetInvoice.remainingDueByn : unpaidDebtByn;
    activeTitle = `Погашение счёта за месяц (${billing?.currentPeriodYm || 'текущий период'})`;
  } else if (selectedTarget === 'custom') {
    activeMinutes = clampedCustomMins;
    activeRate = customRate;
    activeAmountByn = customAmountByn;
    activeTitle = `Пополнение баланса на ${clampedCustomMins} минут`;
  } else {
    const pkg = DISCOUNT_PACKAGES.find((p) => p.id === selectedTarget) || DISCOUNT_PACKAGES[0];
    activeMinutes = pkg.minutes;
    activeRate = pkg.ratePerMinute;
    activeAmountByn = pkg.priceByn;
    activeTitle = `${pkg.name} (${pkg.ratePerMinute.toFixed(2)} BYN/мин, выгода −${pkg.savingsPercent}%)`;
  }

  const handleActionSubmit = async () => {
    setErrorMsg(null);

    if (selectedTarget === 'custom' && !isCustomValid) {
      setErrorMsg('Минимальный объём произвольного пополнения — 50 минут (максимум 10 000 минут).');
      return;
    }

    if (activeAmountByn < 0.5) {
      setErrorMsg(
        'По текущему месяцу сумма к оплате пока 0.00 BYN (у вас ещё есть бесплатные минуты). Если хотите пополнить минуты заранее со скидкой, выберите пакет на 300 или 1000 минут.'
      );
      return;
    }

    setIsProcessing(true);
    try {
      const payload: Record<string, unknown> = {
        paymentMethod
      };
      if (selectedTarget === 'postpaid') {
        payload.invoiceId = defaultTargetInvoice?.id || '';
        payload.payEarly = !defaultTargetInvoice || defaultTargetInvoice.status === 'open';
      } else if (selectedTarget === 'custom') {
        payload.customMinutes = activeMinutes;
      } else {
        payload.packageId = selectedTarget;
      }

      const response = await fetch('/api/bepaid-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.redirectUrl) {
          window.location.href = data.redirectUrl;
          return;
        }
      }

      const errData = await response.json().catch(() => ({}));
      setErrorMsg(
        errData?.message ||
          errData?.error ||
          'Платёжный шлюз bePaid временно недоступен. Пожалуйста, попробуйте чуть позже или напишите персональному менеджеру.'
      );
    } catch {
      setErrorMsg('Не удалось связаться с платёжным сервером bePaid.');
    } finally {
      setIsProcessing(false);
    }
  };

  const sliderProgressPercent = ((callsPerDay - 2) / (50 - 2)) * 100;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {isSuspended && (
        <div
          role="alert"
          className="p-4 sm:p-5 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
        >
          <div className="space-y-1">
            <div className="text-sm font-bold text-rose-900">
              Кредитный лимит ({creditLimitByn} BYN) превышен — приём звонков временно приостановлен
            </div>
            <p className="text-xs text-rose-800 leading-relaxed">
              Накопленная задолженность составила <strong>{unpaidDebtByn.toFixed(2)} BYN</strong>. Оплатите текущий счёт онлайн картой или через ЕРИП — бот автоматически включится обратно.
            </p>
          </div>
          <a
            href="#payment-section"
            onClick={() => setSelectedTarget('postpaid')}
            className="px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shrink-0 text-center transition-colors"
          >
            Погасить долг ({unpaidDebtByn.toFixed(2)} BYN) →
          </a>
        </div>
      )}

      {/* 1. КОМПАКТНЫЙ ТЁМНЫЙ ГЕРОЙ-БЛОК БАЛАНСА */}
      <div className="p-6 sm:p-7 rounded-3xl bg-[#141417] text-white shadow-xl border border-white/10 relative overflow-hidden">
        <div
          className="pointer-events-none absolute -top-24 -right-20 w-80 h-80 rounded-full opacity-25"
          style={{
            background: 'radial-gradient(circle, rgba(245, 158, 11, 0.55) 0%, rgba(16, 185, 129, 0.2) 55%, transparent 75%)'
          }}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-medium text-amber-300 mb-2">
              <WalletMoneyIcon className="w-4 h-4 text-amber-400" />
              <span>Честная постоплата 1–7 числа или пакеты минут со скидкой до 22%</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Ваш баланс и тарифный план
            </h2>
          </div>

          <a
            href="#payment-section"
            onClick={() => {
              if (unpaidDebtByn >= 0.5) setSelectedTarget('postpaid');
            }}
            className="px-5 h-10 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold inline-flex items-center gap-2 transition-colors shadow-sm self-start md:self-center shrink-0"
          >
            <CreditCardIcon className="w-4 h-4" />
            <span>
              {unpaidDebtByn >= 0.5
                ? `Оплатить счёт (${unpaidDebtByn.toFixed(2)} BYN)`
                : 'Перейти к оплате (Карта / ЕРИП)'}
            </span>
          </a>
        </div>

        {/* 3 главных показателя без лишней воды */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-5">
          <div className="p-4 rounded-2xl bg-white/[0.06] border border-white/10 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Доступно минут на балансе</span>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  freeMinsRemaining > 0
                    ? 'text-emerald-400 bg-emerald-500/15'
                    : 'text-amber-300 bg-amber-500/15'
                }`}
              >
                {freeMinsRemaining > 0 ? 'Расходуются первыми' : 'Бонус исчерпан'}
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-white">
              {freeMinsRemaining.toFixed(1)} <span className="text-xs font-normal text-zinc-400">из {freeMinsTotal.toFixed(0)} мин</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  freeMinsRemaining > 0 ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
                style={{ width: `${freeMinsPercent}%` }}
              />
            </div>
          </div>

          <div
            className={`p-4 rounded-2xl border space-y-1.5 ${
              isSuspended
                ? 'bg-rose-500/15 border-rose-400/40'
                : 'bg-white/[0.06] border-white/10'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-zinc-300">
              <span>К оплате по факту месяца</span>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  isSuspended
                    ? 'text-rose-200 bg-rose-500/30'
                    : 'text-amber-300 bg-amber-500/15'
                }`}
              >
                {isSuspended ? 'Лимит превышен!' : `Лимит ${creditLimitByn} BYN`}
              </span>
            </div>
            <div className={`text-2xl font-bold font-mono ${isSuspended ? 'text-rose-300' : 'text-white'}`}>
              {unpaidDebtByn.toFixed(2)} <span className="text-xs font-normal text-zinc-400">BYN</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Разговоры: <strong className="text-zinc-200">{billableMinsThisMonth.toFixed(1)} мин</strong> ({minutesCostThisMonth.toFixed(2)} BYN)
              {monthlySubByn > 0 ? ` + Линия А1: ${monthlySubByn.toFixed(2)} BYN` : ''}
              {paidEarlyThisMonth > 0 ? ` − Оплачено: ${paidEarlyThisMonth.toFixed(2)} BYN` : ''}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.06] border border-white/10 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Телефонная линия</span>
              <span className="text-[11px] font-semibold text-sky-300 bg-sky-500/15 px-2 py-0.5 rounded-full">
                {isOwnSip ? 'Свой SIP' : 'Номер А1 ВАТС'}
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-white">
              {monthlySubByn}.00 <span className="text-xs font-normal text-zinc-400">BYN / мес</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Базовая ставка сверх бонуса: <strong className="text-zinc-200">{ratePerMin.toFixed(2)} BYN/мин</strong>
            </p>
          </div>
        </div>
      </div>

      {/* DesignBookmark Motion: Storage meter (Визуальный расход минут пакета) */}
      <StorageMeter
        title="Расход минут по сценариям и периодам"
        usedMinutes={Math.round(freeMinsUsed + billableMinsThisMonth)}
        totalMinutes={Math.max(15, Math.round(freeMinsTotal + billableMinsThisMonth))}
        segments={[
          {
            id: 'free-used',
            label: 'Бонусные минуты (использовано)',
            minutes: Math.round(freeMinsUsed),
            colorClass: 'bg-emerald-500',
            detail: `Из ${Math.round(freeMinsTotal)} доступных минут израсходовано ${Math.round(freeMinsUsed)} мин. Остаток: ${Math.round(freeMinsRemaining)} мин (не сгорает).`,
          },
          {
            id: 'billable',
            label: 'Оплачиваемые звонки в текущем месяце',
            minutes: Math.round(billableMinsThisMonth),
            colorClass: 'bg-slate-900',
            detail: `Тарифицируется только фактическое время диалога по ставке ${ratePerMin.toFixed(2)} BYN/мин. Гудки и ожидание — 0 BYN.`,
          },
        ]}
      />

      {/* 2. ПРАВИЛА ТАРИФА + ИНТЕРАКТИВНЫЙ КАЛЬКУЛЯТОР ВЫГОДЫ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Левая колонка: Прозрачные правила тарифа и выбор линии */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Как считается цена (3 правила)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Никакой абонплаты за платформу, Telegram или сценарии
                </p>
              </div>
              {rentalSavedNotice && (
                <span role="status" className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                  ✓ {rentalSavedNotice}
                </span>
              )}
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-slate-900 block">1. Первые 15 минут диалогов</span>
                  <span className="text-slate-600 text-[11px]">Даются бесплатно при регистрации без привязки карты</span>
                </div>
                <span className="text-sm font-extrabold font-mono text-emerald-700 shrink-0">0 BYN</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200/80 flex items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-slate-900 block">2. Разговоры ИИ сверх бонуса</span>
                  <span className="text-slate-600 text-[11px]">Постоплата в конце месяца (или 0.35–0.40 BYN в пакетах)</span>
                </div>
                <span className="text-sm font-extrabold font-mono text-blue-700 shrink-0">0.45 BYN/мин</span>
              </div>

              {/* Переключатель телефонной линии */}
              <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/90 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">3. Телефонная линия компании:</span>
                  <span className="font-mono font-extrabold text-slate-900">
                    {isOwnSip ? '0 BYN/мес' : '15 BYN/мес'}
                  </span>
                </div>

                <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <legend className="visually-hidden">Режим телефонного номера</legend>
                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isOwnSip
                        ? 'bg-white border-emerald-500 text-slate-900 font-semibold shadow-2xs'
                        : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="billing-sip-mode"
                      checked={isOwnSip}
                      onChange={() => handleToggleRentalMode(true)}
                      className="accent-emerald-600"
                    />
                    <div>
                      <span className="block leading-tight">Свой SIP-номер</span>
                      <span className="text-[10px] font-mono text-emerald-700 font-bold">0 BYN / мес</span>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      !isOwnSip
                        ? 'bg-white border-amber-500 text-slate-900 font-semibold shadow-2xs'
                        : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="billing-sip-mode"
                      checked={!isOwnSip}
                      onChange={() => handleToggleRentalMode(false)}
                      className="accent-amber-600"
                    />
                    <div>
                      <span className="block leading-tight">Номер А1 от Voxi</span>
                      <span className="text-[10px] font-mono text-amber-800 font-bold">15 BYN / мес</span>
                    </div>
                  </label>
                </fieldset>
              </div>
            </div>
          </div>

          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('phone')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 cursor-pointer self-start"
            >
              <span>Перейти к настройкам телефонного номера</span>
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Правая колонка: Живой калькулятор выгоды */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Калькулятор: сколько вы заплатите за месяц?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Подвигайте ползунок, чтобы сравнить постоплату и оптовые пакеты
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono text-xs font-bold whitespace-nowrap shrink-0">
                ~{estimatedMonthlyMinutes} мин/мес
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="calls-per-day-slider" className="font-semibold text-slate-800">
                  Звонков в вашу компанию в день:
                </label>
                <span className="text-sm font-extrabold font-mono text-indigo-700">
                  {callsPerDay} зв. / день
                </span>
              </div>

              <input
                id="calls-per-day-slider"
                type="range"
                min={2}
                max={50}
                step={1}
                value={callsPerDay}
                style={{ '--slider-progress': `${sliderProgressPercent}%` } as React.CSSProperties}
                onChange={(e) => setCallsPerDay(Number(e.target.value))}
                className="voxi-range-slider w-full cursor-pointer accent-indigo-600"
              />

              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>2 зв./день (малый бизнес)</span>
                <span>15 зв./день (СТО / клиника)</span>
                <span>50 зв./день (сеть)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 block">По факту в конце месяца:</span>
                <div className="text-lg font-extrabold font-mono text-slate-900 mt-0.5">
                  ~{basePostpaidCostByn} BYN
                </div>
                <span className="text-[10px] text-slate-500">по 0.45 BYN/мин {isOwnSip ? '' : '(+15 BYN номер)'}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                <span className="text-[11px] text-emerald-800 font-semibold block">С пакетом минут:</span>
                <div className="text-lg font-extrabold font-mono text-emerald-700 mt-0.5">
                  ~{optimizedCostByn} BYN
                </div>
                <span className="text-[10px] text-emerald-700 font-medium">
                  {monthlySavingsByn > 0
                    ? `Вы экономите ${monthlySavingsByn} BYN/мес`
                    : 'На малом объёме выгоднее постоплата'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200/80 flex items-center justify-between gap-2 text-xs text-indigo-950">
            <span>
              {estimatedMonthlyMinutes >= 300
                ? `На объёме ~${estimatedMonthlyMinutes} мин/мес выгоднее взять пакет со скидкой (${recommendedRate.toFixed(2)} BYN/мин).`
                : `При ${callsPerDay} звонках в день можно ничего не покупать вперёд — просто пользуйтесь постоплатой!`}
            </span>
            {estimatedMonthlyMinutes >= 300 && (
              <a
                href="#payment-section"
                onClick={() => setSelectedTarget(estimatedMonthlyMinutes >= 1000 ? 'pack_1000' : 'pack_300')}
                className="font-bold text-indigo-700 hover:text-indigo-900 underline shrink-0"
              >
                Выбрать пакет ↓
              </a>
            )}
          </div>
        </div>
      </div>

      {/* 3. ЕДИНЫЙ БЛОК ОНЛАЙН-ОПЛАТЫ (БЕЗ ПОВТОРОВ И ЛИШНИХ ПОЛЕЙ) */}
      <div
        id="payment-section"
        className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-5 scroll-mt-20"
      >
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            Пополнение минут со скидкой и оплата месяца (Карта / ЕРИП)
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Купленные в пакете минуты начисляются мгновенно и расходуются первыми — пока они есть, ежемесячный счёт остаётся 0 BYN
          </p>
        </div>

        {errorMsg && (
          <div role="alert" className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Шаг 1: 4 понятные карточки выбора что оплачиваем */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {DISCOUNT_PACKAGES.map((pkg) => {
            const isSelected = selectedTarget === pkg.id;
            return (
              <button
                key={pkg.id}
                type="button"
                onClick={() => {
                  setSelectedTarget(pkg.id);
                  setErrorMsg(null);
                }}
                className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                    : 'bg-slate-50/80 hover:bg-white text-slate-900 border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold">{pkg.name}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isSelected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      −{pkg.savingsPercent}%
                    </span>
                  </div>
                  <div className="text-xl font-extrabold font-mono mt-1">
                    {pkg.priceByn} BYN
                  </div>
                  <div className={`text-[11px] mt-0.5 font-mono ${isSelected ? 'text-zinc-300' : 'text-slate-500'}`}>
                    по {pkg.ratePerMinute.toFixed(2)} BYN/мин (экономия {pkg.savingsByn} BYN)
                  </div>
                </div>
              </button>
            );
          })}

          {/* Карточка 3: Свой объём минут */}
          <div
            onClick={() => {
              setSelectedTarget('custom');
              setErrorMsg(null);
            }}
            className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
              selectedTarget === 'custom'
                ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                : 'bg-slate-50/80 hover:bg-white text-slate-900 border-slate-200'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-1">
                <label htmlFor="billing-custom-mins" className="text-xs font-bold cursor-pointer">
                  Своё кол-во минут
                </label>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
                    selectedTarget === 'custom' ? 'bg-amber-400/20 text-amber-300' : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  от 50 мин
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  id="billing-custom-mins"
                  type="text"
                  inputMode="numeric"
                  value={customMinutes}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTarget('custom');
                  }}
                  onChange={(e) => {
                    setSelectedTarget('custom');
                    setCustomMinutes(e.target.value.replace(/\D/g, ''));
                    setErrorMsg(null);
                  }}
                  onBlur={() => {
                    if (customMinutes !== '' && rawCustomMins < 50) {
                      setCustomMinutes('50');
                    } else if (rawCustomMins > 10000) {
                      setCustomMinutes('10000');
                    }
                  }}
                  className={`w-24 px-2.5 py-1 rounded-lg text-sm font-mono font-bold border focus:outline-none ${
                    !isCustomValid && customMinutes !== ''
                      ? 'border-rose-400 bg-rose-500/15 text-rose-200'
                      : selectedTarget === 'custom'
                      ? 'bg-white/10 text-white border-white/25'
                      : 'bg-white text-slate-900 border-slate-300'
                  }`}
                  placeholder="100"
                />
                <span className="text-xs font-mono font-bold whitespace-nowrap">
                  = {isCustomValid ? `${customAmountByn.toFixed(2)} BYN` : 'мин. 50 мин'}
                </span>
              </div>
              {!isCustomValid && customMinutes !== '' && (
                <p className={`text-[10px] mt-1 font-medium ${selectedTarget === 'custom' ? 'text-rose-300' : 'text-rose-600'}`}>
                  Введите от 50 до 10 000 минут
                </p>
              )}
            </div>
          </div>

          {/* Карточка 4: Оплата счёта за месяц */}
          <button
            type="button"
            onClick={() => {
              setSelectedTarget('postpaid');
              setErrorMsg(null);
            }}
            className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
              selectedTarget === 'postpaid'
                ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                : 'bg-slate-50/80 hover:bg-white text-slate-900 border-slate-200'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-xs font-bold">Счёт за месяц</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    selectedTarget === 'postpaid' ? 'bg-white/15 text-zinc-200' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  По факту
                </span>
              </div>
              <div className="text-xl font-extrabold font-mono mt-1">
                {unpaidDebtByn.toFixed(2)} BYN
              </div>
              <div className={`text-[11px] mt-0.5 ${selectedTarget === 'postpaid' ? 'text-zinc-300' : 'text-slate-500'}`}>
                {unpaidDebtByn >= 0.5 ? 'Досрочное погашение' : 'Сейчас к оплате 0 BYN'}
              </div>
            </div>
          </button>
        </div>

        {/* Шаг 2: Выбор Карта или ЕРИП + Кнопка оплаты в одну строку */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs text-zinc-400 mr-1">Способ оплаты:</span>
            <button
              type="button"
              aria-pressed={paymentMethod === 'card'}
              onClick={() => setPaymentMethod('card')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer border ${
                paymentMethod === 'card'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                  : 'bg-white/10 text-white border-white/15 hover:bg-white/15'
              }`}
            >
              <CreditCardIcon size={16} />
              <span>Карта (БЕЛКАРТ, Visa, MC)</span>
            </button>

            <button
              type="button"
              aria-pressed={paymentMethod === 'erip'}
              onClick={() => setPaymentMethod('erip')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer border ${
                paymentMethod === 'erip'
                  ? 'bg-amber-400 text-slate-950 border-amber-300'
                  : 'bg-white/10 text-white border-white/15 hover:bg-white/15'
              }`}
            >
              <span className="px-1.5 py-0.5 rounded bg-black/20 text-[10px] font-extrabold">ЕРИП</span>
              <span>Система «Расчёт» (QR-код)</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="text-left sm:text-right">
              <div className="text-[11px] text-zinc-400">{activeTitle}</div>
              <div className="text-lg font-extrabold font-mono text-white">
                {activeAmountByn.toFixed(2)} BYN
              </div>
            </div>

            <button
              type="button"
              onClick={handleActionSubmit}
              disabled={isProcessing || activeAmountByn < 0.5 || (selectedTarget === 'custom' && !isCustomValid)}
              className="px-6 h-11 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed shrink-0"
            >
              <WalletMoneyIcon size={18} />
              <span>
                {isProcessing
                  ? 'Переход в bePaid...'
                  : activeAmountByn < 0.5
                  ? 'Нет задолженности к оплате'
                  : paymentMethod === 'erip'
                  ? `Оплатить ${activeAmountByn.toFixed(2)} BYN через ЕРИП`
                  : `Оплатить ${activeAmountByn.toFixed(2)} BYN картой`}
              </span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <ShieldCheckIcon size={16} className="text-emerald-600 shrink-0" aria-hidden="true" />
          <span>
            Безопасные платежи в BYN через <strong>bePaid</strong> (PCI DSS Level 1). Электронный чек сразу приходит на ваш email ({user.email || 'корпоративная почта'}).
          </span>
        </div>
      </div>

      {/* 4. ИСТОРИЯ СЧЕТОВ ПО МЕСЯЦАМ */}
      {invoices.length > 0 && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">История счетов по месяцам</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Все выставленные и текущие расчётные периоды по вашей компании
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] text-slate-500 font-semibold">
                  <th className="py-2 pr-3">Период / Счёт</th>
                  <th className="py-2 px-3">Минуты</th>
                  <th className="py-2 px-3">Итого</th>
                  <th className="py-2 px-3">К оплате</th>
                  <th className="py-2 pl-3 text-right">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="py-2.5 pr-3 font-medium text-slate-900 whitespace-nowrap">
                      {inv.periodYm} <span className="text-slate-400 font-mono text-[11px]">({inv.invoiceNumber})</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700 whitespace-nowrap">
                      {inv.billableMinutes.toFixed(1)} мин
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-900 whitespace-nowrap">
                      {inv.totalAmountByn.toFixed(2)} BYN
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-950 whitespace-nowrap">
                      {inv.remainingDueByn.toFixed(2)} BYN
                    </td>
                    <td className="py-2.5 pl-3 text-right whitespace-nowrap">
                      {inv.status === 'paid' ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                          Оплачен
                        </span>
                      ) : inv.status === 'overdue' ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-semibold">
                          Просрочен
                        </span>
                      ) : inv.status === 'issued' ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold">
                          Выставлен
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium">
                          Текущий
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
