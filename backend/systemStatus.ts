import {
  getBotLastSeen,
  getRate,
  getRateBotLastSeen,
  getRateWorkerLastSeen,
  listAssets,
} from "./repo";
import { getLastPost, nextPostTime, rateChannelConfigured } from "./rateChannel";
import { getEffectiveRates } from "./rates";
import { getSpotTicker } from "./bybit";
import { heartbeatAge } from "./supervisor";

// Everything the admin dashboard's "System status" panel shows, one entry per
// system trading depends on. Same three states everywhere:
// online (green) / limited (amber) / offline (red).

export type SystemState = "online" | "limited" | "offline";
export type SystemStatus = { state: SystemState; label: string; detail: string };

function ago(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  return m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`;
}

// Heartbeat-based: online within `okMs`, limited (missed beats — usually a
// restart by backend/supervisor.ts in progress) until `downMs`, then offline.
function fromHeartbeat(lastSeen: string | null, okMs: number, downMs: number): SystemStatus {
  const age = heartbeatAge(lastSeen);
  if (age === Infinity) return { state: "offline", label: "offline", detail: "Never checked in" };
  const detail = `Last check-in ${ago(age)}`;
  if (age < okMs) return { state: "online", label: "online", detail };
  if (age < downMs) return { state: "limited", label: "delayed", detail };
  return { state: "offline", label: "offline", detail };
}

// The Telegram bot process (heartbeat every 10s).
export function getBotStatus(): SystemStatus {
  return fromHeartbeat(getBotLastSeen(), 30_000, 90_000);
}

// The rate worker process (heartbeat every 30s).
export function getRateWorkerStatus(): SystemStatus {
  return fromHeartbeat(getRateWorkerLastSeen(), 75_000, 180_000);
}

// The rate-updates channel bot: process alive, set up, and last post OK.
export function getRateChannelStatus(): SystemStatus {
  const alive = fromHeartbeat(getRateBotLastSeen(), 75_000, 180_000);
  if (alive.state === "offline") {
    return { ...alive, detail: `Rate bot not running. ${alive.detail}` };
  }
  if (!rateChannelConfigured()) {
    return {
      state: "limited",
      label: "not set up",
      detail: "Add TELEGRAM_RATE_BOT_TOKEN and RATE_CHANNEL_ID to .env.local",
    };
  }
  const last = getLastPost();
  const next = nextPostTime();
  const nextLine = next ? ` · next ${next}` : "";
  if (!last) return { state: "online", label: "ready", detail: `No posts yet${nextLine}` };
  const lastLine = `Last post ${ago(Date.now() - new Date(last.at).getTime())}`;
  if (!last.ok) {
    return { state: "limited", label: "post failed", detail: `${lastLine} failed: ${last.error}${nextLine}` };
  }
  return { state: "online", label: "online", detail: `${lastLine}${nextLine}` };
}

// What customers actually get: how many active coins have a fresh,
// quotable rate — the same filter the bot and website use.
export function getRatesStatus(): SystemStatus {
  const active = listAssets().filter((a) => a.active).map((a) => a.symbol);
  const quotable = new Set(getEffectiveRates(active).map((r) => r.asset_symbol));
  const missing = active.filter((s) => !quotable.has(s));
  if (active.length === 0) {
    return { state: "limited", label: "none", detail: "No active coins" };
  }
  if (missing.length === 0) {
    return { state: "online", label: "live", detail: `All ${active.length} coins priced` };
  }
  const detail = `No fresh rate for ${missing.join(", ")} — the bot can't quote ${
    missing.length === 1 ? "it" : "them"
  }`;
  return quotable.size > 0
    ? { state: "limited", label: `${quotable.size}/${active.length} live`, detail }
    : { state: "offline", label: "stale", detail };
}

// Bybit, without adding load to its rate-limited P2P API: public market data
// is checked live (a generous limit), and P2P health is read from the rate
// worker's last USDT/NGN refresh, which it records either way.
async function checkBybit(): Promise<SystemStatus> {
  const spotOk = (await getSpotTicker("BTCUSDT")) !== null;
  const usdt = getRate("USDT");
  const p2pError =
    usdt?.mode !== "auto"
      ? null // P2P isn't used while USDT is priced manually.
      : usdt.last_refresh_error;

  if (spotOk && !p2pError) {
    return {
      state: "online",
      label: "online",
      detail:
        usdt?.mode === "auto"
          ? "Market data responding; last P2P rate fetch succeeded"
          : "Market data responding (P2P not in use: USDT is priced manually)",
    };
  }
  if (spotOk) {
    return { state: "limited", label: "limited", detail: `Market data OK; last P2P fetch failed: ${p2pError}` };
  }
  return { state: "offline", label: "offline", detail: "Bybit market data not responding" };
}

const BYBIT_TTL_MS = 30_000;
const bybitCache = globalThis as unknown as {
  orbitalBybitStatus?: { at: number; result: Promise<SystemStatus> };
};

// Cached 30s, like the Telegram check, so each 60s dashboard refresh gets a
// fresh result without several admins multiplying the calls.
export function getBybitSystemStatus(): Promise<SystemStatus> {
  const cached = bybitCache.orbitalBybitStatus;
  if (cached && Date.now() - cached.at < BYBIT_TTL_MS) return cached.result;
  const result = checkBybit();
  bybitCache.orbitalBybitStatus = { at: Date.now(), result };
  return result;
}

// Can this server reach Telegram with the bot's token? Separate from the bot
// process: the bot can be running while Telegram is unreachable, and vice
// versa. Cached 30s, like the Bybit check, so each 60s dashboard refresh
// gets a fresh result.
const TELEGRAM_TTL_MS = 30_000;
const cache = globalThis as unknown as {
  orbitalTelegramStatus?: { at: number; result: Promise<SystemStatus> };
};

async function checkTelegram(): Promise<SystemStatus> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { state: "offline", label: "offline", detail: "TELEGRAM_BOT_TOKEN is not set" };
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`, {
      signal: AbortSignal.timeout(6000),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      description?: string;
      result?: { username?: string };
    };
    if (data.ok) {
      return { state: "online", label: "online", detail: `Connected as @${data.result?.username}` };
    }
    // Reachable, but the token was rejected: the bot can't work at all.
    return {
      state: "offline",
      label: "token rejected",
      detail: `Telegram rejected the bot token: ${data.description ?? res.status}`,
    };
  } catch (e) {
    return {
      state: "offline",
      label: "offline",
      detail: `Telegram not reachable: ${e instanceof Error ? e.message : e}`,
    };
  }
}

export function getTelegramStatus(): Promise<SystemStatus> {
  const cached = cache.orbitalTelegramStatus;
  if (cached && Date.now() - cached.at < TELEGRAM_TTL_MS) return cached.result;
  const result = checkTelegram();
  cache.orbitalTelegramStatus = { at: Date.now(), result };
  return result;
}
