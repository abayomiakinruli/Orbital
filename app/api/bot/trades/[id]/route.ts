import { botHandler } from "@/backend/api";
import { ValidationError, getTradeNotifyInfo, updateTradeStatus } from "@/backend/repo";

// PATCH { status: "processing" | "successful" | "failed" }
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return botHandler(request, (body) => {
    const tradeId = Number(id);
    if (!Number.isInteger(tradeId)) throw new ValidationError("Invalid trade id");
    // The staff buttons on a Telegram alert stay tappable after the trade
    // has been settled (possibly from the admin Trades page), so a trade
    // that is already successful or failed is not changed again here.
    const current = getTradeNotifyInfo(tradeId);
    if (!current) throw new ValidationError("Trade not found");
    if (current.status !== "processing") {
      throw new ValidationError(`Already marked ${current.status.toUpperCase()}`);
    }
    if (!updateTradeStatus(tradeId, body.status)) {
      throw new ValidationError("Trade not found");
    }
    return { ok: true };
  });
}
