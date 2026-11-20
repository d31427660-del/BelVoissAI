import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PhoneCallingRoundedIcon as Phone,
  CallChatIcon as CallTransfer,
  CheckCircleIcon as CheckCircle2,
  DisketteIcon as Save,
  ShieldCheckIcon as ShieldCheck,
  RefreshIcon as RefreshCw,
  EyeIcon,
  EyeClosedIcon,
  AltArrowDownIcon as ChevronDown
} from '@solar-icons/react/bold-duotone';
import { AgentConfig, SipSettings, UserSession } from '../../types';
import { testSipNode, testFallbackPhone } from '../../lib/vapiService';
import { CopyButton } from '@/components/motion';
import { ispUpdateNumberRentalMode } from '../../lib/ispDbClient';
import { FieldLabel } from './FieldHelp';

interface PhoneTabProps {
  agent: AgentConfig;
  onSaveAgent: (agent: AgentConfig) => Promise<void> | void;
  sipSettings: SipSettings;
  onSaveSip: (settings: SipSettings) => Promise<void> | void;
  numberRentalMode?: 'own_sip' | 'rental';
  onUserUpdated?: (user: UserSession) => void;
}

const INPUT_CLASS =
  'w-full px-4 py-2.5 min-h-[42px] rounded-[12px] bg-[#F5F5F5] focus:bg-white border border-black/[0.08] focus:border-black text-[13px] text-black placeholder:text-[#A3A3A3] focus:outline-none transition-colors';

const WHITE_INPUT_CLASS =
  'w-full px-4 py-2.5 min-h-[42px] rounded-[12px] bg-white border border-black/[0.1] focus:border-black text-[13px] text-black placeholder:text-[#A3A3A3] focus:outline-none transition-colors';

const nativeSwitchAttr = { switch: '' } as React.InputHTMLAttributes<HTMLInputElement>;

export const PhoneTab: React.FC<PhoneTabProps> = ({
  agent,
  onSaveAgent,
  sipSettings,
  onSaveSip,
  numberRentalMode,
  onUserUpdated
}) => {
  const resolvedOwnSip = numberRentalMode ? numberRentalMode === 'own_sip' : Boolean(sipSettings.byoSipMode ?? true);
  const [localSip, setLocalSip] = useState<SipSettings>({
    ...sipSettings,
    assignedDid: sipSettings.assignedDid || '',
    byoSipMode: resolvedOwnSip,
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

  useEffect(() => {
    setLocalSip((prev) => ({
      ...prev,
      ...sipSettings,
      byoSipMode: numberRentalMode ? numberRentalMode === 'own_sip' : Boolean(sipSettings.byoSipMode ?? prev.byoSipMode)
    }));
  }, [sipSettings, numberRentalMode]);

  const [rentalRequestNotice, setRentalRequestNotice] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showSipPassword, setShowSipPassword] = useState(false);
  const [isTestingSip, setIsTestingSip] = useState(false);
  const [sipTestResult, setSipTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const [isTestingTransfer, setIsTestingTransfer] = useState(false);
  const [transferTestResult, setTransferTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const assignedGatewayNumber = localSip.assignedDid?.trim() || '';
  const hasAssignedDid = assignedGatewayNumber !== '' && assignedGatewayNumber.replace(/\D+/g, '').length >= 9;
  const assignedGatewayE164 = hasAssignedDid ? '+' + assignedGatewayNumber.replace(/\D+/g, '') : '';
  const ussdNoAnswer = hasAssignedDid ? `**61*${assignedGatewayE164}**10#` : '';
  const ussdAlways = hasAssignedDid ? `**21*${assignedGatewayE164}#` : '';

  const handleSelectRentalMode = async (useOwnSip: boolean) => {
    const nextSip = { ...localSip, byoSipMode: useOwnSip };
    setLocalSip(nextSip);
    onSaveSip(nextSip);
    const freshUser = await ispUpdateNumberRentalMode(useOwnSip ? 'own_sip' : 'rental');
    if (freshUser && onUserUpdated) {
      onUserUpdated(freshUser);
    }
    if (!useOwnSip && !hasAssignedDid) {
      setRentalRequestNotice('Заявка на выделение номера А1 ВАТС отправлена менеджеру. Мы подключим номер в рабочее время (09:00–21:00).');
    } else {
      setRentalRequestNotice(null);
    }
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
    setValidationError(null);
    const transferDigits = (localSip.transferPhone || '').replace(/\D+/g, '');
    if (localSip.transferPhone?.trim() && (transferDigits.length < 9 || transferDigits.length > 15)) {
      setValidationError('Укажите корректный номер для перевода звонка (например, +375 29 123-45-67).');
      return;
    }
    onSaveSip(localSip);
    if (localSip.transferPhone && localSip.transferPhone !== agent.phone) {
      onSaveAgent({
        ...agent,
        phone: localSip.transferPhone,
        updatedAt: new Date().toISOString()
      });
    }
  };

  return (
    <form id="active-workspace-form" onSubmit={handleSave} className="space-y-6">
      {/* Editorial mono eyebrow rule */}
      <div className="flex items-center justify-between gap-4">
        <div className="inline-flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#737373]">
          <span className="w-1.5 h-1.5 rounded-full bg-black" />
          <span>Телефония РБ · А1 · МТС · Белтелеком</span>
        </div>
        <div className="hidden sm:block h-px flex-1 bg-black/[0.08]" />
        <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#737373]">
          {localSip.byoSipMode ? 'СВОЙ SIP · 0 BYN' : 'А1 ВАТС · 15 BYN'}
        </span>
      </div>

      {/* Top Dotted Obsidian Header */}
      <div className="voxi-dot-surface p-6 sm:p-8 rounded-[28px] text-white border border-black flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 font-mono text-[10.5px] uppercase tracking-[0.1em] text-[#6BFF91]">
            <Phone className="w-3.5 h-3.5" />
            <span>Телефония РБ (А1 · МТС · Белтелеком)</span>
          </div>
          <h1 className="font-display text-2xl sm:text-[30px] font-bold tracking-[-0.035em] leading-[1.1] text-white">
            Подключение номера
          </h1>
          <p className="text-[13px] text-white/70 max-w-xl">
            Настройте, как бот принимает входящие звонки и на какой номер переводит клиента при сложном вопросе.
          </p>
        </div>

        <button
          type="submit"
          className="h-10 px-5 rounded-full bg-[#6BFF91] hover:bg-[#52F07A] text-black text-[12.5px] font-semibold inline-flex items-center justify-center gap-2 cursor-pointer transition-colors self-start lg:self-center shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>Сохранить настройки</span>
        </button>
      </div>

      {/* Validation Error & Rental Request Notice */}
      {validationError && (
        <div role="alert" className="p-4 rounded-[18px] bg-[#FFF5F3] border border-[#FE432A]/40 text-[#991B1B] text-[13px] font-semibold">
          {validationError}
        </div>
      )}
      <AnimatePresence>
        {rentalRequestNotice && (
          <motion.div
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="p-4 rounded-[18px] bg-[#0A0A0A] text-white text-[13px] flex items-center gap-2.5 font-medium"
          >
            <CheckCircle2 className="w-4 h-4 text-[#6BFF91] shrink-0" />
            <span>{rentalRequestNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CARD 01: Как принимать звонки */}
      <section className="p-6 sm:p-7 rounded-[24px] bg-white border border-black/[0.08] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-black/[0.08]">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-[12px] bg-[#0A0A0A] text-[#6BFF91] flex items-center justify-center font-mono font-bold text-[12px] shrink-0">
              01
            </div>
            <div>
              <h2 className="font-display text-[17px] font-bold text-black tracking-[-0.02em]">
                Подключение телефонного номера
              </h2>
              <p className="text-[12.5px] text-[#737373]">
                Арендуйте готовый номер А1 ВАТС (15 BYN/мес) или подключите свою SIP-линию (0 BYN/мес)
              </p>
            </div>
          </div>

          <span
            className={`font-mono text-[11px] font-bold px-3 py-1 rounded-full shrink-0 self-start sm:self-auto ${
              localSip.byoSipMode ? 'bg-[#6BFF91] text-black' : 'bg-[#D8E738] text-black'
            }`}
          >
            {localSip.byoSipMode ? 'Свой SIP · 0 BYN/мес' : 'А1 ВАТС · 15 BYN/мес'}
          </span>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleSelectRentalMode(false)}
            className={`p-5 rounded-[20px] text-left transition-colors border cursor-pointer ${
              !localSip.byoSipMode
                ? 'bg-[#0A0A0A] text-white border-black'
                : 'bg-[#F5F5F5] text-black border-black/[0.06] hover:bg-[#EBEBEB]'
            }`}
          >
            <div className="flex items-center justify-between mb-2 gap-2">
              <span className="font-display text-[15px] font-bold">Аренда номера Voxi (А1 ВАТС)</span>
              <span
                className={`text-[10.5px] px-2.5 py-0.5 rounded-full font-mono font-bold whitespace-nowrap shrink-0 ${
                  !localSip.byoSipMode ? 'bg-[#D8E738] text-black' : 'bg-white text-black border border-black/[0.08]'
                }`}
              >
                15 BYN/мес
              </span>
            </div>
            <p className={`text-[12.5px] leading-relaxed ${!localSip.byoSipMode ? 'text-white/70' : 'text-[#525252]'}`}>
              Не нужно оформлять SIP у оператора. Просто включите переадресацию за 10 секунд на выданный вам номер.
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleSelectRentalMode(true)}
            className={`p-5 rounded-[20px] text-left transition-colors border cursor-pointer ${
              localSip.byoSipMode
                ? 'bg-[#0A0A0A] text-white border-black'
                : 'bg-[#F5F5F5] text-black border-black/[0.06] hover:bg-[#EBEBEB]'
            }`}
          >
            <div className="flex items-center justify-between mb-2 gap-2">
              <span className="font-display text-[15px] font-bold">Подключить свой SIP самостоятельно</span>
              <span
                className={`text-[10.5px] px-2.5 py-0.5 rounded-full font-mono font-bold whitespace-nowrap shrink-0 ${
                  localSip.byoSipMode ? 'bg-[#6BFF91] text-black' : 'bg-white text-black border border-black/[0.08]'
                }`}
              >
                0 BYN/мес
              </span>
            </div>
            <p className={`text-[12.5px] leading-relaxed ${localSip.byoSipMode ? 'text-white/70' : 'text-[#525252]'}`}>
              Для компаний со своей Виртуальной АТС А1, МТС или Белтелеком — платите только за минуты (0.45 BYN/мин).
            </p>
          </button>
        </div>

        {!localSip.byoSipMode ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
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
                  className={`${INPUT_CLASS} font-mono`}
                />
                <p className="text-[11.5px] text-[#737373] mt-1.5">
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
                  value={hasAssignedDid ? assignedGatewayNumber : 'Выделяется менеджером (до 15 мин)'}
                  className={`w-full px-4 py-2.5 min-h-[42px] rounded-[12px] border text-[13px] focus:outline-none ${
                    hasAssignedDid
                      ? 'bg-[#F5F5F5] border-black/[0.08] text-black font-mono font-bold'
                      : 'bg-[#D8E738]/35 border-black/[0.12] text-black font-semibold'
                  }`}
                />
                <p className="text-[11.5px] text-[#737373] mt-1.5">
                  {hasAssignedDid
                    ? 'Закреплён за вашей организацией в единой АТС Voxi.by.'
                    : 'Персональный номер А1 ВАТС назначается менеджером сразу после регистрации.'}
                </p>
              </div>
            </div>

            {/* USSD Instructions */}
            <div className="p-5 rounded-[20px] bg-[#F5F5F5] border border-black/[0.06] space-y-4">
              <div className="font-display text-[14px] font-bold text-black">
                Включение ИИ-администратора на вашем телефоне (наберите код с мобильного)
              </div>

              {hasAssignedDid ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div className="p-4 rounded-[16px] bg-white border border-black/[0.08] flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[13px] font-bold text-black">Режим 1: Если не ответили за 10 сек</span>
                          <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#6BFF91] text-black shrink-0">
                            Рекомендуем
                          </span>
                        </div>
                        <p className="text-[12px] text-[#525252] mt-1.5 leading-relaxed">
                          Сначала звонит ваш телефон. Если менеджер занят или не поднял трубку за 10 секунд — отвечает ИИ.
                        </p>
                      </div>
                      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 pt-3 border-t border-black/[0.06]">
                        <code className="text-[12px] font-mono font-bold text-black bg-[#F5F5F5] px-2.5 py-1 rounded-[8px] break-all select-all">
                          {ussdNoAnswer}
                        </code>
                        <CopyButton value={ussdNoAnswer} label="Скопировать" />
                      </div>
                    </div>

                    <div className="p-4 rounded-[16px] bg-white border border-black/[0.08] flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[13px] font-bold text-black">Режим 2: Все звонки на ИИ 24/7</span>
                          <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#F5F5F5] text-black border border-black/[0.08] shrink-0">
                            Автопилот
                          </span>
                        </div>
                        <p className="text-[12px] text-[#525252] mt-1.5 leading-relaxed">
                          ИИ отвечает мгновенно на каждый звонок и переключает на человека только по прямой просьбе клиента.
                        </p>
                      </div>
                      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 pt-3 border-t border-black/[0.06]">
                        <code className="text-[12px] font-mono font-bold text-black bg-[#F5F5F5] px-2.5 py-1 rounded-[8px] break-all select-all">
                          {ussdAlways}
                        </code>
                        <CopyButton value={ussdAlways} label="Скопировать" />
                      </div>
                    </div>
                  </div>

                  <div className="text-[12px] text-[#525252]">
                    Наберите код на смартфоне и нажмите кнопку вызова. Для отмены переадресации наберите{' '}
                    <code className="font-mono font-bold text-black bg-white px-1.5 py-0.5 rounded border border-black/[0.08]">
                      ##002#
                    </code>
                    .
                  </div>
                </>
              ) : (
                <div className="p-4 rounded-[16px] bg-white border border-black/[0.08] text-[13px] text-black leading-relaxed flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="font-bold">Персональный номер шлюза ещё не закреплён</div>
                    <p className="text-[12px] text-[#525252] mt-0.5">
                      USSD-коды переадресации появятся здесь автоматически сразу после выделения номера А1 ВАТС (обычно до 15 минут).
                    </p>
                  </div>
                  <a
                    href="https://t.me/voxi_manager"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 whitespace-nowrap h-9 px-4 rounded-full bg-black hover:bg-[#171717] text-white text-[12px] font-semibold inline-flex items-center justify-center transition-colors"
                  >
                    Написать @voxi_manager ↗
                  </a>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="p-5 rounded-[20px] bg-[#F5F5F5] border border-black/[0.06] space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel
                  htmlFor="sip-server"
                  label="SIP Сервер / Адрес ВАТС"
                  helpTitle="Адрес сервера SIP"
                  helpText="Например: sip.a1.by:5060, sip.mts.by:5060 или ims.beltelecom.by:5060."
                  helpExample="sip.a1.by:5060"
                />
                <input
                  id="sip-server"
                  type="text"
                  value={localSip.sipServer}
                  onChange={(e) => setLocalSip({ ...localSip, sipServer: e.target.value })}
                  placeholder="sip.a1.by:5060"
                  className={`${WHITE_INPUT_CLASS} font-mono`}
                />
              </div>

              <div>
                <FieldLabel
                  htmlFor="sip-login"
                  label="SIP Логин / Номер линии"
                  helpTitle="Логин учетной записи SIP"
                  helpText="Логин SIP-сотрудника из личного кабинета Виртуальной АТС вашего оператора."
                  helpExample="375445001001"
                />
                <input
                  id="sip-login"
                  type="text"
                  value={localSip.sipLogin}
                  onChange={(e) => setLocalSip({ ...localSip, sipLogin: e.target.value })}
                  placeholder="37544XXXXXXX"
                  className={`${WHITE_INPUT_CLASS} font-mono`}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <FieldLabel
                    htmlFor="sip-password"
                    label="SIP Пароль"
                    helpTitle="Пароль SIP-линии"
                    helpText="Пароль для авторизации на сервере вашего оператора связи."
                  />
                  <button
                    type="button"
                    onClick={() => setShowSipPassword(!showSipPassword)}
                    className="text-[11px] font-medium text-[#737373] hover:text-black flex items-center gap-1 cursor-pointer mb-1.5"
                  >
                    {showSipPassword ? <EyeClosedIcon className="w-3.5 h-3.5" /> : <EyeIcon className="w-3.5 h-3.5" />}
                    <span>{showSipPassword ? 'Скрыть' : 'Показать'}</span>
                  </button>
                </div>
                <input
                  id="sip-password"
                  type={showSipPassword ? 'text' : 'password'}
                  value={localSip.sipPassword || ''}
                  onChange={(e) => setLocalSip({ ...localSip, sipPassword: e.target.value })}
                  placeholder="Пароль от SIP-учётки"
                  className={`${WHITE_INPUT_CLASS} font-mono`}
                />
              </div>

              <div>
                <FieldLabel
                  htmlFor="sip-caller-id"
                  label="АОН (Caller ID)"
                  helpTitle="Номер вашей компании"
                  helpText="Номер в формате +375, на который поступают звонки."
                  helpExample="+375 (29) 600-10-20"
                />
                <input
                  id="sip-caller-id"
                  type="text"
                  value={localSip.callerId || ''}
                  onChange={(e) => setLocalSip({ ...localSip, callerId: e.target.value })}
                  placeholder="+375 (29) ..."
                  className={`${WHITE_INPUT_CLASS} font-mono`}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-black/[0.08]">
              <button
                type="button"
                onClick={handleTestSip}
                disabled={isTestingSip}
                className="h-9 px-4 rounded-full bg-white hover:bg-black hover:text-white text-black border border-black/[0.12] text-[12px] font-semibold inline-flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingSip ? 'animate-spin' : ''}`} />
                <span>{isTestingSip ? 'Проверяем связь с АТС...' : 'Проверить подключение SIP'}</span>
              </button>

              {sipTestResult && (
                <span
                  className={`text-[12px] font-semibold flex items-center gap-1.5 ${
                    sipTestResult.ok ? 'text-[#15803D]' : 'text-[#FE432A]'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{sipTestResult.message}</span>
                </span>
              )}
            </div>
          </div>
        )}
      </section>

      {/* CARD 02: Перевод звонка на сотрудника */}
      <section className="p-6 sm:p-7 rounded-[24px] bg-white border border-black/[0.08] space-y-5">
        <div className="flex items-center gap-3.5 pb-4 border-b border-black/[0.08]">
          <div className="w-9 h-9 rounded-[12px] bg-[#0A0A0A] text-[#D8E738] flex items-center justify-center font-mono font-bold text-[12px] shrink-0">
            02
          </div>
          <div>
            <h2 className="font-display text-[17px] font-bold text-black tracking-[-0.02em]">
              Перевод звонка на сотрудника
            </h2>
            <p className="text-[12.5px] text-[#737373]">
              Если клиент попросит человека или бот поймёт, что вопрос требует живого участия
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel
              htmlFor="staff-phone"
              label="Номер телефона администратора / мастера"
              required
              helpTitle="Куда переводить звонок"
              helpText="Укажите номер дежурного менеджера или мастера в Беларуси (+375). Если звонящий скажет «соедините с человеком» или у него возникнет сложный нестандартный вопрос, бот мгновенно переведёт звонок на этот номер."
              helpExample="+375 (29) 111-22-33"
            />
            <input
              id="staff-phone"
              type="text"
              value={localSip.transferPhone}
              onChange={(e) => setLocalSip({ ...localSip, transferPhone: e.target.value })}
              placeholder="+375 (29) 111-22-33"
              className={`${INPUT_CLASS} font-mono`}
            />
            <p className="text-[11.5px] text-[#737373] mt-1.5">
              На этот номер поступит вызов при переводе.
            </p>
          </div>

          <div>
            <FieldLabel
              htmlFor="staff-whisper"
              label="Что бот скажет клиенту перед переводом"
              helpTitle="Фраза перед переводом"
              helpText="Эту фразу бот вежливо произнесёт клиенту в трубку, пока соединяет звонок с вашим сотрудником."
              helpExample="Секунду, перевожу звонок на администратора..."
            />
            <input
              id="staff-whisper"
              type="text"
              value={localSip.whisperMessage}
              onChange={(e) => setLocalSip({ ...localSip, whisperMessage: e.target.value })}
              placeholder="Секунду, перевожу звонок на администратора..."
              className={INPUT_CLASS}
            />
            <p className="text-[11.5px] text-[#737373] mt-1.5">
              Эту фразу клиент услышит в трубке перед соединением.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-black/[0.08]">
          <button
            type="button"
            onClick={handleTestTransfer}
            disabled={isTestingTransfer}
            className="h-9 px-4 rounded-full bg-[#F5F5F5] hover:bg-black hover:text-white text-black border border-black/[0.08] text-[12px] font-semibold inline-flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <CallTransfer className="w-3.5 h-3.5" />
            <span>{isTestingTransfer ? 'Проверяем доступность номера...' : 'Проверить номер перевода'}</span>
          </button>

          {transferTestResult && (
            <span
              className={`text-[12px] font-semibold flex items-center gap-1.5 ${
                transferTestResult.ok ? 'text-[#15803D]' : 'text-[#FE432A]'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{transferTestResult.message}</span>
            </span>
          )}
        </div>
      </section>

      {/* CARD 03: Запись и безопасность (Disclosure) */}
      <details className="group rounded-[24px] bg-white border border-black/[0.08] overflow-hidden">
        <summary className="p-5 sm:p-6 flex items-center justify-between text-[13.5px] font-semibold text-black hover:bg-[#F5F5F5] cursor-pointer list-none transition-colors">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-[10px] bg-[#F5F5F5] border border-black/[0.06] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-black" />
            </span>
            <span>Запись разговоров и Закон 99-З о защите персональных данных</span>
          </div>
          <ChevronDown className="w-4 h-4 text-[#737373] transition-transform group-open:rotate-180" />
        </summary>

        <div className="p-6 pt-4 border-t border-black/[0.08] space-y-4 bg-[#F5F5F5]">
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="recording-disclaimer-toggle" className="cursor-pointer">
              <div className="text-[13.5px] font-semibold text-black">
                Предупреждать клиента о записи разговора
              </div>
              <div className="text-[12px] text-[#737373]">
                Бот произнесёт эту фразу в начале звонка
              </div>
            </label>
            <input
              id="recording-disclaimer-toggle"
              type="checkbox"
              {...nativeSwitchAttr}
              aria-label="Предупреждать клиента о записи разговора"
              checked={localSip.recordingDisclaimerEnabled}
              onChange={(e) => setLocalSip({ ...localSip, recordingDisclaimerEnabled: e.target.checked })}
              className="w-4 h-4 accent-black cursor-pointer shrink-0"
            />
          </div>

          {localSip.recordingDisclaimerEnabled && (
            <div>
              <label htmlFor="recording-disclaimer-text" className="text-[12px] font-semibold text-black block mb-1.5">
                Фраза предупреждения
              </label>
              <input
                id="recording-disclaimer-text"
                type="text"
                value={localSip.disclaimerText}
                onChange={(e) => setLocalSip({ ...localSip, disclaimerText: e.target.value })}
                className={WHITE_INPUT_CLASS}
              />
            </div>
          )}

          <div className="p-4 rounded-[14px] bg-white border border-black/[0.08] text-[12px] text-[#525252] leading-relaxed">
            Серверы Voxi размещены на территории Республики Беларусь, все записи диалогов шифруются и соответствуют требованиям НЦЗПД и Закону РБ № 99‑З «О защите персональных данных».
          </div>
        </div>
      </details>
    </form>
  );
};
