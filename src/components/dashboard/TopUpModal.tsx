import React, { useState, useEffect, useRef } from 'react';
import { 
  CloseCircleIcon, 
  WalletMoneyIcon, 
  CheckCircleIcon, 
  FlameIcon,
  Card2Icon as CreditCardIcon,
  BillCheckIcon as ReceiptIcon,
  ShieldCheckIcon,
  PrinterIcon,
  DownloadMinimalisticIcon as DownloadIcon,
  CopyIcon,
  AltArrowLeftIcon as ArrowLeftIcon
} from '@solar-icons/react/bold-duotone';
import { MINUTE_PACKAGES } from '../../lib/mockData';
import { MinutePackage, UserSession } from '../../types';

function escapeHtml(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function generateInvoiceHtml(params: {
  invoiceNo: string;
  invoiceDate: string;
  companyName: string;
  unp?: string;
  userEmail: string;
  minutes: number;
  ratePerMinute: number;
  totalByn: number;
}): string {
  const { invoiceNo, invoiceDate, companyName, unp, userEmail, minutes, ratePerMinute, totalByn } = params;
  const safeInvoiceNo = escapeHtml(invoiceNo);
  const safeInvoiceDate = escapeHtml(invoiceDate);
  const safeCompanyName = escapeHtml(companyName);
  const safeUnp = unp ? escapeHtml(unp) : '';
  const safeUserEmail = userEmail ? escapeHtml(userEmail) : '';

  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>Счёт на оплату № ${safeInvoiceNo}</title>
<style>
  body { font-family: Arial, "Helvetica Neue", sans-serif; font-size: 10pt; line-height: 1.35; color: #111; margin: 30px; }
  .header-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 9.5pt; }
  .header-table td { border: 1px solid #444; padding: 5px 8px; vertical-align: top; }
  h1 { font-size: 14pt; margin: 18px 0 8px 0; font-weight: bold; text-align: left; }
  .meta-line { font-size: 10pt; margin-bottom: 5px; }
  .goods-table { width: 100%; border-collapse: collapse; margin-top: 14px; margin-bottom: 14px; font-size: 9.5pt; }
  .goods-table th, .goods-table td { border: 1px solid #333; padding: 6px 8px; }
  .goods-table th { background: #f2f2f2; text-align: center; }
  .text-right { text-align: right; }
  .text-center { text-align: center; }
  .total-block { margin-top: 12px; font-size: 10.5pt; }
  .notice { font-size: 8.5pt; color: #444; margin-top: 20px; border-top: 1px solid #ccc; padding-top: 8px; }
  .sign-table { width: 100%; margin-top: 35px; }
  .sign-table td { width: 50%; vertical-align: top; font-size: 9.5pt; }
  @media print {
    body { margin: 10mm; }
  }
</style>
</head>
<body>
<table class="header-table">
  <tr>
    <td colspan="2" rowspan="2">
      ЗАО «Альфа-Банк», г. Минск, ул. Сурганова, 43<br>
      <small style="color: #666;">Банк получателя</small>
    </td>
    <td style="width: 15%;">БИК</td>
    <td style="width: 30%;"><strong>ALFABY2X</strong></td>
  </tr>
  <tr>
    <td>Сч. №</td>
    <td>30132G19399184600000</td>
  </tr>
  <tr>
    <td style="width: 25%;">УНП <strong>193991846</strong></td>
    <td style="width: 30%;">ОКПО —</td>
    <td rowspan="2">Сч. №</td>
    <td rowspan="2"><strong>BY88ALFA30132G19399184600000</strong></td>
  </tr>
  <tr>
    <td colspan="2">
      <strong>ИП Беляков Кирилл Олегович</strong><br>
      <small style="color: #666;">Получатель</small>
    </td>
  </tr>
</table>

<h1>СЧЁТ НА ОПЛАТУ № ${safeInvoiceNo} от ${safeInvoiceDate} г.</h1>
<hr style="border: 0; border-top: 2px solid #2563eb; margin-bottom: 12px;">

<div class="meta-line"><strong>Поставщик (Исполнитель):</strong> ИП Беляков Кирилл Олегович, УНП 193991846, 220045, Республика Беларусь, г. Минск, ул. Наполеона Орды, д. 11, кв. 58</div>
<div class="meta-line"><strong>Покупатель (Заказчик):</strong> ${safeCompanyName}${safeUnp ? `, УНП: ${safeUnp}` : ''}${safeUserEmail ? `, email: ${safeUserEmail}` : ''}</div>
<div class="meta-line"><strong>Основание:</strong> Публичный договор (оферта) возмездного оказания услуг Voxi.by (ОКЭД 62010)</div>

<table class="goods-table">
  <thead>
    <tr>
      <th style="width: 5%;">№</th>
      <th>Товары (работы, услуги)</th>
      <th style="width: 10%;">Кол-во</th>
      <th style="width: 8%;">Ед.</th>
      <th style="width: 15%;">Цена (BYN)</th>
      <th style="width: 15%;">Сумма (BYN)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="text-center">1</td>
      <td>Предоставление доступа к облачной платформе голосовых ИИ-ассистентов Voxi.by (пакет ${minutes} минут диалогов)</td>
      <td class="text-center">${minutes}</td>
      <td class="text-center">мин.</td>
      <td class="text-right">${ratePerMinute.toFixed(2)}</td>
      <td class="text-right"><strong>${totalByn.toFixed(2)}</strong></td>
    </tr>
  </tbody>
</table>

<div class="total-block text-right">
  <div><strong>Итого без НДС:</strong> ${totalByn.toFixed(2)} BYN</div>
  <div><strong>Ставка НДС:</strong> Без НДС (гл. 32 НК РБ, упрощённая система налогообложения)</div>
  <div style="font-size: 12pt; margin-top: 6px;"><strong>Всего к оплате: ${totalByn.toFixed(2)} белорусских рублей</strong></div>
</div>

<div style="margin-top: 14px; font-size: 10pt;">
  Всего наименований 1, на сумму <strong>${totalByn.toFixed(2)} BYN</strong> (Без НДС).
</div>

<div class="notice">
  <strong>Условия оплаты и поставки:</strong><br>
  1. Оплата данного счёта означает согласие с условиями Публичного договора (оферты), размещённого на сайте https://voxi.by/offer.<br>
  2. Срок оплаты — в течение 5 (пяти) банковских дней с даты выставления.<br>
  3. Назначение платежа: <em>«Оплата по счёту № ${safeInvoiceNo} от ${safeInvoiceDate} за пакет минут Voxi.by без НДС»</em>.<br>
  4. По факту оказания услуг первичный учётный документ (акт) составляется единолично Исполнителем (постановление Минфина РБ № 13) и направляется через сервис электронного документооборота ЭДиН либо на email Заказчика.
</div>

<table class="sign-table">
  <tr>
    <td>
      <strong>Исполнитель:</strong><br><br><br>
      _______________________ / К.О. Беляков /
    </td>
    <td>
      <strong>Заказчик:</strong><br><br><br>
      _______________________ / ________________ /
    </td>
  </tr>
</table>
</body>
</html>`;
}

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
    initialPackage && initialPackage.id !== 'custom' ? initialPackage.id : 'pack_300'
  );
  const [isCustomMode, setIsCustomMode] = useState<boolean>(initialPackage?.id === 'custom');
  const [customMinutes, setCustomMinutes] = useState<number>(
    initialPackage?.id === 'custom' ? initialPackage.minutes : 200
  );
  const [paymentMethod, setPaymentMethod] = useState<'erip' | 'card' | 'bank_invoice'>('erip');
  const [unpInput, setUnpInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [invoiceReady, setInvoiceReady] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [copiedRequisites, setCopiedRequisites] = useState(false);
  const [invoiceDocNotice, setInvoiceDocNotice] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!initialPackage) return;
    if (initialPackage.id === 'custom') {
      setIsCustomMode(true);
      setCustomMinutes(initialPackage.minutes);
    } else {
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

  const getInvoiceParams = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const invoiceDate = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()}`;
    return {
      invoiceNo: invoiceNumber || `VX-${Date.now().toString().slice(-6)}`,
      invoiceDate,
      companyName: user.companyName || 'ООО / ИП',
      unp: unpInput.trim() || undefined,
      userEmail: user.email || '',
      minutes: finalMinutes,
      ratePerMinute: finalRate,
      totalByn: finalAmountByn
    };
  };

  const handlePrintInvoice = () => {
    const params = getInvoiceParams();
    const html = generateInvoiceHtml(params);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 350);
    }
  };

  const handleDownloadInvoiceDoc = () => {
    const params = getInvoiceParams();
    const html = generateInvoiceHtml(params);
    const blob = new Blob(['\uFEFF' + html], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Schet_${params.invoiceNo}_Voxi.doc`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    setInvoiceDocNotice(true);
    setTimeout(() => setInvoiceDocNotice(false), 3500);
  };

  const handleCopyRequisites = () => {
    const params = getInvoiceParams();
    const text = [
      `Счёт на оплату: № ${params.invoiceNo} от ${params.invoiceDate} г.`,
      `Получатель: ИП Беляков Кирилл Олегович`,
      `УНП получателя: 193991846`,
      `Расчётный счёт (IBAN): BY88ALFA30132G19399184600000`,
      `Банк: ЗАО «Альфа-Банк», г. Минск, БИК ALFABY2X`,
      `Сумма к оплате: ${finalAmountByn}.00 BYN (без НДС)`,
      `Плательщик: ${user.companyName}${unpInput ? ` (УНП ${unpInput})` : ''}`,
      `Назначение платежа: Оплата по счёту № ${params.invoiceNo} от ${params.invoiceDate} за пакет ${finalMinutes} минут Voxi.by (без НДС)`
    ].join('\n');

    navigator.clipboard?.writeText(text);
    setCopiedRequisites(true);
    setTimeout(() => setCopiedRequisites(false), 2500);
  };

  const handlePay = async () => {
    setErrorMsg(null);

    if (paymentMethod === 'bank_invoice') {
      const num = `VX-${Date.now().toString().slice(-6)}`;
      setInvoiceNumber(num);
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
        }),
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
          'Платёжный шлюз bePaid временно недоступен. Пожалуйста, выберите безналичный счёт или напишите в @voxi_support.'
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
            <div className="w-10 h-10 rounded-[10px] bg-black text-white flex items-center justify-center shrink-0" aria-hidden="true">
              <WalletMoneyIcon size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="topup-modal-title" className="text-base font-medium text-black tracking-tight">
                  Пополнение баланса минут
                </h2>
              </div>
              <p className="text-xs text-[#59544F]">
                Текущий баланс: <strong className="text-black font-medium">{user.balanceMinutes || 0} мин</strong> (~{((user.balanceMinutes || 0) * (user.ratePerMinute || 0.45)).toFixed(1)} BYN)
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Закрыть окно пополнения"
            onClick={onClose}
            className="w-8 h-8 rounded-full liquid-glass-pill text-[#777169] hover:text-black flex items-center justify-center transition-colors cursor-pointer"
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
              <h3 className="text-xl font-medium text-black">
                Демо-баланс пополнен!
              </h3>
              <p className="text-xs text-[#59544F] max-w-sm mx-auto font-normal">
                В ознакомительном режиме зачислено <strong className="text-black font-semibold">+{finalMinutes} минут</strong>. При боевых платежах переадресация выполняется на защищённый шлюз <strong>bePaid</strong>.
              </p>
            </div>
          ) : invoiceReady ? (
            <div className="space-y-4">
              <div className="p-5 rounded-[12px] liquid-glass-cream border border-black/[0.08] space-y-3.5 text-xs text-black">
                <div className="flex items-center justify-between gap-2 border-b border-black/[0.06] pb-3">
                  <div className="flex items-center gap-2 font-medium text-sm text-black">
                    <CheckCircleIcon size={18} />
                    <span>Счёт на оплату № {invoiceNumber || 'VX-001'}</span>
                  </div>
                  <span className="text-[11px] font-mono liquid-glass-pill text-black px-2 py-0.5 rounded-full font-medium">
                    от {new Date().toLocaleDateString('ru-RU')} г.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <span className="text-[#777169] block">Плательщик (Заказчик):</span>
                    <strong className="text-black font-medium">{user.companyName || 'Организация'}</strong>
                    {unpInput && <span className="block text-slate-600 font-mono">УНП: {unpInput}</span>}
                  </div>
                  <div>
                    <span className="text-slate-500 block">Получатель (Исполнитель):</span>
                    <strong className="text-slate-900 font-semibold">ИП Беляков К.О.</strong>
                    <span className="block text-slate-600 font-mono">УНП: 193991846</span>
                  </div>
                </div>

                {/* Банковские реквизиты */}
                <div className="p-3 rounded-2xl bg-white border border-blue-200/70 space-y-1 font-mono text-[11px] text-slate-800 select-all">
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-sans mb-1 border-b border-slate-100 pb-1">
                    <span>Реквизиты для перечисления в Клиент-Банке:</span>
                    <span className="text-blue-600 font-semibold">без НДС</span>
                  </div>
                  <div><strong>IBAN:</strong> BY88ALFA30132G19399184600000</div>
                  <div><strong>Банк:</strong> ЗАО «Альфа-Банк», г. Минск, БИК: ALFABY2X</div>
                  <div><strong>Назначение:</strong> Оплата по счёту № {invoiceNumber} за пакет {finalMinutes} мин Voxi.by</div>
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-slate-600">Сумма к оплате:</span>
                  <span className="text-xl font-black text-[#2563eb]">
                    {finalAmountByn}.00 BYN
                  </span>
                </div>
              </div>

              {/* Status notifications */}
              {copiedRequisites && (
                <div role="status" className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium flex items-center gap-2">
                  <CheckCircleIcon size={14} className="text-emerald-600 shrink-0" />
                  <span>Реквизиты счёта и назначение платежа скопированы в буфер обмена!</span>
                </div>
              )}

              {invoiceDocNotice && (
                <div role="status" className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium flex items-center gap-2">
                  <CheckCircleIcon size={14} className="text-emerald-600 shrink-0" />
                  <span>Счёт на оплату (.doc) успешно скачан для отправки в бухгалтерию.</span>
                </div>
              )}

              {/* Action Buttons: Print, Download .doc, Copy */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handlePrintInvoice}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <PrinterIcon size={16} />
                  <span>Печать / PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadInvoiceDoc}
                  className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <DownloadIcon size={16} />
                  <span>Скачать .doc</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyRequisites}
                  className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <CopyIcon size={16} />
                  <span>{copiedRequisites ? 'Скопировано!' : 'Реквизиты'}</span>
                </button>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setInvoiceReady(false)}
                  className="text-slate-500 hover:text-slate-800 font-medium inline-flex items-center gap-1 underline"
                >
                  <ArrowLeftIcon size={14} />
                  <span>Изменить пакет или способ оплаты</span>
                </button>
                <span className="text-[11px] text-slate-600">Электронный акт через ЭДиН</span>
              </div>
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
                  <span className="font-medium text-black">Выберите пакет минут:</span>
                  <button
                    type="button"
                    onClick={() => setIsCustomMode(!isCustomMode)}
                    className="text-black hover:underline font-normal cursor-pointer"
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
                          className={`cursor-pointer p-4 rounded-[12px] transition-all text-left relative flex flex-col justify-between ${
                            isSelected
                              ? 'bg-black text-white shadow-md'
                              : 'liquid-glass-cream text-black hover:border-black/20'
                          }`}
                        >
                          {pkg.savingsPercent && (
                            <span className={`absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-normal flex items-center gap-0.5 shadow-xs ${
                              isSelected ? 'bg-white text-black' : 'liquid-glass-btn-primary text-white'
                            }`}>
                              <FlameIcon size={11} />
                              −{pkg.savingsPercent}%
                            </span>
                          )}

                          <div>
                            <span className={`text-[11px] font-normal block mb-0.5 ${isSelected ? 'text-white/70' : 'text-[#777169]'}`}>
                              {pkg.name}
                            </span>
                            <div className={`text-lg font-medium tracking-tight ${isSelected ? 'text-white' : 'text-black'}`}>
                              {pkg.minutes} мин
                            </div>
                            <div className={`text-[11px] mt-1 font-mono ${isSelected ? 'text-white/70' : 'text-[#777169]'}`}>
                              {pkg.ratePerMinute.toFixed(2)} BYN / мин
                            </div>
                          </div>

                          <div className={`mt-4 pt-3 border-t flex items-baseline justify-between w-full ${
                            isSelected ? 'border-white/15' : 'border-black/[0.06]'
                          }`}>
                            <span className={`text-base font-medium ${isSelected ? 'text-white' : 'text-black'}`}>
                              {pkg.priceByn} BYN
                            </span>
                            {isSelected && (
                              <CheckCircleIcon size={16} className="text-white" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-5 rounded-[12px] liquid-glass-cream border border-black/[0.08] space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <label htmlFor="custom-minutes-range" className="text-black font-normal">
                        Количество минут:
                      </label>
                      <span className="font-medium text-black text-sm liquid-glass-pill px-3 py-0.5 rounded-full font-mono">
                        {customMinutes} мин
                      </span>
                    </div>
                    <input
                      id="custom-minutes-range"
                      type="range"
                      min="50"
                      max="2000"
                      step="25"
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(Number(e.target.value))}
                      className="w-full h-1.5 bg-[#EBE8E4] rounded-full appearance-none cursor-pointer accent-black"
                    />
                    <div className="flex justify-between text-[11px] text-[#777169] font-mono">
                      <span>50 мин</span>
                      <span>500 мин</span>
                      <span>1 000 мин</span>
                      <span>2 000 мин</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Methods (bePaid ERIP, Card, Invoice for Legal Entities) */}
              <div className="space-y-3">
                <span className="font-normal text-[#777169] text-xs block">
                  Способ оплаты (через bePaid / Беларусь):
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    aria-pressed={paymentMethod === 'erip'}
                    onClick={() => setPaymentMethod('erip')}
                    className={`p-3.5 rounded-[12px] text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                      paymentMethod === 'erip'
                        ? 'liquid-glass-dark text-white'
                        : 'liquid-glass-cream text-black hover:border-black/20'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      paymentMethod === 'erip' ? 'bg-white/10 text-white' : 'liquid-glass-card text-black'
                    }`}>
                      <span className="text-xs font-bold">ЕРИП</span>
                    </div>
                    <div>
                      <div className="text-xs font-medium leading-tight">ЕРИП (bePaid)</div>
                      <div className={`text-[10px] mt-0.5 ${paymentMethod === 'erip' ? 'text-white/70' : 'text-[#777169]'}`}>QR / АИС «Расчет»</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    aria-pressed={paymentMethod === 'card'}
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3.5 rounded-[12px] text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                      paymentMethod === 'card'
                        ? 'liquid-glass-dark text-white'
                        : 'liquid-glass-cream text-black hover:border-black/20'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      paymentMethod === 'card' ? 'bg-white/10 text-white' : 'liquid-glass-card text-black'
                    }`}>
                      <CreditCardIcon size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-medium leading-tight">Карта (bePaid)</div>
                      <div className={`text-[10px] mt-0.5 ${paymentMethod === 'card' ? 'text-white/70' : 'text-[#777169]'}`}>БЕЛКАРТ, Visa, MC</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    aria-pressed={paymentMethod === 'bank_invoice'}
                    onClick={() => setPaymentMethod('bank_invoice')}
                    className={`p-3.5 rounded-[12px] text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                      paymentMethod === 'bank_invoice'
                        ? 'liquid-glass-dark text-white'
                        : 'liquid-glass-cream text-black hover:border-black/20'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      paymentMethod === 'bank_invoice' ? 'bg-white/10 text-white' : 'liquid-glass-card text-black'
                    }`}>
                      <ReceiptIcon size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-medium leading-tight">Безнал (ИП / ООО)</div>
                      <div className={`text-[10px] mt-0.5 ${paymentMethod === 'bank_invoice' ? 'text-white/70' : 'text-[#777169]'}`}>Счёт в BYN и акт</div>
                    </div>
                  </button>
                </div>

                {paymentMethod === 'bank_invoice' && (
                  <div className="pt-1">
                    <label htmlFor="invoice-unp" className="block text-[11px] font-normal text-black mb-1">
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
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-black/[0.08] text-xs font-mono text-black focus:outline-none focus:border-black"
                    />
                  </div>
                )}
              </div>

              {/* Order Summary & Security Note */}
              <div className="p-4 rounded-[12px] liquid-glass-cream border border-black/[0.08] space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#59544F]">К зачислению на баланс:</span>
                  <span className="font-medium text-black font-mono">+{finalMinutes} минут</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#59544F]">Тариф за минуту:</span>
                  <span className="text-[#59544F] font-mono">{finalRate.toFixed(2)} BYN / мин</span>
                </div>
                <div className="pt-2 border-t border-black/[0.06] flex justify-between items-baseline">
                  <span className="text-sm font-normal text-black">К оплате (без НДС):</span>
                  <span className="text-2xl font-medium text-black">
                    {finalAmountByn} BYN
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-[#777169]">
                <ShieldCheckIcon size={15} className="text-black shrink-0" aria-hidden="true" />
                <span>Безопасный приём платежей обеспечивает <strong>bePaid</strong> (PCI DSS Level 1). Минуты не сгорают в конце месяца.</span>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!isSuccess && !invoiceReady && (
          <div className="p-5 border-t border-black/[0.06] bg-[#F5F3F1]/70 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-5 h-10 rounded-full liquid-glass-pill text-xs font-normal text-black hover:bg-white transition-colors cursor-pointer"
            >
              Отмена
            </button>

            <button
              type="button"
              onClick={handlePay}
              disabled={isProcessing}
              className="flex-1 sm:flex-initial px-7 h-11 rounded-full liquid-glass-btn-primary text-white text-xs font-normal transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer active:scale-[0.98]"
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
