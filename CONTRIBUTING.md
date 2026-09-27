# Contributing to ORBITAL

Thanks for helping. ORBITAL handles real money, so changes are held to a careful standard. Please read this before opening a pull request.

## Getting set up

1. Use Node.js 22.5 or newer.
2. `npm install`, then `cp .env.example .env.local` and fill it in. Use a **test** Telegram bot token (from @BotFather), never the live one.
3. Run the three processes (`npm run dev`, `npm run bot`, `npm run rate-worker`) as described in the README.

Your local `data/orbital.db` is created automatically. Never commit it, `.env.local`, or anything under `data/uploads/`; they are git-ignored for a reason.

## Before you open a pull request

Run both checks; a pull request that fails either will not be merged:

```bash
npx tsc --noEmit -p .
npx eslint app components lib bot worker config
```

Then check your change in a browser (website and `/admin`) and, if you touched the bot, in Telegram with your test bot.

## Working on the code

- **This is Next.js 16.** APIs and conventions differ from older versions. Check the guides in `node_modules/next/dist/docs/` before using a Next.js feature (see `.claude/AGENTS.md`).
- **Match the surrounding code.** Keep comments at the same density, explain *why* rather than *what*, and follow the existing naming.
- **Database changes** go in `lib/db.ts`: add new tables to the schema, and add columns with the existing "check, then `ALTER TABLE`" pattern so existing databases upgrade themselves. Reads and writes live in `lib/repo.ts` and validate their input by throwing `ValidationError`.
- **Money and rates** (`lib/rateEngine.ts`, `lib/margin.ts`, `app/api/bot/quote/route.ts`, the bot's buy and sell flows): explain the reasoning in the pull request, and never let a stale or unconfirmed rate reach a customer.
- **Security:** every admin route or action must check the admin session; every bot route must check `BOT_API_KEY`; treat all request input as untrusted.
- **Website copy:** plain, specific language. Avoid dashes in public-facing text and avoid repeating the same phrase across sections.

## Commits and pull requests

- One focused change per pull request, with a clear title (for example, "Lock seller rate before deposit").
- Describe what changed, why, and how you tested it. Include screenshots for visual changes.
- Do not include secrets, customer data or real transaction details in commits, screenshots or issues.

## Reporting a problem

Open an issue describing what happened, what you expected, and how to reproduce it. For anything security related, do not open a public issue; contact the ORBITAL team privately on WhatsApp instead.
