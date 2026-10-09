import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE = "orbital_admin";
const SESSION_SECONDS = 60 * 60 * 12;

// Constant-time string comparison that tolerates different lengths.
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

function sign(value: string): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function authConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.SESSION_SECRET);
}

export function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !process.env.SESSION_SECRET) return false;
  return safeEqual(input, expected);
}

export async function createSession() {
  const expires = String(Math.floor(Date.now() / 1000) + SESSION_SECONDS);
  (await cookies()).set(COOKIE, `${expires}.${sign(expires)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  if (!authConfigured()) return false;
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return false;
  const [expires, signature] = raw.split(".");
  if (!expires || !signature) return false;
  if (!safeEqual(signature, sign(expires))) return false;
  return Number(expires) > Date.now() / 1000;
}

export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

// Bearer-token check for the Telegram bot's API calls.
export function isBotRequest(request: Request): boolean {
  const key = process.env.BOT_API_KEY;
  if (!key) return false;
  const header = request.headers.get("authorization") ?? "";
  return header.startsWith("Bearer ") && safeEqual(header.slice(7), key);
}

// The caller's IP, as the key for the limiters below. Read from
// X-Forwarded-For, which the reverse proxy overwrites with the real address
// (see .claude/DEPLOY.md); "local" when there is no proxy in front.
export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

type Window = { count: number; resetAt: number };

// Both limiters below keep one entry per key (usually an IP). Expired entries
// are cleared once a map gets large, so a stream of requests from many
// addresses can't grow the server's memory without bound.
const MAX_TRACKED_KEYS = 10_000;

function prune(map: Map<string, Window>, now: number) {
  if (map.size < MAX_TRACKED_KEYS) return;
  for (const [key, entry] of map) {
    if (entry.resetAt <= now) map.delete(key);
  }
}

// Tiny in-memory limiter for login attempts: 5 failures per 15 minutes per key.
const attempts = new Map<string, Window>();

export function loginBlocked(key: string): boolean {
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < Date.now()) return false;
  return entry.count >= 5;
}

export function recordLoginFailure(key: string) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    prune(attempts, now);
    attempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
  } else {
    entry.count += 1;
  }
}

// Lightweight per-process limiter for public read endpoints. Deployments with
// multiple web instances should enforce the same policy at the reverse proxy;
// this still prevents one process from being used as an unbounded database
// polling proxy. `key` must include an endpoint namespace.
const requestWindows = new Map<string, Window>();

export function requestAllowed(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const current = requestWindows.get(key);
  if (!current || current.resetAt <= now) {
    prune(requestWindows, now);
    requestWindows.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}
