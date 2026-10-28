import { generateReply } from "./ai.js";

const API = "https://api.telegram.org";

export default class TelegramBot {
  constructor(token) {
    this.token = token;
    this.botId = null;
    this.botUsername = (process.env.BOT_USERNAME || "").replace(/^@/, "").toLowerCase();
    this.maxContext = Math.max(2, Number(process.env.MAX_CONTEXT_MESSAGES || 12));
    this.history = new Map();
  }

  async call(method, payload = {}) {
    const res = await fetch(`${API}/bot${this.token}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(65000)
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.description || `Telegram API error: ${method}`);
    return data.result;
  }

  async init() {
    const me = await this.call("getMe");
    this.botId = me.id;
    this.botUsername ||= (me.username || "").toLowerCase();
    console.log(`Telegram bot authenticated as @${me.username}`);
  }

  async setWebhook(baseUrl, secret) {
    const url = `${baseUrl.replace(/\/+$/, "")}/telegram-webhook`;
    await this.call("setWebhook", {
      url,
      secret_token: secret,
      allowed_updates: ["message"],
      drop_pending_updates: false
    });
    console.log(`Webhook registered: ${url}`);
  }

  async handleUpdate(update) {
    if (update?.message) await this.handleMessage(update.message);
  }

  async handleMessage(message) {
    const chatId = message.chat?.id;
    const text = message.text || message.caption || "";
    if (!chatId || !text.trim() || message.from?.is_bot) return;

    const entities = [...(message.entities || []), ...(message.caption_entities || [])];
    const mentioned = this.botUsername && entities.some(e =>
      e.type === "mention" &&
      text.slice(e.offset, e.offset + e.length).toLowerCase() === `@${this.botUsername}`
    );
    const repliedToBot = message.reply_to_message?.from?.id === this.botId;
    if (!mentioned && !repliedToBot) return;

    const cleanText = this.botUsername
      ? text.replace(new RegExp(`@${this.escapeRegExp(this.botUsername)}`, "ig"), "").trim()
      : text.trim();
    const key = String(chatId);
    const history = this.history.get(key) || [];
    const input = cleanText || text;
    const context = [...history, { role: "user", content: input }].slice(-this.maxContext);

    try {
      const reply = await generateReply(context);
      await this.call("sendMessage", {
        chat_id: chatId,
        text: reply.slice(0, 4000),
        reply_parameters: { message_id: message.message_id },
        ...(message.message_thread_id ? { message_thread_id: message.message_thread_id } : {})
      });
      this.history.set(key, [...context, { role: "assistant", content: reply }].slice(-this.maxContext));
    } catch (err) {
      console.error("Reply error:", err?.message || err);
      await this.call("sendMessage", {
        chat_id: chatId,
        text: "الان نتونستم پاسخ بدم؛ تنظیمات مدل یا اتصالش رو بررسی کن.",
        reply_parameters: { message_id: message.message_id }
      }).catch(() => {});
    }
  }

  escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
