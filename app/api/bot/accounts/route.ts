import { botHandler } from "@/backend/api";
import { upsertAccount } from "@/backend/repo";

// POST { telegram_id, username?, full_name?, phone?, country? }
// Registers a customer, or updates them if the telegram_id already exists.
export async function POST(request: Request) {
  return botHandler(request, (body) => ({
    account: upsertAccount({ ...body, source: "bot" }),
  }));
}
