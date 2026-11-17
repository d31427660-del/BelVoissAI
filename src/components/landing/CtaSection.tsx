import React from 'react';
import { ArrowRightIcon, PhoneCallingRoundedIcon } from '@solar-icons/react/bold-duotone';
import { VOXI_CONTACTS, TelegramIcon, WhatsAppIcon } from '../../lib/contacts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface CtaSectionProps {
  onOpenAuth: () => void;
  onOpenVoiceTest: () => void;
}

export const CtaSection: React.FC<CtaSectionProps> = ({ onOpenAuth, onOpenVoiceTest }) => {
  return (
    <section className="py-20 bg-transparent border-t border-black/[0.06]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-12">
        
        {/* Main Obsidian Card (shadcn/ui Card Dark) */}
        <Card className="rounded-3xl bg-neutral-950 text-white border-neutral-800 shadow-2xl p-8 sm:p-12 lg:p-14 relative overflow-hidden">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4 text-left">
              <Badge
                variant="outline"
                className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border-white/20 text-white text-xs font-normal backdrop-blur-sm"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                <span>15 минут бесплатно при регистрации • 0 BYN абонплата</span>
              </Badge>

              <h2 className="text-3xl sm:text-5xl text-white tracking-[-0.025em] leading-[1.08] font-light">
                Ни одного пропущенного звонка.{' '}
                <span className="text-neutral-400 font-normal">
                  Уже сегодня.
                </span>
              </h2>

              <p className="text-white/80 text-sm sm:text-base max-w-xl leading-relaxed font-normal">
                Настройте голосового ИИ-администратора за 5 минут, подключите номер МТС или А1 и получайте готовые заявки в CRM и Telegram.
              </p>
            </div>

            <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col items-stretch gap-3">
              <Button
                type="button"
                size="lg"
                onClick={onOpenAuth}
                className="w-full h-12 px-6 rounded-full bg-white hover:bg-neutral-100 text-black font-medium text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <span>Создать ИИ-агента бесплатно</span>
                <ArrowRightIcon size={16} />
              </Button>

              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={onOpenVoiceTest}
                className="w-full h-12 px-6 rounded-full bg-white/10 hover:bg-white/20 text-white border-white/20 font-medium text-sm flex items-center justify-center gap-2.5 transition-colors cursor-pointer backdrop-blur-md"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                </span>
                <PhoneCallingRoundedIcon size={17} />
                <span>Поговорить с Voxi в браузере</span>
              </Button>

              <div className="pt-1 flex flex-wrap items-center justify-center lg:justify-start gap-x-3 gap-y-1 text-[11px] text-white/75">
                <span>Вопросы по подключению:</span>
                <a
                  href={VOXI_CONTACTS.telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:underline font-medium inline-flex items-center gap-1 transition-opacity hover:opacity-90"
                >
                  <TelegramIcon size={12} />
                  <span>Telegram</span>
                </a>
                <span className="text-white/30">•</span>
                <a
                  href={VOXI_CONTACTS.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:underline font-medium inline-flex items-center gap-1 transition-opacity hover:opacity-90"
                >
                  <WhatsAppIcon size={12} />
                  <span>WhatsApp</span>
                </a>
                <span className="text-white/30">•</span>
                <a
                  href={VOXI_CONTACTS.phoneTel}
                  className="text-white hover:underline font-medium font-mono"
                >
                  {VOXI_CONTACTS.phoneDisplay}
                </a>
              </div>
            </div>
          </div>
        </Card>

        {/* Pre-Footer Wide Horizontal Banner */}
        <div className="pt-4 border-t border-black/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight">
              Платформа речевого ИИ для бизнеса Беларуси
            </div>
            <div className="text-xs text-[#777169] mt-0.5 font-normal">
              Без привязки карты • Официальный договор РБ (УНП 193991846) • МТС, А1, Белтелеком
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenVoiceTest}
              className="rounded-full border-slate-300 bg-white hover:bg-slate-50 text-slate-900 text-xs font-medium shadow-xs"
            >
              Тестовый звонок
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={onOpenAuth}
              className="rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-sm"
            >
              Личный кабинет →
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
