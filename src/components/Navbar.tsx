import React, { useState } from 'react';
import {
  Microphone3Icon,
  Widget5Icon,
  Logout2Icon,
  HamburgerMenuIcon,
  CloseCircleIcon,
  SoundwaveCircleIcon
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

  return (
    <header className="sticky top-3 z-50 w-full px-3 sm:px-6 transition-all">
      <div className="max-w-[1080px] mx-auto px-4 sm:px-6 h-14 rounded-full bg-[#ffffff]/85 backdrop-blur-xl border border-[#e5e5ea] shadow-apple-sm flex items-center justify-between">
        
        {/* Brand Logo (Rounded Apple Minimalist Style with Solar Icon) */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            setCurrentView('landing');
            setIsMobileMenuOpen(false);
          }}
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#2563eb] to-[#4f46e5] shadow-sm shadow-blue-500/25 flex items-center justify-center text-[#ffffff] transition-transform group-hover:scale-105" aria-hidden="true">
            <Microphone3Icon size={17} />
          </div>
          <div className="flex items-baseline gap-0.5">
            <span className="text-base font-extrabold tracking-tight text-[#1d1d1f]">
              Voxi
            </span>
            <span className="text-xs font-bold text-[#2563eb]">.by</span>
          </div>
        </a>

        {/* Navigation Links */}
        {currentView === 'landing' ? (
          <nav aria-label="Основная" className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-full text-xs font-medium text-[#1d1d1f]/80">
            <a href="#who" className="px-3.5 py-1.5 rounded-full hover:bg-[#ffffff] hover:text-[#2563eb] transition-all">
              Отрасли
            </a>
            <a href="#features" className="px-3.5 py-1.5 rounded-full hover:bg-[#ffffff] hover:text-[#2563eb] transition-all">
              Технологии
            </a>
            <a href="#calculator" className="px-3.5 py-1.5 rounded-full hover:bg-[#ffffff] hover:text-[#2563eb] transition-all">
              Окупаемость
            </a>
            <a href="#pricing" className="px-3.5 py-1.5 rounded-full hover:bg-[#ffffff] hover:text-[#2563eb] transition-all">
              Стоимость минут
            </a>
            <a href="#integrations" className="px-3.5 py-1.5 rounded-full hover:bg-[#ffffff] hover:text-[#2563eb] transition-all">
              Телефония РБ
            </a>
          </nav>
        ) : (
          <div className="flex items-center gap-2 text-xs text-[#86868b] bg-slate-100 px-4 py-1.5 rounded-full min-w-0">
            <span className="hidden sm:inline shrink-0">Кабинет</span>
            <span className="text-[#d2d2d7] hidden sm:inline">/</span>
            <span className="text-[#1d1d1f] font-medium flex items-center gap-1.5 truncate max-w-[180px] sm:max-w-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
              <span className="truncate">{user?.companyName || 'Автошкола "Драйв-Минск"'}</span>
            </span>
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          {user ? (
            <div className="flex items-center gap-2">
              {currentView === 'landing' ? (
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#2563eb] to-[#4f46e5] hover:from-[#1d4ed8] hover:to-[#4338ca] text-[#ffffff] font-semibold text-xs shadow-sm shadow-blue-500/20 transition-all whitespace-nowrap"
                >
                  <Widget5Icon size={15} />
                  <span>Кабинет</span>
                </button>
              ) : (
                <button
                  onClick={() => setCurrentView('landing')}
                  className="px-4 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-[#1d1d1f] text-xs font-medium transition-colors whitespace-nowrap"
                >
                  На главную
                </button>
              )}

              <button
                type="button"
                onClick={onLogout}
                aria-label="Выйти из аккаунта"
                className="w-8 h-8 rounded-full bg-slate-100 text-[#6e6e73] hover:text-rose-600 flex items-center justify-center transition-colors"
              >
                <Logout2Icon size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="hidden sm:inline-flex px-4 py-1.5 rounded-full bg-gradient-to-r from-[#2563eb] to-[#4f46e5] hover:from-[#1d4ed8] hover:to-[#4338ca] text-[#ffffff] font-semibold text-xs shadow-sm shadow-blue-500/20 transition-all whitespace-nowrap"
            >
              Войти
            </button>
          )}

          {/* Mobile Menu Toggle */}
          {currentView === 'landing' && (
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Меню"
              aria-expanded={isMobileMenuOpen}
              className="md:hidden w-8 h-8 rounded-full bg-[#f5f5f7] flex items-center justify-center text-[#1d1d1f]"
            >
              {isMobileMenuOpen ? <CloseCircleIcon size={18} /> : <HamburgerMenuIcon size={18} />}
            </button>
          )}
        </div>

      </div>

      {/* Mobile Drawer (Rounded Floating Card) */}
      {currentView === 'landing' && isMobileMenuOpen && (
        <div className="md:hidden mt-2 rounded-[32px] bg-[#ffffff] border border-[#e5e5ea] shadow-apple-card px-6 py-5 space-y-4">
          <nav aria-label="Мобильная" className="flex flex-col space-y-2 text-sm font-medium text-[#1d1d1f]">
            <a href="#who" onClick={() => setIsMobileMenuOpen(false)} className="py-2 px-3 rounded-2xl hover:bg-[#f5f5f7]">
              Отрасли
            </a>
            <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="py-2 px-3 rounded-2xl hover:bg-[#f5f5f7]">
              Технологии
            </a>
            <a href="#calculator" onClick={() => setIsMobileMenuOpen(false)} className="py-2 px-3 rounded-2xl hover:bg-[#f5f5f7]">
              Калькулятор окупаемости (BYN)
            </a>
            <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="py-2 px-3 rounded-2xl hover:bg-[#f5f5f7]">
              Стоимость минут
            </a>
            <a href="#integrations" onClick={() => setIsMobileMenuOpen(false)} className="py-2 px-3 rounded-2xl hover:bg-[#f5f5f7]">
              Телефония МТС и А1
            </a>
          </nav>

          <div className="pt-2 flex flex-col gap-2">
            {!user && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenAuth();
                }}
                className="w-full py-3 rounded-full bg-[#1d1d1f] text-[#ffffff] font-medium text-xs"
              >
                Войти в кабинет
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
