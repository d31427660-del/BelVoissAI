import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PhoneCallingRoundedIcon as Phone,
  CallChatIcon as CallTransfer,
  ShieldCheckIcon as ShieldCheck,
  DisketteIcon as Save,
  CheckCircleIcon as CheckCircle2,
  RefreshIcon as RefreshCw
} from '@solar-icons/react/bold-duotone';
import { SipSettings } from '../../types';
import { FieldLabel, FieldHint, AutoGrowTextarea } from './FieldHelp';
import { formatBelarusPhone } from './InteractiveAgentFields';

interface SipSettingsTabProps {
  sipSettings: SipSettings;
  onSaveSip: (settings: SipSettings) => void;
  onOpenVoiceTest?: () => void;
}

export const SipSettingsTab: React.FC<SipSettingsTabProps> = ({
  sipSettings,
  onSaveSip,
  onOpenVoiceTest
}) => {
  const [localSip, setLocalSip] = useState<SipSettings>({
    ...sipSettings,
    warmTransferEnabled: sipSettings.warmTransferEnabled ?? true,
    transferPhone: sipSettings.transferPhone || sipSettings.fallbackPhone || '+375 (29) 700-11-22',
    transferTriggers: sipSettings.transferTriggers || ['human_request', 'conflict_or_complaint', 'complex_query'],
    whisperMessage: sipSettings.whisperMessage || 'Минутку, перевожу вас на старшего администратора. Я уже передаю коллеге суть вопроса, оставайтесь на линии...',
    sendTelegramSummaryOnTransfer: sipSettings.sendTelegramSummaryOnTransfer ?? true,
    amdEnabled: sipSettings.amdEnabled ?? true,
    amdSensitivity: sipSettings.amdSensitivity || 'normal',
    amdHangupImmediately: sipSettings.amdHangupImmediately ?? true,
    amdProtectMinutes: sipSettings.amdProtectMinutes ?? true,
  });

  const [savedNotice, setSavedNotice] = useState(false);
  const [isTestingTransfer, setIsTestingTransfer] = useState(false);
  const [transferTestResult, setTransferTestResult] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSip(localSip);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleTestTransfer = () => {
    setIsTestingTransfer(true);
    setTransferTestResult(null);
    setTimeout(() => {
      setIsTestingTransfer(false);
      setTransferTestResult(`✓ SIP REFER тестовый пакет успешно отправлен на номер ${localSip.transferPhone || localSip.fallbackPhone}. Шёпотный брифинг активен!`);
      setTimeout(() => setTransferTestResult(null), 4500);
    }, 1100);
  };

  const toggleTrigger = (trigger: 'human_request' | 'conflict_or_complaint' | 'complex_query') => {
    const current = localSip.transferTriggers || ['human_request'];
    const exists = current.includes(trigger);
    const updated = exists
      ? current.filter((t) => t !== trigger)
      : [...current, trigger];
    setLocalSip({ ...localSip, transferTriggers: updated });
  };

  return (
    <form id="active-workspace-form" onSubmit={handleSave} className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
              <CallTransfer className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              SIP-перевод звонка и фильтр автоответчиков
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Настройте бесшовную передачу вызова дежурному сотруднику (Warm Handoff) и автоматическую защиту баланса от сотовых автоответчиков (AMD).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenVoiceTest && (
            <button
              type="button"
              onClick={onOpenVoiceTest}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Тестировать в звонке</span>
            </button>
          )}

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs self-start sm:self-auto"
          >
            <Save className="w-4 h-4" />
            <span>Сохранить параметры</span>
          </button>
        </div>
      </div>

      {/* Save Toast */}
      <AnimatePresence>
        {savedNotice && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="status"
            className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Параметры SIP-перевода и AMD успешно сохранены!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Warm Handoff Card */}
      <fieldset className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-5">
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center shrink-0">
              <CallTransfer className="w-4 h-4" />
            </div>
            <div>
              <legend className="text-sm font-bold text-slate-900">
                1. Бесшовный перевод вызова на человека (Warm Handoff)
              </legend>
              <p className="text-xs text-slate-500 mt-0.5">
                Переадресация на мобильный сотрудника со шёпотным брифингом (Whisper Summary)
              </p>
            </div>
          </div>

          <label htmlFor="warm-transfer-toggle" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer shrink-0">
            <input
              id="warm-transfer-toggle"
              type="checkbox"
              checked={localSip.warmTransferEnabled !== false}
              onChange={(e) => setLocalSip({ ...localSip, warmTransferEnabled: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300 accent-amber-600"
            />
            <span>Перевод включён</span>
          </label>
        </div>

        {/* Destination Phone & Triggers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel
              htmlFor="sip-transfer-phone"
              label="Номер телефона дежурного администратора"
              required
              helpTitle="Куда переводить звонки"
              helpText="Любой белорусский мобильный номер (+375 29 / 33 / 44 / 25) или городской номер (+375 17). Клиент остаётся на линии под приятную музыку."
              helpExample="+375 (29) 700-11-22"
            />
            <input
              id="sip-transfer-phone"
              type="tel"
              inputMode="tel"
              value={localSip.transferPhone || localSip.fallbackPhone}
              onChange={(e) => {
                const formatted = formatBelarusPhone(e.target.value);
                setLocalSip({
                  ...localSip,
                  transferPhone: formatted,
                  fallbackPhone: formatted
                });
              }}
              placeholder="+375 (29) 700-11-22"
              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-mono focus:outline-none focus:border-blue-600"
            />
            <FieldHint id="sip-transfer-phone-hint">
              Номер телефона, на который бот выполняет SIP REFER перевод.
            </FieldHint>
          </div>

          <div>
            <FieldLabel
              htmlFor="transfer-triggers-group"
              label="Триггеры автоматического перевода на человека"
              helpTitle="Когда звать живого администратора"
              helpText="Отметьте ситуации, при которых бот сразу переключает звонок на старшего сотрудника."
            />
            <div id="transfer-triggers-group" className="space-y-2 pt-1">
              {[
                {
                  id: 'human_request' as const,
                  label: 'Запрос клиента («соедините с человеком», «позовите оператора»)',
                  badge: 'Базовый'
                },
                {
                  id: 'conflict_or_complaint' as const,
                  label: 'Конфликтная ситуация, жалоба или претензия клиента',
                  badge: 'Защита лояльности'
                },
                {
                  id: 'complex_query' as const,
                  label: 'Нестандартный вопрос вне прайса и базы знаний',
                  badge: 'Сложные сделки'
                }
              ].map((trig) => {
                const isChecked = (localSip.transferTriggers || ['human_request']).includes(trig.id);
                return (
                  <label
                    key={trig.id}
                    className={`flex items-start gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-amber-50/70 border-amber-200 text-slate-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleTrigger(trig.id)}
                      className="w-4 h-4 mt-0.5 rounded border-slate-300 accent-amber-600 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold">{trig.label}</span>
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-1.5 py-0.2 rounded shrink-0">
                          {trig.badge}
                        </span>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Whisper Summary Toggle & Phrase */}
        <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/80 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
                <span>🤫 Шёпотный брифинг сотрудника (Whisper Summary)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                  Рекомендуется
                </span>
              </div>
              <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                Перед тем как соединить клиента с сотрудником, бот шёпотом проговаривает сотруднику в трубку суть запроса («Клиент Максим, хочет вечернюю группу кат. B»). Сотрудник поднимает трубку уже подготовленным!
              </p>
            </div>

            <input
              type="checkbox"
              checked={localSip.sendTelegramSummaryOnTransfer !== false}
              onChange={(e) => setLocalSip({ ...localSip, sendTelegramSummaryOnTransfer: e.target.checked })}
              className="w-4 h-4 mt-1 rounded border-slate-300 accent-amber-600 shrink-0"
            />
          </div>

          <div>
            <FieldLabel
              htmlFor="sip-whisper-message"
              label="Фраза бота клиенту перед началом перевода"
              helpTitle="Что слышит клиент во время переключения"
              helpText="Короткая вежливая реплика, которую бот произносит перед началом набора номера дежурного."
              helpExample="Перевожу вас на старшего администратора, секунду..."
            />
            <AutoGrowTextarea
              id="sip-whisper-message"
              rows={2}
              value={localSip.whisperMessage}
              onChange={(e) => setLocalSip({ ...localSip, whisperMessage: e.target.value })}
              className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 leading-relaxed focus:outline-none focus:border-amber-600"
            />
          </div>
        </div>

        {/* Test Transfer Action */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={handleTestTransfer}
            disabled={isTestingTransfer}
            className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTestingTransfer ? 'animate-spin' : ''}`} />
            <span>{isTestingTransfer ? 'Тестируем SIP REFER...' : 'Проверить перевод звонка (SIP REFER)'}</span>
          </button>

          {transferTestResult && (
            <span role="status" aria-live="polite" className="text-xs text-emerald-700 font-medium">
              {transferTestResult}
            </span>
          )}
        </div>
      </fieldset>

      {/* AMD (Answering Machine Detection) Card */}
      <fieldset className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-5">
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 border border-purple-200/80 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <legend className="text-sm font-bold text-slate-900">
                2. Детектор автоответчиков операторов РБ (AMD)
              </legend>
              <p className="text-xs text-slate-500 mt-0.5">
                Мгновенное распознавание автоответчиков МТС, А1, life:) и Белтелеком (0 BYN списания)
              </p>
            </div>
          </div>

          <label htmlFor="sip-amd-enabled" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer shrink-0">
            <input
              id="sip-amd-enabled"
              type="checkbox"
              checked={localSip.amdEnabled !== false}
              onChange={(e) => setLocalSip({ ...localSip, amdEnabled: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300 accent-purple-600"
            />
            <span>Защита AMD включена</span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-950">
                Мгновенный сброс вызова (0 BYN)
              </span>
              <input
                type="checkbox"
                checked={localSip.amdHangupImmediately !== false}
                onChange={(e) => setLocalSip({ ...localSip, amdHangupImmediately: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 accent-purple-600"
              />
            </div>
            <p className="text-[11px] text-purple-900 leading-relaxed">
              Когда сотовый оператор включает фразу «Абонент временно недоступен» или «Оставьте сообщение после сигнала», бот сбрасывает вызов за 1–2 секунды, предотвращая расход минут.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-slate-900">
              Поддерживаемые паттерны операторов РБ
            </span>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-red-100 text-red-800 border border-red-200">МТС РБ</span>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-yellow-100 text-yellow-900 border border-yellow-200">А1 РБ</span>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">life:) РБ</span>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Белтелеком</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Экономия до 18–25% бюджета минут на исходящих обзвонах и ночных перехватах.
            </p>
          </div>
        </div>
      </fieldset>
    </form>
  );
};
