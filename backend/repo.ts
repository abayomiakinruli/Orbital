import { genQuoteId, genTransactionId, getDb } from "@/backend/db";
import type { MarginMode, MarginTier } from "@/backend/margin";
import { orbitalConfig } from "@/config/orbital";
import {
  checkAccountName,
  checkAccountNumber,
  checkBankName,
  checkWalletAddress,
  type Check,
} from "@/backend/validate";

// Writes shared by the admin panel (server actions) and the Telegram bot API.
// Every function validates its input and throws `ValidationError` on bad data.

export class ValidationError extends Error {}

export const TRADE_STATUSES = ["processing", "successful", "failed"] as const;
export type TradeStatus = (typeof TRADE_STATUSES)[number];

export type AccountRow = {
  id: number;
  telegram_id: string | null;
  username: string | null;
  full_name: string | null;
  phone: string | null;
  country: string | null;
  status: string;
  source: string;
  created_at: string;
};

export type AccountInput = {
  telegram_id?: unknown;
  username?: unknown;
  full_name?: unknown;
  phone?: unknown;
  country?: unknown;
  source?: string;
};

export type TradeInput = {
  account_id?: unknown;
  telegram_id?: unknown;
  asset?: unknown;
  side?: unknown;
  amount?: unknown;
  rate?: unknown;
  fiat_amount?: unknown;
  fiat_currency?: unknown;
  account_number?: unknown;
  account_name?: unknown;
  bank_name?: unknown;
  network?: unknown;
  dest_address?: unknown;
  status?: unknown;
};

function text(value: unknown, max = 120): string | null {
  if (value === undefined || value === null) return null;
  const s = String(value).trim().slice(0, max);
  return s === "" ? null : s;
}

function positive(value: unknown, field: string): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    throw new ValidationError(`${field} must be a number greater than 0`);
  }
  return n;
}

export function upsertAccount(input: AccountInput): AccountRow {
  const db = getDb();
  const telegramId = text(input.telegram_id, 40);
  const username = text(input.username)?.replace(/^@/, "") ?? null;
  const fullName = text(input.full_name);
  if (!telegramId && !username && !fullName) {
    throw new ValidationError("Provide a name, username or telegram_id");
  }

  if (telegramId) {
    const existing = db
      .prepare("SELECT * FROM accounts WHERE telegram_id = ?")
      .get(telegramId) as AccountRow | undefined;
    if (existing) {
      db.prepare(
        `UPDATE accounts SET
           username = COALESCE(?, username),
           full_name = COALESCE(?, full_name),
           phone = COALESCE(?, phone),
           country = COALESCE(?, country)
         WHERE id = ?`,
      ).run(
        username,
        fullName,
        text(input.phone, 40),
        text(input.country, 60),
        existing.id,
      );
      return db
        .prepare("SELECT * FROM accounts WHERE id = ?")
        .get(existing.id) as AccountRow;
    }
  }

  const result = db
    .prepare(
      `INSERT INTO accounts (telegram_id, username, full_name, phone, country, source)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      telegramId,
      username,
      fullName,
      text(input.phone, 40),
      text(input.country, 60),
      input.source ?? "bot",
    );
  return db
    .prepare("SELECT * FROM accounts WHERE id = ?")
    .get(Number(result.lastInsertRowid)) as AccountRow;
}

// Collisions are astronomically unlikely (5 hex chars per day) but cheap to
// guard against, and the spec requires the ID to be unique.
function uniqueTransactionId(): string {
  const db = getDb();
  for (let i = 0; i < 5; i++) {
    const id = genTransactionId();
    if (!db.prepare("SELECT 1 FROM trades WHERE transaction_id = ?").get(id)) return id;
  }
  throw new Error("Could not generate a unique transaction ID");
}

// Runs a backend/validate.ts check on an optional field: null stays null, a
// valid value comes back normalised, an invalid one throws ValidationError.
function checked(check: (value: string) => Check, value: string | null): string | null {
  if (value === null) return null;
  const result = check(value);
  if (!result.ok) throw new ValidationError(result.error);
  return result.value;
}

export function createTrade(input: TradeInput): { id: number; transaction_id: string } {
  const db = getDb();

  let accountId: number;
  if (input.account_id !== undefined && input.account_id !== null) {
    accountId = Number(input.account_id);
    if (!db.prepare("SELECT 1 FROM accounts WHERE id = ?").get(accountId)) {
      throw new ValidationError("Unknown account_id");
    }
  } else if (text(input.telegram_id, 40)) {
    // The bot may report a trade before the account was registered.
    accountId = upsertAccount({ telegram_id: input.telegram_id }).id;
  } else {
    throw new ValidationError("Provide account_id or telegram_id");
  }

  const asset = text(input.asset, 12)?.toUpperCase();
  if (!asset) throw new ValidationError("asset is required");
  const side = String(input.side ?? "").toLowerCase();
  if (side !== "buy" && side !== "sell") {
    throw new ValidationError("side must be 'buy' or 'sell'");
  }
  const status = String(input.status ?? "processing").toLowerCase();
  if (!(TRADE_STATUSES as readonly string[]).includes(status)) {
    throw new ValidationError(`status must be one of ${TRADE_STATUSES.join(", ")}`);
  }
  // Amount and rate are optional: a bot request only knows the fiat value
  // until a human quotes the rate.
  const optional = (value: unknown, field: string) =>
    value === undefined || value === null || value === ""
      ? null
      : positive(value, field);
  const rate = optional(input.rate, "rate");

  // A sell pays the customer out, so we need somewhere to send it. A buy
  // doesn't (the customer pays ORBITAL), so these stay null there.
  // Same checks the bot applies as the customer types (backend/validate.ts).
  const accountNumber = checked(checkAccountNumber, text(input.account_number, 30));
  const accountName = checked(checkAccountName, text(input.account_name, 120));
  const bankName = checked(checkBankName, text(input.bank_name, 80));
  if (side === "sell" && (!accountNumber || !accountName)) {
    throw new ValidationError(
      "account_number and account_name are required for a sell",
    );
  }
  // Audit-only: buy = the customer's own receiving address/network; sell =
  // the ORBITAL deposit address/network actually shown to this customer.
  // Checked against the network's address format, not against the chain.
  const network = text(input.network, 40);
  const rawAddress = text(input.dest_address, 200);
  const destAddress = rawAddress
    ? checked((value) => checkWalletAddress(asset, network, value), rawAddress)
    : null;

  const transactionId = uniqueTransactionId();
  const result = db
    .prepare(
      `INSERT INTO trades
         (transaction_id, account_id, asset, side, amount, rate, fiat_amount, fiat_currency,
          account_number, account_name, bank_name, network, dest_address, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      transactionId,
      accountId,
      asset,
      side,
      optional(input.amount, "amount"),
      rate,
      positive(input.fiat_amount, "fiat_amount"),
      text(input.fiat_currency, 6)?.toUpperCase() ?? "USD",
      side === "sell" ? accountNumber : null,
      side === "sell" ? accountName : null,
      side === "sell" ? bankName : null,
      network,
      destAddress,
      status,
    );
  return { id: Number(result.lastInsertRowid), transaction_id: transactionId };
}

// Who to notify about a trade, and where it stands now.
export function getTradeNotifyInfo(
  id: number,
): { status: string; transaction_id: string | null; telegram_id: string | null } | null {
  return (
    (getDb()
      .prepare(
        `SELECT t.status, t.transaction_id, a.telegram_id
         FROM trades t JOIN accounts a ON a.id = t.account_id WHERE t.id = ?`,
      )
      .get(id) as { status: string; transaction_id: string | null; telegram_id: string | null } | undefined) ?? null
  );
}

export function updateTradeStatus(id: number, status: unknown): boolean {
  const value = String(status ?? "").toLowerCase();
  if (!(TRADE_STATUSES as readonly string[]).includes(value)) {
    throw new ValidationError(`status must be one of ${TRADE_STATUSES.join(", ")}`);
  }
  const result = getDb()
    .prepare(
      "UPDATE trades SET status = ?, updated_at = datetime('now') WHERE id = ?",
    )
    .run(value, id);
  return Number(result.changes) > 0;
}

export function getTradeByTransactionId(transactionId: string) {
  return getDb()
    .prepare(
      `SELECT t.*, COALESCE(a.username, a.full_name, a.telegram_id) AS customer
       FROM trades t JOIN accounts a ON a.id = t.account_id
       WHERE t.transaction_id = ?`,
    )
    .get(transactionId.trim().toUpperCase()) as
    | (Record<string, unknown> & { id: number; account_id: number })
    | undefined;
}

export function touchBot() {
  getDb()
    .prepare(
      `INSERT INTO meta (key, value) VALUES ('bot_last_seen', datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    )
    .run();
}

export const EVENT_TYPES = ["pageview", "telegram_click", "whatsapp_click"];

export function recordEvent(type: string, path: string | null) {
  getDb()
    .prepare("INSERT INTO events (type, path) VALUES (?, ?)")
    .run(type, path);
}

// --- Assets ---------------------------------------------------------------
// Which digital assets ORBITAL currently trades. Configurable from the
// dashboard rather than hard-coded, per the brief — the website and bot
// both read this instead of a static list.

export type AssetRow = {
  symbol: string;
  name: string;
  active: 0 | 1;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export function listAssets(): AssetRow[] {
  return getDb()
    .prepare("SELECT * FROM assets ORDER BY sort_order, symbol")
    .all() as AssetRow[];
}

export function listActiveAssets(): AssetRow[] {
  return getDb()
    .prepare("SELECT * FROM assets WHERE active = 1 ORDER BY sort_order, symbol")
    .all() as AssetRow[];
}

export function upsertAsset(input: {
  symbol: unknown;
  name: unknown;
  sort_order?: unknown;
}): AssetRow {
  const symbol = text(input.symbol, 12)?.toUpperCase();
  if (!symbol) throw new ValidationError("symbol is required");
  const name = text(input.name, 60);
  if (!name) throw new ValidationError("name is required");
  const sortOrder = input.sort_order === undefined ? 0 : Number(input.sort_order);

  const db = getDb();
  db.prepare(
    `INSERT INTO assets (symbol, name, sort_order) VALUES (?, ?, ?)
     ON CONFLICT(symbol) DO UPDATE SET
       name = excluded.name, sort_order = excluded.sort_order, updated_at = datetime('now')`,
  ).run(symbol, name, sortOrder);
  return db.prepare("SELECT * FROM assets WHERE symbol = ?").get(symbol) as AssetRow;
}

export function setAssetActive(symbol: unknown, active: boolean): AssetRow {
  const sym = text(symbol, 12)?.toUpperCase();
  if (!sym) throw new ValidationError("symbol is required");
  const db = getDb();
  const result = db
    .prepare("UPDATE assets SET active = ?, updated_at = datetime('now') WHERE symbol = ?")
    .run(active ? 1 : 0, sym);
  if (Number(result.changes) === 0) throw new ValidationError("Unknown asset");
  return db.prepare("SELECT * FROM assets WHERE symbol = ?").get(sym) as AssetRow;
}

// --- Asset deposit/receiving addresses --------------------------------------
// Shown to a customer by the bot: buy = where ORBITAL can send the asset
// (informational — the bot still asks the customer where THEY want it sent);
// sell = where a customer should send the asset TO ORBITAL. `network` is
// null for a single-chain asset; once an asset has more than one address, a
// non-empty network label is required on every row so the bot's network
// picker has something to label the buttons with. Capped at 5 per asset.

export type AssetAddress = {
  id: number;
  asset_symbol: string;
  network: string | null;
  address: string;
  sort_order: number;
  created_at: string;
};

const MAX_ADDRESSES_PER_ASSET = 5;

export function listAssetAddresses(symbol: string): AssetAddress[] {
  return getDb()
    .prepare("SELECT * FROM asset_addresses WHERE asset_symbol = ? ORDER BY sort_order, id")
    .all(symbol.toUpperCase()) as AssetAddress[];
}

export function addAssetAddress(input: {
  symbol: unknown;
  network?: unknown;
  address: unknown;
}): AssetAddress {
  const sym = text(input.symbol, 12)?.toUpperCase();
  if (!sym) throw new ValidationError("symbol is required");
  const db = getDb();
  if (!db.prepare("SELECT 1 FROM assets WHERE symbol = ?").get(sym)) {
    throw new ValidationError("Unknown asset");
  }
  const address = text(input.address, 200);
  if (!address) throw new ValidationError("address is required");
  const network = text(input.network, 40);

  const existing = listAssetAddresses(sym);
  if (existing.length >= MAX_ADDRESSES_PER_ASSET) {
    throw new ValidationError(`${sym} already has the maximum of ${MAX_ADDRESSES_PER_ASSET} addresses`);
  }
  if (existing.length >= 1 && !network) {
    throw new ValidationError("A network name is required once an asset has more than one address");
  }

  const result = db
    .prepare(
      "INSERT INTO asset_addresses (asset_symbol, network, address, sort_order) VALUES (?, ?, ?, ?)",
    )
    .run(sym, network, address, existing.length);
  return db
    .prepare("SELECT * FROM asset_addresses WHERE id = ?")
    .get(Number(result.lastInsertRowid)) as AssetAddress;
}

export function deleteAssetAddress(id: unknown) {
  getDb().prepare("DELETE FROM asset_addresses WHERE id = ?").run(Number(id));
}

// --- Trade duration ----------------------------------------------------------
// A single global "complete your trade within N minutes" setting, shown in
// the bot's buy preview. Stored in `meta` exactly like the payment account.

export function getTradeDurationMinutes(): number | null {
  const row = getDb()
    .prepare("SELECT value FROM meta WHERE key = 'trade_duration_minutes'")
    .get() as { value: string } | undefined;
  return row ? Number(row.value) : null;
}

export function setTradeDurationMinutes(minutes: unknown): number {
  const n = Number(minutes);
  if (!Number.isInteger(n) || n <= 0) {
    throw new ValidationError("Duration must be a whole number of minutes greater than 0");
  }
  getDb()
    .prepare(
      `INSERT INTO meta (key, value) VALUES ('trade_duration_minutes', ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    )
    .run(String(n));
  return n;
}

// --- Rates ------------------------------------------------------------------
// ORBITAL's own rate per asset, set manually by an admin — not computed from
// any market data (see AGENTS notes on the deferred Bybit integration).
// "buy"/"sell" are from the customer's point of view everywhere in this
// app: buy = what a customer pays per unit, sell = what a customer receives.

export type RateMode = "manual" | "auto";

export type RateRow = {
  asset_symbol: string;
  buy_rate: number;
  sell_rate: number;
  mode: RateMode;
  margin_buy: number | null;
  margin_sell: number | null;
  reference_rate: number | null;
  reference_usdt_price: number | null;
  last_refresh_attempt_at: string | null;
  last_refresh_error: string | null;
  updated_at: string;
  updated_by: string | null;
};

export function getRate(symbol: string): RateRow | null {
  return (getDb()
    .prepare("SELECT * FROM rates WHERE asset_symbol = ?")
    .get(symbol.toUpperCase()) as RateRow | undefined) ?? null;
}

export function listRates(): (AssetRow & { rate: RateRow | null })[] {
  const assets = listAssets();
  const db = getDb();
  return assets.map((a) => ({
    ...a,
    rate: (db.prepare("SELECT * FROM rates WHERE asset_symbol = ?").get(a.symbol) as
      | RateRow
      | undefined) ?? null,
  }));
}

export function setRate(
  symbol: unknown,
  buy: unknown,
  sell: unknown,
  changedBy: string | null,
): RateRow {
  const sym = text(symbol, 12)?.toUpperCase();
  if (!sym) throw new ValidationError("symbol is required");
  const db = getDb();
  if (!db.prepare("SELECT 1 FROM assets WHERE symbol = ?").get(sym)) {
    throw new ValidationError("Unknown asset");
  }

  const buyN = Number(buy);
  const sellN = Number(sell);
  if (!Number.isFinite(buyN) || buyN <= 0) {
    throw new ValidationError("Buy rate must be a number greater than 0");
  }
  if (!Number.isFinite(sellN) || sellN <= 0) {
    throw new ValidationError("Sell rate must be a number greater than 0");
  }
  if (buyN < sellN) {
    throw new ValidationError(
      "Buy rate is lower than the sell rate — that loses money on every trade. Check the numbers.",
    );
  }

  const previous = getRate(sym);
  // Setting a rate by hand always switches the asset back to manual mode —
  // if it was auto-priced, that's over until re-enabled.
  db.prepare(
    `INSERT INTO rates (asset_symbol, buy_rate, sell_rate, mode, margin_buy, margin_sell, updated_by)
     VALUES (?, ?, ?, 'manual', NULL, NULL, ?)
     ON CONFLICT(asset_symbol) DO UPDATE SET
       buy_rate = excluded.buy_rate, sell_rate = excluded.sell_rate, mode = 'manual',
       margin_buy = NULL, margin_sell = NULL,
       updated_at = datetime('now'), updated_by = excluded.updated_by`,
  ).run(sym, buyN, sellN, changedBy);
  db.prepare(
    `INSERT INTO rate_history
       (asset_symbol, old_buy_rate, old_sell_rate, new_buy_rate, new_sell_rate, changed_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(sym, previous?.buy_rate ?? null, previous?.sell_rate ?? null, buyN, sellN, changedBy);
  recordRateTick(sym);

  return getRate(sym) as RateRow;
}

// --- Rate ticks (history behind the tickers' up/down arrows) --------------

// Snapshots an asset's current rate into rate_ticks, alongside the USD/NGN
// reference at that moment (USDT's stored reference, else the middle of its
// buy/sell) so the dollar value can be compared later too.
export function recordRateTick(symbol: string) {
  const db = getDb();
  const rate = getRate(symbol);
  if (!rate || !(rate.buy_rate > 0) || !(rate.sell_rate > 0)) return;
  const usdt = getRate("USDT");
  const usdNgn =
    usdt && usdt.buy_rate > 0 ? (usdt.reference_rate ?? (usdt.buy_rate + usdt.sell_rate) / 2) : null;
  db.prepare(
    "INSERT INTO rate_ticks (asset_symbol, buy_rate, sell_rate, usd_ngn) VALUES (?, ?, ?, ?)",
  ).run(rate.asset_symbol, rate.buy_rate, rate.sell_rate, usdNgn);
  db.prepare(
    `DELETE FROM rate_ticks WHERE asset_symbol = ? AND created_at < datetime('now', '-${RATE_HISTORY_DAYS} days')`,
  ).run(rate.asset_symbol);
}

// How long rate snapshots are kept — and so the longest span the
// dashboard's rate charts can show.
export const RATE_HISTORY_DAYS = 7;

export type RatePoint = { time: number; buy: number; sell: number };
export type RateSeriesPeriod = "24h" | "7d";

// An asset's buy/sell rate over a chart period: raw 10-minute ticks for
// 24h, hourly averages for 7d. `time` is the bucket's latest tick, in ms.
const RATE_SERIES: Record<RateSeriesPeriod, { since: string; bucket: string }> = {
  "24h": { since: "-1 day", bucket: "id" },
  "7d": { since: `-${RATE_HISTORY_DAYS} days`, bucket: "strftime('%Y-%m-%d %H', created_at)" },
};

export function getRateSeries(symbol: string, period: RateSeriesPeriod): RatePoint[] {
  const { since } = RATE_SERIES[period];
  // While history is still too short to fill two buckets (e.g. the first
  // few hours after launch), plot the raw ticks instead of a single point.
  let bucket = RATE_SERIES[period].bucket;
  const buckets = getDb()
    .prepare(
      `SELECT COUNT(DISTINCT ${bucket}) AS n FROM rate_ticks
       WHERE asset_symbol = ? AND created_at >= datetime('now', ?)`,
    )
    .get(symbol.toUpperCase(), since) as { n: number };
  if (buckets.n < 2) bucket = "id";
  const rows = getDb()
    .prepare(
      `SELECT MAX(created_at) AS t, AVG(buy_rate) AS buy, AVG(sell_rate) AS sell
       FROM rate_ticks
       WHERE asset_symbol = ? AND created_at >= datetime('now', ?)
       GROUP BY ${bucket} ORDER BY t`,
    )
    .all(symbol.toUpperCase(), since) as { t: string; buy: number; sell: number }[];
  return rows.map((r) => ({
    time: new Date(`${r.t.replace(" ", "T")}Z`).getTime(),
    buy: r.buy,
    sell: r.sell,
  }));
}

export type RateTick = {
  buy_rate: number;
  sell_rate: number;
  usd_ngn: number | null;
  created_at: string;
};

// The snapshot to compare today's rate against: the latest one from at
// least 24 hours ago, or — while history is still shorter than that — the
// oldest one there is. Null when there's nothing older than the latest tick.
export function getRateBaseline(symbol: string): RateTick | null {
  const db = getDb();
  const sym = symbol.toUpperCase();
  const dayOld = db
    .prepare(
      `SELECT buy_rate, sell_rate, usd_ngn, created_at FROM rate_ticks
       WHERE asset_symbol = ? AND created_at <= datetime('now', '-1 day')
       ORDER BY created_at DESC, id DESC LIMIT 1`,
    )
    .get(sym) as RateTick | undefined;
  if (dayOld) return dayOld;
  const ticks = db
    .prepare(
      `SELECT buy_rate, sell_rate, usd_ngn, created_at FROM rate_ticks
       WHERE asset_symbol = ? ORDER BY created_at ASC, id ASC LIMIT 2`,
    )
    .all(sym) as RateTick[];
  return ticks.length === 2 ? ticks[0] : null;
}

// Switches an asset to worker-maintained auto-pricing (or back to manual).
// Margin is no longer set per-asset here — see getMarginSettings/
// setMarginSettings below, applied uniformly by backend/worker/rate-refresh.ts and
// backend/rateEngine.ts's refreshAssetRateNow to every 'auto' asset. Switching
// to 'auto' leaves buy_rate/sell_rate as a placeholder (0 for a brand-new
// row, or whatever was cached before for an existing one) until the worker's
// next tick — or an on-demand refreshAssetRateNow call — fills them in.
export function setRateMode(
  symbol: unknown,
  mode: RateMode,
  changedBy: string | null,
): RateRow {
  const sym = text(symbol, 12)?.toUpperCase();
  if (!sym) throw new ValidationError("symbol is required");
  const db = getDb();
  if (!db.prepare("SELECT 1 FROM assets WHERE symbol = ?").get(sym)) {
    throw new ValidationError("Unknown asset");
  }
  if (mode !== "auto" && mode !== "manual") {
    throw new ValidationError("mode must be 'auto' or 'manual'");
  }

  const existing = getRate(sym);
  db.prepare(
    `INSERT INTO rates (asset_symbol, buy_rate, sell_rate, mode, updated_by)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(asset_symbol) DO UPDATE SET
       mode = excluded.mode, updated_at = datetime('now'), updated_by = excluded.updated_by`,
  ).run(sym, existing?.buy_rate ?? 0, existing?.sell_rate ?? 0, mode, changedBy);
  return getRate(sym) as RateRow;
}

// Called by backend/rateEngine.ts's refreshAssetRateNow after a successful
// derivation (see backend/margin.ts). Not a rate_history event — that log is
// for admin decisions (a manual rate, a mode change), not every worker tick.
// Clears any previously recorded refresh error.
export function cacheDerivedRate(
  symbol: string,
  input: { buy: number; sell: number; referenceRate: number; referenceUsdtPrice: number | null },
): RateRow {
  getDb()
    .prepare(
      `UPDATE rates SET buy_rate = ?, sell_rate = ?, reference_rate = ?, reference_usdt_price = ?,
         last_refresh_error = NULL, updated_at = datetime('now')
       WHERE asset_symbol = ? AND mode = 'auto'`,
    )
    .run(input.buy, input.sell, input.referenceRate, input.referenceUsdtPrice, symbol.toUpperCase());
  recordRateTick(symbol.toUpperCase());
  return getRate(symbol) as RateRow;
}

// Failsafe bookkeeping: a refresh attempt failed. buy_rate/sell_rate/
// updated_at are deliberately left untouched — the old rate stands until a
// refresh actually succeeds (see backend/rates.ts's getRateStatus, which reads
// last_refresh_attempt_at/last_refresh_error to tell "stale" apart from
// "provider unavailable").
export function recordRateRefreshFailure(symbol: string, message: string): void {
  getDb()
    .prepare(
      `UPDATE rates SET last_refresh_attempt_at = datetime('now'), last_refresh_error = ?
       WHERE asset_symbol = ? AND mode = 'auto'`,
    )
    .run(message.slice(0, 500), symbol.toUpperCase());
}

export function getRateHistory(symbol: string, limit: number) {
  return getDb()
    .prepare(
      "SELECT * FROM rate_history WHERE asset_symbol = ? ORDER BY id DESC LIMIT ?",
    )
    .all(symbol.toUpperCase(), limit);
}

// --- Margin settings ---------------------------------------------------
// One global margin config, applied uniformly to every 'auto' asset by
// backend/worker/rate-refresh.ts and backend/rateEngine.ts (see backend/margin.ts for the
// math) — not per-asset, per the brief's margin rule. Two tiers: "regular"
// for ordinary trades, "bulk" for a trade at or above bulkThresholdNgn,
// which also triggers an on-demand live re-check (see the quote functions
// below). Env vars are only the first-boot seed — the dashboard is the
// live source of truth, same pattern as getPaymentAccount/
// getTradeDurationMinutes.

export type MarginSettings = {
  mode: MarginMode;
  buyMargin: number;
  sellMargin: number;
  bulkBuyMargin: number;
  bulkSellMargin: number;
  bulkThresholdNgn: number;
};

function envNumber(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isFinite(n) ? n : fallback;
}

function defaultMarginSettings(): MarginSettings {
  const mode: MarginMode = process.env.ORBITAL_MARGIN_MODE === "fixed" ? "fixed" : "percentage";
  return {
    mode,
    buyMargin: envNumber("ORBITAL_BUY_MARGIN", 1),
    sellMargin: envNumber("ORBITAL_SELL_MARGIN", 1),
    bulkBuyMargin: envNumber("ORBITAL_BULK_BUY_MARGIN", envNumber("ORBITAL_BUY_MARGIN", 1)),
    bulkSellMargin: envNumber("ORBITAL_BULK_SELL_MARGIN", envNumber("ORBITAL_SELL_MARGIN", 1)),
    bulkThresholdNgn: envNumber("ORBITAL_BULK_THRESHOLD_NGN", 2_000_000),
  };
}

export function getMarginSettings(): MarginSettings {
  const row = getDb().prepare("SELECT value FROM meta WHERE key = 'margin_settings'").get() as
    | { value: string }
    | undefined;
  return row ? (JSON.parse(row.value) as MarginSettings) : defaultMarginSettings();
}

export function setMarginSettings(input: {
  mode: unknown;
  buyMargin: unknown;
  sellMargin: unknown;
  bulkBuyMargin: unknown;
  bulkSellMargin: unknown;
  bulkThresholdNgn: unknown;
}): MarginSettings {
  const mode = input.mode === "fixed" ? "fixed" : input.mode === "percentage" ? "percentage" : null;
  if (!mode) throw new ValidationError("mode must be 'percentage' or 'fixed'");
  const nums: Record<string, number> = {};
  for (const key of ["buyMargin", "sellMargin", "bulkBuyMargin", "bulkSellMargin", "bulkThresholdNgn"] as const) {
    const n = Number(input[key]);
    if (!Number.isFinite(n) || n < 0) {
      throw new ValidationError(`${key} must be a number 0 or greater`);
    }
    nums[key] = n;
  }
  const settings: MarginSettings = {
    mode,
    buyMargin: nums.buyMargin,
    sellMargin: nums.sellMargin,
    bulkBuyMargin: nums.bulkBuyMargin,
    bulkSellMargin: nums.bulkSellMargin,
    bulkThresholdNgn: nums.bulkThresholdNgn,
  };
  getDb()
    .prepare(
      `INSERT INTO meta (key, value) VALUES ('margin_settings', ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    )
    .run(JSON.stringify(settings));
  return settings;
}

export function marginTierFor(settings: MarginSettings, tier: "regular" | "bulk"): MarginTier {
  return tier === "bulk"
    ? { mode: settings.mode, buy: settings.bulkBuyMargin, sell: settings.bulkSellMargin }
    : { mode: settings.mode, buy: settings.buyMargin, sell: settings.sellMargin };
}

// --- Quotes ------------------------------------------------------------
// A short-lived, durable snapshot of a rate handed to a customer by the
// bot (see app/api/bot/quote/route.ts) — "the rate the customer saw" is a
// fact that outlives whatever the rates table says a minute later.

export type QuoteRow = {
  id: number;
  quote_id: string;
  asset_symbol: string;
  side: "buy" | "sell";
  rate: number;
  reference_rate: number | null;
  tier: "regular" | "bulk";
  created_at: string;
  expires_at: string;
};

export function createQuote(input: {
  symbol: string;
  side: "buy" | "sell";
  rate: number;
  referenceRate: number | null;
  tier: "regular" | "bulk";
  expiresInSeconds: number;
}): QuoteRow {
  const quoteId = genQuoteId();
  getDb()
    .prepare(
      `INSERT INTO quotes (quote_id, asset_symbol, side, rate, reference_rate, tier, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now', ?))`,
    )
    .run(
      quoteId,
      input.symbol.toUpperCase(),
      input.side,
      input.rate,
      input.referenceRate,
      input.tier,
      `+${input.expiresInSeconds} seconds`,
    );
  return getDb().prepare("SELECT * FROM quotes WHERE quote_id = ?").get(quoteId) as QuoteRow;
}

export function getQuote(quoteId: string): QuoteRow | null {
  return (getDb().prepare("SELECT * FROM quotes WHERE quote_id = ?").get(quoteId) as
    | QuoteRow
    | undefined) ?? null;
}

export function isQuoteExpired(quote: QuoteRow): boolean {
  return new Date(`${quote.expires_at.replace(" ", "T")}Z`).getTime() < Date.now();
}

// --- Payment account (shown to a customer buying, so they know where to
// pay ORBITAL) ------------------------------------------------------------
// Configurable from the dashboard rather than hard-coded into the bot, per
// the brief. Stored the same simple way as everything else in `meta`.

export type PaymentAccount = { account_name: string; account_number: string; bank_name: string };

export function getPaymentAccount(): PaymentAccount | null {
  const row = getDb()
    .prepare("SELECT value FROM meta WHERE key = 'payment_account'")
    .get() as { value: string } | undefined;
  return row ? (JSON.parse(row.value) as PaymentAccount) : null;
}

export function setPaymentAccount(input: {
  account_name: unknown;
  account_number: unknown;
  bank_name: unknown;
}): PaymentAccount {
  const accountName = text(input.account_name, 120);
  const accountNumber = text(input.account_number, 30);
  const bankName = text(input.bank_name, 80);
  if (!accountName || !accountNumber || !bankName) {
    throw new ValidationError("Account name, account number and bank are all required");
  }
  const account: PaymentAccount = {
    account_name: accountName,
    account_number: accountNumber,
    bank_name: bankName,
  };
  getDb()
    .prepare(
      `INSERT INTO meta (key, value) VALUES ('payment_account', ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    )
    .run(JSON.stringify(account));
  return account;
}

// --- Reports (customer-reported problem with a transaction) ---------------

export function createReport(input: {
  trade_id?: unknown;
  account_id?: unknown;
  message?: unknown;
}): { id: number } {
  const tradeId = Number(input.trade_id);
  const accountId = Number(input.account_id);
  const message = text(input.message, 2000);
  if (!message) throw new ValidationError("message is required");
  if (!getDb().prepare("SELECT 1 FROM trades WHERE id = ?").get(tradeId)) {
    throw new ValidationError("Unknown trade");
  }
  const result = getDb()
    .prepare("INSERT INTO reports (trade_id, account_id, message) VALUES (?, ?, ?)")
    .run(tradeId, accountId, message);
  return { id: Number(result.lastInsertRowid) };
}

// --- Announcements (published to the public website) ----------------------

// These are the website's "Updates" cards, managed from /admin/announcements.

export type AnnouncementRow = {
  id: number;
  title: string;
  content: string;
  tag: string | null;
  date_label: string | null;
  published: 0 | 1;
  created_at: string;
  updated_at: string;
};

// The first time the table is read, copy in the cards that used to be
// hard-coded in config/orbital.ts, so the admin starts from what the site
// already showed rather than an empty list.
function seedAnnouncements() {
  const db = getDb();
  const seeded = db.prepare("SELECT 1 FROM meta WHERE key = 'announcements_seeded'").get();
  if (seeded) return;
  const empty = !db.prepare("SELECT 1 FROM announcements LIMIT 1").get();
  if (empty) {
    const insert = db.prepare(
      "INSERT INTO announcements (title, content, tag, date_label, published) VALUES (?, ?, ?, ?, 1)",
    );
    // Oldest first, so ids (and therefore "newest first" ordering) match
    // the order the cards appeared in on the site.
    for (const u of [...orbitalConfig.updates].reverse()) {
      insert.run(u.title, u.description, u.tag, u.date);
    }
  }
  db.prepare("INSERT INTO meta (key, value) VALUES ('announcements_seeded', '1')").run();
}

export function listAnnouncements(publishedOnly = false): AnnouncementRow[] {
  seedAnnouncements();
  const where = publishedOnly ? "WHERE published = 1" : "";
  return getDb()
    .prepare(`SELECT * FROM announcements ${where} ORDER BY id DESC`)
    .all() as AnnouncementRow[];
}

export function upsertAnnouncement(input: {
  id?: unknown;
  title: unknown;
  content: unknown;
  tag?: unknown;
  date_label?: unknown;
  published?: unknown;
}): AnnouncementRow {
  const title = text(input.title, 200);
  const content = text(input.content, 4000);
  if (!title || !content) throw new ValidationError("Title and description are required");
  const tag = text(input.tag, 40);
  const dateLabel = text(input.date_label, 40);
  const published = input.published ? 1 : 0;
  const db = getDb();

  if (input.id) {
    const id = Number(input.id);
    db.prepare(
      `UPDATE announcements SET title = ?, content = ?, tag = ?, date_label = ?, published = ?,
         updated_at = datetime('now')
       WHERE id = ?`,
    ).run(title, content, tag, dateLabel, published, id);
    return db.prepare("SELECT * FROM announcements WHERE id = ?").get(id) as AnnouncementRow;
  }
  const result = db
    .prepare(
      "INSERT INTO announcements (title, content, tag, date_label, published) VALUES (?, ?, ?, ?, ?)",
    )
    .run(title, content, tag, dateLabel, published);
  return db
    .prepare("SELECT * FROM announcements WHERE id = ?")
    .get(Number(result.lastInsertRowid)) as AnnouncementRow;
}

// --- Important Update (the website's notice slideshow) -----------------------
// Up to MAX_NOTICE_POSTS posts (notice_posts table), each one slide with an
// optional image plus label, title, message and button. Whether the section
// shows at all is one switch in `meta` ('site_notice'.enabled).

export const MAX_NOTICE_POSTS = 5;

export type NoticePost = {
  id: number;
  image: string | null;
  tag: string;
  title: string;
  message: string;
  button_text: string;
  button_url: string;
  created_at: string;
  updated_at: string;
};

export type NoticePostInput = {
  tag: unknown;
  title: unknown;
  message: unknown;
  buttonText: unknown;
  buttonUrl: unknown;
};

// The legacy single-banner record; now only its `enabled` switch is used
// (plus its text, copied once into the first post — see seedNoticePosts).
type LegacyNotice = {
  enabled: boolean;
  tag: string;
  title: string;
  message: string;
  buttonText: string;
  buttonUrl: string;
};

function readLegacyNotice(): LegacyNotice {
  const row = getDb()
    .prepare("SELECT value FROM meta WHERE key = 'site_notice'")
    .get() as { value: string } | undefined;
  const stored = row ? (JSON.parse(row.value) as Partial<LegacyNotice>) : {};
  return { ...orbitalConfig.notice, ...stored };
}

export function getNoticeEnabled(): boolean {
  return readLegacyNotice().enabled;
}

export function setNoticeEnabled(enabled: boolean) {
  getDb()
    .prepare(
      `INSERT INTO meta (key, value) VALUES ('site_notice', ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    )
    .run(JSON.stringify({ ...readLegacyNotice(), enabled }));
}

// Only web links or site paths — never javascript: or other schemes that
// would run in a visitor's browser when they click the button.
function safeUrl(value: unknown): string | null {
  const url = text(value, 500);
  if (!url) return null;
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  if (/^https?:\/\/[^\s]+$/i.test(url)) return url;
  throw new ValidationError("Button link must start with https:// (or / for a page on this site)");
}

function cleanNoticePost(input: NoticePostInput, image: string | null) {
  const post = {
    tag: text(input.tag, 40) ?? "",
    title: text(input.title, 200) ?? "",
    message: text(input.message, 2000) ?? "",
    button_text: text(input.buttonText, 60) ?? "",
    button_url: safeUrl(input.buttonUrl) ?? "",
  };
  if (!image && (!post.title || !post.message)) {
    throw new ValidationError("Add an image, or a title and message.");
  }
  if (post.button_text && !post.button_url) {
    throw new ValidationError("Add a link for the button, or leave the button text empty.");
  }
  return post;
}

// First read after the switch to posts: the banner that was live becomes
// post #1, so the site keeps showing the same update.
function seedNoticePosts() {
  const db = getDb();
  if (db.prepare("SELECT 1 FROM meta WHERE key = 'notice_posts_seeded'").get()) return;
  if (!db.prepare("SELECT 1 FROM notice_posts LIMIT 1").get()) {
    const legacy = readLegacyNotice();
    if (legacy.title && legacy.message) {
      db.prepare(
        `INSERT INTO notice_posts (tag, title, message, button_text, button_url)
         VALUES (?, ?, ?, ?, ?)`,
      ).run(legacy.tag, legacy.title, legacy.message, legacy.buttonText, legacy.buttonUrl);
    }
  }
  db.prepare("INSERT INTO meta (key, value) VALUES ('notice_posts_seeded', '1')").run();
}

export function listNoticePosts(): NoticePost[] {
  seedNoticePosts();
  return getDb().prepare("SELECT * FROM notice_posts ORDER BY id DESC").all() as NoticePost[];
}

export function createNoticePost(input: NoticePostInput, image: string | null): NoticePost {
  if (listNoticePosts().length >= MAX_NOTICE_POSTS) {
    throw new ValidationError(
      `The Important Update holds up to ${MAX_NOTICE_POSTS} posts. Delete one first.`,
    );
  }
  const p = cleanNoticePost(input, image);
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO notice_posts (image, tag, title, message, button_text, button_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(image, p.tag, p.title, p.message, p.button_text, p.button_url);
  return db
    .prepare("SELECT * FROM notice_posts WHERE id = ?")
    .get(Number(result.lastInsertRowid)) as NoticePost;
}

// `image`: a new file name, null to remove the image, undefined to keep it.
// Returns the file the post no longer uses, for the caller to delete.
export function updateNoticePost(
  id: unknown,
  input: NoticePostInput,
  image: string | null | undefined,
): { replacedImage: string | null } {
  const db = getDb();
  const existing = db.prepare("SELECT * FROM notice_posts WHERE id = ?").get(Number(id)) as
    | NoticePost
    | undefined;
  if (!existing) throw new ValidationError("That post no longer exists.");
  const nextImage = image === undefined ? existing.image : image;
  const p = cleanNoticePost(input, nextImage);
  db.prepare(
    `UPDATE notice_posts SET image = ?, tag = ?, title = ?, message = ?, button_text = ?,
       button_url = ?, updated_at = datetime('now') WHERE id = ?`,
  ).run(nextImage, p.tag, p.title, p.message, p.button_text, p.button_url, existing.id);
  return { replacedImage: existing.image && existing.image !== nextImage ? existing.image : null };
}

// Returns the post's image file (if any) for the caller to delete.
export function deleteNoticePost(id: unknown): { image: string | null } {
  const db = getDb();
  const existing = db.prepare("SELECT image FROM notice_posts WHERE id = ?").get(Number(id)) as
    | { image: string | null }
    | undefined;
  db.prepare("DELETE FROM notice_posts WHERE id = ?").run(Number(id));
  return { image: existing?.image ?? null };
}

export function deleteAnnouncement(id: unknown) {
  getDb().prepare("DELETE FROM announcements WHERE id = ?").run(Number(id));
}

// --- Email subscribers (website footer sign-up) ------------------------------

export type SubscriberRow = { id: number; email: string; source: string | null; created_at: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Stores a footer sign-up. Emails are normalised to lowercase; signing up
// twice is not an error (`created: false`) so the form never reveals
// whether an address is already on the list.
export function addSubscriber(email: unknown, source?: unknown): { created: boolean } {
  const value = text(email, 254)?.toLowerCase();
  if (!value || !EMAIL_PATTERN.test(value)) {
    throw new ValidationError("Please enter a valid email address.");
  }
  const result = getDb()
    .prepare("INSERT INTO subscribers (email, source) VALUES (?, ?) ON CONFLICT(email) DO NOTHING")
    .run(value, text(source, 200));
  return { created: Number(result.changes) > 0 };
}

export function listSubscribers(): SubscriberRow[] {
  return getDb()
    .prepare("SELECT * FROM subscribers ORDER BY id DESC")
    .all() as SubscriberRow[];
}

export function deleteSubscriber(id: unknown) {
  getDb().prepare("DELETE FROM subscribers WHERE id = ?").run(Number(id));
}
