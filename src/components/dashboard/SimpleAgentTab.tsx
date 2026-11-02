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
import { AgentConfig, BusinessNiche, VoiceId } from '../../types';
import { NICHE_TEMPLATES } from '../../lib/mockData';
import { generateSystemPrompt } from '../../lib/vapiService';
import { requestAiPromptImprovement, adaptGreetingForVoice } from '../../lib/botDialogueEngine';
import { VoiceSimulator } from '../../lib/speechSynth';
import { LiveBotTester } from './LiveBotTester';
import { FieldLabel, FieldHint } from './FieldHelp';

interface SimpleAgentTabProps {
  agent: AgentConfig;
  onSaveAgent: (agent: AgentConfig) => void;
}

export const SimpleAgentTab: React.FC<SimpleAgentTabProps> = ({
  agent,
  onSaveAgent
}) => {
  const [formData, setFormData] = useState<AgentConfig>(agent);
  const [playingVoiceId, setPlayingVoiceId] = useState<VoiceId | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [promptGenStatus, setPromptGenStatus] = useState<string | null>(null);

  useEffect(() => {
    setFormData(agent);
  }, [agent]);

  const niches: Array<{ id: BusinessNiche; label: string; desc: string; icon: string }> = [
    { id: 'auto_service', label: 'Автосервис (СТО)', desc: 'Ремонт, диагностика, ТО, шиномонтаж', icon: '🚗' },
    { id: 'beauty_salon', label: 'Салон красоты', desc: 'Маникюр, стрижки, окрашивание, уход', icon: '💇‍♀️' },
    { id: 'driving_school', label: 'Автошкола', desc: 'Категория B, группы, рассрочка, вождение', icon: '🚦' },
    { id: 'medical_clinic', label: 'Стоматология / Центр', desc: 'Приём врача, снимки, запись по острой боли', icon: '🦷' }
  ];

  const handleSelectNiche = (niche: BusinessNiche) => {
    const tmpl = NICHE_TEMPLATES[niche];
    const voiceLabel = formData.voice === 'dmitry' ? 'Дмитрий' : 'Анна';
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
      updatedAt: new Date().toISOString(),
    };
    updated.systemPrompt = generateSystemPrompt(updated);
    setFormData(updated);
    onSaveAgent(updated);
  };

  const handleSelectVoice = (voice: VoiceId) => {
    const tmpl = NICHE_TEMPLATES[formData.niche] || NICHE_TEMPLATES.driving_school;
    const voiceLabel = voice === 'dmitry' ? 'Дмитрий' : 'Анна';
    const updated: AgentConfig = {
      ...formData,
      voice,
      name: `${voiceLabel} — ${formData.companyName}`,
      firstMessage: adaptGreetingForVoice(
        formData.firstMessage || tmpl.firstMessage,
        voice,
        formData.companyName,
        formData.companyName
      ),
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
      voice === 'dmitry'
        ? 'Добрый день! Автосервис Минск-Моторс, мастер Дмитрий. Чем могу помочь вашему автомобилю?'
        : 'Здравствуйте! Я ваш голосовой администратор Анна. С радостью подскажу цены и запишу вас на удобное время.';

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
      setFormData((prev) => ({
        ...prev,
        systemPrompt: result.systemPrompt,
      }));
      setPromptGenStatus('Инструкция для бота обновлена нейросетью по вашим ценам и данным.');
    } else {
      const localPrompt = generateSystemPrompt(formData);
      setFormData((prev) => ({
        ...prev,
        systemPrompt: localPrompt,
      }));
      setPromptGenStatus('Сформирована базовая инструкция по вашим услугам и контактам.');
    }
  };

  const handleSave = (e?: React.FormEvent) => {
    e?.preventDefault();
    const finalized: AgentConfig = {
      ...formData,
      systemPrompt: formData.systemPrompt?.trim()
        ? formData.systemPrompt
        : generateSystemPrompt(formData),
      updatedAt: new Date().toISOString()
    };
    onSaveAgent(finalized);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header with Save button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Настройка голосового бота
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Заполните данные о вашей компании простыми словами. Под каждым полем есть подсказка, а справа можно сразу проверить бота.
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
            <span>Настройки сохранены! Бот уже использует новые цены, адрес и приветствие.</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form Column */}
        <div className="lg:col-span-7 space-y-5">
          {/* Card 1: Сфера бизнеса */}
          <fieldset className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <legend className="text-xs font-bold text-slate-900">
                1. Выберите сферу вашего бизнеса
              </legend>
              <span className="text-[11px] text-slate-400">Готовый шаблон</span>
            </div>

            <p id="agent-niche-hint" className="text-[11px] text-slate-500 leading-relaxed">
              При выборе сферы поля ниже заполнятся готовым примером — вы сможете заменить название, адрес и цены на свои.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" aria-describedby="agent-niche-hint">
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
                    <span className="text-xl shrink-0 mt-0.5">{n.icon}</span>
                    <div className="min-w-0">
                      <div className={`text-xs font-bold truncate ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                        {n.label}
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {n.desc}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* Card 2: Голос бота */}
          <fieldset className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
            <legend className="text-xs font-bold text-slate-900">
              2. Каким голосом бот будет общаться с клиентами
            </legend>
            <p id="agent-voice-hint" className="text-[11px] text-slate-500 leading-relaxed">
              Нажмите «Послушать пример», чтобы выбрать подходящий тембр. Имя в приветствии поменяется автоматически.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" aria-describedby="agent-voice-hint">
              {[
                { id: 'anna' as const, name: 'Анна (женский)', desc: 'Доброжелательный, мягкий голос администратора' },
                { id: 'dmitry' as const, name: 'Дмитрий (мужской)', desc: 'Спокойный, уверенный голос мастера-консультанта' }
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
          </fieldset>

          {/* Card 3: Контакты, адрес и часы работы */}
          <fieldset className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
            <legend className="text-xs font-bold text-slate-900">
              3. Основная информация о вашей компании
            </legend>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel
                  htmlFor="agent-company-name"
                  label="Название компании"
                  required
                  helpTitle="Как написать название компании"
                  helpText="Напишите название так, как оно хорошо звучит на слух по телефону. Не используйте «ООО» или «ЧУП» — лучше укажите понятное клиенту имя."
                  helpExample="Автосервис Минск-Моторс&#10;Стоматология Улыбка Плюс&#10;Салон красоты Белла"
                />
                <input
                  id="agent-company-name"
                  name="companyName"
                  type="text"
                  required
                  aria-describedby="agent-company-hint"
                  value={formData.companyName}
                  onChange={(e) => {
                    const nextCompany = e.target.value;
                    const voiceLabel = formData.voice === 'dmitry' ? 'Дмитрий' : 'Анна';
                    setFormData({
                      ...formData,
                      companyName: nextCompany,
                      name: `${voiceLabel} — ${nextCompany}`,
                    });
                  }}
                  placeholder="Напр.: Автосервис Минск-Моторс"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
                <FieldHint id="agent-company-hint">
                  Это название бот назовёт клиенту в начале разговора.
                </FieldHint>
              </div>

              <div>
                <FieldLabel
                  htmlFor="agent-transfer-phone"
                  label="Телефон сотрудника для перевода"
                  helpTitle="Зачем нужен телефон сотрудника"
                  helpText="Если клиент попросит соединить с живым человеком или задаст нестандартный вопрос, бот переключит вызов на этот мобильный или городской номер."
                  helpExample="+375 (29) 112-44-55"
                />
                <input
                  id="agent-transfer-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  aria-describedby="agent-phone-hint"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+375 (29) 112-44-55"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                />
                <FieldHint id="agent-phone-hint">
                  Номер администратора или мастера на случай сложных вопросов.
                </FieldHint>
              </div>
            </div>

            <div>
              <FieldLabel
                htmlFor="agent-address"
                label="Адрес и удобный ориентир"
                helpTitle="Как лучше указать адрес"
                helpText="Добавьте не только улицу и дом, но и станцию метро, район или заметный ориентир рядом — клиенты часто спрашивают, как к вам проехать или где припарковаться."
                helpExample="г. Минск, ул. Тимирязева, 121 (возле ТЦ Град, бесплатная парковка у шлагбаума)"
              />
              <input
                id="agent-address"
                name="address"
                type="text"
                autoComplete="street-address"
                aria-describedby="agent-address-hint"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="г. Минск, пр-т Победителей, 65 (рядом с ТЦ Замок)"
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
              <FieldHint id="agent-address-hint">
                Укажите город, улицу, номер дома и ближайшую станцию метро или ориентир.
              </FieldHint>
            </div>

            <div>
              <FieldLabel
                htmlFor="agent-working-hours"
                label="График работы"
                helpTitle="Зачем указывать часы работы"
                helpText="Бот круглосуточно принимает звонки, но записывает клиентов именно в ваши рабочие часы и точно отвечает на вопрос «До скольки вы сегодня работаете?»."
                helpExample="Пн–Пт с 09:00 до 20:00, Сб с 10:00 до 18:00, Вс — выходной"
              />
              <input
                id="agent-working-hours"
                name="workingHours"
                type="text"
                aria-describedby="agent-hours-hint"
                value={formData.workingHours}
                onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
                placeholder="Ежедневно с 09:00 до 21:00 без выходных"
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
              <FieldHint id="agent-hours-hint">
                Дни недели и время приёма клиентов (например: Пн–Сб 09:00–20:00).
              </FieldHint>
            </div>
          </fieldset>

          {/* Card 4: Приветствие и прайс-лист */}
          <fieldset className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
            <legend className="text-xs font-bold text-slate-900">
              4. Приветствие и цены на услуги (в BYN)
            </legend>

            <div>
              <FieldLabel
                htmlFor="agent-first-message"
                label="Первая фраза бота при ответе на звонок"
                helpTitle="Каким должно быть приветствие"
                helpText="Короткое приветствие из 1–2 предложений работает лучше всего: назовите компанию, имя ассистента и предложите помощь."
                helpExample="Здравствуйте! Автошкола Драйв-Минск, администратор Анна. Чем могу вам помочь?"
              />
              <input
                id="agent-first-message"
                name="firstMessage"
                type="text"
                aria-describedby="agent-greeting-hint"
                value={formData.firstMessage}
                onChange={(e) => setFormData({ ...formData, firstMessage: e.target.value })}
                placeholder="Здравствуйте! Компания ..., чем могу вам помочь?"
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
              <FieldHint id="agent-greeting-hint">
                Эту фразу клиент услышит сразу после снятия трубки.
              </FieldHint>
            </div>

            <div>
              <FieldLabel
                htmlFor="agent-pricing"
                label="Список основных услуг и цен (в белорусских рублях)"
                helpTriggerLabel="Пример прайса"
                helpTitle="Как заполнить услуги и цены"
                helpText="Перечислите ваши самые частые услуги с новой строки. Если точная стоимость зависит от осмотра, напишите «от ... BYN». Суммы в BYN бот автоматически произносит как «белорусских рублей»."
                helpExample="- Диагностика подвески — 35 BYN&#10;- Замена масла и фильтров — от 45 BYN&#10;- Шиномонтаж R16 (комплекс) — 75 BYN&#10;- Рассрочка по карте Халва — 3 месяца"
              />
              <textarea
                id="agent-pricing"
                name="pricingAndServices"
                rows={5}
                aria-describedby="agent-pricing-hint"
                value={formData.pricingAndServices}
                onChange={(e) => setFormData({ ...formData, pricingAndServices: e.target.value })}
                placeholder="- Услуга 1 — 50 BYN&#10;- Услуга 2 — от 80 BYN"
                className="w-full p-3 rounded-lg bg-white border border-slate-300 text-xs text-slate-800 leading-relaxed focus:outline-none focus:border-blue-600"
              />
              <FieldHint id="agent-pricing-hint">
                Пишите по одной услуге на строку в формате «Услуга — цена BYN». Также сюда можно добавить условия оплаты или рассрочки.
              </FieldHint>
            </div>

            <div className="pt-1 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleGenerateAiPrompt}
                disabled={isGeneratingPrompt}
                className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
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
          </fieldset>

          {/* Card 5: Дополнительные правила (Native <details> disclosure) */}
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
                <FieldLabel
                  htmlFor="agent-system-prompt"
                  label="Подробная инструкция поведения бота"
                  optionalText="заполняется автоматически"
                  helpTitle="Что можно дописать в инструкцию"
                  helpText="Обычно менять это поле не нужно — оно создаётся само из ваших услуг и адреса. Но если у вас есть особые правила (например: «всегда уточнять марку и год машины» или «предупреждать взять паспорт»), допишите их сюда простым текстом."
                  helpExample="Обязательно спроси у клиента имя, удобное время и марку автомобиля. Не обещай скидки без согласования с мастером."
                />
                <textarea
                  id="agent-system-prompt"
                  name="systemPrompt"
                  rows={6}
                  aria-describedby="agent-system-prompt-hint"
                  value={formData.systemPrompt}
                  onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                  className="w-full p-3 rounded-lg bg-white border border-slate-300 text-xs text-slate-800 leading-relaxed focus:outline-none focus:border-blue-600"
                />
                <FieldHint id="agent-system-prompt-hint">
                  Особые пожелания к диалогу: какие вопросы задать клиенту при записи и чего обещать нельзя.
                </FieldHint>
              </div>
            </div>
          </details>
        </div>

        {/* Right Column: Live Testing Phone */}
        <div className="lg:col-span-5 sticky top-20">
          <LiveBotTester agent={formData} />
        </div>
      </div>
    </form>
  );
};
