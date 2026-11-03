import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  PhoneCallingRoundedIcon as PhoneCall,
  MagicWand3Icon as Sparkles,
  PlayIcon as Play,
  PauseIcon as Pause,
  CopyIcon as Copy,
  CheckCircleIcon as CheckCircle2,
  CloseCircleIcon as XCircle,
  RefreshIcon as RefreshCw,
  VolumeLoudIcon as Volume2
} from '@solar-icons/react/bold-duotone';
import { INITIAL_MYSTERY_LEADS } from '../../lib/mockData';
import { VoiceSimulator } from '../../lib/speechSynth';
import { VoiceId, BusinessNiche, MysteryAuditItem } from '../../types';
import { FieldLabel, FieldHint } from './FieldHelp';
import { formatBelarusPhone } from './InteractiveAgentFields';

interface MysteryCallerTabProps {
  currentVoice?: VoiceId;
}

export const MysteryCallerTab: React.FC<MysteryCallerTabProps> = ({ currentVoice }) => {
  const [leads, setLeads] = useState<MysteryAuditItem[]>(INITIAL_MYSTERY_LEADS);
  const [selectedLeadId, setSelectedLeadId] = useState<string>(INITIAL_MYSTERY_LEADS[0].id);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [customName, setCustomName] = useState('');
  const [customPhone, setCustomPhone] = useState('+375 (29) ');
  const [customNiche, setCustomNiche] = useState<BusinessNiche>('auto_service');
  const [customCity, setCustomCity] = useState('Минск');
  const [isSimulatingAudit, setIsSimulatingAudit] = useState(false);
  const [auditSuccessToast, setAuditSuccessToast] = useState<string | null>(null);

  const selectedLead = leads.find((l) => l.id === selectedLeadId) || leads[0];

  const resolveLeadVoice = (lead: MysteryAuditItem): VoiceId => {
    if (lead.aiDemoAudioText.includes('Дмитрий')) return 'dmitry';
    if (lead.aiDemoAudioText.includes('Анна') || lead.aiDemoAudioText.includes('Полина')) return 'anna';
    return currentVoice || (lead.niche === 'auto_service' ? 'dmitry' : 'anna');
  };

  const handlePlayDemo = (lead: typeof selectedLead) => {
    if (isPlayingAudio) {
      VoiceSimulator.stop();
      setIsPlayingAudio(false);
      return;
    }

    const voice = resolveLeadVoice(lead);
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
      const avgLoss =
        customNiche === 'driving_school' ? 1050 : customNiche === 'auto_service' ? 280 : 150;
      const chosenVoice: VoiceId = currentVoice || (customNiche === 'auto_service' ? 'dmitry' : 'anna');
      const speakerLabel = chosenVoice === 'dmitry' ? 'Дмитрий' : 'Анна';
      const newLead: MysteryAuditItem = {
        id: `myst-${Date.now()}`,
        companyName: customName,
        niche: customNiche,
        city: customCity,
        phone: customPhone,
        callTime: 'Вечернее время (20:30)',
        callStatus: 'no_answer',
        ringsCount: 6,
        lostEstimatedByn: avgLoss,
        aiDemoAudioText: `Добрый вечер! Компания ${customName}, голосовой помощник ${speakerLabel}. Администратор уже завершил смену, но я с радостью подскажу стоимость и запишу вас на завтра. Какая услуга вас интересует?`,
        pitchMessage: `Здравствуйте! Вечером мы позвонили в «${customName}» — после 6 гудков никто не ответил (обычно это минус заказ на ~${avgLoss} BYN). Послушайте короткий пример, как на такие звонки может за полсекунды отвечать ваш голосовой помощник Voxi.`
      };

      setLeads([newLead, ...leads]);
      setSelectedLeadId(newLead.id);
      setIsSimulatingAudit(false);
      setAuditSuccessToast(`Готово! Персональный голосовой пример для «${customName}» создан.`);
      setTimeout(() => setAuditSuccessToast(null), 3500);
      setCustomName('');
    }, 900);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Light Header Card (Replaces old dark banner & marketing jargon) */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50/90 via-white to-indigo-50/50 border border-blue-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-100/80 text-blue-800 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Наглядная демонстрация для бизнеса</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Проверка вечерних звонков и создание демо-примера
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Укажите название любой компании (вашего филиала, партнёра или клиента), чтобы сразу послушать, как бот ответит вместо долгих гудков вечером или в выходной день.
          </p>
        </div>

        <div className="flex items-center gap-5 border-t md:border-t-0 md:border-l border-blue-200/70 pt-4 md:pt-0 md:pl-6 shrink-0">
          <div>
            <div className="text-2xl font-bold text-blue-700 font-mono">0.5 сек</div>
            <div className="text-[11px] text-slate-500">Ответ вместо гудков</div>
          </div>
          <div className="h-8 w-px bg-blue-200/70" />
          <div>
            <div className="text-2xl font-bold text-emerald-700 font-mono">24/7</div>
            <div className="text-[11px] text-slate-500">Вечера и выходные</div>
          </div>
        </div>
      </div>

      {auditSuccessToast && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{auditSuccessToast}</span>
        </motion.div>
      )}

      {/* Grid: Generator Form (Left) & Light Audio Preview Card (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Form with Hints on ALL Fields */}
        <div className="lg:col-span-5 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Создать пример для компании</h3>
              <p className="text-xs text-slate-500">Бот произнесёт название и предложит запись</p>
            </div>
          </div>

          <form onSubmit={handleRunCustomAudit} className="space-y-4">
            <div>
              <FieldLabel
                htmlFor="mystery-company-name"
                label="Название организации"
                required
                helpTitle="Какое название вписать"
                helpText="Введите название СТО, клиники, салона или автошколы — бот сразу вставит его в голосовое приветствие и в готовое текстовое сообщение."
                helpExample="Автосервис Поршень-Минск"
              />
              <input
                id="mystery-company-name"
                name="companyName"
                type="text"
                required
                aria-describedby="mystery-company-hint"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Напр.: Автосервис Поршень-Минск"
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
              />
              <FieldHint id="mystery-company-hint">
                Бот произнесёт это название голосом в демонстрационной записи справа.
              </FieldHint>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <FieldLabel
                  htmlFor="mystery-niche"
                  label="Сфера деятельности"
                  helpTitle="На что влияет выбор сферы"
                  helpText="От сферы зависит голос (мужской для СТО, женский для салонов и клиник) и расчёт средней стоимости одного пропущенного клиента."
                />
                <select
                  id="mystery-niche"
                  name="niche"
                  aria-describedby="mystery-niche-hint"
                  value={customNiche}
                  onChange={(e) => setCustomNiche(e.target.value as BusinessNiche)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                >
                  <option value="auto_service">Автосервис / СТО</option>
                  <option value="beauty_salon">Салон красоты</option>
                  <option value="driving_school">Автошкола</option>
                  <option value="medical_clinic">Стоматология / Медцентр</option>
                </select>
                <FieldHint id="mystery-niche-hint">
                  Подбирает подходящий голос и средний чек.
                </FieldHint>
              </div>

              <div>
                <FieldLabel
                  htmlFor="mystery-city"
                  label="Город"
                  helpTitle="Зачем выбирать город"
                  helpText="Город отображается в карточке проверки, чтобы удобно группировать компании по регионам Беларуси."
                />
                <select
                  id="mystery-city"
                  name="city"
                  aria-describedby="mystery-city-hint"
                  value={customCity}
                  onChange={(e) => setCustomCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                >
                  <option value="Минск">Минск</option>
                  <option value="Брест">Брест</option>
                  <option value="Гродно">Гродно</option>
                  <option value="Гомель">Гомель</option>
                  <option value="Витебск">Витебск</option>
                  <option value="Могилёв">Могилёв</option>
                </select>
                <FieldHint id="mystery-city-hint">
                  Для удобной пометки в списке ниже.
                </FieldHint>
              </div>
            </div>

            <div>
              <FieldLabel
                htmlFor="mystery-phone"
                label="Контактный телефон компании"
                optionalText="для заметки"
                helpTitle="Производится ли автоматический обзвон?"
                helpText="Нет, система не делает спам-звонков сама. Поле нужно только для сохранения номера в карточке компании, чтобы вы не потеряли контакт."
                helpExample="+375 (29) 650-12-34"
              />
              <input
                id="mystery-phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                aria-describedby="mystery-phone-hint"
                value={customPhone}
                onChange={(e) => setCustomPhone(formatBelarusPhone(e.target.value))}
                placeholder="+375 (29) 650-12-34"
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs font-mono focus:outline-none focus:border-blue-600"
              />
              <FieldHint id="mystery-phone-hint">
                Сохраняется только в вашей карточке (автоматический дозвон не запускается).
              </FieldHint>
            </div>

            <button
              type="submit"
              disabled={isSimulatingAudit}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-50"
            >
              {isSimulatingAudit ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Готовим голосовой пример...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Создать голосовой пример</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: Active Demo Card in Clean Light Theme */}
        <div className="lg:col-span-7 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] uppercase font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                Готовый пример ответа
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-1.5">
                {selectedLead.companyName}
              </h3>
              <p className="text-xs text-slate-500">
                {selectedLead.city} • {selectedLead.phone}
              </p>
            </div>

            <div className="text-right">
              <div className="text-sm font-bold text-rose-600 font-mono">
                ~{selectedLead.lostEstimatedByn} BYN
              </div>
              <div className="text-[11px] text-slate-400">Цена 1 пропущенного звонка</div>
            </div>
          </div>

          {/* Situation Box */}
          <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200/80 flex items-start gap-3 text-xs text-rose-900">
            <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">
                Обычная ситуация без бота: {selectedLead.callTime}
              </div>
              <div className="text-rose-700 text-[11px] mt-0.5">
                Клиент ждёт {selectedLead.ringsCount} гудков, кладёт трубку и звонит следующей компании в поиске.
              </div>
            </div>
          </div>

          {/* Light Audio Demo Player (Replaces old dark bg-slate-900 box!) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/90 to-indigo-50/50 border border-blue-200/80 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-blue-950">
                  Как на этот же звонок ответит бот Voxi
                </span>
              </div>
              <span className="text-[11px] font-medium text-blue-700 bg-white px-2.5 py-0.5 rounded-full border border-blue-100">
                Голос: {resolveLeadVoice(selectedLead) === 'dmitry' ? 'Дмитрий' : 'Анна'}
              </span>
            </div>

            <p className="text-xs text-slate-700 italic bg-white/90 p-3.5 rounded-xl border border-blue-100 leading-relaxed">
              «{selectedLead.aiDemoAudioText}»
            </p>

            <button
              type="button"
              onClick={() => handlePlayDemo(selectedLead)}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              {isPlayingAudio ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Остановить озвучку</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Послушать голосовой пример</span>
                </>
              )}
            </button>
          </div>

          {/* Ready Message with Explicit Label & Hint */}
          <div>
            <div className="flex items-center justify-between gap-2">
              <FieldLabel
                htmlFor="mystery-pitch-message"
                label="Готовый текст сообщения для отправки в Telegram или Viber"
                helpTitle="Как использовать это сообщение"
                helpText="Если вы показываете сервис партнёру или руководителю компании, скопируйте этот вежливый текст в один клик и перешлите вместе с примером работы бота."
              />
              <button
                type="button"
                onClick={() => handleCopyPitch(selectedLead.pitchMessage, selectedLead.id)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 mb-1.5 shrink-0"
              >
                {copiedId === selectedLead.id ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Скопировано</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Скопировать текст</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              id="mystery-pitch-message"
              name="pitchMessage"
              readOnly
              rows={3}
              aria-describedby="mystery-pitch-hint"
              value={selectedLead.pitchMessage}
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs leading-relaxed focus:outline-none focus:border-blue-500"
            />
            <FieldHint id="mystery-pitch-hint">
              Нажмите «Скопировать текст», чтобы вставить готовое сообщение в мессенджер.
            </FieldHint>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Список готовых примеров по сферам бизнеса
            </h3>
            <p className="text-xs text-slate-500">
              Нажмите на любую компанию в таблице, чтобы открыть её карточку и послушать озвучку
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {leads.length} примеров
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 font-semibold bg-slate-50/50">
                <th className="py-2.5 px-3">Компания</th>
                <th className="py-2.5 px-3">Сфера</th>
                <th className="py-2.5 px-3">Город</th>
                <th className="py-2.5 px-3">Когда звонили</th>
                <th className="py-2.5 px-3">Ситуация</th>
                <th className="py-2.5 px-3 text-right">Средний чек</th>
                <th className="py-2.5 px-3 text-right">Прослушать</th>
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
                    <td className="py-3 px-3 text-slate-900 font-semibold">{item.companyName}</td>
                    <td className="py-3 px-3 text-slate-600">
                      {item.niche === 'auto_service'
                        ? 'Автосервис'
                        : item.niche === 'beauty_salon'
                        ? 'Салон красоты'
                        : item.niche === 'driving_school'
                        ? 'Автошкола'
                        : 'Стоматология'}
                    </td>
                    <td className="py-3 px-3 text-slate-500">{item.city}</td>
                    <td className="py-3 px-3 text-slate-500">{item.callTime}</td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        Без ответа ({item.ringsCount} гудков)
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700 font-semibold">
                      ~{item.lostEstimatedByn} BYN
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLeadId(item.id);
                          handlePlayDemo(item);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors"
                      >
                        <Play className="w-3 h-3" />
                        <span>Слушать</span>
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
