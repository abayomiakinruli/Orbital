# ORBITAL

**Trade Beyond Borders.** ORBITAL is a digital asset trading service for buying and selling BTC, ETH, USDT, USDC and SOL at naira rates. Customers trade through a Telegram bot, get support on WhatsApp, and use this website for rates, news and trade tracking.

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

The worker is the only process that contacts Bybit for pricing. It uses a 15-second request timeout, up to three attempts with exponential backoff (and `Retry-After` for HTTP 429), and a SQLite lease to prevent overlapping scheduled or manual refreshes. Quotes, the website, and the Telegram bot read the same stored snapshot; a failed refresh never replaces a verified rate.

## Rate API and operations

- `GET /api/rates` is a public, rate-limited read of current processed ORBITAL rates. It returns only fresh rates, plus `updatedAt`; it never returns raw Bybit data.
- `GET /api/bot/rate` and `GET /api/bot/quote` require `Authorization: Bearer $BOT_API_KEY`. They read the same SQLite snapshot. A quote is persisted with an expiry; sell-rate holds use `SELL_RATE_LOCK_SECONDS`.
- `/admin/rates` is protected by the admin session. It shows the latest success, the last failed refresh, margins, and has **Refresh rates now**. Manual refreshes use the same database lease as the worker.

For automatic pricing, create a Bybit API key with the P2P permissions required for an eligible P2P advertiser. Bybit restricts its P2P Open API to advertiser accounts; without that access, keep rates manual rather than substituting an unrelated market price. `BYBIT_BASE_URL` may be `https://api.bybit.com` or Bybit's supported `https://api.bytick.com` alternative. Set `BYBIT_REQUEST_TIMEOUT_MS`, `BYBIT_MAX_ATTEMPTS`, and `RATE_REFRESH_LOCK_SECONDS` only when the defaults do not fit the deployment.

Run the mocked integration tests with:

```bash
npm test
```

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

See [DEPLOY.md](DEPLOY.md). Contributions: see [CONTRIBUTING.md](CONTRIBUTING.md).
