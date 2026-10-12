// The global crypto market, for the website's ticker only: the top coins by
// market capitalisation, from CoinGecko. This is reference data about the
// wider market. It has nothing to do with ORBITAL's own customer rates
// (backend/rates.ts, priced from Bybit), and a coin appearing here does not
// mean ORBITAL trades it.

export type MarketCoin = {
  id: string;
  symbol: string;
  name: string;
  rank: number;
  // null when CoinGecko has no figure; never guessed.
  price: number | null;
  change24h: number | null;
  marketCap: number;
};

export type GlobalMarket = {
  coins: MarketCoin[];
  // When the prices were fetched (ms since epoch); null before the first success.
  updatedAt: number | null;
  // True when refreshes have been failing and the prices are getting old.
  stale: boolean;
};

const TOP = 20;
// CoinGecko's free tier allows roughly 10,000 calls a month; one call every
// five minutes is at most ~8,700, however many visitors there are.
const REFRESH_MS = 5 * 60_000;
const TIMEOUT_MS = 8_000;
// Prices older than this are labelled as delayed on the site.
const STALE_MS = 20 * 60_000;
// Fetch more than 20 so there are still 20 left after duplicates are removed.
const URL =
  "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=60&page=1&price_change_percentage=24h";

// Wrapped, staked and bridged tokens are another form of a coin already in
// the list (WBTC is Bitcoin, stETH is Ethereum), so they are left out.
const DERIVATIVE_NAME = /wrapped|staked|staking|bridged|restaked|binance-peg/i;
const DERIVATIVE_IDS = new Set(["weth", "rocket-pool-eth", "mantle-staked-ether"]);

// Kept on globalThis so every part of the server (pages, the API route and
// the start-up warm-up in instrumentation.ts) shares one copy.
type State = {
  cache: Omit<GlobalMarket, "stale">;
  lastAttempt: number;
  refreshing: Promise<void> | null;
};
const holder = globalThis as { orbitalMarket?: State };
const state = (holder.orbitalMarket ??= {
  cache: { coins: [], updatedAt: null },
  lastAttempt: 0,
  refreshing: null,
});

const numberOrNull = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

// Turns CoinGecko's response into the top 20: duplicates removed and ranked
// by market cap here, rather than trusting the order it arrived in.
export function pickTopCoins(rows: unknown): MarketCoin[] {
  if (!Array.isArray(rows)) return [];
  const seen = new Set<string>();
  return rows
    .map((row) => {
      const r = row as Record<string, unknown>;
      return {
        id: String(r.id ?? ""),
        symbol: String(r.symbol ?? "").toUpperCase(),
        name: String(r.name ?? ""),
        rank: 0,
        price: numberOrNull(r.current_price),
        change24h: numberOrNull(r.price_change_percentage_24h),
        marketCap: numberOrNull(r.market_cap) ?? 0,
      };
    })
    .filter((c) => c.id && c.symbol && c.marketCap > 0)
    .filter((c) => !DERIVATIVE_IDS.has(c.id) && !DERIVATIVE_NAME.test(`${c.id} ${c.name}`))
    .sort((a, b) => b.marketCap - a.marketCap)
    .filter((c) => !seen.has(c.symbol) && seen.add(c.symbol))
    .slice(0, TOP)
    .map((c, i) => ({ ...c, rank: i + 1 }));
}

async function refresh() {
  state.lastAttempt = Date.now();
  // Optional: a free CoinGecko "demo" key gives a steadier rate limit.
  const key = process.env.COINGECKO_API_KEY;
  const res = await fetch(URL, {
    headers: key ? { "x-cg-demo-api-key": key } : undefined,
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`CoinGecko answered ${res.status}`);
  const coins = pickTopCoins(await res.json());
  if (coins.length === 0) throw new Error("CoinGecko returned no usable coins");
  state.cache = { coins, updatedAt: Date.now() };
}

// The latest market snapshot. Answers straight away from memory and refreshes
// in the background when it is due, so a slow or failing CoinGecko never
// holds up a page; a failed refresh keeps the last good prices.
export function getGlobalMarket(): GlobalMarket {
  if (!state.refreshing && Date.now() - state.lastAttempt >= REFRESH_MS) {
    state.refreshing = refresh()
      .catch((error) => console.error("[market] refresh failed:", error))
      .finally(() => {
        state.refreshing = null;
      });
  }
  const { cache } = state;
  const stale = cache.updatedAt !== null && Date.now() - cache.updatedAt > STALE_MS;
  return { ...cache, stale };
}
