# ORBITAL

**Trade Beyond Borders.** ORBITAL is a digital asset trading service for buying and selling BTC, USDT, USDC and SOL at naira rates. Customers trade through a Telegram bot, get support on WhatsApp, and use this website for rates, news and trade tracking.

This repository holds all three parts:

| Part | What it does | Code |
|---|---|---|
| **Website + admin panel** | Public site (rates, How It Works, Track ID, Trade and Support pages, FAQ, legal pages) and a password-protected admin for trades, accounts, rates, announcements and email subscribers | `frontend/`, `app/`, `backend/` |
| **Telegram bot** | The trading interface: quotes, buy and sell flows, staff alerts, trade tracking | `backend/bot/index.ts` |
| **Rate worker** | Refreshes every coin's buy/sell rate from Bybit on a schedule | `backend/worker/rate-refresh.ts` |

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

The worker takes the USDT/NGN reference from Bybit P2P, multiplies by each coin's USDT price, and applies the margin settings (regular or bulk, set in `.env.local` or the admin). A quote is valid for 60 seconds; a seller's rate is held for 15 minutes while they send their crypto. Rates older than 30 minutes are never shown or quoted. See `backend/rateEngine.ts` and `app/api/bot/quote/route.ts`.

## Project layout

The code is split into a frontend and a backend, with the Next.js routes in between:

```
frontend/        everything visitors and admins see
  components/    website and admin UI (admin/ for the admin panel)
  content/       page copy, such as the legal documents
  lib/           display helpers (formatting)
  styles/        global CSS and design tokens
backend/         everything that runs on the server
  db.ts, repo.ts         database schema and data access
  site.ts                display-ready data for the public site
  rates.ts, rateEngine.ts, margin.ts, bybit.ts   pricing
  auth.ts, validate.ts, telegram.ts, ...         security, input checks, notifications
  bot/                   the Telegram bot
  worker/                the rate refresher
app/             Next.js routes: pages load data from backend/ and pass it to
                 frontend/ as props; app/api/* are the HTTP endpoints
                 (app/api/bot/* serves the bot)
config/          brand, links and default content shared by both sides
public/          static files (logos)
AAA.Assets/      brand documents, images and advert files
```

ESLint enforces the boundary: frontend code may import backend *types* only, and backend code may not import frontend or app code.

## Deploying

See [.claude/DEPLOY.md](.claude/DEPLOY.md). Contributions: see [CONTRIBUTING.md](CONTRIBUTING.md).
