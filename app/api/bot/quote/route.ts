import { isBotRequest } from "@/backend/auth";
import { createQuote, getMarginSettings, getRate, marginTierFor, touchBot } from "@/backend/repo";
import { classifyRateStatus, conversionCostPercent } from "@/backend/rateEngine";
import { priceAsset } from "@/backend/margin";

// GET /api/bot/quote?symbol=USDT&side=buy&ngn_amount=50000[&hold=sell]
// (ngn_amount optional: omitted while the bot is just sizing the trade,
// before the customer's amount is known).
//
// Unlike /api/bot/rate (a plain informational read), this is what the bot
// calls when a customer is actually about to trade: it returns a quote —
// an id, a rate, and an expiry — rather than a bare number, so "the rate
// the customer saw" is a durable, re-checkable fact (backend/repo.ts's quotes
// table).
//
// A bulk-sized amount (at or above the configurable threshold) applies the
// bulk margin to the *stored* market reference. Quote requests therefore
// never call Bybit: every website and Telegram figure comes from one worker
// snapshot, even when Bybit is slow or unavailable.
//
// hold=sell asks for a longer expiry (SELL_RATE_LOCK_SECONDS, default 15
// minutes): the rate a seller is shown before sending their crypto, which
// the bot honours if they confirm within that window.
export async function GET(request: Request) {
  if (!isBotRequest(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  touchBot();

  const url = new URL(request.url);
  const symbol = url.searchParams.get("symbol")?.toUpperCase();
  const side = url.searchParams.get("side");
  const ngnAmount = Number(url.searchParams.get("ngn_amount") ?? 0);
  const holdForSeller = url.searchParams.get("hold") === "sell";
  if (!symbol) return Response.json({ error: "symbol is required" }, { status: 400 });
  if (side !== "buy" && side !== "sell") {
    return Response.json({ error: "side must be 'buy' or 'sell'" }, { status: 400 });
  }

  const rate = getRate(symbol);
  const status = classifyRateStatus(rate);
  if (!rate || status === "stale" || status === "unavailable" || !(rate.buy_rate > 0) || !(rate.sell_rate > 0)) {
    return Response.json({ status, rate: null });
  }

  const settings = getMarginSettings();
  const tier: "regular" | "bulk" = ngnAmount >= settings.bulkThresholdNgn ? "bulk" : "regular";
  let price = { buy: rate.buy_rate, sell: rate.sell_rate, referenceRate: rate.reference_rate };

  // Bulk tiers only apply to auto-priced assets; a manual rate is exactly
  // what the admin set, whatever the size.
  if (tier === "bulk" && rate.mode === "auto") {
    if (!rate.reference_rate) {
      return Response.json({ status: "unavailable", rate: null });
    }
    const usdtPrice = symbol === "USDT" ? 1 : rate.reference_usdt_price;
    if (!usdtPrice || !(usdtPrice > 0)) return Response.json({ status: "unavailable", rate: null });
    const cached = priceAsset(
      rate.reference_rate,
      usdtPrice,
      marginTierFor(settings, "bulk", symbol),
      conversionCostPercent(symbol),
    );
    price = { ...cached, referenceRate: rate.reference_rate };
  }

  const quote = createQuote({
    symbol,
    side,
    rate: side === "buy" ? price.buy : price.sell,
    referenceRate: price.referenceRate,
    tier,
    expiresInSeconds: holdForSeller
      ? Number(process.env.SELL_RATE_LOCK_SECONDS ?? 900)
      : Number(process.env.QUOTE_EXPIRATION_SECONDS ?? 60),
  });

  return Response.json({
    quoteId: quote.quote_id,
    symbol,
    side,
    rate: quote.rate,
    referenceRate: quote.reference_rate,
    tier: quote.tier,
    timestamp: quote.created_at,
    expiresAt: quote.expires_at,
    status,
  });
}
