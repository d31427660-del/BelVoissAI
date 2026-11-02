import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CloseCircleIcon as X,
  QuestionCircleIcon as HelpCircle,
  LightbulbBoltIcon as Lightbulb
} from '@solar-icons/react/bold-duotone';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const steps = [
    {
      num: '1',
      title: 'Выберите сферу бизнеса и голос (вкладка «Настройка бота»)',
      time: '1 минута',
      desc: 'Выберите подходящий шаблон (Автосервис, Салон красоты, Автошкола или Стоматология). Система сразу заполнит примерный список услуг и приветствие — вам останется только поправить под себя.',
      tip: 'Голос Анны чаще выбирают для клиник, салонов и автошкол, а голос Дмитрия — для СТО и сервисных центров.'
    },
    {
      num: '2',
      title: 'Укажите ваши цены в BYN, адрес и часы работы',
      time: '2 минуты',
      desc: 'Впишите название компании, точный адрес с ориентиром, время работы и основные услуги с ценами в белорусских рублях (BYN). Рядом с каждым полем есть кнопка «Подсказка» с готовым примером.',
      tip: 'Пишите цены просто: «Замена масла — 45 BYN, диагностика подвески — 35 BYN». Бот сам произнесёт сумму словами.'
    },
    {
      num: '3',
      title: 'Проверьте бота голосом прямо в браузере',
      time: '1 минута',
      desc: 'Нажмите «Поговорить с ботом (тест)» в меню слева или используйте панель проверки справа от настроек. Спросите про цены, адрес или запись на вечер.',
      tip: 'Если бот ответил не так, как принято у вас — просто уточните правило в прайс-листе и нажмите «Сохранить».'
    },
    {
      num: '4',
      title: 'Укажите Telegram для заявок и телефон компании (вкладка «Номер и заявки»)',
      time: '2 минуты',
      desc: 'Вставьте ID вашего Telegram-чата, чтобы мгновенно получать имя, телефон и суть обращения каждого клиента, и укажите данные номера от МТС, А1 или Белтелеком.',
      tip: 'Нажмите «Где взять?» рядом с полем Telegram или телефона — там написано, где скопировать нужные данные за пару кликов.'
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/25 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Как настроить и запустить бота за 5 минут
                </h3>
                <p className="text-[11px] text-slate-500">
                  Понятная шпаргалка без сложных технических настроек
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть шпаргалку"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-3.5 voxi-scroll">
            {steps.map((s) => (
              <div
                key={s.num}
                className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-2 transition-all hover:bg-white"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {s.num}
                    </span>
                    <strong className="text-xs font-bold text-slate-900">
                      {s.title}
                    </strong>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 shrink-0">
                    {s.time}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed pl-8">
                  {s.desc}
                </p>

                <div className="ml-8 p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200/60 text-[11px] text-emerald-900 flex items-start gap-2">
                  <Lightbulb className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                  <span>
                    <strong>Совет:</strong> {s.tip}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-500">
              Нужна помощь с настройкой? Напишите в Telegram: @voxi_support
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all shrink-0"
            >
              Понятно
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
