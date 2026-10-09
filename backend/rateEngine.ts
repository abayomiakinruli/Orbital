import { getBybitReference, getSpotTicker } from "@/backend/bybit";
import {
  cacheDerivedRate,
  getRate,
  getMarginSettings,
  marginTierFor,
  recordRateRefreshFailure,
  type RateRow,
} from "@/backend/repo";
import { priceAsset } from "@/backend/margin";
import { dbTime } from "@/shared/format";

// The pricing chain (see AGENTS/the approved plan for the full derivation):
//
//   USDT/NGN P2P ask/bid midpoint  =  USDT/NGN reference rate
//   X == USDT?  reference_ngn = that midpoint
//   X != USDT?  reference_ngn = that midpoint × (X/USDT ticker price)
//   apply the margin tier (regular/bulk)  →  buy/sell
//
// USDT/NGN itself needs the P2P endpoint (there's no public NGN spot
// market) — everything else uses the public, unauthenticated spot ticker,
// so a thin/nonexistent P2P market for that asset is never a dependency.

export async function usdtNgnReference(): Promise<number> {
  // getBybitReference uses the shared bounded transport in bybit.ts: one
  // 15-second request budget, up to three attempts, exponential backoff and
  // Retry-After support. Keep retry policy there so the engine has a single
  // observable failure path.
  const ref = await getBybitReference("USDT");
  if (!ref) throw new Error("No USDT/NGN P2P ads found");
  return (ref.buy + ref.sell) / 2;
}

export type LivePrice = {
  buy: number;
  sell: number;
  referenceRate: number;
  referenceUsdtPrice: number | null;
};

// Prices one asset from live Bybit data at a margin tier. Pure: writes
// nothing, so a bulk quote (app/api/bot/quote/route.ts) can use its own
// tier without its price becoming everyone's cached rate. Pass `usdtNgn` to
// reuse a USDT/NGN reference already fetched (the worker prices every asset
// from one), sparing Bybit's rate-limited P2P API.
export async function priceAssetLive(
  symbol: string,
  tier: "regular" | "bulk",
  usdtNgn?: number,
): Promise<LivePrice> {
  const sym = symbol.toUpperCase();
  usdtNgn ??= await usdtNgnReference();
  const isUsdt = sym === "USDT";
  const usdtPrice = isUsdt ? 1 : await getSpotTicker(`${sym}USDT`);
  if (!isUsdt && usdtPrice === null) {
    throw new Error(`No ${sym}USDT market price available`);
  }
  const referenceRate = isUsdt ? usdtNgn : usdtNgn * usdtPrice!;

  const settings = getMarginSettings();
  const { buy, sell } = priceAsset(referenceRate, isUsdt ? 1 : usdtPrice!, marginTierFor(settings, tier, sym));
  if (!(buy > 0) || !(sell > 0) || buy < sell) {
    throw new Error(`Computed rate looked invalid for ${sym} (buy ${buy}, sell ${sell})`);
  }
  return { buy, sell, referenceRate, referenceUsdtPrice: isUsdt ? null : usdtPrice };
}

// The scheduled refresh (backend/worker/rate-refresh.ts): prices an asset at the
// regular tier and caches it as the rate everyone is quoted. Only regular
// prices are cached; bulk quotes apply their margin to this cached reference.
export async function refreshAssetRateNow(symbol: string, usdtNgn?: number): Promise<RateRow> {
  const sym = symbol.toUpperCase();
  try {
    return cacheDerivedRate(sym, await priceAssetLive(sym, "regular", usdtNgn));
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    recordRateRefreshFailure(sym, message);
    throw e;
  }
}

// Age-based classification for the admin dashboard's 🟢/🟡/🔴 status and
// for backend/rates.ts's getEffectiveRates to decide whether a rate is still
// safe to quote.
export type RateStatus = "active" | "refreshing" | "stale" | "unavailable";

export function classifyRateStatus(row: RateRow | null): RateStatus {
  if (!row) return "unavailable";
  const ageMs = Date.now() - dbTime(row.updated_at);
  const maxAgeMs = Number(process.env.MAX_RATE_AGE_SECONDS ?? 1800) * 1000;
  const refreshIntervalMs = Number(process.env.RATE_REFRESH_INTERVAL ?? 600) * 1000;

  if (ageMs > maxAgeMs) {
    return row.last_refresh_error ? "unavailable" : "stale";
  }
  if (ageMs > refreshIntervalMs * 1.5) return "refreshing";
  return "active";
}

export function getRateStatus(symbol: string): RateStatus {
  return classifyRateStatus(getRate(symbol));
}
