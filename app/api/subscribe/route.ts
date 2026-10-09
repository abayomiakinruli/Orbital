import { headers } from "next/headers";
import { clientIp, loginBlocked, recordLoginFailure } from "@/backend/auth";
import { ValidationError, addSubscriber } from "@/backend/repo";

// Public endpoint behind the footer's email sign-up
// (frontend/components/NewsletterSignup.tsx). Each IP gets 5 sign-ups per 15 minutes
// (the login limiter, under its own key prefix, counting every attempt)
// so the list can't be flooded. `orbital_hp` is a honeypot field real
// visitors never see: a filled one means a bot, answered as a success.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  if (body.orbital_hp) return Response.json({ ok: true });

  const key = `subscribe:${clientIp(await headers())}`;
  if (loginBlocked(key)) {
    return Response.json(
      { error: "Too many sign-ups from here. Please try again later." },
      { status: 429 },
    );
  }
  recordLoginFailure(key);

  try {
    addSubscriber(body.email, body.path);
    return Response.json({ ok: true });
  } catch (e) {
    if (e instanceof ValidationError) return Response.json({ error: e.message }, { status: 400 });
    throw e;
  }
}
