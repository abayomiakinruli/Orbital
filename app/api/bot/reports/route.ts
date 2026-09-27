import { botHandler } from "@/lib/api";
import { createReport } from "@/lib/repo";

// POST { trade_id, account_id, message } — a customer's report tied to a
// specific transaction. trade_id comes from /api/bot/track's response.
export async function POST(request: Request) {
  return botHandler(request, (body) => createReport(body));
}
