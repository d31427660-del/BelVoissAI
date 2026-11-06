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
const conversations = new Map<string, StoredConversation>();

async function notifyAdminInTelegram(message: StoredMessage, conv: StoredConversation) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || process.env.VOXI_TELEGRAM_BOT_TOKEN;
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.VOXI_TELEGRAM_ADMIN_CHAT_ID || process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !adminChatId) {
    return;
  }

  const contactInfo = conv.visitorContact ? `\n📞 Контакт: ${conv.visitorContact}` : '';
  const cityInfo = conv.visitorCity ? ` [${conv.visitorCity}]` : '';
  const text = [
    `💬 *Новое сообщение в онлайн-чате Voxi.by!*`,
    `👤 *От:* ${conv.visitorName}${cityInfo}${contactInfo}`,
    `🆔 *Диалог:* \`${conv.id}\``,
    `\n📝 *Сообщение:*`,
    message.text,
    `\n👉 Ответить из панели: https://voxi.by/ (раздел «Чат поддержки»)`,
  ].join('\n');

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: adminChatId,
        text,
        parse_mode: 'Markdown',
      }),
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
