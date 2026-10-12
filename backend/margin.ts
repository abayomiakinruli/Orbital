// Pure pricing math — no I/O, no DB, no network. Given a reference NGN
// rate for an asset (see backend/rateEngine.ts for how that's derived) and a
// margin config, compute what ORBITAL actually charges/pays.
//
// "Fixed" is NGN-per-USDT-equivalent: a flat amount per $1 of value,
// scaled by the asset's own USDT price. For USDT itself that price is 1,
// so a fixed margin of e.g. 20 recovers the simplest case (₦1,500 ± ₦20)
// directly. For BTC worth (say) $65,000, the same "20" scales to
// ₦1,300,000 of margin per BTC — the margin tracks the asset's real value
// instead of being an arbitrary flat NGN number applied to every asset
// regardless of how much one unit is worth.
//
// "Percentage" is simpler: a % of that asset's own NGN reference rate.
//
// On top of the margin sits the conversion cost, for every coin except USDT.
// ORBITAL settles in USDT, so a BTC, ETH, SOL or USDC trade also means
// swapping that coin to or from USDT on Bybit, which costs a trading fee and
// a little price spread. `conversionPercent` (a % of the reference rate) is
// added to the buy price and taken off the sell price so the margin above is
// what ORBITAL actually keeps. The figure comes from
// backend/rateEngine.ts conversionCostPercent.

export type MarginMode = "percentage" | "fixed";

export type MarginTier = {
  mode: MarginMode;
  buy: number;
  sell: number;
};

export function computeMargin(
  mode: MarginMode,
  value: number,
  referenceNgnRate: number,
  assetUsdtPrice: number,
): number {
  return mode === "percentage" ? referenceNgnRate * (value / 100) : assetUsdtPrice * value;
}

export function priceAsset(
  referenceNgnRate: number,
  assetUsdtPrice: number,
  tier: MarginTier,
  conversionPercent = 0,
): { buy: number; sell: number } {
  const buyMargin = computeMargin(tier.mode, tier.buy, referenceNgnRate, assetUsdtPrice);
  const sellMargin = computeMargin(tier.mode, tier.sell, referenceNgnRate, assetUsdtPrice);
  const conversion = referenceNgnRate * (conversionPercent / 100);
  return {
    buy: round2(referenceNgnRate + buyMargin + conversion),
    sell: round2(referenceNgnRate - sellMargin - conversion),
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
