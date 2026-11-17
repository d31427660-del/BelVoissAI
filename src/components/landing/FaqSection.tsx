import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

export const FaqSection: React.FC = () => {
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
      q: 'Как происходит оплата сервиса в Беларуси?',
      a: 'Подключение осуществляется по публичному договору (оферте) с резидентом Республики Беларусь (ИП Беляков Кирилл Олегович, УНП 193991846). Оплата производится в BYN онлайн через систему bePaid: банковскими картами БЕЛКАРТ, Visa, Mastercard или по QR-коду через систему «Расчёт» (ЕРИП).'
    },
    {
      q: 'Соответствует ли платформа Закону РБ «О защите персональных данных» №\u00A099‑З?',
      a: 'Да. Аудиозаписи и текстовые расшифровки звонков изолируются на уровне организации с применением политик Row Level Security (RLS) в полном соответствии с требованиями Закона № 99‑З.'
    }
  ];

  return (
    <section id="faq" className="py-24 bg-transparent border-t border-black/[0.06] scroll-mt-20">
      <div className="max-w-[820px] mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="mb-12 space-y-2 text-center">
          <Badge
            variant="outline"
            className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border-slate-300 bg-white/80 text-slate-900 text-xs font-medium shadow-xs"
          >
            Вопросы и ответы
          </Badge>
          <h2 className="text-3xl sm:text-4xl text-slate-950 font-semibold tracking-tight">
            Часто задаваемые вопросы
          </h2>
        </div>

        {/* shadcn/ui Accordion inside Card */}
        <Card className="rounded-2xl border border-slate-200/90 bg-white/90 shadow-sm px-6 sm:px-8 py-3">
          <Accordion type="single" collapsible defaultValue="item-0" className="w-full">
            {faqs.map((faq, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`} className="border-slate-200/80 last:border-b-0">
                <AccordionTrigger className="text-sm sm:text-base font-medium text-slate-900 hover:no-underline hover:text-slate-700 py-4 sm:py-5">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-xs sm:text-sm text-slate-600 leading-relaxed pb-4 sm:pb-5">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>

      </div>
    </section>
  );
};
