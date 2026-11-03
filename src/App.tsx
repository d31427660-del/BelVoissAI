import React, { useState, useEffect, Suspense, lazy } from 'react';
import { SolarProvider } from '@solar-icons/react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/landing/Hero';
import { IntegrationsStrip } from './components/landing/IntegrationsStrip';
import { WhoIsItFor } from './components/landing/WhoIsItFor';
import { VoiceComparison } from './components/landing/VoiceComparison';
import { HowItWorks } from './components/landing/HowItWorks';
import { RoiCalculator } from './components/landing/RoiCalculator';
import { FeatureShowcase } from './components/landing/FeatureShowcase';
import { Pricing } from './components/landing/Pricing';
import { FaqSection } from './components/landing/FaqSection';
import { CtaSection } from './components/landing/CtaSection';
import { Footer, LegalDocType } from './components/Footer';
import { 
  DEFAULT_AGENT_CONFIG, 
  INITIAL_CALL_LOGS, 
  DEFAULT_SIP_SETTINGS, 
  DEFAULT_TELEGRAM_SETTINGS, 
  DEFAULT_WEBHOOK_SETTINGS,
  NICHE_TEMPLATES 
} from './lib/mockData';
import { generateSystemPrompt } from './lib/vapiService';
import { adaptGreetingForVoice } from './lib/botDialogueEngine';
import { supabase, isSupabaseConfigured, LOCAL_STORAGE_KEYS } from './lib/supabaseClient';
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

function getInitialViewFromLocation(): 'landing' | 'dashboard' {
  if (typeof window === 'undefined') return 'landing';
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

export function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard'>(getInitialViewFromLocation);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isVoiceTestModalOpen, setIsVoiceTestModalOpen] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [selectedPackageForTopUp, setSelectedPackageForTopUp] = useState<MinutePackage | null>(null);
  const [pendingVoiceTestSelection, setPendingVoiceTestSelection] = useState<{
    niche: BusinessNiche;
    voice: VoiceId;
  } | null>(null);
  const [externalLegalDoc, setExternalLegalDoc] = useState<LegalDocType | null>(getInitialLegalDocFromLocation);
  const [paymentToast, setPaymentToast] = useState<string | null>(null);

  // User session: restore demo user from localStorage ONLY if demo mode; real Supabase sessions come via auth listener
  const [user, setUser] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.DEMO_AUTH_USER);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.isMock) return parsed;
      }
    } catch {
      // fallback
    }
    return null;
  });

  // Agent configuration
  const [agent, setAgent] = useState<AgentConfig>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.AGENT_CONFIG);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    const def = { ...DEFAULT_AGENT_CONFIG };
    def.systemPrompt = generateSystemPrompt(def);
    return def;
  });

  // Call logs: real users get empty / DB logs; demo users get showcase logs + persisted live test calls
  const [callLogs, setCallLogs] = useState<CallLog[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.CALL_LOGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const existingIds = new Set(parsed.map((c: CallLog) => c.id));
          const missingDemo = INITIAL_CALL_LOGS.filter((c) => !existingIds.has(c.id));
          return [...parsed, ...missingDemo];
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_CALL_LOGS;
  });

  // SIP Settings
  const [sipSettings, setSipSettings] = useState<SipSettings>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.SIP_SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_SIP_SETTINGS;
  });

  // Telegram Settings
  const [telegramSettings, setTelegramSettings] = useState<TelegramSettings>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.TELEGRAM_SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_TELEGRAM_SETTINGS;
  });

  // Webhook Settings
  const [webhookSettings, setWebhookSettings] = useState<WebhookSettings>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.WEBHOOK_SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_WEBHOOK_SETTINGS;
  });

  const vapiApiKey = '';

  // Subscribe to real Supabase Auth session & fetch profile + call_logs from DB
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const loadRealUserData = async (userId: string, email: string, fallbackCompany: string) => {
      if (!supabase) return;
      const [{ data: profile }, { data: dbLogs }] = await Promise.all([
        supabase
          .from('profiles')
          .select('email, company_name, balance_minutes, rate_per_minute, spent_minutes')
          .eq('id', userId)
          .maybeSingle(),
        supabase
          .from('call_logs')
          .select('*')
          .eq('user_id', userId)
          .order('call_timestamp', { ascending: false })
          .limit(50),
      ]);

      setUser({
        id: userId,
        email: profile?.email || email,
        companyName: profile?.company_name || fallbackCompany,
        balanceMinutes: Number(profile?.balance_minutes ?? 15),
        ratePerMinute: Number(profile?.rate_per_minute ?? 0.45),
        spentMinutes: Number(profile?.spent_minutes ?? 0),
        isMock: false,
      });

      if (Array.isArray(dbLogs)) {
        setCallLogs(
          dbLogs.map((row: any) => {
            const durSec = Number(row.duration_seconds || 0);
            const mins = Math.floor(durSec / 60);
            const secs = String(durSec % 60).padStart(2, '0');
            return {
              id: row.id,
              callerNumber: row.caller_number,
              callerName: row.caller_name || 'Клиент',
              timestamp: new Date(row.call_timestamp).toLocaleString('ru-RU'),
              durationSeconds: durSec,
              audioDuration: `${mins}:${secs}`,
              costByn: Number(row.cost_byn || 0),
              status: row.status || 'consultation',
              dealValueByn: Number(row.deal_value_byn || 0),
              summary: row.summary || '',
              capturedData: row.captured_data || {},
              transcript: row.transcript || [],
            };
          })
        );
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadRealUserData(
          session.user.id,
          session.user.email || '',
          session.user.user_metadata?.company_name || 'Компания РБ'
        );
      }
    });

    const { data: authSub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadRealUserData(
          session.user.id,
          session.user.email || '',
          session.user.user_metadata?.company_name || 'Компания РБ'
        );
      }
    });

    return () => {
      authSub.subscription.unsubscribe();
    };
  }, []);

  // Handle bePaid return query params (?payment=success&minutes=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    if (!paymentStatus) return;

    if (paymentStatus === 'success') {
      const mins = Number(params.get('minutes') || 0);
      setPaymentToast(
        mins > 0
          ? `Оплата через bePaid прошла успешно! Пакет +${mins} минут зачислен на ваш баланс.`
          : 'Оплата через bePaid прошла успешно!'
      );
      if (mins > 0) {
        setUser((prev) => (prev ? { ...prev, balanceMinutes: prev.balanceMinutes + mins } : prev));
      }
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
  }, [user]);

  // Sync URL path & document title for SPA navigation & browser Back button
  useEffect(() => {
    if (currentView === 'dashboard' && !user) {
      setCurrentView('landing');
      setIsAuthModalOpen(true);
      return;
    }

    document.title =
      currentView === 'dashboard'
        ? `Личный кабинет — ${user?.companyName || 'Voxi.by'}`
        : 'Voxi.by — Голосовой ИИ-администратор для бизнеса в Беларуси';

    const targetPath = currentView === 'dashboard' ? '/dashboard' : '/';
    if (
      window.location.pathname !== targetPath &&
      !['/privacy', '/offer', '/sla'].includes(window.location.pathname.toLowerCase())
    ) {
      window.history.pushState({ view: currentView }, '', targetPath);
    }
  }, [currentView, user]);

  useEffect(() => {
    const onPopState = () => {
      const nextDoc = getInitialLegalDocFromLocation();
      setExternalLegalDoc(nextDoc);
      const nextView = getInitialViewFromLocation();
      if (nextView === 'dashboard' && user) {
        setCurrentView('dashboard');
      } else {
        setCurrentView('landing');
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [user]);

  // Sync ONLY demo user to localStorage (real users use Supabase session tokens)
  useEffect(() => {
    try {
      if (user?.isMock) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.DEMO_AUTH_USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEYS.DEMO_AUTH_USER);
      }
    } catch {}
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS.AGENT_CONFIG, JSON.stringify(agent));
    } catch {}
  }, [agent]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS.SIP_SETTINGS, JSON.stringify(sipSettings));
    } catch {}
  }, [sipSettings]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS.TELEGRAM_SETTINGS, JSON.stringify(telegramSettings));
    } catch {}
  }, [telegramSettings]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS.WEBHOOK_SETTINGS, JSON.stringify(webhookSettings));
    } catch {}
  }, [webhookSettings]);

  useEffect(() => {
    if (user && !user.isMock) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS.CALL_LOGS, JSON.stringify(callLogs));
    } catch {}
  }, [callLogs, user]);

  const buildAgentForNicheAndVoice = (base: AgentConfig, niche: BusinessNiche, voiceOverride?: VoiceId): AgentConfig => {
    const template = NICHE_TEMPLATES[niche] || NICHE_TEMPLATES.driving_school;
    const nextVoice = voiceOverride || base.voice;
    const voiceName = nextVoice === 'maxim' ? 'Максим' : 'Анна';
    const updatedAgent: AgentConfig = {
      ...base,
      niche,
      voice: nextVoice,
      name: `${voiceName} — ${template.companyName}`,
      companyName: template.companyName,
      city: template.city,
      address: template.address,
      phone: template.phone,
      workingHours: template.workingHours,
      pricingAndServices: template.pricingAndServices,
      knowledgeBase: template.knowledgeBase,
      firstMessage: adaptGreetingForVoice(template.firstMessage, nextVoice, template.companyName, template.companyName),
    };
    updatedAgent.systemPrompt = generateSystemPrompt(updatedAgent);
    return updatedAgent;
  };

  const handleRecordCompletedCall = (newLog: CallLog) => {
    setCallLogs((prev) => {
      if (prev.some((c) => c.id === newLog.id)) return prev;
      return [newLog, ...prev];
    });
    if (user?.isMock) {
      const usedMins = Math.max(1, Math.round(newLog.durationSeconds / 60));
      setUser((prev) =>
        prev
          ? {
              ...prev,
              spentMinutes: prev.spentMinutes + usedMins,
              balanceMinutes: Math.max(0, prev.balanceMinutes - usedMins),
            }
          : prev
      );
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

  // Handle Niche Selection from Landing Page
  const handleSelectNicheFromLanding = (niche: BusinessNiche) => {
    const template = NICHE_TEMPLATES[niche];
    const updatedAgent = buildAgentForNicheAndVoice(agent, niche);
    setAgent(updatedAgent);

    if (user) {
      setUser({
        ...user,
        companyName: template.companyName
      });
    } else {
      setCallLogs((prev) => {
        const liveLogs = prev.filter((c) => c.id.startsWith('call-live-'));
        const liveIds = new Set(liveLogs.map((c) => c.id));
        return [...liveLogs, ...INITIAL_CALL_LOGS.filter((c) => !liveIds.has(c.id))];
      });
      setUser({
        id: 'usr_bel_demo_1',
        email: 'owner@drive-minsk.by',
        companyName: template.companyName,
        balanceMinutes: 145,
        ratePerMinute: 0.45,
        spentMinutes: 55,
        isMock: true
      });
    }

    setCurrentView('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
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
          className="fixed bottom-5 right-5 z-[60] max-w-sm rounded-2xl bg-[#1d1d1f] text-white px-5 py-3.5 text-xs font-medium shadow-2xl flex items-center justify-between gap-3"
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
          <>
            <Hero
              onOpenVoiceTest={() => setIsVoiceTestModalOpen(true)}
              onOpenAuth={() => {
                if (user) setCurrentView('dashboard');
                else setIsAuthModalOpen(true);
              }}
            />

            <IntegrationsStrip />

            <WhoIsItFor onSelectNiche={handleSelectNicheFromLanding} />

            <VoiceComparison />

            <HowItWorks onOpenAuth={() => {
              if (user) setCurrentView('dashboard');
              else setIsAuthModalOpen(true);
            }} />

            <RoiCalculator onOpenAuth={() => {
              if (user) setCurrentView('dashboard');
              else setIsAuthModalOpen(true);
            }} />

            <FeatureShowcase />

            <Pricing 
              onOpenAuth={() => {
                if (user) setCurrentView('dashboard');
                else setIsAuthModalOpen(true);
              }}
              onSelectPackage={handleSelectPackage}
            />

            <FaqSection />

            <CtaSection
              onOpenAuth={() => {
                if (user) setCurrentView('dashboard');
                else setIsAuthModalOpen(true);
              }}
              onOpenVoiceTest={() => setIsVoiceTestModalOpen(true)}
            />
          </>
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
                    if (!user.isMock && isSupabaseConfigured && supabase) {
                      supabase
                        .from('profiles')
                        .update({ company_name: updatedAgent.companyName, niche: updatedAgent.niche, updated_at: new Date().toISOString() })
                        .eq('id', user.id)
                        .then(() => {});
                    }
                  }
                }}
                sipSettings={sipSettings}
                onSaveSip={setSipSettings}
                telegramSettings={telegramSettings}
                onSaveTelegram={setTelegramSettings}
                webhookSettings={webhookSettings}
                onSaveWebhook={setWebhookSettings}
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
          onNavigateSection={(sectionId) => {
            const el = document.getElementById(sectionId);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      )}

      {/* Lazy Modals */}
      {isAuthModalOpen && (
        <Suspense fallback={null}>
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            onOpenLegalDoc={(doc) => setExternalLegalDoc(doc)}
            onLoginSuccess={(loggedInUser) => {
              const liveTestLogs = callLogs.filter((c) => c.id.startsWith('call-live-'));
              if (loggedInUser.isMock) {
                const liveIds = new Set(liveTestLogs.map((c) => c.id));
                setCallLogs([...liveTestLogs, ...INITIAL_CALL_LOGS.filter((c) => !liveIds.has(c.id))]);
              } else {
                setCallLogs(liveTestLogs);
              }

              if (selectedPackageForTopUp) {
                setIsTopUpModalOpen(true);
              }

              if (pendingVoiceTestSelection) {
                const updated = buildAgentForNicheAndVoice(
                  agent,
                  pendingVoiceTestSelection.niche,
                  pendingVoiceTestSelection.voice
                );
                setAgent(updated);
                setUser({
                  ...loggedInUser,
                  companyName: loggedInUser.isMock ? updated.companyName : loggedInUser.companyName || updated.companyName,
                });
                setPendingVoiceTestSelection(null);
              } else if (loggedInUser.companyName.includes('СТО')) {
                const updated = buildAgentForNicheAndVoice(agent, 'auto_service', 'maxim');
                setAgent(updated);
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
                if (user.isMock) {
                  setUser({ ...user, companyName: updated.companyName });
                }
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
