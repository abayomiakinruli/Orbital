import { getPublicRates } from "@/backend/rates";
import { clientIp, requestAllowed } from "@/backend/auth";

// Public, read-only: ORBITAL's current rates for the website's Rates
// section. The site no longer polls this (its ticker now shows the global
// market, app/api/market); kept as a public feed of the same figures the bot's
// "See today's rates" shows anyone, so nothing here is private.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!requestAllowed(`rates:${clientIp(request.headers)}`, 60, 60_000)) {
    return Response.json(
      { error: "Too many rate requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }
  return Response.json(getPublicRates());
}
