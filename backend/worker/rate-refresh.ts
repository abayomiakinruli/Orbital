import { randomUUID } from "node:crypto";
import {
  acquireRateRefreshLease,
  getRate,
  listAssets,
  recordRateRefreshFailure,
  releaseRateRefreshLease,
  touchRateWorker,
} from "@/backend/repo";
import { refreshAssetRateNow, usdtNgnReference } from "@/backend/rateEngine";
import { dbTime } from "@/shared/format";

// Standalone process — deliberately NOT part of the Next.js server or the
// Telegram bot. Keeps every 'auto' asset's rate fresh on a fixed schedule
// so neither the bot nor the API server ever has to reach Bybit inside a
// request; both just read whatever this worker last stored (see
// backend/rates.ts). Run alongside the server and bot (`npm run rate-worker`),
// on any host — nothing here assumes localhost.
//
// A per-asset failure is caught and logged; it never stops the loop, and
// it never touches the previously cached rate (see backend/rateEngine.ts's
// refreshAssetRateNow / backend/repo.ts's recordRateRefreshFailure) — the old
// rate stands until a refresh actually succeeds.

const REFRESH_INTERVAL_MS = Number(process.env.RATE_REFRESH_INTERVAL ?? 600) * 1000;
// Independent of the refresh schedule, so the dashboard's system status (and
// backend/supervisor.ts) can tell this process is alive between refreshes.
const HEARTBEAT_MS = 30_000;
const LEASE_SECONDS = Number(process.env.RATE_REFRESH_LOCK_SECONDS ?? 300);
const WORKER_ID = `${process.pid}-${randomUUID()}`;
let running = false;

async function tick() {
  // setInterval does not await an async callback. Keep a local guard for this
  // process and a DB lease for a second worker/restart on the same database.
  if (running) return;
  if (!acquireRateRefreshLease(WORKER_ID, LEASE_SECONDS)) {
    console.warn("[rate-worker] another worker holds the refresh lease; skipping this tick");
    return;
  }
  running = true;
  try {
  const assets = listAssets().filter((a) => a.active && getRate(a.symbol)?.mode === "auto");
  if (assets.length === 0) {
    console.log("[rate-worker] no active auto-priced assets — nothing to refresh");
    return;
  }
  // Every asset is priced from the USDT/NGN P2P reference, so fetch it once
  // per tick: 2 calls to Bybit's rate-limited P2P API instead of 2 per asset.
  let usdtNgn: number;
  try {
    usdtNgn = await usdtNgnReference();
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(`[rate-worker] USDT/NGN reference failed, nothing refreshed: ${message}`);
    for (const a of assets) recordRateRefreshFailure(a.symbol, message);
    return;
  }
  for (const a of assets) {
    try {
      const rate = await refreshAssetRateNow(a.symbol, usdtNgn);
      console.log(`[rate-worker] ${a.symbol}: buy ${rate.buy_rate} / sell ${rate.sell_rate}`);
    } catch (e) {
      console.error(`[rate-worker] ${a.symbol} refresh failed:`, e instanceof Error ? e.message : e);
    }
  }
  } finally {
    running = false;
    releaseRateRefreshLease(WORKER_ID);
  }
}

// How long until the next refresh is due, going by the most recent attempt
// (successful or not) recorded for any auto-priced asset. A restart then
// carries on the existing schedule instead of calling Bybit straight away:
// several restarts close together used to add up to enough P2P calls to trip
// its rate limit.
function msUntilDue(): number {
  const stamps = listAssets()
    .map((a) => getRate(a.symbol))
    .filter((rate) => rate?.mode === "auto")
    .flatMap((rate) => [rate!.last_refresh_attempt_at, rate!.updated_at])
    .filter((value): value is string => Boolean(value))
    .map(dbTime)
    .filter(Number.isFinite);
  if (stamps.length === 0) return 0;
  return Math.max(0, Math.max(...stamps) + REFRESH_INTERVAL_MS - Date.now());
}

const firstTickMs = msUntilDue();
console.log(
  `[rate-worker] starting — refreshing every ${REFRESH_INTERVAL_MS / 1000}s` +
    (firstTickMs > 0 ? `; rates were refreshed recently, so the first is in ${Math.round(firstTickMs / 1000)}s` : ""),
);
touchRateWorker();
setInterval(touchRateWorker, HEARTBEAT_MS);
setTimeout(() => {
  tick();
  setInterval(tick, REFRESH_INTERVAL_MS);
}, firstTickMs);
