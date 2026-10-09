import { clientIp, requestAllowed } from "@/backend/auth";
import { EVENT_TYPES, recordEvent } from "@/backend/repo";

// Public, write-only endpoint used by frontend/components/Tracker.tsx. It stores just
// the event type and page path: no cookies, IPs or personal data. The IP is
// used only in memory, to cap how fast one visitor can add rows (120 a
// minute is far above real browsing) so the endpoint can't be used to flood
// the database.
export async function POST(request: Request) {
  if (!requestAllowed(`track-event:${clientIp(request.headers)}`, 120, 60_000)) {
    return new Response(null, { status: 429, headers: { "Retry-After": "60" } });
  }
  try {
    const body = await request.json();
    const type = String(body.type);
    if (!EVENT_TYPES.includes(type)) {
      return Response.json({ error: "Unknown event" }, { status: 400 });
    }
    const path = typeof body.path === "string" ? body.path.slice(0, 200) : null;
    recordEvent(type, path);
    return new Response(null, { status: 204 });
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }
}
