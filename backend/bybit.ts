import { createHmac } from "node:crypto";

// Bybit P2P market reference, used to auto-price an asset (see
// backend/repo.ts's "auto" rate mode). Deliberately NOT a full pricing engine:
// no outlier filtering beyond a plain median, no liquidity checks, no
// auto-pause. Staff can always override with a manual rate.
//
// Verified 2026-09-20 against the official (deprecated but accurate)
// bybit_p2p Python library source — github.com/bybit-exchange/bybit_p2p,
// file bybit_p2p/_p2p_helper.py and _p2p_manager.py:
//   1. GET_ONLINE_ADS is a POST with a JSON body, not a GET with a query
//      string — Bybit returns a bare 404 for the GET form.
//   2. The signature needs an X-BAPI-SIGN-TYPE: "2" header alongside the
//      usual X-BAPI-* headers, and signs the JSON body string, not a query
//      string, for POST requests.
//
// Confirmed live for USDT/NGN and, on a spot check 2026-09-20, BTC/NGN also
// returned real, non-crossed ads — so Bybit P2P isn't USDT-only the way an
// earlier version of this comment assumed. Still only lightly checked per
// asset (one successful fetch each); sanity-check a new asset's first auto
// rate against the Bybit app before trusting it for real trades. An asset
// with no P2P NGN market at all just comes back with no ads (median() →
// null) rather than a wrong number.

const BASE_URL = process.env.BYBIT_BASE_URL ?? "https://api.bybit.com";
const RECV_WINDOW = "5000";
const CURRENCY = "NGN";

export function bybitConfigured(): boolean {
  return Boolean(process.env.BYBIT_API_KEY && process.env.BYBIT_API_SECRET);
}

// Bybit's `side` param: "0" = buy ads, "1" = sell ads, from the browsing
// user's point of view. Ads where advertisers SELL the token are expected
// under side="1" (what a customer pays to buy it); flip with
// BYBIT_ASK_SIDE=0 if a real run shows the opposite (confirmed correct as
// side="1"=ask for USDT/NGN on this account — see .env.local).
function sideParam(kind: "ask" | "bid"): string {
  const askSide = process.env.BYBIT_ASK_SIDE === "0" ? "0" : "1";
  return kind === "ask" ? askSide : askSide === "1" ? "0" : "1";
}

async function fetchAds(token: string, kind: "ask" | "bid"): Promise<number[]> {
  const key = process.env.BYBIT_API_KEY!;
  const secret = process.env.BYBIT_API_SECRET!;
  const body = JSON.stringify({
    tokenId: token,
    currencyId: CURRENCY,
    side: sideParam(kind),
    page: "1",
    size: "20",
  });

  const timestamp = String(Date.now());
  const sign = createHmac("sha256", secret)
    .update(timestamp + key + RECV_WINDOW + body)
    .digest("hex");

  const res = await fetch(`${BASE_URL}/v5/p2p/item/online`, {
    method: "POST",
    headers: {
      "X-BAPI-API-KEY": key,
      "X-BAPI-TIMESTAMP": timestamp,
      "X-BAPI-SIGN": sign,
      "X-BAPI-SIGN-TYPE": "2",
      "X-BAPI-RECV-WINDOW": RECV_WINDOW,
      "Content-Type": "application/json",
    },
    body,
    signal: AbortSignal.timeout(8000),
  });

  const text = await res.text();
  let parsed: {
    retCode?: number;
    ret_code?: number;
    retMsg?: string;
    ret_msg?: string;
    result?: { items?: { price?: string; isOnline?: boolean }[] };
  };
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Bybit returned non-JSON (HTTP ${res.status}): ${text.slice(0, 200)}`);
  }
  const code = parsed.retCode ?? parsed.ret_code;
  const msg = parsed.retMsg ?? parsed.ret_msg;
  if (!res.ok || (code !== undefined && code !== 0)) {
    throw new Error(`Bybit error ${code ?? res.status}: ${msg ?? res.statusText}`);
  }
  return (parsed.result?.items ?? [])
    .filter((it) => it.isOnline !== false)
    .map((it) => Number(it.price))
    .filter((p) => Number.isFinite(p) && p > 0);
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Public spot market data (verified against Bybit's own v5 docs — GET
// /v5/market/tickers is unauthenticated) — the "reliable supported
// market-data source" the derived pricing chain uses for a non-USDT
// asset's X/USDT price (see backend/rateEngine.ts). Deliberately NOT the P2P
// endpoint below: P2P access requires General-Advertiser status or above
// (confirmed via Bybit's P2P API docs), so it's reserved for USDT/NGN,
// the one rate that has no public spot equivalent (NGN isn't a spot pair).
export async function getSpotTicker(symbol: string): Promise<number | null> {
  try {
    const url = `${BASE_URL}/v5/market/tickers?category=spot&symbol=${symbol}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    const text = await res.text();
    let parsed: {
      retCode?: number;
      result?: { list?: { lastPrice?: string }[] };
    };
    try {
      parsed = text ? JSON.parse(text) : {};
    } catch {
      return null;
    }
    if (!res.ok || (parsed.retCode !== undefined && parsed.retCode !== 0)) return null;
    const price = Number(parsed.result?.list?.[0]?.lastPrice);
    return Number.isFinite(price) && price > 0 ? price : null;
  } catch {
    return null;
  }
}

export type Candle = { time: number; close: number };

// Public spot market data — no API key needed, unlike the P2P-ads calls
// above. Used for real price history charts, independent of whether P2P
// auto-pricing (bybitConfigured()) is set up at all.
export async function getSpotKlines(
  symbol: string,
  interval: string,
  limit: number,
): Promise<Candle[] | null> {
  try {
    const url = `${BASE_URL}/v5/market/kline?category=spot&symbol=${symbol}&interval=${interval}&limit=${limit}`;
    // Shorter timeout than the P2P calls above: this only feeds a
    // supplementary dashboard chart (see MarketPrices' Suspense boundary
    // in app/admin/(panel)/page.tsx), so failing fast matters more than
    // patience.
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    const text = await res.text();
    let parsed: {
      retCode?: number;
      retMsg?: string;
      result?: { list?: string[][] };
    };
    try {
      parsed = text ? JSON.parse(text) : {};
    } catch {
      return null;
    }
    if (!res.ok || (parsed.retCode !== undefined && parsed.retCode !== 0)) return null;
    const rows = parsed.result?.list ?? [];
    if (rows.length === 0) return null;
    // Bybit returns newest-first: [start, open, high, low, close, volume, turnover]
    return rows
      .map((r) => ({ time: Number(r[0]), close: Number(r[4]) }))
      .filter((c) => Number.isFinite(c.time) && Number.isFinite(c.close))
      .reverse();
  } catch {
    return null;
  }
}

export type BybitReference = { buy: number; sell: number } | null;

// buy = the raw market price a customer would pay to buy this token
// (median ask). sell = what a customer would get selling it (median bid).
// This is the MARKET reference, not ORBITAL's rate — the caller applies
// its own margin on top (see backend/repo.ts's getEffectiveRate).
export async function getBybitReference(token: string): Promise<BybitReference> {
  const [asks, bids] = await Promise.all([fetchAds(token, "ask"), fetchAds(token, "bid")]);
  const buy = median(asks);
  const sell = median(bids);
  if (buy === null || sell === null) return null;
  return { buy, sell };
}
