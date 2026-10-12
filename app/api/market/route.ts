import { getGlobalMarket } from "@/backend/market";
import { clientIp, requestAllowed } from "@/backend/auth";

// Public, read-only: the global market prices behind the homepage ticker.
// Served from the server's own cache (backend/market.ts), so visitors never
// call CoinGecko themselves.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!requestAllowed(`market:${clientIp(request.headers)}`, 60, 60_000)) {
    return Response.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }
  return Response.json(getGlobalMarket());
}
