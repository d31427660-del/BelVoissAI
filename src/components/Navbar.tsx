import React, { useState, useEffect } from 'react';
import {
  Widget5Icon,
  Logout2Icon,
  HamburgerMenuIcon,
  CloseCircleIcon
} from '@solar-icons/react/bold-duotone';
import { UserSession } from '../types';
import { VOXI_CONTACTS, TelegramIcon, WhatsAppIcon, InstagramIcon } from '../lib/contacts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface NavbarProps {
  currentView: 'landing' | 'dashboard';
  setCurrentView: (view: 'landing' | 'dashboard') => void;
  user: UserSession | null;
  onOpenAuth: (mode?: 'signin' | 'signup') => void;
  onLogout: () => void;
  onOpenVoiceTest: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  user,
  onOpenAuth,
  onLogout,
  onOpenVoiceTest,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const next = window.scrollY > 36;
          setIsScrolled((prev) => (prev !== next ? next : prev));
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      {/* Main Sticky Header (ElevenLabs Full-Width Minimalist Bar with subtle Liquid Glass) */}
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          isScrolled
            ? 'bg-[#FAF7F2]/85 backdrop-blur-xl border-b border-black/[0.04] shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.02)]'
            : 'bg-[#FAF7F2]/60 backdrop-blur-md border-b border-black/[0.04]'
        }`}
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand Lockup: ElevenLabs Editorial Dual Audio Bars ("II") + Logotype */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setCurrentView('landing');
              setIsMobileMenuOpen(false);
            }}
            className="flex items-center gap-2.5 cursor-pointer group shrink-0"
          >
            <div
              className="w-7 h-7 rounded-lg bg-black p-[1px] transition-transform group-hover:scale-105"
              aria-hidden="true"
            >
              <div className="w-full h-full rounded-[7px] bg-white flex items-center justify-center gap-[2.5px]">
                <span className="w-[2.5px] h-3 rounded-full bg-black" />
                <span className="w-[2.5px] h-3 rounded-full bg-black" />
              </div>
            </div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-[17px] font-semibold tracking-[-0.03em] text-black">
                Voxi
              </span>
              <span className="text-xs font-medium text-[#777169] font-mono">.by</span>
            </div>
          </a>

          {/* Center Navigation Links */}
          {currentView === 'landing' ? (
            <nav
              aria-label="Основная"
              className="hidden lg:flex items-center gap-0.5 text-[13px] font-normal text-[#59544F]"
            >
              <a
                href="#showcase"
                className="px-3 py-1.5 rounded-full hover:bg-black/[0.04] hover:text-black transition-colors"
              >
                Платформа
              </a>
              <a
                href="#benchmark"
                className="px-3 py-1.5 rounded-full hover:bg-black/[0.04] hover:text-black transition-colors"
              >
                Бенчмарк речи
              </a>
              <a
                href="#features"
                className="px-3 py-1.5 rounded-full hover:bg-black/[0.04] hover:text-black transition-colors"
              >
                Возможности
              </a>
              <a
                href="#how-it-works"
                className="px-3 py-1.5 rounded-full hover:bg-black/[0.04] hover:text-black transition-colors"
              >
                Как это работает
              </a>
              <a
                href="#integrations"
                className="px-3 py-1.5 rounded-full hover:bg-black/[0.04] hover:text-black transition-colors"
              >
                Телефония РБ
              </a>
              <a
                href="#faq"
                className="px-3 py-1.5 rounded-full hover:bg-black/[0.04] hover:text-black transition-colors"
              >
                Вопросы
              </a>
            </nav>
          ) : (
            <div className="flex items-center gap-2 text-xs text-[#777169] bg-[#F5F3F1] px-4 py-1.5 rounded-full min-w-0">
              <span className="hidden sm:inline shrink-0">Кабинет</span>
              <span className="text-black/20 hidden sm:inline">/</span>
              <span className="text-black font-medium flex items-center gap-1.5 truncate max-w-[180px] sm:max-w-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate">{user?.companyName || 'Моя компания'}</span>
              </span>
            </div>
          )}

          {/* Right Action Buttons (shadcn UI Button hierarchy) */}
          <div className="flex items-center gap-2">
            {currentView === 'landing' && onOpenVoiceTest && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onOpenVoiceTest}
                className="hidden lg:inline-flex items-center gap-2 h-9 px-3.5 rounded-full border-slate-300 bg-white/80 hover:bg-slate-100 text-slate-900 text-xs font-normal shadow-xs cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Поговорить с Voxi</span>
              </Button>
            )}

            {user ? (
              <div className="flex items-center gap-2">
                {currentView === 'landing' ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setCurrentView('dashboard')}
                    className="flex items-center gap-1.5 h-9 px-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-normal text-xs shadow-xs cursor-pointer"
                  >
                    <Widget5Icon size={15} />
                    <span>Кабинет</span>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentView('landing')}
                    className="h-9 px-4 rounded-full border-slate-300 bg-white/80 hover:bg-slate-100 text-slate-900 text-xs font-normal shadow-xs cursor-pointer"
                  >
                    На главную
                  </Button>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onLogout}
                  aria-label="Выйти из аккаунта"
                  className="w-8 h-8 rounded-full text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                >
                  <Logout2Icon size={16} />
                </Button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenAuth('signin')}
                  className="h-9 px-3.5 rounded-full text-slate-600 hover:text-slate-950 font-normal text-xs cursor-pointer"
                >
                  Войти
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onOpenAuth('signup')}
                  className="h-9 px-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-normal text-xs shadow-xs cursor-pointer"
                >
                  Регистрация
                </Button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            {currentView === 'landing' && (
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Меню"
                aria-expanded={isMobileMenuOpen}
                className="lg:hidden w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-[#1d1d1f]"
              >
                {isMobileMenuOpen ? <CloseCircleIcon size={18} /> : <HamburgerMenuIcon size={18} />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Drawer */}
        {currentView === 'landing' && isMobileMenuOpen && (
          <div className="lg:hidden mx-3 mt-2 rounded-[16px] liquid-glass-card shadow-2xl px-5 py-5 space-y-4">
            <nav aria-label="Мобильная" className="flex flex-col space-y-1 text-sm font-normal text-black">
              <a href="#showcase" onClick={() => setIsMobileMenuOpen(false)} className="py-2 px-3 rounded-lg hover:bg-black/[0.04]">
                Платформа Voxi
              </a>
              <a href="#benchmark" onClick={() => setIsMobileMenuOpen(false)} className="py-2 px-3 rounded-lg hover:bg-black/[0.04]">
                Бенчмарк речи
              </a>
              <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="py-2 px-3 rounded-lg hover:bg-black/[0.04]">
                Возможности
              </a>
              <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="py-2 px-3 rounded-lg hover:bg-black/[0.04]">
                Как это работает
              </a>
              <a href="#integrations" onClick={() => setIsMobileMenuOpen(false)} className="py-2 px-3 rounded-lg hover:bg-black/[0.04]">
                Телефония МТС и А1
              </a>
              <a href="#faq" onClick={() => setIsMobileMenuOpen(false)} className="py-2 px-3 rounded-lg hover:bg-black/[0.04]">
                Вопросы и ответы
              </a>
            </nav>

            <div className="pt-2 flex flex-col gap-2">
              {onOpenVoiceTest && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenVoiceTest();
                  }}
                  className="w-full py-2.5 rounded-full liquid-glass-pill text-black text-xs font-normal flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Поговорить с Voxi</span>
                </button>
              )}
              {!user && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenAuth();
                  }}
                  className="w-full py-2.5 rounded-full liquid-glass-btn-primary text-white text-xs font-normal cursor-pointer"
                >
                  Войти в кабинет
                </button>
              )}
            </div>

            {/* Quick Contacts in Mobile Drawer */}
            <div className="pt-3 border-t border-black/[0.06] space-y-2 text-xs">
              <div className="text-[11px] text-[#777169]">Связаться с менеджером:</div>
              <div className="flex items-center justify-between">
                <a
                  href={VOXI_CONTACTS.phoneTel}
                  className="font-medium text-black hover:underline"
                >
                  {VOXI_CONTACTS.phoneDisplay}
                </a>
                <span className="text-[10px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
                  Звонки 24/7
                </span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <a
                  href={VOXI_CONTACTS.telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-1.5 px-2.5 rounded-lg bg-black/[0.04] hover:bg-black/[0.08] text-black text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <TelegramIcon size={12} className="text-[#0088cc]" />
                  <span>Telegram</span>
                </a>
                <a
                  href={VOXI_CONTACTS.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-1.5 px-2.5 rounded-lg bg-black/[0.04] hover:bg-black/[0.08] text-black text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <WhatsAppIcon size={12} className="text-[#25D366]" />
                  <span>WhatsApp</span>
                </a>
                <a
                  href={VOXI_CONTACTS.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="p-1.5 rounded-lg bg-black/[0.04] hover:bg-black/[0.08] text-[#E4405F] flex items-center justify-center transition-colors"
                >
                  <InstagramIcon size={14} />
                </a>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
