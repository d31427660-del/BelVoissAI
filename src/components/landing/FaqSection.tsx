import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AltArrowDownIcon, AltArrowUpIcon } from '@solar-icons/react/bold-duotone';

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'С какими мобильными операторами Беларуси работает Voxi.by?',
      a: 'Платформа поддерживает прямую интеграцию по протоколу SIP с любыми операторами Республики Беларусь: МТС (sip.mts.by), А1 (sip.a1.by), Life, облачными АТС UniTalk, Zadarma, а также городскими номерами «Белтелеком» (код 017 и областные центры).'
    },
    {
      q: 'Понимает ли ассистент белорусские адреса, станции метро и цены в BYN?',
      a: 'Да, языковые модели адаптированы под топонимику Беларуси. Ассистент распознает названия улиц (Сурганова, Победителей, Немига), станции минского метро и оперирует исключительно белорусскими рублями (BYN), включая условия рассрочки.'
    },
    {
      q: 'Что происходит, если клиент задает нестандартный вопрос?',
      a: 'Если в базе знаний нет точного ответа, ассистент не придумывает недостоверную информацию. Он корректно фиксирует обращение и передает контакты клиента в Telegram старшему специалисту для обратного звонка.'
    },
    {
      q: 'Можно ли перевести звонок на сотрудника во время разговора?',
      a: 'Да. По запросу клиента или при срочном обращении ассистент выполняет мгновенную SIP-переадресацию вызова на номер дежурного администратора.'
    },
    {
      q: 'Какова реальная задержка ответа ассистента во время звонка?',
      a: 'Скорость отклика составляет 0.55 секунды благодаря прямому WebRTC/SIP-шлюзу в Минске и потоковой генерации речи. Это уровень реакции живого администратора — клиент не слышит неловких роботизированных пауз.'
    },
    {
      q: 'Нужна ли лицензия оператора электросвязи для использования сервиса?',
      a: 'Нет. Voxi.by работает по модели BYO-SIP (Bring Your Own SIP) как программное обеспечение (ОКЭД 62010). Вы подключаете свой существующий номер от А1, МТС или Белтелеком без согласований и смены тарифов связи.'
    },
    {
      q: 'Как оформляются документы и оплата для юридических лиц и ИП в Беларуси?',
      a: 'Подключение осуществляется по публичному договору (оферте) с резидентом Республики Беларусь (ИП Беляков Кирилл Олегович, УНП 193991846). Оплата производится в BYN онлайн через систему bePaid (ЕРИП, корпоративные и личные карты БЕЛКАРТ, Visa, Mastercard) либо безналичным банковским переводом с выставлением счёта и предоставлением закрывающих актов.'
    },
    {
      q: 'Соответствует ли платформа Закону РБ «О защите персональных данных» №\u00A099‑З?',
      a: 'Да. Аудиозаписи и текстовые расшифровки звонков изолируются на уровне организации с применением политик Row Level Security (RLS) в полном соответствии с требованиями Закона № 99‑З.'
    }
  ];

  return (
    <section className="py-24 bg-slate-50/80">
      <div className="max-w-[820px] mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="mb-12 space-y-2 text-center">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 text-[#2563eb] text-xs font-semibold">
            Вопросы и ответы
          </div>
          <h2 className="apple-heading text-3xl sm:text-4xl text-[#1d1d1f]">
            Часто задаваемые вопросы
          </h2>
        </div>

        {/* Clean Apple Accordion (Ultra-Rounded) */}
        <div className="divide-y divide-slate-100 rounded-[40px] bg-[#ffffff] border border-slate-200/80 shadow-apple-card px-7 sm:px-10 py-2">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;

            return (
              <div key={idx} className="py-5">
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    className="w-full text-left flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-[#1d1d1f] hover:text-[#2563eb] transition-colors"
                  >
                    <span>{faq.q}</span>
                    <span aria-hidden="true" className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      isOpen ? 'bg-[#2563eb] text-[#ffffff]' : 'bg-blue-50 text-[#2563eb]'
                    }`}>
                      {isOpen ? <AltArrowUpIcon size={16} /> : <AltArrowDownIcon size={16} />}
                    </span>
                  </button>
                </h3>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="pt-3 text-xs sm:text-sm text-[#86868b] leading-relaxed">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
