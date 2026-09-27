import { headers } from "next/headers";
import { loginBlocked, recordLoginFailure } from "@/lib/auth";
import { getTradeByTransactionId } from "@/lib/repo";

// Public, read-only lookup behind the website's Track ID section
// (components/TrackTransaction.tsx). Returns the same customer-safe fields
// the bot's Track ID shows — no account, payout or address details.
//
// Transaction IDs carry only 5 random hex characters per day, so misses are
// rate-limited per IP (5 per 15 minutes, via the login limiter under a
// separate key prefix) to stop anyone enumerating other customers' trades.
const ID_PATTERN = /^ORBT-\d{8}-[0-9A-F]{5}$/;

export async function GET(request: Request) {
  const id = (new URL(request.url).searchParams.get("id") ?? "").trim().toUpperCase();
  if (!ID_PATTERN.test(id)) {
    return Response.json(
      { error: "That doesn't look like an ORBITAL Transaction ID (e.g. ORBT-20260927-A1B2C)." },
      { status: 400 },
    );
  }

  const h = await headers();
  const key = `track:${h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local"}`;
  if (loginBlocked(key)) {
    return Response.json(
      { error: "Too many lookups. Please wait 15 minutes or contact support." },
      { status: 429 },
    );
  }

  const trade = getTradeByTransactionId(id);
  if (!trade) {
    recordLoginFailure(key);
    return Response.json({ trade: null });
  }

  return Response.json({
    trade: {
      transaction_id: trade.transaction_id,
      side: trade.side,
      asset: trade.asset,
      amount: trade.amount,
      status: trade.status,
      created_at: trade.created_at,
    },
  });
}
