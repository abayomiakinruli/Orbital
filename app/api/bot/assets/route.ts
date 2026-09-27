import { isBotRequest } from "@/backend/auth";
import { listActiveAssets, touchBot } from "@/backend/repo";

// GET-only. The bot reads the active asset list from here instead of
// hard-coding it, so enabling/disabling an asset from the dashboard takes
// effect immediately without a bot deploy.
export async function GET(request: Request) {
  if (!isBotRequest(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  touchBot();
  const assets = listActiveAssets().map((a) => ({ symbol: a.symbol, name: a.name }));
  return Response.json({ assets });
}
