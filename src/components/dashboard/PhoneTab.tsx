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
  const [connectionType, setConnectionType] = useState<'forwarding' | 'sip'>(
    sipSettings.sipLogin ? 'sip' : 'forwarding'
  );

  const [localSip, setLocalSip] = useState<SipSettings>({
    ...sipSettings,
    byoSipMode: sipSettings.byoSipMode ?? true,
    fallbackEnabled: sipSettings.fallbackEnabled ?? true,
    fallbackPhone: sipSettings.fallbackPhone || agent.phone || '+375 (29) 700-11-22',
    transferPhone: sipSettings.transferPhone || sipSettings.fallbackPhone || agent.phone || '+375 (29) 700-11-22',
    whisperMessage:
      sipSettings.whisperMessage ||
      'Секунду, перевожу звонок на дежурного менеджера, пожалуйста, оставайтесь на линии...',
    recordingDisclaimerEnabled: sipSettings.recordingDisclaimerEnabled ?? true,
    disclaimerText:
      sipSettings.disclaimerText ||
      'Для контроля качества обслуживания наш разговор записывается.'
  });

  const [showSipPassword, setShowSipPassword] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Testing states
  const [isTestingSip, setIsTestingSip] = useState(false);
  const [sipTestResult, setSipTestResult] = useState<{ ok: boolean; message: string; latencyMs?: number } | null>(null);

  const [isTestingTransfer, setIsTestingTransfer] = useState(false);
  const [transferTestResult, setTransferTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const voxiGatewayNumber = '+375 (17) 388-77-90';

  const handleCopyGateway = () => {
    navigator.clipboard.writeText('+375173887790');
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2500);
  };

  const handleTestSip = async () => {
    setIsTestingSip(true);
    setSipTestResult(null);
    const result = await testSipNode({
      sipServer: localSip.sipServer,
      sipLogin: localSip.sipLogin,
      callerId: localSip.callerId || localSip.sipLogin
    });
    setIsTestingSip(false);
    setSipTestResult(result);
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

      {/* CARD 1: Как принимать звонки (Способ подключения) */}
      <div className="p-5 sm:p-6 rounded-[16px] liquid-glass-card space-y-5">
        <div>
          <h3 className="text-sm font-medium text-black">
            1. Как бот должен принимать звонки
          </h3>
          <p className="text-xs text-[#777169] mt-0.5">
            Выберите удобный вариант подключения телефонного номера вашей компании
          </p>
        </div>

        {/* Selection Tabs: Переадресация vs Прямой SIP */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setConnectionType('forwarding')}
            className={`p-4 rounded-[12px] text-left transition-all border cursor-pointer ${
              connectionType === 'forwarding'
                ? 'bg-black text-white border-black shadow-xs'
                : 'liquid-glass-cream text-black border-black/[0.06] hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium">Переадресация звонков</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                connectionType === 'forwarding' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}>
                Рекомендуем
              </span>
            </div>
            <p className={`text-[11px] leading-relaxed ${connectionType === 'forwarding' ? 'text-white/80' : 'text-[#777169]'}`}>
              Ваш номер не меняется. Клиенты звонят вам, а если линия занята или не берут трубку — отвечает бот.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setConnectionType('sip')}
            className={`p-4 rounded-[12px] text-left transition-all border cursor-pointer ${
              connectionType === 'sip'
                ? 'bg-black text-white border-black shadow-xs'
                : 'liquid-glass-cream text-black border-black/[0.06] hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium">Прямое подключение (SIP)</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                connectionType === 'sip' ? 'bg-white/20 text-white' : 'bg-black/[0.05] text-[#59544F]'
              }`}>
                Для виртуальных АТС
              </span>
            </div>
            <p className={`text-[11px] leading-relaxed ${connectionType === 'sip' ? 'text-white/80' : 'text-[#777169]'}`}>
              Подключение через логин и пароль от А1, МТС или Белтелеком напрямую в телефонию Voxi.
            </p>
          </button>
        </div>

        {/* Content for Переадресация */}
        {connectionType === 'forwarding' && (
          <div className="p-4 rounded-[12px] liquid-glass-cream border border-black/[0.06] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-[10px] bg-white border border-black/[0.08]">
              <div>
                <div className="text-[11px] text-[#777169]">Номер шлюза Voxi для переадресации:</div>
                <div className="text-base font-semibold text-black font-mono tracking-tight mt-0.5">
                  {voxiGatewayNumber}
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyGateway}
                className="px-3 py-1.5 rounded-[8px] bg-black/[0.05] hover:bg-black/[0.08] text-black text-xs font-medium inline-flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
              >
                {copiedNumber ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedNumber ? 'Скопировано!' : 'Скопировать номер'}</span>
              </button>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium text-black">Как включить переадресацию за 1 минуту:</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                <div className="p-2.5 rounded-[8px] bg-white border border-black/[0.06]">
                  <div className="font-semibold text-black mb-0.5">А1</div>
                  <div className="text-[#59544F]">
                    Наберите код: <code className="bg-black/[0.05] px-1 py-0.5 rounded font-mono font-semibold">**61*+375173887790#</code> или включите в приложении «Мой А1».
                  </div>
                </div>

                <div className="p-2.5 rounded-[8px] bg-white border border-black/[0.06]">
                  <div className="font-semibold text-black mb-0.5">МТС</div>
                  <div className="text-[#59544F]">
                    Наберите код: <code className="bg-black/[0.05] px-1 py-0.5 rounded font-mono font-semibold">**61*+375173887790#</code> или в приложении «Мой МТС».
                  </div>
                </div>

                <div className="p-2.5 rounded-[8px] bg-white border border-black/[0.06]">
                  <div className="font-semibold text-black mb-0.5">Белтелеком (городской)</div>
                  <div className="text-[#59544F]">
                    В кабинете «Мой Белтелеком» в разделе «Переадресация при не ответе» укажите номер шлюза.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content for SIP */}
        {connectionType === 'sip' && (
          <div className="p-4 rounded-[12px] liquid-glass-cream border border-black/[0.06] space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-black block">
                Выберите вашего оператора:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {sipProviders.map((p) => {
                  const isSelected = localSip.provider === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() =>
                        setLocalSip({
                          ...localSip,
                          provider: p.id,
                          sipServer: p.server
                        })
                      }
                      className={`p-2.5 rounded-[8px] text-xs font-medium text-center border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-black border-black/[0.08] hover:border-black/20'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-black block mb-1">
                  SIP Сервер / Адрес АТС
                </label>
                <input
                  type="text"
                  value={localSip.sipServer}
                  onChange={(e) => setLocalSip({ ...localSip, sipServer: e.target.value })}
                  placeholder="sip.mts.by:5060"
                  className="w-full px-3 py-2 rounded-[8px] bg-white border border-black/[0.12] text-xs text-black font-mono focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-black block mb-1">
                  SIP Логин / Номер линии
                </label>
                <input
                  type="text"
                  value={localSip.sipLogin}
                  onChange={(e) => setLocalSip({ ...localSip, sipLogin: e.target.value })}
                  placeholder="37529XXXXXXX"
                  className="w-full px-3 py-2 rounded-[8px] bg-white border border-black/[0.12] text-xs text-black font-mono focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-medium text-black">
                    SIP Пароль
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowSipPassword(!showSipPassword)}
                    className="text-[10px] text-[#777169] hover:text-black flex items-center gap-1 cursor-pointer"
                  >
                    {showSipPassword ? <EyeClosedIcon className="w-3 h-3" /> : <EyeIcon className="w-3 h-3" />}
                    <span>{showSipPassword ? 'Скрыть' : 'Показать'}</span>
                  </button>
                </div>
                <input
                  type={showSipPassword ? 'text' : 'password'}
                  value={localSip.sipPassword || ''}
                  onChange={(e) => setLocalSip({ ...localSip, sipPassword: e.target.value })}
                  placeholder="Пароль от телефонии"
                  className="w-full px-3 py-2 rounded-[8px] bg-white border border-black/[0.12] text-xs text-black font-mono focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-black block mb-1">
                  АОН (Caller ID для исходящих)
                </label>
                <input
                  type="text"
                  value={localSip.callerId || ''}
                  onChange={(e) => setLocalSip({ ...localSip, callerId: e.target.value })}
                  placeholder="+375 (29) ..."
                  className="w-full px-3 py-2 rounded-[8px] bg-white border border-black/[0.12] text-xs text-black font-mono focus:outline-none focus:border-black"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-black/[0.06]">
              <button
                type="button"
                onClick={handleTestSip}
                disabled={isTestingSip}
                className="px-3.5 py-1.5 rounded-[8px] bg-white hover:bg-black/[0.04] text-black border border-black/[0.12] text-xs font-medium inline-flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingSip ? 'animate-spin' : ''}`} />
                <span>{isTestingSip ? 'Проверяем связь с АТС...' : 'Проверить подключение SIP'}</span>
              </button>

              {sipTestResult && (
                <span className={`text-[11px] font-medium flex items-center gap-1 ${
                  sipTestResult.ok ? 'text-emerald-700' : 'text-rose-600'
                }`}>
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{sipTestResult.message}</span>
                </span>
              )}
            </div>
          </div>
        )}
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
            <label htmlFor="staff-phone" className="text-xs font-medium text-black block mb-1">
              Номер телефона администратора / мастера
            </label>
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
            <label htmlFor="staff-whisper" className="text-xs font-medium text-black block mb-1">
              Что бот скажет клиенту перед переводом
            </label>
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
