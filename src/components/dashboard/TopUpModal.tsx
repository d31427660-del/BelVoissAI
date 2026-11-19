import React, { useState, useEffect, useRef } from 'react';
import {
  CloseCircleIcon,
  WalletMoneyIcon,
  CheckCircleIcon,
  Card2Icon as CreditCardIcon,
  ShieldCheckIcon
} from '@solar-icons/react/bold-duotone';
import { MinutePackage, UserSession } from '../../types';
import { MINUTE_PACKAGES } from '../../lib/mockData';

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserSession;
  initialPackage?: MinutePackage | null;
  onSuccessTopUp: (minutesToAdd: number, amountByn: number) => void;
}

export const TopUpModal: React.FC<TopUpModalProps> = ({
  isOpen,
  onClose,
  user,
  initialPackage
}) => {
  const billing = user.billing;
  const invoices = billing?.invoices || [];
  const unpaidClosedInvoices = invoices.filter((inv) => inv.status === 'issued' || inv.status === 'overdue');
  const currentOpenInvoice = billing?.currentInvoice || invoices.find((inv) => inv.status === 'open') || null;
  const defaultTargetInvoice = unpaidClosedInvoices[0] || currentOpenInvoice;
  const unpaidDebtByn = billing?.unpaidDebtByn ?? 0;

  const [paymentMode, setPaymentMode] = useState<'postpaid_invoice' | 'advance_package'>(
    initialPackage || unpaidDebtByn < 0.5 ? 'advance_package' : 'postpaid_invoice'
  );
  const [selectedPackageId, setSelectedPackageId] = useState<string>(initialPackage?.id || 'pack_100');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(defaultTargetInvoice?.id || '');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'erip'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const target = unpaidClosedInvoices[0] || currentOpenInvoice;
    if (target && !invoices.some((i) => i.id === selectedInvoiceId && i.status !== 'paid')) {
      setSelectedInvoiceId(target.id);
    }
    if (initialPackage) {
      setPaymentMode('advance_package');
      setSelectedPackageId(initialPackage.id);
    }
  }, [isOpen, billing, initialPackage]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      setErrorMsg(null);
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (isProcessing) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const rect = dialog.getBoundingClientRect();
    const isOutside =
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom;
    if (isOutside) {
      onClose();
    }
  };

  const selectedInvoice =
    invoices.find((i) => i.id === selectedInvoiceId) || defaultTargetInvoice || null;
  const selectedPkg = MINUTE_PACKAGES.find((p) => p.id === selectedPackageId) || MINUTE_PACKAGES[0];
  const finalMinutes =
    paymentMode === 'advance_package'
      ? selectedPkg.minutes
      : selectedInvoice
      ? selectedInvoice.billableMinutes
      : 0;
  const finalAmountByn =
    paymentMode === 'advance_package'
      ? selectedPkg.priceByn
      : selectedInvoice
      ? selectedInvoice.remainingDueByn
      : 0;
  const finalRate =
    paymentMode === 'advance_package'
      ? selectedPkg.ratePerMinute
      : selectedInvoice
      ? selectedInvoice.ratePerMinute
      : (user.ratePerMinute || 0.45);
  const isEarlyPayment = paymentMode === 'advance_package' || selectedInvoice?.status === 'open';

  const handlePay = async () => {
    setErrorMsg(null);

    if (finalAmountByn < 0.5) {
      setErrorMsg(
        'Сейчас по текущему месяцу начислено 0.00 BYN. Выберите «Пакет минут», чтобы пополнить минуты со скидкой.'
      );
      return;
    }

    setIsProcessing(true);

    try {
      const payload: Record<string, unknown> = {
        paymentMethod
      };
      if (paymentMode === 'advance_package') {
        payload.packageId = selectedPackageId;
      } else {
        payload.invoiceId = selectedInvoice?.id || '';
        payload.payEarly = isEarlyPayment;
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
          'Платёжный шлюз bePaid временно недоступен. Пожалуйста, попробуйте позже или напишите в Telegram @voxi_manager.'
      );
    } catch {
      setErrorMsg('Не удалось связаться с платёжным сервером bePaid.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="topup-modal-title"
      onClose={onClose}
      onClick={handleBackdropClick}
      className="w-[calc(100%-1.5rem)] max-w-xl rounded-[16px] liquid-glass-card shadow-2xl overflow-hidden p-0 text-black backdrop:bg-black/50 backdrop:backdrop-blur-md open:animate-fadeIn m-auto"
    >
      <div className="max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-7 py-5 border-b border-black/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-slate-900 text-white flex items-center justify-center shrink-0" aria-hidden="true">
              <WalletMoneyIcon size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="topup-modal-title" className="text-base font-bold text-slate-900 tracking-tight">
                  Онлайн-оплата (Карта / ЕРИП)
                </h2>
              </div>
              <p className="text-xs text-slate-500">
                Накоплено за месяц: <strong className="text-slate-900 font-semibold">{(billing?.unpaidDebtByn ?? 0).toFixed(2)} BYN</strong> • Лимит: {(billing?.creditLimitByn ?? 100).toFixed(0)} BYN
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Закрыть окно оплаты"
            onClick={onClose}
            className="w-8 h-8 rounded-full liquid-glass-pill text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
          >
            <CloseCircleIcon size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-7 overflow-y-auto space-y-5">
          {isSuccess ? (
            <div className="py-10 text-center space-y-3" role="status">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircleIcon size={36} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Оплата принята!
              </h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Зачислено <strong className="text-slate-900 font-semibold">+{finalMinutes} минут</strong>.
              </p>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div role="alert" className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              {/* Postpaid Summary Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Баланс минут (пакет + бонус)</span>
                  <strong className="text-sm font-mono text-emerald-700">
                    {(billing?.freeMinutesRemaining ?? user.balanceMinutes ?? 0).toFixed(1)} мин
                  </strong>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Списываются до счёта месяца</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Телефонная линия</span>
                  <strong className="text-sm font-mono text-slate-900">
                    {(billing?.monthlySubscriptionByn ?? 0).toFixed(2)} BYN/мес
                  </strong>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    {billing?.numberRentalMode === 'own_sip' ? 'Свой SIP (0 BYN)' : 'Выделенный номер А1'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Закрытие периода</span>
                  <strong className="text-sm font-mono text-slate-900">1-го числа в 00:05</strong>
                  <span className="text-[10px] text-slate-500 block mt-0.5">7 дней на оплату без паузы</span>
                </div>
              </div>

              {/* Mode Switcher: Advance Package vs Monthly Invoice */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-slate-900 text-xs">
                    Что вы хотите оплатить:
                  </span>
                  <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMode('advance_package');
                        setErrorMsg(null);
                      }}
                      className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        paymentMode === 'advance_package'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Пакет минут (выгодно)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMode('postpaid_invoice');
                        setErrorMsg(null);
                      }}
                      className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        paymentMode === 'postpaid_invoice'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      По факту месяца ({unpaidDebtByn.toFixed(2)} BYN)
                    </button>
                  </div>
                </div>

                {paymentMode === 'advance_package' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {MINUTE_PACKAGES.map((pkg) => {
                      const isSelected = selectedPackageId === pkg.id;
                      return (
                        <button
                          key={pkg.id}
                          type="button"
                          onClick={() => setSelectedPackageId(pkg.id)}
                          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                              : 'bg-slate-50 hover:bg-white text-slate-900 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold">{pkg.name}</span>
                            {pkg.savingsPercent && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                isSelected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                −{pkg.savingsPercent}%
                              </span>
                            )}
                          </div>
                          <div className="text-base font-extrabold font-mono mt-1">
                            {pkg.minutes} мин
                          </div>
                          <div className={`text-[10px] font-mono ${isSelected ? 'text-zinc-300' : 'text-slate-500'}`}>
                            {pkg.priceByn} BYN ({pkg.ratePerMinute.toFixed(2)} BYN/мин)
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : invoices.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                    Текущий расчётный период открыт ({unpaidDebtByn.toFixed(2)} BYN). Для покупки пакета со скидкой выберите «Пакет минут».
                  </div>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {invoices.map((inv) => {
                      const isSelected = selectedInvoice?.id === inv.id;
                      const isPaid = inv.status === 'paid';
                      const statusLabel =
                        inv.status === 'paid'
                          ? 'Оплачен'
                          : inv.status === 'overdue'
                          ? `Просрочен (до ${inv.dueDate})`
                          : inv.status === 'issued'
                          ? `К оплате (до ${inv.dueDate})`
                          : 'Текущий месяц (досрочно)';
                      const statusColor =
                        inv.status === 'paid'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : inv.status === 'overdue'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : inv.status === 'issued'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200';

                      return (
                        <button
                          key={inv.id}
                          type="button"
                          disabled={isPaid}
                          onClick={() => setSelectedInvoiceId(inv.id)}
                          className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center justify-between gap-3 ${
                            isPaid
                              ? 'bg-slate-50 border-slate-200 opacity-70 cursor-default'
                              : isSelected
                              ? 'bg-slate-900 text-white border-slate-900 shadow-sm cursor-pointer'
                              : 'bg-white border-slate-200 hover:border-slate-300 cursor-pointer'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-semibold font-mono">{inv.periodYm}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                isSelected && !isPaid ? 'bg-white/15 text-white border-white/20' : statusColor
                              }`}>
                                {statusLabel}
                              </span>
                            </div>
                            <div className={`text-[11px] mt-1 font-mono ${isSelected && !isPaid ? 'text-white/75' : 'text-slate-500'}`}>
                              {inv.billableMinutes} мин × {inv.ratePerMinute.toFixed(2)} + {inv.subscriptionFeeByn.toFixed(2)} линия
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm font-bold font-mono">
                              {isPaid ? `${inv.totalAmountByn.toFixed(2)} BYN` : `${inv.remainingDueByn.toFixed(2)} BYN`}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Payment Methods: Only Card & ERIP */}
              <div className="space-y-2.5">
                <span className="font-semibold text-slate-900 text-xs block">
                  Способ онлайн-оплаты (через bePaid):
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    aria-pressed={paymentMethod === 'card'}
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                      paymentMethod === 'card'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 hover:bg-white text-slate-900 border-slate-200'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      paymentMethod === 'card' ? 'bg-white/15 text-white' : 'bg-white border border-slate-200 text-slate-900'
                    }`}>
                      <CreditCardIcon size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight">Банковская карта</div>
                      <div className={`text-[10px] mt-0.5 ${paymentMethod === 'card' ? 'text-white/70' : 'text-slate-500'}`}>
                        БЕЛКАРТ, Visa, Mastercard
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    aria-pressed={paymentMethod === 'erip'}
                    onClick={() => setPaymentMethod('erip')}
                    className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                      paymentMethod === 'erip'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 hover:bg-white text-slate-900 border-slate-200'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      paymentMethod === 'erip' ? 'bg-white/15 text-white' : 'bg-amber-100 text-amber-900'
                    }`}>
                      <span className="text-[11px] font-extrabold">ЕРИП</span>
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight">Система «Расчёт» (ЕРИП)</div>
                      <div className={`text-[10px] mt-0.5 ${paymentMethod === 'erip' ? 'text-white/70' : 'text-slate-500'}`}>
                        Оплата по QR-коду в банке
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Order Summary & Security Note */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">Объём голосовых минут:</span>
                  <span className="font-bold text-slate-900 font-mono">{finalMinutes.toFixed(0)} мин</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">Стоимость минуты:</span>
                  <span className="text-slate-600 font-mono">{finalRate.toFixed(2)} BYN / мин</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="text-sm font-semibold text-slate-900">
                    Итого к оплате:
                  </span>
                  <span className="text-2xl font-extrabold font-mono text-slate-900">
                    {finalAmountByn.toFixed(2)} BYN
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <ShieldCheckIcon size={15} className="text-emerald-600 shrink-0" aria-hidden="true" />
                <span>Безопасный приём платежей обеспечивает <strong>bePaid</strong> (PCI DSS Level 1).</span>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!isSuccess && (
          <div className="p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-5 h-10 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Отмена
            </button>

            <button
              type="button"
              onClick={handlePay}
              disabled={isProcessing}
              className="flex-1 sm:flex-initial px-7 h-11 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer active:scale-[0.98]"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Переход в bePaid...</span>
                </>
              ) : (
                <>
                  <WalletMoneyIcon size={16} aria-hidden="true" />
                  <span>
                    {paymentMethod === 'erip'
                      ? `Оплатить ${finalAmountByn.toFixed(2)} BYN через ЕРИП`
                      : `Оплатить ${finalAmountByn.toFixed(2)} BYN картой`}
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </dialog>
  );
};
