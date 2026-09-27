# ORBITAL

**Trade Beyond Borders.** ORBITAL is a digital asset trading service for buying and selling BTC, USDT, USDC and SOL at naira rates. Customers trade through a Telegram bot, get support on WhatsApp, and use this website for rates, news and trade tracking.

This repository holds all three parts:

| Part | What it does | Code |
|---|---|---|
| **Website + admin panel** | Public site (rates, How It Works, Track ID, Trade and Support pages, FAQ, legal pages) and a password-protected admin for trades, accounts, rates, announcements and email subscribers | `app/`, `components/` |
| **Telegram bot** | The trading interface: quotes, buy and sell flows, staff alerts, trade tracking | `bot/index.ts` |
| **Rate worker** | Refreshes every coin's buy/sell rate from Bybit on a schedule | `worker/rate-refresh.ts` |

All three share one SQLite database at `data/orbital.db` (created automatically, git-ignored).

## Tech

Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · TypeScript · SQLite via Node's built-in `node:sqlite` · grammY (Telegram) · Bybit market data

Requires **Node.js 22.5 or newer** (for `node:sqlite`).

## Run it locally

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # website + admin on http://localhost:3000
npm run bot                  # Telegram bot (separate terminal)
npm run rate-worker          # rate refresher (separate terminal)
```

The admin panel is at `/admin` (password: `ADMIN_PASSWORD` in `.env.local`).

## How pricing works

The worker takes the USDT/NGN reference from Bybit P2P, multiplies by each coin's USDT price, and applies the margin settings (regular or bulk, set in `.env.local` or the admin). A quote is valid for 60 seconds; a seller's rate is held for 15 minutes while they send their crypto. Rates older than 30 minutes are never shown or quoted. See `lib/rateEngine.ts` and `app/api/bot/quote/route.ts`.

## Project layout

```
app/            pages, admin panel, API routes (app/api/bot/* is the bot's backend)
components/     website and admin UI
lib/            database (db.ts, repo.ts), rates, auth, uploads, Telegram helpers
bot/            the Telegram bot
worker/         the rate refresher
config/         brand, links and default content (config/orbital.ts)
AAA.Assets/     brand documents, images and advert files
```

## Deploying

See [DEPLOY.md](DEPLOY.md). Contributions: see [CONTRIBUTING.md](CONTRIBUTING.md).
