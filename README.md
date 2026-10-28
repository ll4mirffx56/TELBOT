# TELBOT — Telegram AI Bot

## Features
- Replies when explicitly mentioned with @username or when someone replies to the bot's message.
- Personality is kept separately in `persona/persona.md`.
- Gemini API support using Google's native REST API.
- Optional OpenAI-compatible provider.
- Local polling mode and hosted webhook mode.
- Health endpoint at `/health`.

## Requirements
- Node.js 20+
- Telegram bot token from @BotFather
- Gemini API key from Google AI Studio and a model available to your project

## Local test
1. Copy `.env.example` to `.env`.
2. Fill in `TELEGRAM_BOT_TOKEN`, `AI_API_KEY`, and `AI_MODEL`.
3. Keep `AI_PROVIDER=gemini` and `BOT_MODE=polling`.
4. Run `npm install`, then `npm start`.

For the optional OpenAI-compatible provider, set `AI_PROVIDER=openai-compatible` and provide `AI_BASE_URL`, `AI_API_KEY`, and `AI_MODEL`.

## Railway deployment
1. In Railway, create a project and choose **Deploy from GitHub repo**, then select `ll4mirffx56/TELBOT`.
2. In the service's **Variables** section, add:
   - `TELEGRAM_BOT_TOKEN` = your BotFather token
   - `AI_PROVIDER` = `gemini`
   - `AI_API_KEY` = your Google AI Studio key
   - `AI_MODEL` = a model name available to your Gemini API project
   - `BOT_MODE` = `webhook`
   - `WEBHOOK_SECRET` = a private random string of at least 32 characters
3. Deploy the service. In **Settings → Networking**, generate a public domain.
4. Add `WEBHOOK_URL` as that public HTTPS base URL (for example, `https://your-service.up.railway.app`, without a path), then redeploy.
5. Open `https://your-service-domain/health`. A healthy service returns JSON with `ok: true`.
6. Open the bot in Telegram and test it by mentioning it or replying to one of its messages.

Do not put Telegram or Gemini secrets in source code, commits, screenshots, or chat messages. Add them only in Railway's private Variables interface. Never create a second service that runs polling at the same time as the webhook service.

## Important limitations
- Railway trial credit is temporary; the Free plan has limited monthly credit and may not be enough for an always-on service. Check current pricing and usage in Railway before relying on 24/7 operation.
- Gemini API has separate model-specific rate limits and quotas; verify them in Google AI Studio.
- Conversation history is kept in memory and resets on restarts. It is not shared across multiple instances.
- Free/trial hosting does not guarantee uninterrupted 24/7 uptime.

## Personality
Edit `persona/persona.md` to change the bot's personality. This file is intentionally separate from the AI integration code.
