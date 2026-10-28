import "dotenv/config";
import express from "express";
import TelegramBot from "./bot.js";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error("Missing TELEGRAM_BOT_TOKEN environment variable.");
  process.exit(1);
}

const bot = new TelegramBot(token);
await bot.init();

const mode = (process.env.BOT_MODE || "polling").toLowerCase();

if (mode === "webhook") {
  const baseUrl = process.env.WEBHOOK_URL;
  const secret = process.env.WEBHOOK_SECRET;
  if (!baseUrl || !secret || secret.length < 32) {
    console.error("Webhook mode requires WEBHOOK_URL and WEBHOOK_SECRET (32+ characters).");
    process.exit(1);
  }

  const app = express();
  app.use(express.json({ limit: "1mb" }));
  app.get("/health", (_req, res) => res.status(200).json({ ok: true }));
  app.post("/telegram-webhook", async (req, res) => {
    if (req.get("x-telegram-bot-api-secret-token") !== secret) {
      return res.sendStatus(401);
    }
    // Acknowledge promptly; process the update asynchronously.
    res.sendStatus(200);
    bot.handleUpdate(req.body).catch(err => console.error("Update error:", err?.message || err));
  });

  const port = Number(process.env.PORT || 3000);
  app.listen(port, async () => {
    console.log(`Webhook server listening on port ${port}`);
    try {
      await bot.setWebhook(baseUrl, secret);
    } catch (err) {
      console.error("Could not register webhook:", err?.message || err);
      process.exit(1);
    }
  });
} else if (mode === "polling") {
  console.log("Starting Telegram long polling...");
  let offset = 0;
  while (true) {
    try {
      const updates = await bot.call("getUpdates", {
        offset, timeout: 45, allowed_updates: ["message"]
      });
      for (const update of updates) {
        offset = update.update_id + 1;
        await bot.handleUpdate(update);
      }
    } catch (err) {
      console.error("Polling error:", err?.message || err);
      await new Promise(resolve => setTimeout(resolve, 2500));
    }
  }
} else {
  console.error("BOT_MODE must be either 'polling' or 'webhook'.");
  process.exit(1);
}
