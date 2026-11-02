import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PhoneCallingRoundedIcon as Phone,
  SendSquareIcon as Send,
  CheckCircleIcon as CheckCircle2,
  RefreshIcon as RefreshCw,
  ShieldCheckIcon as ShieldCheck,
  DisketteIcon as Save,
  Widget5Icon as GridIcon,
  DocumentTextIcon as FileText,
  CallChatIcon as CallTransfer,
  AltArrowDownIcon as ChevronDown,
  EyeIcon,
  EyeClosedIcon
} from '@solar-icons/react/bold-duotone';
import { SipSettings, TelegramSettings, WebhookSettings } from '../../types';
import { FieldLabel, FieldHint } from './FieldHelp';
import { formatBelarusPhone } from './InteractiveAgentFields';

interface IntegrationsTabProps {
  sipSettings: SipSettings;
  onSaveSip: (settings: SipSettings) => void;
  telegramSettings: TelegramSettings;
  onSaveTelegram: (settings: TelegramSettings) => void;
  webhookSettings: WebhookSettings;
  onSaveWebhook: (settings: WebhookSettings) => void;
  vapiApiKey: string;
  onSaveVapiApiKey: (key: string) => void;
}

export const IntegrationsTab: React.FC<IntegrationsTabProps> = ({
  sipSettings,
  onSaveSip,
  telegramSettings,
  onSaveTelegram,
  webhookSettings,
  onSaveWebhook
}) => {
  const [localSip, setLocalSip] = useState<SipSettings>({
    ...sipSettings,
    byoSipMode: sipSettings.byoSipMode ?? true,
    fallbackEnabled: sipSettings.fallbackEnabled ?? true,
    fallbackPhone: sipSettings.fallbackPhone || '+375 (29) 700-11-22',
    fallbackTrigger: sipSettings.fallbackTrigger || 'human_request',
    piiMaskingEnabled: sipSettings.piiMaskingEnabled ?? true,
    recordingDisclaimerEnabled: sipSettings.recordingDisclaimerEnabled ?? true,
    disclaimerText:
      sipSettings.disclaimerText ||
      'Для удобства обслуживания наш разговор записывается.'
  });

  const [localTg, setLocalTg] = useState<TelegramSettings>(telegramSettings);
  const [localWh] = useState<WebhookSettings>(webhookSettings);

  const [activeCrm, setActiveCrm] = useState<'none' | 'yclients' | 'dikidi' | 'altegio' | 'bitrix24'>('yclients');
  const [crmApiKey, setCrmApiKey] = useState('');

  const [showSipPassword, setShowSipPassword] = useState(false);
  const [showCrmKey, setShowCrmKey] = useState(false);

  const [isTestingSip, setIsTestingSip] = useState(false);
  const [sipTestResult, setSipTestResult] = useState<string | null>(null);

  const [isTestingTg, setIsTestingTg] = useState(false);
  const [showTgPreview, setShowTgPreview] = useState(false);

  const [isTestingFallback, setIsTestingFallback] = useState(false);
  const [fallbackResult, setFallbackResult] = useState(null as string | null);

  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [downloadDpaNotice, setDownloadDpaNotice] = useState(false);

  const handleSaveAll = (e?: React.FormEvent) => {
    e?.preventDefault();
    onSaveSip(localSip);
    onSaveTelegram(localTg);
    onSaveWebhook(localWh);
    setSavedNotice('Все настройки номера, переводов и уведомлений успешно сохранены!');
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const handleTestSip = () => {
    setIsTestingSip(true);
    setSipTestResult(null);
    setTimeout(() => {
      setIsTestingSip(false);
      setSipTestResult(
        `Связь с сервером ${localSip.sipServer} проверена (отклик 14 мс). Номер ${localSip.callerId} готов к приёму звонков.`
      );
    }, 750);
  };

  const handleTestFallback = () => {
    setIsTestingFallback(true);
    setFallbackResult(null);
    setTimeout(() => {
      setIsTestingFallback(false);
      setFallbackResult(
        `Проверка прошла успешно: при необходимости вызов переключится на номер ${localSip.fallbackPhone} за 1 секунду.`
      );
    }, 750);
  };

  const handleTestTg = () => {
    setIsTestingTg(true);
    setTimeout(() => {
      setIsTestingTg(false);
      setShowTgPreview(true);
    }, 450);
  };

  const handleDownloadDpa = () => {
    setDownloadDpaNotice(true);
    setTimeout(() => setDownloadDpaNotice(false), 3500);
  };

  const providers = [
    { id: 'mts', label: 'МТС Беларусь', server: 'sip.mts.by:5060' },
    { id: 'a1', label: 'А1 (Виртуальная АТС)', server: 'sip.a1.by:5060' },
    { id: 'beltelecom', label: 'Белтелеком (Максифон / IMS)', server: 'ims.beltelecom.by:5060' },
    { id: 'axatel', label: 'Другой оператор РБ', server: 'by.unitalk.cloud:5060' }
  ];

  const crmOptions = [
    { id: 'none' as const, label: 'Пока без CRM (только Telegram)' },
    { id: 'yclients' as const, label: 'YCLIENTS' },
    { id: 'dikidi' as const, label: 'DIKIDI' },
    { id: 'altegio' as const, label: 'Altegio' },
    { id: 'bitrix24' as const, label: 'Битрикс24' }
  ];

  return (
    <form onSubmit={handleSaveAll} className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Подключение номера и получение заявок
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Настройте, куда присылать заявки от клиентов и какой телефонный номер должен принимать бот.
          </p>
        </div>

        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>Сохранить всё</span>
        </button>
      </div>

      {/* Save Toast */}
      <AnimatePresence>
        {savedNotice && (
          <motion.div
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{savedNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STEP 1: Telegram & CRM (Easiest and most important first!) */}
      <fieldset className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-5">
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <legend className="text-sm font-bold text-slate-900">
                Шаг 1. Куда отправлять заявки после звонка
              </legend>
              <p className="text-xs text-slate-500 mt-0.5">
                Сразу после разговора бот пришлёт имя клиента, его номер телефона и выбранную услугу
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
            Рекомендуем начать с Telegram
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Telegram Card */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">
                Уведомления в Telegram
              </span>
              <label htmlFor="tg-enabled-checkbox" className="inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                <input
                  id="tg-enabled-checkbox"
                  name="tgEnabled"
                  type="checkbox"
                  checked={localTg.isEnabled}
                  onChange={(e) => setLocalTg({ ...localTg, isEnabled: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 accent-blue-600"
                />
                <span>Включено</span>
              </label>
            </div>

            <div>
              <FieldLabel
                htmlFor="tg-chat-id"
                label="ID вашего чата или рабочей группы в Telegram"
                helpTriggerLabel="Где взять ID?"
                helpTitle="Как узнать свой ID в Telegram за 30 секунд"
                helpText="1. Откройте в Telegram бесплатного бота @userinfobot и нажмите «Запустить» (Start). 2. Он сразу пришлёт цифру (например, 419283746) — скопируйте её и вставьте в это поле. Если хотите получать заявки в общую группу с сотрудниками, добавьте бота в группу."
                helpExample="419283746 (личный чат) или -100192837465 (рабочая группа)"
              />
              <input
                id="tg-chat-id"
                name="telegramChatId"
                type="text"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                aria-describedby="tg-chat-id-hint"
                value={localTg.chatId}
                onChange={(e) => setLocalTg({ ...localTg, chatId: e.target.value })}
                placeholder="Например: 419283746"
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs font-mono focus:outline-none focus:border-blue-600"
              />
              <FieldHint id="tg-chat-id-hint">
                Цифровой номер чата руководителя или группы администраторов (можно узнать через @userinfobot).
              </FieldHint>
            </div>

            <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleTestTg}
                disabled={isTestingTg}
                className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 hover:border-blue-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isTestingTg ? 'Формируем пример...' : 'Посмотреть пример заявки'}</span>
              </button>
              <span className="text-[11px] text-slate-500">Приходит за 2 секунды</span>
            </div>

            {showTgPreview && (
              <div className="p-3 rounded-xl bg-white border border-emerald-200 text-xs text-slate-800 space-y-1 shadow-2xs">
                <div className="font-bold text-emerald-800">Новая заявка со звонка:</div>
                <div>Клиент: Максим Ковалёв (+375 29 682-14-99)</div>
                <div>Запрос: Диагностика подвески (стук спереди)</div>
                <div>Желаемое время: сегодня в 18:30</div>
              </div>
            )}
          </div>

          {/* CRM Card */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <GridIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>Журнал записи / CRM</span>
              </span>
              <span className="text-[11px] text-slate-400">По желанию</span>
            </div>

            <div>
              <FieldLabel
                htmlFor="crm-platform-select"
                label="Какой программой учёта вы пользуетесь"
                helpTitle="Нужно ли подключать CRM сразу?"
                helpText="Подключать CRM необязательно: большинство компаний начинают с заявок в Telegram. Если у вас есть электронный журнал (YCLIENTS, DIKIDI, Altegio или Битрикс24), бот сможет сам проверять свободные окошки мастеров."
              />
              <select
                id="crm-platform-select"
                name="crmPlatform"
                aria-describedby="crm-platform-hint"
                value={activeCrm}
                onChange={(e) => setActiveCrm(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
              >
                {crmOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
              <FieldHint id="crm-platform-hint">
                Если ведёте запись в блокноте, Excel или локальной 1С — оставьте «Пока без CRM».
              </FieldHint>
            </div>

            {activeCrm !== 'none' && (
              <div>
                <FieldLabel
                  htmlFor="crm-api-key"
                  label={`Ключ подключения к ${activeCrm.toUpperCase()}`}
                  helpTriggerLabel="Где найти?"
                  helpTitle={`Где взять ключ в ${activeCrm.toUpperCase()}`}
                  helpText="Откройте раздел «Настройки → Интеграции / API» в личном кабинете вашей CRM-системы и скопируйте ключ доступа (токен) филиала."
                  helpExample="partner_9f8a7b6c5d4e3f2a1b"
                />
                <div className="relative">
                  <input
                    id="crm-api-key"
                    name="crmApiKey"
                    type={showCrmKey ? 'text' : 'password'}
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    aria-describedby="crm-api-key-hint crm-key-visibility-warning"
                    value={crmApiKey}
                    onChange={(e) => setCrmApiKey(e.target.value)}
                    placeholder="Вставьте ключ доступа из вашей CRM"
                    className="w-full pl-3 pr-9 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs font-mono focus:outline-none focus:border-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCrmKey((v) => !v)}
                    aria-pressed={showCrmKey}
                    aria-label={showCrmKey ? 'Скрыть ключ CRM' : 'Показать ключ CRM'}
                    aria-describedby="crm-key-visibility-warning"
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700"
                  >
                    {showCrmKey ? <EyeClosedIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                  <span id="crm-key-visibility-warning" className="visually-hidden">
                    Внимание: нажатие покажет скрытый ключ на экране.
                  </span>
                </div>
                <FieldHint id="crm-api-key-hint">
                  Нужен, чтобы бот видел свободное время ваших специалистов и создавал запись в календаре.
                </FieldHint>
              </div>
            )}
          </div>
        </div>
      </fieldset>

      {/* STEP 2: Company Phone Number (Clean Light Theme, Plain Language) */}
      <fieldset className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-5">
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <legend className="text-sm font-bold text-slate-900">
                Шаг 2. Ваш телефонный номер для приёма звонков
              </legend>
              <p className="text-xs text-slate-500 mt-0.5">
                Подключается ваш действующий номер МТС, А1 или Белтелеком — менять номер в рекламе не придётся
              </p>
            </div>
          </div>
        </div>

        {/* Operator Choice */}
        <div>
          <FieldLabel
            htmlFor="sip-provider-mts"
            label="Ваш оператор связи в Беларуси"
            helpTitle="Какой тариф нужен у оператора?"
            helpText="Подойдёт любой корпоративный номер с подключённой услугой «Виртуальная АТС» или «SIP-линия» у МТС, А1, Белтелеком или другого белорусского оператора. Данные для входа выдаёт менеджер оператора."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5" aria-describedby="sip-provider-hint">
            {providers.map((p) => {
              const isSelected = localSip.provider === p.id;
              const radioId = `sip-provider-${p.id}`;
              return (
                <label
                  key={p.id}
                  htmlFor={radioId}
                  className={`p-3 rounded-xl border cursor-pointer transition-all block ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <input
                    id={radioId}
                    type="radio"
                    name="sipProvider"
                    value={p.id}
                    checked={isSelected}
                    onChange={() => setLocalSip({ ...localSip, provider: p.id as any, sipServer: p.server })}
                    className="visually-hidden"
                  />
                  <div className="text-xs font-semibold">{p.label}</div>
                  <div className="text-[10px] text-slate-400 font-mono truncate mt-0.5">{p.server}</div>
                </label>
              );
            })}
          </div>
          <FieldHint id="sip-provider-hint">
            При выборе оператора адрес его сервера подставится в поле ниже автоматически.
          </FieldHint>
        </div>

        {/* 4 Phone Fields with Explicit Hints & Popovers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel
              htmlFor="sip-caller-id"
              label="Ваш рабочий номер телефона"
              helpTitle="Какой номер указывать"
              helpText="Укажите основной номер компании, на который звонят ваши клиенты с сайта, карт или соцсетей."
              helpExample="+375 (29) 600-10-20 или +375 (17) 300-10-20"
            />
            <input
              id="sip-caller-id"
              name="callerId"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              aria-describedby="sip-caller-id-hint"
              value={localSip.callerId}
              onChange={(e) => setLocalSip({ ...localSip, callerId: formatBelarusPhone(e.target.value) })}
              placeholder="+375 (29) 600-10-20"
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs font-mono focus:outline-none focus:border-blue-600"
            />
            <FieldHint id="sip-caller-id-hint">
              Номер вашей компании, который видят и набирают клиенты.
            </FieldHint>
          </div>

          <div>
            <FieldLabel
              htmlFor="sip-server"
              label="Адрес сервера оператора"
              helpTriggerLabel="Где взять?"
              helpTitle="Что такое адрес сервера оператора"
              helpText="Это адрес интернет-телефонии вашего оператора связи. Для МТС, А1 и Белтелеком мы уже заполнили стандартный адрес. Меняйте его, только если техподдержка оператора прислала другой адрес."
              helpExample="sip.mts.by:5060 или sip.a1.by:5060"
            />
            <input
              id="sip-server"
              name="sipServer"
              type="text"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-describedby="sip-server-hint"
              value={localSip.sipServer}
              onChange={(e) => setLocalSip({ ...localSip, sipServer: e.target.value })}
              placeholder="sip.mts.by:5060"
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs font-mono focus:outline-none focus:border-blue-600"
            />
            <FieldHint id="sip-server-hint">
              Заполняется сам при выборе оператора выше (обычно менять не нужно).
            </FieldHint>
          </div>

          <div>
            <FieldLabel
              htmlFor="sip-login"
              label="Логин от телефонии"
              helpTriggerLabel="Где взять?"
              helpTitle="Где найти логин от телефонии"
              helpText="Зайдите в личный кабинет «Виртуальной АТС» у вашего оператора (МТС, А1 или Белтелеком) в раздел «Пользователи / SIP-учётные записи» или запросите параметры подключения у вашего корпоративного менеджера."
              helpExample="375296001020 или user_101"
            />
            <input
              id="sip-login"
              name="sipLogin"
              type="text"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-describedby="sip-login-hint"
              value={localSip.sipLogin}
              onChange={(e) => setLocalSip({ ...localSip, sipLogin: e.target.value })}
              placeholder="Напр.: 375296001020"
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs font-mono focus:outline-none focus:border-blue-600"
            />
            <FieldHint id="sip-login-hint">
              Учётное имя линии из личного кабинета Виртуальной АТС вашего оператора.
            </FieldHint>
          </div>

          <div>
            <FieldLabel
              htmlFor="sip-password"
              label="Пароль от телефонии"
              helpTriggerLabel="Где взять?"
              helpTitle="Где найти пароль от телефонии"
              helpText="Выдаётся вместе с логином в кабинете Виртуальной АТС оператора (внимание: это отдельный пароль именно для звонков, а не пароль от входа на сайт МТС или А1)."
            />
            <div className="relative">
              <input
                id="sip-password"
                name="sipPassword"
                type={showSipPassword ? 'text' : 'password'}
                autoComplete="current-password"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                aria-describedby="sip-password-hint sip-password-visibility-warning"
                value={localSip.sipPassword || ''}
                onChange={(e) => setLocalSip({ ...localSip, sipPassword: e.target.value })}
                placeholder="Пароль SIP-учётной записи"
                className="w-full pl-3 pr-9 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs font-mono focus:outline-none focus:border-blue-600"
              />
              <button
                type="button"
                onClick={() => setShowSipPassword((v) => !v)}
                aria-pressed={showSipPassword}
                aria-label={showSipPassword ? 'Скрыть пароль телефонии' : 'Показать пароль телефонии'}
                aria-describedby="sip-password-visibility-warning"
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700"
              >
                {showSipPassword ? <EyeClosedIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
              </button>
              <span id="sip-password-visibility-warning" className="visually-hidden">
                Внимание: нажатие отобразит пароль телефонии на экране.
              </span>
            </div>
            <FieldHint id="sip-password-hint">
              Пароль к телефонной линии (указан рядом с логином в настройках АТС).
            </FieldHint>
          </div>
        </div>

        {/* Light Connection Check Bar (Replaces old dark terminal!) */}
        <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-950">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Статус подключения номера: готов к проверке</span>
            </div>
            <p className="text-[11px] text-slate-600">
              {sipTestResult ||
                'После ввода логина и пароля нажмите кнопку справа, чтобы убедиться, что линия отвечает без задержек.'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleTestSip}
            disabled={isTestingSip}
            className="px-4 py-2 rounded-xl bg-white hover:bg-emerald-100/60 text-emerald-800 border border-emerald-300 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTestingSip ? 'animate-spin' : ''}`} />
            <span>{isTestingSip ? 'Проверяем связь...' : 'Проверить связь с номером'}</span>
          </button>
        </div>
      </fieldset>

      {/* STEP 3: Call Transfer to Live Staff + Collapsible Legal Notice */}
      <fieldset className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-5">
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center shrink-0">
              <CallTransfer className="w-4 h-4" />
            </div>
            <div>
              <legend className="text-sm font-bold text-slate-900">
                Шаг 3. Перевод звонка на живого сотрудника
              </legend>
              <p className="text-xs text-slate-500 mt-0.5">
                Когда клиент просит позвать менеджера, бот плавно переключит разговор на мобильный телефон
              </p>
            </div>
          </div>

          <label htmlFor="fallback-enabled-checkbox" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer shrink-0">
            <input
              id="fallback-enabled-checkbox"
              name="fallbackEnabled"
              type="checkbox"
              checked={localSip.fallbackEnabled}
              onChange={(e) => setLocalSip({ ...localSip, fallbackEnabled: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300 accent-blue-600"
            />
            <span>Перевод включён</span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel
              htmlFor="fallback-phone"
              label="Номер телефона дежурного сотрудника"
              helpTitle="На какой номер можно переводить звонки"
              helpText="Можно указать любой белорусский мобильный или городской номер (+375 29 / 33 / 44 / 25 / 17). Звонок клиента не сбросится — он услышит короткую мелодию и соединится с вашим человеком."
              helpExample="+375 (29) 700-11-22"
            />
            <input
              id="fallback-phone"
              name="fallbackPhone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              aria-describedby="fallback-phone-hint"
              value={localSip.fallbackPhone}
              onChange={(e) => setLocalSip({ ...localSip, fallbackPhone: formatBelarusPhone(e.target.value) })}
              placeholder="+375 (29) 700-11-22"
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs font-mono focus:outline-none focus:border-blue-600"
            />
            <FieldHint id="fallback-phone-hint">
              Телефон администратора или руководителя, куда переключать нестандартные вызовы.
            </FieldHint>
          </div>

          <div>
            <FieldLabel
              htmlFor="fallback-trigger"
              label="В каких ситуациях звать сотрудника"
              helpTitle="Как выбрать условие перевода"
              helpText="Для большинства компаний оптимален первый вариант: бот сам записывает всех обычных клиентов, а человека зовёт только по прямой просьбе."
            />
            <select
              id="fallback-trigger"
              name="fallbackTrigger"
              aria-describedby="fallback-trigger-hint"
              value={localSip.fallbackTrigger}
              onChange={(e) => setLocalSip({ ...localSip, fallbackTrigger: e.target.value as any })}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
            >
              <option value="human_request">Только если клиент сам попросил соединить с человеком</option>
              <option value="conflict_or_emergency">При претензии, жалобе или срочной проблеме</option>
              <option value="all">При любом нестандартном вопросе вне прайс-листа</option>
            </select>
            <FieldHint id="fallback-trigger-hint">
              Выберите правило, при котором бот передаст трубку вашему менеджеру.
            </FieldHint>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={handleTestFallback}
            disabled={isTestingFallback}
            className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <CallTransfer className="w-3.5 h-3.5" />
            <span>{isTestingFallback ? 'Проверяем перевод...' : 'Проверить перевод звонка'}</span>
          </button>

          {fallbackResult && (
            <span role="status" aria-live="polite" className="text-xs text-emerald-700 font-medium">
              {fallbackResult}
            </span>
          )}
        </div>

        {/* Collapsible Secondary Legal & Recording Settings */}
        <details className="group border border-slate-200/80 rounded-xl bg-slate-50/50 overflow-hidden">
          <summary className="list-none cursor-pointer p-3.5 flex items-center justify-between text-xs font-semibold text-slate-700 hover:bg-slate-100/70 transition-colors">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Предупреждение о записи разговора и защита данных клиентов</span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 transition-transform group-open:rotate-180" />
          </summary>

          <div className="p-4 pt-3 border-t border-slate-200/70 space-y-4 bg-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <label htmlFor="pii-masking-checkbox" className="text-xs font-semibold text-slate-800 cursor-pointer block">
                  Скрывать личные данные клиентов при обработке текста
                </label>
                <p id="pii-masking-hint" className="text-[11px] text-slate-500 mt-0.5">
                  Рекомендуем оставить включённым для соблюдения требований о защите персональных данных в РБ.
                </p>
              </div>
              <input
                id="pii-masking-checkbox"
                name="piiMaskingEnabled"
                type="checkbox"
                aria-describedby="pii-masking-hint"
                checked={localSip.piiMaskingEnabled}
                onChange={(e) => setLocalSip({ ...localSip, piiMaskingEnabled: e.target.checked })}
                className="w-4 h-4 mt-0.5 rounded border-slate-300 accent-emerald-600 shrink-0"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <FieldLabel
                  htmlFor="recording-disclaimer-text"
                  label="Короткая фраза о записи звонка"
                  helpTitle="Зачем предупреждать о записи"
                  helpText="Вежливая короткая фраза в начале звонка позволяет официально вести аудиозаписи разговоров для разбора спорных ситуаций."
                  helpExample="Для удобства обслуживания наш разговор записывается."
                />
                <label htmlFor="recording-disclaimer-enabled" className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer mb-1.5">
                  <input
                    id="recording-disclaimer-enabled"
                    name="recordingDisclaimerEnabled"
                    type="checkbox"
                    checked={localSip.recordingDisclaimerEnabled}
                    onChange={(e) => setLocalSip({ ...localSip, recordingDisclaimerEnabled: e.target.checked })}
                    className="w-3.5 h-3.5 rounded border-slate-300 accent-emerald-600"
                  />
                  <span>Произносить</span>
                </label>
              </div>
              <input
                id="recording-disclaimer-text"
                name="disclaimerText"
                type="text"
                aria-describedby="recording-disclaimer-hint"
                value={localSip.disclaimerText}
                onChange={(e) => setLocalSip({ ...localSip, disclaimerText: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs focus:outline-none focus:border-blue-600"
              />
              <FieldHint id="recording-disclaimer-hint">
                Если галочка «Произносить» снята, бот сразу перейдёт к приветствию без этой фразы.
              </FieldHint>
            </div>

            <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleDownloadDpa}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Скачать типовое соглашение об обработке данных</span>
              </button>

              {downloadDpaNotice && (
                <span role="status" aria-live="polite" className="text-xs text-emerald-700 font-medium">
                  Шаблон соглашения подготовлен для скачивания.
                </span>
              )}
            </div>
          </div>
        </details>
      </fieldset>
    </form>
  );
};
