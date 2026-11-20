import React, { useState, useEffect } from 'react';
import {
  WalletMoneyIcon,
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
        ? 'Свой SIP · 0 BYN/мес'
        : 'Номер А1 · 15 BYN/мес'
    );
    setTimeout(() => setRentalSavedNotice(null), 3500);

    const freshUser = await ispUpdateNumberRentalMode(useOwnSip ? 'own_sip' : 'rental');
    if (freshUser && onUserUpdated) {
      onUserUpdated(freshUser);
    }
  };

  // Compute active payment summary
  let activeMinutes = 0;
  let activeAmountByn = 0;
  let activeTitle = '';

  if (selectedTarget === 'postpaid') {
    activeMinutes = defaultTargetInvoice ? defaultTargetInvoice.billableMinutes : billableMinsThisMonth;
    activeAmountByn = defaultTargetInvoice ? defaultTargetInvoice.remainingDueByn : unpaidDebtByn;
    activeTitle = `Погашение счёта за месяц (${billing?.currentPeriodYm || 'текущий период'})`;
  } else if (selectedTarget === 'custom') {
    activeMinutes = clampedCustomMins;
    activeAmountByn = customAmountByn;
    activeTitle = `Пополнение баланса на ${clampedCustomMins} минут`;
  } else {
    const pkg = DISCOUNT_PACKAGES.find((p) => p.id === selectedTarget) || DISCOUNT_PACKAGES[0];
    activeMinutes = pkg.minutes;
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

  return (
    <div className="space-y-6">
      {/* Editorial mono eyebrow rule */}
      <div className="flex items-center justify-between gap-4">
        <div className="inline-flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#737373]">
          <span className="w-1.5 h-1.5 rounded-full bg-black" />
          <span>Тариф и оплата · BYN</span>
        </div>
        <div className="hidden sm:block h-px flex-1 bg-black/[0.08]" />
        <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#737373]">
          BEPAID · КАРТА · ЕРИП
        </span>
      </div>

      {isSuspended && (
        <div
          role="alert"
          className="p-5 sm:p-6 rounded-[24px] bg-[#FFF5F3] border border-[#FE432A]/40 text-[#7F1D1D] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <div className="font-display text-[15px] font-bold text-black">
              Кредитный лимит ({creditLimitByn} BYN) превышен — приём звонков временно приостановлен
            </div>
            <p className="text-[13px] text-[#7F1D1D] leading-relaxed">
              Накопленная задолженность составила <strong className="font-mono">{unpaidDebtByn.toFixed(2)} BYN</strong>. Оплатите текущий счёт онлайн картой или через ЕРИП — бот автоматически включится обратно.
            </p>
          </div>
          <a
            href="#payment-section"
            onClick={() => setSelectedTarget('postpaid')}
            className="h-10 px-5 rounded-full bg-[#FE432A] hover:bg-[#DC2626] text-white text-[12px] font-semibold inline-flex items-center justify-center shrink-0 transition-colors"
          >
            Погасить долг ({unpaidDebtByn.toFixed(2)} BYN) ↗
          </a>
        </div>
      )}

      {/* 1. Dotted Obsidian Balance Hero */}
      <div className="voxi-dot-surface p-6 sm:p-8 rounded-[28px] text-white border border-black space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 font-mono text-[10.5px] uppercase tracking-[0.1em] text-[#D8E738]">
              <WalletMoneyIcon className="w-3.5 h-3.5" />
              <span>Постоплата 1–7 числа · пакеты со скидкой до −22%</span>
            </div>
            <h1 className="font-display text-2xl sm:text-[32px] font-bold tracking-[-0.035em] leading-[1.1] text-white">
              Ваш баланс и тарифный план
            </h1>
          </div>

          <a
            href="#payment-section"
            onClick={() => {
              if (unpaidDebtByn >= 0.5) setSelectedTarget('postpaid');
            }}
            className="h-11 px-5 rounded-full bg-[#D8E738] hover:bg-[#CFDF2E] text-black text-[13px] font-semibold inline-flex items-center gap-2 transition-colors self-start lg:self-center shrink-0"
          >
            <CreditCardIcon className="w-4 h-4" />
            <span>
              {unpaidDebtByn >= 0.5
                ? `Оплатить счёт (${unpaidDebtByn.toFixed(2)} BYN)`
                : 'Перейти к оплате (Карта / ЕРИП)'}
            </span>
          </a>
        </div>

        {/* 3 Key Balance Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-[20px] bg-white/[0.06] border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/60">
                Баланс минут
              </span>
              <span
                className={`font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  freeMinsRemaining > 0
                    ? 'text-black bg-[#6BFF91]'
                    : 'text-black bg-[#D8E738]'
                }`}
              >
                {freeMinsRemaining > 0 ? 'Первыми' : 'Бонус 0'}
              </span>
            </div>
            <div className="font-display text-3xl font-bold text-white tracking-[-0.035em] tabular-nums">
              {freeMinsRemaining.toFixed(1)}{' '}
              <span className="font-mono text-[12px] font-normal text-white/55">
                из {freeMinsTotal.toFixed(0)} мин
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/15 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  freeMinsRemaining > 0 ? 'bg-[#6BFF91]' : 'bg-[#D8E738]'
                }`}
                style={{ width: `${freeMinsPercent}%` }}
              />
            </div>
          </div>

          <div
            className={`p-5 rounded-[20px] border space-y-2.5 ${
              isSuspended
                ? 'bg-[#FE432A]/15 border-[#FE432A]/40'
                : 'bg-white/[0.06] border-white/10'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/60">
                К оплате за месяц
              </span>
              <span
                className={`font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  isSuspended
                    ? 'text-white bg-[#FE432A]'
                    : 'text-white/85 bg-white/15'
                }`}
              >
                {isSuspended ? 'Лимит превышен' : `Лимит ${creditLimitByn} BYN`}
              </span>
            </div>
            <div
              className={`font-display text-3xl font-bold tracking-[-0.035em] tabular-nums ${
                isSuspended ? 'text-[#FCA5A5]' : 'text-white'
              }`}
            >
              {unpaidDebtByn.toFixed(2)}{' '}
              <span className="font-mono text-[13px] font-normal text-white/55">BYN</span>
            </div>
            <p className="text-[11.5px] text-white/65 leading-snug">
              Разговоры: <strong className="text-white font-mono">{billableMinsThisMonth.toFixed(1)} мин</strong> ({minutesCostThisMonth.toFixed(2)} BYN)
              {monthlySubByn > 0 ? ` + А1: ${monthlySubByn.toFixed(2)} BYN` : ''}
              {paidEarlyThisMonth > 0 ? ` − Оплачено: ${paidEarlyThisMonth.toFixed(2)} BYN` : ''}
            </p>
          </div>

          <div className="p-5 rounded-[20px] bg-white/[0.06] border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/60">
                Телефонная линия
              </span>
              <span className="font-mono text-[10px] font-bold text-black bg-white px-2.5 py-0.5 rounded-full">
                {isOwnSip ? 'Свой SIP' : 'А1 ВАТС'}
              </span>
            </div>
            <div className="font-display text-3xl font-bold text-white tracking-[-0.035em] tabular-nums">
              {monthlySubByn}.00{' '}
              <span className="font-mono text-[13px] font-normal text-white/55">BYN / мес</span>
            </div>
            <p className="text-[11.5px] text-white/65">
              Базовая ставка сверх бонуса:{' '}
              <strong className="text-[#6BFF91] font-mono">{ratePerMin.toFixed(2)} BYN/мин</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Minutes Consumption Meter */}
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
            detail: `Из ${Math.round(freeMinsTotal)} доступных минут израсходовано ${Math.round(freeMinsUsed)} мин. Остаток: ${Math.round(freeMinsRemaining)} мин (не сгорает).`
          },
          {
            id: 'billable',
            label: 'Оплачиваемые звонки в текущем месяце',
            minutes: Math.round(billableMinsThisMonth),
            colorClass: 'bg-black',
            detail: `Тарифицируется только фактическое время диалога по ставке ${ratePerMin.toFixed(2)} BYN/мин. Гудки и ожидание — 0 BYN.`
          }
        ]}
      />

      {/* 2. Pricing Rules + Interactive Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: 3 Rules */}
        <section className="lg:col-span-6 p-6 sm:p-7 rounded-[24px] bg-white border border-black/[0.08] flex flex-col justify-between gap-5">
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#737373]">
                  Прозрачная модель
                </span>
                <h2 className="font-display text-lg font-bold text-black tracking-[-0.025em] mt-0.5">
                  Как считается цена (3 правила)
                </h2>
              </div>
              {rentalSavedNotice && (
                <span
                  role="status"
                  className="font-mono text-[10.5px] font-bold text-black bg-[#6BFF91] px-2.5 py-1 rounded-full"
                >
                  ✓ {rentalSavedNotice}
                </span>
              )}
            </div>

            <div className="space-y-3 text-[13px]">
              <div className="p-4 rounded-[18px] bg-[#F5F5F5] border border-black/[0.06] flex items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-black block">01. Первые 15 минут диалогов</span>
                  <span className="text-[#525252] text-[12px]">Даются бесплатно при регистрации без карты</span>
                </div>
                <span className="font-mono text-[14px] font-bold bg-[#6BFF91] text-black px-2.5 py-1 rounded-full shrink-0">
                  0 BYN
                </span>
              </div>

              <div className="p-4 rounded-[18px] bg-[#F5F5F5] border border-black/[0.06] flex items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-black block">02. Разговоры ИИ сверх бонуса</span>
                  <span className="text-[#525252] text-[12px]">Постоплата в конце месяца (0.35–0.40 BYN в пакетах)</span>
                </div>
                <span className="font-mono text-[13.5px] font-bold text-black shrink-0">
                  0.45 BYN/мин
                </span>
              </div>

              {/* Line mode switcher */}
              <div className="p-4 rounded-[18px] bg-[#F5F5F5] border border-black/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-black">03. Телефонная линия</span>
                  <span className="font-mono font-bold text-black">
                    {isOwnSip ? '0 BYN/мес' : '15 BYN/мес'}
                  </span>
                </div>

                <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <legend className="visually-hidden">Режим телефонного номера</legend>
                  <label
                    className={`flex items-center gap-2.5 p-3 rounded-[14px] border text-[12.5px] cursor-pointer transition-colors ${
                      isOwnSip
                        ? 'bg-[#0A0A0A] border-black text-white font-semibold'
                        : 'bg-white border-black/[0.08] text-black hover:border-black/30'
                    }`}
                  >
                    <input
                      type="radio"
                      name="billing-sip-mode"
                      checked={isOwnSip}
                      onChange={() => handleToggleRentalMode(true)}
                      className="accent-black"
                    />
                    <div>
                      <span className="block leading-tight">Свой SIP-номер</span>
                      <span
                        className={`text-[10.5px] font-mono font-bold ${
                          isOwnSip ? 'text-[#6BFF91]' : 'text-[#525252]'
                        }`}
                      >
                        0 BYN / мес
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-2.5 p-3 rounded-[14px] border text-[12.5px] cursor-pointer transition-colors ${
                      !isOwnSip
                        ? 'bg-[#0A0A0A] border-black text-white font-semibold'
                        : 'bg-white border-black/[0.08] text-black hover:border-black/30'
                    }`}
                  >
                    <input
                      type="radio"
                      name="billing-sip-mode"
                      checked={!isOwnSip}
                      onChange={() => handleToggleRentalMode(false)}
                      className="accent-black"
                    />
                    <div>
                      <span className="block leading-tight">Номер А1 от Voxi</span>
                      <span
                        className={`text-[10.5px] font-mono font-bold ${
                          !isOwnSip ? 'text-[#D8E738]' : 'text-[#525252]'
                        }`}
                      >
                        15 BYN / мес
                      </span>
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
              className="text-[12.5px] font-semibold text-black hover:opacity-75 inline-flex items-center gap-1.5 cursor-pointer self-start"
            >
              <span>Перейти к настройкам телефонного номера</span>
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          )}
        </section>

        {/* Right: Interactive Calculator */}
        <section className="lg:col-span-6 p-6 sm:p-7 rounded-[24px] bg-[#F5F5F5] border border-black/[0.06] flex flex-col justify-between gap-5">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#737373]">
                  Калькулятор BYN
                </span>
                <h2 className="font-display text-lg font-bold text-black tracking-[-0.025em] mt-0.5">
                  Сколько вы заплатите за месяц?
                </h2>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#0A0A0A] text-[#D8E738] font-mono text-[11.5px] font-bold whitespace-nowrap shrink-0 tabular-nums">
                ~{estimatedMonthlyMinutes} мин/мес
              </span>
            </div>

            <div className="p-4 sm:p-5 rounded-[18px] bg-white border border-black/[0.06] space-y-2.5">
              <div className="flex items-center justify-between text-[13px]">
                <label htmlFor="calls-per-day-slider" className="font-semibold text-black">
                  Звонков в день
                </label>
                <span className="font-mono text-[15px] font-bold text-black tabular-nums">
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
                aria-valuetext={`${callsPerDay} звонков в день`}
                style={
                  {
                    '--attr-min': 2,
                    '--attr-max': 50,
                    '--control-value': callsPerDay
                  } as React.CSSProperties
                }
                onChange={(e) => setCallsPerDay(Number(e.target.value))}
                className="voxi-editorial-slider"
              />

              <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.06em] text-[#737373]">
                <span>2 зв./день</span>
                <span>15 зв./день (СТО)</span>
                <span>50 зв./день</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-[18px] bg-white border border-black/[0.06]">
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#737373] block">
                  По факту в конце месяца
                </span>
                <div className="font-display text-2xl font-bold text-black tracking-[-0.03em] tabular-nums mt-1">
                  ~{basePostpaidCostByn} BYN
                </div>
                <span className="text-[11.5px] text-[#525252]">
                  по 0.45 BYN/мин {isOwnSip ? '' : '(+15 BYN номер)'}
                </span>
              </div>

              <div className="p-4 rounded-[18px] bg-[#1C3B36] text-white">
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-white/65 block">
                  С пакетом минут
                </span>
                <div className="font-display text-2xl font-bold text-[#6BFF91] tracking-[-0.03em] tabular-nums mt-1">
                  ~{optimizedCostByn} BYN
                </div>
                <span className="text-[11.5px] text-white/80">
                  {monthlySavingsByn > 0
                    ? `Экономия ${monthlySavingsByn} BYN/мес`
                    : 'На малом объёме выгоднее постоплата'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-[16px] bg-white border border-black/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[12.5px] text-black">
            <span className="text-[#404040]">
              {estimatedMonthlyMinutes >= 300
                ? `На объёме ~${estimatedMonthlyMinutes} мин/мес выгоднее пакет по ${recommendedRate.toFixed(2)} BYN/мин.`
                : `При ${callsPerDay} звонках в день можно ничего не покупать вперёд — пользуйтесь постоплатой.`}
            </span>
            {estimatedMonthlyMinutes >= 300 && (
              <a
                href="#payment-section"
                onClick={() => setSelectedTarget(estimatedMonthlyMinutes >= 1000 ? 'pack_1000' : 'pack_300')}
                className="font-semibold text-black underline underline-offset-4 shrink-0"
              >
                Выбрать пакет ↓
              </a>
            )}
          </div>
        </section>
      </div>

      {/* 3. Unified Payment Section */}
      <section
        id="payment-section"
        className="p-6 sm:p-7 rounded-[24px] bg-white border border-black/[0.08] space-y-5 scroll-mt-20"
      >
        <div>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#737373]">
            Оплата онлайн · bePaid
          </span>
          <h2 className="font-display text-lg sm:text-xl font-bold text-black tracking-[-0.025em] mt-0.5">
            Пополнение минут со скидкой и оплата месяца
          </h2>
          <p className="text-[12.5px] text-[#525252] mt-1">
            Купленные в пакете минуты начисляются мгновенно и расходуются первыми — пока они есть, ежемесячный счёт остаётся 0 BYN.
          </p>
        </div>

        {errorMsg && (
          <div role="alert" className="p-4 rounded-[16px] bg-[#FFF5F3] border border-[#FE432A]/40 text-[#991B1B] text-[13px] font-medium">
            {errorMsg}
          </div>
        )}

        {/* 4 Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
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
                className={`p-5 rounded-[20px] border text-left transition-colors flex flex-col justify-between gap-3 cursor-pointer ${
                  isSelected
                    ? 'bg-[#0A0A0A] text-white border-black'
                    : 'bg-[#F5F5F5] hover:bg-[#EBEBEB] text-black border-black/[0.06]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1.5 mb-2">
                    <span className="text-[13px] font-bold">{pkg.name}</span>
                    <span
                      className={`font-mono text-[10.5px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                        isSelected ? 'bg-[#6BFF91] text-black' : 'bg-[#D8E738] text-black'
                      }`}
                    >
                      −{pkg.savingsPercent}%
                    </span>
                  </div>
                  <div className="font-display text-2xl font-bold tracking-[-0.03em] tabular-nums">
                    {pkg.priceByn} BYN
                  </div>
                  <div className={`text-[11.5px] mt-1 font-mono ${isSelected ? 'text-white/65' : 'text-[#525252]'}`}>
                    {pkg.ratePerMinute.toFixed(2)} BYN/мин · −{pkg.savingsByn} BYN
                  </div>
                </div>
              </button>
            );
          })}

          {/* Card 3: Custom Minutes */}
          <div
            onClick={() => {
              setSelectedTarget('custom');
              setErrorMsg(null);
            }}
            className={`p-5 rounded-[20px] border text-left transition-colors flex flex-col justify-between gap-2 cursor-pointer ${
              selectedTarget === 'custom'
                ? 'bg-[#0A0A0A] text-white border-black'
                : 'bg-[#F5F5F5] hover:bg-[#EBEBEB] text-black border-black/[0.06]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-1.5 mb-2">
                <label htmlFor="billing-custom-mins" className="text-[13px] font-bold cursor-pointer">
                  Свой объём
                </label>
                <span
                  className={`font-mono text-[10px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${
                    selectedTarget === 'custom' ? 'bg-white/15 text-[#D8E738]' : 'bg-white text-[#525252] border border-black/[0.08]'
                  }`}
                >
                  от 50 мин
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
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
                  className={`w-20 min-w-0 shrink-0 px-2.5 py-1.5 rounded-[10px] text-[13px] font-mono font-bold border focus:outline-none ${
                    !isCustomValid && customMinutes !== ''
                      ? 'border-[#FE432A] bg-[#FE432A]/15 text-[#FE432A]'
                      : selectedTarget === 'custom'
                      ? 'bg-white/10 text-white border-white/25'
                      : 'bg-white text-black border-black/[0.12]'
                  }`}
                  placeholder="100"
                />
                <span className="text-[12px] font-mono font-bold whitespace-nowrap tabular-nums">
                  = {isCustomValid ? `${customAmountByn.toFixed(2)} BYN` : 'мин. 50'}
                </span>
              </div>
              {!isCustomValid && customMinutes !== '' && (
                <p className="text-[11px] mt-1.5 font-medium text-[#FE432A]">
                  От 50 до 10 000 минут
                </p>
              )}
            </div>
          </div>

          {/* Card 4: Postpaid Invoice */}
          <button
            type="button"
            onClick={() => {
              setSelectedTarget('postpaid');
              setErrorMsg(null);
            }}
            className={`p-5 rounded-[20px] border text-left transition-colors flex flex-col justify-between gap-3 cursor-pointer ${
              selectedTarget === 'postpaid'
                ? 'bg-[#0A0A0A] text-white border-black'
                : 'bg-[#F5F5F5] hover:bg-[#EBEBEB] text-black border-black/[0.06]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-1.5 mb-2">
                <span className="text-[13px] font-bold">Счёт за месяц</span>
                <span
                  className={`font-mono text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    selectedTarget === 'postpaid' ? 'bg-white/15 text-white' : 'bg-white text-[#525252] border border-black/[0.08]'
                  }`}
                >
                  По факту
                </span>
              </div>
              <div className="font-display text-2xl font-bold tracking-[-0.03em] tabular-nums">
                {unpaidDebtByn.toFixed(2)} BYN
              </div>
              <div className={`text-[11.5px] mt-1 ${selectedTarget === 'postpaid' ? 'text-white/65' : 'text-[#525252]'}`}>
                {unpaidDebtByn >= 0.5 ? 'Досрочное погашение' : 'Сейчас к оплате 0 BYN'}
              </div>
            </div>
          </button>
        </div>

        {/* Step 2: Payment Method & Checkout Strip */}
        <div className="p-5 sm:p-6 rounded-[22px] bg-[#0A0A0A] text-white flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-white/55 mr-1">
              Способ:
            </span>
            <button
              type="button"
              aria-pressed={paymentMethod === 'card'}
              onClick={() => setPaymentMethod('card')}
              className={`h-10 px-4 rounded-full text-[12.5px] font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer border ${
                paymentMethod === 'card'
                  ? 'bg-[#6BFF91] text-black border-[#6BFF91]'
                  : 'bg-white/[0.08] text-white border-white/15 hover:bg-white/[0.15]'
              }`}
            >
              <CreditCardIcon size={16} />
              <span>Карта (БЕЛКАРТ, Visa, MC)</span>
            </button>

            <button
              type="button"
              aria-pressed={paymentMethod === 'erip'}
              onClick={() => setPaymentMethod('erip')}
              className={`h-10 px-4 rounded-full text-[12.5px] font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer border ${
                paymentMethod === 'erip'
                  ? 'bg-[#D8E738] text-black border-[#D8E738]'
                  : 'bg-white/[0.08] text-white border-white/15 hover:bg-white/[0.15]'
              }`}
            >
              <span className="font-mono px-1.5 py-0.5 rounded bg-black/15 text-[10px] font-bold">ЕРИП</span>
              <span>Система «Расчёт» (QR-код)</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="text-left sm:text-right">
              <div className="text-[11.5px] text-white/60">{activeTitle}</div>
              <div className="font-display text-xl font-bold text-white tabular-nums">
                {activeAmountByn.toFixed(2)} BYN
              </div>
            </div>

            <button
              type="button"
              onClick={handleActionSubmit}
              disabled={isProcessing || activeAmountByn < 0.5 || (selectedTarget === 'custom' && !isCustomValid)}
              className="h-11 px-6 rounded-full bg-[#D8E738] hover:bg-[#CFDF2E] text-black text-[13px] font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
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

        <div className="flex items-center gap-2.5 text-[12px] text-[#525252]">
          <ShieldCheckIcon size={16} className="text-black shrink-0" aria-hidden="true" />
          <span>
            Безопасные платежи в BYN через <strong className="text-black">bePaid</strong> (PCI DSS Level 1). Электронный чек сразу приходит на ваш email ({user.email || 'корпоративная почта'}).
          </span>
        </div>
      </section>

      {/* 4. Responsive Semantic Invoice Table */}
      {invoices.length > 0 && (
        <section className="p-6 sm:p-7 rounded-[24px] bg-white border border-black/[0.08] space-y-4">
          <div>
            <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#737373]">
              Расчётные периоды
            </span>
            <h2
              id="invoices-table-title"
              className="font-display text-lg font-bold text-black tracking-[-0.025em] mt-0.5"
            >
              История счетов по месяцам
            </h2>
          </div>

          <div
            tabIndex={0}
            role="region"
            aria-labelledby="invoices-table-title"
            className="voxi-table-region"
          >
            <table className="voxi-responsive-table text-left text-[13px]">
              <caption className="visually-hidden">
                История выставленных и текущих счетов компании в белорусских рублях
              </caption>
              <thead>
                <tr className="border-b border-black/[0.1] font-mono text-[10.5px] uppercase tracking-[0.1em] text-[#737373]">
                  <th scope="col" className="py-3 pr-4 font-semibold">Период / Счёт</th>
                  <th scope="col" className="py-3 px-4 font-semibold">Минуты</th>
                  <th scope="col" className="py-3 px-4 font-semibold">Итого</th>
                  <th scope="col" className="py-3 px-4 font-semibold">К оплате</th>
                  <th scope="col" className="py-3 pl-4 text-right font-semibold">Статус</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b border-black/[0.06] last:border-b-0 hover:bg-[#F5F5F5]/70 transition-colors"
                  >
                    <th scope="row" className="py-3.5 pr-4 font-semibold text-black whitespace-nowrap">
                      {inv.periodYm}{' '}
                      <span className="text-[#737373] font-mono text-[11px] font-normal">
                        ({inv.invoiceNumber})
                      </span>
                    </th>
                    <td data-label="Минуты" className="py-3.5 px-4 font-mono text-[#404040] whitespace-nowrap tabular-nums">
                      {inv.billableMinutes.toFixed(1)} мин
                    </td>
                    <td data-label="Итого" className="py-3.5 px-4 font-mono text-black whitespace-nowrap tabular-nums">
                      {inv.totalAmountByn.toFixed(2)} BYN
                    </td>
                    <td data-label="К оплате" className="py-3.5 px-4 font-mono font-bold text-black whitespace-nowrap tabular-nums">
                      {inv.remainingDueByn.toFixed(2)} BYN
                    </td>
                    <td data-label="Статус" className="py-3.5 pl-4 text-right whitespace-nowrap">
                      {inv.status === 'paid' ? (
                        <span className="font-mono text-[10.5px] font-bold px-2.5 py-1 rounded-full bg-[#6BFF91] text-black">
                          Оплачен
                        </span>
                      ) : inv.status === 'overdue' ? (
                        <span className="font-mono text-[10.5px] font-bold px-2.5 py-1 rounded-full bg-[#FE432A] text-white">
                          Просрочен
                        </span>
                      ) : inv.status === 'issued' ? (
                        <span className="font-mono text-[10.5px] font-bold px-2.5 py-1 rounded-full bg-[#D8E738] text-black">
                          Выставлен
                        </span>
                      ) : (
                        <span className="font-mono text-[10.5px] font-semibold px-2.5 py-1 rounded-full bg-[#F5F5F5] text-black border border-black/[0.08]">
                          Текущий
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};
