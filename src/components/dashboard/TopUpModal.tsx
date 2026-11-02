import React, { useState, useEffect, useRef } from 'react';
import { 
  CloseCircleIcon, 
  WalletMoneyIcon, 
  CheckCircleIcon, 
  FlameIcon,
  Card2Icon as CreditCardIcon,
  BillCheckIcon as ReceiptIcon,
  ShieldCheckIcon
} from '@solar-icons/react/bold-duotone';
import { MINUTE_PACKAGES } from '../../lib/mockData';
import { MinutePackage, UserSession } from '../../types';

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
  initialPackage,
  onSuccessTopUp
}) => {
  const [selectedPackageId, setSelectedPackageId] = useState<string>(
    initialPackage ? initialPackage.id : 'pack_300'
  );
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customMinutes, setCustomMinutes] = useState<number>(200);
  const [paymentMethod, setPaymentMethod] = useState<'erip' | 'card' | 'bank_invoice'>('erip');
  const [unpInput, setUnpInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [invoiceReady, setInvoiceReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (initialPackage) {
      setSelectedPackageId(initialPackage.id);
      setIsCustomMode(false);
    }
  }, [initialPackage]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      setErrorMsg(null);
      setInvoiceReady(false);
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

  const currentPkg = MINUTE_PACKAGES.find(p => p.id === selectedPackageId) || MINUTE_PACKAGES[1];

  const getCustomRate = (mins: number) => {
    if (mins >= 1000) return 0.35;
    if (mins >= 300) return 0.40;
    return 0.45;
  };

  const finalMinutes = isCustomMode ? customMinutes : currentPkg.minutes;
  const finalAmountByn = isCustomMode 
    ? Math.round(customMinutes * getCustomRate(customMinutes))
    : currentPkg.priceByn;
  const finalRate = isCustomMode ? getCustomRate(customMinutes) : currentPkg.ratePerMinute;

  const triggerConfetti = async () => {
    try {
      const { default: confetti } = await import('canvas-confetti');
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#2563eb', '#10b981', '#3b82f6', '#f59e0b']
      });
    } catch {
      // ignore if canvas unavailable
    }
  };

  const handlePay = async () => {
    setErrorMsg(null);

    if (paymentMethod === 'bank_invoice') {
      setInvoiceReady(true);
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch('/api/bepaid-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: isCustomMode ? null : currentPkg.id,
          customMinutes: isCustomMode ? customMinutes : null,
          paymentMethod,
          userId: user.id,
          email: user.email,
          companyName: user.companyName,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.redirectUrl) {
          window.location.href = data.redirectUrl;
          return;
        }
      }

      // If user is in explicit demo-sandbox mode and bePaid keys aren't added yet, allow sandbox simulation
      if (user.isMock) {
        setIsProcessing(false);
        setIsSuccess(true);
        triggerConfetti();

        setTimeout(() => {
          onSuccessTopUp(finalMinutes, finalAmountByn);
          setIsSuccess(false);
          onClose();
        }, 1400);
        return;
      }

      const errData = await response.json().catch(() => ({}));
      setErrorMsg(
        errData?.message ||
          errData?.error ||
          'Платёжный шлюз bePaid временно недоступен. Пожалуйста, выберите безналичный счёт или напишите в @voxi_support.'
      );
    } catch {
      if (user.isMock) {
        setIsSuccess(true);
        triggerConfetti();
        setTimeout(() => {
          onSuccessTopUp(finalMinutes, finalAmountByn);
          setIsSuccess(false);
          onClose();
        }, 1400);
      } else {
        setErrorMsg('Не удалось связаться с платёжным сервером bePaid.');
      }
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
      className="w-full max-w-xl rounded-[40px] bg-white border border-slate-200 shadow-2xl overflow-hidden p-0 text-slate-900 backdrop:bg-black/60 backdrop:backdrop-blur-sm open:animate-fadeIn m-auto"
    >
      <div className="max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-7 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-[#2563eb]" aria-hidden="true">
              <WalletMoneyIcon size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="topup-modal-title" className="text-base font-bold text-slate-900 tracking-tight">
                  Пополнение баланса минут
                </h2>
                {user.isMock && (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    Демо-режим
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600">
                Текущий баланс: <strong className="text-slate-900 font-semibold">{user.balanceMinutes} мин</strong> (~{(user.balanceMinutes * user.ratePerMinute).toFixed(1)} BYN)
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Закрыть окно пополнения"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors"
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
                Демо-баланс пополнен!
              </h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                В ознакомительном режиме зачислено <strong className="text-emerald-700 font-semibold">+{finalMinutes} минут</strong>. При боевых платежах переадресация выполняется на защищённый шлюз <strong>bePaid</strong>.
              </p>
            </div>
          ) : invoiceReady ? (
            <div className="p-5 rounded-3xl bg-blue-50/70 border border-blue-200 space-y-3 text-xs text-slate-800">
              <div className="flex items-center gap-2 font-bold text-sm text-[#1d4ed8]">
                <CheckCircleIcon size={18} />
                <span>Заявка на счёт-фактуру сформирована</span>
              </div>
              <p className="leading-relaxed">
                Реквизиты Исполнителя для договора и счёта: <strong>ИП Беляков Кирилл Олегович, УНП 193991846</strong> (г. Минск, ул. Наполеона Орды, 11-58, без НДС).
              </p>
              <p className="leading-relaxed">
                Сумма к оплате: <strong>{finalAmountByn} BYN</strong> за пакет <strong>{finalMinutes} минут</strong>{unpInput ? ` (УНП Заказчика: ${unpInput})` : ''}. Отправьте карточку реквизитов на <a href="mailto:info@voxi.by" className="text-[#2563eb] underline font-semibold">info@voxi.by</a> или в Telegram <a href="https://t.me/voxi_support" target="_blank" rel="noopener noreferrer" className="text-[#2563eb] underline font-semibold">@voxi_support</a> для мгновенного выставления счёта и акта в ЭДиН.
              </p>
              <button
                type="button"
                onClick={() => setInvoiceReady(false)}
                className="px-4 py-2 rounded-xl bg-white border border-blue-200 text-[#2563eb] font-semibold hover:bg-blue-50 transition-colors"
              >
                Вернуться к способам оплаты
              </button>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div role="alert" className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              {/* Packages Selector */}
              <div>
                <div className="flex items-center justify-between mb-3 text-xs">
                  <span className="font-semibold text-slate-800">Выберите пакет минут:</span>
                  <button
                    type="button"
                    onClick={() => setIsCustomMode(!isCustomMode)}
                    className="text-[#2563eb] hover:underline font-medium"
                  >
                    {isCustomMode ? 'Выбрать готовый пакет' : 'Указать свое количество'}
                  </button>
                </div>

                {!isCustomMode ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {MINUTE_PACKAGES.map((pkg) => {
                      const isSelected = selectedPackageId === pkg.id;
                      return (
                        <button
                          key={pkg.id}
                          type="button"
                          onClick={() => setSelectedPackageId(pkg.id)}
                          aria-pressed={isSelected}
                          className={`cursor-pointer p-4 rounded-3xl border transition-all text-left relative flex flex-col justify-between ${
                            isSelected
                              ? 'bg-blue-50/70 border-[#2563eb] shadow-sm ring-2 ring-[#2563eb]/20'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {pkg.savingsPercent && (
                            <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center gap-0.5 shadow-xs">
                              <FlameIcon size={11} />
                              −{pkg.savingsPercent}%
                            </span>
                          )}

                          <div>
                            <span className="text-[11px] font-semibold text-slate-600 block mb-0.5">
                              {pkg.name}
                            </span>
                            <div className="text-lg font-bold text-slate-900">
                              {pkg.minutes} мин
                            </div>
                            <div className="text-[11px] text-slate-600 mt-1">
                              {pkg.ratePerMinute.toFixed(2)} BYN / мин
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-baseline justify-between w-full">
                            <span className="text-base font-extrabold text-[#2563eb]">
                              {pkg.priceByn} BYN
                            </span>
                            {isSelected && (
                              <CheckCircleIcon size={16} className="text-[#2563eb]" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <label htmlFor="custom-minutes-range" className="text-slate-700 font-medium">
                        Количество минут:
                      </label>
                      <span className="font-bold text-[#2563eb] text-sm bg-blue-100/80 px-3 py-0.5 rounded-full font-mono">
                        {customMinutes} мин
                      </span>
                    </div>
                    <input
                      id="custom-minutes-range"
                      type="range"
                      min="50"
                      max="1500"
                      step="25"
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#2563eb]"
                    />
                    <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                      <span>50 мин</span>
                      <span>500 мин</span>
                      <span>1 500 мин</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Methods (bePaid ERIP, Card, Invoice for Legal Entities) */}
              <div className="space-y-3">
                <span className="font-semibold text-slate-800 text-xs block">
                  Способ оплаты (через bePaid / Беларусь):
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    aria-pressed={paymentMethod === 'erip'}
                    onClick={() => setPaymentMethod('erip')}
                    className={`p-3.5 rounded-2xl border text-left flex items-start gap-2.5 transition-all ${
                      paymentMethod === 'erip'
                        ? 'bg-blue-50/70 border-[#2563eb] text-[#2563eb]'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      <span className="text-xs font-black text-slate-800">ЕРИП</span>
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight">ЕРИП (bePaid)</div>
                      <div className="text-[10px] text-slate-600 mt-0.5">QR-код / АИС «Расчет»</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    aria-pressed={paymentMethod === 'card'}
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3.5 rounded-2xl border text-left flex items-start gap-2.5 transition-all ${
                      paymentMethod === 'card'
                        ? 'bg-blue-50/70 border-[#2563eb] text-[#2563eb]'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-slate-700">
                      <CreditCardIcon size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight">Карта (bePaid)</div>
                      <div className="text-[10px] text-slate-600 mt-0.5">БЕЛКАРТ, Visa, MC</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    aria-pressed={paymentMethod === 'bank_invoice'}
                    onClick={() => setPaymentMethod('bank_invoice')}
                    className={`p-3.5 rounded-2xl border text-left flex items-start gap-2.5 transition-all ${
                      paymentMethod === 'bank_invoice'
                        ? 'bg-blue-50/70 border-[#2563eb] text-[#2563eb]'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-slate-700">
                      <ReceiptIcon size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight">Безнал (ИП / ООО)</div>
                      <div className="text-[10px] text-slate-600 mt-0.5">Счёт в BYN и акт</div>
                    </div>
                  </button>
                </div>

                {paymentMethod === 'bank_invoice' && (
                  <div className="pt-1">
                    <label htmlFor="invoice-unp" className="block text-[11px] font-medium text-slate-700 mb-1">
                      УНП вашей организации или ИП (необязательно):
                    </label>
                    <input
                      id="invoice-unp"
                      type="text"
                      inputMode="numeric"
                      maxLength={9}
                      value={unpInput}
                      onChange={(e) => setUnpInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="Напр. 193991846"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:bg-white focus:border-[#2563eb]"
                    />
                  </div>
                )}
              </div>

              {/* Order Summary & Security Note */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">К зачислению на баланс:</span>
                  <span className="font-bold text-slate-900 font-mono">+{finalMinutes} минут</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">Тариф за минуту:</span>
                  <span className="text-slate-700 font-mono">{finalRate.toFixed(2)} BYN / мин</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="text-sm font-semibold text-slate-900">К оплате (без НДС):</span>
                  <span className="text-2xl font-black text-[#2563eb]">
                    {finalAmountByn} BYN
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-600">
                <ShieldCheckIcon size={15} className="text-emerald-600 shrink-0" aria-hidden="true" />
                <span>Безопасный приём платежей обеспечивает <strong>bePaid</strong> (PCI DSS Level 1). Минуты не сгорают в конце месяца.</span>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!isSuccess && !invoiceReady && (
          <div className="p-5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Отмена
            </button>

            <button
              type="button"
              onClick={handlePay}
              disabled={isProcessing}
              className="flex-1 sm:flex-initial px-7 py-3 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-60"
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
                    {paymentMethod === 'bank_invoice'
                      ? `Сформировать счёт на ${finalAmountByn} BYN`
                      : user.isMock
                      ? `Протестировать оплату (${finalAmountByn} BYN)`
                      : `Оплатить ${finalAmountByn} BYN через bePaid`}
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
