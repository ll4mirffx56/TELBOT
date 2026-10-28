# Telegram AI Bot — deploy-ready starter

## Features
- Responds only to an explicit @mention or a reply to the bot's message.
- Personality is stored separately in `persona/persona.md`.
- Provider settings are environment variables; never commit real tokens.
- Local polling mode and hosted webhook mode.
- Health endpoint at `/health` for deployment checks.

## Requirements
- Node.js 20+
- Telegram bot token from @BotFather
- API key and model from an OpenAI-compatible AI provider

## Local test
1. Copy `.env.example` to `.env`.
2. Fill in `TELEGRAM_BOT_TOKEN`, `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`.
3. Keep `BOT_MODE=polling`.
4. Run `npm install`, then `npm start`.

## Online deployment
Set these environment variables in your host dashboard:
- `BOT_MODE=webhook`
- `TELEGRAM_BOT_TOKEN`
- `AI_BASE_URL`
- `AI_API_KEY`
- `AI_MODEL`
- `WEBHOOK_URL` = public HTTPS base URL of your deployed service
- `WEBHOOK_SECRET` = a random secret string of 32+ characters
- `BOT_USERNAME` (optional; the bot can retrieve it from Telegram)

The app registers the webhook on startup at `/telegram-webhook`. It validates Telegram's secret-token header and exposes `/health`.

## Important limitations
- This starter keeps short conversation history in memory; it resets on restarts and is not shared between multiple instances.
- A free host may sleep, restart, or impose quotas. "Free" does not guarantee uninterrupted 24/7 availability.
- The AI API may have separate quotas or costs.
- Confirm the host's reputation and terms before giving it any secrets.
