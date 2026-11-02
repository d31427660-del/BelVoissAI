import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRightIcon,
  SoundwaveCircleIcon,
  PauseIcon,
  PlayIcon,
  ChatRoundCallIcon
} from '@solar-icons/react/bold-duotone';
import { VoiceSimulator } from '../../lib/speechSynth';
import { VoiceId } from '../../types';

interface HeroProps {
  onOpenVoiceTest?: () => void;
  onOpenAuth: () => void;
}

interface QuickQuestion {
  id: string;
  question: string;
  answerAnna: string;
  answerDmitry: string;
}

const QUICK_QUESTIONS: QuickQuestion[] = [
  {
    id: 'price',
    question: 'Сколько стоит услуга и есть ли рассрочка?',
    answerAnna: 'Полный курс обучения стоит тысячу пятьдесят белорусских рублей. Мы оформляем беспроцентную рассрочку на четыре платежа без справок о доходах.',
    answerDmitry: 'Комплексная диагностика стоит тридцать пять рублей, но при ремонте в нашем автосервисе она полностью бесплатна. Оплата возможна картой рассрочки.'
  },
  {
    id: 'booking',
    question: 'Можно записаться на сегодня после 18:00?',
    answerAnna: 'Да, конечно! Сегодня в восемнадцать тридцать есть свободное место на вводное занятие. Подскажите ваше имя, и я сразу отправлю пропуск вам в Телеграм.',
    answerDmitry: 'Да, сегодня на восемнадцать тридцать свободен второй бокс. Назовите марку автомобиля, и я забронирую время за вами.'
  },
  {
    id: 'location',
    question: 'Где вы находитесь и работаете ли в выходные?',
    answerAnna: 'Мы находимся в Минске на улице Сурганова двадцать четыре, в двух минутах от метро Академия Наук. Работаем ежедневно с девяти утра до девяти вечера, включая выходные.',
    answerDmitry: 'Наш сервис находится на улице Тимирязева сто двадцать один, удобный заезд со стороны МКАД. Работаем без выходных с девяти утра до восьми вечера.'
  }
];

export const Hero: React.FC<HeroProps> = ({
  onOpenAuth
}) => {
  const [selectedVoice, setSelectedVoice] = useState<VoiceId>('anna');
  const [activeQuestionId, setActiveQuestionId] = useState<string>('price');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const currentItem = QUICK_QUESTIONS.find((q) => q.id === activeQuestionId) || QUICK_QUESTIONS[0];
  const currentAnswerText = selectedVoice === 'dmitry' ? currentItem.answerDmitry : currentItem.answerAnna;

  const playQuestionAnswer = (questionObj: QuickQuestion, voiceOverride?: VoiceId) => {
    const targetVoice = voiceOverride || selectedVoice;
    const textToSpeak = targetVoice === 'dmitry' ? questionObj.answerDmitry : questionObj.answerAnna;

    setActiveQuestionId(questionObj.id);
    VoiceSimulator.stop();

    VoiceSimulator.speak(
      textToSpeak,
      targetVoice,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    );
  };

  const handleOrbToggle = () => {
    if (isSpeaking) {
      VoiceSimulator.stop();
      setIsSpeaking(false);
    } else {
      playQuestionAnswer(currentItem);
    }
  };

  const handleVoiceChange = (voice: VoiceId) => {
    setSelectedVoice(voice);
    if (isSpeaking) {
      playQuestionAnswer(currentItem, voice);
    }
  };

  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-24 bg-[#ffffff]">
      {/* Light & Airy Ambient Background Glows */}
      <div className="pointer-events-none absolute -top-32 right-[10%] w-[560px] h-[560px] rounded-full bg-gradient-to-tr from-blue-400/15 via-indigo-400/10 to-emerald-300/15 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -left-32 w-[420px] h-[420px] rounded-full bg-gradient-to-br from-sky-300/10 to-blue-400/5 blur-3xl" />

      <div className="max-w-[1080px] mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          
          {/* LEFT COLUMN: Clean Headline, Concise Offer & Primary Button */}
          <div className="lg:col-span-6 space-y-7">
            
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50/90 border border-blue-100 text-[#2563eb] text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Голосовой ИИ для бизнеса в Беларуси • Отклик 0.5 сек</span>
            </div>

            <h1 className="apple-heading text-4xl sm:text-5xl lg:text-[58px] text-[#1d1d1f] tracking-tight leading-[1.06]">
              ИИ-администратор,{' '}
              <span className="bg-gradient-to-r from-[#2563eb] via-[#4f46e5] to-emerald-500 bg-clip-text text-transparent">
                который отвечает на звонки 24/7.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-lg font-normal leading-relaxed">
              Естественно общается с клиентами без пауз, считает стоимость услуг в BYN, подключается к номерам МТС и А1 за 5 минут и сразу отправляет готовые заявки в CRM и Telegram.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3.5">
              <button
                onClick={onOpenAuth}
                className="px-8 py-4 rounded-full bg-gradient-to-r from-[#2563eb] to-[#4f46e5] hover:from-[#1d4ed8] hover:to-[#4338ca] text-[#ffffff] font-semibold text-sm flex items-center gap-2.5 shadow-lg shadow-blue-500/25 transition-all whitespace-nowrap"
              >
                <span>Настроить за 5 минут</span>
                <ArrowRightIcon size={18} />
              </button>

              <a
                href="#calculator"
                className="px-6 py-4 rounded-full bg-slate-100 hover:bg-slate-200/80 text-[#1d1d1f] font-semibold text-sm transition-colors whitespace-nowrap"
              >
                Рассчитать выгоду в BYN
              </a>
            </div>

          </div>

          {/* RIGHT COLUMN: Floating Siri-Style Interactive Voice Sphere + 3 Client Questions */}
          <div className="lg:col-span-6 flex flex-col items-center">
            
            {/* Voice Toggle Pill Above Sphere */}
            <div className="inline-flex items-center gap-1 bg-slate-100/90 backdrop-blur-md p-1 rounded-full border border-slate-200/70 mb-6">
              <button
                type="button"
                onClick={() => handleVoiceChange('anna')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedVoice === 'anna'
                    ? 'bg-[#ffffff] text-[#2563eb] shadow-sm'
                    : 'text-slate-600 hover:text-[#1d1d1f]'
                }`}
              >
                Голос: Анна (Автошкола)
              </button>
              <button
                type="button"
                onClick={() => handleVoiceChange('dmitry')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedVoice === 'dmitry'
                    ? 'bg-[#ffffff] text-[#2563eb] shadow-sm'
                    : 'text-slate-600 hover:text-[#1d1d1f]'
                }`}
              >
                Голос: Дмитрий (СТО)
              </button>
            </div>

            {/* SIRI-STYLE PULSING VOICE SPHERE (Frameless, Floating) */}
            <div className="relative w-60 h-60 sm:w-64 sm:h-64 flex items-center justify-center select-none my-2">
              
              {/* Outer Expanding Acoustic Ripples */}
              <motion.div
                animate={{
                  scale: isSpeaking ? [1, 1.38, 1] : [1, 1.08, 1],
                  opacity: isSpeaking ? [0.45, 0.05, 0.45] : [0.22, 0.08, 0.22],
                }}
                transition={{ duration: isSpeaking ? 1.5 : 3.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#2563eb]/30 via-indigo-400/25 to-emerald-400/30 blur-xl"
              />

              <motion.div
                animate={{
                  scale: isSpeaking ? [1, 1.24, 1] : [1, 1.05, 1],
                  opacity: isSpeaking ? [0.6, 0.15, 0.6] : [0.3, 0.15, 0.3],
                }}
                transition={{ duration: isSpeaking ? 1.1 : 3, delay: 0.2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-4 rounded-full border border-blue-400/30"
              />

              {/* Rotating Fluid Gradient Lobe 1 */}
              <motion.div
                animate={{
                  rotate: 360,
                  scale: isSpeaking ? [1, 1.12, 0.96, 1] : [1, 1.03, 1],
                }}
                transition={{
                  rotate: { duration: isSpeaking ? 5 : 14, repeat: Infinity, ease: 'linear' },
                  scale: { duration: isSpeaking ? 0.8 : 3, repeat: Infinity, ease: 'easeInOut' }
                }}
                className="absolute w-44 h-44 sm:w-48 sm:h-48 rounded-[46%] bg-gradient-to-tr from-[#2563eb] via-[#4f46e5] to-sky-400 opacity-85 blur-[2px] shadow-[0_20px_60px_rgba(37,99,235,0.4)]"
              />

              {/* Counter-Rotating Fluid Gradient Lobe 2 (Emerald/Cyan highlight) */}
              <motion.div
                animate={{
                  rotate: -360,
                  scale: isSpeaking ? [0.95, 1.14, 1, 0.95] : [0.98, 1.04, 0.98],
                }}
                transition={{
                  rotate: { duration: isSpeaking ? 4 : 11, repeat: Infinity, ease: 'linear' },
                  scale: { duration: isSpeaking ? 0.7 : 3.5, repeat: Infinity, ease: 'easeInOut' }
                }}
                className="absolute w-40 h-40 sm:w-44 sm:h-44 rounded-[44%] bg-gradient-to-bl from-emerald-400 via-sky-400 to-indigo-600 opacity-75 mix-blend-screen blur-[1px]"
              />

              {/* Core Interactive Sphere Button */}
              <motion.button
                type="button"
                onClick={handleOrbToggle}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="relative z-10 w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-gradient-to-b from-white/25 to-white/5 backdrop-blur-md border border-white/40 shadow-inner flex flex-col items-center justify-center text-white cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-full bg-white/95 text-[#2563eb] shadow-md flex items-center justify-center transition-transform group-hover:scale-105">
                  {isSpeaking ? (
                    <PauseIcon size={22} />
                  ) : (
                    <PlayIcon size={22} className="ml-0.5" />
                  )}
                </div>
                <span className="mt-2.5 text-[11px] font-semibold tracking-wide text-white drop-shadow-sm">
                  {isSpeaking ? 'Говорит ИИ...' : 'Послушать ИИ'}
                </span>
              </motion.button>
            </div>

            {/* Live AI Response Subtitle Bubble */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${selectedVoice}-${activeQuestionId}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="mt-3 mb-5 max-w-md text-center px-5 py-3 rounded-[24px] bg-blue-50/70 border border-blue-100/80 text-xs sm:text-sm text-slate-700 leading-relaxed"
              >
                <span className="font-semibold text-[#2563eb] mr-1.5">
                  {selectedVoice === 'dmitry' ? 'Дмитрий:' : 'Анна:'}
                </span>
                «{currentAnswerText}»
              </motion.div>
            </AnimatePresence>

            {/* 3 Interactive Client Question Buttons */}
            <div className="w-full max-w-md space-y-2">
              <div className="text-[11px] font-semibold text-slate-400 text-center uppercase tracking-wider mb-2">
                Нажмите на вопрос клиента — ИИ сразу ответит голосом:
              </div>

              {QUICK_QUESTIONS.map((item) => {
                const isSelected = activeQuestionId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => playQuestionAnswer(item)}
                    className={`w-full px-5 py-3.5 rounded-full text-xs sm:text-sm font-medium flex items-center justify-between gap-3 transition-all text-left ${
                      isSelected
                        ? 'bg-[#2563eb] text-[#ffffff] shadow-md shadow-blue-500/20'
                        : 'bg-slate-100/90 hover:bg-blue-50 text-[#1d1d1f] border border-slate-200/60'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <ChatRoundCallIcon size={17} className={isSelected ? 'text-white shrink-0' : 'text-[#2563eb] shrink-0'} />
                      <span className="truncate">«{item.question}»</span>
                    </span>
                    <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-white text-[#2563eb]'
                    }`}>
                      {isSelected && isSpeaking ? '● Звучит' : 'Слушать'}
                    </span>
                  </button>
                );
              })}
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
