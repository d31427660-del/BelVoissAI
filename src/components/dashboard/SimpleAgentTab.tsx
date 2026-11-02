import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircleIcon as CheckCircle2,
  DisketteIcon as Save,
  VolumeLoudIcon as Volume2,
  PlayIcon as Play,
  PauseIcon as Pause,
  CalendarMarkIcon as CalendarIcon,
  ShieldCheckIcon as ShieldCheck,
  Tuning2Icon as Sliders,
  AltArrowDownIcon as ChevronDown,
  AltArrowUpIcon as ChevronUp,
  MapPointIcon as MapPin,
  Buildings2Icon as Building,
  SoundwaveCircleIcon as Radio,
  MagicWand3Icon as Sparkles
} from '@solar-icons/react/bold-duotone';
import { AgentConfig, BusinessNiche, VoiceId } from '../../types';
import { NICHE_TEMPLATES } from '../../lib/mockData';
import { generateSystemPrompt } from '../../lib/vapiService';
import { requestAiPromptImprovement } from '../../lib/botDialogueEngine';
import { VoiceSimulator } from '../../lib/speechSynth';
import { LiveBotTester } from './LiveBotTester';

interface SimpleAgentTabProps {
  agent: AgentConfig;
  onSaveAgent: (agent: AgentConfig) => void;
}

export const SimpleAgentTab: React.FC<SimpleAgentTabProps> = ({
  agent,
  onSaveAgent
}) => {
  const [formData, setFormData] = useState<AgentConfig>(agent);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [promptGenStatus, setPromptGenStatus] = useState<string | null>(null);

  const niches: Array<{ id: BusinessNiche; label: string; desc: string; icon: string }> = [
    { id: 'auto_service', label: 'Автосервис (СТО)', desc: 'Запись на подъемник, диагностика, шиномонтаж', icon: '🚗' },
    { id: 'beauty_salon', label: 'Салон красоты', desc: 'Запись на маникюр, стрижку, окрашивание', icon: '💇‍♀️' },
    { id: 'driving_school', label: 'Автошкола', desc: 'Набор в группы категории B, теория, вождение', icon: '🚦' },
    { id: 'medical_clinic', label: 'Стоматология', desc: 'Консультации, острая боль, снимки КЛКТ', icon: '🦷' }
  ];

  const handleSelectNiche = (niche: BusinessNiche) => {
    const tmpl = NICHE_TEMPLATES[niche];
    const updated: AgentConfig = {
      ...formData,
      niche,
      companyName: tmpl.companyName,
      city: tmpl.city,
      address: tmpl.address,
      phone: tmpl.phone,
      workingHours: tmpl.workingHours,
      pricingAndServices: tmpl.pricingAndServices,
      knowledgeBase: tmpl.knowledgeBase,
      firstMessage: tmpl.firstMessage
    };
    updated.systemPrompt = generateSystemPrompt(updated);
    setFormData(updated);
  };

  const handlePlayVoiceSample = (voice: VoiceId) => {
    if (isPlayingVoice) {
      VoiceSimulator.stop();
      setIsPlayingVoice(false);
      return;
    }

    const phrase = voice === 'dmitry'
      ? 'Добрый день! Автосервис Минск-Моторс, мастер Дмитрий. Чем могу помочь вашему авто?'
      : 'Здравствуйте! Я ваш голосовой администратор Анна. С радостью помогу вам записаться!';

    VoiceSimulator.speak(
      phrase,
      voice,
      () => setIsPlayingVoice(true),
      () => setIsPlayingVoice(false)
    );
  };

  const handleGenerateAiPrompt = async () => {
    setIsGeneratingPrompt(true);
    setPromptGenStatus(null);
    setShowAdvanced(true);

    const result = await requestAiPromptImprovement(formData);
    setIsGeneratingPrompt(false);

    if (result?.systemPrompt) {
      setFormData((prev) => ({
        ...prev,
        systemPrompt: result.systemPrompt,
      }));
      setPromptGenStatus('Системный скрипт успешно сгенерирован через YandexGPT Lite.');
    } else {
      const localPrompt = generateSystemPrompt(formData);
      setFormData((prev) => ({
        ...prev,
        systemPrompt: localPrompt,
      }));
      setPromptGenStatus('Сформирован базовый шаблон скрипта (добавьте YANDEX_FOLDER_ID для генерации через YandexGPT).');
    }
  };

  const handleSave = () => {
    const finalized = {
      ...formData,
      systemPrompt: formData.systemPrompt?.trim()
        ? formData.systemPrompt
        : generateSystemPrompt(formData),
      updatedAt: new Date().toISOString()
    };
    onSaveAgent(finalized);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2800);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Top Header with Save button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Настройка голосового ассистента
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Все параметры уже адаптированы под бизнес в Беларуси. Измените только то, что нужно.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-2.5 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>Сохранить настройки</span>
        </button>
      </div>

      {/* Save Success Alert */}
      <AnimatePresence>
        {savedSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Настройки успешно сохранены! Ассистент готов принимать звонки по новым данным.</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Form: Clean, 1-Screen Settings */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Card 1: Ниша бизнеса */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
            <label className="block text-xs font-bold text-slate-900">
              1. Сфера вашего бизнеса:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {niches.map((n) => {
                const isSelected = formData.niche === n.id;
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleSelectNiche(n.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/80 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span className="text-xl shrink-0 mt-0.5">{n.icon}</span>
                    <div className="min-w-0">
                      <div className={`text-xs font-bold truncate ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                        {n.label}
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {n.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 2: Выбор голоса */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-900">
                2. Голос ассистента:
              </label>
              <span className="text-[11px] text-slate-400">Естественная русская речь без пауз</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'anna' as const, name: 'Анна', desc: 'Теплый, заботливый женский голос' },
                { id: 'dmitry' as const, name: 'Дмитрий', desc: 'Уверенный экспертный мужской голос' }
              ].map((v) => {
                const isSelected = formData.voice === v.id;
                return (
                  <div
                    key={v.id}
                    onClick={() => setFormData({ ...formData, voice: v.id })}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/80 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{v.name}</span>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-blue-600" />}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{v.desc}</p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData({ ...formData, voice: v.id });
                        handlePlayVoiceSample(v.id);
                      }}
                      className="px-2.5 py-1 rounded-md bg-white hover:bg-slate-50 text-blue-600 border border-slate-200 text-[11px] font-semibold flex items-center gap-1 self-start transition-colors"
                    >
                      <Play className="w-3 h-3" />
                      <span>Послушать</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 3: Название компании и телефон для перевода */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3.5">
            <label className="block text-xs font-bold text-slate-900">
              3. Данные компании и связь:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Название вашей организации:
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="напр. СТО Минск-Моторс"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Номер для перевода звонка (мастер/админ):
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+375 (29) 112-44-55"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Адрес и ориентир (город, метро, улица):
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="г. Минск, ул. Тимирязева, 121"
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* Card 4: Прайс-лист в BYN (Кратко и понятно) */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-900">
                4. Прайс-лист и основные услуги (в BYN):
              </label>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                Цены строго в BYN
              </span>
            </div>

            <textarea
              rows={4}
              value={formData.pricingAndServices}
              onChange={(e) => setFormData({ ...formData, pricingAndServices: e.target.value })}
              className="w-full p-3 rounded-lg bg-white border border-slate-300 text-xs font-mono text-slate-800 leading-relaxed focus:outline-none focus:border-blue-600"
            />

            <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleGenerateAiPrompt}
                disabled={isGeneratingPrompt}
                className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Сгенерировать скрипт с YandexGPT</span>
              </button>
              {isGeneratingPrompt && (
                <progress
                  aria-label="Генерация скрипта через YandexGPT"
                  className="w-28 h-1.5 rounded-full overflow-hidden accent-indigo-600"
                />
              )}
            </div>
          </div>

          {/* Card 5: Скрытые расширенные настройки (для инженеров) */}
          <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full p-4 text-left flex items-center justify-between text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-slate-400" />
                <span>⚙️ Дополнительные настройки (системный промпт ИИ)</span>
              </div>
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAdvanced && (
              <div className="p-4 pt-0 border-t border-slate-100 space-y-3 text-xs bg-slate-50/50">
                {promptGenStatus && (
                  <div
                    role="status"
                    aria-live="polite"
                    className="mt-3 p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-[11px] font-medium"
                  >
                    {promptGenStatus}
                  </div>
                )}
                <div className="pt-2">
                  <label htmlFor="agent-system-prompt" className="block text-[11px] font-medium text-slate-600 mb-1">
                    Системный промпт ИИ-администратора:
                  </label>
                  <textarea
                    id="agent-system-prompt"
                    rows={6}
                    value={formData.systemPrompt}
                    onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-white border border-slate-300 font-mono text-[11px] text-slate-800"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Словарь ударений улиц Минска (Победителей, Притыцкого, Немига) и маскирование ПДн активны по умолчанию.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Live Testing Phone (Interactive) */}
        <div className="lg:col-span-5 sticky top-6">
          <LiveBotTester agent={formData} />
        </div>

      </div>

    </div>
  );
};
