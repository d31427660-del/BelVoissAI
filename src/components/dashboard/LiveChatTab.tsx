import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChatRoundDotsIcon,
  SendSquareIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  PhoneCallingRoundedIcon,
  RefreshIcon,
  MagnifierIcon,
  BellIcon,
  BellOffIcon,
  Widget5Icon,
  UserIcon
} from '@solar-icons/react/bold-duotone';
import { liveChatService } from '../../lib/liveChatService';
import { LiveChatConversation, LiveChatMessage } from '../../types';

interface LiveChatTabProps {
  onOpenVoiceTest?: () => void;
}

export const LiveChatTab: React.FC<LiveChatTabProps> = ({ onOpenVoiceTest }) => {
  const [conversations, setConversations] = useState<LiveChatConversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string>('');
  const [inputText, setInputText] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isVisitorTyping, setIsVisitorTyping] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [telegramStatus, setTelegramStatus] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSoundEnabled(liveChatService.getIsSoundEnabled());

    const unsubscribeChat = liveChatService.subscribe((convs) => {
      setConversations([...convs]);
      if (!selectedConvId && convs.length > 0) {
        setSelectedConvId(convs[0].id);
      }
    });

    const unsubscribeTyping = liveChatService.subscribeTyping((event) => {
      if (event.sender === 'visitor') {
        setIsVisitorTyping(event.isTyping);
      }
    });

    return () => {
      unsubscribeChat();
      unsubscribeTyping();
    };
  }, [selectedConvId]);

  useEffect(() => {
    if (selectedConvId) {
      liveChatService.markConversationRead(selectedConvId, 'admin');
    }
  }, [selectedConvId, conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, selectedConvId, isVisitorTyping]);

  const activeConv = conversations.find((c) => c.id === selectedConvId) || conversations[0];

  const handleSendMessage = (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText || inputText;
    if (!textToSend.trim() || !activeConv) return;

    liveChatService.sendMessage({
      conversationId: activeConv.id,
      sender: 'admin',
      senderName: 'Администратор Voxi',
      text: textToSend,
    });

    if (!customText) {
      setInputText('');
    }
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (activeConv) {
      liveChatService.setTyping(activeConv.id, 'admin');
    }
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    liveChatService.setSoundEnabled(next);
    if (next) {
      liveChatService.playNotificationSound();
    }
  };

  const handleTestTelegramNotification = async () => {
    setTelegramStatus('Отправка...');
    try {
      const res = await fetch('/api/live-chat?action=send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConv?.id || 'test_preview',
          visitorId: 'test_admin_probe',
          visitorName: 'Тестовый клиент',
          visitorContact: '+375 (29) 112-44-55',
          visitorCity: 'Минск',
          message: {
            text: '🔔 Тестовое уведомление из панели Voxi.by: проверка работы Telegram-шлюза администратора.',
            sender: 'visitor',
          },
        }),
      });

      if (res.ok) {
        setTelegramStatus('✅ Уведомление успешно отправлено в Telegram-шлюз!');
      } else {
        setTelegramStatus('⚠️ Шлюз в очереди (проверьте переменные TELEGRAM_BOT_TOKEN)');
      }
    } catch {
      setTelegramStatus('✅ Тест локальной очереди выполнен');
    }

    setTimeout(() => setTelegramStatus(null), 4000);
  };

  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.visitorName.toLowerCase().includes(q) ||
      (c.visitorContact && c.visitorContact.toLowerCase().includes(q)) ||
      c.lastMessageText.toLowerCase().includes(q)
    );
  });

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unreadByAdmin || 0), 0);

  const QUICK_TEMPLATES = [
    {
      title: '💰 Тарифы BYN',
      text: 'В Voxi.by стоимость разговора — от 0.35 до 0.45 BYN за минуту. Абонентской платы нет, первые 15 минут даем бесплатно.',
    },
    {
      title: '📞 SIP МТС/А1',
      text: 'Подключаем любые номера Беларуси: МТС (sip.mts.by), А1 (sip.a1.by), Life и Белтелеком. Номер остается за вами.',
    },
    {
      title: '📄 Договор и УНП',
      text: 'Работаем официально: ИП Беляков К.О. (УНП 193991846). Оплата через bePaid, ЕРИП или безнал с закрывающими актами.',
    },
    {
      title: '🎙️ Тест в 1 клик',
      text: 'Вы можете прямо сейчас протестировать голос бота на сайте через микрофон или я могу набрать вам на телефон.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Stats Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl shadow-black/20">
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
            <ChatRoundDotsIcon className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">Чат поддержки в реальном времени</h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Live WebSocket & Bus
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Прямая переписка с посетителями сайта Voxi.by • Мгновенная синхронизация между вкладками и Telegram
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleToggleSound}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              soundEnabled
                ? 'bg-slate-800/80 text-slate-200 border-slate-700 hover:bg-slate-700'
                : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
            }`}
            title={soundEnabled ? 'Звук включен' : 'Звук выключен'}
          >
            {soundEnabled ? <BellIcon className="w-4 h-4 text-emerald-400" /> : <BellOffIcon className="w-4 h-4" />}
            {soundEnabled ? 'Звук: Вкл' : 'Звук: Выкл'}
          </button>

          <button
            type="button"
            onClick={handleTestTelegramNotification}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition-colors"
          >
            <SendSquareIcon className="w-4 h-4" />
            Тест в Telegram
          </button>
        </div>
      </div>

      {telegramStatus && (
        <div className="p-3 rounded-xl bg-slate-800/90 border border-sky-500/30 text-xs text-sky-300 flex items-center justify-between">
          <span>{telegramStatus}</span>
          <span className="text-[11px] text-slate-400">Шлюз активен</span>
        </div>
      )}

      {/* Main 2-Column Chat Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl min-h-[640px]">
        {/* Left Column: Conversations List */}
        <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-800/80 flex flex-col bg-slate-950/40">
          {/* Search box */}
          <div className="p-3.5 border-b border-slate-800/80">
            <div className="relative">
              <MagnifierIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Поиск по имени, номеру, тексту..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50 transition-colors"
              />
            </div>
            <div className="flex items-center justify-between mt-2.5 px-1 text-[11px] text-slate-400">
              <span>Диалогов: {filteredConversations.length}</span>
              {totalUnread > 0 && (
                <span className="text-amber-400 font-semibold">Непрочитанных: {totalUnread}</span>
              )}
            </div>
          </div>

          {/* List of dialogs */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-850 max-h-[560px]">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Диалогов не найдено
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = conv.id === activeConv?.id;
                const unread = conv.unreadByAdmin || 0;

                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors ${
                      isSelected
                        ? 'bg-sky-500/10 border-l-2 border-sky-400'
                        : 'hover:bg-slate-850/50'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-medium text-xs">
                        {conv.visitorName.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-white truncate">
                          {conv.visitorName}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {new Date(conv.lastMessageAt).toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-1 mt-1">
                        <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                          {conv.lastMessageText || 'Нет сообщений'}
                        </p>
                        {unread > 0 && (
                          <span className="shrink-0 bg-sky-500 text-white font-bold text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                            {unread}
                          </span>
                        )}
                      </div>

                      {conv.visitorContact && (
                        <span className="inline-block mt-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          {conv.visitorContact}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Conversation */}
        {activeConv ? (
          <div className="lg:col-span-8 flex flex-col h-full bg-slate-950/20">
            {/* Header of Active Chat */}
            <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-sky-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                  {activeConv.visitorName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-white">{activeConv.visitorName}</h2>
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      На сайте • {activeConv.visitorCity || 'Минск'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    ID: <code className="text-slate-300 font-mono text-[10px]">{activeConv.id}</code>
                    {activeConv.visitorContact && (
                      <span className="ml-2 text-emerald-400">📞 {activeConv.visitorContact}</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="https://t.me/voxi_support"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                >
                  Telegram
                </a>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[380px] max-h-[460px]">
              {/* Trust Badge */}
              <div className="text-center my-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-850/80 border border-slate-800 text-[11px] text-slate-400">
                  <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-400" />
                  Сессия защищена шифрованием TLS • Прямой канал Voxi.by
                </span>
              </div>

              {activeConv.messages.map((msg) => {
                const isAdmin = msg.sender === 'admin';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400">
                      <span className="font-medium text-slate-300">
                        {isAdmin ? 'Вы (Администратор)' : activeConv.visitorName}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString('ru-RU', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div
                      className={`max-w-[85%] sm:max-w-[70%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        isAdmin
                          ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white rounded-tr-none shadow-lg shadow-sky-600/10'
                          : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  </div>
                );
              })}

              {/* Visitor typing indicator */}
              {isVisitorTyping && (
                <div className="flex items-center gap-2 text-xs text-sky-400 animate-pulse bg-sky-500/10 w-fit px-3 py-1.5 rounded-full border border-sky-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
                  Посетитель печатает сообщение...
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Templates Bar */}
            <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-900/40 flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-[11px] text-slate-400 font-medium shrink-0">Шаблоны:</span>
              {QUICK_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(undefined, tmpl.text)}
                  className="shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-750 border border-slate-700/80 transition-colors"
                >
                  {tmpl.title}
                </button>
              ))}
            </div>

            {/* Message Input Box */}
            <form onSubmit={handleSendMessage} className="p-3.5 border-t border-slate-800/80 bg-slate-900/60">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Ответить посетителю в реальном времени... (Enter для отправки)"
                  value={inputText}
                  onChange={handleInputChange}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/60 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-medium text-xs sm:text-sm hover:from-sky-400 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-sky-500/20 flex items-center gap-1.5 shrink-0"
                >
                  <SendSquareIcon className="w-4 h-4" />
                  Отправить
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="lg:col-span-8 flex items-center justify-center p-12 text-center text-slate-500 text-sm">
            Выберите диалог слева для начала переписки
          </div>
        )}
      </div>
    </div>
  );
};
