import { mkdirSync } from "node:fs";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

// Single SQLite file at ./data/orbital.db. Timestamps are stored as UTC
// "YYYY-MM-DD HH:MM:SS" strings, so date(created_at) groups by UTC day.
const schema = `
CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id TEXT UNIQUE,
  username TEXT,
  full_name TEXT,
  phone TEXT,
  country TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  source TEXT NOT NULL DEFAULT 'bot',
  preferred_name TEXT,
  last_activity_at TEXT,
  -- When this customer accepted the Terms of Service in the bot; NULL until
  -- they do. Asked once, not on every trade.
  terms_accepted_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS customer_bank_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  account_name_encrypted TEXT NOT NULL,
  account_number_encrypted TEXT NOT NULL,
  bank_name_encrypted TEXT NOT NULL,
  account_last_four TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_customer_banks_customer ON customer_bank_accounts(customer_id, is_default, id);

CREATE TABLE IF NOT EXISTS customer_wallet_addresses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  asset TEXT NOT NULL,
  network TEXT,
  address_encrypted TEXT NOT NULL,
  address_label_encrypted TEXT,
  address_preview TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_customer_wallets_customer_asset_network ON customer_wallet_addresses(customer_id, asset, network, is_default, id);

CREATE TABLE IF NOT EXISTS trades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_id TEXT UNIQUE,
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  asset TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  amount REAL,
  rate REAL,
  fiat_amount REAL NOT NULL,
  fiat_currency TEXT NOT NULL DEFAULT 'USD',
  account_number TEXT,
  account_name TEXT,
  bank_name TEXT,
  network TEXT,
  dest_address TEXT,
  status TEXT NOT NULL DEFAULT 'processing'
    CHECK (status IN ('processing', 'successful', 'failed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Which digital assets are tradeable. Rates live in a separate table keyed
-- by symbol, kept apart from the asset's identity/display info.
CREATE TABLE IF NOT EXISTS assets (
  symbol TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Current buy/sell rate per asset. "buy"/"sell" are from the customer's
-- point of view everywhere in this app: buy = what a customer pays per
-- unit, sell = what a customer receives per unit.
CREATE TABLE IF NOT EXISTS rates (
  asset_symbol TEXT PRIMARY KEY REFERENCES assets(symbol),
  buy_rate REAL NOT NULL,
  sell_rate REAL NOT NULL,
  -- 'manual': buy_rate/sell_rate are set directly by an admin.
  -- 'auto': buy_rate/sell_rate are a cache of the last successful
  -- Bybit-derived computation (market price ± margin_buy/margin_sell),
  -- refreshed on demand whenever the bot asks for a rate.
  mode TEXT NOT NULL DEFAULT 'manual' CHECK (mode IN ('manual', 'auto')),
  margin_buy REAL,
  margin_sell REAL,
  -- Set by the rate-refresh worker (backend/worker/rate-refresh.ts) for an 'auto'
  -- asset: the USDT/NGN-derived reference rate and, for a non-USDT asset,
  -- the X/USDT market price it was scaled by (null for USDT itself).
  reference_rate REAL,
  reference_usdt_price REAL,
  -- Failsafe bookkeeping: when/why the most recent refresh attempt failed.
  -- Cleared on a successful refresh. buy_rate/sell_rate/updated_at are left
  -- untouched on failure — the old rate stands until a refresh succeeds.
  last_refresh_attempt_at TEXT,
  last_refresh_failure_at TEXT,
  last_refresh_error TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by TEXT
);

-- Append-only audit trail: every rate change, who made it and when.
CREATE TABLE IF NOT EXISTS rate_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_symbol TEXT NOT NULL,
  old_buy_rate REAL,
  old_sell_rate REAL,
  new_buy_rate REAL NOT NULL,
  new_sell_rate REAL NOT NULL,
  changed_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tag TEXT,
  date_label TEXT,
  published INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trade_id INTEGER NOT NULL REFERENCES trades(id),
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  path TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- A short database lease ensures a crash-safe single refresh loop even if a
-- process manager accidentally starts a second worker. The lease expires, so
-- a dead worker can never block rate updates permanently.
CREATE TABLE IF NOT EXISTS rate_refresh_leases (
  name TEXT PRIMARY KEY,
  owner TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

-- A quote the bot issued to a customer: a short-lived snapshot of a rate,
-- so "the rate the customer saw" is a durable, re-checkable fact rather
-- than whatever the rates table happens to say right now.
CREATE TABLE IF NOT EXISTS quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_id TEXT UNIQUE NOT NULL,
  asset_symbol TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  rate REAL NOT NULL,
  reference_rate REAL,
  tier TEXT NOT NULL DEFAULT 'regular' CHECK (tier IN ('regular', 'bulk')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);

-- Deposit/receiving addresses per asset, shown to a customer by the bot.
-- network is NULL for a single-chain asset; an asset with more than one
-- row must have a network label on each (enforced in backend/repo.ts, not here).
CREATE TABLE IF NOT EXISTS asset_addresses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_symbol TEXT NOT NULL REFERENCES assets(symbol),
  network TEXT,
  address TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_accounts_created ON accounts(created_at);
CREATE INDEX IF NOT EXISTS idx_rate_history_asset ON rate_history(asset_symbol, created_at);

-- A snapshot of an asset's rate each time it changes (every worker refresh
-- and every manual save), unlike rate_history which only logs admin
-- decisions. Drives the up/down arrows on the website and dashboard rate
-- tickers. usd_ngn is the USD/NGN reference at the time, so a rate can
-- also be compared in dollars. Also plotted as the dashboard's USDT/NGN
-- buy/sell chart. Pruned after 7 days (RATE_HISTORY_DAYS in backend/repo.ts).
CREATE TABLE IF NOT EXISTS rate_ticks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_symbol TEXT NOT NULL,
  buy_rate REAL NOT NULL,
  sell_rate REAL NOT NULL,
  usd_ngn REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_rate_ticks_asset ON rate_ticks(asset_symbol, created_at);

-- The Important Update's posts (up to 5), each one slide of the homepage
-- slideshow: an optional uploaded image (a file name under data/uploads,
-- see backend/noticeImages.ts) plus label, title, message and an optional
-- button. Shown newest first.
CREATE TABLE IF NOT EXISTS notice_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  image TEXT,
  tag TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  button_text TEXT NOT NULL DEFAULT '',
  button_url TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Emails left in the website footer's "Get ORBITAL updates" box. Listed
-- and exported from /admin/subscribers. source = the page they signed up on.
CREATE TABLE IF NOT EXISTS subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  source TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Per-coin margin overrides, edited at /admin/margins. A NULL column means
-- "use the default margin" (getMarginSettings); the margin mode itself is
-- always the global one. See backend/repo.ts's marginTierFor.
CREATE TABLE IF NOT EXISTS coin_margins (
  asset_symbol TEXT PRIMARY KEY,
  buy REAL,
  sell REAL,
  bulk_buy REAL,
  bulk_sell REAL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Bugs reported from the website's /report-bug page. Listed at /admin/bugs.
-- page = the page the form was submitted from.
CREATE TABLE IF NOT EXISTS bug_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  page TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_events_type_created ON events(type, created_at);
CREATE INDEX IF NOT EXISTS idx_asset_addresses_symbol ON asset_addresses(asset_symbol, sort_order);
CREATE INDEX IF NOT EXISTS idx_quotes_quote_id ON quotes(quote_id);
`;

// Kept separate from `schema`: these reference columns (transaction_id)
// that don't exist on an old, not-yet-migrated trades table, so running
// them unconditionally before the migration below would fail outright.
const tradeIndexes = `
CREATE INDEX IF NOT EXISTS idx_trades_created ON trades(created_at);
CREATE INDEX IF NOT EXISTS idx_trades_account ON trades(account_id);
CREATE INDEX IF NOT EXISTS idx_trades_txid ON trades(transaction_id);
`;

function genTransactionId(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = randomBytes(4).toString("hex").toUpperCase().slice(0, 5);
  return `ORBT-${date}-${suffix}`;
}

function genQuoteId(): string {
  const suffix = randomBytes(5).toString("hex").toUpperCase().slice(0, 8);
  return `QT-${suffix}`;
}

const globalForDb = globalThis as unknown as { orbitalDb?: DatabaseSync };

export function getDb(): DatabaseSync {
  if (!globalForDb.orbitalDb) {
    const dir = path.join(process.cwd(), "data");
    mkdirSync(dir, { recursive: true });
    const db = new DatabaseSync(path.join(dir, "orbital.db"));
    db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
    db.exec(schema);

    const tradeCols = new Set(
      (db.prepare("PRAGMA table_info(trades)").all() as { name: string }[]).map(
        (c) => c.name,
      ),
    );

    const accountCols = new Set(
      (db.prepare("PRAGMA table_info(accounts)").all() as { name: string }[]).map((c) => c.name),
    );
    for (const col of ["preferred_name", "last_activity_at", "updated_at", "terms_accepted_at"]) {
      if (!accountCols.has(col)) db.exec(`ALTER TABLE accounts ADD COLUMN ${col} TEXT`);
    }

    // Columns added after trades already existed on disk. SQLite has no
    // "ADD COLUMN IF NOT EXISTS", so check first. `transaction_id` and the
    // new status set need a full table rebuild (SQLite can't ALTER a CHECK
    // constraint or add a column with a UNIQUE constraint after the fact),
    // handled separately below.
    for (const col of ["account_number", "account_name", "network", "dest_address"]) {
      if (!tradeCols.has(col)) db.exec(`ALTER TABLE trades ADD COLUMN ${col} TEXT`);
    }

    // Same deal for `rates`: mode/margin columns added after some installs
    // already had the table (manual-only rates, from before auto-pricing).
    const rateCols = new Set(
      (db.prepare("PRAGMA table_info(rates)").all() as { name: string }[]).map((c) => c.name),
    );
    if (!rateCols.has("mode")) {
      db.exec("ALTER TABLE rates ADD COLUMN mode TEXT NOT NULL DEFAULT 'manual'");
    }
    for (const col of ["margin_buy", "margin_sell", "reference_rate", "reference_usdt_price"]) {
      if (!rateCols.has(col)) db.exec(`ALTER TABLE rates ADD COLUMN ${col} REAL`);
    }
    for (const col of ["last_refresh_attempt_at", "last_refresh_failure_at", "last_refresh_error"]) {
      if (!rateCols.has(col)) db.exec(`ALTER TABLE rates ADD COLUMN ${col} TEXT`);
    }

    // `announcements` back the website's Updates cards, which also show a
    // small tag ("Announcement", "Trading Notice") and a free-text date label.
    const announcementCols = new Set(
      (db.prepare("PRAGMA table_info(announcements)").all() as { name: string }[]).map(
        (c) => c.name,
      ),
    );
    for (const col of ["tag", "date_label"]) {
      if (!announcementCols.has(col)) db.exec(`ALTER TABLE announcements ADD COLUMN ${col} TEXT`);
    }

    if (!tradeCols.has("transaction_id")) {
      db.exec("BEGIN");
      try {
        db.exec("ALTER TABLE trades RENAME TO trades_old_migration");
        // Index names are global in SQLite, not per-table — renaming the
        // table keeps its indexes attached under their old names. Drop them
        // so `tradeIndexes` (run after this block) can recreate them
        // cleanly on the new table instead of silently no-op'ing.
        for (const idx of ["idx_trades_created", "idx_trades_account", "idx_trades_txid"]) {
          db.exec(`DROP INDEX IF EXISTS ${idx}`);
        }
        db.exec(schema); // recreates `trades` (and anything else missing) fresh
        const rows = db.prepare("SELECT * FROM trades_old_migration").all() as Record<
          string,
          unknown
        >[];
        const remapStatus: Record<string, string> = {
          pending: "processing",
          completed: "successful",
          cancelled: "failed",
          processing: "processing",
          successful: "successful",
          failed: "failed",
        };
        const insert = db.prepare(
          `INSERT INTO trades
             (id, transaction_id, account_id, asset, side, amount, rate, fiat_amount,
              fiat_currency, account_number, account_name, bank_name, status,
              created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        );
        for (const r of rows) {
          insert.run(
            r.id as number,
            genTransactionId(),
            r.account_id as number,
            r.asset as string,
            r.side as string,
            (r.amount as number) ?? null,
            (r.rate as number) ?? null,
            r.fiat_amount as number,
            r.fiat_currency as string,
            (r.account_number as string) ?? null,
            (r.account_name as string) ?? null,
            null,
            remapStatus[r.status as string] ?? "processing",
            r.created_at as string,
            r.updated_at as string,
          );
        }
        db.exec("DROP TABLE trades_old_migration");
        db.exec("COMMIT");
        if (rows.length > 0) {
          console.log(
            `[db] Migrated ${rows.length} existing trade(s): added transaction IDs, ` +
              `renamed statuses (pending→processing, completed→successful, cancelled→failed).`,
          );
        }
      } catch (e) {
        db.exec("ROLLBACK");
        throw e;
      }
    }

    // Safe unconditionally: trades is guaranteed to have transaction_id by
    // this point, whether it was already fresh or just migrated above.
    db.exec(tradeIndexes);

    // Seed the starting asset list once, matching what config/orbital.ts
    // used to hard-code. After this, the admin dashboard is the source of
    // truth — this only runs when the table is empty (fresh install).
    const assetCount = db.prepare("SELECT COUNT(*) AS n FROM assets").get() as {
      n: number;
    };
    if (assetCount.n === 0) {
      const insertAsset = db.prepare(
        "INSERT INTO assets (symbol, name, active, sort_order) VALUES (?, ?, 1, ?)",
      );
      [
      ["USDT", "Tether"],
      ["USDC", "USD Coin"],
      ["BTC", "Bitcoin"],
      ["ETH", "Ethereum"],
      ["SOL", "Solana"],
      ].forEach(([symbol, name], i) => insertAsset.run(symbol, name, i));
    }
    // An earlier version added Ethereum Classic (ETC) here by mistake: the
    // coin ORBITAL trades is Ethereum (ETH). Remove that row where it is
    // still the untouched automatic one (no rate, deposit address or trade),
    // so it stops showing as an active coin the bot can't quote. One an
    // admin has actually set up is left alone.
    try {
      db.prepare(
        `DELETE FROM assets
         WHERE symbol = 'ETC' AND name = 'Ethereum Classic'
           AND NOT EXISTS (SELECT 1 FROM rates WHERE asset_symbol = 'ETC')
           AND NOT EXISTS (SELECT 1 FROM asset_addresses WHERE asset_symbol = 'ETC')
           AND NOT EXISTS (SELECT 1 FROM trades WHERE asset = 'ETC')`,
      ).run();
    } catch {
      // Something else still refers to it; leave it for an admin to review.
    }

    // One-time carry-over from the old single-asset manual rate (stored as
    // a meta key) into the new per-asset rates table, if one was ever set.
    const legacyRate = db
      .prepare("SELECT value FROM meta WHERE key = 'usdt_rate'")
      .get() as { value: string } | undefined;
    const usdtHasRate = db.prepare("SELECT 1 FROM rates WHERE asset_symbol = 'USDT'").get();
    if (legacyRate && !usdtHasRate) {
      const parsed = JSON.parse(legacyRate.value) as { buy: number; sell: number };
      db.prepare(
        "INSERT INTO rates (asset_symbol, buy_rate, sell_rate, updated_by) VALUES ('USDT', ?, ?, 'migration')",
      ).run(parsed.buy, parsed.sell);
      console.log("[db] Carried the existing USDT rate over into the new rates table.");
    }

    globalForDb.orbitalDb = db;
  }
  return globalForDb.orbitalDb;
}

export { genTransactionId, genQuoteId };
