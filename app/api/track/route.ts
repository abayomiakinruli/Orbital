import { EVENT_TYPES, recordEvent } from "@/backend/repo";

// Public, write-only endpoint used by frontend/components/Tracker.tsx. It stores just
// the event type and page path: no cookies, IPs or personal data.
export async function POST(request: Request) {
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
