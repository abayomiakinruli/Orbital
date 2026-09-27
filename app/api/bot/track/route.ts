import { isBotRequest } from "@/lib/auth";
import { getTradeByTransactionId, touchBot } from "@/lib/repo";

// GET /api/bot/track?id=ORBT-... — deliberately returns only what a
// customer is allowed to see (spec: transaction ID, type, asset, amount,
// date, status). No account details, no internal notes, no numeric row id.
export async function GET(request: Request) {
  if (!isBotRequest(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  touchBot();
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "id is required" }, { status: 400 });

  const trade = getTradeByTransactionId(id);
  if (!trade) return Response.json({ trade: null });

  return Response.json({
    trade: {
      // trade_id/account_id are internal — used by the report endpoint,
      // never rendered into the customer-facing message.
      trade_id: trade.id,
      account_id: trade.account_id,
      transaction_id: trade.transaction_id,
      side: trade.side,
      asset: trade.asset,
      amount: trade.amount,
      fiat_amount: trade.fiat_amount,
      fiat_currency: trade.fiat_currency,
      status: trade.status,
      created_at: trade.created_at,
    },
  });
}
