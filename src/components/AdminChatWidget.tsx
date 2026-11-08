import React, { useState, useRef, useEffect } from 'react';
import {
  ChatRoundDotsIcon,
  CloseCircleIcon,
  SendSquareIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  PhoneCallingRoundedIcon,
  ArrowRightIcon,
  BellIcon,
  BellOffIcon
} from '@solar-icons/react/bold-duotone';
import { liveChatService } from '../lib/liveChatService';
import { LiveChatMessage } from '../types';

interface Message {
  id: string;
  sender: 'admin' | 'user';
  text: string;
  time: string;
  action?: 'voice_test' | 'telegram' | 'auth' | 'calculator';
}

interface AdminChatWidgetProps {
  onOpenVoiceTest?: () => void;
  onOpenAuth?: () => void;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'm1',
    sender: 'admin',
    text: 'Здравствуйте! 👋 Я дежурный администратор платформы Voxi.by в Минске.',
    time: 'сейчас',
  },
  {
    id: 'm2',
    sender: 'admin',
    text: 'Подскажу по тарифам в BYN, подключению номеров МТС и А1 или настройке голосового ИИ под вашу автошколу, СТО, клинику или салон. Чем могу помочь?',
    time: 'сейчас',
  },
];

const QUICK_CHIPS = [
  'Сколько стоит минута в BYN?',
  'Как подключить номер МТС или А1?',
  'Есть ли бесплатный тест?',
  'Как оформить договор и акты?',
  'Написать человеку в Telegram',
];

function getBotReply(query: string): { text: string; action?: 'voice_test' | 'telegram' | 'auth' | 'calculator' } {
  const q = query.toLowerCase();

  if (q.includes('минут') || q.includes('стоим') || q.includes('цен') || q.includes('тариф') || q.includes('рубл') || q.includes('byn')) {
    return {
      text: 'В Voxi.by поминутная оплата — от 0.35 до 0.45 BYN за минуту разговора. Без абонентской платы: если звонков нет, вы ничего не платите. При регистрации даем 15 минут бесплатно без привязки банковской карты.',
      action: 'auth',
    };
  }

  if (q.includes('мтс') || q.includes('а1') || q.includes('a1') || q.includes('номер') || q.includes('линия') || q.includes('телеком') || q.includes('sip')) {
    return {
      text: 'Мы поддерживаем прямую SIP-интеграцию со всеми операторами Беларуси: МТС (sip.mts.by), А1 (sip.a1.by), Life, Белтелеком (IMS), UniTalk и Zadarma. Номер компании остается за вами, ассистент отвечает за 0.5 секунды.',
    };
  }

  if (q.includes('тест') || q.includes('попроб') || q.includes('бесплатн') || q.includes('демо')) {
    return {
      text: 'Вы можете протестировать голосового ассистента прямо сейчас в браузере в 1 клик через микрофон! Также при регистрации начисляется 15 бесплатных минут для тестов.',
      action: 'voice_test',
    };
  }

  if (q.includes('договор') || q.includes('акт') || q.includes('оферт') || q.includes('ип') || q.includes('оплат') || q.includes('ерип') || q.includes('bepaid')) {
    return {
      text: 'Работаем официально по публичному договору с ИП Беляков Кирилл Олегович (УНП 193991846, г. Минск). Оплата в BYN через bePaid (ЕРИП, карты БЕЛКАРТ, Visa, Mastercard) либо безналичным расчетом с предоставлением первичных учетных документов (актов).',
    };
  }

  if (q.includes('человек') || q.includes('оператор') || q.includes('поддержк') || q.includes('telegram') || q.includes('телеграм') || q.includes('телефон')) {
    return {
      text: 'Дежурный специалист на связи в Telegram: @voxi_support, телефон: +375 (29) 112-44-55 (ежедневно 09:00–21:00). Нажмите кнопку ниже для быстрого перехода в Telegram:',
      action: 'telegram',
    };
  }

  if (q.includes('настро') || q.includes('баз') || q.includes('интеграц') || q.includes('crm') || q.includes('telegram')) {
    return {
      text: 'Настройка занимает 5 минут: выбираете нишу и голос, указываете услуги и график работы, а заявки от клиентов сразу поступают в ваш Telegram и CRM (Bitrix24, amoCRM, YCLIENTS).',
      action: 'auth',
    };
  }

  return {
    text: 'Спасибо за вопрос! Зафиксировал ваше обращение. Если хотите обсудить персональное подключение или интеграцию, напишите нам в Telegram @voxi_support или позвоните +375 (29) 112-44-55.',
    action: 'telegram',
  };
}

export const AdminChatWidget: React.FC<AdminChatWidgetProps> = ({
  onOpenVoiceTest,
  onOpenAuth,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showContactForm, setShowContactForm] = useState(false);
  const [visitorContact, setVisitorContact] = useState('');
  const [contactSaved, setContactSaved] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const conversationIdRef = useRef<string>('');
  const botReplyTimerRef = useRef<number | null>(null);
  const hasLiveOperatorRepliedRef = useRef<boolean>(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Initialize live chat subscription
    const session = liveChatService.getVisitorSession();
    conversationIdRef.current = session.conversationId;
    if (session.contact) {
      setVisitorContact(session.contact);
      setContactSaved(true);
    }
    setSoundEnabled(liveChatService.getIsSoundEnabled());

    const unsubscribeChat = liveChatService.subscribe((convs, visitorConv) => {
      if (visitorConv && visitorConv.messages.length > 0) {
        const hasHumanOperator = visitorConv.messages.some(
          (m) => m.sender === 'admin' && !m.id.startsWith('init_') && m.senderName === 'Администратор Voxi'
        );
        if (hasHumanOperator) {
          hasLiveOperatorRepliedRef.current = true;
          if (botReplyTimerRef.current) {
            window.clearTimeout(botReplyTimerRef.current);
            botReplyTimerRef.current = null;
            setIsTyping(false);
          }
        }

        const formatted: Message[] = visitorConv.messages.map((m) => ({
          id: m.id,
          sender: m.sender === 'visitor' ? 'user' : 'admin',
          text: m.text,
          time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          action: m.action,
        }));
        setMessages(formatted);
      }
    });

    const unsubscribeTyping = liveChatService.subscribeTyping((event) => {
      if (event.conversationId === conversationIdRef.current && event.sender === 'admin') {
        if (event.isTyping && botReplyTimerRef.current) {
          window.clearTimeout(botReplyTimerRef.current);
          botReplyTimerRef.current = null;
        }
        setIsTyping(event.isTyping);
      }
    });

    return () => {
      if (botReplyTimerRef.current) {
        window.clearTimeout(botReplyTimerRef.current);
        botReplyTimerRef.current = null;
      }
      unsubscribeChat();
      unsubscribeTyping();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      liveChatService.markConversationRead(conversationIdRef.current, 'visitor');
      setTimeout(() => {
        inputRef.current?.focus();
        scrollToBottom();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isTyping]);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text) return;

    // 1. Send via liveChatService for real-time synchronization with Admin dashboard & Telegram
    liveChatService.sendMessage({
      conversationId: conversationIdRef.current,
      sender: 'visitor',
      text,
    });

    setInputValue('');

    // If a live human operator has already replied in this conversation, do not interrupt with template bot replies
    if (hasLiveOperatorRepliedRef.current) {
      return;
    }

    setIsTyping(true);

    if (botReplyTimerRef.current) {
      window.clearTimeout(botReplyTimerRef.current);
    }

    const delay = Math.min(800, 350 + text.length * 10);

    botReplyTimerRef.current = window.setTimeout(() => {
      botReplyTimerRef.current = null;
      if (hasLiveOperatorRepliedRef.current) {
        setIsTyping(false);
        return;
      }

      const reply = getBotReply(text);

      // Record in service so both visitor and admin see assist response in real-time via subscription
      liveChatService.sendMessage({
        conversationId: conversationIdRef.current,
        sender: 'admin',
        senderName: 'Автопомощник Voxi',
        text: reply.text,
        action: reply.action,
      });

      setIsTyping(false);
    }, delay);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    liveChatService.setTyping(conversationIdRef.current, 'visitor');
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    liveChatService.setSoundEnabled(next);
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (visitorContact.trim()) {
      liveChatService.updateVisitorContact('Клиент с сайта', visitorContact);
      setContactSaved(true);
      setShowContactForm(false);
    }
  };

  return (
    <>
      {/* 1. FLOATING CHAT TRIGGER BUTTON (Bottom-Right) */}
      {!isOpen && (
        <div className="fixed bottom-5 right-4 sm:right-6 z-40 print:hidden">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Открыть онлайн-чат с дежурным администратором Voxi.by"
            className="group relative flex items-center gap-3 px-4 py-2.5 sm:px-5 sm:py-3 rounded-full bg-slate-900/95 hover:bg-black text-white shadow-xl shadow-slate-900/30 border border-slate-700/60 backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            {/* Green Pulse Online Indicator */}
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>

            {/* Chat Icon */}
            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-[#38bdf8]">
              <ChatRoundDotsIcon size={18} />
            </div>

            {/* Labels */}
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-bold text-white tracking-tight">
                  Чат с администратором
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/25 text-emerald-300 text-[10px] font-semibold">
                  Онлайн
                </span>
              </div>
              <span className="text-[10px] text-slate-300 hidden sm:inline">
                Ответим за 1 минуту • Минск
              </span>
            </div>

            {/* Unread indicator badge */}
            {hasUnread && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-[10px] font-bold text-white shadow-md">
                1
              </span>
            )}
          </button>
        </div>
      )}

      {/* 2. CHAT POPUP WINDOW */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Чат с дежурным администратором Voxi.by"
          className="fixed bottom-4 right-3 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-1.5rem)] sm:w-[390px] h-[550px] max-h-[85vh] bg-[#ffffff] border border-slate-200/90 rounded-[28px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-4 py-3.5 flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              {/* Admin Avatar */}
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#2563eb] to-[#4f46e5] flex items-center justify-center text-white font-bold text-sm shadow-sm">
                  V
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
              </div>
              {/* Admin Info */}
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-bold text-white">Администратор Voxi</span>
                  <CheckCircleIcon size={14} className="text-[#38bdf8]" />
                </div>
                <span className="text-[10px] text-emerald-400 font-medium">
                  ● В сети • Отвечает мгновенно
                </span>
              </div>
            </div>

            {/* Actions: Sound, Telegram & Close */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleToggleSound}
                aria-label={soundEnabled ? 'Отключить звук' : 'Включить звук'}
                title={soundEnabled ? 'Звук включен' : 'Звук выключен'}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                {soundEnabled ? <BellIcon size={16} className="text-emerald-400" /> : <BellOffIcon size={16} />}
              </button>

              <a
                href="https://t.me/voxi_support"
                target="_blank"
                rel="noopener noreferrer"
                title="Перейти в Telegram-чат @voxi_support"
                className="px-2.5 py-1 rounded-full bg-blue-600/30 hover:bg-blue-600/50 text-[#38bdf8] text-[11px] font-medium flex items-center gap-1 transition-colors"
              >
                <span>Telegram</span>
              </a>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Закрыть чат"
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <CloseCircleIcon size={20} />
              </button>
            </div>
          </div>

          {/* Subheader banner */}
          <div className="bg-blue-50/80 border-b border-blue-100/80 px-4 py-1.5 flex items-center justify-between text-[11px] text-blue-900">
            <div className="flex items-center gap-1.5 font-medium">
              <ShieldCheckIcon size={13} className="text-[#2563eb]" />
              <span>Официальная поддержка в Беларуси (УНП 193991846)</span>
            </div>
          </div>

          {/* Optional Quick Contact Reminder */}
          {!contactSaved ? (
            showContactForm ? (
              <form onSubmit={handleSaveContact} className="p-2.5 bg-slate-100 border-b border-slate-200 flex items-center gap-2 text-xs">
                <input
                  type="text"
                  aria-label="Ваш телефон или Telegram"
                  placeholder="+375 (29) ... или @telegram"
                  value={visitorContact}
                  onChange={(e) => setVisitorContact(e.target.value)}
                  className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700"
                >
                  OK
                </button>
                <button
                  type="button"
                  onClick={() => setShowContactForm(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              </form>
            ) : (
              <div className="px-4 py-1 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                <span>Переписка сохраняется в реальном времени</span>
                <button
                  type="button"
                  onClick={() => setShowContactForm(true)}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Оставить телефон
                </button>
              </div>
            )
          ) : (
            <div className="px-4 py-0.5 bg-emerald-50/80 border-b border-emerald-100 text-[10px] text-emerald-700 flex items-center justify-between">
              <span>Контакт сохранен: {visitorContact}</span>
              <button
                type="button"
                onClick={() => setShowContactForm(true)}
                className="text-slate-400 hover:text-slate-600"
              >
                изменить
              </button>
            </div>
          )}

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs bg-slate-50/50">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed text-xs shadow-sm ${
                    m.sender === 'user'
                      ? 'bg-gradient-to-r from-[#2563eb] to-[#4f46e5] text-white rounded-br-xs'
                      : 'bg-[#ffffff] text-slate-800 border border-slate-200/80 rounded-bl-xs'
                  }`}
                >
                  <p>{m.text}</p>

                  {/* Context Action Button in Admin Message */}
                  {m.action === 'voice_test' && onOpenVoiceTest && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onOpenVoiceTest();
                      }}
                      className="mt-2.5 w-full px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <PhoneCallingRoundedIcon size={13} />
                      <span>Позвонить ассистенту (1 клик)</span>
                    </button>
                  )}

                  {m.action === 'auth' && onOpenAuth && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onOpenAuth();
                      }}
                      className="mt-2.5 w-full px-3 py-1.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>Настроить за 5 минут</span>
                      <ArrowRightIcon size={12} />
                    </button>
                  )}

                  {m.action === 'telegram' && (
                    <a
                      href="https://t.me/voxi_support"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2.5 w-full px-3 py-1.5 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>Написать в @voxi_support</span>
                    </a>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">
                  {m.sender === 'user' ? 'Вы' : 'Администратор'} • {m.time}
                </span>
              </div>
            ))}

            {/* Typing Animation */}
            {isTyping && (
              <div className="flex items-center gap-1 text-[11px] text-slate-500 bg-white border border-slate-200/80 px-3 py-2 rounded-2xl w-fit shadow-xs">
                <span>Администратор печатает</span>
                <span className="inline-flex items-center gap-0.5 ml-1">
                  <span className="w-1 h-1 rounded-full bg-slate-400 animate-bounce" />
                  <span className="w-1 h-1 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1 h-1 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Question Chips (Always Accessible) */}
          <div className="px-3 py-2 bg-[#ffffff] border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {QUICK_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(chip)}
                className="shrink-0 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <div className="p-3 bg-[#ffffff] border-t border-slate-200/80 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              aria-label="Текст сообщения"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Задайте вопрос администратору..."
              className="flex-1 bg-slate-100/80 focus:bg-white text-xs px-3.5 py-2.5 rounded-full border border-slate-200 focus:border-[#2563eb] focus:outline-none transition-colors text-slate-900 placeholder:text-slate-400"
            />
            <button
              type="button"
              disabled={!inputValue.trim()}
              onClick={() => handleSendMessage()}
              aria-label="Отправить сообщение"
              className="w-9 h-9 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] disabled:bg-slate-200 disabled:text-slate-400 text-white flex items-center justify-center transition-all shrink-0 cursor-pointer disabled:cursor-not-allowed"
            >
              <SendSquareIcon size={18} />
            </button>
          </div>

          {/* Footer note */}
          <div className="px-3 py-1 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 text-center flex items-center justify-center gap-1.5">
            <span>ИП Беляков К. О. • Минск</span>
            <span>•</span>
            <a
              href="https://t.me/voxi_support"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#2563eb] hover:underline"
            >
              Telegram @voxi_support
            </a>
          </div>
        </div>
      )}
    </>
  );
};
