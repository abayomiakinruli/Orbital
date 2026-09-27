import { getPublicRates } from "@/backend/rates";

// Public, read-only: ORBITAL's current rates for the website's Rates
// section, which polls this to stay current. The same figures the bot's
// "See today's rates" shows anyone, so nothing here is private.
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(getPublicRates());
}
