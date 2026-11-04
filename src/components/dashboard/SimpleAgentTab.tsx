import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircleIcon as CheckCircle2,
  DisketteIcon as Save,
  PlayIcon as Play,
  PauseIcon as Pause,
  Tuning2Icon as Sliders,
  AltArrowDownIcon as ChevronDown,
  MagicWand3Icon as Sparkles
} from '@solar-icons/react/bold-duotone';
import { Wrench, Scissors, GraduationCap, Stethoscope } from 'lucide-react';
import { AgentConfig, BusinessNiche, VoiceId, CallLog } from '../../types';
import { NICHE_TEMPLATES } from '../../lib/mockData';
import { generateSystemPrompt } from '../../lib/vapiService';
import { requestAiPromptImprovement, adaptGreetingForVoice } from '../../lib/botDialogueEngine';
import { VoiceSimulator } from '../../lib/speechSynth';
import { LiveBotTester } from './LiveBotTester';
import { KnowledgeBaseDocumentsCard } from './KnowledgeBaseDocumentsCard';
import { FieldLabel, FieldHint, AutoGrowTextarea } from './FieldHelp';
import {
  BelarusPhoneInput,
  InteractiveAddressBuilder,
  InteractiveScheduleBuilder,
  InteractiveGreetingBuilder,
  InteractiveServicesBuilder
} from './InteractiveAgentFields';

interface SimpleAgentTabProps {
  agent: AgentConfig;
  onSaveAgent: (agent: AgentConfig) => void;
  onCallCompleted?: (log: CallLog) => void;
}

export const SimpleAgentTab: React.FC<SimpleAgentTabProps> = ({
  agent,
  onSaveAgent,
  onCallCompleted
}) => {
  const [formData, setFormData] = useState<AgentConfig>(agent);
  const [isCustomPrompt, setIsCustomPrompt] = useState<boolean>(() => {
    if (!agent.systemPrompt?.trim()) return false;
    return agent.systemPrompt.trim() !== generateSystemPrompt(agent).trim();
  });
  const [syncVersion, setSyncVersion] = useState(0);
  const [playingVoiceId, setPlayingVoiceId] = useState<VoiceId | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [promptGenStatus, setPromptGenStatus] = useState<string | null>(null);

  useEffect(() => {
    setFormData(agent);
    setIsCustomPrompt(
      Boolean(agent.systemPrompt?.trim() && agent.systemPrompt.trim() !== generateSystemPrompt(agent).trim())
    );
    setSyncVersion((v) => v + 1);
  }, [agent]);

  useEffect(() => {
    return () => {
      VoiceSimulator.stop();
    };
  }, []);

  const niches: Array<{
    id: BusinessNiche;
    label: string;
    desc: string;
    Icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'auto_service', label: 'Автосервис (СТО)', desc: 'Ремонт, диагностика, ТО, шиномонтаж', Icon: Wrench },
    { id: 'beauty_salon', label: 'Салон красоты', desc: 'Маникюр, стрижки, окрашивание, уход', Icon: Scissors },
    { id: 'driving_school', label: 'Автошкола', desc: 'Категория B, группы, рассрочка, вождение', Icon: GraduationCap },
    { id: 'medical_clinic', label: 'Стоматология / Центр', desc: 'Приём врача, снимки, запись по острой боли', Icon: Stethoscope }
  ];

  const getVoiceDisplayName = (voice: VoiceId): string => {
    return voice === 'maxim' ? 'Максим' : 'Анна';
  };

  const handleSelectNiche = (niche: BusinessNiche) => {
    const tmpl = NICHE_TEMPLATES[niche];
    const voiceLabel = getVoiceDisplayName(formData.voice);
    const updated: AgentConfig = {
      ...formData,
      niche,
      name: `${voiceLabel} — ${tmpl.companyName}`,
      companyName: tmpl.companyName,
      city: tmpl.city,
      address: tmpl.address,
      phone: tmpl.phone,
      workingHours: tmpl.workingHours,
      pricingAndServices: tmpl.pricingAndServices,
      knowledgeBase: tmpl.knowledgeBase,
      firstMessage: adaptGreetingForVoice(tmpl.firstMessage, formData.voice, tmpl.companyName, tmpl.companyName),
      updatedAt: new Date().toISOString()
    };
    updated.systemPrompt = generateSystemPrompt(updated);
    setIsCustomPrompt(false);
    setFormData(updated);
    setSyncVersion((v) => v + 1);
    onSaveAgent(updated);
  };

  const handleSelectVoice = (voice: VoiceId) => {
    const tmpl = NICHE_TEMPLATES[formData.niche] || NICHE_TEMPLATES.driving_school;
    const voiceLabel = getVoiceDisplayName(voice);
    const updated: AgentConfig = {
      ...formData,
      voice,
      name: `${voiceLabel} — ${formData.companyName}`,
      firstMessage: adaptGreetingForVoice(
        formData.firstMessage || tmpl.firstMessage,
        voice,
        formData.companyName,
        formData.companyName
      )
    };
    setFormData(updated);
    onSaveAgent(updated);
  };

  const handleCompanyNameChange = (nextCompany: string) => {
    const prevCompany = formData.companyName;
    const voiceLabel = getVoiceDisplayName(formData.voice);
    const syncedGreeting = adaptGreetingForVoice(
      formData.firstMessage,
      formData.voice,
      nextCompany,
      prevCompany
    );
    setFormData({
      ...formData,
      companyName: nextCompany,
      name: `${voiceLabel} — ${nextCompany}`,
      firstMessage: syncedGreeting
    });
  };

  const handlePlayVoiceSample = (voice: VoiceId) => {
    if (playingVoiceId === voice) {
      VoiceSimulator.stop();
      setPlayingVoiceId(null);
      return;
    }

    VoiceSimulator.stop();
    const phrase =
      voice === 'maxim'
        ? `Добрый день! ${formData.companyName || 'Компания'}, специалист Максим. Подскажу по услугам и запишу вас.`
        : `Здравствуйте! ${formData.companyName || 'Голосовой помощник'}, меня зовут Анна. С радостью подскажу цены и запишу вас!`;

    VoiceSimulator.speak(
      phrase,
      voice,
      () => setPlayingVoiceId(voice),
      () => setPlayingVoiceId(null)
    );
  };

  const handleGenerateAiPrompt = async () => {
    setIsGeneratingPrompt(true);
    setPromptGenStatus(null);

    const result = await requestAiPromptImprovement(formData);
    setIsGeneratingPrompt(false);

    if (result?.systemPrompt) {
      setIsCustomPrompt(true);
      setFormData((prev) => ({
        ...prev,
        systemPrompt: result.systemPrompt
      }));
      setPromptGenStatus('Правила разговора улучшены нейросетью по вашим услугам и сохранятся без перезаписи.');
    } else {
      const localPrompt = generateSystemPrompt(formData);
      setIsCustomPrompt(false);
      setFormData((prev) => ({
        ...prev,
        systemPrompt: localPrompt
      }));
      setPromptGenStatus('Правила разговора пересобраны по вашему прайс-листу и графику.');
    }
    setTimeout(() => setPromptGenStatus(null), 5000);
  };

  const handleSave = (e?: React.FormEvent) => {
    e?.preventDefault();
    const nextSystemPrompt =
      isCustomPrompt && formData.systemPrompt?.trim()
        ? formData.systemPrompt.trim()
        : generateSystemPrompt(formData);

    const finalized: AgentConfig = {
      ...formData,
      systemPrompt: nextSystemPrompt,
      updatedAt: new Date().toISOString()
    };
    setFormData(finalized);
    onSaveAgent(finalized);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const syncKey = `${formData.niche}-${syncVersion}`;

  return (
    <form id="active-workspace-form" onSubmit={handleSave} className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header with Save button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Настройка голосового бота
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Выберите нужные параметры кнопками и списками — справа можно сразу проверить обновлённого бота голосом.
          </p>
        </div>

        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>Сохранить настройки</span>
        </button>
      </div>

      {/* Save Success Alert */}
      <AnimatePresence>
        {savedSuccess && (
          <motion.div
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Настройки сохранены! Бот уже отвечает по новым услугам, графику и адресу.</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Interactive Builder Column */}
        <div className="lg:col-span-7 space-y-5">
          {/* Card 1: Сфера бизнеса */}
          <section
            aria-labelledby="section-niche-heading"
            className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 id="section-niche-heading" className="text-xs font-bold text-slate-900">
                1. Выберите сферу вашего бизнеса
              </h3>
              <span className="text-[11px] text-slate-400">Готовый шаблон</span>
            </div>

            <p id="agent-niche-hint" className="text-[11px] text-slate-500 leading-relaxed">
              При выборе сферы поля ниже заполнятся готовым набором услуг и графиком — вы сразу сможете настроить их под себя.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" role="radiogroup" aria-describedby="agent-niche-hint">
              {niches.map((n) => {
                const isSelected = formData.niche === n.id;
                const radioId = `agent-niche-${n.id}`;
                return (
                  <label
                    key={n.id}
                    htmlFor={radioId}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      id={radioId}
                      type="radio"
                      name="niche"
                      value={n.id}
                      checked={isSelected}
                      onChange={() => handleSelectNiche(n.id)}
                      className="visually-hidden"
                    />
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <n.Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className={`text-xs font-bold leading-snug ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                        {n.label}
                      </div>
                      <div className="text-[11px] text-slate-500 leading-snug mt-0.5">
                        {n.desc}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </section>

          {/* Card 2: Голос бота */}
          <section
            aria-labelledby="section-voice-heading"
            className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3"
          >
            <h3 id="section-voice-heading" className="text-xs font-bold text-slate-900">
              2. Каким голосом бот будет общаться с клиентами
            </h3>
            <p id="agent-voice-hint" className="text-[11px] text-slate-500 leading-relaxed">
              Нажмите «Послушать пример», чтобы выбрать подходящий голос. Имя в приветствии обновится само.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-describedby="agent-voice-hint">
              {[
                { id: 'anna' as const, name: 'Анна (женский)', desc: 'Доброжелательный, мягкий голос администратора' },
                { id: 'maxim' as const, name: 'Максим (мужской)', desc: 'Спокойный, уверенный голос мастера-консультанта' }
              ].map((v) => {
                const isSelected = formData.voice === v.id;
                const isPlayingThis = playingVoiceId === v.id;
                const radioId = `agent-voice-${v.id}`;
                return (
                  <div
                    key={v.id}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-2.5 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <label htmlFor={radioId} className="cursor-pointer block">
                      <input
                        id={radioId}
                        type="radio"
                        name="voice"
                        value={v.id}
                        checked={isSelected}
                        onChange={() => handleSelectVoice(v.id)}
                        className="visually-hidden"
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{v.name}</span>
                        <span
                          className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{v.desc}</p>
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        handleSelectVoice(v.id);
                        handlePlayVoiceSample(v.id);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 hover:border-blue-200 text-[11px] font-semibold inline-flex items-center gap-1.5 self-start transition-colors"
                    >
                      {isPlayingThis ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      <span>{isPlayingThis ? 'Остановить' : 'Послушать пример'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Card 3: Интерактивные данные компании (Название + Телефон + Адрес/метро + График работы) */}
          <section
            aria-labelledby="section-company-heading"
            className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4"
          >
            <div className="pb-2.5 border-b border-slate-100">
              <h3 id="section-company-heading" className="text-xs font-bold text-slate-900">
                3. Основная информация о вашей компании
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Все изменения сразу подставляются в приветствие и ответы бота
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <div>
                <FieldLabel
                  htmlFor="agent-company-name"
                  label="Название компании"
                  required
                  helpTitle="Как написать название компании"
                  helpText="Напишите понятное на слух название без «ООО» и «УНП». Как только вы измените название здесь, оно автоматически обновится и в приветствии бота ниже."
                  helpExample="Автошкола Все категории&#10;Автосервис Минск-Моторс&#10;Стоматология Дент-Престиж"
                />
                <div className="mb-1.5 flex items-center">
                  <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/70">
                    Автоподстановка в приветствие включена
                  </span>
                </div>
                <AutoGrowTextarea
                  id="agent-company-name"
                  name="companyName"
                  rows={1}
                  required
                  aria-describedby="agent-company-hint"
                  value={formData.companyName}
                  onChange={(e) => handleCompanyNameChange(e.target.value)}
                  placeholder="Напр.: Автошкола Все категории"
                  className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 leading-relaxed focus:outline-none focus:border-blue-600"
                />
                <FieldHint id="agent-company-hint">
                  Это название бот произнесёт клиенту в первую секунду звонка.
                </FieldHint>
              </div>

              <BelarusPhoneInput
                id="agent-transfer-phone"
                value={formData.phone}
                onChange={(nextPhone) => setFormData({ ...formData, phone: nextPhone })}
              />
            </div>

            <InteractiveAddressBuilder
              city={formData.city}
              address={formData.address}
              syncKey={syncKey}
              onChange={(nextCity, nextAddress) =>
                setFormData((prev) => ({
                  ...prev,
                  city: nextCity,
                  address: nextAddress
                }))
              }
            />

            <InteractiveScheduleBuilder
              value={formData.workingHours}
              syncKey={syncKey}
              onChange={(nextHours) =>
                setFormData((prev) => ({
                  ...prev,
                  workingHours: nextHours
                }))
              }
            />
          </section>

          {/* Card 4: Интерактивное приветствие и конструктор прайс-листа */}
          <section
            aria-labelledby="section-pricing-heading"
            className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4"
          >
            <div className="pb-2.5 border-b border-slate-100">
              <h3 id="section-pricing-heading" className="text-xs font-bold text-slate-900">
                4. Приветствие и цены на услуги (в BYN)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Добавляйте услуги карточками и отмечайте способы оплаты кнопками
              </p>
            </div>

            <InteractiveGreetingBuilder
              value={formData.firstMessage}
              companyName={formData.companyName}
              voice={formData.voice}
              niche={formData.niche}
              onChange={(nextGreeting) =>
                setFormData((prev) => ({
                  ...prev,
                  firstMessage: nextGreeting
                }))
              }
            />

            <InteractiveServicesBuilder
              value={formData.pricingAndServices}
              niche={formData.niche}
              syncKey={syncKey}
              onChange={(nextPricing) =>
                setFormData((prev) => ({
                  ...prev,
                  pricingAndServices: nextPricing
                }))
              }
            />

            <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleGenerateAiPrompt}
                disabled={isGeneratingPrompt}
                className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>
                  {isGeneratingPrompt ? 'Обновляем правила бота...' : 'Обновить правила разговора по этому прайсу'}
                </span>
              </button>

              {promptGenStatus && (
                <span role="status" aria-live="polite" className="text-[11px] text-emerald-700 font-medium">
                  {promptGenStatus}
                </span>
              )}
            </div>
          </section>

          {/* Card 5: База знаний из файлов */}
          <KnowledgeBaseDocumentsCard
            documents={formData.knowledgeDocuments || []}
            onChange={(docs) => {
              setFormData((prev) => ({ ...prev, knowledgeDocuments: docs }));
            }}
          />

          {/* Card 6: Дополнительные правила (Native <details> disclosure) */}
          <details className="group border border-slate-200/90 rounded-2xl bg-white overflow-hidden shadow-xs">
            <summary className="list-none cursor-pointer p-4 flex items-center justify-between text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>Дополнительные правила разговора (необязательно)</span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 transition-transform group-open:rotate-180" />
            </summary>

            <div className="p-5 pt-3 border-t border-slate-100 space-y-3 bg-slate-50/40">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <FieldLabel
                    htmlFor="agent-system-prompt"
                    label="Подробная инструкция поведения бота"
                    optionalText={isCustomPrompt ? 'своя / ИИ-редакция активна' : 'собирается автоматически'}
                    helpTitle="Что можно дописать в инструкцию"
                    helpText="Если вы редактируете этот текст вручную или нажимаете «Обновить правила разговора», ваши формулировки бережно сохранятся при нажатии «Сохранить настройки». Чтобы вернуться к стандартному шаблону, нажмите «Сбросить по шаблону»."
                    helpExample="Обязательно спроси у клиента имя, удобное время и коробку передач (МКПП или АКПП)."
                  />
                  {isCustomPrompt && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomPrompt(false);
                        setFormData((prev) => ({
                          ...prev,
                          systemPrompt: generateSystemPrompt(prev)
                        }));
                      }}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 underline mb-1"
                    >
                      Сбросить по шаблону
                    </button>
                  )}
                </div>
                <textarea
                  id="agent-system-prompt"
                  name="systemPrompt"
                  rows={6}
                  aria-describedby="agent-system-prompt-hint"
                  value={formData.systemPrompt}
                  onChange={(e) => {
                    setIsCustomPrompt(true);
                    setFormData({ ...formData, systemPrompt: e.target.value });
                  }}
                  className="w-full p-3 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 leading-relaxed focus:outline-none focus:border-blue-600"
                />
                <FieldHint id="agent-system-prompt-hint">
                  Особые пожелания к диалогу: ваши правки и улучшения нейросети не перезапишутся при сохранении.
                </FieldHint>
              </div>
            </div>
          </details>
        </div>

        {/* Right Column: Live Testing Phone */}
        <div className="lg:col-span-5 sticky top-20">
          <LiveBotTester agent={formData} onCallCompleted={onCallCompleted} />
        </div>
      </div>
    </form>
  );
};
