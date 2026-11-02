import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CpuBoltIcon as Bot, 
  MagicWand3Icon as Sparkles, 
  DisketteIcon as Save, 
  RefreshIcon as RefreshCw, 
  SendSquareIcon as Send, 
  VolumeLoudIcon as Volume2, 
  CheckCircleIcon as CheckCircle2, 
  DangerCircleIcon as AlertCircle, 
  Tuning2Icon as Sliders, 
  Buildings2Icon as Building, 
  DocumentTextIcon as FileText, 
  AltArrowDownIcon as ChevronDown,
  AltArrowUpIcon as ChevronUp,
  QuestionCircleIcon as HelpCircle,
  LightbulbBoltIcon as Lightbulb,
  ArrowRightIcon as ArrowRight,
  ArrowLeftIcon as ArrowLeft,
  CheckIcon as Check,
  SoundwaveCircleIcon as Radio,
  MapPointIcon as MapPin,
  UserRoundedIcon as UserIcon,
  CloseCircleIcon as CloseCircle,
  CalendarMarkIcon as CalendarIcon,
  ClockCircleIcon as ClockIcon
} from '@solar-icons/react/bold-duotone';
import { AgentConfig, BusinessNiche, VoiceId, PhoneticRule } from '../../types';
import { NICHE_TEMPLATES, PHONETIC_PRESETS } from '../../lib/mockData';
import { generateSystemPrompt, syncWithVapiApi, VOICE_PROFILES } from '../../lib/vapiService';
import { VoiceSimulator } from '../../lib/speechSynth';
import { YclientsService, YclientsSlot, DEFAULT_YCLIENTS_CONFIG } from '../../lib/yclientsService';
import { LiveBotTester } from './LiveBotTester';
import { GuideModal } from './GuideModal';

interface AgentBuilderTabProps {
  agent: AgentConfig;
  onSaveAgent: (updatedAgent: AgentConfig) => void;
  vapiApiKey: string;
}

export const AgentBuilderTab: React.FC<AgentBuilderTabProps> = ({
  agent,
  onSaveAgent,
  vapiApiKey
}) => {
  const [formData, setFormData] = useState<AgentConfig>(() => ({
    ...agent,
    phoneticRules:
      agent.phoneticRules && agent.phoneticRules.length > 0
        ? agent.phoneticRules
        : [
            ...PHONETIC_PRESETS.toponyms.slice(0, 5),
            ...PHONETIC_PRESETS.surnames.slice(0, 2),
            ...PHONETIC_PRESETS.abbr.slice(0, 2),
          ],
    yclientsConfig: agent.yclientsConfig || DEFAULT_YCLIENTS_CONFIG,
  }));
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSyncingVapi, setIsSyncingVapi] = useState(false);
  const [vapiResult, setVapiResult] = useState<{ success: boolean; message: string; assistantId?: string } | null>(null);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [saveSuccessNotification, setSaveSuccessNotification] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newStressed, setNewStressed] = useState('');
  const [newReplacement, setNewReplacement] = useState('');
  const [newCategory, setNewCategory] = useState<PhoneticRule['category']>('toponym');
  const [phoneticToast, setPhoneticToast] = useState<string | null>(null);
  const [playingRuleId, setPlayingRuleId] = useState<string | null>(null);

  // YCLIENTS live slots testing state
  const [yclientsSlots, setYclientsSlots] = useState<YclientsSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [bookingTestSuccess, setBookingTestSuccess] = useState<string | null>(null);

  const handleFetchYclientsSlots = async () => {
    setIsLoadingSlots(true);
    setBookingTestSuccess(null);
    const slots = await YclientsService.fetchAvailableSlots(formData.niche);
    setYclientsSlots(slots);
    setIsLoadingSlots(false);
  };

  const handleTestBookSlot = async (slot: YclientsSlot) => {
    const res = await YclientsService.bookSlot(
      'Максим Ковалёв',
      '+375 (29) 682-14-99',
      formData.niche === 'auto_service' ? 'Диагностика подвески' : 'Консультация',
      'Завтра',
      slot.time,
      slot.staffName
    );
    setBookingTestSuccess(res.message);
    setTimeout(() => setBookingTestSuccess(null), 4000);
  };

  useEffect(() => {
    setFormData((prev) => ({
      ...agent,
      phoneticRules:
        agent.phoneticRules && agent.phoneticRules.length > 0
          ? agent.phoneticRules
          : prev.phoneticRules || [
              ...PHONETIC_PRESETS.toponyms.slice(0, 5),
              ...PHONETIC_PRESETS.surnames.slice(0, 2),
              ...PHONETIC_PRESETS.abbr.slice(0, 2),
            ],
    }));
  }, [agent]);

  useEffect(() => {
    VoiceSimulator.setPhoneticRules(formData.phoneticRules || []);
  }, [formData.phoneticRules]);

  useEffect(() => {
    if (!formData.systemPrompt) {
      const generated = generateSystemPrompt(formData);
      setFormData(prev => ({ ...prev, systemPrompt: generated }));
    }
  }, []);

  const getVoiceDisplayName = (v: VoiceId) =>
    v === 'dmitry' ? 'Дмитрий' : v === 'maxim' ? 'Максим' : v === 'polina' ? 'Полина' : 'Анна';

  const handleNicheChange = (niche: BusinessNiche) => {
    const template = NICHE_TEMPLATES[niche];
    const vName = getVoiceDisplayName(formData.voice);
    const updated: AgentConfig = {
      ...formData,
      niche,
      name: `${vName} — ${template.companyName}`,
      companyName: template.companyName,
      city: template.city,
      address: template.address,
      phone: template.phone,
      workingHours: template.workingHours,
      pricingAndServices: template.pricingAndServices,
      knowledgeBase: template.knowledgeBase,
      firstMessage: template.firstMessage,
    };
    updated.systemPrompt = generateSystemPrompt(updated);
    setFormData(updated);
  };

  const handleRegeneratePrompt = () => {
    const newPrompt = generateSystemPrompt(formData);
    setFormData(prev => ({ ...prev, systemPrompt: newPrompt }));
  };

  const handleSave = () => {
    onSaveAgent(formData);
    setSaveSuccessNotification(true);
    setTimeout(() => setSaveSuccessNotification(false), 3000);
  };

  const handleSyncVapi = async () => {
    setIsSyncingVapi(true);
    setVapiResult(null);

    const current = {
      ...formData,
      systemPrompt: formData.systemPrompt || generateSystemPrompt(formData)
    };

    const res = await syncWithVapiApi(vapiApiKey, current);
    setIsSyncingVapi(false);
    setVapiResult(res);

    if (res.success && res.assistantId) {
      const updated = { ...current, vapiAssistantId: res.assistantId };
      setFormData(updated);
      onSaveAgent(updated);
    }
  };

  const playVoiceSample = (voice: VoiceId) => {
    const text = voice === 'dmitry' || voice === 'maxim'
      ? 'Здравствуйте! Чем я могу помочь вашему автомобилю?'
      : 'Здравствуйте! Автошкола Драйв-Минск, меня зовут Анна, слушаю вас!';
    VoiceSimulator.speak(text, voice);
  };

  const showPhoneticMessage = (msg: string) => {
    setPhoneticToast(msg);
    setTimeout(() => setPhoneticToast(null), 3200);
  };

  const updatePhoneticRules = (nextRules: PhoneticRule[]) => {
    setFormData((prev) => {
      const updated = { ...prev, phoneticRules: nextRules };
      updated.systemPrompt = generateSystemPrompt(updated);
      return updated;
    });
  };

  const handleAddPresetPack = (packKey: 'toponyms' | 'surnames' | 'abbr', label: string) => {
    const current = formData.phoneticRules || [];
    const presetItems = PHONETIC_PRESETS[packKey];
    const existingWords = new Set(current.map((r) => r.word.toLowerCase()));
    const toAdd = presetItems.filter((item) => !existingWords.has(item.word.toLowerCase()));
    const nextRules = [
      ...current.map((r) =>
        presetItems.some((p) => p.word.toLowerCase() === r.word.toLowerCase())
          ? { ...r, enabled: true }
          : r
      ),
      ...toAdd,
    ];
    updatePhoneticRules(nextRules);
    showPhoneticMessage(`В 1 клик подключен пакет «${label}» (${presetItems.length} правил)`);
  };

  const handleAutoDetectToponyms = () => {
    const allPresets = [
      ...PHONETIC_PRESETS.toponyms,
      ...PHONETIC_PRESETS.surnames,
      ...PHONETIC_PRESETS.abbr,
    ];
    const corpus = `${formData.address} ${formData.pricingAndServices} ${formData.knowledgeBase} ${formData.firstMessage}`.toLowerCase();
    const matched = allPresets.filter((p) => corpus.includes(p.word.toLowerCase().slice(0, Math.max(4, p.word.length - 2))));
    const current = formData.phoneticRules || [];
    const existingWords = new Set(current.map((r) => r.word.toLowerCase()));
    const added = matched.filter((m) => !existingWords.has(m.word.toLowerCase()));
    const nextRules = [...current, ...added];
    updatePhoneticRules(nextRules);
    showPhoneticMessage(
      added.length > 0
        ? `Найдено и добавлено из вашего текста: ${added.map((a) => a.stressed).join(', ')}`
        : `Все найденные топонимы и термины из вашего адреса и прайса уже активны в словаре!`
    );
  };

  const handleToggleRule = (id: string) => {
    const current = formData.phoneticRules || [];
    updatePhoneticRules(current.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  const handleRemoveRule = (id: string) => {
    const current = formData.phoneticRules || [];
    updatePhoneticRules(current.filter((r) => r.id !== id));
  };

  const handleApplyStressAtIndex = (charIndex: number) => {
    const base = newWord.trim();
    if (!base) return;
    // Place acute accent U+0301 right after the clicked vowel
    const clean = base.replace(/\u0301/g, '');
    const stressedWord = clean.slice(0, charIndex + 1) + '\u0301' + clean.slice(charIndex + 1);
    // Double the stressed vowel for TTS prosody hint if needed
    const vowel = clean[charIndex];
    const ttsHint = clean.slice(0, charIndex + 1) + vowel.toLowerCase() + clean.slice(charIndex + 1);
    setNewStressed(stressedWord);
    if (!newReplacement) {
      setNewReplacement(ttsHint);
    }
  };

  const handleAddCustomRule = (e: React.FormEvent) => {
    e.preventDefault();
    const w = newWord.trim();
    if (!w) return;
    const st = newStressed.trim() || w;
    const rep = newReplacement.trim() || w;
    const rule: PhoneticRule = {
      id: `ph-custom-${Date.now()}`,
      word: w,
      stressed: st,
      ttsReplacement: rep,
      category: newCategory,
      samplePhrase:
        newCategory === 'surname'
          ? `Запись к специалисту ${rep} открыта на завтра.`
          : newCategory === 'toponym'
          ? `Мы находимся в Минске по адресу: ${rep}.`
          : `В нашей компании действует ${rep}.`,
      enabled: true,
    };
    updatePhoneticRules([rule, ...(formData.phoneticRules || [])]);
    setNewWord('');
    setNewStressed('');
    setNewReplacement('');
    showPhoneticMessage(`Добавлено правило произношения: «${w}» → «${st}»`);
  };

  const handlePlayRuleSample = (rule: PhoneticRule) => {
    setPlayingRuleId(rule.id);
    const phrase =
      rule.samplePhrase ||
      (rule.category === 'surname'
        ? `Вас примет специалист ${rule.ttsReplacement}.`
        : `Мы находимся по адресу: улица ${rule.ttsReplacement}.`);
    VoiceSimulator.speak(
      phrase,
      formData.voice,
      () => setPlayingRuleId(rule.id),
      () => setPlayingRuleId(null)
    );
  };

  // Readiness Score calculation
  const hasNiche = Boolean(formData.niche);
  const hasPrices = Boolean(formData.pricingAndServices && formData.pricingAndServices.length > 20);
  const hasPrompt = Boolean(formData.systemPrompt && formData.systemPrompt.length > 50);
  const readinessPercent = [hasNiche, hasPrices, hasPrompt].filter(Boolean).length * 33 + 1;
  const activePhoneticCount = (formData.phoneticRules || []).filter((r) => r.enabled).length;

  const stepsList = [
    { num: 1, title: 'Профиль и голос', subtitle: 'Ниша и манера речи' },
    { num: 2, title: 'Услуги и цены', subtitle: 'Прайс в BYN и адрес' },
    { num: 3, title: 'Ударения РБ (1-Click)', subtitle: `${activePhoneticCount} топонимов и фамилий` },
    { num: 4, title: 'ИИ-Промт и Vapi', subtitle: 'Автогенерация и запуск' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Smart Bar: Readiness & Guide Trigger */}
      <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-apple-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Readiness indicator */}
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 flex items-center justify-center">
            <svg className="w-10 h-10 -rotate-90">
              <circle
                cx="20"
                cy="20"
                r="16"
                stroke="#E5E7EB"
                strokeWidth="3.5"
                fill="none"
              />
              <motion.circle
                cx="20"
                cy="20"
                r="16"
                stroke="#10B981"
                strokeWidth="3.5"
                fill="none"
                strokeDasharray="100"
                initial={{ strokeDashoffset: 100 }}
                animate={{ strokeDashoffset: 100 - (readinessPercent >= 99 ? 100 : readinessPercent) }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </svg>
            <span className="absolute text-[11px] font-bold text-neutral-900 font-mono">
              {readinessPercent >= 99 ? '100%' : `${readinessPercent}%`}
            </span>
          </div>

          <div>
            <div className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
              <span>Готовность ассистента: {readinessPercent >= 99 ? 'Отличная' : 'В процессе'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            </div>
            <p className="text-[11px] text-neutral-500">
              {readinessPercent >= 99 
                ? 'Бот полностью обучен и готов принимать вызовы' 
                : 'Заполните цены и сгенерируйте промт для запуска'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsGuideOpen(true)}
            className="px-3.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-neutral-600" />
            <span>Инструкция за 3 мин</span>
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded-full bg-neutral-900 hover:bg-black text-white text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Сохранить</span>
          </button>
        </div>

      </div>

      {/* Step Selector Tabs (Notion Clean Pill Style with Animation) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 rounded-2xl bg-neutral-100/80 border border-neutral-200/80">
        {stepsList.map((s) => {
          const isActive = activeStep === s.num;
          return (
            <button
              key={s.num}
              onClick={() => setActiveStep(s.num as any)}
              className={`relative py-2.5 px-3 rounded-xl text-left transition-all flex items-center gap-2.5 ${
                isActive
                  ? 'bg-white text-neutral-900 shadow-apple-sm font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                isActive ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-600'
              }`}>
                {s.num}
              </div>
              <div className="truncate">
                <div className="text-xs truncate">{s.title}</div>
                <div className="text-[10px] font-normal text-neutral-400 hidden sm:block truncate">{s.subtitle}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Save Success Alert */}
      <AnimatePresence>
        {saveSuccessNotification && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between"
          >
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Настройки успешно сохранены в базе данных!</span>
            </div>
            <span className="text-[11px] text-emerald-700">Готов к приему звонков</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Grid: Clean Wizard Form (Left) & Live Tester (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Active Step Form */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: Ниша, Голос, Контакты */}
            {activeStep === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="p-5 sm:p-6 rounded-2xl bg-white border border-neutral-200 space-y-5 shadow-apple-sm"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-neutral-900">
                      Шаг 1: Профиль бизнеса и выбор голоса
                    </h3>
                    <span className="text-[11px] text-neutral-400 font-mono">1 из 4</span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Выберите готовую отрасль — база знаний подставится автоматически
                  </p>
                </div>

                {/* Niche choices */}
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
                    Отрасль бизнеса (Беларусь):
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['driving_school', 'auto_service', 'medical_clinic', 'beauty_salon'] as BusinessNiche[]).map((n) => {
                      const t = NICHE_TEMPLATES[n];
                      const isSelected = formData.niche === n;
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => handleNicheChange(n)}
                          className={`p-3 rounded-xl text-left border transition-all text-xs font-semibold flex items-center justify-between ${
                            isSelected
                              ? 'bg-neutral-900 border-neutral-900 text-white shadow-sm'
                              : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                          }`}
                        >
                          <div>
                            <div>{t.name}</div>
                            <div className={`text-[10px] font-normal mt-0.5 ${isSelected ? 'text-neutral-300' : 'text-neutral-400'}`}>
                              Чек: ~{t.defaultAvgCheck} BYN
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Voice selection */}
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
                    Голос голосового администратора:
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {(['anna', 'dmitry'] as VoiceId[]).map((v) => {
                      const profile = VOICE_PROFILES[v];
                      const isSelected = formData.voice === v;
                      return (
                        <div
                          key={v}
                          onClick={() =>
                            setFormData(prev => {
                              const nextName = `${getVoiceDisplayName(v)} — ${prev.companyName}`;
                              const nextConfig = { ...prev, voice: v, name: nextName };
                              return { ...nextConfig, systemPrompt: generateSystemPrompt(nextConfig) };
                            })
                          }
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2 ${
                            isSelected
                              ? 'bg-neutral-900 border-neutral-900 text-white shadow-sm'
                              : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-bold flex items-center gap-1.5">
                              <span>{profile.name}</span>
                              <span className={`text-[10px] font-normal ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                                ({profile.gender === 'female' ? 'Женский' : 'Мужской'})
                              </span>
                            </div>
                            <div className={`text-[11px] line-clamp-2 mt-0.5 leading-snug ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                              {profile.description}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              playVoiceSample(v);
                            }}
                            title="Послушать голос"
                            className={`p-1.5 rounded-lg border transition-colors shrink-0 ${
                              isSelected
                                ? 'bg-neutral-800 text-white border-neutral-700 hover:bg-neutral-700'
                                : 'bg-neutral-100 text-neutral-700 border-neutral-200 hover:bg-neutral-200'
                            }`}
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Company details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Название компании:
                    </label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => {
                        const newCompany = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          companyName: newCompany,
                          name: `${getVoiceDisplayName(prev.voice)} — ${newCompany}`
                        }));
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-neutral-300 text-neutral-900 text-xs focus:outline-none focus:border-neutral-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Город в Беларуси:
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-neutral-300 text-neutral-900 text-xs focus:outline-none focus:border-neutral-900"
                    />
                  </div>
                </div>

                {/* First message */}
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Первая фраза бота при снятии трубки (за 0.5 сек):
                  </label>
                  <textarea
                    rows={2}
                    value={formData.firstMessage}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstMessage: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-neutral-300 text-neutral-900 text-xs focus:outline-none focus:border-neutral-900"
                  />
                </div>

                {/* Next Step Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveStep(2)}
                    className="px-4 py-2 rounded-full bg-neutral-900 hover:bg-black text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <span>Перейти к ценам и услугам</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </motion.div>
            )}

            {/* STEP 2: Прайс-лист, Адрес, График работы */}
            {activeStep === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="p-5 sm:p-6 rounded-2xl bg-white border border-neutral-200 space-y-4 shadow-apple-sm"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-neutral-900">
                      Шаг 2: Цены, адрес и база знаний
                    </h3>
                    <span className="text-[11px] text-neutral-400 font-mono">2 из 4</span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Укажите ваши актуальные цены в белорусских рублях (BYN)
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-neutral-700">
                        Адрес и ориентир (ст.м., улица):
                      </label>
                      <button
                        type="button"
                        onClick={() => setActiveStep(3)}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Ударения улиц РБ в 1 клик ({activePhoneticCount}) →</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-neutral-300 text-neutral-900 text-xs focus:outline-none focus:border-neutral-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      График работы:
                    </label>
                    <input
                      type="text"
                      value={formData.workingHours}
                      onChange={(e) => setFormData(prev => ({ ...prev, workingHours: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-neutral-300 text-neutral-900 text-xs focus:outline-none focus:border-neutral-900"
                    />
                  </div>
                </div>

                {/* Pricing in BYN */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-neutral-700">
                      Прайс-лист и ключевые услуги (в BYN):
                    </label>
                    <span className="text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                      Валюта: BYN
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={formData.pricingAndServices}
                    onChange={(e) => setFormData(prev => ({ ...prev, pricingAndServices: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-neutral-300 text-neutral-900 text-xs font-mono focus:outline-none focus:border-neutral-900 leading-relaxed"
                  />
                  <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200/80 text-[11px] text-neutral-600 flex items-start gap-1.5 mt-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span><strong>Совет:</strong> Формулируйте цены четко: <i>«Полный курс — 1050 BYN. Рассрочка в 4 этапа по 262.50 BYN»</i>. Бот сам озвучит это вежливо.</span>
                  </div>
                </div>

                {/* Knowledge Base */}
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    База знаний и частые вопросы (акции, гарантия, парковка):
                  </label>
                  <textarea
                    rows={4}
                    value={formData.knowledgeBase}
                    onChange={(e) => setFormData(prev => ({ ...prev, knowledgeBase: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-neutral-300 text-neutral-900 text-xs font-mono focus:outline-none focus:border-neutral-900 leading-relaxed"
                  />
                </div>

                {/* YCLIENTS / Altegio Live Slot Sync Box */}
                <div className="p-4 rounded-xl border border-blue-200/90 bg-blue-50/40 space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-blue-100">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                        <CalendarIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span>Синхронизация слотов YCLIENTS / Altegio</span>
                          <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                            В реальном времени
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Бот видит свободные окна мастеров/подъемников прямо во время звонка
                        </p>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.yclientsConfig?.isEnabled ?? true}
                        onChange={(e) => {
                          const updated = {
                            ...formData,
                            yclientsConfig: {
                              ...(formData.yclientsConfig || DEFAULT_YCLIENTS_CONFIG),
                              isEnabled: e.target.checked
                            }
                          };
                          updated.systemPrompt = generateSystemPrompt(updated);
                          setFormData(updated);
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {formData.yclientsConfig?.isEnabled && (
                    <div className="space-y-3 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-700 mb-1">
                            Платформа онлайн-записи:
                          </label>
                          <select
                            value={formData.yclientsConfig.platform}
                            onChange={(e) => {
                              const updated = {
                                ...formData,
                                yclientsConfig: {
                                  ...formData.yclientsConfig!,
                                  platform: e.target.value as any
                                }
                              };
                              updated.systemPrompt = generateSystemPrompt(updated);
                              setFormData(updated);
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                          >
                            <option value="yclients">YCLIENTS</option>
                            <option value="altegio">Altegio</option>
                            <option value="dikidi">DIKIDI Online</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-700 mb-1">
                            ID компании в YCLIENTS:
                          </label>
                          <input
                            type="text"
                            value={formData.yclientsConfig.companyId}
                            onChange={(e) => {
                              const updated = {
                                ...formData,
                                yclientsConfig: {
                                  ...formData.yclientsConfig!,
                                  companyId: e.target.value
                                }
                              };
                              setFormData(updated);
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-600"
                          />
                        </div>
                      </div>

                      {/* Specialists List Preview */}
                      <div>
                        <div className="text-[11px] font-semibold text-slate-600 mb-1.5">
                          Подключенные специалисты / боксы ({formData.companyName}):
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {YclientsService.getStaffList(formData.niche).map((staff) => (
                            <span
                              key={staff.id}
                              className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] text-slate-700 flex items-center gap-1 shadow-2xs"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <strong className="font-medium">{staff.name}</strong>
                              <span className="text-[10px] text-slate-400">({staff.specialization.split(' ')[0]})</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Interactive Slot Testing */}
                      <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <ClockIcon className="w-3.5 h-3.5 text-blue-600" />
                            <span>Проверить доступные окна прямо сейчас:</span>
                          </div>

                          <button
                            type="button"
                            onClick={handleFetchYclientsSlots}
                            disabled={isLoadingSlots}
                            className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-medium flex items-center gap-1 transition-colors disabled:opacity-50"
                          >
                            <RefreshCw className={`w-3 h-3 ${isLoadingSlots ? 'animate-spin' : ''}`} />
                            <span>{isLoadingSlots ? 'Запрос в API...' : 'Запросить слоты на завтра'}</span>
                          </button>
                        </div>

                        {yclientsSlots.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <div className="text-[11px] text-slate-500">
                              Нажмите на окно для симуляции бронирования ассистентом:
                            </div>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                              {yclientsSlots.slice(0, 6).map((slot, sIdx) => (
                                <button
                                  key={sIdx}
                                  type="button"
                                  onClick={() => handleTestBookSlot(slot)}
                                  className={`p-1.5 rounded-md text-center text-xs font-mono font-bold transition-all border ${
                                    slot.isAvailable
                                      ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800 shadow-2xs'
                                      : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed line-through'
                                  }`}
                                  title={slot.isAvailable ? `Забронировать к ${slot.staffName}` : 'Слот занят'}
                                >
                                  {slot.time}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {bookingTestSuccess && (
                          <div className="p-2 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] flex items-center gap-1.5 font-medium animate-in fade-in">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{bookingTestSuccess}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveStep(1)}
                    className="px-3.5 py-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Назад</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveStep(3)}
                    className="px-4 py-2 rounded-full bg-neutral-900 hover:bg-black text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <span>К словарю ударений РБ (1-Click)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </motion.div>
            )}

            {/* STEP 3: Словарь фонетических замен и ударений РБ (1-Click) */}
            {activeStep === 3 && (
              <motion.div
                key="step-3-phonetics"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="p-5 sm:p-6 rounded-2xl bg-white border border-neutral-200 space-y-5 shadow-apple-sm"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                      <span>Шаг 3: Словарь фонетических замен и ударений РБ</span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold">
                        1-Click
                      </span>
                    </h3>
                    <span className="text-[11px] text-neutral-400 font-mono">3 из 4</span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                    Исключает ошибки синтеза речи на белорусских улицах (Победителей, Притыцкого, Немига, Шаранговича) и фамилиях врачей
                  </p>
                </div>

                {/* Toast notification for 1-click actions */}
                <AnimatePresence>
                  {phoneticToast && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-2 font-medium"
                    >
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>{phoneticToast}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 1-Click Preset Packs */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider">
                      Готовые словари Беларуси в 1 клик:
                    </span>
                    <button
                      type="button"
                      onClick={handleAutoDetectToponyms}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Найти топонимы в моём адресе</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddPresetPack('toponyms', 'Улицы и топонимы Минска')}
                      className="p-3 rounded-xl bg-white hover:bg-blue-50/60 border border-slate-200/90 hover:border-blue-300 text-left transition-all group shadow-apple-sm"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-neutral-900 group-hover:text-blue-700 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-blue-600" />
                          <span>Улицы Минска</span>
                        </span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                          +8 слов
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-500 leading-snug">
                        Победи́телей, Приты́цкого, Неми́га, Шаранго́вича, Сурга́нова
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddPresetPack('surnames', 'Фамилии врачей и мастеров РБ')}
                      className="p-3 rounded-xl bg-white hover:bg-emerald-50/60 border border-slate-200/90 hover:border-emerald-300 text-left transition-all group shadow-apple-sm"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-neutral-900 group-hover:text-emerald-700 flex items-center gap-1.5">
                          <UserIcon className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Фамилии врачей</span>
                        </span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                          +5 фамилий
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-500 leading-snug">
                        Лукаше́вич, Ждано́вич, Ковалё́нок, Станке́вич, Богдано́вич
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddPresetPack('abbr', 'Аббревиатуры РБ (BYN, ЕРИП)')}
                      className="p-3 rounded-xl bg-white hover:bg-indigo-50/60 border border-slate-200/90 hover:border-indigo-300 text-left transition-all group shadow-apple-sm"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-neutral-900 group-hover:text-indigo-700 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Термины РБ</span>
                        </span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">
                          +4 замены
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-500 leading-snug">
                        BYN → белорусских рублей, ЕРИП, КЛКТ, АКПП
                      </p>
                    </button>
                  </div>
                </div>

                {/* Add custom word / doctor surname with 1-click vowel stress */}
                <form onSubmit={handleAddCustomRule} className="p-4 rounded-xl bg-white border border-neutral-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-neutral-900">
                      Добавить свою улицу или фамилию врача:
                    </label>
                    <div className="flex items-center gap-1">
                      {(
                        [
                          { id: 'toponym', label: 'Топоним / Улица' },
                          { id: 'surname', label: 'Фамилия врача' },
                          { id: 'abbr', label: 'Термин / Бренд' },
                        ] as const
                      ).map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setNewCategory(cat.id)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                            newCategory === cat.id
                              ? 'bg-neutral-900 text-white'
                              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <span className="block text-[10px] font-medium text-neutral-500 mb-1">
                        1. Слово в базе (напр. Макаёнка):
                      </span>
                      <input
                        type="text"
                        placeholder="Напр.: Шаранговича"
                        value={newWord}
                        onChange={(e) => {
                          setNewWord(e.target.value);
                          if (!newStressed) setNewStressed(e.target.value);
                        }}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-neutral-300 text-neutral-900 text-xs focus:outline-none focus:border-neutral-900"
                      />
                    </div>

                    <div>
                      <span className="block text-[10px] font-medium text-neutral-500 mb-1">
                        2. Ударение (кликните букву ниже):
                      </span>
                      <input
                        type="text"
                        placeholder="Шаранго́вича"
                        value={newStressed}
                        onChange={(e) => setNewStressed(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-neutral-300 text-neutral-900 text-xs focus:outline-none focus:border-neutral-900"
                      />
                    </div>

                    <div>
                      <span className="block text-[10px] font-medium text-neutral-500 mb-1">
                        3. Фонетика для TTS (как читать):
                      </span>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="Шаранговича"
                          value={newReplacement}
                          onChange={(e) => setNewReplacement(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-white border border-neutral-300 text-neutral-900 text-xs focus:outline-none focus:border-neutral-900"
                        />
                        <button
                          type="submit"
                          className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shrink-0 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Interactive 1-Click Vowel Stress Picker */}
                  {newWord.trim().length > 1 && (
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      <span className="text-[11px] text-neutral-500">
                        Поставить ударение в 1 клик (нажмите на ударную гласную):
                      </span>
                      <div className="inline-flex items-center gap-1">
                        {newWord
                          .trim()
                          .replace(/\u0301/g, '')
                          .split('')
                          .map((ch, idx) => {
                            const isVowel = /[аеёиоуыэюяАЕЁИОУЫЭЮЯ]/.test(ch);
                            return (
                              <button
                                key={idx}
                                type="button"
                                disabled={!isVowel}
                                onClick={() => handleApplyStressAtIndex(idx)}
                                className={`w-6 h-6 rounded-md text-xs font-bold flex items-center justify-center transition-all ${
                                  isVowel
                                    ? 'bg-blue-50 text-blue-700 border border-blue-300 hover:bg-blue-600 hover:text-white cursor-pointer shadow-xs'
                                    : 'bg-neutral-50 text-neutral-400 border border-neutral-200 cursor-default'
                                }`}
                                title={isVowel ? `Поставить ударение на «${ch}»` : undefined}
                              >
                                {ch}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </form>

                {/* Active Phonetic Rules List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-800">
                      Активный словарь произношения ({activePhoneticCount} из {(formData.phoneticRules || []).length}):
                    </span>
                    <span className="text-[11px] text-neutral-400">
                      Нажмите 🔊 для проверки голосом {getVoiceDisplayName(formData.voice)}
                    </span>
                  </div>

                  <div className="max-h-64 overflow-y-auto pr-1 space-y-1.5">
                    {(formData.phoneticRules || []).map((rule) => {
                      const isPlaying = playingRuleId === rule.id;
                      const badgeStyle =
                        rule.category === 'toponym'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : rule.category === 'surname'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200';
                      const badgeLabel =
                        rule.category === 'toponym'
                          ? 'Улица РБ'
                          : rule.category === 'surname'
                          ? 'Фамилия'
                          : 'Термин';

                      return (
                        <div
                          key={rule.id}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                            rule.enabled
                              ? 'bg-white border-neutral-200/90 shadow-2xs'
                              : 'bg-neutral-50 border-neutral-200/50 opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={rule.enabled}
                              onChange={() => handleToggleRule(rule.id)}
                              className="rounded border-neutral-300 text-neutral-900 focus:ring-0 cursor-pointer"
                            />
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border shrink-0 ${badgeStyle}`}>
                              {badgeLabel}
                            </span>
                            <div className="text-xs truncate flex items-center gap-1.5">
                              <span className="text-neutral-500 line-through decoration-neutral-300">
                                {rule.word}
                              </span>
                              <span className="text-neutral-400">→</span>
                              <span className="font-bold text-neutral-900 bg-amber-50/90 px-1.5 py-0.5 rounded border border-amber-200/70">
                                {rule.stressed}
                              </span>
                              {rule.ttsReplacement !== rule.word && (
                                <span className="text-[11px] text-neutral-400 font-mono hidden sm:inline">
                                  [{rule.ttsReplacement}]
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handlePlayRuleSample(rule)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all ${
                                isPlaying
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                              }`}
                              title="Прослушать произношение в контексте фразы"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">{isPlaying ? 'Звучит...' : 'Слушать'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemoveRule(rule.id)}
                              className="p-1 text-neutral-400 hover:text-rose-600 transition-colors"
                              title="Удалить правило"
                            >
                              <CloseCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveStep(2)}
                    className="px-3.5 py-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Назад к ценам</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveStep(4)}
                    className="px-4 py-2 rounded-full bg-neutral-900 hover:bg-black text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <span>Перейти к генерации промта</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: ИИ-Промт и Vapi API */}
            {activeStep === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="p-5 sm:p-6 rounded-2xl bg-white border border-neutral-200 space-y-4 shadow-apple-sm"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-neutral-900">
                      Шаг 4: Автоматический генератор Системного Промта
                    </h3>
                    <span className="text-[11px] text-neutral-400 font-mono">4 из 4</span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Склейка регламентов общения и прямая синхронизация с Vapi.ai API
                  </p>
                </div>

                {/* Prompt generator action box */}
                <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/90 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-neutral-800" />
                      <strong className="text-xs font-semibold text-neutral-900">
                        Системный промт скомпилирован
                      </strong>
                    </div>

                    <button
                      type="button"
                      onClick={handleRegeneratePrompt}
                      className="px-2.5 py-1 rounded-md bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-300 text-[11px] font-medium flex items-center gap-1 transition-colors shadow-apple-sm"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Обновить по новым ценам</span>
                    </button>
                  </div>

                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Промт содержит правила фиксации контактов (Имя, Телефон, Желаемая дата), валидацию цен строго в BYN и инструкцию перевода звонка при нестандартных ситуациях.
                  </p>

                  <button
                    type="button"
                    onClick={() => setShowPromptEditor(!showPromptEditor)}
                    className="text-xs text-neutral-800 font-semibold underline flex items-center gap-1"
                  >
                    <span>{showPromptEditor ? 'Скрыть текст системного промта' : 'Посмотреть и отредактировать промт'}</span>
                    {showPromptEditor ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {showPromptEditor && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-1.5 pt-1"
                    >
                      <textarea
                        rows={7}
                        value={formData.systemPrompt}
                        onChange={(e) => setFormData(prev => ({ ...prev, systemPrompt: e.target.value }))}
                        className="w-full p-3 rounded-lg bg-white border border-neutral-300 text-neutral-900 text-xs font-mono focus:outline-none focus:border-neutral-900 leading-relaxed"
                      />
                      <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                        <span>~{Math.round(formData.systemPrompt.length / 4)} токенов</span>
                        <span>Язык: Русский (РБ) • Nova-2 + GPT-4o-mini</span>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Vapi Sync action */}
                <div className="p-4 rounded-xl bg-white border border-neutral-200/90 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-neutral-900">
                        Синхронизация с Vapi.ai API
                      </div>
                      <div className="text-[11px] text-neutral-500 font-mono">
                        {formData.vapiAssistantId ? `ID: ${formData.vapiAssistantId}` : 'Эндпоинт: https://api.vapi.ai/assistant'}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSyncVapi}
                      disabled={isSyncingVapi}
                      className="px-4 py-2 rounded-full bg-neutral-900 hover:bg-black text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                    >
                      {isSyncingVapi ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>Синхронизировать сейчас</span>
                    </button>
                  </div>

                  {vapiResult && (
                    <div className={`p-3 rounded-lg text-xs ${
                      vapiResult.success
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border border-rose-200 text-rose-800'
                    }`}>
                      <div className="font-medium flex items-center gap-1.5">
                        {vapiResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                        <span>{vapiResult.message}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveStep(3)}
                    className="px-3.5 py-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Назад к словарю ударений</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Сохранить всё и завершить</span>
                  </button>
                </div>

              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Right Column: Live In-Browser Bot Tester */}
        <div className="lg:col-span-5 space-y-4">
          <LiveBotTester agent={formData} />

          {/* Quick Guidance Box (Notion Style) */}
          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-neutral-900">
              <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Чек-лист перед запуском в рекламу:</span>
            </div>
            <ul className="space-y-1.5 text-neutral-600 text-[11px] pl-6 list-disc">
              <li>Позвоните боту через кнопку выше и задайте свой самый частый вопрос.</li>
              <li>Проверьте, правильно ли бот называет адрес вашего офиса в Минске.</li>
              <li>В разделе «Интеграции» проверьте отправку тестового лида в Telegram.</li>
            </ul>
          </div>
        </div>

      </div>

      {/* Guide Modal */}
      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

    </div>
  );
};
