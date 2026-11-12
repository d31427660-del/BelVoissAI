import React, { useState, useEffect } from 'react';
import {
  Widget5Icon,
  Logout2Icon,
  HamburgerMenuIcon,
  CloseCircleIcon
} from '@solar-icons/react/bold-duotone';
import { UserSession } from '../types';

interface NavbarProps {
  currentView: 'landing' | 'dashboard';
  setCurrentView: (view: 'landing' | 'dashboard') => void;
  user: UserSession | null;
  onOpenAuth: () => void;
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
            ? 'bg-white/75 backdrop-blur-xl border-b border-white/70 shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.04),0_8px_24px_-4px_rgba(0,0,0,0.03)]'
            : 'bg-white/60 backdrop-blur-md border-b border-black/[0.04]'
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
              className="hidden md:flex items-center gap-0.5 text-[13px] font-normal text-[#59544F]"
            >
              <a
                href="#showcase"
                className="px-3 py-1.5 rounded-full hover:bg-black/[0.04] hover:text-black transition-colors"
              >
                Платформа
              </a>
              <a
                href="#who"
                className="px-3 py-1.5 rounded-full hover:bg-black/[0.04] hover:text-black transition-colors"
              >
                Решения
              </a>
              <a
                href="#benchmark"
                className="px-3 py-1.5 rounded-full hover:bg-black/[0.04] hover:text-black transition-colors"
              >
                Бенчмарк речи
              </a>
              <a
                href="#pricing"
                className="px-3 py-1.5 rounded-full hover:bg-black/[0.04] hover:text-black transition-colors"
              >
                Тарифы
              </a>
              <a
                href="#calculator"
                className="px-3 py-1.5 rounded-full hover:bg-black/[0.04] hover:text-black transition-colors"
              >
                Окупаемость
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
                <span className="truncate">{user?.companyName || 'Автошкола "Драйв-Минск"'}</span>
              </span>
            </div>
          )}

          {/* Right Action Buttons (ElevenLabs Exact Button Hierarchy) */}
          <div className="flex items-center gap-2">
            {currentView === 'landing' && onOpenVoiceTest && (
              <button
                type="button"
                onClick={onOpenVoiceTest}
                className="hidden lg:inline-flex items-center gap-2 h-9 px-3.5 rounded-full liquid-glass-pill text-black active:scale-[0.98] text-xs font-normal transition-all whitespace-nowrap cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Поговорить с Voxi</span>
              </button>
            )}

            {user ? (
              <div className="flex items-center gap-2">
                {currentView === 'landing' ? (
                  <button
                    type="button"
                    onClick={() => setCurrentView('dashboard')}
                    className="flex items-center gap-1.5 h-9 px-4 rounded-full liquid-glass-btn-primary active:scale-[0.98] text-white font-normal text-xs transition-all whitespace-nowrap cursor-pointer"
                  >
                    <Widget5Icon size={15} />
                    <span>Кабинет</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCurrentView('landing')}
                    className="h-9 px-4 rounded-full liquid-glass-pill hover:bg-black/[0.08] text-black text-xs font-normal transition-colors whitespace-nowrap cursor-pointer"
                  >
                    На главную
                  </button>
                )}

                <button
                  type="button"
                  onClick={onLogout}
                  aria-label="Выйти из аккаунта"
                  className="w-8 h-8 rounded-full liquid-glass-pill text-[#777169] hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Logout2Icon size={16} />
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1">
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="h-9 px-3.5 rounded-full text-[#59544F] hover:text-black font-normal text-xs transition-colors whitespace-nowrap cursor-pointer"
                >
                  Войти
                </button>
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="h-9 px-4 rounded-full liquid-glass-btn-primary text-white font-normal text-xs transition-all whitespace-nowrap cursor-pointer active:scale-[0.98]"
                >
                  Регистрация
                </button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            {currentView === 'landing' && (
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Меню"
                aria-expanded={isMobileMenuOpen}
                className="md:hidden w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-[#1d1d1f]"
              >
                {isMobileMenuOpen ? <CloseCircleIcon size={18} /> : <HamburgerMenuIcon size={18} />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Drawer */}
        {currentView === 'landing' && isMobileMenuOpen && (
          <div className="md:hidden mx-3 mt-2 rounded-[16px] liquid-glass-card shadow-2xl px-5 py-5 space-y-4">
            <nav aria-label="Мобильная" className="flex flex-col space-y-1 text-sm font-normal text-black">
              <a href="#showcase" onClick={() => setIsMobileMenuOpen(false)} className="py-2 px-3 rounded-lg hover:bg-black/[0.04]">
                Платформа Voxi
              </a>
              <a href="#who" onClick={() => setIsMobileMenuOpen(false)} className="py-2 px-3 rounded-lg hover:bg-black/[0.04]">
                Отраслевые решения
              </a>
              <a href="#benchmark" onClick={() => setIsMobileMenuOpen(false)} className="py-2 px-3 rounded-lg hover:bg-black/[0.04]">
                Бенчмарк речи
              </a>
              <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="py-2 px-3 rounded-lg hover:bg-black/[0.04]">
                Тарифы и минуты
              </a>
              <a href="#calculator" onClick={() => setIsMobileMenuOpen(false)} className="py-2 px-3 rounded-lg hover:bg-black/[0.04]">
                Расчет окупаемости
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
          </div>
        )}
      </header>
    </>
  );
};
