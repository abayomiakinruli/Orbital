import { getRate, getRateBaseline, listAssets, type RateRow } from "@/backend/repo";
import { classifyRateStatus } from "@/backend/rateEngine";

// Pure reads only — no live Bybit calls in the request path. An 'auto'
// asset's buy_rate/sell_rate are kept fresh by backend/worker/rate-refresh.ts on
// its own schedule (RATE_REFRESH_INTERVAL), independent of any request
// hitting this API, so the bot/admin never wait on (or depend on) Bybit
// directly. See backend/rateEngine.ts for the derivation + refresh logic.
export function getEffectiveRate(symbol: string): RateRow | null {
  return getRate(symbol);
}

// Excludes anything not safely quotable right now: a brand-new 'auto' row
// that's never had a successful refresh (buy/sell still 0), or a rate
// that's gone stale/unavailable past MAX_RATE_AGE_SECONDS (see
// backend/rateEngine.ts's classifyRateStatus) — 0 or a too-old number must
// never reach a customer as "the rate".
export function getEffectiveRates(symbols: string[]): RateRow[] {
  return symbols
    .map((s) => getRate(s))
    .filter((r): r is RateRow => {
      if (!r || !(r.buy_rate > 0) || !(r.sell_rate > 0)) return false;
      const status = classifyRateStatus(r);
      return status === "active" || status === "refreshing";
    });
}

// What the public website's Rates section shows (frontend/components/Assets.tsx,
// served by app/api/rates/route.ts): the same active, quotable ORBITAL
// buy/sell rates the bot shows, plus a USD/NGN market reference — the
// USDT/NGN P2P midpoint the rate engine prices everything from (USDT
// tracks the dollar), falling back to the middle of ORBITAL's USDT
// buy/sell when USDT is priced manually and has no stored reference.
// `change` is the % move of the rate's midpoint over roughly the last 24
// hours (see getRateChange); null until there's history to compare with.
export type PublicRate = {
  symbol: string;
  name: string;
  buy: number;
  sell: number;
  change: number | null;
};
export type PublicRates = { rates: PublicRate[]; usdNgn: number | null };

function usdNgnOf(usdt: RateRow | null | undefined): number | null {
  if (!usdt || !(usdt.buy_rate > 0)) return null;
  return usdt.reference_rate ?? (usdt.buy_rate + usdt.sell_rate) / 2;
}

// % change of an asset's mid rate against its baseline snapshot (the latest
// one at least 24h old, or the oldest while history is shorter — see
// backend/repo.ts's getRateBaseline). In "usd" both ends are first converted at
// the USD/NGN reference of their own moment, so a naira move alone doesn't
// show as a dollar move.
export function getRateChange(rate: RateRow, currency: "ngn" | "usd"): number | null {
  const base = getRateBaseline(rate.asset_symbol);
  if (!base) return null;
  let now = (rate.buy_rate + rate.sell_rate) / 2;
  let then = (base.buy_rate + base.sell_rate) / 2;
  if (currency === "usd") {
    const usdNgnNow = usdNgnOf(getRate("USDT"));
    if (!usdNgnNow || !base.usd_ngn) return null;
    now /= usdNgnNow;
    then /= base.usd_ngn;
  }
  return then > 0 ? ((now - then) / then) * 100 : null;
}

export function getPublicRates(): PublicRates {
  const assets = listAssets().filter((a) => a.active);
  const nameOf = new Map(assets.map((a) => [a.symbol, a.name]));
  const rows = getEffectiveRates(assets.map((a) => a.symbol));
  const usdNgn = usdNgnOf(rows.find((r) => r.asset_symbol === "USDT"));
  return {
    rates: rows.map((r) => ({
      symbol: r.asset_symbol,
      name: nameOf.get(r.asset_symbol) ?? r.asset_symbol,
      buy: r.buy_rate,
      sell: r.sell_rate,
      change: getRateChange(r, "usd"),
    })),
    usdNgn,
  };
}
