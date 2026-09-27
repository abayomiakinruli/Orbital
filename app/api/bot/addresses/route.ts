import { isBotRequest } from "@/lib/auth";
import { listAssetAddresses, touchBot } from "@/lib/repo";

// GET /api/bot/addresses?symbol=USDT — deposit/receiving addresses for one
// asset, configured on the dashboard. An empty list means none are set up
// yet; more than one means the bot must ask which network before showing
// an address (see bot/index.ts).
export async function GET(request: Request) {
  if (!isBotRequest(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  touchBot();
  const symbol = new URL(request.url).searchParams.get("symbol");
  if (!symbol) return Response.json({ error: "symbol is required" }, { status: 400 });

  const addresses = listAssetAddresses(symbol).map((a) => ({
    network: a.network,
    address: a.address,
  }));
  return Response.json({ addresses });
}
