// Vercel Serverless Function: /api/live-chat
// Handles real-time messaging between visitors and Voxi administrators,
// with automatic instant Telegram notification to the administrator's phone.

interface StoredMessage {
  id: string;
  conversationId: string;
  sender: 'admin' | 'visitor' | 'system';
  senderName?: string;
  text: string;
  createdAt: string;
  action?: string;
}

interface StoredConversation {
  id: string;
  visitorId: string;
  visitorName: string;
  visitorContact?: string;
  visitorCity?: string;
  startedAt: string;
  lastMessageAt: string;
  lastMessageText: string;
  messages: StoredMessage[];
}

// Global in-memory storage for serverless runtime (resilient across hot invocations)
const MAX_CONVERSATIONS = 200;
const conversations = new Map<string, StoredConversation>();

function enforceConversationLimit() {
  if (conversations.size <= MAX_CONVERSATIONS) return;
  const sorted = Array.from(conversations.entries()).sort(
    (a, b) => new Date(a[1].lastMessageAt).getTime() - new Date(b[1].lastMessageAt).getTime()
  );
  const toDelete = sorted.length - MAX_CONVERSATIONS;
  for (let i = 0; i < toDelete; i++) {
    conversations.delete(sorted[i][0]);
  }
}

const DEFAULT_TELEGRAM_BOT_TOKEN = '9051705111:AAGD452S-c8yZtcBa6gMV1mxYEUHsG9rZ7U';
let discoveredAdminChatId = '';
let lastProcessedUpdateId = 0;

function getBotToken(): string {
  return (
    process.env.TELEGRAM_BOT_TOKEN ||
    process.env.VOXI_TELEGRAM_BOT_TOKEN ||
    DEFAULT_TELEGRAM_BOT_TOKEN
  ).trim();
}

async function resolveAdminChatId(botToken: string): Promise<string> {
  const envChatId = (
    process.env.TELEGRAM_ADMIN_CHAT_ID ||
    process.env.VOXI_TELEGRAM_ADMIN_CHAT_ID ||
    process.env.TELEGRAM_CHAT_ID ||
    ''
  ).trim();
  if (envChatId) return envChatId;
  if (discoveredAdminChatId) return discoveredAdminChatId;

  try {
    const resp = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates?limit=30`, {
      signal: AbortSignal.timeout(3500),
    });
    if (!resp.ok) return '';
    const data = await resp.json();
    if (data?.ok && Array.isArray(data.result)) {
      for (let i = data.result.length - 1; i >= 0; i--) {
        const upd = data.result[i];
        const chatId = upd?.message?.chat?.id || upd?.edited_message?.chat?.id;
        if (chatId) {
          discoveredAdminChatId = String(chatId);
          break;
        }
      }
    }
  } catch {
    // ignore network timeout
  }
  return discoveredAdminChatId;
}

async function syncTelegramReplies() {
  const botToken = getBotToken();
  if (!botToken || conversations.size === 0) return;

  try {
    const offsetParam = lastProcessedUpdateId > 0 ? `&offset=${lastProcessedUpdateId + 1}` : '';
    const resp = await fetch(
      `https://api.telegram.org/bot${botToken}/getUpdates?limit=30${offsetParam}`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (!resp.ok) return;
    const data = await resp.json();
    if (!data?.ok || !Array.isArray(data.result)) return;

    for (const upd of data.result) {
      if (typeof upd.update_id === 'number' && upd.update_id > lastProcessedUpdateId) {
        lastProcessedUpdateId = upd.update_id;
      }
      const msg = upd.message;
      if (!msg || !msg.text || msg.from?.is_bot) continue;

      if (msg.chat?.id && !discoveredAdminChatId) {
        discoveredAdminChatId = String(msg.chat.id);
      }

      const rawText = String(msg.text).trim();
      if (rawText === '/start') continue;

      // Определяем целевой диалог: по Reply на сообщение бота или самый свежий активный диалог
      let targetConv: StoredConversation | undefined;
      const repliedText = String(msg.reply_to_message?.text || '');
      const idMatch = repliedText.match(/Диалог:\s*([^\s\n]+)/);
      if (idMatch && idMatch[1]) {
        targetConv = conversations.get(idMatch[1].trim());
      }
      if (!targetConv) {
        const sorted = Array.from(conversations.values()).sort(
          (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
        );
        targetConv = sorted[0];
      }
      if (!targetConv) continue;

      const tgMsgId = `tg_reply_${msg.message_id}`;
      const alreadyAdded = targetConv.messages.some((m) => m.id === tgMsgId);
      if (!alreadyAdded) {
        const storedMsg: StoredMessage = {
          id: tgMsgId,
          conversationId: targetConv.id,
          sender: 'admin',
          senderName: 'Администратор Voxi',
          text: rawText.slice(0, 2000),
          createdAt: new Date((msg.date || Math.floor(Date.now() / 1000)) * 1000).toISOString(),
        };
        targetConv.messages.push(storedMsg);
        targetConv.lastMessageAt = storedMsg.createdAt;
        targetConv.lastMessageText = storedMsg.text;
      }
    }
  } catch {
    // ignore
  }
}

async function notifyAdminInTelegram(message: StoredMessage, conv: StoredConversation) {
  const botToken = getBotToken();
  if (!botToken) return;

  const adminChatId = await resolveAdminChatId(botToken);
  if (!adminChatId) {
    return;
  }

  const contactInfo = conv.visitorContact ? `\n📞 Контакт: ${conv.visitorContact}` : '';
  const cityInfo = conv.visitorCity ? ` [${conv.visitorCity}]` : '';
  const text = [
    `💬 Новое сообщение в онлайн-чате Voxi.by!`,
    `👤 От: ${conv.visitorName}${cityInfo}${contactInfo}`,
    `🆔 Диалог: ${conv.id}`,
    `\n📝 Сообщение:`,
    message.text,
    `\n💡 Ответьте (Reply) прямо на это сообщение в Telegram — ваш ответ мгновенно появится у клиента на сайте!`,
  ].join('\n');

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: adminChatId,
        text,
      }),
      signal: AbortSignal.timeout(4000),
    });
  } catch (err) {
    console.error('Failed to notify admin in Telegram:', err);
  }
}

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const action = req.query.action || req.body?.action || 'get';

  try {
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};

      if (action === 'send') {
        const { conversationId, visitorId, visitorName, visitorContact, visitorCity, message } = body;
        if (!conversationId || !message || !message.text) {
          return res.status(400).json({ error: 'Missing conversationId or message text' });
        }

        let conv = conversations.get(conversationId);
        if (!conv) {
          conv = {
            id: conversationId,
            visitorId: visitorId || 'guest',
            visitorName: visitorName || 'Посетитель',
            visitorContact: visitorContact || '',
            visitorCity: visitorCity || 'Минск',
            startedAt: new Date().toISOString(),
            lastMessageAt: new Date().toISOString(),
            lastMessageText: message.text,
            messages: [],
          };
          conversations.set(conversationId, conv);
          enforceConversationLimit();
        }

        const storedMsg: StoredMessage = {
          id: message.id || `msg_${Date.now()}`,
          conversationId,
          sender: message.sender || 'visitor',
          senderName: message.senderName || (message.sender === 'admin' ? 'Администратор Voxi' : conv.visitorName),
          text: String(message.text).slice(0, 2000),
          createdAt: message.createdAt || new Date().toISOString(),
          action: message.action,
        };

        conv.messages.push(storedMsg);
        conv.lastMessageAt = storedMsg.createdAt;
        conv.lastMessageText = storedMsg.text;
        if (visitorContact) conv.visitorContact = visitorContact;
        if (visitorName) conv.visitorName = visitorName;

        // If visitor sent message, forward to Telegram
        if (storedMsg.sender === 'visitor') {
          await notifyAdminInTelegram(storedMsg, conv);
        }

        return res.status(200).json({ success: true, message: storedMsg });
      }

      if (action === 'admin_reply') {
        const { conversationId, text, actionType } = body;
        if (!conversationId || !text) {
          return res.status(400).json({ error: 'Missing conversationId or text' });
        }

        const conv = conversations.get(conversationId);
        if (!conv) {
          return res.status(404).json({ error: 'Conversation not found' });
        }

        const storedMsg: StoredMessage = {
          id: `admin_msg_${Date.now()}`,
          conversationId,
          sender: 'admin',
          senderName: 'Администратор Voxi',
          text: String(text).slice(0, 2000),
          createdAt: new Date().toISOString(),
          action: actionType,
        };

        conv.messages.push(storedMsg);
        conv.lastMessageAt = storedMsg.createdAt;
        conv.lastMessageText = storedMsg.text;

        return res.status(200).json({ success: true, message: storedMsg });
      }
    }

    if (req.method === 'GET') {
      await syncTelegramReplies();
      if (action === 'list') {
        const list = Array.from(conversations.values()).sort(
          (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
        );
        return res.status(200).json({ success: true, conversations: list });
      }

      const conversationId = req.query.conversationId;
      if (conversationId) {
        const conv = conversations.get(String(conversationId));
        return res.status(200).json({ success: true, conversation: conv || null });
      }
    }

    return res.status(200).json({ success: true, status: 'online' });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Internal server error' });
  }
}
