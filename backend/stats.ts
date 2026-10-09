import { getDb } from "@/backend/db";
import type { AccountRow } from "@/backend/repo";

export type TradeRow = {
  id: number;
  transaction_id: string | null;
  account_id: number;
  asset: string;
  side: "buy" | "sell";
  amount: number | null;
  rate: number | null;
  fiat_amount: number;
  fiat_currency: string;
  account_number: string | null;
  account_name: string | null;
  bank_name: string | null;
  status: string;
  created_at: string;
  customer: string | null;
};

export type DayPoint = {
  date: string;
  accounts: number;
  trades: number;
  volume: number;
  visits: number;
  telegramClicks: number;
};

type Row = Record<string, string | number | null>;

const one = (sql: string, ...params: (string | number)[]) =>
  getDb().prepare(sql).get(...params) as Row;
const all = (sql: string, ...params: (string | number)[]) =>
  getDb().prepare(sql).all(...params) as Row[];

export type Period = "24h" | "7d" | "30d" | "1y" | "all";

const PERIOD_WINDOW: Record<Period, string> = {
  "24h": "-24 hours",
  "7d": "-7 days",
  "30d": "-30 days",
  "1y": "-1 year",
  // "All time": a window that starts long before anything was recorded.
  all: "-100 years",
};

// How many days the "All" view's daily charts need to cover: from the first
// account, trade or website visit to today (at least one day; capped at ten
// years so a stray bad date can't build an enormous chart).
export function daysSinceFirstRecord(): number {
  const row = one(
    `SELECT MIN(d) AS first FROM (
       SELECT MIN(date(created_at)) AS d FROM accounts
       UNION ALL SELECT MIN(date(created_at)) FROM trades
       UNION ALL SELECT MIN(date(created_at)) FROM events
     )`,
  );
  if (!row.first) return 1;
  const first = new Date(`${row.first}T00:00:00Z`).getTime();
  const days = Math.floor((Date.now() - first) / 86_400_000) + 1;
  return Math.min(Math.max(days, 1), 3650);
}

function windowFor(period: Period) {
  return PERIOD_WINDOW[period];
}

export function getOverview(period: Period) {
  const s = windowFor(period);
  const completed = one(
    `SELECT COUNT(*) AS n FROM trades
     WHERE status = 'successful' AND created_at >= datetime('now', ?)`,
    s,
  );
  // "Volume" is USDT amount traded, not the Naira fiat side of the trade —
  // USDT is dollar-pegged, so this doubles as a dollar figure (formatted
  // with frontend/lib/format.ts's money(), which defaults to USD).
  const usdtVolume = one(
    `SELECT COALESCE(SUM(amount), 0) AS volume FROM trades
     WHERE status = 'successful' AND asset = 'USDT' AND created_at >= datetime('now', ?)`,
    s,
  );
  const visits = Number(
    one(
      `SELECT COUNT(*) AS n FROM events WHERE type = 'pageview' AND created_at >= datetime('now', ?)`,
      s,
    ).n,
  );
  const clicks = Number(
    one(
      `SELECT COUNT(*) AS n FROM events WHERE type = 'telegram_click' AND created_at >= datetime('now', ?)`,
      s,
    ).n,
  );
  const bot = one("SELECT value FROM meta WHERE key = 'bot_last_seen'");

  return {
    totalAccounts: Number(one("SELECT COUNT(*) AS n FROM accounts").n),
    newAccounts: Number(
      one(
        "SELECT COUNT(*) AS n FROM accounts WHERE created_at >= datetime('now', ?)",
        s,
      ).n,
    ),
    totalTrades: Number(one("SELECT COUNT(*) AS n FROM trades").n),
    periodTrades: Number(
      one(
        "SELECT COUNT(*) AS n FROM trades WHERE created_at >= datetime('now', ?)",
        s,
      ).n,
    ),
    completedTrades: Number(completed.n),
    volume: Number(usdtVolume.volume),
    pendingTrades: Number(
      one("SELECT COUNT(*) AS n FROM trades WHERE status = 'processing'").n,
    ),
    visits,
    telegramClicks: clicks,
    clickRate: visits > 0 ? clicks / visits : 0,
    botLastSeen: bot ? String(bot.value) : null,
  };
}

function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function getDailySeries(days: number): DayPoint[] {
  const s = `-${days - 1} days`;
  const byDay = new Map<string, DayPoint>();
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = isoDay(new Date(today.getTime() - i * 86_400_000));
    byDay.set(date, {
      date,
      accounts: 0,
      trades: 0,
      volume: 0,
      visits: 0,
      telegramClicks: 0,
    });
  }

  for (const r of all(
    `SELECT date(created_at) AS d, COUNT(*) AS n FROM accounts
     WHERE date(created_at) >= date('now', ?) GROUP BY d`,
    s,
  )) {
    const p = byDay.get(String(r.d));
    if (p) p.accounts = Number(r.n);
  }
  for (const r of all(
    // Volume is USDT amount traded (dollar-pegged), not the Naira fiat side.
    `SELECT date(created_at) AS d, COUNT(*) AS n,
            COALESCE(SUM(CASE WHEN status = 'successful' AND asset = 'USDT' THEN amount END), 0) AS v
     FROM trades WHERE date(created_at) >= date('now', ?) GROUP BY d`,
    s,
  )) {
    const p = byDay.get(String(r.d));
    if (p) {
      p.trades = Number(r.n);
      p.volume = Number(r.v);
    }
  }
  for (const r of all(
    `SELECT date(created_at) AS d, type, COUNT(*) AS n FROM events
     WHERE type IN ('pageview', 'telegram_click') AND date(created_at) >= date('now', ?)
     GROUP BY d, type`,
    s,
  )) {
    const p = byDay.get(String(r.d));
    if (!p) continue;
    if (r.type === "pageview") p.visits = Number(r.n);
    else p.telegramClicks = Number(r.n);
  }
  return [...byDay.values()];
}

function isoHour(d: Date) {
  return `${d.toISOString().slice(0, 13)}:00:00`;
}

// Same shape as getDailySeries but bucketed by UTC hour, for the "24h" view.
export function getHourlySeries(): DayPoint[] {
  const byHour = new Map<string, DayPoint>();
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const hour = isoHour(new Date(now.getTime() - i * 3_600_000));
    byHour.set(hour, {
      date: hour,
      accounts: 0,
      trades: 0,
      volume: 0,
      visits: 0,
      telegramClicks: 0,
    });
  }

  for (const r of all(
    `SELECT strftime('%Y-%m-%dT%H:00:00', created_at) AS h, COUNT(*) AS n FROM accounts
     WHERE created_at >= datetime('now', '-24 hours') GROUP BY h`,
  )) {
    const p = byHour.get(String(r.h));
    if (p) p.accounts = Number(r.n);
  }
  for (const r of all(
    // Volume is USDT amount traded (dollar-pegged), not the Naira fiat side.
    `SELECT strftime('%Y-%m-%dT%H:00:00', created_at) AS h, COUNT(*) AS n,
            COALESCE(SUM(CASE WHEN status = 'successful' AND asset = 'USDT' THEN amount END), 0) AS v
     FROM trades WHERE created_at >= datetime('now', '-24 hours') GROUP BY h`,
  )) {
    const p = byHour.get(String(r.h));
    if (p) {
      p.trades = Number(r.n);
      p.volume = Number(r.v);
    }
  }
  for (const r of all(
    `SELECT strftime('%Y-%m-%dT%H:00:00', created_at) AS h, type, COUNT(*) AS n FROM events
     WHERE type IN ('pageview', 'telegram_click') AND created_at >= datetime('now', '-24 hours')
     GROUP BY h, type`,
  )) {
    const p = byHour.get(String(r.h));
    if (!p) continue;
    if (r.type === "pageview") p.visits = Number(r.n);
    else p.telegramClicks = Number(r.n);
  }
  return [...byHour.values()];
}

export function getStatusBreakdown(period: Period) {
  return all(
    `SELECT status AS label, COUNT(*) AS value FROM trades
     WHERE created_at >= datetime('now', ?) GROUP BY status ORDER BY value DESC`,
    windowFor(period),
  ).map((r) => ({ label: String(r.label), value: Number(r.value) }));
}

export function getAssetBreakdown(period: Period) {
  return all(
    `SELECT asset AS label, SUM(fiat_amount) AS value FROM trades
     WHERE status = 'successful' AND created_at >= datetime('now', ?)
     GROUP BY asset ORDER BY value DESC LIMIT 8`,
    windowFor(period),
  ).map((r) => ({ label: String(r.label), value: Number(r.value) }));
}

const tradeSelect = `
  SELECT t.*, COALESCE(a.username, a.full_name, a.telegram_id) AS customer
  FROM trades t JOIN accounts a ON a.id = t.account_id`;

export function listTrades(limit: number): TradeRow[] {
  return all(`${tradeSelect} ORDER BY t.id DESC LIMIT ?`, limit) as TradeRow[];
}

export function listAccounts(limit: number): (AccountRow & {
  trade_count: number;
  volume: number;
  saved_bank_count: number;
  saved_wallet_count: number;
})[] {
  return all(
    `SELECT a.*, COUNT(t.id) AS trade_count,
            COALESCE(SUM(CASE WHEN t.status = 'successful' THEN t.fiat_amount END), 0) AS volume,
            (SELECT COUNT(*) FROM customer_bank_accounts b WHERE b.customer_id = a.id) AS saved_bank_count,
            (SELECT COUNT(*) FROM customer_wallet_addresses w WHERE w.customer_id = a.id) AS saved_wallet_count
     FROM accounts a LEFT JOIN trades t ON t.account_id = a.id
     GROUP BY a.id ORDER BY a.id DESC LIMIT ?`,
    limit,
  ) as unknown as (AccountRow & {
    trade_count: number;
    volume: number;
    saved_bank_count: number;
    saved_wallet_count: number;
  })[];
}

export function accountOptions() {
  return all(
    `SELECT id, COALESCE(username, full_name, telegram_id, 'Account') AS name
     FROM accounts ORDER BY id DESC LIMIT 500`,
  ).map((r) => ({ id: Number(r.id), name: String(r.name) }));
}
