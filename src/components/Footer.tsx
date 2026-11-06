import React, { useState, useEffect, useRef } from 'react';
import { Microphone3Icon, CloseCircleIcon, ShieldCheckIcon } from '@solar-icons/react/bold-duotone';

export type LegalDocType = 'privacy' | 'offer' | 'sla';

interface FooterProps {
  onNavigateSection?: (sectionId: string) => void;
  externalDocModal?: LegalDocType | null;
  onCloseExternalDocModal?: () => void;
}

export const LEGAL_DOCS: Record<LegalDocType, { title: string; content: string[] }> = {
  privacy: {
    title: 'Политика обработки персональных данных (Закон РБ № 99-З)',
    content: [
      '1. Оператор обработки персональных данных: Индивидуальный предприниматель Беляков Кирилл Олегович (УНП 193991846, Республика Беларусь, 220045, г. Минск, ул. Наполеона Орды, д. 11, кв. 58, e-mail: info@voxi.by). Настоящая Политика разработана во исполнение Закона Республики Беларусь от 07.05.2021 № 99-З «О защите персональных данных».',
      '2. Состав и цели обработки: при регистрации и использовании платформы Voxi.by обрабатываются адрес электронной почты, наименование организации/ИП, контактный телефон, а также передаваемые Заказчиком в рамках поручения на обработку данные телефонных вызовов (аудиозаписи, номера абонентов и текстовые расшифровки) исключительно в целях предоставления функционала голосового ИИ-администратора, формирования заявок в CRM Заказчика и исполнения договора.',
      '3. Защита и хранение данных: изоляция данных между аккаунтами обеспечивается на уровне СУБД с применением политик Row Level Security (RLS) и шифрования при передаче (TLS 1.3). Доступ третьих лиц к учетным данным и журналам вызовов исключён, за исключением привлечённых уполномоченных лиц (облачная инфраструктура, речевые сервисы и платёжный агрегатор ООО «ИКомЧардж» / bePaid) в объёме, строго необходимом для оказания услуги.',
      '4. Права субъектов персональных данных: субъект вправе в любое время отозвать согласие, запросить информацию об обработке своих данных, потребовать их изменения или безвозвратного удаления, направив обращение на info@voxi.by либо через функцию удаления в личном кабинете. Запрос исполняется в срок до 15 календарных дней (удаление записей звонков — в течение 24 часов).'
    ]
  },
  offer: {
    title: 'Публичный договор (оферта) возмездного оказания услуг',
    content: [
      '1. Исполнитель — Индивидуальный предприниматель Беляков Кирилл Олегович, зарегистрированный Минским горисполкомом в Едином государственном регистре юридических лиц и индивидуальных предпринимателей за № 193991846 (адрес: Республика Беларусь, г. Минск, ул. Наполеона Орды, д. 11, кв. 58), публикует настоящий Публичный договор (ст. 396, 405 ГК РБ) об оказании услуг доступа к программной платформе голосовых ИИ-администраторов Voxi.by (ОКЭД 62010).',
      '2. Акцепт оферты осуществляется путём регистрации в сервисе и/или оплаты выбранного пакета минут. При регистрации новому Заказчику однократно предоставляется тестовый нетарифицируемый объём 15 минут без обязательной привязки банковской карты.',
      '3. Порядок расчётов и возврата: стоимость услуг определяется в белорусских рублях (BYN) без НДС (Исполнитель применяет режим налогообложения без уплаты НДС согласно НК РБ). Оплата производится на условиях 100% предоплаты через платёжную систему bePaid (ООО «ИКомЧардж»): банковскими картами Visa, Mastercard, БЕЛКАРТ, через АИС «Расчёт» (ЕРИП), либо безналичным банковским переводом для юридических лиц и ИП. Приобретённые минуты не имеют срока сгорания. Возврат неизрасходованного остатка денежных средств осуществляется на карту/счёт, с которого производилась оплата, в срок до 7 рабочих дней по письменному заявлению на info@voxi.by.',
      '4. Закрывающие документы: по итогам отчётного месяца (либо по факту исполнения обязательств) для резидентов РБ оформляется первичный учётный документ — акт оказанных услуг, составляемый единолично в соответствии с постановлением Министерства финансов Республики Беларусь от 12.02.2018 № 13.'
    ]
  },
  sla: {
    title: 'Соглашение об уровне качества обслуживания (SLA 99.9%)',
    content: [
      '1. Целевой показатель доступности облачной платформы Voxi.by и SIP-шлюза (МТС, А1, Белтелеком IMS, UniTalk) составляет не менее 99.9% времени в расчётном месяце (за исключением плановых работ в ночное окно 03:00–05:00 по минскому времени).',
      '2. Расчётное время голосового отклика ассистента с момента завершения реплики абонента (End-of-Speech Latency) при штатном соединении составляет 450–650 мс.',
      '3. Отказоустойчивость (SIP Failover): при превышении таймаута ответа облачного узла входящий вызов автоматически переадресуется на резервный телефонный номер администратора Заказчика.',
      '4. Техническая поддержка пользователей осуществляется по электронной почте info@voxi.by и в Telegram (@voxi_support) ежедневно с 09:00 до 21:00 (среднее время первичной реакции — до 15 минут).'
    ]
  }
};

export const Footer: React.FC<FooterProps> = ({
  onNavigateSection,
  externalDocModal,
  onCloseExternalDocModal
}) => {
  const [internalDocModal, setInternalDocModal] = useState<LegalDocType | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const activeDocModal = externalDocModal ?? internalDocModal;

  const closeDocModal = () => {
    setInternalDocModal(null);
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

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    if (onNavigateSection) {
      e.preventDefault();
      onNavigateSection(sectionId);
    }
  };

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
    <footer className="bg-[#f5f5f7] text-[#6e6e73] text-xs border-t border-[#e5e5ea]">
      <div className="max-w-[1080px] mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#2563eb] to-[#4f46e5] flex items-center justify-center text-[#ffffff]" aria-hidden="true">
                <Microphone3Icon size={15} />
              </div>
              <div className="flex items-baseline gap-0.5">
                <span className="text-base font-extrabold text-[#1d1d1f]">
                  Voxi
                </span>
                <span className="text-xs font-bold text-[#2563eb]">.by</span>
              </div>
            </div>
            <p className="text-[#6e6e73] text-xs leading-relaxed">
              Платформа голосовых ИИ-администраторов для малого и среднего бизнеса в Республике Беларусь.
            </p>
            <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
              <span>Шлюзы МТС и А1 работают штатно</span>
            </div>
          </div>

          <div>
            <h3 className="text-[#1d1d1f] font-semibold mb-3 text-xs">
              Отрасли
            </h3>
            <ul className="space-y-2 text-xs">
              <li><a href="#who" onClick={(e) => handleLinkClick(e, 'who')} className="hover:text-[#1d1d1f] transition-colors">Автошколы</a></li>
              <li><a href="#who" onClick={(e) => handleLinkClick(e, 'who')} className="hover:text-[#1d1d1f] transition-colors">Автосервисы и СТО</a></li>
              <li><a href="#who" onClick={(e) => handleLinkClick(e, 'who')} className="hover:text-[#1d1d1f] transition-colors">Стоматологии и медцентры</a></li>
              <li><a href="#who" onClick={(e) => handleLinkClick(e, 'who')} className="hover:text-[#1d1d1f] transition-colors">Салоны красоты</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[#1d1d1f] font-semibold mb-3 text-xs">
              Платформа
            </h3>
            <ul className="space-y-2 text-xs">
              <li><a href="#calculator" onClick={(e) => handleLinkClick(e, 'calculator')} className="hover:text-[#1d1d1f] transition-colors">Калькулятор окупаемости</a></li>
              <li><a href="#pricing" onClick={(e) => handleLinkClick(e, 'pricing')} className="hover:text-[#1d1d1f] transition-colors">Оплата за минуты</a></li>
              <li><a href="#integrations" onClick={(e) => handleLinkClick(e, 'integrations')} className="hover:text-[#1d1d1f] transition-colors">SIP-телефония РБ</a></li>
              <li><a href="#features" onClick={(e) => handleLinkClick(e, 'features')} className="hover:text-[#1d1d1f] transition-colors">Технологии и SpeechKit</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[#1d1d1f] font-semibold mb-3 text-xs">
              Контакты и реквизиты
            </h3>
            <ul className="space-y-2 text-xs">
              <li>Республика Беларусь, г. Минск</li>
              <li>
                <a href="tel:+375291124455" className="text-[#1d1d1f] font-medium hover:underline">
                  +375 (29) 112-44-55
                </a>
              </li>
              <li>
                <a href="mailto:info@voxi.by" className="text-[#1d1d1f] hover:underline">
                  info@voxi.by
                </a>
                {' • '}
                <a
                  href="https://t.me/voxi_support"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#2563eb] hover:underline font-medium"
                >
                  @voxi_support
                </a>
              </li>
              <li className="pt-1 text-[11px] text-[#6e6e73] leading-relaxed">
                ИП Беляков Кирилл Олегович<br />
                УНП 193991846
              </li>
            </ul>
          </div>

        </div>

        {/* Payment Systems Strip (Required by bePaid / Belkart / Visa / Mastercard rules in Belarus) */}
        <div className="border-t border-[#e5e5ea] py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#6e6e73]">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span>Приём платежей онлайн:</span>
            <span className="px-2 py-0.5 rounded bg-white border border-[#e5e5ea] font-semibold text-[#1d1d1f]">bePaid</span>
            <span className="px-2 py-0.5 rounded bg-white border border-[#e5e5ea] font-semibold text-[#1d1d1f]">ЕРИП</span>
            <span className="px-2 py-0.5 rounded bg-white border border-[#e5e5ea] font-semibold text-[#1d1d1f]">БЕЛКАРТ</span>
            <span className="px-2 py-0.5 rounded bg-white border border-[#e5e5ea] font-semibold text-[#1d1d1f]">Visa</span>
            <span className="px-2 py-0.5 rounded bg-white border border-[#e5e5ea] font-semibold text-[#1d1d1f]">Mastercard</span>
          </div>
          <div className="text-center sm:text-right">
            Режим работы: приём заявок 24/7, поддержка 09:00–21:00
          </div>
        </div>

        <div className="border-t border-[#e5e5ea] pt-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[#6e6e73] text-[11px]">
          <div>
            © 2026 Voxi.by — ИП Беляков К. О. (УНП 193991846). Все права защищены.
          </div>
          <div className="flex flex-wrap justify-center gap-5">
            <button type="button" onClick={() => setInternalDocModal('privacy')} className="hover:text-[#1d1d1f] transition-colors cursor-pointer">
              Политика конфиденциальности (Закон <span className="whitespace-nowrap">№ 99‑З</span>)
            </button>
            <button type="button" onClick={() => setInternalDocModal('offer')} className="hover:text-[#1d1d1f] transition-colors cursor-pointer">
              Публичная оферта и оплата
            </button>
            <button type="button" onClick={() => setInternalDocModal('sla')} className="hover:text-[#1d1d1f] transition-colors cursor-pointer">
              SLA 99.9%
            </button>
            <a
              href="#admin"
              className="text-[#86868b] hover:text-[#1d1d1f] transition-colors cursor-pointer"
              title="Вход в мастер-панель управления платформой Voxi.by"
            >
              Панель администратора
            </a>
          </div>
        </div>
      </div>

      {/* Native Accessible Legal / SLA Modal Dialog */}
      <dialog
        ref={dialogRef}
        aria-labelledby="legal-modal-title"
        onClose={closeDocModal}
        onClick={handleBackdropClick}
        className="w-[calc(100%-1.5rem)] max-w-lg rounded-[28px] sm:rounded-[36px] bg-[#ffffff] border border-[#e5e5ea] shadow-apple-hover p-0 text-[#1d1d1f] backdrop:bg-black/45 backdrop:backdrop-blur-sm open:animate-fadeIn m-auto"
      >
        {activeDocModal && (
          <div>
            <div className="px-6 py-4 border-b border-[#f5f5f7] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheckIcon size={18} className="text-[#1d1d1f] shrink-0" aria-hidden="true" />
                <h2 id="legal-modal-title" className="text-sm font-semibold text-[#1d1d1f]">
                  {LEGAL_DOCS[activeDocModal].title}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Закрыть документ"
                onClick={closeDocModal}
                className="p-1.5 rounded-full text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors"
              >
                <CloseCircleIcon size={18} />
              </button>
            </div>
            <div className="p-6 space-y-3 text-xs text-[#424245] leading-relaxed max-h-[65vh] overflow-y-auto">
              {LEGAL_DOCS[activeDocModal].content.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-[#f5f5f7] bg-[#f5f5f7]/60 flex items-center justify-between gap-3">
              <span className="text-[11px] text-[#6e6e73]">ИП Беляков К. О. • УНП 193991846 • г. Минск</span>
              <button
                type="button"
                onClick={closeDocModal}
                className="px-4 py-1.5 rounded-full bg-[#1d1d1f] hover:bg-[#000000] text-[#ffffff] text-xs font-medium transition-all"
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
