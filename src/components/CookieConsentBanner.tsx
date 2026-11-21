import React, { useState, useEffect } from 'react';
import { ShieldCheckIcon, SettingsIcon, CheckCircleIcon } from '@solar-icons/react/bold-duotone';

export interface CookiePreferences {
  necessary: true;
  functional: boolean;
  analytics: boolean;
  updatedAt: string;
  version: number;
}

export const COOKIE_CONSENT_STORAGE_KEY = 'voxi_cookie_consent_v1';

export function getSavedCookieConsent(): CookiePreferences | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.necessary === true && typeof parsed.functional === 'boolean' && typeof parsed.analytics === 'boolean') {
      return parsed as CookiePreferences;
    }
  } catch {
    // ignore storage errors
  }
  return null;
}

interface CookieConsentBannerProps {
  onOpenPrivacyPolicy: () => void;
  forceOpenTrigger?: number;
}

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({
  onOpenPrivacyPolicy,
  forceOpenTrigger = 0,
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [functional, setFunctional] = useState<boolean>(true);
  const [analytics, setAnalytics] = useState<boolean>(true);

  useEffect(() => {
    const saved = getSavedCookieConsent();
    if (!saved) {
      setIsVisible(true);
    } else {
      setFunctional(saved.functional);
      setAnalytics(saved.analytics);
    }
  }, []);

  useEffect(() => {
    if (forceOpenTrigger > 0) {
      const saved = getSavedCookieConsent();
      if (saved) {
        setFunctional(saved.functional);
        setAnalytics(saved.analytics);
      }
      setShowDetails(true);
      setIsVisible(true);
    }
  }, [forceOpenTrigger]);

  const savePreferences = (nextFunctional: boolean, nextAnalytics: boolean) => {
    const payload: CookiePreferences = {
      necessary: true,
      functional: nextFunctional,
      analytics: nextAnalytics,
      updatedAt: new Date().toISOString(),
      version: 1,
    };
    try {
      localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore quota errors
    }
    setFunctional(nextFunctional);
    setAnalytics(nextAnalytics);
    setShowDetails(false);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <aside
      role="region"
      aria-label="Уведомление об использовании файлов cookie"
      className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-5 sm:max-w-md z-50 max-h-[60vh] sm:max-h-[75vh] overflow-y-auto rounded-[16px] liquid-glass-card shadow-2xl p-3.5 sm:p-4 text-black"
    >
      <div className="space-y-2.5">
        <div className="flex items-start gap-2.5">
          <div
            className="w-7 h-7 rounded-[9px] bg-black text-white flex items-center justify-center shrink-0 mt-0.5"
            aria-hidden="true"
          >
            <ShieldCheckIcon size={15} />
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h2 className="text-xs font-semibold text-black">
                Файлы cookie (Закон РБ № 99-З)
              </h2>
              <span className="px-1.5 py-0.5 rounded-full liquid-glass-pill text-[#777169] text-[10px] font-normal">
                НЦЗПД РБ
              </span>
            </div>
            <p className="text-[11px] text-[#59544F] leading-snug">
              Используем технические cookie для работы сайта и авторизации, а с вашего согласия — функциональные и аналитические.{' '}
              <button
                type="button"
                onClick={onOpenPrivacyPolicy}
                className="text-black underline underline-offset-2 font-medium cursor-pointer inline"
              >
                Политика конфиденциальности
              </button>
            </p>
          </div>
        </div>

        {showDetails && (
          <div className="p-3.5 rounded-[12px] liquid-glass-cream border border-black/[0.06] space-y-2.5 text-xs">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium text-black flex flex-wrap items-center gap-1.5">
                  <span>Технические (обязательные)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium whitespace-nowrap shrink-0">
                    Всегда активны
                  </span>
                </div>
                <p className="text-[11px] text-[#777169] mt-0.5">
                  Необходимы для работы личного кабинета, защиты сессии и сохранения вашего выбора по файлам cookie.
                </p>
              </div>
              <input
                type="checkbox"
                checked
                disabled
                aria-label="Технические обязательные файлы cookie"
                className="w-4 h-4 rounded accent-black mt-0.5 opacity-70"
              />
            </div>

            <div className="border-t border-black/[0.06] pt-2 flex items-start justify-between gap-3">
              <label htmlFor="cookie-functional" className="cursor-pointer">
                <div className="font-medium text-black">Функциональные</div>
                <p className="text-[11px] text-[#777169] mt-0.5">
                  Запоминают выбранный голос ассистента (Анна / Максим), сферу бизнеса и черновики настроек в браузере.
                </p>
              </label>
              <input
                id="cookie-functional"
                type="checkbox"
                checked={functional}
                onChange={(e) => setFunctional(e.target.checked)}
                className="w-4 h-4 rounded accent-black mt-0.5 cursor-pointer shrink-0"
              />
            </div>

            <div className="border-t border-black/[0.06] pt-2 flex items-start justify-between gap-3">
              <label htmlFor="cookie-analytics" className="cursor-pointer">
                <div className="font-medium text-black">Аналитические</div>
                <p className="text-[11px] text-[#777169] mt-0.5">
                  Помогают оценивать скорость работы голосового шлюза и удобство интерфейса в обезличенном виде.
                </p>
              </label>
              <input
                id="cookie-analytics"
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                className="w-4 h-4 rounded accent-black mt-0.5 cursor-pointer shrink-0"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          <button
            type="button"
            onClick={() => savePreferences(true, true)}
            className="min-h-[44px] sm:min-h-[38px] px-3.5 py-2 rounded-full liquid-glass-btn-primary text-white text-xs font-normal inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-[0.98] whitespace-nowrap"
          >
            <CheckCircleIcon size={14} aria-hidden="true" />
            <span>Принять все</span>
          </button>

          <button
            type="button"
            onClick={() => savePreferences(false, false)}
            className="min-h-[44px] sm:min-h-[38px] px-3.5 py-2 rounded-full liquid-glass-pill text-black text-xs font-normal inline-flex items-center justify-center transition-colors cursor-pointer hover:bg-white whitespace-nowrap"
          >
            Только необходимые
          </button>

          {showDetails ? (
            <button
              type="button"
              onClick={() => savePreferences(functional, analytics)}
              className="min-h-[44px] sm:min-h-[38px] px-3.5 py-2 rounded-full liquid-glass-pill text-black text-xs font-medium inline-flex items-center justify-center transition-colors cursor-pointer hover:bg-white whitespace-nowrap"
            >
              Сохранить выбор
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowDetails(true)}
              className="min-h-[44px] sm:min-h-[38px] px-3.5 py-2 rounded-full liquid-glass-pill text-[#59544F] hover:text-black text-xs font-normal inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer hover:bg-white whitespace-nowrap"
            >
              <SettingsIcon size={14} aria-hidden="true" />
              <span>Настроить</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
