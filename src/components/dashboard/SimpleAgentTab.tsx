import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DisketteIcon as Save,
  PlayIcon as Play,
  PauseIcon as Pause,
  AltArrowDownIcon as ChevronDown,
  MagicWand3Icon as Sparkles,
  Buildings2Icon as Briefcase,
  PhoneCallingRoundedIcon as Phone,
  CloseCircleIcon as X
} from '@solar-icons/react/bold-duotone';
import { AgentConfig, VoiceId, CallLog } from '../../types';
import { generateSystemPrompt } from '../../lib/vapiService';
import { requestAiPromptImprovement, adaptGreetingForVoice, isMockCompanyOrTest } from '../../lib/botDialogueEngine';
import { VoiceSimulator } from '../../lib/speechSynth';
import { LiveBotTester } from './LiveBotTester';
import { FieldLabel } from './FieldHelp';

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

const INPUT_CLASS =
  'w-full px-4 py-2.5 min-h-[42px] rounded-[12px] bg-[#F5F5F5] focus:bg-white border border-black/[0.08] focus:border-black text-[13px] text-black placeholder:text-[#A3A3A3] focus:outline-none transition-colors';

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
  const [isTesterOpen, setIsTesterOpen] = useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [promptGenStatus, setPromptGenStatus] = useState<string | null>(null);

  useEffect(() => {
    const isDemo = isMockCompanyOrTest(agent.companyName);
    const cleanCompany = isDemo ? '' : agent.companyName;
    const cleanAddress = isDemo && agent.address?.includes('Сурганова') ? '' : (agent.address || '');
    const cleanPhone =
      isDemo && (agent.phone === '+375 (29) 112-44-55' || agent.phone === '+375 (29) 700-11-22')
        ? ''
        : (agent.phone || '');
    const cleanPricing =
      isDemo && agent.pricingAndServices?.includes('категории "B"') ? '' : (agent.pricingAndServices || '');
    const cleanKnowledge =
      isDemo && agent.knowledgeBase?.includes('Volkswagen Polo') ? '' : (agent.knowledgeBase || '');
    const voiceLabel = agent.voice === 'maxim' ? 'Максим' : 'Анна';
    const cleanName = `${voiceLabel} — ${cleanCompany || 'Голосовой ассистент'}`;
    const companyGreeting = cleanCompany ? `компания «${cleanCompany}»` : 'наша компания';
    const cleanFirstMessage =
      agent.firstMessage && !isMockCompanyOrTest(agent.firstMessage)
        ? agent.firstMessage
        : `Здравствуйте! Вас приветствует ${companyGreeting}. Меня зовут ${voiceLabel}. Разговор записывается в целях контроля качества. Чтобы переключиться на менеджера, скажите «соедините с менеджером». Чем могу вам помочь?`;

    const cleanedAgent: AgentConfig = {
      ...agent,
      companyName: cleanCompany,
      name: cleanName,
      address: cleanAddress,
      phone: cleanPhone,
      pricingAndServices: cleanPricing,
      knowledgeBase: cleanKnowledge,
      firstMessage: cleanFirstMessage
    };
    setFormData(cleanedAgent);
    setServices(parsePricing(cleanPricing));
    setIsCustomPrompt(
      Boolean(agent.systemPrompt?.trim() && agent.systemPrompt.trim() !== generateSystemPrompt(cleanedAgent).trim())
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

  const [validationError, setValidationError] = useState<string | null>(null);

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
      setPromptGenStatus('Сервер ИИ временно недоступен — правила пересобраны локально по вашему прайс-листу и графику.');
    }
    setTimeout(() => setPromptGenStatus(null), 5000);
  };

  const handleSave = (e?: React.FormEvent) => {
    e?.preventDefault();
    setValidationError(null);

    if (!formData.companyName.trim()) {
      setValidationError('Укажите название вашей компании или ИП.');
      return;
    }
    if (!formData.businessActivity?.trim()) {
      setValidationError('Заполните обязательное поле «Сфера бизнеса и деятельность компании».');
      return;
    }

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
  };

  const schedulePresets = [
    'Пн-Пт: 09:00 - 18:00, Сб-Вс: выходной',
    'Пн-Сб: 09:00 - 20:00, Вс: 10:00 - 16:00',
    'Ежедневно: 08:30 - 20:30 без обеда'
  ];

  return (
    <>
      <form id="active-workspace-form" onSubmit={handleSave} className="space-y-6">
        {/* Editorial mono eyebrow rule */}
        <div className="flex items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#737373]">
            <span className="w-1.5 h-1.5 rounded-full bg-black" />
            <span>Обучение ИИ · Профиль компании</span>
          </div>
          <div className="hidden sm:block h-px flex-1 bg-black/[0.08]" />
          <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#737373]">
            4 РАЗДЕЛА
          </span>
        </div>

        {/* Top Dotted Obsidian Header */}
        <div className="voxi-dot-surface p-6 sm:p-8 rounded-[28px] text-white border border-black flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 font-mono text-[10.5px] uppercase tracking-[0.1em] text-[#6BFF91]">
              <Briefcase className="w-3.5 h-3.5" />
              <span>Обучение ИИ под ваш бизнес</span>
            </div>
            <h1 className="font-display text-2xl sm:text-[30px] font-bold tracking-[-0.035em] leading-[1.1] text-white">
              Настройка голосового бота
            </h1>
            <p className="text-[13px] text-white/70 max-w-xl">
              Укажите информацию о компании, голос и прайс в BYN — бот сразу начнёт отвечать клиентам по вашим правилам.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center shrink-0">
            <button
              type="button"
              onClick={() => setIsTesterOpen(true)}
              className="h-10 px-4 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-white border border-white/15 text-[12.5px] font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Phone className="w-4 h-4 text-[#6BFF91]" />
              <span>Проверить диалог</span>
            </button>

            <button
              type="submit"
              className="h-10 px-5 rounded-full bg-[#6BFF91] hover:bg-[#52F07A] text-black text-[12.5px] font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Сохранить настройки</span>
            </button>
          </div>
        </div>

        {/* Validation Error Alert */}
        {validationError && (
          <div
            role="alert"
            className="p-4 rounded-[18px] bg-[#FFF5F3] border border-[#FE432A]/40 text-[#991B1B] text-[13px] font-semibold"
          >
            {validationError}
          </div>
        )}

        {/* SECTION 01: О вашей компании */}
        <section className="p-6 sm:p-7 rounded-[24px] bg-white border border-black/[0.08] space-y-5">
          <div className="flex items-center gap-3.5 pb-4 border-b border-black/[0.08]">
            <div className="w-9 h-9 rounded-[12px] bg-[#0A0A0A] text-[#D8E738] flex items-center justify-center font-mono font-bold text-[12px] shrink-0">
              01
            </div>
            <div>
              <h2 className="font-display text-[17px] font-bold text-black tracking-[-0.02em]">
                О вашей компании
              </h2>
              <p className="text-[12.5px] text-[#737373]">
                Бот использует эти данные, когда консультирует клиентов по телефону
              </p>
            </div>
          </div>

          {/* Сфера бизнеса */}
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
              placeholder="Например: Автосервис и шиномонтаж / Автошкола / Стоматология"
              className={INPUT_CLASS}
            />
            <p className="text-[11.5px] text-[#737373] mt-1.5">
              Любое направление бизнеса: бот подстраивается под специфику вашей сферы без жёстких шаблонов.
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
                className={INPUT_CLASS}
              />
              <p className="text-[11.5px] text-[#737373] mt-1.5">
                Бот произнесёт это название в начале разговора.
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
                className={`${INPUT_CLASS} font-mono`}
              />
              <p className="text-[11.5px] text-[#737373] mt-1.5">
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
                className={INPUT_CLASS}
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
                className={INPUT_CLASS}
              />
            </div>
          </div>

          {/* График работы */}
          <div className="space-y-2.5">
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
              className={INPUT_CLASS}
            />

            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-[#737373]">
                Шаблоны:
              </span>
              {schedulePresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setFormData({ ...formData, workingHours: preset })}
                  className="text-[11.5px] px-3 py-1 rounded-full bg-[#F5F5F5] hover:bg-black hover:text-white border border-black/[0.06] text-[#404040] font-medium transition-colors cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 02: Голос и приветствие */}
        <section className="p-6 sm:p-7 rounded-[24px] bg-white border border-black/[0.08] space-y-5">
          <div className="flex items-center gap-3.5 pb-4 border-b border-black/[0.08]">
            <div className="w-9 h-9 rounded-[12px] bg-[#0A0A0A] text-[#6BFF91] flex items-center justify-center font-mono font-bold text-[12px] shrink-0">
              02
            </div>
            <div>
              <h2 className="font-display text-[17px] font-bold text-black tracking-[-0.02em]">
                Голос и первое сообщение бота
              </h2>
              <p className="text-[12.5px] text-[#737373]">
                Выберите тембр голоса и фразу, с которой бот начинает разговор
              </p>
            </div>
          </div>

          {/* Выбор голоса */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { id: 'anna' as const, name: 'Анна · женский', desc: 'Доброжелательный, приветливый голос администратора' },
              { id: 'maxim' as const, name: 'Максим · мужской', desc: 'Спокойный, уверенный голос мастера-консультанта' }
            ].map((v) => {
              const isSelected = formData.voice === v.id;
              const isPlayingThis = playingVoiceId === v.id;
              return (
                <div
                  key={v.id}
                  className={`p-5 rounded-[20px] border transition-colors flex flex-col justify-between gap-4 ${
                    isSelected
                      ? 'bg-[#0A0A0A] text-white border-black'
                      : 'bg-[#F5F5F5] text-black border-black/[0.06] hover:bg-[#EBEBEB]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-display text-[15px] font-bold">{v.name}</div>
                      <div className={`text-[12px] mt-1 leading-snug ${isSelected ? 'text-white/65' : 'text-[#525252]'}`}>
                        {v.desc}
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label={`Выбрать голос ${v.name}`}
                      onClick={() => handleSelectVoice(v.id)}
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                        isSelected ? 'border-[#6BFF91] bg-[#6BFF91]' : 'border-black/25 bg-white'
                      }`}
                    >
                      {isSelected && <span className="w-2 h-2 rounded-full bg-black" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        handleSelectVoice(v.id);
                        handlePlayVoiceSample(v.id);
                      }}
                      className={`h-9 px-3.5 rounded-full text-[12px] font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                          : 'bg-white hover:bg-black hover:text-white text-black border border-black/[0.08]'
                      }`}
                    >
                      {isPlayingThis ? <Pause className="w-3.5 h-3.5 text-[#6BFF91]" /> : <Play className="w-3.5 h-3.5" />}
                      <span>{isPlayingThis ? 'Остановить' : 'Послушать голос'}</span>
                    </button>

                    {isSelected && (
                      <span className="font-mono text-[10.5px] uppercase tracking-[0.08em] font-bold text-[#6BFF91]">
                        ✓ Выбран
                      </span>
                    )}
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
              rows={3}
              value={formData.firstMessage}
              onChange={(e) => setFormData({ ...formData, firstMessage: e.target.value })}
              placeholder="Здравствуйте! Компания..., меня зовут Анна..."
              className="w-full px-4 py-3 rounded-[14px] bg-[#F5F5F5] focus:bg-white border border-black/[0.08] focus:border-black text-[13px] text-black leading-relaxed focus:outline-none transition-colors"
            />
            <p className="text-[11.5px] text-[#737373] mt-1.5">
              Автоматически синхронизируется с именем компании и выбранным голосом.
            </p>
          </div>
        </section>

        {/* SECTION 03: Услуги и цены */}
        <section className="p-6 sm:p-7 rounded-[24px] bg-white border border-black/[0.08] space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-black/[0.08]">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-[12px] bg-[#D8E738] text-black flex items-center justify-center font-mono font-bold text-[12px] shrink-0">
                03
              </div>
              <div>
                <h2 className="font-display text-[17px] font-bold text-black tracking-[-0.02em]">
                  Услуги и цены в BYN
                </h2>
                <p className="text-[12.5px] text-[#737373]">
                  Бот точно знает цены из этого списка и озвучивает их клиентам
                </p>
              </div>
            </div>

            {services.length > 0 && (
              <button
                type="button"
                onClick={handleClearServices}
                className="text-[12px] font-medium text-[#737373] hover:text-[#FE432A] underline underline-offset-4 cursor-pointer"
              >
                Очистить список
              </button>
            )}
          </div>

          {/* Services List */}
          <div className="space-y-2.5">
            {services.map((item, idx) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center gap-2.5 p-3 rounded-[16px] bg-[#F5F5F5] border border-black/[0.06]"
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <span className="font-mono text-[11px] font-bold text-[#737373] w-6 text-center shrink-0">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => handleUpdateService(item.id, 'name', e.target.value)}
                    placeholder="Название услуги (напр. Замена масла и фильтров)"
                    className="flex-1 px-3 py-2 text-[13px] text-black bg-white rounded-[10px] border border-black/[0.08] focus:outline-none focus:border-black"
                  />
                </div>
                <div className="flex items-center gap-2 pl-8 sm:pl-0 shrink-0">
                  <input
                    type="text"
                    value={item.price}
                    onChange={(e) => handleUpdateService(item.id, 'price', e.target.value)}
                    placeholder="0"
                    className="w-24 px-3 py-2 text-[13px] text-black font-mono font-bold text-right bg-white rounded-[10px] border border-black/[0.08] focus:outline-none focus:border-black"
                  />
                  <span className="font-mono text-[11px] font-bold text-[#525252]">BYN</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveService(item.id)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[#737373] hover:text-[#FE432A] hover:bg-white cursor-pointer transition-colors"
                    title="Удалить услугу"
                    aria-label="Удалить услугу"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddService}
            className="w-full h-11 rounded-full bg-[#F5F5F5] hover:bg-[#D8E738] border border-dashed border-black/25 hover:border-black text-black text-[12.5px] font-semibold transition-colors cursor-pointer"
          >
            + Добавить услугу в прайс-лист
          </button>
        </section>

        {/* SECTION 04: Продвинутые правила диалога (Disclosure) */}
        <details className="group rounded-[24px] bg-white border border-black/[0.08] overflow-hidden">
          <summary className="p-5 sm:p-6 flex items-center justify-between text-[13.5px] font-semibold text-black hover:bg-[#F5F5F5] cursor-pointer list-none transition-colors">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-[10px] bg-[#F5F5F5] border border-black/[0.06] flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-black" />
              </span>
              <span>Продвинутые инструкции для бота (необязательно)</span>
            </div>
            <ChevronDown className="w-4 h-4 text-[#737373] transition-transform group-open:rotate-180" />
          </summary>

          <div className="p-6 pt-4 border-t border-black/[0.08] space-y-3 bg-[#F5F5F5]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <FieldLabel
                htmlFor="system-prompt"
                label="Продвинутая инструкция поведения бота"
                optionalText={isCustomPrompt ? 'своя редакция' : 'собирается автоматически'}
                helpTitle="Что можно дописать в инструкцию"
                helpText="Здесь вы можете описать любые особые правила вашей компании: например, «всегда спрашивай марку автомобиля» или «предлагай чай/кофе при записи». Бот строго следует этим указаниям."
                helpExample="Обязательно спроси у клиента марку машины и удобное время записи."
              />
              <div className="flex items-center gap-3">
                {isCustomPrompt && (
                  <button
                    type="button"
                    onClick={() => {
                      const localPrompt = generateSystemPrompt(formData);
                      setIsCustomPrompt(false);
                      setFormData({ ...formData, systemPrompt: localPrompt });
                      setPromptGenStatus('Правила сброшены к стандартным.');
                      setTimeout(() => setPromptGenStatus(null), 3000);
                    }}
                    className="text-[11.5px] font-medium text-[#737373] hover:text-black underline underline-offset-4 cursor-pointer"
                  >
                    Сбросить к стандартным
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleGenerateAiPrompt}
                  disabled={isGeneratingPrompt}
                  className="h-8 px-3.5 rounded-full bg-black hover:bg-[#171717] text-white text-[11.5px] font-semibold disabled:opacity-50 cursor-pointer transition-colors"
                >
                  {isGeneratingPrompt ? 'Обновляем правила...' : 'Улучшить правила через ИИ'}
                </button>
              </div>
            </div>

            <textarea
              id="system-prompt"
              rows={6}
              value={formData.systemPrompt}
              onChange={(e) => {
                setIsCustomPrompt(true);
                setFormData({ ...formData, systemPrompt: e.target.value });
              }}
              placeholder="Инструкция для ИИ..."
              className="w-full p-4 rounded-[14px] bg-white border border-black/[0.1] text-[12px] text-black font-mono leading-relaxed focus:outline-none focus:border-black"
            />

            {promptGenStatus && (
              <p className="text-[12px] text-[#15803D] font-medium">
                {promptGenStatus}
              </p>
            )}
          </div>
        </details>
      </form>

      {/* MODAL: Проверка бота голосом */}
      <AnimatePresence>
        {isTesterOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Проверка бота: ${formData.companyName}`}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[24px] bg-white p-5 sm:p-6 shadow-2xl border border-black/[0.1]"
            >
              <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-black/[0.08]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-7 h-7 rounded-full bg-black text-[#6BFF91] flex items-center justify-center shrink-0">
                    <Phone className="w-3.5 h-3.5" />
                  </span>
                  <span className="font-display text-[14px] font-bold text-black truncate">
                    Проверка бота · {formData.companyName || 'Компания'}
                  </span>
                </div>
                <button
                  type="button"
                  aria-label="Закрыть проверку бота"
                  onClick={() => setIsTesterOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#737373] hover:text-black hover:bg-[#F5F5F5] cursor-pointer transition-colors"
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
    </>
  );
};
