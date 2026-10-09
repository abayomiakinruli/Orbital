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

const RECV_WINDOW = "5000";
const CURRENCY = "NGN";

// These defaults deliberately live here rather than at each call site so the
// P2P and public-market requests behave the same way. They are overrideable
// for a deployment with a known network constraint, but bounded to avoid a
// bad environment value turning a failed refresh into a permanently stuck one.
function boundedEnvNumber(name: string, fallback: number, min: number, max: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= min && value <= max ? Math.floor(value) : fallback;
}

// Bybit serves the same API from two official hostnames. Some networks (and
// some hosting regions) can reach only one of them, which shows up as every
// request timing out, so the other is tried automatically.
const BYBIT_HOSTS = ["https://api.bybit.com", "https://api.bytick.com"];

function httpsOrigin(value: string, name: string): string {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:") throw new Error("not HTTPS");
    return parsed.origin;
  } catch {
    throw new BybitRequestError("configuration", `${name} must be an HTTPS URL`);
  }
}

// The configured host first, then a fallback: BYBIT_FALLBACK_BASE_URL if set
// ("off" disables falling back), otherwise Bybit's other official hostname.
function baseUrls(): string[] {
  const primary = httpsOrigin(process.env.BYBIT_BASE_URL ?? BYBIT_HOSTS[0], "BYBIT_BASE_URL");
  const configured = process.env.BYBIT_FALLBACK_BASE_URL?.trim();
  if (configured?.toLowerCase() === "off") return [primary];
  const fallbacks = configured
    ? [httpsOrigin(configured, "BYBIT_FALLBACK_BASE_URL")]
    : BYBIT_HOSTS.filter((host) => host !== primary);
  return [primary, ...fallbacks.filter((host) => host !== primary)];
}

// The host that last answered, so a process that had to fall back does not
// pay for the unreachable host's timeout again on every later call.
let preferredHost: string | null = null;

function unreachable(error: BybitRequestError): boolean {
  return error.kind === "connection" || error.kind === "dns" || error.kind === "timeout";
}

export type BybitErrorKind =
  | "configuration"
  | "connection"
  | "dns"
  | "timeout"
  | "http"
  | "rate_limit"
  | "api"
  | "invalid_response";

export class BybitRequestError extends Error {
  constructor(
    readonly kind: BybitErrorKind,
    message: string,
    readonly status?: number,
    readonly retryAfterMs?: number,
  ) {
    super(message);
    this.name = "BybitRequestError";
  }
}

type BybitEnvelope = { retCode?: number; ret_code?: number; retMsg?: string; ret_msg?: string };
type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

function retryAfterMs(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.min(seconds * 1000, 60_000);
  const time = Date.parse(value);
  return Number.isFinite(time) ? Math.min(Math.max(time - Date.now(), 0), 60_000) : undefined;
}

function requestErrorFromCause(error: unknown): BybitRequestError {
  if (error instanceof BybitRequestError) return error;
  const named = error as { name?: string; message?: string; cause?: { code?: string } };
  if (named.name === "TimeoutError" || named.name === "AbortError") {
    return new BybitRequestError("timeout", "Bybit request timed out");
  }
  const code = named.cause?.code ?? "";
  if (["ENOTFOUND", "EAI_AGAIN"].includes(code)) {
    return new BybitRequestError("dns", "Bybit hostname could not be resolved");
  }
  return new BybitRequestError("connection", "Could not connect to Bybit");
}

function retryable(error: BybitRequestError): boolean {
  return (
    error.kind === "connection" ||
    error.kind === "dns" ||
    error.kind === "timeout" ||
    error.kind === "rate_limit" ||
    error.kind === "invalid_response" ||
    (error.kind === "http" && (error.status === 408 || error.status === 425 || (error.status ?? 0) >= 500))
  );
}

function delayFor(error: BybitRequestError, attempt: number): number {
  // 500ms, 1s (with a small cap) unless Bybit explicitly tells us to wait.
  return error.retryAfterMs ?? Math.min(500 * 2 ** (attempt - 1), 10_000);
}

// A rate-limited call is only worth repeating when Bybit says the limit
// resets within a few seconds. Retrying blind just adds more visits to a
// window that is already over its limit and keeps the block going, so
// otherwise the call fails and the next scheduled refresh tries again.
const MAX_RATE_LIMIT_WAIT_MS = 10_000;

function worthRetrying(error: BybitRequestError): boolean {
  if (error.kind !== "rate_limit") return true;
  return error.retryAfterMs !== undefined && error.retryAfterMs <= MAX_RATE_LIMIT_WAIT_MS;
}

// Bybit's V5 API reports when the current rate-limit window resets as an
// epoch-milliseconds header, including on a retCode 10006 response.
function limitResetMs(value: string | null): number | undefined {
  const resetAt = Number(value);
  if (!value || !Number.isFinite(resetAt) || resetAt <= 0) return undefined;
  return Math.min(Math.max(resetAt - Date.now(), 0), 60_000);
}

// One bounded transport for every Bybit call. It validates the HTTP result,
// V5/P2P `retCode`, JSON shape, timeout, and retries transient failures only.
// It intentionally never logs request headers or bodies: those contain a
// signature and must not end up in deployment logs.
export async function requestBybitJson<T extends BybitEnvelope>(
  path: string,
  init: RequestInit = {},
  fetchImpl: FetchLike = fetch,
): Promise<T> {
  const attempts = boundedEnvNumber("BYBIT_MAX_ATTEMPTS", 3, 1, 3);
  const timeoutMs = boundedEnvNumber("BYBIT_REQUEST_TIMEOUT_MS", 15_000, 1_000, 60_000);
  const hosts = baseUrls();
  let hostIndex = Math.max(0, preferredHost ? hosts.indexOf(preferredHost) : 0);
  let lastError: BybitRequestError | null = null;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    const host = hosts[hostIndex];
    try {
      const response = await fetchImpl(`${host}${path}`, {
        ...init,
        signal: AbortSignal.timeout(timeoutMs),
      });
      const raw = await response.text();
      if (!response.ok) {
        throw new BybitRequestError(
          response.status === 429 ? "rate_limit" : "http",
          `Bybit HTTP ${response.status}`,
          response.status,
          retryAfterMs(response.headers.get("retry-after")),
        );
      }
      let parsed: T;
      try {
        parsed = JSON.parse(raw) as T;
      } catch {
        throw new BybitRequestError("invalid_response", "Bybit returned invalid JSON");
      }
      if (!parsed || typeof parsed !== "object") {
        throw new BybitRequestError("invalid_response", "Bybit returned an invalid response shape");
      }
      const code = parsed.retCode ?? parsed.ret_code;
      if (code !== undefined && code !== 0) {
        const message = parsed.retMsg ?? parsed.ret_msg ?? "unknown API error";
        throw new BybitRequestError(
          code === 10006 ? "rate_limit" : "api",
          `Bybit API ${code}: ${message}`,
          undefined,
          code === 10006 ? limitResetMs(response.headers.get("x-bapi-limit-reset-timestamp")) : undefined,
        );
      }
      preferredHost = host;
      return parsed;
    } catch (cause) {
      const error = requestErrorFromCause(cause);
      lastError = error;
      if (!retryable(error) || !worthRetrying(error) || attempt === attempts) break;
      if (unreachable(error) && hosts.length > 1) {
        // This host can't be reached from here: go straight to the other one.
        hostIndex = (hostIndex + 1) % hosts.length;
        continue;
      }
      await new Promise((resolve) => setTimeout(resolve, delayFor(error, attempt)));
    }
  }
  throw lastError ?? new BybitRequestError("connection", "Bybit request failed");
}

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

  const parsed = await requestBybitJson<{
    retCode?: number;
    ret_code?: number;
    retMsg?: string;
    ret_msg?: string;
    result?: { items?: { price?: string; isOnline?: boolean }[] };
  }>("/v5/p2p/item/online", {
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
  });
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
    const parsed = await requestBybitJson<{
      retCode?: number;
      result?: { list?: { lastPrice?: string }[] };
    }>(`/v5/market/tickers?category=spot&symbol=${encodeURIComponent(symbol.toUpperCase())}`);
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
    const parsed = await requestBybitJson<{
      retCode?: number;
      retMsg?: string;
      result?: { list?: string[][] };
    }>(
      `/v5/market/kline?category=spot&symbol=${encodeURIComponent(symbol.toUpperCase())}` +
        `&interval=${encodeURIComponent(interval)}&limit=${encodeURIComponent(String(limit))}`,
    );
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
  // One after the other, not in parallel: the P2P API's rate limit is tight,
  // and two simultaneous calls count as a burst.
  const asks = await fetchAds(token, "ask");
  const bids = await fetchAds(token, "bid");
  const buy = median(asks);
  const sell = median(bids);
  if (buy === null || sell === null) return null;
  return { buy, sell };
}
