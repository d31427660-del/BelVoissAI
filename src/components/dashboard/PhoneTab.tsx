import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PhoneCallingRoundedIcon as Phone,
  CallChatIcon as CallTransfer,
  CheckCircleIcon as CheckCircle2,
  DisketteIcon as Save,
  CopyIcon as Copy,
  ShieldCheckIcon as ShieldCheck,
  RefreshIcon as RefreshCw,
  EyeIcon,
  EyeClosedIcon,
  AltArrowDownIcon as ChevronDown
} from '@solar-icons/react/bold-duotone';
import { AgentConfig, SipSettings } from '../../types';
import { testSipNode, testFallbackPhone } from '../../lib/vapiService';
import { FieldLabel, FieldHint } from './FieldHelp';

interface PhoneTabProps {
  agent: AgentConfig;
  onSaveAgent: (agent: AgentConfig) => void;
  sipSettings: SipSettings;
  onSaveSip: (settings: SipSettings) => void;
}

export const PhoneTab: React.FC<PhoneTabProps> = ({
  agent,
  onSaveAgent,
  sipSettings,
  onSaveSip
}) => {
  const [localSip, setLocalSip] = useState<SipSettings>({
    ...sipSettings,
    assignedDid: sipSettings.assignedDid || '+375 (44) 500-10-01',
    byoSipMode: false,
    fallbackEnabled: sipSettings.fallbackEnabled ?? true,
    fallbackPhone: sipSettings.fallbackPhone || agent.phone || '',
    transferPhone: sipSettings.transferPhone || sipSettings.fallbackPhone || agent.phone || '',
    whisperMessage:
      sipSettings.whisperMessage ||
      'Секунду, перевожу звонок на дежурного менеджера, пожалуйста, оставайтесь на линии...',
    recordingDisclaimerEnabled: sipSettings.recordingDisclaimerEnabled ?? true,
    disclaimerText:
      sipSettings.disclaimerText ||
      'Для контроля качества обслуживания наш разговор записывается.'
  });

  const [copiedUssd, setCopiedUssd] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [isTestingTransfer, setIsTestingTransfer] = useState(false);
  const [transferTestResult, setTransferTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const assignedGatewayNumber = localSip.assignedDid?.trim() || '+375 (44) 500-10-01';
  const assignedGatewayE164 = '+' + (assignedGatewayNumber.replace(/\D+/g, '') || '375445001001');
  const ussdNoAnswer = `**61*${assignedGatewayE164}**10#`;
  const ussdAlways = `**21*${assignedGatewayE164}#`;

  const handleCopyUssd = (code: string) => {
    try {
      void navigator.clipboard.writeText(code);
      setCopiedUssd(code);
      setTimeout(() => setCopiedUssd(null), 2000);
    } catch {
      // ignore
    }
  };

  const handleTestTransfer = async () => {
    setIsTestingTransfer(true);
    setTransferTestResult(null);
    const targetPhone = localSip.transferPhone || localSip.fallbackPhone;
    const result = await testFallbackPhone({
      fallbackPhone: targetPhone
    });
    setIsTestingTransfer(false);
    setTransferTestResult(result);
  };

  const handleSave = (e?: React.FormEvent) => {
    e?.preventDefault();
    onSaveSip(localSip);
    if (localSip.transferPhone && localSip.transferPhone !== agent.phone) {
      onSaveAgent({
        ...agent,
        phone: localSip.transferPhone,
        updatedAt: new Date().toISOString()
      });
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const sipProviders = [
    { id: 'mts' as const, label: 'МТС Беларусь', server: 'sip.mts.by:5060' },
    { id: 'a1' as const, label: 'А1 (Виртуальная АТС)', server: 'sip.a1.by:5060' },
    { id: 'beltelecom' as const, label: 'Белтелеком (IMS/Максифон)', server: 'ims.beltelecom.by:5060' },
    { id: 'custom' as const, label: 'Другой оператор', server: 'sip.provider.by:5060' }
  ];

  return (
    <form id="active-workspace-form" onSubmit={handleSave} className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/[0.08]">
        <div>
          <h2 className="text-xl font-medium text-black tracking-tight">
            Подключение номера
          </h2>
          <p className="text-xs text-[#777169] mt-0.5">
            Настройте, как бот принимает входящие звонки и на какой номер переводит клиента
          </p>
        </div>

        <button
          type="submit"
          className="liquid-glass-btn-primary px-5 py-2.5 rounded-[12px] text-xs font-medium text-white flex items-center justify-center gap-2 cursor-pointer shadow-xs self-start sm:self-auto"
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
            className="p-3.5 rounded-[12px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Настройки телефонии сохранены! Номер готов к работе.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CARD 1: Как принимать звонки (Переадресация через ВАТС А1) */}
      <div className="p-5 sm:p-6 rounded-[16px] liquid-glass-card space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-black/[0.08]">
          <div>
            <h3 className="text-sm font-medium text-black">
              1. Подключение телефонного номера
            </h3>
            <p className="text-xs text-[#777169] mt-0.5">
              Менять номер в рекламе не нужно — вызовы переадресуются на персональный шлюз Voxi (Виртуальная АТС А1)
            </p>
          </div>
          <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 self-start">
            Шлюз А1 ВАТС готов
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel
              htmlFor="caller-id"
              label="Ваш рабочий номер телефона"
              helpTitle="Какой номер указывать"
              helpText="Укажите действующий номер компании, на который звонят клиенты с сайта, карт или рекламы."
              helpExample="+375 (29) 600-10-20"
            />
            <input
              id="caller-id"
              type="text"
              value={localSip.callerId || ''}
              onChange={(e) => setLocalSip({ ...localSip, callerId: e.target.value })}
              placeholder="+375 (29) 600-10-20"
              className="w-full px-3 py-2 rounded-[8px] bg-white border border-black/[0.12] text-xs text-black font-mono focus:outline-none focus:border-black"
            />
            <p className="text-[11px] text-[#777169] mt-1">
              Ваш рекламный номер остаётся неизменным для всех клиентов.
            </p>
          </div>

          <div>
            <FieldLabel
              htmlFor="gateway-number"
              label="Персональный шлюз Voxi (Виртуальная АТС А1)"
              helpTitle="Номер голосового шлюза"
              helpText="Многоканальный номер в облачной Виртуальной АТС А1 платформы Voxi.by, закреплённый за вашей компанией."
            />
            <input
              id="gateway-number"
              type="text"
              readOnly
              value={assignedGatewayNumber}
              className="w-full px-3 py-2 rounded-[8px] bg-black/[0.04] border border-black/[0.12] text-xs text-black font-mono font-bold focus:outline-none"
            />
            <p className="text-[11px] text-[#777169] mt-1">
              Закреплён за вашей организацией в единой АТС Voxi.by.
            </p>
          </div>
        </div>

        {/* Инструкция по переадресации */}
        <div className="p-4 rounded-[12px] liquid-glass-cream border border-black/[0.06] space-y-3">
          <div className="text-xs font-medium text-black">
            Включение ИИ-администратора на вашем телефоне (наберите код с мобильного):
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-[10px] bg-white border border-black/[0.08] flex flex-col justify-between gap-2 shadow-2xs">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-black">Режим 1: Если не ответили за 10 сек</span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Рекомендуем
                  </span>
                </div>
                <p className="text-[11px] text-[#777169] mt-1 leading-relaxed">
                  Сначала звонит ваш телефон. Если менеджер занят или не поднял трубку за 10 секунд — отвечает ИИ.
                </p>
              </div>
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-black/[0.06]">
                <code className="text-xs font-mono font-bold text-black bg-black/[0.05] px-2 py-1 rounded">
                  {ussdNoAnswer}
                </code>
                <button
                  type="button"
                  onClick={() => handleCopyUssd(ussdNoAnswer)}
                  className="px-2.5 py-1 rounded-[6px] bg-black/[0.06] hover:bg-black/[0.1] text-black text-[11px] font-medium transition-colors cursor-pointer"
                >
                  {copiedUssd === ussdNoAnswer ? '✓ Скопировано' : 'Скопировать код'}
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-[10px] bg-white border border-black/[0.08] flex flex-col justify-between gap-2 shadow-2xs">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-black">Режим 2: Все звонки сразу на ИИ 24/7</span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    Автопилот
                  </span>
                </div>
                <p className="text-[11px] text-[#777169] mt-1 leading-relaxed">
                  ИИ отвечает мгновенно на каждый звонок и переключает на человека только по прямой просьбе клиента.
                </p>
              </div>
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-black/[0.06]">
                <code className="text-xs font-mono font-bold text-black bg-black/[0.05] px-2 py-1 rounded">
                  {ussdAlways}
                </code>
                <button
                  type="button"
                  onClick={() => handleCopyUssd(ussdAlways)}
                  className="px-2.5 py-1 rounded-[6px] bg-black/[0.06] hover:bg-black/[0.1] text-black text-[11px] font-medium transition-colors cursor-pointer"
                >
                  {copiedUssd === ussdAlways ? '✓ Скопировано' : 'Скопировать код'}
                </button>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-[#777169] pt-1">
            Наберите код на смартфоне и нажмите кнопку вызова. Для отмены переадресации наберите <code className="font-mono font-semibold text-black">##002#</code>.
          </div>
        </div>
      </div>

      {/* CARD 2: Перевод звонка на сотрудника */}
      <div className="p-5 sm:p-6 rounded-[16px] liquid-glass-card space-y-4">
        <div>
          <h3 className="text-sm font-medium text-black">
            2. Перевод звонка на сотрудника
          </h3>
          <p className="text-xs text-[#777169] mt-0.5">
            Если клиент попросит человека или бот поймет, что вопрос требует живого участия
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel
              htmlFor="staff-phone"
              label="Номер телефона администратора / мастера"
              required
              helpTitle="Куда переводить звонок"
              helpText="Укажите номер дежурного менеджера или мастера в Беларуси (+375). Если звонящий скажет «соедините с человеком» или у него возникнет сложный нестандартный вопрос, бот мгновенно переведет звонок на этот номер."
              helpExample="+375 (29) 111-22-33"
            />
            <input
              id="staff-phone"
              type="text"
              value={localSip.transferPhone}
              onChange={(e) => setLocalSip({ ...localSip, transferPhone: e.target.value })}
              placeholder="+375 (29) 111-22-33"
              className="w-full px-3 py-2 rounded-[8px] bg-white border border-black/[0.12] text-xs text-black font-mono focus:outline-none focus:border-black"
            />
            <p className="text-[11px] text-[#777169] mt-1">
              На этот номер поступит вызов при переводе.
            </p>
          </div>

          <div>
            <FieldLabel
              htmlFor="staff-whisper"
              label="Что бот скажет клиенту перед переводом"
              helpTitle="Фраза перед переводом"
              helpText="Эту фразу бот вежливо произнесет клиенту в трубку, пока соединяет звонок с вашим сотрудником."
              helpExample="Секунду, перевожу звонок на администратора..."
            />
            <input
              id="staff-whisper"
              type="text"
              value={localSip.whisperMessage}
              onChange={(e) => setLocalSip({ ...localSip, whisperMessage: e.target.value })}
              placeholder="Секунду, перевожу звонок на администратора..."
              className="w-full px-3 py-2 rounded-[8px] bg-white border border-black/[0.12] text-xs text-black focus:outline-none focus:border-black"
            />
            <p className="text-[11px] text-[#777169] mt-1">
              Эту фразу клиент услышит в трубке перед соединением.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-black/[0.06]">
          <button
            type="button"
            onClick={handleTestTransfer}
            disabled={isTestingTransfer}
            className="px-3.5 py-1.5 rounded-[8px] bg-white hover:bg-black/[0.04] text-black border border-black/[0.12] text-xs font-medium inline-flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <CallTransfer className="w-3.5 h-3.5 text-black" />
            <span>{isTestingTransfer ? 'Проверяем доступность номера...' : 'Проверить номер перевода'}</span>
          </button>

          {transferTestResult && (
            <span className={`text-[11px] font-medium flex items-center gap-1 ${
              transferTestResult.ok ? 'text-emerald-700' : 'text-rose-600'
            }`}>
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{transferTestResult.message}</span>
            </span>
          )}
        </div>
      </div>

      {/* CARD 3: Запись и безопасность (Disclosure) */}
      <details className="group rounded-[16px] liquid-glass-card overflow-hidden">
        <summary className="p-4 sm:p-5 flex items-center justify-between text-xs font-medium text-black hover:bg-black/[0.02] cursor-pointer list-none transition-colors">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Запись разговоров и Закон 99-З о защите персональных данных</span>
          </div>
          <ChevronDown className="w-4 h-4 text-[#777169] transition-transform group-open:rotate-180" />
        </summary>

        <div className="p-5 pt-3 border-t border-black/[0.06] space-y-4 liquid-glass-cream">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-black">Предупреждать клиента о записи разговора</div>
              <div className="text-[11px] text-[#777169]">Бот произнесет эту фразу в начале звонка</div>
            </div>
            <input
              type="checkbox"
              checked={localSip.recordingDisclaimerEnabled}
              onChange={(e) => setLocalSip({ ...localSip, recordingDisclaimerEnabled: e.target.checked })}
              className="w-4 h-4 rounded accent-black"
            />
          </div>

          {localSip.recordingDisclaimerEnabled && (
            <div>
              <label className="text-[11px] font-medium text-black block mb-1">
                Фраза предупреждения
              </label>
              <input
                type="text"
                value={localSip.disclaimerText}
                onChange={(e) => setLocalSip({ ...localSip, disclaimerText: e.target.value })}
                className="w-full px-3 py-2 rounded-[8px] bg-white border border-black/[0.12] text-xs text-black focus:outline-none focus:border-black"
              />
            </div>
          )}

          <div className="p-3 rounded-[8px] bg-white border border-black/[0.06] text-[11px] text-[#59544F] leading-relaxed">
            Серверы Voxi размещены на территории Республики Беларусь, все записи диалогов шифруются и соответствуют требованиям НЦЗПД и Закону РБ № 99-З «О защите персональных данных».
          </div>
        </div>
      </details>
    </form>
  );
};
