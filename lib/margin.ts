// Pure pricing math — no I/O, no DB, no network. Given a reference NGN
// rate for an asset (see lib/rateEngine.ts for how that's derived) and a
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
): { buy: number; sell: number } {
  const buyMargin = computeMargin(tier.mode, tier.buy, referenceNgnRate, assetUsdtPrice);
  const sellMargin = computeMargin(tier.mode, tier.sell, referenceNgnRate, assetUsdtPrice);
  return {
    buy: round2(referenceNgnRate + buyMargin),
    sell: round2(referenceNgnRate - sellMargin),
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
