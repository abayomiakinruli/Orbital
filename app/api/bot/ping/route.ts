import { isBotRequest } from "@/lib/auth";
import { touchBot } from "@/lib/repo";

// GET-only. The bot calls this on a fixed interval (see bot/index.ts's
// main()), independent of any customer activity, purely so the dashboard's
// online/offline indicator (app/admin/(panel)/page.tsx) has a heartbeat to
// read instead of just "last time a customer used it".
export async function GET(request: Request) {
  if (!isBotRequest(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  touchBot();
  return Response.json({ ok: true });
}
