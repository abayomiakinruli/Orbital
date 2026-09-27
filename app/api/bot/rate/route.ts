import { isBotRequest } from "@/backend/auth";
import { getTradeDurationMinutes, listAssets, touchBot } from "@/backend/repo";
import { getEffectiveRates } from "@/backend/rates";

// GET-only, so it doesn't fit backend/api.ts's botHandler (which expects a JSON
// body). Same Bearer-token check as every other /api/bot/* route.
//
// Returns every active, priced asset — a plain read, no live Bybit call.
// An 'auto' asset's rate is kept fresh by backend/worker/rate-refresh.ts on its own
// schedule; this just serves whatever's currently stored (see
// backend/rates.ts). Used for informational reads (the bot's "See today's
// rates" listing, the admin dashboard) — an actual trade quote goes
// through /api/bot/quote instead, which carries an expiry and can trigger
// an on-demand live re-check for a bulk-sized trade. An active asset with
// no rate set, or one that's gone stale, is left out rather than shown.
export async function GET(request: Request) {
  if (!isBotRequest(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  touchBot();
  const assets = listAssets().filter((a) => a.active);
  const nameOf = new Map(assets.map((a) => [a.symbol, a.name]));
  const rates = getEffectiveRates(assets.map((a) => a.symbol));
  return Response.json({
    rates: rates.map((r) => ({
      symbol: r.asset_symbol,
      name: nameOf.get(r.asset_symbol) ?? r.asset_symbol,
      buy: r.buy_rate,
      sell: r.sell_rate,
      updatedAt: r.updated_at,
    })),
    durationMinutes: getTradeDurationMinutes(),
  });
}
