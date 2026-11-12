import React, { useState, useEffect, useRef } from 'react';
import { Microphone3Icon, CloseCircleIcon, ShieldCheckIcon } from '@solar-icons/react/bold-duotone';

export type LegalDocType = 'privacy' | 'offer' | 'sla';

interface FooterProps {
  onNavigateSection?: (sectionId: string) => void;
  externalDocModal?: LegalDocType | null;
  onCloseExternalDocModal?: () => void;
  onOpenCookieSettings?: () => void;
}

export const LEGAL_DOCS: Record<LegalDocType, { title: string; content: string[] }> = {
  privacy: {
    title: 'Политика обработки персональных данных и файлов cookie (Закон РБ № 99-З)',
    content: [
      '1. Оператор обработки персональных данных: Индивидуальный предприниматель Беляков Кирилл Олегович (УНП 193991846, Республика Беларусь, 220045, г. Минск, ул. Наполеона Орды, д. 11, кв. 58, e-mail: info@voxi.by). Настоящая Политика разработана во исполнение Закона Республики Беларусь от 07.05.2021 № 99-З «О защите персональных данных».',
      '2. Состав и цели обработки: при регистрации и использовании платформы Voxi.by обрабатываются адрес электронной почты, наименование организации/ИП, контактный телефон, а также передаваемые Заказчиком в рамках поручения на обработку данные телефонных вызовов (аудиозаписи, номера абонентов и текстовые расшифровки) исключительно в целях предоставления функционала голосового ИИ-администратора, формирования заявок в CRM Заказчика и исполнения договора.',
      '3. Защита и хранение данных: изоляция данных между аккаунтами обеспечивается на уровне СУБД с применением политик Row Level Security (RLS) и шифрования при передаче (TLS 1.3). Доступ третьих лиц к учетным данным и журналам вызовов исключён, за исключением привлечённых уполномоченных лиц (облачная инфраструктура, речевые сервисы и платёжный агрегатор ООО «ИКомЧардж» / bePaid) в объёме, строго необходимом для оказания услуги.',
      '4. Права субъектов персональных данных: субъект вправе в любое время отозвать согласие, запросить информацию об обработке своих данных, потребовать их изменения или безвозвратного удаления, направив обращение на info@voxi.by либо через функцию удаления в личном кабинете. Запрос исполняется в срок до 15 календарных дней (удаление записей звонков — в течение 24 часов).',
      '5. Обработка файлов cookie: сайт использует технические (обязательные) файлы cookie и локальное хранилище браузера для обеспечения авторизации, информационной безопасности и сохранения пользовательского выбора (срок хранения — до 12 месяцев). Функциональные и аналитические файлы cookie обрабатываются исключительно при наличии согласия пользователя и могут быть отключены в любой момент через кнопку «Настройки файлов cookie» в нижней части страницы.'
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
  onCloseExternalDocModal,
  onOpenCookieSettings
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
    <footer className="bg-[#f8fafc] text-[#6e6e73] text-xs border-t border-slate-200/80">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-14 pb-24 sm:py-14">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-10">
          
          <div className="md:col-span-2 space-y-3.5 pr-4">
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-xl bg-[#0a0a0c] p-[1px] shadow-xs"
                aria-hidden="true"
              >
                <div className="w-full h-full rounded-[10px] bg-[#ffffff] flex items-center justify-center gap-[2.5px]">
                  <span className="w-[3px] h-3 rounded-full bg-[#0a0a0c]" />
                  <span className="w-[3px] h-3 rounded-full bg-[#0a0a0c]" />
                </div>
              </div>
              <div className="flex items-baseline gap-0.5">
                <span className="text-base font-extrabold tracking-tight text-[#0a0a0c]">
                  Voxi
                </span>
                <span className="text-xs font-semibold font-mono text-[#71717a]">.by</span>
              </div>
            </div>
            <p className="text-[#71717a] text-xs leading-relaxed max-w-sm">
              Платформа голосовых ИИ-администраторов и нейросетевого синтеза речи для малого и среднего бизнеса в Республике Беларусь.
            </p>
            <div className="text-[11px] text-[#0a0a0c] font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
              <span>Шлюзы МТС и А1 работают штатно • Отклик 0.5 сек</span>
            </div>
          </div>

          <div>
            <h3 className="text-[#1d1d1f] font-semibold mb-3 text-xs">
              Решения
            </h3>
            <ul className="space-y-2 text-xs">
              <li><a href="#showcase" onClick={(e) => handleLinkClick(e, 'showcase')} className="hover:text-[#1d1d1f] transition-colors">Voxi Голос</a></li>
              <li><a href="#who" onClick={(e) => handleLinkClick(e, 'who')} className="hover:text-[#1d1d1f] transition-colors">Отраслевые базы знаний</a></li>
              <li><a href="#pricing" onClick={(e) => handleLinkClick(e, 'pricing')} className="hover:text-[#1d1d1f] transition-colors">Тарифы и пакеты минут</a></li>
              <li><a href="#calculator" onClick={(e) => handleLinkClick(e, 'calculator')} className="hover:text-[#1d1d1f] transition-colors">Расчёт окупаемости</a></li>
              <li><a href="#benchmark" onClick={(e) => handleLinkClick(e, 'benchmark')} className="hover:text-[#1d1d1f] transition-colors">Шкала задержки 510 мс</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[#1d1d1f] font-semibold mb-3 text-xs">
              Платформа
            </h3>
            <ul className="space-y-2 text-xs">
              <li><a href="#benchmark" onClick={(e) => handleLinkClick(e, 'benchmark')} className="hover:text-[#1d1d1f] transition-colors">Бенчмарк синтеза речи</a></li>
              <li><a href="#integrations" onClick={(e) => handleLinkClick(e, 'integrations')} className="hover:text-[#1d1d1f] transition-colors">SIP-телефония МТС и А1</a></li>
              <li><a href="#features" onClick={(e) => handleLinkClick(e, 'features')} className="hover:text-[#1d1d1f] transition-colors">Архитектура и Bento-обзор</a></li>
              <li><a href="#faq" onClick={(e) => handleLinkClick(e, 'faq')} className="hover:text-[#1d1d1f] transition-colors">Вопросы и ответы</a></li>
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
                  className="text-black hover:underline font-medium"
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
            {onOpenCookieSettings && (
              <button type="button" onClick={onOpenCookieSettings} className="hover:text-[#1d1d1f] transition-colors cursor-pointer">
                Настройки файлов cookie
              </button>
            )}
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
        className="w-[calc(100%-1.5rem)] max-w-lg rounded-[16px] liquid-glass-card shadow-2xl p-0 text-[#1d1d1f] backdrop:bg-black/45 backdrop:backdrop-blur-sm open:animate-fadeIn m-auto"
      >
        {activeDocModal && (
          <div>
            <div className="px-6 py-4 border-b border-black/[0.06] flex items-center justify-between">
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
                className="p-1.5 rounded-full text-[#777169] hover:text-black hover:bg-black/[0.04] transition-colors cursor-pointer"
              >
                <CloseCircleIcon size={18} />
              </button>
            </div>
            <div className="p-6 space-y-3 text-xs text-[#59544F] leading-relaxed max-h-[65vh] overflow-y-auto">
              {LEGAL_DOCS[activeDocModal].content.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-black/[0.06] bg-[#F5F3F1]/70 flex items-center justify-between gap-3">
              <span className="text-[11px] text-[#777169]">ИП Беляков К. О. • УНП 193991846 • г. Минск</span>
              <button
                type="button"
                onClick={closeDocModal}
                className="px-4 py-1.5 rounded-full liquid-glass-btn-primary text-white text-xs font-normal transition-all cursor-pointer"
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
