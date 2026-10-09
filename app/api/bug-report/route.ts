import { headers } from "next/headers";
import { clientIp, loginBlocked, recordLoginFailure } from "@/backend/auth";
import { ValidationError, addBugReport } from "@/backend/repo";

// Public endpoint behind the /report-bug page's form
// (frontend/components/BugReportForm.tsx). Rate-limited and honeypotted
// exactly like /api/subscribe: 5 reports per IP per 15 minutes, and a filled
// `orbital_hp` field is a bot, answered as a success. Reports are listed at
// /admin/bugs.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  if (body.orbital_hp) return Response.json({ ok: true });

  const key = `bug-report:${clientIp(await headers())}`;
  if (loginBlocked(key)) {
    return Response.json(
      { error: "Too many reports from here. Please try again later." },
      { status: 429 },
    );
  }
  recordLoginFailure(key);

  try {
    addBugReport(body.email, body.message, body.path);
    return Response.json({ ok: true });
  } catch (e) {
    if (e instanceof ValidationError) return Response.json({ error: e.message }, { status: 400 });
    throw e;
  }
}
