import React, { useState, useEffect, Suspense, lazy } from 'react';
import { SolarProvider } from '@solar-icons/react';
import { Navbar } from './components/Navbar';
import { ScrollProgressBar } from './components/landing/ScrollProgressBar';
import { Hero } from './components/landing/Hero';
import { CallJourneyScroll } from './components/landing/CallJourneyScroll';
import { BeforeAfterComparison } from './components/landing/BeforeAfterComparison';
import { NicheScenarios } from './components/landing/NicheScenarios';
import { TelephonyIntegrations } from './components/landing/TelephonyIntegrations';
import { ValueAndPricing } from './components/landing/ValueAndPricing';
import { FaqAndPilotCta } from './components/landing/FaqAndPilotCta';
import { Footer, LegalDocType } from './components/Footer';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import {
  DEFAULT_AGENT_CONFIG,
  DEFAULT_SIP_SETTINGS,
  DEFAULT_TELEGRAM_SETTINGS,
  DEFAULT_WEBHOOK_SETTINGS,
} from './lib/mockData';
import { generateSystemPrompt } from './lib/vapiService';
import { adaptGreetingForVoice, ensureMandatoryGreetingNotice, isMockCompanyOrTest } from './lib/botDialogueEngine';
import {
  getIspDbStatus,
  hasSessionHint,
  ispGetMe,
  ispRecordCall,
  ispSaveAgent,
  ispSaveIntegrations,
  ispSignOut,
  IspWorkspaceBundle,
} from './lib/ispDbClient';
import { AgentConfig, CallLog, SipSettings, TelegramSettings, WebhookSettings, UserSession, BusinessNiche, VoiceId } from './types';

// Code-split heavy workspace & modal chunks so landing LCP stays ultra-fast
const DashboardLayout = lazy(() =>
  import('./components/dashboard/DashboardLayout').then((m) => ({ default: m.DashboardLayout }))
);
const VoiceTestModal = lazy(() =>
  import('./components/VoiceTestModal').then((m) => ({ default: m.VoiceTestModal }))
);
const AuthModal = lazy(() =>
  import('./components/AuthModal').then((m) => ({ default: m.AuthModal }))
);
const AdminPanel = lazy(() =>
  import('./components/admin/AdminPanel').then((m) => ({ default: m.AdminPanel }))
);

function getInitialViewFromLocation(): 'landing' | 'dashboard' | 'admin' | 'not_found' {
  if (typeof window === 'undefined') return 'landing';
  const rawPath = window.location.pathname.toLowerCase();
  const normalizedPath = rawPath.length > 1 ? rawPath.replace(/\/+$/, '') : rawPath;
  if (normalizedPath.startsWith('/admin') || window.location.hash === '#admin') {
    return 'admin';
  }
  if (
    normalizedPath.startsWith('/dashboard') ||
    normalizedPath === '/cabinet' ||
    window.location.hash === '#dashboard'
  ) {
    return 'dashboard';
  }
  if (['/', '/index.html', '/privacy', '/offer', '/sla', '/login', '/register'].includes(normalizedPath)) {
    return 'landing';
  }
  return 'not_found';
}

function getInitialAuthModeFromLocation(): 'signin' | 'signup' | null {
  if (typeof window === 'undefined') return null;
  const raw = window.location.pathname.toLowerCase();
  const p = raw.length > 1 ? raw.replace(/\/+$/, '') : raw;
  if (p === '/login') return 'signin';
  if (p === '/register') return 'signup';
  return null;
}

function getInitialLegalDocFromLocation(): LegalDocType | null {
  if (typeof window === 'undefined') return null;
  const raw = window.location.pathname.toLowerCase();
  const p = raw.length > 1 ? raw.replace(/\/+$/, '') : raw;
  if (p === '/privacy') return 'privacy';
  if (p === '/offer') return 'offer';
  if (p === '/sla') return 'sla';
  return null;
}

// Обязательное уведомление о записи разговора (закон РБ) — гарантируем и для ассистента из БД
function withMandatoryNotice(a: AgentConfig): AgentConfig {
  return { ...a, firstMessage: ensureMandatoryGreetingNotice(a.firstMessage || '') };
}

export function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'admin' | 'not_found'>(getInitialViewFromLocation);

  useEffect(() => {
    const handleHash = () => {
      const h = window.location.hash;
      if (h === '#admin') setCurrentView('admin');
      else if (h === '#dashboard') setCurrentView('dashboard');
      else if (!h && window.location.pathname === '/') setCurrentView('landing');
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);
  const initialRouteAuthMode = getInitialAuthModeFromLocation();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(() => Boolean(initialRouteAuthMode));
  const [authModalInitialMode, setAuthModalInitialMode] = useState<'signin' | 'signup'>(
    () => initialRouteAuthMode || 'signin'
  );
  const [isVoiceTestModalOpen, setIsVoiceTestModalOpen] = useState(false);
  const [pendingPackageId, setPendingPackageId] = useState<'pack_300' | 'pack_1000' | null>(null);
  const [pendingVoiceTestSelection, setPendingVoiceTestSelection] = useState<{
    niche: BusinessNiche;
    voice: VoiceId;
  } | null>(null);
  const [externalLegalDoc, setExternalLegalDoc] = useState<LegalDocType | null>(getInitialLegalDocFromLocation);
  const [cookieSettingsTrigger, setCookieSettingsTrigger] = useState<number>(0);
  const [paymentToast, setPaymentToast] = useState<string | null>(null);
  const [resetLinkData, setResetLinkData] = useState<{ token: string; email: string } | null>(() => {
    if (typeof window === 'undefined') return null;
    const p = new URLSearchParams(window.location.search);
    const token = p.get('reset_token') || '';
    const email = p.get('email') || '';
    return token ? { token, email } : null;
  });
  const [isRestoringSession, setIsRestoringSession] = useState<boolean>(() => {
    return hasSessionHint();
  });

  // Единственный источник правды — сервер (MySQL). Сессия — HttpOnly-cookie; ничего не кэшируется в localStorage.
  const [user, setUser] = useState<UserSession | null>(null);

  const [agent, setAgent] = useState<AgentConfig>(() => {
    const def = { ...DEFAULT_AGENT_CONFIG };
    def.systemPrompt = generateSystemPrompt(def);
    return def;
  });

  // Журнал звонков: реальные звонки из БД + тестовые звонки текущей вкладки (в памяти)
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [sipSettings, setSipSettings] = useState<SipSettings>(DEFAULT_SIP_SETTINGS);
  const [telegramSettings, setTelegramSettings] = useState<TelegramSettings>(DEFAULT_TELEGRAM_SETTINGS);
  const [webhookSettings, setWebhookSettings] = useState<WebhookSettings>(DEFAULT_WEBHOOK_SETTINGS);

  const vapiApiKey = '';

  // Open AuthModal automatically if user clicked a password-reset link from email
  useEffect(() => {
    if (resetLinkData) {
      setIsAuthModalOpen(true);
    }
  }, [resetLinkData]);

  // Restore real session: ISPmanager MySQL (/api/db)
  useEffect(() => {
    let cancelled = false;

    if (!hasSessionHint()) {
      setIsRestoringSession(false);
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      try {
        const ispStatus = await getIspDbStatus();
        if (cancelled) return;

        if (ispStatus.available && ispStatus.configured && ispStatus.connected) {
          const bundle = await ispGetMe();
          if (!cancelled && bundle) {
            setUser(bundle.user);
            if (bundle.agent) {
              const cleaned = { ...bundle.agent };
              const wasDemoCompany = isMockCompanyOrTest(cleaned.companyName);
              if (wasDemoCompany) {
                cleaned.companyName = bundle.user?.companyName && !isMockCompanyOrTest(bundle.user.companyName) ? bundle.user.companyName : '';
                if (cleaned.phone === '+375 (29) 112-44-55' || cleaned.phone === '+375 (29) 700-11-22') {
                  cleaned.phone = '';
                }
                if (cleaned.address && cleaned.address.includes('Сурганова')) {
                  cleaned.address = '';
                }
                if (cleaned.pricingAndServices && cleaned.pricingAndServices.includes('категории "B"')) {
                  cleaned.pricingAndServices = '';
                }
              }
              cleaned.name = `${cleaned.voice === 'maxim' ? 'Максим' : 'Анна'} — ${cleaned.companyName || 'Голосовой ассистент'}`;
              if (bundle.user?.billing?.billingStatus === 'suspended') {
                cleaned.isActive = false;
              }
              cleaned.systemPrompt = generateSystemPrompt(cleaned);
              setAgent(withMandatoryNotice(cleaned));
            } else if (bundle.user?.companyName && !isMockCompanyOrTest(bundle.user.companyName)) {
              setAgent((prev) => {
                const voiceLabel = prev.voice === 'maxim' ? 'Максим' : 'Анна';
                const updated = {
                  ...prev,
                  companyName: bundle.user.companyName,
                  name: `${voiceLabel} — ${bundle.user.companyName}`,
                  isActive: bundle.user?.billing?.billingStatus === 'suspended' ? false : prev.isActive,
                };
                updated.systemPrompt = generateSystemPrompt(updated);
                return updated;
              });
            } else if (bundle.user?.billing?.billingStatus === 'suspended') {
              setAgent((prev) => ({ ...prev, isActive: false }));
            }
            if (bundle.sipSettings) setSipSettings(bundle.sipSettings);
            if (bundle.telegramSettings) setTelegramSettings(bundle.telegramSettings);
            if (bundle.webhookSettings) setWebhookSettings(bundle.webhookSettings);
            setCallLogs(bundle.callLogs);
          }
        }
      } catch {
        // Fallback to offline / sandbox session
      } finally {
        if (!cancelled) {
          setIsRestoringSession(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Handle bePaid return query params (?payment=success&minutes=...)
  useEffect(() => {
    if (isRestoringSession) return;
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    if (!paymentStatus) return;

    const pollTimers: number[] = [];
    if (paymentStatus === 'success') {
      // Баланс начисляет ТОЛЬКО серверный вебхук bePaid; перечитываем состояние сразу и с задержками (2с, 5с, 10с)
      setPaymentToast('Оплата принята. Обновляем баланс после подтверждения банком…');
      const refreshAfterPayment = () => {
        ispGetMe().then((bundle) => {
          if (bundle) {
            setUser(bundle.user);
            if (bundle.agent) {
              setAgent((prev) => ({
                ...prev,
                isActive: bundle.user.billing?.billingStatus === 'suspended' ? false : bundle.agent!.isActive,
              }));
            }
            setCurrentView('dashboard');
          }
        }).catch(() => {});
      };
      refreshAfterPayment();
      [2500, 5500, 10000].forEach((delay) => {
        pollTimers.push(window.setTimeout(refreshAfterPayment, delay));
      });
      if (user) setCurrentView('dashboard');
      import('canvas-confetti').then(({ default: confetti }) => {
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
      }).catch(() => {});
    } else if (paymentStatus === 'cancelled') {
      setPaymentToast('Оплата отменена. Вы можете повторить попытку в любой момент в разделе «Тариф и оплата».');
    } else if (paymentStatus === 'declined' || paymentStatus === 'failed') {
      setPaymentToast('Платёж отклонён банком. Вы можете повторить попытку в кабинете.');
    }

    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, '', cleanUrl);
    const timer = setTimeout(() => setPaymentToast(null), 7000);
    return () => {
      clearTimeout(timer);
      pollTimers.forEach((id) => clearTimeout(id));
    };
  }, [user, isRestoringSession]);

  // Sync URL path & document title for SPA navigation & browser Back button
  useEffect(() => {
    if (isRestoringSession) return;
    if (currentView === 'dashboard' && !user) {
      setCurrentView('landing');
      setIsAuthModalOpen(true);
      return;
    }

    let pageTitle = 'Voxi.by — Голосовой ИИ-администратор для бизнеса в Беларуси';
    if (currentView === 'not_found') {
      pageTitle = 'Страница не найдена (404) — Voxi.by';
    } else if (currentView === 'admin') {
      pageTitle = 'Мастер-панель администратора — Voxi.by';
    } else if (currentView === 'dashboard') {
      pageTitle = `Личный кабинет — ${user?.companyName || 'Voxi.by'}`;
    } else if (externalLegalDoc === 'offer') {
      pageTitle = 'Публичный договор (оферта) — Voxi.by';
    } else if (externalLegalDoc === 'privacy') {
      pageTitle = 'Политика конфиденциальности (Закон РБ № 99-З) — Voxi.by';
    } else if (externalLegalDoc === 'sla') {
      pageTitle = 'Соглашение об уровне сервиса (SLA 99.9%) — Voxi.by';
    }
    document.title = pageTitle;

    if (currentView === 'not_found') {
      return;
    }

    if (currentView === 'admin') {
      if (window.location.hash !== '#admin' && !window.location.pathname.startsWith('/admin')) {
        window.history.pushState({ view: 'admin' }, '', '/#admin');
      }
      return;
    }

    const targetPath = currentView === 'dashboard' ? '/dashboard' : '/';
    if (
      window.location.pathname !== targetPath &&
      !['/privacy', '/offer', '/sla'].includes(window.location.pathname.toLowerCase())
    ) {
      window.history.pushState({ view: currentView }, '', targetPath);
    }
  }, [currentView, user, externalLegalDoc, isRestoringSession]);

  useEffect(() => {
    const onPopState = () => {
      const nextDoc = getInitialLegalDocFromLocation();
      setExternalLegalDoc(nextDoc);
      const nextView = getInitialViewFromLocation();
      if (nextView === 'admin') {
        setCurrentView('admin');
      } else if (nextView === 'dashboard' && user) {
        setCurrentView('dashboard');
      } else if (nextView === 'not_found') {
        setCurrentView('not_found');
      } else {
        setCurrentView('landing');
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [user]);

  const buildAgentForNicheAndVoice = (base: AgentConfig, niche: BusinessNiche, voiceOverride?: VoiceId): AgentConfig => {
    const nextVoice = voiceOverride || base.voice;
    const voiceName = nextVoice === 'maxim' ? 'Максим' : 'Анна';
    const effectiveCompany = (!isMockCompanyOrTest(user?.companyName) ? user?.companyName : '') ||
                             (!isMockCompanyOrTest(base.companyName) ? base.companyName : '') || '';
    const wasDemoBase = isMockCompanyOrTest(base.companyName);
    const updatedAgent: AgentConfig = {
      ...base,
      niche,
      voice: nextVoice,
      name: `${voiceName} — ${effectiveCompany || 'Голосовой ассистент'}`,
      companyName: effectiveCompany,
      city: base.city || 'Минск',
      address: wasDemoBase && base.address?.includes('Сурганова') ? '' : (base.address || ''),
      phone: wasDemoBase && (base.phone === '+375 (29) 112-44-55' || base.phone === '+375 (29) 700-11-22') ? '' : (base.phone || ''),
      workingHours: base.workingHours || 'Пн-Пт: 09:00 - 19:00',
      pricingAndServices: wasDemoBase && base.pricingAndServices?.includes('категории "B"') ? '' : (base.pricingAndServices || ''),
      knowledgeBase: wasDemoBase && base.knowledgeBase?.includes('Volkswagen Polo') ? '' : (base.knowledgeBase || ''),
      firstMessage: adaptGreetingForVoice(
        base.firstMessage || `Здравствуйте! Вас приветствует компания. Меня зовут ${voiceName}. Разговор записывается в целях контроля качества. Чтобы переключиться на менеджера, скажите «соедините с менеджером». Чем могу вам помочь?`,
        nextVoice,
        effectiveCompany,
        effectiveCompany
      ),
    };
    updatedAgent.systemPrompt = generateSystemPrompt(updatedAgent);
    return updatedAgent;
  };

  const handleRecordCompletedCall = (newLog: CallLog) => {
    setCallLogs((prev) => {
      if (prev.some((c) => c.id === newLog.id)) return prev;
      return [newLog, ...prev];
    });
    if (user) {
      ispRecordCall(newLog)
        .then((freshUser) => {
          if (freshUser) {
            setUser(freshUser);
            if (freshUser.billing?.billingStatus === 'suspended') {
              setAgent((prev) => ({ ...prev, isActive: false }));
            }
          }
        })
        .catch(() => {});
    }

    // Автоматическая отправка лида в CRM / 1C / Make по внешнему Webhook
    if (webhookSettings?.isEnabled && webhookSettings?.webhookUrl?.trim()) {
      fetch('/api/dispatch-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: webhookSettings.webhookUrl.trim(),
          secretKey: webhookSettings.secretKey?.trim(),
          sendFormat: webhookSettings.sendFormat || 'json_standard',
          isTest: false,
          lead: {
            clientName: newLog.callerName,
            phone: newLog.callerNumber,
            service: newLog.capturedData?.service || newLog.summary,
            preferredDate: newLog.capturedData?.preferredDate,
            dealValueByn: newLog.dealValueByn,
            summary: newLog.summary,
            timestamp: newLog.timestamp,
            transcript: newLog.transcript,
            urgency: newLog.capturedData?.urgency
          }
        })
      }).catch(() => {});
    }
  };

  const handleLogout = async () => {
    await ispSignOut();
    setUser(null);
    const freshAgent: AgentConfig = { ...DEFAULT_AGENT_CONFIG };
    freshAgent.systemPrompt = generateSystemPrompt(freshAgent);
    setAgent(freshAgent);
    setCallLogs([]);
    setSipSettings({ ...DEFAULT_SIP_SETTINGS });
    setTelegramSettings({ ...DEFAULT_TELEGRAM_SETTINGS });
    setWebhookSettings({ ...DEFAULT_WEBHOOK_SETTINGS });
    setPaymentToast(null);
    setPendingPackageId(null);
    setPendingVoiceTestSelection(null);
    setCurrentView('landing');
  };

  return (
    <SolarProvider color="currentColor" size={18} strokeWidth={1.6} secondaryColor="currentColor" secondaryOpacity={0.35}>
    <div className="min-h-screen bg-[#ffffff] text-[#000000] flex flex-col font-sans selection:bg-[#000000] selection:text-[#ffffff]">
      
      {/* Accessible Skip Link for Keyboard Users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-full focus:bg-[#2563eb] focus:text-white focus:text-xs focus:font-semibold focus:shadow-lg"
      >
        Перейти к основному содержимому
      </a>

      {/* Payment Return Banner */}
      {paymentToast && (
        <div
          role="status"
          className="fixed top-20 right-5 z-[60] max-w-sm rounded-2xl bg-[#1d1d1f] text-white px-5 py-3.5 text-xs font-medium shadow-2xl flex items-center justify-between gap-3"
        >
          <span>{paymentToast}</span>
          <button
            type="button"
            aria-label="Скрыть уведомление"
            onClick={() => setPaymentToast(null)}
            className="text-slate-400 hover:text-white font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Scroll Progress Hairline & Navbar - only on landing page */}
      {currentView === 'landing' && (
        <>
          <ScrollProgressBar />
          <Navbar
            currentView={currentView}
            setCurrentView={setCurrentView}
            user={user}
            onOpenAuth={(mode = 'signin') => {
              setAuthModalInitialMode(mode);
              setIsAuthModalOpen(true);
            }}
            onLogout={handleLogout}
            onOpenVoiceTest={() => setIsVoiceTestModalOpen(true)}
          />
        </>
      )}

      {/* Main Landmark */}
      <main id="main-content" className="flex-1">
        {currentView === 'landing' ? (
          <div className="relative overflow-x-clip w-full bg-white text-black">
            <Hero
              onOpenVoiceTest={() => setIsVoiceTestModalOpen(true)}
              onOpenAuth={() => {
                if (user) setCurrentView('dashboard');
                else {
                  setAuthModalInitialMode('signup');
                  setIsAuthModalOpen(true);
                }
              }}
            />

            <CallJourneyScroll
              onOpenAuth={() => {
                if (user) setCurrentView('dashboard');
                else {
                  setAuthModalInitialMode('signup');
                  setIsAuthModalOpen(true);
                }
              }}
            />

            <NicheScenarios
              onTestNiche={(niche) => {
                setAgent((prev) => buildAgentForNicheAndVoice(prev, niche));
                setIsVoiceTestModalOpen(true);
              }}
              onOpenAuth={() => {
                if (user) setCurrentView('dashboard');
                else {
                  setAuthModalInitialMode('signup');
                  setIsAuthModalOpen(true);
                }
              }}
            />

            <TelephonyIntegrations />

            <BeforeAfterComparison />

            <ValueAndPricing
              onOpenAuth={(pkgId) => {
                if (pkgId) {
                  setPendingPackageId(pkgId);
                }
                if (user) {
                  setCurrentView('dashboard');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                  setAuthModalInitialMode('signup');
                  setIsAuthModalOpen(true);
                }
              }}
            />

            <FaqAndPilotCta
              onOpenAuth={() => {
                if (user) setCurrentView('dashboard');
                else {
                  setAuthModalInitialMode('signup');
                  setIsAuthModalOpen(true);
                }
              }}
              onOpenVoiceTest={() => setIsVoiceTestModalOpen(true)}
            />
          </div>
        ) : currentView === 'not_found' ? (
          <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 py-24 text-center bg-white">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-black/[0.06] text-xs font-mono font-semibold text-black mb-4">
              404
            </span>
            <h1 className="text-3xl sm:text-4xl font-semibold text-slate-950 tracking-tight mb-3">
              Страница не найдена
            </h1>
            <p className="text-sm text-slate-600 max-w-md mb-8 leading-relaxed">
              Похоже, адрес введён с опечаткой или страница была перемещена. Вернитесь на главную страницу Voxi.by.
            </p>
            <button
              type="button"
              onClick={() => {
                setCurrentView('landing');
                window.history.pushState({ view: 'landing' }, '', '/');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-6 py-3 rounded-full bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Перейти на главную
            </button>
          </div>
        ) : currentView === 'admin' ? (
          <Suspense
            fallback={
              <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-sm">
                Загрузка панели управления Voxi.by...
              </div>
            }
          >
            <AdminPanel
              onExitToLanding={() => {
                setCurrentView('landing');
                window.location.hash = '';
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </Suspense>
        ) : (
          user && (
            <Suspense
              fallback={
                <div className="min-h-screen flex items-center justify-center bg-slate-50 text-xs text-slate-600 font-medium">
                  Загрузка личного кабинета Voxi.by...
                </div>
              }
            >
              <DashboardLayout
                user={user}
                onUserUpdated={setUser}
                agent={agent}
                onSaveAgent={async (updatedAgent) => {
                  await ispSaveAgent(updatedAgent);
                  setAgent(updatedAgent);
                  if (updatedAgent.companyName && updatedAgent.companyName !== user.companyName) {
                    setUser(prev => prev ? { ...prev, companyName: updatedAgent.companyName } : prev);
                  }
                }}
                sipSettings={sipSettings}
                onSaveSip={async (nextSip) => {
                  await ispSaveIntegrations({ sipSettings: nextSip });
                  setSipSettings(nextSip);
                }}
                telegramSettings={telegramSettings}
                onSaveTelegram={async (nextTg) => {
                  await ispSaveIntegrations({ telegramSettings: nextTg });
                  setTelegramSettings(nextTg);
                }}
                webhookSettings={webhookSettings}
                onSaveWebhook={async (nextWh) => {
                  await ispSaveIntegrations({ webhookSettings: nextWh });
                  setWebhookSettings(nextWh);
                }}
                vapiApiKey={vapiApiKey}
                onSaveVapiApiKey={() => {}}
                callLogs={callLogs}
                onCallCompleted={handleRecordCompletedCall}
                onOpenVoiceTest={() => setIsVoiceTestModalOpen(true)}
                initialSelectedPackage={pendingPackageId}
                onInitialPackageConsumed={() => setPendingPackageId(null)}
                onExitToLanding={() => {
                  setCurrentView('landing');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onLogout={handleLogout}
              />
            </Suspense>
          )
        )}
      </main>

      {/* Footer - always mounted on landing, or when legal doc modal is requested from AuthModal */}
      {(currentView === 'landing' || externalLegalDoc) && (
        <Footer
          externalDocModal={externalLegalDoc}
          onCloseExternalDocModal={() => {
            setExternalLegalDoc(null);
            if (['/privacy', '/offer', '/sla'].includes(window.location.pathname.toLowerCase())) {
              window.history.pushState({}, '', '/');
            }
          }}
          onOpenCookieSettings={() => setCookieSettingsTrigger((n) => n + 1)}
          onOpenAuth={() => {
            if (user) setCurrentView('dashboard');
            else {
              setAuthModalInitialMode('signup');
              setIsAuthModalOpen(true);
            }
          }}
          onNavigateSection={(sectionId) => {
            const el = document.getElementById(sectionId);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      )}

      {/* Cookie Consent Banner (Law of RB No. 99-Z) */}
      <CookieConsentBanner
        onOpenPrivacyPolicy={() => setExternalLegalDoc('privacy')}
        forceOpenTrigger={cookieSettingsTrigger}
      />

      {/* Lazy Modals */}
      {isAuthModalOpen && (
        <Suspense fallback={null}>
          <AuthModal
            isOpen={isAuthModalOpen}
            initialMode={authModalInitialMode}
            initialResetEmail={resetLinkData?.email}
            initialResetToken={resetLinkData?.token}
            pendingPackageLabel={
              pendingPackageId === 'pack_300'
                ? 'Пакет 300 мин (120 BYN)'
                : pendingPackageId === 'pack_1000'
                ? 'Пакет 1000 мин (350 BYN)'
                : null
            }
            onClose={() => {
              setIsAuthModalOpen(false);
              if (resetLinkData) {
                setResetLinkData(null);
                window.history.replaceState({}, '', window.location.pathname);
              }
            }}
            onOpenLegalDoc={(doc) => setExternalLegalDoc(doc)}
            onLoginSuccess={(loggedInUser, workspace?: Partial<IspWorkspaceBundle>) => {
              if (resetLinkData) {
                setResetLinkData(null);
                window.history.replaceState({}, '', window.location.pathname);
              }

              // Тестовые звонки, сделанные до входа (в памяти вкладки), сохраняем в аккаунт
              const liveTestLogs = callLogs.filter((c) => c.id.startsWith('call-live-'));
              const dbLogs = Array.isArray(workspace?.callLogs) ? workspace!.callLogs! : [];
              const dbIds = new Set(dbLogs.map((c) => c.id));
              const unsavedLive = liveTestLogs.filter((c) => !dbIds.has(c.id));
              setCallLogs([...unsavedLive, ...dbLogs]);
              unsavedLive.forEach((l) => ispRecordCall(l).catch(() => {}));

              if (workspace?.sipSettings) setSipSettings(workspace.sipSettings);
              if (workspace?.telegramSettings) setTelegramSettings(workspace.telegramSettings);
              if (workspace?.webhookSettings) setWebhookSettings(workspace.webhookSettings);

              if (pendingVoiceTestSelection) {
                // Выбор ниши/голоса из тестового звонка применяется к ассистенту нового/текущего аккаунта
                const updated = buildAgentForNicheAndVoice(
                  workspace?.agent || agent,
                  pendingVoiceTestSelection.niche,
                  pendingVoiceTestSelection.voice
                );
                if (loggedInUser.companyName) updated.companyName = loggedInUser.companyName;
                updated.systemPrompt = generateSystemPrompt(updated);
                setAgent(updated);
                setUser(loggedInUser);
                setPendingVoiceTestSelection(null);
                ispSaveAgent(updated).catch(() => {});
              } else if (workspace?.agent) {
                setAgent(withMandatoryNotice(workspace.agent));
                setUser(loggedInUser);
              } else {
                setUser(loggedInUser);
                if (loggedInUser.companyName && loggedInUser.companyName !== agent.companyName) {
                  const voiceLabel = agent.voice === 'maxim' ? 'Максим' : 'Анна';
                  const prevCompany = agent.companyName;
                  const updated: AgentConfig = {
                    ...agent,
                    companyName: loggedInUser.companyName,
                    name: `${voiceLabel} — ${loggedInUser.companyName}`,
                    firstMessage: prevCompany
                      ? agent.firstMessage.replace(prevCompany, loggedInUser.companyName)
                      : agent.firstMessage,
                  };
                  updated.systemPrompt = generateSystemPrompt(updated);
                  setAgent(updated);
                  ispSaveAgent(updated).catch(() => {});
                }
              }

              setCurrentView('dashboard');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </Suspense>
      )}


      {isVoiceTestModalOpen && (
        <Suspense fallback={null}>
          <VoiceTestModal
            isOpen={isVoiceTestModalOpen}
            initialNiche={agent.niche}
            initialVoice={agent.voice}
            userAgent={user ? agent : undefined}
            onClose={() => setIsVoiceTestModalOpen(false)}
            onCallCompleted={handleRecordCompletedCall}
            onProceedToDashboard={(selectedNiche, selectedVoice) => {
              const updated = buildAgentForNicheAndVoice(agent, selectedNiche, selectedVoice);
              setAgent(updated);

              if (!user) {
                setPendingVoiceTestSelection({ niche: selectedNiche, voice: selectedVoice });
                setIsAuthModalOpen(true);
              } else {
                setCurrentView('dashboard');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
          />
        </Suspense>
      )}

    </div>
    </SolarProvider>
  );
}
export default App;
