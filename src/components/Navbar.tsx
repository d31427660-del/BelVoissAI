import React, { useState, useEffect } from 'react';
import {
  ArrowRightUpIcon,
  Widget5Icon,
  Logout2Icon,
  HamburgerMenuIcon,
  CloseCircleIcon,
} from '@solar-icons/react/bold-duotone';
import { UserSession } from '../types';
import { VOXI_CONTACTS, TelegramIcon } from '../lib/contacts';

interface NavbarProps {
  currentView: 'landing' | 'dashboard';
  setCurrentView: (view: 'landing' | 'dashboard') => void;
  user: UserSession | null;
  onOpenAuth: (mode?: 'signin' | 'signup') => void;
  onLogout: () => void;
  onOpenVoiceTest: () => void;
}

const NAV_LINKS = [
  { href: '#how-it-works', label: 'Как работает' },
  { href: '#scenarios', label: 'Ниши' },
  { href: '#calculator', label: 'Калькулятор' },
  { href: '#pricing', label: 'Тарифы' },
  { href: '#faq', label: 'FAQ' },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  user,
  onOpenAuth,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-black/[0.06]">
      <div className="relative w-full max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 h-[68px] sm:h-[76px] lg:h-[84px] flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Compact Editorial Brand Lockup */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            setMobileMenuOpen(false);
            setCurrentView('landing');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="inline-flex items-center gap-2 sm:gap-2.5 group shrink-0 min-h-[44px]"
        >
          <svg
            viewBox="0 0 32 32"
            aria-hidden="true"
            className="w-[28px] h-[28px] sm:w-[30px] sm:h-[30px] shrink-0 transition-transform duration-200 group-hover:scale-105"
          >
            <rect width="32" height="32" rx="8" fill="#0A0A0A" />
            <rect x="6.5" y="14" width="2.4" height="5.2" rx="1.2" fill="#FFFFFF" />
            <rect x="10.5" y="10.5" width="2.4" height="9.8" rx="1.2" fill="#FFFFFF" />
            <path
              d="M14.8 15.2L18.4 20.9L25.4 10.2"
              stroke="#6BFF91"
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
          <span className="font-display text-[19px] sm:text-[21px] font-bold tracking-[-0.045em] text-black leading-none">
            voxi<span className="text-[#737373]">.by</span>
          </span>
        </a>

        {/* Center: Clean Section Navigation (optically centered on desktop) */}
        {currentView === 'landing' && (
          <nav
            aria-label="Навигация по разделам"
            className="hidden md:flex items-center gap-1 lg:gap-1.5 lg:absolute lg:left-1/2 lg:-translate-x-1/2"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3 py-2 rounded-full text-[13.5px] font-medium text-[#525252] hover:text-black hover:bg-[#F5F5F5] transition-colors whitespace-nowrap"
              >
                {link.label}
              </a>
            ))}
          </nav>
        )}

        {/* Right: Sign In + Primary CTA + Mobile Menu Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setCurrentView(currentView === 'landing' ? 'dashboard' : 'landing')}
                className="inline-flex items-center gap-2 min-h-[44px] sm:min-h-[40px] px-3.5 sm:px-5 rounded-full bg-black hover:bg-[#171717] text-white text-[12.5px] sm:text-[13px] font-semibold transition-colors cursor-pointer"
              >
                <Widget5Icon size={16} className="text-[#6BFF91]" />
                <span>{currentView === 'landing' ? 'Личный кабинет' : 'На главную'}</span>
              </button>
              <button
                type="button"
                onClick={onLogout}
                aria-label="Выйти из аккаунта"
                className="w-11 h-11 sm:w-10 sm:h-10 rounded-full bg-white hover:bg-[#FFF5F3] border border-black/[0.12] hover:border-[#FE432A]/40 hover:text-[#FE432A] text-black flex items-center justify-center transition-colors cursor-pointer"
              >
                <Logout2Icon size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth('signin');
                }}
                className="hidden sm:inline-flex items-center justify-center min-h-[40px] px-5 rounded-full bg-white hover:bg-[#F5F5F5] border border-black/[0.12] text-[13px] font-semibold text-black transition-colors cursor-pointer whitespace-nowrap"
              >
                Войти
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth('signup');
                }}
                className="min-h-[44px] sm:min-h-[40px] px-3 sm:px-5 rounded-full bg-black hover:bg-[#171717] text-white text-[12.5px] sm:text-[13px] font-semibold inline-flex items-center gap-1.5 sm:gap-2 transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>Попробовать</span>
                <span className="font-mono text-[10.5px] sm:text-[11px] font-bold text-[#6BFF91]">+15 мин</span>
                <ArrowRightUpIcon size={15} className="hidden sm:inline text-white/75" aria-hidden="true" />
              </button>
            </div>
          )}

          {currentView === 'landing' && (
            <button
              type="button"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-menu"
              aria-label={mobileMenuOpen ? 'Закрыть меню навигации' : 'Открыть меню навигации'}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="md:hidden w-11 h-11 rounded-full border border-black/[0.12] bg-white hover:bg-[#F5F5F5] text-black inline-flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              {mobileMenuOpen ? <CloseCircleIcon size={20} aria-hidden="true" /> : <HamburgerMenuIcon size={20} aria-hidden="true" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {currentView === 'landing' && mobileMenuOpen && (
        <nav
          id="mobile-nav-menu"
          aria-label="Мобильная навигация по разделам"
          className="md:hidden border-t border-black/[0.08] bg-white px-4 py-3 shadow-lg"
        >
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between min-h-[44px] px-3.5 rounded-[12px] text-[15px] font-medium text-black hover:bg-[#F5F5F5] transition-colors"
                >
                  <span>{link.label}</span>
                  <ArrowRightUpIcon size={16} className="text-[#737373]" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
          {!user && (
            <div className="mt-3 pt-3 border-t border-black/[0.08] sm:hidden">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth('signin');
                }}
                className="w-full min-h-[44px] px-4 rounded-full bg-white hover:bg-[#F5F5F5] border border-black/[0.14] text-[14px] font-semibold text-black transition-colors cursor-pointer"
              >
                Войти в кабинет
              </button>
            </div>
          )}
          <div className="mt-3 pt-3 border-t border-black/[0.08] flex flex-wrap items-center gap-2">
            <a
              href={VOXI_CONTACTS.phoneTel}
              className="inline-flex items-center min-h-[44px] px-3.5 rounded-full border border-black/[0.12] text-[12.5px] font-mono text-black"
            >
              {VOXI_CONTACTS.phoneDisplay}
            </a>
            <a
              href={VOXI_CONTACTS.telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 rounded-full bg-[#F5F5F5] text-[12.5px] font-medium text-black"
            >
              <TelegramIcon size={14} />
              <span>{VOXI_CONTACTS.telegramHandle}</span>
            </a>
          </div>
        </nav>
      )}
    </header>
  );
};
