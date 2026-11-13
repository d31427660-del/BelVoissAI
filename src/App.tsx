import React, { useState, useEffect, Suspense, lazy } from 'react';
import { SolarProvider } from '@solar-icons/react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/landing/Hero';
import { IntegrationsStrip } from './components/landing/IntegrationsStrip';
import { VoiceComparison } from './components/landing/VoiceComparison';
import { HowItWorks } from './components/landing/HowItWorks';
import { FeatureShowcase } from './components/landing/FeatureShowcase';
import { FaqSection } from './components/landing/FaqSection';
import { CtaSection } from './components/landing/CtaSection';
import { Footer, LegalDocType } from './components/Footer';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import {
  DEFAULT_AGENT_CONFIG,
  DEFAULT_SIP_SETTINGS,
  DEFAULT_TELEGRAM_SETTINGS,
  DEFAULT_WEBHOOK_SETTINGS,
  NICHE_TEMPLATES,
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
import { AgentConfig, CallLog, SipSettings, TelegramSettings, WebhookSettings, UserSession, BusinessNiche, VoiceId, MinutePackage } from './types';

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
const TopUpModal = lazy(() =>
  import('./components/dashboard/TopUpModal').then((m) => ({ default: m.TopUpModal }))
);
const AdminPanel = lazy(() =>
  import('./components/admin/AdminPanel').then((m) => ({ default: m.AdminPanel }))
);

function getInitialViewFromLocation(): 'landing' | 'dashboard' | 'admin' {
  if (typeof window === 'undefined') return 'landing';
  if (window.location.pathname.startsWith('/admin') || window.location.hash === '#admin') {
    return 'admin';
  }
  if (window.location.pathname.startsWith('/dashboard') || window.location.hash === '#dashboard') {
    return 'dashboard';
  }
  return 'landing';
}

function getInitialLegalDocFromLocation(): LegalDocType | null {
  if (typeof window === 'undefined') return null;
  const p = window.location.pathname.toLowerCase();
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
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'admin'>(getInitialViewFromLocation);

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
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isVoiceTestModalOpen, setIsVoiceTestModalOpen] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [selectedPackageForTopUp, setSelectedPackageForTopUp] = useState<MinutePackage | null>(null);
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
              if (isMockCompanyOrTest(cleaned.companyName)) {
                cleaned.companyName = bundle.user?.companyName && !isMockCompanyOrTest(bundle.user.companyName) ? bundle.user.companyName : '';
              }
              if (cleaned.phone === '+375 (29) 112-44-55' || cleaned.phone === '+375 (29) 700-11-22') {
                cleaned.phone = '';
              }
              if (cleaned.address && cleaned.address.includes('Сурганова')) {
                cleaned.address = '';
              }
              if (cleaned.pricingAndServices && cleaned.pricingAndServices.includes('категории "B"')) {
                cleaned.pricingAndServices = '';
              }
              cleaned.name = `${cleaned.voice === 'maxim' ? 'Максим' : 'Анна'} — ${cleaned.companyName || 'Голосовой ассистент'}`;
              cleaned.systemPrompt = generateSystemPrompt(cleaned);
              setAgent(withMandatoryNotice(cleaned));
            } else if (bundle.user?.companyName && !isMockCompanyOrTest(bundle.user.companyName)) {
              setAgent((prev) => {
                const voiceLabel = prev.voice === 'maxim' ? 'Максим' : 'Анна';
                const updated = {
                  ...prev,
                  companyName: bundle.user.companyName,
                  name: `${voiceLabel} — ${bundle.user.companyName}`,
                };
                updated.systemPrompt = generateSystemPrompt(updated);
                return updated;
              });
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

    if (paymentStatus === 'success') {
      // Баланс начисляет ТОЛЬКО серверный вебхук bePaid; здесь лишь перечитываем актуальное состояние
      setPaymentToast('Оплата принята. Баланс обновится в течение минуты после подтверждения платежа банком.');
      ispGetMe().then((bundle) => {
        if (bundle) setUser(bundle.user);
      });
      if (user) setCurrentView('dashboard');
      import('canvas-confetti').then(({ default: confetti }) => {
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
      }).catch(() => {});
    } else if (paymentStatus === 'declined' || paymentStatus === 'failed') {
      setPaymentToast('Платёж отклонён банком или отменён. Вы можете повторить попытку в кабинете.');
    }

    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, '', cleanUrl);
    const timer = setTimeout(() => setPaymentToast(null), 6500);
    return () => clearTimeout(timer);
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
    if (currentView === 'admin') {
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
    const updatedAgent: AgentConfig = {
      ...base,
      niche,
      voice: nextVoice,
      name: `${voiceName} — ${effectiveCompany || 'Голосовой ассистент'}`,
      companyName: effectiveCompany,
      city: base.city || 'Минск',
      address: base.address?.includes('Сурганова') ? '' : (base.address || ''),
      phone: (base.phone === '+375 (29) 112-44-55' || base.phone === '+375 (29) 700-11-22') ? '' : (base.phone || ''),
      workingHours: base.workingHours || 'Пн-Пт: 09:00 - 19:00',
      pricingAndServices: base.pricingAndServices?.includes('категории "B"') ? '' : (base.pricingAndServices || ''),
      knowledgeBase: base.knowledgeBase?.includes('Volkswagen Polo') ? '' : (base.knowledgeBase || ''),
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
          if (freshUser) setUser(freshUser);
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

  const handleSelectPackage = (pkg: MinutePackage) => {
    setSelectedPackageForTopUp(pkg);
    if (!user) {
      setIsAuthModalOpen(true);
    } else {
      setIsTopUpModalOpen(true);
    }
  };

  const handleSuccessTopUp = (minutesToAdd: number) => {
    if (!user) return;
    setUser({
      ...user,
      balanceMinutes: user.balanceMinutes + minutesToAdd
    });
  };

  const handleLogout = async () => {
    await ispSignOut();
    setUser(null);
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

      {/* Navbar - only on landing page */}
      {currentView === 'landing' && (
        <Navbar
          currentView={currentView}
          setCurrentView={setCurrentView}
          user={user}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
          onOpenVoiceTest={() => setIsVoiceTestModalOpen(true)}
        />
      )}

      {/* Main Landmark */}
      <main id="main-content" className="flex-1">
        {currentView === 'landing' ? (
          <div
            className="relative overflow-hidden overflow-x-clip w-full"
            style={{
              backgroundColor: '#FAF7F2',
              backgroundImage: `
                radial-gradient(1300px 750px at 18% 6%, rgba(255, 142, 84, 0.22) 0%, transparent 60%),
                radial-gradient(1000px 650px at 85% 16%, rgba(251, 191, 36, 0.16) 0%, transparent 55%),
                radial-gradient(1200px 800px at 82% 46%, rgba(126, 178, 163, 0.15) 0%, transparent 55%),
                radial-gradient(1100px 750px at 15% 72%, rgba(255, 118, 62, 0.18) 0%, transparent 60%)
              `
            }}
          >
            {/* Luminous Warm Ambient Orbs */}
            <div
              className="pointer-events-none absolute top-[2%] -left-[10%] w-[700px] h-[700px] rounded-full overflow-hidden"
              style={{
                background: 'radial-gradient(circle, rgba(255, 142, 84, 0.18) 0%, rgba(251, 146, 60, 0.08) 45%, transparent 70%)',
                transform: 'translateZ(0)'
              }}
            />
            <div
              className="pointer-events-none absolute top-[38%] -right-[10%] w-[700px] h-[700px] rounded-full overflow-hidden"
              style={{
                background: 'radial-gradient(circle, rgba(126, 178, 163, 0.16) 0%, rgba(255, 150, 95, 0.08) 45%, transparent 70%)',
                transform: 'translateZ(0)'
              }}
            />
            <div
              className="pointer-events-none absolute top-[70%] -left-[10%] w-[680px] h-[680px] rounded-full overflow-hidden"
              style={{
                background: 'radial-gradient(circle, rgba(255, 118, 62, 0.16) 0%, rgba(251, 191, 36, 0.10) 50%, transparent 70%)',
                transform: 'translateZ(0)'
              }}
            />

            <div className="relative z-10 w-full">
              <Hero
                onOpenVoiceTest={() => setIsVoiceTestModalOpen(true)}
                onOpenAuth={() => {
                  if (user) setCurrentView('dashboard');
                  else setIsAuthModalOpen(true);
                }}
              />

              <IntegrationsStrip />

              <VoiceComparison />

              <FeatureShowcase />

              <HowItWorks onOpenAuth={() => {
                if (user) setCurrentView('dashboard');
                else setIsAuthModalOpen(true);
              }} />

              <FaqSection />

              <CtaSection
                onOpenAuth={() => {
                  if (user) setCurrentView('dashboard');
                  else setIsAuthModalOpen(true);
                }}
                onOpenVoiceTest={() => setIsVoiceTestModalOpen(true)}
              />
            </div>
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
                agent={agent}
                onSaveAgent={(updatedAgent) => {
                  setAgent(updatedAgent);
                  if (updatedAgent.companyName && updatedAgent.companyName !== user.companyName) {
                    setUser(prev => prev ? { ...prev, companyName: updatedAgent.companyName } : prev);
                  }
                  ispSaveAgent(updatedAgent).catch(() => {});
                }}
                sipSettings={sipSettings}
                onSaveSip={(nextSip) => {
                  setSipSettings(nextSip);
                  ispSaveIntegrations({ sipSettings: nextSip }).catch(() => {});
                }}
                telegramSettings={telegramSettings}
                onSaveTelegram={(nextTg) => {
                  setTelegramSettings(nextTg);
                  ispSaveIntegrations({ telegramSettings: nextTg }).catch(() => {});
                }}
                webhookSettings={webhookSettings}
                onSaveWebhook={(nextWh) => {
                  setWebhookSettings(nextWh);
                  ispSaveIntegrations({ webhookSettings: nextWh }).catch(() => {});
                }}
                vapiApiKey={vapiApiKey}
                onSaveVapiApiKey={() => {}}
                callLogs={callLogs}
                onCallCompleted={handleRecordCompletedCall}
                onOpenVoiceTest={() => setIsVoiceTestModalOpen(true)}
                onOpenTopUp={() => setIsTopUpModalOpen(true)}
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
            initialResetEmail={resetLinkData?.email}
            initialResetToken={resetLinkData?.token}
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

              if (selectedPackageForTopUp) {
                setIsTopUpModalOpen(true);
              }

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

      {user && isTopUpModalOpen && (
        <Suspense fallback={null}>
          <TopUpModal
            isOpen={isTopUpModalOpen}
            onClose={() => {
              setIsTopUpModalOpen(false);
              setSelectedPackageForTopUp(null);
            }}
            user={user}
            initialPackage={selectedPackageForTopUp}
            onSuccessTopUp={handleSuccessTopUp}
          />
        </Suspense>
      )}

    </div>
    </SolarProvider>
  );
}
export default App;
