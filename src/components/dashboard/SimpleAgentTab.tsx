import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircleIcon as CheckCircle2,
  DisketteIcon as Save,
  PlayIcon as Play,
  PauseIcon as Pause,
  AltArrowDownIcon as ChevronDown,
  MagicWand3Icon as Sparkles,
  Buildings2Icon as Briefcase,
  PhoneCallingRoundedIcon as Phone,
  CloseCircleIcon as X,
  ClockCircleIcon as Clock,
  MapPointIcon as MapPin
} from '@solar-icons/react/bold-duotone';
import { AgentConfig, VoiceId, CallLog } from '../../types';
import { generateSystemPrompt } from '../../lib/vapiService';
import { requestAiPromptImprovement, adaptGreetingForVoice } from '../../lib/botDialogueEngine';
import { VoiceSimulator } from '../../lib/speechSynth';
import { LiveBotTester } from './LiveBotTester';
import { FieldLabel, FieldHint } from './FieldHelp';

interface SimpleAgentTabProps {
  agent: AgentConfig;
  onSaveAgent: (agent: AgentConfig) => void;
  onCallCompleted?: (log: CallLog) => void;
}

interface ServiceItem {
  id: string;
  name: string;
  price: string;
}

function parsePricing(raw: string): ServiceItem[] {
  if (!raw?.trim()) return [];
  const lines = raw.split('\n').filter((l) => l.trim().length > 0);
  return lines.map((line, idx) => {
    const cleaned = line.replace(/^\d+[\.\)]\s*/, '').trim();
    const match = cleaned.match(/^(.*?)(?::|—|-)\s*(\d+(?:[\.,]\d+)?)\s*(?:BYN|руб|byn)?/i);
    if (match) {
      return {
        id: `svc-${idx}-${Date.now()}`,
        name: match[1].trim(),
        price: match[2].trim()
      };
    }
    return {
      id: `svc-${idx}-${Date.now()}`,
      name: cleaned,
      price: ''
    };
  });
}

function serializePricing(items: ServiceItem[]): string {
  return items
    .filter((i) => i.name.trim().length > 0)
    .map((item, idx) => {
      const priceStr = item.price.trim() ? `: ${item.price.trim()} BYN` : '';
      return `${idx + 1}. ${item.name.trim()}${priceStr}`;
    })
    .join('\n');
}

export const SimpleAgentTab: React.FC<SimpleAgentTabProps> = ({
  agent,
  onSaveAgent,
  onCallCompleted
}) => {
  const [formData, setFormData] = useState<AgentConfig>(agent);
  const [services, setServices] = useState<ServiceItem[]>(() =>
    parsePricing(agent.pricingAndServices)
  );
  const [isCustomPrompt, setIsCustomPrompt] = useState<boolean>(() => {
    if (!agent.systemPrompt?.trim()) return false;
    return agent.systemPrompt.trim() !== generateSystemPrompt(agent).trim();
  });
  const [playingVoiceId, setPlayingVoiceId] = useState<VoiceId | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isTesterOpen, setIsTesterOpen] = useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [promptGenStatus, setPromptGenStatus] = useState<string | null>(null);

  useEffect(() => {
    setFormData(agent);
    setServices(parsePricing(agent.pricingAndServices));
    setIsCustomPrompt(
      Boolean(agent.systemPrompt?.trim() && agent.systemPrompt.trim() !== generateSystemPrompt(agent).trim())
    );
  }, [agent]);

  useEffect(() => {
    return () => {
      VoiceSimulator.stop();
    };
  }, []);

  const getVoiceDisplayName = (voice: VoiceId): string => {
    return voice === 'maxim' ? 'Максим' : 'Анна';
  };

  const handleBusinessActivityChange = (val: string) => {
    const updated: AgentConfig = {
      ...formData,
      niche: 'custom',
      businessActivity: val,
      updatedAt: new Date().toISOString()
    };
    if (!isCustomPrompt) {
      updated.systemPrompt = generateSystemPrompt(updated);
    }
    setFormData(updated);
  };

  const handleSelectVoice = (voice: VoiceId) => {
    const voiceLabel = getVoiceDisplayName(voice);
    const defaultGreeting = `Здравствуйте! Вас приветствует компания. Меня зовут ${voiceLabel}. Разговор записывается в целях контроля качества. Чтобы переключиться на менеджера, скажите «соедините с менеджером». Чем могу вам помочь?`;
    const updated: AgentConfig = {
      ...formData,
      voice,
      name: `${voiceLabel} — ${formData.companyName || 'Голосовой ассистент'}`,
      firstMessage: adaptGreetingForVoice(
        formData.firstMessage || defaultGreeting,
        voice,
        formData.companyName,
        formData.companyName
      )
    };
    setFormData(updated);
    onSaveAgent(updated);
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
        ? `Добрый день! ${formData.companyName || 'Компания'}, специалист Максим. Подскажу по услугам и ценам.`
        : `Здравствуйте! ${formData.companyName || 'Компания'}, меня зовут Анна. С радостью подскажу вам цены и запишу на удобное время!`;

    VoiceSimulator.speak(
      phrase,
      voice,
      () => setPlayingVoiceId(voice),
      () => setPlayingVoiceId(null)
    );
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

  // Service Management
  const handleAddService = () => {
    const newItem: ServiceItem = {
      id: `svc-${Date.now()}`,
      name: '',
      price: ''
    };
    const nextServices = [...services, newItem];
    setServices(nextServices);
    setFormData({
      ...formData,
      pricingAndServices: serializePricing(nextServices)
    });
  };

  const handleUpdateService = (id: string, field: 'name' | 'price', value: string) => {
    const nextServices = services.map((s) => (s.id === id ? { ...s, [field]: value } : s));
    setServices(nextServices);
    setFormData({
      ...formData,
      pricingAndServices: serializePricing(nextServices)
    });
  };

  const handleRemoveService = (id: string) => {
    const nextServices = services.filter((s) => s.id !== id);
    setServices(nextServices);
    setFormData({
      ...formData,
      pricingAndServices: serializePricing(nextServices)
    });
  };

  const handleClearServices = () => {
    setServices([]);
    setFormData({
      ...formData,
      pricingAndServices: ''
    });
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
      setPromptGenStatus('Правила разговора успешно улучшены нейросетью!');
    } else {
      const localPrompt = generateSystemPrompt(formData);
      setIsCustomPrompt(false);
      setFormData((prev) => ({
        ...prev,
        systemPrompt: localPrompt
      }));
      setPromptGenStatus('Правила пересобраны по вашему прайс-листу и графику.');
    }
    setTimeout(() => setPromptGenStatus(null), 4000);
  };

  const handleSave = (e?: React.FormEvent) => {
    e?.preventDefault();
    const serializedPricing = serializePricing(services);
    const nextSystemPrompt =
      isCustomPrompt && formData.systemPrompt?.trim()
        ? formData.systemPrompt.trim()
        : generateSystemPrompt({ ...formData, pricingAndServices: serializedPricing });

    const finalized: AgentConfig = {
      ...formData,
      pricingAndServices: serializedPricing,
      systemPrompt: nextSystemPrompt,
      updatedAt: new Date().toISOString()
    };

    setFormData(finalized);
    onSaveAgent(finalized);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const schedulePresets = [
    'Пн-Пт: 09:00 - 18:00, Сб-Вс: выходной',
    'Пн-Сб: 09:00 - 20:00, Вс: 10:00 - 16:00',
    'Ежедневно: 08:30 - 20:30 без обеда'
  ];

  return (
    <form id="active-workspace-form" onSubmit={handleSave} className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/[0.08]">
        <div>
          <h2 className="text-xl font-medium text-black tracking-tight">
            Настройка голосового бота
          </h2>
          <p className="text-xs text-[#777169] mt-0.5">
            Укажите информацию о компании, голос и цены — бот сразу начнёт отвечать клиентам
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Test bot button */}
          <button
            type="button"
            onClick={() => setIsTesterOpen(true)}
            className="px-4 py-2.5 rounded-[12px] bg-white hover:bg-black/[0.04] text-black border border-black/[0.12] text-xs font-medium inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Phone className="w-4 h-4 text-emerald-600" />
            <span>Проверить диалог (тест)</span>
          </button>

          {/* Save button */}
          <button
            type="submit"
            className="liquid-glass-btn-primary px-5 py-2.5 rounded-[12px] text-xs font-medium text-white flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Сохранить настройки</span>
          </button>
        </div>
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
            className="p-3.5 rounded-[12px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Настройки бота успешно сохранены! Изменения уже вступили в силу.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SECTION 1: О вашей компании */}
      <div className="p-5 sm:p-6 rounded-[16px] liquid-glass-card space-y-5">
        <div>
          <h3 className="text-sm font-medium text-black">
            1. О вашей компании
          </h3>
          <p className="text-xs text-[#777169] mt-0.5">
            Бот будет использовать эти данные при ответах на вопросы клиентов
          </p>
        </div>

        {/* Сфера бизнеса / Чем занимается компания */}
        <div>
          <FieldLabel
            htmlFor="business-activity"
            label="Сфера бизнеса и деятельность компании"
            required
            helpTitle="Сфера бизнеса вашей компании"
            helpText="Напишите своими словами, чем занимается компания (любая сфера: аренда спецтехники, грузоперевозки, отделка помещений, юруслуги, доставка еды, авторемонт, медицинские услуги, торговля и др.). Бот обучается специфике вашей деятельности и будет консультировать клиентов без шаблонных ограничений."
            helpExample="Аренда автовышек и строительной техники&#10;Доставка суши и пиццы&#10;Ремонт и отделка квартир под ключ&#10;Юридические услуги для бизнеса&#10;Оптовая продажа автозапчастей"
          />
          <input
            id="business-activity"
            type="text"
            value={formData.businessActivity || ''}
            onChange={(e) => handleBusinessActivityChange(e.target.value)}
            placeholder="Например: Аренда спецтехники / Юридические услуги / Ремонт квартир"
            className="w-full px-3 py-2.5 rounded-[8px] bg-white border border-black/[0.12] text-xs text-black focus:outline-none focus:border-black transition-colors"
          />
          <p className="text-[10px] text-[#777169] mt-1">
            Любое направление бизнеса: бот подстраивается под специфику вашей сферы без жестких шаблонов.
          </p>
        </div>

        {/* Название и Телефон */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel
              htmlFor="company-name"
              label="Название компании"
              required
              helpTitle="Как написать название компании"
              helpText="Напишите понятное на слух название без «ООО», «ЗАО» и «УНП». Как только вы измените название здесь, оно автоматически обновится и в приветствии бота."
              helpExample="СпецТрансГрупп&#10;Юрист Консалт&#10;Минск Ремонт"
            />
            <input
              id="company-name"
              type="text"
              required
              value={formData.companyName}
              onChange={(e) => handleCompanyNameChange(e.target.value)}
              placeholder="Название вашей компании"
              className="w-full px-3 py-2 rounded-[8px] bg-white border border-black/[0.12] text-xs text-black focus:outline-none focus:border-black"
            />
            <p className="text-[10px] text-[#777169] mt-1">
              Бот произнесет это название в начале разговора.
            </p>
          </div>

          <div>
            <FieldLabel
              htmlFor="company-phone"
              label="Контактный телефон компании"
              helpTitle="Телефон компании"
              helpText="Укажите номер телефона вашей организации в Беларуси (+375). Бот озвучит этот номер, если клиент спросит, как связаться с офисом."
              helpExample="+375 (29) 112-44-55"
            />
            <input
              id="company-phone"
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+375 (29) 112-44-55"
              className="w-full px-3 py-2 rounded-[8px] bg-white border border-black/[0.12] text-xs text-black font-mono focus:outline-none focus:border-black"
            />
            <p className="text-[10px] text-[#777169] mt-1">
              Номер, который бот при необходимости озвучит клиенту.
            </p>
          </div>
        </div>

        {/* Город и Адрес */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <FieldLabel
              htmlFor="company-city"
              label="Город"
              helpTitle="Город обслуживания"
              helpText="Город, в котором находится компания или филиал (Минск, Брест, Гродно и др.)."
              helpExample="Минск"
            />
            <input
              id="company-city"
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Минск"
              className="w-full px-3 py-2 rounded-[8px] bg-white border border-black/[0.12] text-xs text-black focus:outline-none focus:border-black"
            />
          </div>

          <div className="sm:col-span-2">
            <FieldLabel
              htmlFor="company-address"
              label="Точный адрес (улица, дом, метро / ориентир)"
              helpTitle="Как указать адрес для бота"
              helpText="Укажите точный адрес с ориентиром или ближайшей станцией метро. Бот подробно подскажет клиенту, как проехать, где припарковаться и какой вход."
              helpExample="г. Минск, ул. Тимирязева, 121 (ст.м. Пушкинская, въезд со двора)"
            />
            <input
              id="company-address"
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="ул. Тимирязева, 121 (район Ждановичи)"
              className="w-full px-3 py-2 rounded-[8px] bg-white border border-black/[0.12] text-xs text-black focus:outline-none focus:border-black"
            />
          </div>
        </div>

        {/* График работы */}
        <div className="space-y-2">
          <FieldLabel
            htmlFor="company-hours"
            label="График работы компании"
            helpTitle="Как указать график работы"
            helpText="Укажите рабочие дни и часы, а также выходные. Бот проверяет этот график, когда предлагает клиенту записаться на приём или визит."
            helpExample="Пн-Пт: 09:00 - 20:00, Сб: 10:00 - 16:00, Вс: выходной"
          />
          <input
            id="company-hours"
            type="text"
            value={formData.workingHours}
            onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
            placeholder="Пн-Пт: 09:00 - 18:00, Сб-Вс: выходной"
            className="w-full px-3 py-2 rounded-[8px] bg-white border border-black/[0.12] text-xs text-black focus:outline-none focus:border-black"
          />

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] text-[#777169]">Быстрый выбор:</span>
            {schedulePresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setFormData({ ...formData, workingHours: preset })}
                className="text-[10px] px-2 py-0.5 rounded-[6px] bg-black/[0.04] hover:bg-black/[0.08] text-black transition-colors cursor-pointer"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 2: Голос и приветствие */}
      <div className="p-5 sm:p-6 rounded-[16px] liquid-glass-card space-y-5">
        <div>
          <h3 className="text-sm font-medium text-black">
            2. Голос и первое сообщение бота
          </h3>
          <p className="text-xs text-[#777169] mt-0.5">
            Выберите, как бот звучит и какими словами открывает диалог
          </p>
        </div>

        {/* Выбор голоса */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { id: 'anna' as const, name: 'Анна (женский)', desc: 'Доброжелательный, приветливый голос администратора' },
            { id: 'maxim' as const, name: 'Максим (мужской)', desc: 'Спокойный, уверенный голос мастера-консультанта' }
          ].map((v) => {
            const isSelected = formData.voice === v.id;
            const isPlayingThis = playingVoiceId === v.id;
            return (
              <div
                key={v.id}
                className={`p-4 rounded-[12px] border transition-all flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'bg-black text-white border-black shadow-xs'
                    : 'liquid-glass-cream text-black border-black/[0.06] hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold">{v.name}</div>
                    <div className={`text-[11px] mt-0.5 ${isSelected ? 'text-white/70' : 'text-[#777169]'}`}>
                      {v.desc}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectVoice(v.id)}
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 cursor-pointer ${
                      isSelected ? 'border-white bg-white' : 'border-black/30'
                    }`}
                  >
                    {isSelected && <span className="w-2 h-2 rounded-full bg-black" />}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectVoice(v.id);
                      handlePlayVoiceSample(v.id);
                    }}
                    className={`px-3 py-1.5 rounded-[8px] text-[11px] font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                        : 'bg-white hover:bg-black/[0.04] text-black border border-black/[0.1]'
                    }`}
                  >
                    {isPlayingThis ? <Pause className="w-3 h-3 text-emerald-400" /> : <Play className="w-3 h-3" />}
                    <span>{isPlayingThis ? 'Остановить' : 'Послушать голос'}</span>
                  </button>

                  <span className={`text-[10px] ${isSelected ? 'text-emerald-300' : 'text-transparent'}`}>
                    Выбран для звонков
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Первое сообщение */}
        <div>
          <FieldLabel
            htmlFor="first-message"
            label="Приветствие бота (первая фраза при звонке)"
            helpTitle="Как составить первое сообщение"
            helpText="Первая фраза, которую услышит клиент при звонке. Рекомендуем поздороваться, назвать компанию, имя бота и задать открытый вопрос («Чем могу помочь?»). Предупреждение о записи разговора добавляется автоматически согласно Закону РБ 99-З."
            helpExample="Здравствуйте! Вас приветствует компания, меня зовут Анна. Разговор записывается. Чем могу вам помочь?"
          />
          <textarea
            id="first-message"
            rows={2}
            value={formData.firstMessage}
            onChange={(e) => setFormData({ ...formData, firstMessage: e.target.value })}
            placeholder="Здравствуйте! Компания..., меня зовут Анна..."
            className="w-full px-3 py-2 rounded-[8px] bg-white border border-black/[0.12] text-xs text-black leading-relaxed focus:outline-none focus:border-black"
          />
          <p className="text-[10px] text-[#777169] mt-1">
            Автоматически синхронизируется с именем компании и выбранным голосом.
          </p>
        </div>
      </div>

      {/* SECTION 3: Услуги и цены */}
      <div className="p-5 sm:p-6 rounded-[16px] liquid-glass-card space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-black/[0.06]">
          <div>
            <h3 className="text-sm font-medium text-black">
              3. Услуги и цены (в BYN)
            </h3>
            <p className="text-xs text-[#777169] mt-0.5">
              Бот точно знает цены из этого списка и озвучивает их клиентам
            </p>
          </div>

          {services.length > 0 && (
            <button
              type="button"
              onClick={handleClearServices}
              className="text-[11px] text-[#777169] hover:text-black underline cursor-pointer"
            >
              Очистить список
            </button>
          )}
        </div>

        {/* Services List */}
        <div className="space-y-2">
          {services.map((item, idx) => (
            <div
              key={item.id}
              className="flex items-center gap-2 p-2 rounded-[8px] bg-white border border-black/[0.08]"
            >
              <span className="text-[11px] font-mono text-[#777169] w-5 text-center shrink-0">
                {idx + 1}.
              </span>
              <input
                type="text"
                value={item.name}
                onChange={(e) => handleUpdateService(item.id, 'name', e.target.value)}
                placeholder="Название услуги (напр. Замена масла)"
                className="flex-1 px-2.5 py-1.5 text-xs text-black bg-transparent border-0 focus:outline-none"
              />
              <div className="flex items-center gap-1.5 shrink-0">
                <input
                  type="text"
                  value={item.price}
                  onChange={(e) => handleUpdateService(item.id, 'price', e.target.value)}
                  placeholder="Цена"
                  className="w-16 px-2 py-1.5 text-xs text-black font-mono text-right bg-black/[0.03] rounded border border-black/[0.08] focus:outline-none"
                />
                <span className="text-[10px] font-medium text-[#777169]">BYN</span>
                <button
                  type="button"
                  onClick={() => handleRemoveService(item.id)}
                  className="p-1 text-[#777169] hover:text-rose-600 cursor-pointer ml-1"
                  title="Удалить услугу"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAddService}
          className="w-full py-2 rounded-[8px] border border-dashed border-black/[0.2] hover:border-black/40 text-black text-xs font-medium transition-colors cursor-pointer"
        >
          + Добавить услугу
        </button>
      </div>

      {/* SECTION 4: Продвинутые правила диалога (Disclosure) */}
      <details className="group rounded-[16px] liquid-glass-card overflow-hidden">
        <summary className="p-4 sm:p-5 flex items-center justify-between text-xs font-medium text-black hover:bg-black/[0.02] cursor-pointer list-none transition-colors">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Продвинутые инструкции для бота (необязательно)</span>
          </div>
          <ChevronDown className="w-4 h-4 text-[#777169] transition-transform group-open:rotate-180" />
        </summary>

        <div className="p-5 pt-3 border-t border-black/[0.06] space-y-3 liquid-glass-cream">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <FieldLabel
              htmlFor="system-prompt"
              label="Продвинутая инструкция поведения бота"
              optionalText={isCustomPrompt ? 'своя редакция' : 'собирается автоматически'}
              helpTitle="Что можно дописать в инструкцию"
              helpText="Здесь вы можете описать любые особые правила вашей компании: например, «всегда спрашивай марку автомобиля» или «предлагай чай/кофе при записи». Бот строго следует этим указаниям."
              helpExample="Обязательно спроси у клиента марку машины и удобное время записи."
            />
            <button
              type="button"
              onClick={handleGenerateAiPrompt}
              disabled={isGeneratingPrompt}
              className="text-[11px] font-medium text-blue-600 hover:text-blue-800 underline disabled:opacity-50 cursor-pointer"
            >
              {isGeneratingPrompt ? 'Обновляем правила...' : 'Улучшить правила разговора через ИИ'}
            </button>
          </div>

          <textarea
            id="system-prompt"
            rows={5}
            value={formData.systemPrompt}
            onChange={(e) => {
              setIsCustomPrompt(true);
              setFormData({ ...formData, systemPrompt: e.target.value });
            }}
            placeholder="Инструкция для ИИ..."
            className="w-full p-3 rounded-[8px] bg-white border border-black/[0.12] text-xs text-black font-mono leading-relaxed focus:outline-none focus:border-black"
          />

          {promptGenStatus && (
            <p className="text-[11px] text-emerald-700 font-medium">
              {promptGenStatus}
            </p>
          )}
        </div>
      </details>

      {/* MODAL / SLIDE-OVER: Проверка бота голосом */}
      <AnimatePresence>
        {isTesterOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[20px] bg-white p-5 shadow-2xl border border-black/[0.1]"
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-black/[0.08]">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-semibold text-black">
                    Проверка бота: {formData.companyName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTesterOpen(false)}
                  className="p-1 rounded-full text-[#777169] hover:text-black cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <LiveBotTester
                agent={formData}
                onCallCompleted={(log) => {
                  onCallCompleted?.(log);
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </form>
  );
};
