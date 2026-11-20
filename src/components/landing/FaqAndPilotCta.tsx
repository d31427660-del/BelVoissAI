import React from 'react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { VOXI_CONTACTS, TelegramIcon } from '../../lib/contacts';

interface FaqAndPilotCtaProps {
  onOpenAuth?: () => void;
  onOpenVoiceTest?: () => void;
}

const OBJECTION_FAQS = [
  {
    q: 'Поймёт ли ИИ живую речь клиента, шум на фоне и белорусские адреса?',
    a: 'Да. Речевая модель работает в потоковом режиме и адаптирована под реальные телефонные линии Беларуси: справляется с дорожным шумом, звонками из авто, быстрой речью, названиями минских улиц (Сурганова, Тимирязева, Победителей, Немига), станциями метро и ценами исключительно в BYN.',
  },
  {
    q: 'Не будет ли ИИ-администратор раздражать клиентов, как старые «нажмите 1»?',
    a: 'В этом главное отличие от старых автоответчиков. Voxi.by отвечает за 0.5 секунды без кнопочных меню и пауз, поддерживает живое перебивание и говорит спокойным естественным голосом. Клиент получает ответ и запись за минуту вместо гудков или ожидания перезвона.',
  },
  {
    q: 'Как быстро настраивается сценарий под специфику нашей компании?',
    a: 'Базовый сценарий под вашу нишу, прайс в BYN, график работы и частые вопросы собирается за 5–15 минут. Вы можете настроить его самостоятельно в кабинете — первые 15 минут звонков бесплатны.',
  },
  {
    q: 'Что делать, если клиент задаёт нестандартный, сложный или конфликтный вопрос?',
    a: 'Ассистент строго опирается на вашу базу знаний и никогда не придумывает цены или условия. Если запрос выходит за рамки сценария или клиент просит живого специалиста, Voxi.by мгновенно переводит вызов на дежурного сотрудника либо фиксирует номер с пометкой срочности и сразу отправляет сводку в Telegram.',
  },
  {
    q: 'С какими операторами связи в Беларуси работает Voxi.by и нужно ли менять номер?',
    a: 'Менять номер не нужно. Платформа работает с А1 (включая ВАТС А1), МТС, Unitalk, Life и городскими номерами «Белтелеком» (017 и областные центры) по модели BYO-SIP с абонплатой 0 BYN. Также можно арендовать отдельный номер А1 ВАТС за 15 BYN/мес.',
  },
  {
    q: 'Как происходит оплата в BYN и какие документы получает бухгалтерия?',
    a: 'Работаем официально по публичному договору с резидентом РБ (ИП Беляков К. О., УНП 193991846, без НДС). Оплата проходит в BYN через bePaid — картами БЕЛКАРТ, Visa, Mastercard или по QR-коду через ЕРИП. Закрывающие документы формируются единоличным актом по постановлению Минфина № 13.',
  },
  {
    q: 'Соответствует ли сервис Закону РБ «О защите персональных данных» №\u00A099‑З?',
    a: 'Да. Аудиозаписи и расшифровки изолируются на уровне вашей учётной записи (tenant isolation), передаются по защищённому протоколу TLS 1.3 и удаляются по запросу в соответствии с требованиями Закона Республики Беларусь № 99-З.',
  },
];

export const FaqAndPilotCta: React.FC<FaqAndPilotCtaProps> = () => {
  return (
    <section
      id="faq"
      className="bg-white py-20 lg:py-28 scroll-mt-10"
    >
      <div className="w-full max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 space-y-12">
        <div className="flex items-center gap-4">
          <span className="font-mono text-[11px] tracking-[0.11em] uppercase text-black shrink-0">
            ВОПРОСЫ И ВОЗРАЖЕНИЯ
          </span>
          <div className="h-px flex-1 bg-black/[0.08]" aria-hidden="true" />
          <span className="font-mono text-[11px] tracking-[0.11em] uppercase text-[#737373] shrink-0">
            ЧЕСТНЫЕ ОТВЕТЫ
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left Sticky Column */}
          <div className="lg:col-span-4 lg:sticky lg:top-16 space-y-6">
            <h2 className="font-display font-bold text-black text-[38px] sm:text-[50px] lg:text-[58px] leading-[0.96] tracking-[-0.045em]">
              Частые
              <br />
              вопросы
            </h2>

            <p className="text-[15px] leading-relaxed text-[#525252]">
              Коротко и по делу разбираем главные сомнения владельцев перед подключением ИИ-администратора.
            </p>

            <div className="pt-4 border-t border-black/[0.08] space-y-2.5 text-[13px]">
              <div className="editorial-mono text-[#737373]">НУЖНА КОНСУЛЬТАЦИЯ ПО ВАШЕМУ КЕЙСУ?</div>
              <div className="flex flex-wrap items-center gap-2.5">
                <a
                  href={VOXI_CONTACTS.telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#F5F5F5] hover:bg-black hover:text-white text-black font-medium transition-colors"
                >
                  <TelegramIcon size={13} />
                  <span>{VOXI_CONTACTS.telegramHandle}</span>
                </a>
                <a
                  href={VOXI_CONTACTS.phoneTel}
                  className="inline-flex items-center px-3.5 py-2 rounded-full border border-black/[0.12] hover:border-black text-black font-mono text-[12px] transition-colors"
                >
                  {VOXI_CONTACTS.phoneDisplay}
                </a>
              </div>
            </div>
          </div>

          {/* Right 8 Cols: Crisp Hairline Accordion */}
          <div className="lg:col-span-8">
            <div className="border-t border-black/[0.12]">
              <Accordion type="single" collapsible defaultValue="item-0" className="w-full">
                {OBJECTION_FAQS.map((faq, idx) => (
                  <AccordionItem
                    key={idx}
                    value={`item-${idx}`}
                    className="border-b border-black/[0.1]"
                  >
                    <AccordionTrigger className="py-6 text-left font-display text-[17px] sm:text-[20px] font-semibold tracking-[-0.02em] text-black hover:no-underline hover:text-[#FE432A] transition-colors gap-4">
                      <span className="flex items-baseline gap-4">
                        <span className="font-mono text-[11px] font-medium text-[#737373] shrink-0">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span>{faq.q}</span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-6 pl-0 sm:pl-9 text-[14.5px] sm:text-[15.5px] leading-[1.65] text-[#404040]">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
