import { isBotRequest } from "@/backend/auth";
import { getPaymentAccount, touchBot } from "@/backend/repo";

// GET-only. What the bot shows a buying customer so they know where to pay
// ORBITAL — configurable from the dashboard, never hard-coded in the bot.
export async function GET(request: Request) {
  if (!isBotRequest(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  touchBot();
  return Response.json({ account: getPaymentAccount() });
}
