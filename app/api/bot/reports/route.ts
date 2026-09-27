import { botHandler } from "@/backend/api";
import { createReport } from "@/backend/repo";

// POST { trade_id, account_id, message } — a customer's report tied to a
// specific transaction. trade_id comes from /api/bot/track's response.
export async function POST(request: Request) {
  return botHandler(request, (body) => createReport(body));
}
