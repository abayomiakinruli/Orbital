import assert from "node:assert/strict";
import test from "node:test";
import { priceAsset } from "./margin";

const onePercent = { mode: "percentage" as const, buy: 1, sell: 1 };

test("USDT is priced on the margin alone", () => {
  assert.deepEqual(priceAsset(1500, 1, onePercent), { buy: 1515, sell: 1485 });
});

test("the conversion cost widens a coin's buy and sell prices on top of the margin", () => {
  // Reference ₦100,000,000 per BTC: 1% margin is ₦1,000,000, 0.2% conversion is ₦200,000.
  assert.deepEqual(priceAsset(100_000_000, 66_000, onePercent, 0.2), {
    buy: 101_200_000,
    sell: 98_800_000,
  });
});

test("the conversion cost is a % of the coin's value under fixed margins too", () => {
  const fixed = { mode: "fixed" as const, buy: 20, sell: 20 };
  // Fixed margin: ₦20 × $2,500 = ₦50,000. Conversion: 0.2% of ₦3,750,000 = ₦7,500.
  assert.deepEqual(priceAsset(3_750_000, 2_500, fixed, 0.2), { buy: 3_807_500, sell: 3_692_500 });
});
