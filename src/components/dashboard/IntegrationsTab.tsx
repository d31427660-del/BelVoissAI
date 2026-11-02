import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PhoneCallingRoundedIcon as Phone, 
  SendSquareIcon as Send, 
  ShareCircleIcon as Webhook, 
  CheckCircleIcon as CheckCircle2, 
  RefreshIcon as RefreshCw, 
  ShieldCheckIcon as ShieldCheck,
  DisketteIcon as Save,
  Widget5Icon as GridIcon,
  DocumentTextIcon as FileText,
  UserRoundedIcon as UserIcon,
  CallChatIcon as CallTransfer,
  LockKeyholeMinimalisticUnlockedIcon as LockOpen,
  LockKeyholeMinimalisticIcon as LockClosed
} from '@solar-icons/react/bold-duotone';
import { SipSettings, TelegramSettings, WebhookSettings } from '../../types';

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
  onSaveWebhook,
  vapiApiKey,
  onSaveVapiApiKey
}) => {
  const [localSip, setLocalSip] = useState<SipSettings>({
    ...sipSettings,
    byoSipMode: sipSettings.byoSipMode ?? true,
    fallbackEnabled: sipSettings.fallbackEnabled ?? true,
    fallbackPhone: sipSettings.fallbackPhone || '+375 (29) 700-11-22',
    fallbackTrigger: sipSettings.fallbackTrigger || 'human_request',
    piiMaskingEnabled: sipSettings.piiMaskingEnabled ?? true,
    recordingDisclaimerEnabled: sipSettings.recordingDisclaimerEnabled ?? true,
    disclaimerText: sipSettings.disclaimerText || 'В целях контроля качества обслуживания разговор записывается согласно Закону № 99-З.'
  });

  const [localTg, setLocalTg] = useState<TelegramSettings>(telegramSettings);
  const [localWh, setLocalWh] = useState<WebhookSettings>(webhookSettings);
  const [localVapi, setLocalVapi] = useState<string>(vapiApiKey);

  // Cloud CRM Integrations (Tier 1)
  const [activeTier1Crm, setActiveTier1Crm] = useState<'yclients' | 'dikidi' | 'altegio' | 'bitrix24'>('yclients');
  const [crmApiKey, setCrmApiKey] = useState('');

  const [isTestingSip, setIsTestingSip] = useState(false);
  const [sipTestResult, setSipTestResult] = useState<string | null>(null);

  const [isTestingTg, setIsTestingTg] = useState(false);
  const [showTgPreview, setShowTgPreview] = useState(false);

  const [isTestingWh, setIsTestingWh] = useState(false);
  const [whTestResult, setWhTestResult] = useState<string | null>(null);

  const [isTestingFallback, setIsTestingFallback] = useState(false);
  const [fallbackResult, setFallbackResult] = useState<string | null>(null);

  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [downloadDpaNotice, setDownloadDpaNotice] = useState(false);

  const showSaveSuccess = (section: string) => {
    setSavedNotice(`Настройки [${section}] успешно сохранены!`);
    setTimeout(() => setSavedNotice(null), 2500);
  };

  const handleTestSip = () => {
    setIsTestingSip(true);
    setSipTestResult(null);
    setTimeout(() => {
      setIsTestingSip(false);
      setSipTestResult(`Успешная регистрация на сервере ${localSip.sipServer}! Пинг: 14 мс. Голосовой кодек G.711a (PCMA) активен. BYO-SIP подтвержден.`);
    }, 850);
  };

  const handleTestFallback = () => {
    setIsTestingFallback(true);
    setFallbackResult(null);
    setTimeout(() => {
      setIsTestingFallback(false);
      setFallbackResult(`SIP REFER тестовый перевод успешно отправлен на ${localSip.fallbackPhone}. Задержка трансфера: 0.95 сек.`);
    }, 950);
  };

  const handleTestTg = () => {
    setIsTestingTg(true);
    setTimeout(() => {
      setIsTestingTg(false);
      setShowTgPreview(true);
    }, 500);
  };

  const handleTestWebhook = () => {
    setIsTestingWh(true);
    setWhTestResult(null);
    setTimeout(() => {
      setIsTestingWh(false);
      setWhTestResult('HTTP 200 OK — Тестовый payload лида доставлен в CRM!');
    }, 650);
  };

  const handleDownloadDpa = () => {
    setDownloadDpaNotice(true);
    setTimeout(() => setDownloadDpaNotice(false), 3500);
  };

  const providers = [
    { id: 'mts', label: 'МТС Беларусь', server: 'sip.mts.by:5060' },
    { id: 'a1', label: 'А1 (A1.by)', server: 'sip.a1.by:5060' },
    { id: 'beltelecom', label: 'Белтелеком (IMS)', server: 'ims.beltelecom.by:5060' },
    { id: 'axatel', label: 'Axatel / UniTalk РБ', server: 'by.unitalk.cloud:5060' },
  ];

  return (
    <div className="space-y-6">
      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
        <strong>Демо-режим:</strong> проверки SIP, CRM и Telegram ниже показывают интерфейс и не выполняют сетевых запросов. Для рабочего подключения используйте защищённый серверный API; не вводите ключи в этот сайт.
      </div>
      
      {/* Toast Notice */}
      <AnimatePresence>
        {savedNotice && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{savedNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Row 1: SIP Telephony & BYO-SIP (Left) + Diagnostics (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* SIP Setup Form */}
        <div className="lg:col-span-7 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Белорусская телефония (BYO-SIP)</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Активна
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Подключение своего номера А1, МТС или Белтелеком без лицензий
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                onSaveSip(localSip);
                showSaveSuccess('SIP-телефония');
              }}
              className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Сохранить SIP</span>
            </button>
          </div>

          {/* BYO-SIP Status Notice */}
          <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold">Модель Bring Your Own SIP (BYO-SIP):</strong>
              <span>Вы подключаете ваш существующий номер от белорусского оператора. Voxi.by работает как IT-программа (ОКЭД 62010), лицензия электросвязи не требуется.</span>
            </div>
          </div>

          {/* Provider Selector Chips */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Провайдер связи в Беларуси:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {providers.map((p) => {
                const isSelected = localSip.provider === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setLocalSip({ ...localSip, provider: p.id as any, sipServer: p.server })}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/80 text-blue-900 font-semibold shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <div className="text-xs">{p.label}</div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">{p.server}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SIP Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                SIP Сервер:
              </label>
              <input
                type="text"
                value={localSip.sipServer}
                onChange={(e) => setLocalSip({ ...localSip, sipServer: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs font-mono focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                CallerID (Ваш номер):
              </label>
              <input
                type="text"
                value={localSip.callerId}
                onChange={(e) => setLocalSip({ ...localSip, callerId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs font-mono focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                SIP Логин / Номер транка:
              </label>
              <input
                type="text"
                value={localSip.sipLogin}
                onChange={(e) => setLocalSip({ ...localSip, sipLogin: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs font-mono focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                SIP Пароль:
              </label>
              <input
                type="password"
                value={localSip.sipPassword || '••••••••••••'}
                onChange={(e) => setLocalSip({ ...localSip, sipPassword: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs font-mono focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Live Diagnostics Terminal */}
        <div className="lg:col-span-5 p-5 sm:p-6 rounded-2xl bg-slate-900 text-white shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-bold font-mono tracking-tight text-slate-200">
                  ШЛЮЗ СВЯЗИ В МИНСКЕ
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Порт 5060 (UDP/TLS)</span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Провайдер:</span>
                <span className="text-emerald-400 font-bold">{localSip.provider.toUpperCase()} Беларусь</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Серверный кластер:</span>
                <span className="text-slate-100 font-bold">Минск (beCloud / Hoster.by)</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Задержка (Пинг):</span>
                <span className="text-emerald-400 font-bold">14 мс</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Потери пакетов:</span>
                <span className="text-emerald-400 font-bold">0.0% (Jitter &lt; 2ms)</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Кодек речи:</span>
                <span className="text-slate-100">G.711 A-law / Opus 24kHz</span>
              </div>
            </div>

            {sipTestResult && (
              <div className="p-3 rounded-lg bg-slate-800 border border-slate-700 text-emerald-400 text-[11px] font-mono leading-relaxed">
                {sipTestResult}
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleTestSip}
              disabled={isTestingSip}
              className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-xs"
            >
              {isTestingSip ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              <span>{isTestingSip ? 'Проверка соединения...' : 'Тестировать пинг шлюза РБ'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* Row 2: Fallback (SIP Transfer) & Law 99-Z Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* SIP Fallback (Human-in-the-Loop) */}
        <div className="lg:col-span-6 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <CallTransfer className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Интеллектуальный SIP-трансфер (Fallback)
                </h3>
                <p className="text-xs text-slate-500">
                  Бесшовный перевод звонка на мобильный телефон мастера/администратора
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSip.fallbackEnabled}
                onChange={(e) => setLocalSip({ ...localSip, fallbackEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Номер для экстренного перевода вызова:
              </label>
              <input
                type="text"
                value={localSip.fallbackPhone}
                onChange={(e) => setLocalSip({ ...localSip, fallbackPhone: e.target.value })}
                placeholder="+375 (29) 700-11-22"
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Триггер перевода на человека:
              </label>
              <select
                value={localSip.fallbackTrigger}
                onChange={(e) => setLocalSip({ ...localSip, fallbackTrigger: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-amber-500"
              >
                <option value="human_request">При фразе «позовите человека / оператора»</option>
                <option value="conflict_or_emergency">При распознавании конфликта / острой боли</option>
                <option value="all">Все нераспознанные ситуации (максимальная осторожность)</option>
              </select>
            </div>

            <div className="pt-1 flex items-center justify-between">
              <button
                type="button"
                onClick={handleTestFallback}
                disabled={isTestingFallback}
                className="px-3.5 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <CallTransfer className="w-3.5 h-3.5" />
                <span>{isTestingFallback ? 'Симуляция трансфера...' : 'Тест SIP REFER (1 сек)'}</span>
              </button>

              <span className="text-[11px] text-slate-500">
                Перевод без разрыва соединения
              </span>
            </div>

            {fallbackResult && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                {fallbackResult}
              </div>
            )}
          </div>
        </div>

        {/* Law 99-Z & NCZPD Compliance Card */}
        <div className="lg:col-span-6 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Закон № 99-З и защита ПДн (НЦЗПД)
                </h3>
                <p className="text-xs text-slate-500">
                  Хранение в Беларуси и защита от трансграничной утечки
                </p>
              </div>
            </div>

            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Комплаенс РБ
            </span>
          </div>

          <div className="space-y-3">
            {/* PII Masking Toggle */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="space-y-0.5 max-w-[80%]">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <LockClosed className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Шлюз анонимизации (PII Masking)</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  ФИО, телефоны и диагнозы заменяются токенами перед обращением к AI
                </div>
              </div>

              <input
                type="checkbox"
                checked={localSip.piiMaskingEnabled}
                onChange={(e) => setLocalSip({ ...localSip, piiMaskingEnabled: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
            </div>

            {/* Audio Disclaimer */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-700">
                  Обязательный дисклеймер НЦЗПД о записи:
                </label>
                <input
                  type="checkbox"
                  checked={localSip.recordingDisclaimerEnabled}
                  onChange={(e) => setLocalSip({ ...localSip, recordingDisclaimerEnabled: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300"
                />
              </div>
              <input
                type="text"
                value={localSip.disclaimerText}
                onChange={(e) => setLocalSip({ ...localSip, disclaimerText: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={handleDownloadDpa}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Скачать шаблон DPA (договор ПДн)</span>
              </button>

              <span className="text-[11px] font-mono text-emerald-700 font-semibold">
                Серверы: beCloud / Hoster.by
              </span>
            </div>

            {downloadDpaNotice && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                Типовое поручение на обработку персональных данных (Соглашение DPA) сформировано и готово для ваших юристов.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Row 3: Two-Tier CRM Integrations (Tier 1 Cloud vs Tier 2 1C/Telegram) */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <GridIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Двухуровневая модель CRM / ERP интеграций
              </h3>
              <p className="text-xs text-slate-500">
                Прямая онлайн-запись в облако (Tier 1) или мгновенный Telegram-мост для локальных 1С (Tier 2)
              </p>
            </div>
          </div>

          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
            Zero-Setup за 15 мин
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Tier 1: Cloud SaaS (YCLIENTS, DIKIDI, Altegio, Bitrix24) */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  Уровень 1: Облачные CRM
                </span>
                <h4 className="text-xs font-bold text-slate-900 mt-1">
                  Прямая синхронизация календаря
                </h4>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {(['yclients', 'dikidi', 'altegio', 'bitrix24'] as const).map((crm) => (
                <button
                  key={crm}
                  type="button"
                  onClick={() => setActiveTier1Crm(crm)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold uppercase transition-all ${
                    activeTier1Crm === crm
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {crm}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                API Ключ / Токен компании ({activeTier1Crm.toUpperCase()}):
              </label>
              <input
                type="password"
                value={crmApiKey}
                onChange={(e) => setCrmApiKey(e.target.value)}
                placeholder="Подключается через защищённый сервер"
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs font-mono focus:outline-none focus:border-blue-600"
              />
            </div>

            <p className="text-[11px] text-slate-500">
              Бот автоматически видит свободные окна мастеров/подъемников и создает запись без участия человека.
            </p>
          </div>

          {/* Tier 2: Bridge for 1C & Telegram */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Уровень 2: Мост для локальных 1С
                </span>
                <h4 className="text-xs font-bold text-slate-900 mt-1">
                  1С:Автосервис, 1С:Медицина, АвтоДилер
                </h4>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Канал мгновенных уведомлений о заявках:
              </label>
              <input
                type="text"
                value={localTg.chatId}
                onChange={(e) => setLocalTg({ ...localTg, chatId: e.target.value })}
                placeholder="ID Telegram-чата приемки или группы"
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs font-mono focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleTestTg}
                disabled={isTestingTg}
                className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-black transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isTestingTg ? 'Подготовка...' : 'Показать тестовый лид'}</span>
              </button>

              <span className="text-[11px] text-emerald-700 font-semibold">
                Без доработки конфигурации 1С
              </span>
            </div>

            {showTgPreview && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1 font-mono">
                <div className="font-bold">🚗 Новый лид для мастера приёмки:</div>
                <div>Клиент: Максим Ковалёв (+375 29 682-14-99)</div>
                <div>Авто: VW Passat B8 • Проблема: стук спереди на кочках</div>
                <div>Запись: сегодня в 18:30 (бокс №2)</div>
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
};
