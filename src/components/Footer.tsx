import React, { useState, useEffect, useRef } from 'react';
import { CloseCircleIcon, ShieldCheckIcon } from '@solar-icons/react/bold-duotone';
import { VOXI_CONTACTS, TelegramIcon, WhatsAppIcon, InstagramIcon } from '../lib/contacts';

export type LegalDocType = 'privacy' | 'offer' | 'sla';

interface FooterProps {
  onNavigateSection?: (sectionId: string) => void;
  externalDocModal?: LegalDocType | null;
  onCloseExternalDocModal?: () => void;
  onOpenCookieSettings?: () => void;
  onOpenAuth?: () => void;
}

export const LEGAL_DOCS: Record<LegalDocType, { title: string; content: string[] }> = {
  privacy: {
    title: 'Политика обработки персональных данных и файлов cookie (Закон РБ № 99-З)',
    content: [
      '1. Оператор обработки персональных данных: Индивидуальный предприниматель Беляков Кирилл Олегович (УНП 193991846, Республика Беларусь, 220045, г. Минск, ул. Наполеона Орды, д. 11, кв. 58, e-mail: info@voxi.by). Настоящая Политика разработана во исполнение Закона Республики Беларусь от 07.05.2021 № 99-З «О защите персональных данных».',
      '2. Состав и цели обработки: при регистрации и использовании платформы Voxi.by обрабатываются адрес электронной почты, наименование организации/ИП, контактный телефон, а также передаваемые Заказчиком в рамках поручения на обработку данные телефонных вызовов (аудиозаписи, номера абонентов и текстовые расшифровки) исключительно в целях предоставления функционала голосового ИИ-администратора, формирования заявок в CRM Заказчика и исполнения договора.',
      '3. Защита и хранение данных: изоляция данных между аккаунтами обеспечивается логической изоляцией на уровне учётной записи (tenant isolation) и шифрованием при передаче (TLS 1.3). Доступ третьих лиц к учетным данным и журналам вызовов исключён, за исключением привлечённых уполномоченных лиц (облачная инфраструктура, речевые сервисы и платёжный агрегатор ООО «ИКомЧардж» / bePaid) в объёме, строго необходимом для оказания услуги.',
      '4. Права субъектов персональных данных: субъект вправе в любое время отозвать согласие, запросить информацию об обработке своих данных, потребовать их изменения или безвозвратного удаления, направив обращение на info@voxi.by либо через функцию удаления в личном кабинете. Запрос исполняется в срок до 15 календарных дней (удаление записей звонков — в течение 24 часов).',
      '5. Обработка файлов cookie: сайт использует технические (обязательные) файлы cookie и локальное хранилище браузера для обеспечения авторизации, информационной безопасности и сохранения пользовательского выбора (срок хранения — до 12 месяцев). Функциональные и аналитические файлы cookie обрабатываются исключительно при наличии согласия пользователя и могут быть отключены в любой момент через кнопку «Настройки файлов cookie» в нижней части страницы.',
    ],
  },
  offer: {
    title: 'Публичный договор (оферта) возмездного оказания услуг',
    content: [
      '1. Исполнитель — Индивидуальный предприниматель Беляков Кирилл Олегович, зарегистрированный Минским горисполкомом в Едином государственном регистре юридических лиц и индивидуальных предпринимателей за № 193991846 (адрес: Республика Беларусь, г. Минск, ул. Наполеона Орды, д. 11, кв. 58), публикует настоящий Публичный договор (ст. 396, 405 ГК РБ) об оказании услуг доступа к программной платформе голосовых ИИ-администраторов Voxi.by (ОКЭД 62010).',
      '2. Акцепт оферты осуществляется путём регистрации в сервисе и/или использования программной платформы Voxi.by. При регистрации новому Заказчику однократно предоставляется приветственный нетарифицируемый объём 15 минут голосовых диалогов бота без обязательной привязки банковской карты.',
      '3. Порядок расчётов: стоимость услуг определяется в белорусских рублях (BYN) без НДС (Исполнитель применяет режим налогообложения без уплаты НДС согласно НК РБ). Расчётный период составляет календарный месяц. Оплата услуг производится по системе постоплаты: счёт выставляется 1-го числа месяца, следующего за отчётным, в 00:05. Заказчику предоставляется 7 календарных дней на оплату счёта без блокировки или приостановления работы бота. Досрочное погашение текущего начисления и покупка пакетов минут со скидкой доступны в любой момент в личном кабинете. При выборе выделенного номера А1 ВАТС абонентская плата составляет 15 BYN/мес; голосовой трафик тарифицируется поминутно (0.45 BYN/мин сверх 15 подарочных минут). Оплата осуществляется онлайн через платёжную систему bePaid (ООО «ИКомЧардж»): банковскими картами Visa, Mastercard, БЕЛКАРТ и через АИС «Расчёт» (ЕРИП).',
      '4. Закрывающие документы: по итогам отчётного месяца (либо по факту исполнения обязательств) для резидентов РБ оформляется первичный учётный документ — акт оказанных услуг, составляемый единолично в соответствии с постановлением Министерства финансов Республики Беларусь от 12.02.2018 № 13.',
    ],
  },
  sla: {
    title: 'Соглашение об уровне качества обслуживания (SLA 99.9%)',
    content: [
      '1. Целевой показатель доступности облачной платформы Voxi.by и SIP-шлюза (МТС, А1, Белтелеком IMS, UniTalk) составляет не менее 99.9% времени в расчётном месяце (за исключением плановых работ в ночное окно 03:00–05:00 по минскому времени).',
      '2. Расчётное время голосового отклика ассистента с момента завершения реплики абонента (End-of-Speech Latency) при штатном соединении составляет 450–650 мс.',
      '3. Отказоустойчивость (SIP Failover): при превышении таймаута ответа облачного узла входящий вызов автоматически переадресуется на резервный телефонный номер администратора Заказчика.',
      '4. Техническая поддержка пользователей осуществляется по электронной почте info@voxi.by, по телефону +375 (29) 138-71-50 и в Telegram (@voxi_manager) ежедневно с 09:00 до 21:00 (среднее время первичной реакции — до 15 минут).',
    ],
  },
};

export const Footer: React.FC<FooterProps> = ({
  externalDocModal,
  onCloseExternalDocModal,
  onOpenCookieSettings,
}) => {
  const [internalDocModal, setInternalDocModal] = useState<LegalDocType | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const activeDocModal = externalDocModal ?? internalDocModal;

  const openInternalDoc = (doc: LegalDocType) => {
    setInternalDocModal(doc);
    if (typeof window !== 'undefined') {
      const pathMap: Record<LegalDocType, string> = {
        privacy: '/privacy',
        offer: '/offer',
        sla: '/sla',
      };
      const titleMap: Record<LegalDocType, string> = {
        privacy: 'Политика конфиденциальности (Закон РБ № 99-З) — Voxi.by',
        offer: 'Публичный договор (оферта) — Voxi.by',
        sla: 'Соглашение об уровне сервиса (SLA 99.9%) — Voxi.by',
      };
      window.history.pushState({ legalDoc: doc }, '', pathMap[doc]);
      document.title = titleMap[doc];
    }
  };

  const closeDocModal = () => {
    setInternalDocModal(null);
    if (
      typeof window !== 'undefined' &&
      ['/privacy', '/offer', '/sla'].includes(window.location.pathname.toLowerCase())
    ) {
      window.history.pushState({ view: 'landing' }, '', '/');
      document.title = 'Voxi.by — ИИ-администратор для бизнеса в Беларуси 24/7';
    }
    onCloseExternalDocModal?.();
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (activeDocModal) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [activeDocModal]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const rect = dialog.getBoundingClientRect();
    const isOutside =
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom;
    if (isOutside) {
      closeDocModal();
    }
  };

  return (
    <footer className="bg-white text-[#666666] text-xs pb-10">
      <div className="w-full max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="border-t border-black/[0.08] pt-6 flex flex-col xl:flex-row xl:items-center justify-between gap-3 text-[11px] text-[#737373]">
          <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5">
            <span className="whitespace-nowrap">
              © 2026 Voxi.by · ИП Беляков К. О. (УНП {VOXI_CONTACTS.unp})
            </span>
            <a
              href={VOXI_CONTACTS.phoneTel}
              className="font-mono text-black font-medium hover:underline whitespace-nowrap"
            >
              {VOXI_CONTACTS.phoneDisplay}
            </a>
            <a
              href={VOXI_CONTACTS.telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-black hover:underline whitespace-nowrap"
            >
              <TelegramIcon size={12} />
              <span>{VOXI_CONTACTS.telegramHandle}</span>
            </a>
            <a
              href={VOXI_CONTACTS.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-black hover:underline whitespace-nowrap"
            >
              <WhatsAppIcon size={12} />
              <span>WhatsApp</span>
            </a>
            <a
              href={VOXI_CONTACTS.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-black hover:underline whitespace-nowrap"
            >
              <InstagramIcon size={12} />
              <span>{VOXI_CONTACTS.instagramHandle}</span>
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5">
            <span className="font-mono text-[10px] text-[#8E8E8E] whitespace-nowrap">
              bePaid · ЕРИП · БЕЛКАРТ · Visa · MC
            </span>
            <button
              type="button"
              onClick={() => openInternalDoc('privacy')}
              className="hover:text-black transition-colors cursor-pointer whitespace-nowrap"
            >
              99‑З
            </button>
            {onOpenCookieSettings && (
              <button
                type="button"
                onClick={onOpenCookieSettings}
                className="hover:text-black transition-colors cursor-pointer whitespace-nowrap"
              >
                Cookie
              </button>
            )}
            <button
              type="button"
              onClick={() => openInternalDoc('offer')}
              className="hover:text-black transition-colors cursor-pointer whitespace-nowrap"
            >
              Оферта
            </button>
            <button
              type="button"
              onClick={() => openInternalDoc('sla')}
              className="hover:text-black transition-colors cursor-pointer whitespace-nowrap"
            >
              SLA 99.9%
            </button>
          </div>
        </div>
      </div>

      {/* Native Accessible Legal / SLA Modal Dialog */}
      <dialog
        ref={dialogRef}
        aria-labelledby="legal-modal-title"
        onClose={closeDocModal}
        onClick={handleBackdropClick}
        className="w-[calc(100%-1.5rem)] max-w-lg rounded-[20px] bg-white border border-black/[0.1] shadow-2xl p-0 text-black backdrop:bg-black/45 backdrop:backdrop-blur-sm open:animate-fadeIn m-auto"
      >
        {activeDocModal && (
          <div>
            <div className="px-6 py-4 border-b border-black/[0.08] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheckIcon size={18} className="text-black shrink-0" aria-hidden="true" />
                <h2 id="legal-modal-title" className="text-sm font-semibold text-black">
                  {LEGAL_DOCS[activeDocModal].title}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Закрыть документ"
                onClick={closeDocModal}
                className="p-1.5 rounded-full text-[#666666] hover:text-black hover:bg-[#F5F5F5] transition-colors cursor-pointer"
              >
                <CloseCircleIcon size={18} />
              </button>
            </div>
            <div className="p-6 space-y-3 text-[13px] text-[#404040] leading-relaxed max-h-[65vh] overflow-y-auto">
              {LEGAL_DOCS[activeDocModal].content.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-black/[0.08] bg-[#F5F5F5] flex items-center justify-between gap-3">
              <span className="text-[11px] font-mono text-[#666666]">
                ИП Беляков К. О. · УНП 193991846 · г. Минск
              </span>
              <button
                type="button"
                onClick={closeDocModal}
                className="px-5 py-2 rounded-full bg-black hover:bg-[#222222] text-white text-xs font-medium transition-colors cursor-pointer"
              >
                Закрыть
              </button>
            </div>
          </div>
        )}
      </dialog>
    </footer>
  );
};
