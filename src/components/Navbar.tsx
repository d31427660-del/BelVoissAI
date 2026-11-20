import React from 'react';
import { ArrowRightUpIcon, Widget5Icon, Logout2Icon } from '@solar-icons/react/bold-duotone';
import { UserSession } from '../types';

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
  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-black/[0.06]">
      <div className="relative w-full max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 h-[68px] sm:h-[76px] lg:h-[84px] flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Compact Editorial Brand Lockup */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            setCurrentView('landing');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="inline-flex items-center gap-2 sm:gap-2.5 group shrink-0"
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
            className="hidden md:flex items-center gap-1 lg:gap-2 lg:absolute lg:left-1/2 lg:-translate-x-1/2"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3.5 py-2 rounded-full text-[13.5px] font-medium text-[#525252] hover:text-black hover:bg-[#F5F5F5] transition-colors whitespace-nowrap"
              >
                {link.label}
              </a>
            ))}
          </nav>
        )}

        {/* Right: Sign In + Primary CTA */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setCurrentView(currentView === 'landing' ? 'dashboard' : 'landing')}
                className="inline-flex items-center gap-2 h-9 sm:h-10 px-3.5 sm:px-5 rounded-full bg-black hover:bg-[#171717] text-white text-[12.5px] sm:text-[13px] font-semibold transition-colors cursor-pointer"
              >
                <Widget5Icon size={16} className="text-[#6BFF91]" />
                <span>{currentView === 'landing' ? 'Личный кабинет' : 'На главную'}</span>
              </button>
              <button
                type="button"
                onClick={onLogout}
                aria-label="Выйти из аккаунта"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white hover:bg-[#FFF5F3] border border-black/[0.12] hover:border-[#FE432A]/40 hover:text-[#FE432A] text-black flex items-center justify-center transition-colors cursor-pointer"
              >
                <Logout2Icon size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => onOpenAuth('signin')}
                className="h-9 sm:h-10 px-3 sm:px-5 rounded-full bg-white hover:bg-[#F5F5F5] border border-black/[0.12] text-[12.5px] sm:text-[13px] font-semibold text-black transition-colors cursor-pointer whitespace-nowrap"
              >
                Войти
              </button>

              <button
                type="button"
                onClick={() => onOpenAuth('signup')}
                className="h-9 sm:h-10 px-3 sm:px-5 rounded-full bg-black hover:bg-[#171717] text-white text-[12.5px] sm:text-[13px] font-semibold inline-flex items-center gap-1.5 sm:gap-2 transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>Попробовать</span>
                <span className="font-mono text-[10.5px] sm:text-[11px] font-bold text-[#6BFF91]">+15 мин</span>
                <ArrowRightUpIcon size={15} className="hidden sm:inline text-white/75" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
