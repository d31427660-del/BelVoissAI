import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CloseCircleIcon as X,
  CheckCircleIcon as CheckCircle2,
  PhoneCallingRoundedIcon as Phone,
  CpuBoltIcon as Bot,
  MagicWand3Icon as Sparkles,
  SendSquareIcon as Send,
  QuestionCircleIcon as HelpCircle,
  ArrowRightIcon as ArrowRight,
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
      num: '01',
      title: 'Выберите нишу и голос ассистента',
      time: '1 минута',
      desc: 'Выберите готовую сферу (Автошкола, СТО, Клиника, Салон). Система сразу загрузит базовый словарь, терминологию и шаблон цен. Послушайте голоса Анна или Дмитрий и выберите подходящий вашему бренду.',
      tip: 'Для автосервисов лучше всего подходит уверенный голос Дмитрия, а для автошкол и медцентров — заботливый голос Анны.'
    },
    {
      num: '02',
      title: 'Укажите цены в BYN и адрес в Беларуси',
      time: '2 минуты',
      desc: 'Вставьте ваш прайс-лист в бел. рублях (BYN), точный адрес (метро, улица) и график работы. Чем конкретнее указаны цены и условия рассрочки, тем точнее бот отвечает клиенту.',
      tip: 'Пишите цены прямо: "Полный курс кат. B — 1050 BYN. Рассрочка в 4 этапа". Бот автоматически переводит это в естественную русскую речь.'
    },
    {
      num: '03',
      title: 'Обновите промт и протестируйте звонок',
      time: '1 минута',
      desc: 'Нажмите «Обновить по новым ценам» или «Синхронизировать сейчас». Нейросеть сформирует строгую системную инструкцию. Сделайте тестовый звонок прямо в браузере, чтобы лично убедиться в скорости ответа (0.5 сек).',
      tip: 'Вы можете в любой момент пересобрать промт или вручную добавить специфические правила вашей компании.'
    },
    {
      num: '04',
      title: 'Подключите телефонию (МТС / А1) и Telegram',
      time: '1 минута',
      desc: 'В разделе «Интеграции» введите SIP-данные от вашего белорусского оператора (логин, пароль, сервер sip.mts.by или sip.a1.by) и токен Telegram-бота. Все заявки будут мгновенно приходить руководителю.',
      tip: 'SIP-логин и пароль выдаются в корпоративном отделе МТС/А1 или в личном кабинете Виртуальной АТС.'
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl rounded-2xl bg-white border border-neutral-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/70">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  Пошаговая инструкция по запуску бота
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Как запустить ИИ-администратора за 5 минут без программистов
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-4">
            {steps.map((s, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-neutral-50/80 border border-neutral-200/80 space-y-2 transition-all hover:bg-white hover:shadow-apple-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-neutral-900 text-white text-[11px] font-mono font-bold flex items-center justify-center">
                      {s.num}
                    </span>
                    <strong className="text-xs font-bold text-neutral-900">
                      {s.title}
                    </strong>
                  </div>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-200/70 text-neutral-700 font-mono">
                    {s.time}
                  </span>
                </div>

                <p className="text-xs text-neutral-600 leading-relaxed pl-8">
                  {s.desc}
                </p>

                <div className="ml-8 p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200/60 text-[11px] text-emerald-900 flex items-start gap-2">
                  <Lightbulb className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                  <span><strong>Совет:</strong> {s.tip}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 border-t border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
            <span className="text-xs text-neutral-500">
              Остались вопросы? Поддержка в Telegram: @voxi_support
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-full bg-neutral-900 hover:bg-black text-white text-xs font-medium shadow-sm transition-all"
            >
              Понятно, приступить
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
