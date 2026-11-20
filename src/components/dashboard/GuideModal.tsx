import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CloseCircleIcon as X,
  QuestionCircleIcon as HelpCircle,
  LightbulbBoltIcon as Lightbulb,
} from '@solar-icons/react/bold-duotone';
import { VOXI_CONTACTS, TelegramIcon, WhatsAppIcon } from '../../lib/contacts';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [isOpen, onClose]);

  const steps = [
    {
      num: '01',
      title: 'Укажите сферу бизнеса и голос (вкладка «Настройка бота»)',
      time: '1 мин',
      desc: 'Напишите в свободной форме, чем занимается ваша компания (например, «Автосервис», «Стоматология», «Аренда спецтехники») и выберите голос ассистента — ИИ сам подстроит сценарий диалога.',
      tip: 'Голос Анны чаще выбирают для клиник, салонов и автошкол, а голос Максима — для СТО и сервисных центров.',
    },
    {
      num: '02',
      title: 'Укажите ваши цены в BYN, адрес и часы работы',
      time: '1 мин',
      desc: 'Впишите название компании, точный адрес с ориентиром, время работы и основные услуги с ценами в белорусских рублях (BYN). Рядом с каждым полем есть кнопка «Подсказка» с готовым примером.',
      tip: 'Пишите цены просто: «Замена масла — 45 BYN, диагностика подвески — 35 BYN». Бот сам произнесёт сумму словами.',
    },
    {
      num: '03',
      title: 'Проверьте бота голосом прямо в браузере',
      time: '1 мин',
      desc: 'Нажмите «Проверить диалог» на вкладке «Настройка бота» или «Тестовый звонок» в верхней панели кабинета. Спросите про цены, адрес или запись на вечер.',
      tip: 'Если бот ответил не так, как принято у вас — просто уточните правило в прайс-листе и нажмите «Сохранить».',
    },
    {
      num: '04',
      title: 'Настройте Telegram для заявок и подключите номер',
      time: '2 мин',
      desc: 'Во вкладке «Заявки» укажите Telegram Chat ID для мгновенных уведомлений, а во вкладке «Телефония» выберите выделенный номер А1 ВАТС либо подключите свою линию SIP.',
      tip: 'Нажмите «Где взять ID?» рядом с полем Telegram — там написано, как получить ваш ID в Telegram за пару кликов.',
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="guide-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-2xl rounded-[24px] bg-white border border-black/[0.1] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-black/[0.08] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[10px] bg-black text-[#6BFF91] flex items-center justify-center shrink-0">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="guide-modal-title" className="font-display text-[17px] font-bold text-black tracking-tight">
                    Как настроить и запустить бота за 5 минут
                  </h3>
                  <p className="text-[12px] text-[#666666]">
                    Понятная шпаргалка без сложных технических настроек
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Закрыть шпаргалку"
                className="w-9 h-9 rounded-full bg-[#F5F5F5] hover:bg-black hover:text-white text-black inline-flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-3.5 voxi-scroll">
              {steps.map((s) => (
                <div
                  key={s.num}
                  className="p-4 sm:p-5 rounded-[18px] bg-[#F5F5F5] border border-black/[0.06] space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-full bg-black text-white font-mono text-[11px] font-semibold flex items-center justify-center shrink-0">
                        {s.num}
                      </span>
                      <strong className="font-display text-[14px] font-bold text-black">
                        {s.title}
                      </strong>
                    </div>
                    <span className="font-mono text-[10.5px] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white border border-black/[0.08] text-black shrink-0">
                      {s.time}
                    </span>
                  </div>

                  <p className="text-[13px] text-[#404040] leading-relaxed pl-9">{s.desc}</p>

                  <div className="ml-9 p-3 rounded-[12px] bg-white border border-black/[0.06] text-[12px] text-[#262626] flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-black shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-black">Совет:</strong> {s.tip}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-black/[0.08] bg-[#F5F5F5] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-[12px] text-[#525252]">
                <span>Нужна помощь?</span>
                <a
                  href={VOXI_CONTACTS.telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-black hover:underline"
                >
                  <TelegramIcon size={12} />
                  <span>{VOXI_CONTACTS.telegramHandle}</span>
                </a>
                <span>·</span>
                <a
                  href={VOXI_CONTACTS.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-black hover:underline"
                >
                  <WhatsAppIcon size={12} />
                  <span>WhatsApp</span>
                </a>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="h-10 px-6 rounded-full bg-black hover:bg-[#222222] text-white text-[13px] font-medium transition-colors shrink-0 cursor-pointer"
              >
                Понятно
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
