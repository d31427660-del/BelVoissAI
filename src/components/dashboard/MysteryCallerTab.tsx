import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PhoneCallingRoundedIcon as PhoneCall,
  MagicWand3Icon as Sparkles,
  PlayIcon as Play,
  PauseIcon as Pause,
  CopyIcon as Copy,
  CheckCircleIcon as CheckCircle2,
  CloseCircleIcon as XCircle,
  ClockCircleIcon as Clock,
  Buildings2Icon as Building,
  SoundwaveCircleIcon as Radio,
  SendSquareIcon as Send,
  RefreshIcon as RefreshCw,
  WalletMoneyIcon as Wallet,
  ShieldCheckIcon as ShieldCheck
} from '@solar-icons/react/bold-duotone';
import { INITIAL_MYSTERY_LEADS } from '../../lib/mockData';
import { VoiceSimulator } from '../../lib/speechSynth';
import { VoiceId, BusinessNiche, MysteryAuditItem } from '../../types';

interface MysteryCallerTabProps {
  currentVoice?: VoiceId;
}

export const MysteryCallerTab: React.FC<MysteryCallerTabProps> = ({ currentVoice = 'anna' }) => {
  const [leads, setLeads] = useState<MysteryAuditItem[]>(INITIAL_MYSTERY_LEADS);
  const [selectedLeadId, setSelectedLeadId] = useState<string>(INITIAL_MYSTERY_LEADS[0].id);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Custom Audit Form State
  const [customName, setCustomName] = useState('');
  const [customPhone, setCustomPhone] = useState('+375 (29) ');
  const [customNiche, setCustomNiche] = useState<BusinessNiche>('auto_service');
  const [customCity, setCustomCity] = useState('Минск');
  const [isSimulatingAudit, setIsSimulatingAudit] = useState(false);
  const [auditSuccessToast, setAuditSuccessToast] = useState<string | null>(null);

  const selectedLead = leads.find((l) => l.id === selectedLeadId) || leads[0];

  const handlePlayDemo = (lead: typeof selectedLead) => {
    if (isPlayingAudio) {
      VoiceSimulator.stop();
      setIsPlayingAudio(false);
      return;
    }

    const voice: VoiceId = lead.niche === 'auto_service' ? 'dmitry' : 'anna';
    VoiceSimulator.speak(
      lead.aiDemoAudioText,
      voice,
      () => setIsPlayingAudio(true),
      () => setIsPlayingAudio(false)
    );
  };

  const handleCopyPitch = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleRunCustomAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    setIsSimulatingAudit(true);

    setTimeout(() => {
      const avgLoss = customNiche === 'driving_school' ? 1050 : customNiche === 'auto_service' ? 280 : 150;
      const newLead = {
        id: `myst-${Date.now()}`,
        companyName: customName,
        niche: customNiche,
        city: customCity,
        phone: customPhone,
        callTime: 'Сегодня в 20:30 (аудит неответа)',
        callStatus: 'no_answer' as const,
        ringsCount: 6,
        lostEstimatedByn: avgLoss,
        aiDemoAudioText: `Добрый вечер! Компания ${customName}, голосовой ассистент Анна. Администратор сейчас не может ответить, но я готова зафиксировать ваше обращение и записать вас на удобное время. Подскажите, какая услуга вас интересует?`,
        pitchMessage: `Здравствуйте! Вчера вечером мы звонили в ${customName} — после 6 гудков звонок сбросился (упущен клиент с чеком ~${avgLoss} BYN). Вот 25-секундное демо, как на этот вызов ответил бы ваш ИИ-администратор Voxi за 0.5 секунды.`
      };

      setLeads([newLead, ...leads]);
      setSelectedLeadId(newLead.id);
      setIsSimulatingAudit(false);
      setAuditSuccessToast(`Аудит для «${customName}» завершен! Демо-звонок сгенерирован.`);
      setTimeout(() => setAuditSuccessToast(null), 3500);
      setCustomName('');
    }, 1200);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Партизанский Go-To-Market инструмент</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Кампания «Тайный звонок» (Mystery Caller)
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Прозванивайте СТО, автошколы и салоны Минска и областей в 20:30 вечера или в выходные дни. Отправляйте ЛПР аудиозапись сгенерированного ИИ-администратора с их названием — конверсия в демо достигает <strong className="text-emerald-400">25–35%</strong>.
          </p>
        </div>

        <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6 shrink-0">
          <div>
            <div className="text-2xl font-bold text-emerald-400 font-mono">35%</div>
            <div className="text-[11px] text-slate-300">Конверсия в демо</div>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div>
            <div className="text-2xl font-bold text-blue-300 font-mono">&lt; 0.6с</div>
            <div className="text-[11px] text-slate-300">Скорость ответа ИИ</div>
          </div>
        </div>
      </div>

      {auditSuccessToast && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{auditSuccessToast}</span>
        </motion.div>
      )}

      {/* Grid: Audit Generator Form (Left) & Active Mystery Pitch Card (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left: Custom Audit Generator Form */}
        <div className="lg:col-span-5 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <PhoneCall className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Запустить аудит компании</h3>
                <p className="text-xs text-slate-500">Симуляция вечернего звонка и генерация демо</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleRunCustomAudit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Название бизнеса / СТО / Салона:
              </label>
              <input
                type="text"
                required
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="напр. Автосервис «Поршень-Минск»"
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Сфера бизнеса:
                </label>
                <select
                  value={customNiche}
                  onChange={(e) => setCustomNiche(e.target.value as BusinessNiche)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                >
                  <option value="auto_service">СТО / Автосервис</option>
                  <option value="beauty_salon">Салон красоты</option>
                  <option value="driving_school">Автошкола</option>
                  <option value="medical_clinic">Стоматология</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Город:
                </label>
                <select
                  value={customCity}
                  onChange={(e) => setCustomCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                >
                  <option value="Минск">Минск</option>
                  <option value="Брест">Брест</option>
                  <option value="Гродно">Гродно</option>
                  <option value="Гомель">Гомель</option>
                  <option value="Витебск">Витебск</option>
                  <option value="Могилев">Могилев</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Номер телефона для теста:
              </label>
              <input
                type="text"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs font-mono focus:outline-none focus:border-blue-600"
              />
            </div>

            <button
              type="submit"
              disabled={isSimulatingAudit || !customName.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-50"
            >
              {isSimulatingAudit ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Прозвон и симуляция неответа...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Сгенерировать персонализированный питч</span>
                </>
              )}
            </button>
          </form>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 space-y-1">
            <div className="font-semibold text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Юридическая безопасность:</span>
            </div>
            <div>
              Аудит проводится без спам-рассылок: отправляется индивидуальное сообщение ЛПР с фиксацией факта потери реального звонка.
            </div>
          </div>
        </div>

        {/* Right: Active Mystery Pitch Card with Audio Preview */}
        <div className="lg:col-span-7 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                Карточка упущенного звонка
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                {selectedLead.companyName}
              </h3>
              <p className="text-xs text-slate-500">
                {selectedLead.city} • {selectedLead.phone}
              </p>
            </div>

            <div className="text-right">
              <div className="text-sm font-bold text-rose-600 font-mono">
                −{selectedLead.lostEstimatedByn} BYN
              </div>
              <div className="text-[10px] text-slate-400">Упущенный чек</div>
            </div>
          </div>

          {/* Call Incident Box */}
          <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200/80 flex items-start gap-3 text-xs text-rose-900">
            <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">
                Зафиксирован неответ: {selectedLead.callTime}
              </div>
              <div className="text-rose-700 text-[11px] mt-0.5">
                Клиент слушал гудки {selectedLead.ringsCount} раз и сбросил вызов. Звонок ушёл конкурентам.
              </div>
            </div>
          </div>

          {/* Audio Demo Player */}
          <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono font-bold text-slate-200">
                  ДЕМО ОТВЕТА VOXI AI ЗА 0.5 СЕК
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Голос: {selectedLead.niche === 'auto_service' ? 'Дмитрий (СТО)' : 'Анна'}
              </span>
            </div>

            <p className="text-xs text-slate-300 italic bg-slate-800/80 p-3 rounded-lg border border-slate-700/60 leading-relaxed">
              «{selectedLead.aiDemoAudioText}»
            </p>

            <button
              onClick={() => handlePlayDemo(selectedLead)}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              {isPlayingAudio ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Остановить воспроизведение</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Прослушать 25-сек демо для клиента</span>
                </>
              )}
            </button>
          </div>

          {/* Ready-to-Send Outreach Message for Telegram/Viber */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                Готовое сообщение для отправки ЛПР в Telegram / Viber:
              </label>
              <button
                onClick={() => handleCopyPitch(selectedLead.pitchMessage, selectedLead.id)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                {copiedId === selectedLead.id ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Скопировано!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Копировать питч</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              readOnly
              rows={3}
              value={selectedLead.pitchMessage}
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs leading-relaxed font-sans focus:outline-none"
            />
          </div>
        </div>

      </div>

      {/* Audit History Table */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              База аудитов «Тайный звонок» по Беларуси
            </h3>
            <p className="text-xs text-slate-500">
              Нажмите на компанию для просмотра карточки и отправки демо
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {leads.length} записей
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold">
                <th className="py-2.5 px-3">Компания</th>
                <th className="py-2.5 px-3">Сфера</th>
                <th className="py-2.5 px-3">Город</th>
                <th className="py-2.5 px-3">Время звонка</th>
                <th className="py-2.5 px-3">Результат</th>
                <th className="py-2.5 px-3 text-right">Потеря</th>
                <th className="py-2.5 px-3 text-right">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.map((item) => {
                const isSelected = item.id === selectedLeadId;
                return (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedLeadId(item.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50/70 font-medium' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 px-3 text-slate-900 font-semibold">
                      {item.companyName}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {item.niche === 'auto_service'
                        ? 'СТО'
                        : item.niche === 'beauty_salon'
                        ? 'Салон красоты'
                        : item.niche === 'driving_school'
                        ? 'Автошкола'
                        : 'Клиника'}
                    </td>
                    <td className="py-3 px-3 text-slate-500">{item.city}</td>
                    <td className="py-3 px-3 text-slate-500">{item.callTime}</td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        Не ответили ({item.ringsCount} гудков)
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-rose-600 font-semibold">
                      −{item.lostEstimatedByn} BYN
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLeadId(item.id);
                          handlePlayDemo(item);
                        }}
                        className="px-2.5 py-1 rounded-md bg-blue-100 hover:bg-blue-200 text-blue-700 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors"
                      >
                        <Play className="w-3 h-3" />
                        <span>Демо</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
