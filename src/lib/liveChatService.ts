import { LiveChatMessage, LiveChatConversation } from '../types';

const STORAGE_KEY_CONVERSATIONS = 'voxi_livechat_conversations_v1';
const STORAGE_KEY_VISITOR_SESSION = 'voxi_livechat_visitor_session_v1';

export interface VisitorSession {
  visitorId: string;
  conversationId: string;
  name: string;
  contact: string;
  city: string;
  page: string;
}

type ChatListener = (conversations: LiveChatConversation[], activeConv?: LiveChatConversation) => void;
type TypingListener = (event: { conversationId: string; sender: 'admin' | 'visitor'; isTyping: boolean }) => void;

class LiveChatService {
  private channel: BroadcastChannel | null = null;
  private chatListeners: Set<ChatListener> = new Set();
  private typingListeners: Set<TypingListener> = new Set();
  private isSoundEnabled: boolean = true;
  private typingTimeouts: Map<string, any> = new Map();
  private serverPollTimer: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        if ('BroadcastChannel' in window) {
          this.channel = new BroadcastChannel('voxi_livechat_bus');
          this.channel.onmessage = (event) => {
            this.handleBroadcastMessage(event.data);
          };
        }
      } catch (e) {
        console.warn('BroadcastChannel not available:', e);
      }

      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY_CONVERSATIONS) {
          this.notifyListeners();
        }
      });

      // Background polling disabled
      this.serverPollTimer = null;
    }
  }

  public getVisitorSession(): VisitorSession {
    if (typeof window === 'undefined') {
      return {
        visitorId: 'guest_ssr',
        conversationId: 'conv_ssr',
        name: 'Посетитель',
        contact: '',
        city: 'Минск',
        page: '/',
      };
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY_VISITOR_SESSION);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }

    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const newSession: VisitorSession = {
      visitorId: `visitor_${randomSuffix}`,
      conversationId: `conv_${randomSuffix}`,
      name: `Гость #${randomSuffix.toUpperCase()}`,
      contact: '',
      city: 'Минск',
      page: typeof window !== 'undefined' ? window.location.pathname : '/',
    };

    try {
      localStorage.setItem(STORAGE_KEY_VISITOR_SESSION, JSON.stringify(newSession));
    } catch {
      // ignore
    }

    return newSession;
  }

  public updateVisitorContact(name: string, contact: string): void {
    const session = this.getVisitorSession();
    session.name = name.trim() || session.name;
    session.contact = contact.trim();
    try {
      localStorage.setItem(STORAGE_KEY_VISITOR_SESSION, JSON.stringify(session));
      
      const convs = this.getAllConversations();
      const existing = convs.find((c) => c.id === session.conversationId);
      if (existing) {
        existing.visitorName = session.name;
        existing.visitorContact = session.contact;
        this.saveAllConversations(convs);
      }
    } catch {
      // ignore
    }
  }

  public getAllConversations(): LiveChatConversation[] {
    if (typeof window === 'undefined') return [];

    try {
      const raw = localStorage.getItem(STORAGE_KEY_CONVERSATIONS);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // ignore
    }

    // Default seed conversation for visitor if empty
    const session = this.getVisitorSession();
    const initialConversation: LiveChatConversation = {
      id: session.conversationId,
      visitorId: session.visitorId,
      visitorName: session.name,
      visitorContact: session.contact,
      visitorCity: session.city,
      visitorPage: session.page,
      startedAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString(),
      lastMessageText: 'Здравствуйте! Я дежурный администратор платформы Voxi.by...',
      unreadByAdmin: 0,
      unreadByVisitor: 0,
      isVisitorOnline: true,
      isAdminOnline: true,
      messages: [
        {
          id: 'init_1',
          conversationId: session.conversationId,
          sender: 'admin',
          senderName: 'Администратор Voxi',
          text: 'Здравствуйте! 👋 Я дежурный администратор платформы Voxi.by в Минске.',
          createdAt: new Date(Date.now() - 45000).toISOString(),
          readByVisitor: true,
          readByAdmin: true,
        },
        {
          id: 'init_2',
          conversationId: session.conversationId,
          sender: 'admin',
          senderName: 'Администратор Voxi',
          text: 'Подскажу по тарифам в BYN (0.35–0.45 руб/мин), подключению номеров МТС и А1 через SIP или помогу настроить ассистента под ваш бизнес. Напишите нам — отвечу в реальном времени!',
          createdAt: new Date(Date.now() - 30000).toISOString(),
          readByVisitor: true,
          readByAdmin: true,
        },
      ],
    };

    const initialList = [initialConversation];
    try {
      localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(initialList));
    } catch {
      // ignore
    }
    return initialList;
  }

  public getVisitorConversation(): LiveChatConversation {
    const session = this.getVisitorSession();
    const convs = this.getAllConversations();
    let found = convs.find((c) => c.id === session.conversationId);

    if (!found) {
      found = {
        id: session.conversationId,
        visitorId: session.visitorId,
        visitorName: session.name,
        visitorContact: session.contact,
        visitorCity: session.city,
        visitorPage: session.page,
        startedAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString(),
        lastMessageText: 'Новый диалог',
        unreadByAdmin: 0,
        unreadByVisitor: 0,
        isVisitorOnline: true,
        isAdminOnline: true,
        messages: [],
      };
      convs.unshift(found);
      this.saveAllConversations(convs);
    }
    return found;
  }

  public sendMessage(params: {
    conversationId: string;
    sender: 'admin' | 'visitor';
    senderName?: string;
    text: string;
    action?: 'voice_test' | 'telegram' | 'auth' | 'calculator';
  }): LiveChatMessage {
    const { conversationId, sender, senderName, text, action } = params;
    const convs = this.getAllConversations();
    let conv = convs.find((c) => c.id === conversationId);

    if (!conv) {
      conv = this.getVisitorConversation();
      if (!convs.some((c) => c.id === conv?.id)) {
        convs.push(conv);
      }
    }

    const newMessage: LiveChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      conversationId,
      sender,
      senderName: senderName || (sender === 'admin' ? 'Администратор Voxi' : conv.visitorName),
      text: text.trim(),
      createdAt: new Date().toISOString(),
      action,
      readByAdmin: sender === 'admin',
      readByVisitor: sender === 'visitor',
    };

    conv.messages.push(newMessage);
    conv.lastMessageAt = newMessage.createdAt;
    conv.lastMessageText = newMessage.text;

    if (sender === 'visitor') {
      conv.unreadByAdmin += 1;
      conv.isVisitorOnline = true;
    } else {
      conv.unreadByVisitor += 1;
      conv.isAdminOnline = true;
    }

    this.saveAllConversations(convs);

    // Play notification sound for the other party
    this.playNotificationSound();

    // Broadcast across browser tabs and windows
    this.broadcast({
      type: 'NEW_MESSAGE',
      conversationId,
      message: newMessage,
    });

    // Notify backend (ISPmanager PHP API + Telegram)
    this.syncMessageToServer(newMessage, conv);

    this.notifyListeners();
    return newMessage;
  }

  public markConversationRead(conversationId: string, as: 'admin' | 'visitor'): void {
    const convs = this.getAllConversations();
    const conv = convs.find((c) => c.id === conversationId);
    if (!conv) return;

    if (as === 'admin') {
      conv.unreadByAdmin = 0;
      conv.messages.forEach((m) => {
        m.readByAdmin = true;
      });
    } else {
      conv.unreadByVisitor = 0;
      conv.messages.forEach((m) => {
        m.readByVisitor = true;
      });
    }

    this.saveAllConversations(convs);
    this.broadcast({
      type: 'MARK_READ',
      conversationId,
      as,
    });
    this.notifyListeners();
  }

  public setTyping(conversationId: string, sender: 'admin' | 'visitor'): void {
    this.broadcast({
      type: 'TYPING',
      conversationId,
      sender,
      isTyping: true,
    });

    const key = `${conversationId}_${sender}`;
    if (this.typingTimeouts.has(key)) {
      clearTimeout(this.typingTimeouts.get(key));
    }

    const timer = setTimeout(() => {
      this.broadcast({
        type: 'TYPING',
        conversationId,
        sender,
        isTyping: false,
      });
    }, 2500);

    this.typingTimeouts.set(key, timer);
  }

  public playNotificationSound(): void {
    if (!this.isSoundEnabled || typeof window === 'undefined') return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Crisp 2-tone chime: 880Hz (A5) -> 1320Hz (E6)
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.12);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.36);

      setTimeout(() => {
        try {
          ctx.close();
        } catch {
          // ignore
        }
      }, 400);
    } catch {
      // AudioContext policy or restricted
    }
  }

  public setSoundEnabled(enabled: boolean): void {
    this.isSoundEnabled = enabled;
  }

  public getIsSoundEnabled(): boolean {
    return this.isSoundEnabled;
  }

  public subscribe(listener: ChatListener): () => void {
    this.chatListeners.add(listener);
    // Initial call
    listener(this.getAllConversations(), this.getVisitorConversation());

    return () => {
      this.chatListeners.delete(listener);
    };
  }

  public subscribeTyping(listener: TypingListener): () => void {
    this.typingListeners.add(listener);
    return () => {
      this.typingListeners.delete(listener);
    };
  }

  private saveAllConversations(convs: LiveChatConversation[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(convs));
    } catch {
      // ignore
    }
  }

  private broadcast(data: any): void {
    if (this.channel) {
      try {
        this.channel.postMessage(data);
      } catch (e) {
        console.warn('Broadcast failed:', e);
      }
    }
  }

  private handleBroadcastMessage(data: any): void {
    if (!data || !data.type) return;

    if (data.type === 'NEW_MESSAGE') {
      this.playNotificationSound();
      this.notifyListeners();
    } else if (data.type === 'MARK_READ') {
      this.notifyListeners();
    } else if (data.type === 'TYPING') {
      this.typingListeners.forEach((fn) =>
        fn({
          conversationId: data.conversationId,
          sender: data.sender,
          isTyping: data.isTyping,
        })
      );
    }
  }

  private notifyListeners(): void {
    const convs = this.getAllConversations();
    const visitorConv = this.getVisitorConversation();
    this.chatListeners.forEach((fn) => fn(convs, visitorConv));
  }

  private async pullRemoteConversations(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      const res = await fetch('/api/live-chat?action=list', {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) return;
      const contentType = (res.headers.get('content-type') || '').toLowerCase();
      if (!contentType.includes('application/json')) return;
      const data = await res.json();
      if (!data?.success || !Array.isArray(data.conversations)) return;

      const localConvs = this.getAllConversations();
      let updated = false;
      let hasNewIncomingMessage = false;

      for (const remoteConv of data.conversations) {
        if (!remoteConv || !remoteConv.id || !Array.isArray(remoteConv.messages)) continue;
        let local = localConvs.find((c) => c.id === remoteConv.id);
        if (!local) {
          local = {
            id: String(remoteConv.id),
            visitorId: String(remoteConv.visitorId || 'guest'),
            visitorName: String(remoteConv.visitorName || 'Посетитель'),
            visitorContact: String(remoteConv.visitorContact || ''),
            visitorCity: String(remoteConv.visitorCity || 'Минск'),
            visitorPage: '/',
            startedAt: String(remoteConv.startedAt || new Date().toISOString()),
            lastMessageAt: String(remoteConv.lastMessageAt || new Date().toISOString()),
            lastMessageText: String(remoteConv.lastMessageText || ''),
            unreadByAdmin: 1,
            unreadByVisitor: 0,
            isVisitorOnline: true,
            isAdminOnline: true,
            messages: [],
          };
          localConvs.unshift(local);
          updated = true;
        }

        const existingIds = new Set(local.messages.map((m) => m.id));
        for (const rMsg of remoteConv.messages) {
          if (!rMsg || !rMsg.id || existingIds.has(rMsg.id)) continue;
          local.messages.push({
            id: String(rMsg.id),
            conversationId: local.id,
            sender: rMsg.sender === 'admin' ? 'admin' : 'visitor',
            senderName: String(rMsg.senderName || (rMsg.sender === 'admin' ? 'Администратор Voxi' : local.visitorName)),
            text: String(rMsg.text || ''),
            createdAt: String(rMsg.createdAt || new Date().toISOString()),
            action: rMsg.action,
            readByAdmin: rMsg.sender === 'admin',
            readByVisitor: rMsg.sender === 'visitor',
          });
          local.lastMessageAt = String(rMsg.createdAt || local.lastMessageAt);
          local.lastMessageText = String(rMsg.text || local.lastMessageText);
          if (rMsg.sender === 'admin') {
            local.unreadByVisitor = (local.unreadByVisitor || 0) + 1;
          } else {
            local.unreadByAdmin = (local.unreadByAdmin || 0) + 1;
          }
          updated = true;
          hasNewIncomingMessage = true;
        }
      }

      if (updated) {
        this.saveAllConversations(localConvs);
        if (hasNewIncomingMessage) {
          this.playNotificationSound();
        }
        this.notifyListeners();
      }
    } catch {
      // ignore offline or static preview
    }
  }

  private async syncMessageToServer(message: LiveChatMessage, conv: LiveChatConversation): Promise<void> {
    try {
      const endpoints = ['/api/live-chat', '/api/live-chat.php'];
      const payload = {
        action: 'send',
        conversationId: conv.id,
        visitorId: conv.visitorId,
        visitorName: conv.visitorName,
        visitorContact: conv.visitorContact,
        visitorCity: conv.visitorCity,
        message,
      };

      for (const ep of endpoints) {
        try {
          const res = await fetch(ep, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (res.ok) {
            break;
          }
        } catch {
          // failover to next endpoint or offline local
        }
      }
    } catch {
      // offline fallback
    }
  }
}

export const liveChatService = new LiveChatService();
