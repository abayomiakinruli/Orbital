import assert from "node:assert/strict";
import test from "node:test";
import { pickTopCoins } from "./market";

const coin = (id: string, symbol: string, market_cap: number, extra = {}) => ({
  id,
  symbol,
  name: id,
  current_price: 1,
  price_change_percentage_24h: 0.5,
  market_cap,
  ...extra,
});

test("Market ticker ranks by market cap rather than the order received", () => {
  const coins = pickTopCoins([coin("solana", "sol", 50), coin("bitcoin", "btc", 900), coin("ethereum", "eth", 300)]);
  assert.deepEqual(coins.map((c) => [c.rank, c.symbol]), [[1, "BTC"], [2, "ETH"], [3, "SOL"]]);
});

test("Market ticker leaves out wrapped and staked copies and repeated symbols", () => {
  const coins = pickTopCoins([
    coin("bitcoin", "btc", 900),
    coin("wrapped-bitcoin", "wbtc", 800),
    coin("staked-ether", "steth", 700),
    coin("weth", "weth", 600),
    coin("ethereum", "eth", 500),
    coin("ethereum-copy", "eth", 400),
  ]);
  assert.deepEqual(coins.map((c) => c.id), ["bitcoin", "ethereum"]);
});

test("Market ticker keeps 20 coins and never invents a missing price or change", () => {
  const rows = Array.from({ length: 40 }, (_, i) => coin(`coin-${i}`, `c${i}`, 1000 - i));
  rows[0] = coin("coin-0", "c0", 1000, { current_price: null, price_change_percentage_24h: null });
  const coins = pickTopCoins(rows);
  assert.equal(coins.length, 20);
  assert.equal(coins[0].price, null);
  assert.equal(coins[0].change24h, null);
  assert.deepEqual(pickTopCoins({ error: "rate limited" }), []);
});
