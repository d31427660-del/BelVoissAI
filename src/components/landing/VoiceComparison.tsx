import React, { useState, useEffect } from 'react';
import {
  VolumeLoudIcon,
  CheckCircleIcon,
  ChatRoundDotsIcon,
  CalendarMarkIcon,
  SmartphoneIcon,
  HeadphonesRoundIcon
} from '@solar-icons/react/bold-duotone';
import { VoiceSimulator } from '../../lib/speechSynth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardTitle } from '@/components/ui/card';

export const VoiceComparison: React.FC = () => {
  const [playingSide, setPlayingSide] = useState<'old' | 'ai' | null>(null);

  useEffect(() => {
    return () => {
      VoiceSimulator.stop();
    };
  }, []);

  const handlePlayOld = () => {
    if (playingSide === 'old') {
      VoiceSimulator.stop();
      setPlayingSide(null);
    } else {
      VoiceSimulator.stop();
      setPlayingSide('old');
      VoiceSimulator.speak(
        'Здравствуйте... Если вы хотите записаться... нажмите один... Для соединения с оператором... ожидайте на линии...',
        'maxim',
        () => setPlayingSide('old'),
        () => setPlayingSide(null)
      );
    }
  };

  const handlePlayAi = () => {
    if (playingSide === 'ai') {
      VoiceSimulator.stop();
      setPlayingSide(null);
    } else {
      VoiceSimulator.stop();
      setPlayingSide('ai');
      VoiceSimulator.speak(
        'Здравствуйте! Автоцентр Драйв-Минск, меня зовут Анна. У нас как раз есть свободный подъемник на сегодня в 18:30. Записать вас?',
        'anna',
        () => setPlayingSide('ai'),
        () => setPlayingSide(null)
      );
    }
  };

  const afterCallDeliverables = [
    {
      icon: <ChatRoundDotsIcon size={24} className="text-sky-500" />,
      tag: 'За 1 секунду',
      title: 'Карточка в Telegram',
      description: 'Мгновенное уведомление руководителю: контакт клиента, расшифровка сути диалога, сумма заказа в BYN и срочность.'
    },
    {
      icon: <CalendarMarkIcon size={24} className="text-emerald-500" />,
      tag: 'Прямая синхронизация',
      title: 'Запись в YCLIENTS / CRM',
      description: 'Создание брони в выбранный слот и бокс, либо фиксация сделки в Bitrix24 / amoCRM без ручного ввода менеджером.'
    },
    {
      icon: <SmartphoneIcon size={24} className="text-amber-500" />,
      tag: 'За 10 секунд',
      title: 'SMS-визитка клиенту',
      description: 'Автоматическая отправка SMS или Viber с подтверждением времени, точным адресом в Минске и ссылкой на карту.'
    },
    {
      icon: <HeadphonesRoundIcon size={24} className="text-indigo-500" />,
      tag: 'В личном кабинете',
      title: 'Аудиозапись и расшифровка',
      description: 'Полная запись звонка, текстовый транскрипт, анализ удовлетворённости и теги в защищённом хранилище по Закону № 99-З.'
    }
  ];

  return (
    <section id="benchmark" className="py-24 bg-transparent border-y border-black/[0.06] scroll-mt-20">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-20">
        
        {/* PART 1: Audio Benchmark Comparison */}
        <div>
          <div className="mb-12 max-w-2xl space-y-3">
            <Badge variant="outline" className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-slate-300 bg-white/80 text-slate-900 text-xs font-medium shadow-xs">
              Аудио-бенчмарк • Качество речи
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-[40px] text-slate-950 tracking-[-0.025em] font-light leading-tight">
              Естественный диалог.{' '}
              <span className="font-normal text-slate-950">
                Без кнопочных меню и пауз.
              </span>
            </h2>
            <p className="text-[#59544F] text-base leading-relaxed font-normal">
              Сравните тональный автоответчик прошлого поколения и нейросетевую модель Voxi v2.5.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Old Robot Card */}
            <Card className="p-6 sm:p-8 rounded-2xl border-slate-200/90 bg-white/80 shadow-sm space-y-6 flex flex-col justify-between">
              <div className="space-y-5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600">Классический IVR-автоответчик</span>
                  <Badge variant="destructive" className="font-mono text-[11px] font-normal">
                    3 500 мс задержка
                  </Badge>
                </div>

                <div className="space-y-2">
                  <CardTitle className="text-xl font-semibold text-slate-950 tracking-tight">
                    «Нажмите один для соединения...»
                  </CardTitle>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Механическая интонация, длинные голосовые меню и отсутствие понимания живой речи приводят к потере до 45% звонящих клиентов.
                  </p>
                </div>

                <Button
                  type="button"
                  variant={playingSide === 'old' ? 'default' : 'outline'}
                  onClick={handlePlayOld}
                  className="w-full h-11 rounded-full gap-2 text-xs font-medium cursor-pointer"
                >
                  <VolumeLoudIcon size={17} />
                  <span>{playingSide === 'old' ? 'Остановить' : 'Прослушать обычный IVR'}</span>
                </Button>
              </div>

              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 border-t border-slate-100 pt-5">
                <li className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-600 text-xs font-bold flex items-center justify-center shrink-0">✕</span>
                  <span>Заставляет слушать длинное меню цифр</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-600 text-xs font-bold flex items-center justify-center shrink-0">✕</span>
                  <span>Не консультирует по услугам и ценам в BYN</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-600 text-xs font-bold flex items-center justify-center shrink-0">✕</span>
                  <span>Не проверяет свободные окна в расписании</span>
                </li>
              </ul>
            </Card>

            {/* Voxi AI Card */}
            <Card className="p-6 sm:p-8 rounded-2xl bg-neutral-950 text-white border-neutral-800 shadow-xl space-y-6 flex flex-col justify-between relative overflow-hidden">
              <div className="space-y-5 relative z-10">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Voxi.by Neural v2.5
                  </span>
                  <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 bg-emerald-500/10 text-[11px] font-mono font-medium">
                    0.5 сек отклик • МТС и А1
                  </Badge>
                </div>

                <div className="space-y-2">
                  <CardTitle className="text-xl font-semibold text-white tracking-tight">
                    «Здравствуйте! Чем могу помочь?»
                  </CardTitle>
                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal">
                    Живая естественная речь без пауз, точное знание прайс-листа в BYN, сверка слотов и мгновенная отправка заявки в Telegram.
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={handlePlayAi}
                  className={`w-full h-11 rounded-full gap-2 text-xs font-medium cursor-pointer ${
                    playingSide === 'ai'
                      ? 'bg-emerald-400 text-black hover:bg-emerald-300'
                      : 'bg-white hover:bg-slate-100 text-black'
                  }`}
                >
                  <VolumeLoudIcon size={17} />
                  <span>{playingSide === 'ai' ? 'Остановить' : 'Прослушать Voxi v2.5'}</span>
                </Button>
              </div>

              <ul className="space-y-2.5 text-xs sm:text-sm text-zinc-200 border-t border-neutral-800 pt-5 relative z-10">
                <li className="flex items-center gap-2.5">
                  <CheckCircleIcon size={18} className="text-emerald-400 shrink-0" />
                  <span>Отвечает на звонок за 0.5 секунды без очередей</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircleIcon size={18} className="text-emerald-400 shrink-0" />
                  <span>Называет точные цены в BYN и условия рассрочки</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircleIcon size={18} className="text-emerald-400 shrink-0" />
                  <span>Проверяет свободные окна и присылает SMS-визитку</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>

        {/* PART 2: What You Get After Every Call */}
        <div className="space-y-8">
          <div className="max-w-2xl space-y-2">
            <Badge variant="outline" className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-slate-300 bg-white/80 text-slate-900 text-xs font-medium">
              Сквозная автоматизация
            </Badge>
            <h3 className="text-2xl sm:text-3xl font-light text-slate-950 tracking-tight">
              Что вы получаете <span className="font-normal text-slate-950">после каждого звонка</span>
            </h3>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Voxi не просто общается с клиентом, а автоматически закрывает весь цикл пост-обработки звонка без участия администратора.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {afterCallDeliverables.map((item, idx) => (
              <Card
                key={idx}
                className="p-6 rounded-2xl border-slate-200/90 bg-white/85 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-5"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center">
                      {item.icon}
                    </div>
                    <Badge variant="secondary" className="text-[11px] font-mono font-medium">
                      {item.tag}
                    </Badge>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-base font-semibold text-slate-950 tracking-tight">
                      {item.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};