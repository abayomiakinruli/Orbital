import { existsSync, mkdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { getDb } from "@/backend/db";
import { ValidationError } from "@/backend/repo";

// ORBITAL's Instagram feed, via Meta's Instagram API with Instagram Login.
// Needs a Professional (Business or Creator) Instagram account and a
// long-lived access token, which an admin pastes in at /admin/announcements.
//
// The rate worker (backend/worker/rate-refresh.ts) calls
// refreshInstagramTokenIfDue and syncInstagramPosts every hour. Tokens last
// 60 days and can be refreshed once at least 24 hours old; refreshing weekly
// keeps them alive indefinitely. Post images are downloaded to
// data/uploads/instagram and served by app/media/instagram, because
// Instagram's own image links expire and would load Instagram in visitors'
// browsers.

const API = `https://graph.instagram.com/${process.env.INSTAGRAM_API_VERSION ?? "v25.0"}`;
const REFRESH_URL = "https://graph.instagram.com/refresh_access_token";
const DIR = path.join(process.cwd(), "data", "uploads", "instagram");
const MAX_POSTS = 12;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const REFRESH_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

export type InstagramStatus = {
  username: string | null;
  tokenSavedAt: string; // ISO; when the token was saved or last refreshed
  lastSyncAt: string | null;
  lastError: string | null;
};
type Settings = InstagramStatus & { token: string };

export type InstagramPostRow = {
  id: string;
  permalink: string;
  caption: string | null;
  media_type: string;
  image_file: string;
  posted_at: string;
};

// --- Settings (meta 'instagram') ------------------------------------------

function readSettings(): Settings | null {
  const row = getDb().prepare("SELECT value FROM meta WHERE key = 'instagram'").get() as
    | { value: string }
    | undefined;
  if (row) return JSON.parse(row.value) as Settings;
  // Optional bootstrap from the environment, e.g. on a fresh server.
  const envToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  return envToken
    ? { token: envToken, username: null, tokenSavedAt: new Date(0).toISOString(), lastSyncAt: null, lastError: null }
    : null;
}

function writeSettings(settings: Settings) {
  getDb()
    .prepare(
      `INSERT INTO meta (key, value) VALUES ('instagram', ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    )
    .run(JSON.stringify(settings));
}

// For the admin: connection details without the token itself.
export function getInstagramStatus(): InstagramStatus | null {
  const s = readSettings();
  if (!s) return null;
  return { username: s.username, tokenSavedAt: s.tokenSavedAt, lastSyncAt: s.lastSyncAt, lastError: s.lastError };
}

// --- Instagram API ----------------------------------------------------------

async function igGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  const data = (await res.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!res.ok || data.error) {
    throw new Error(data.error?.message ?? `Instagram returned HTTP ${res.status}`);
  }
  return data;
}

// Saves a pasted token after checking it works, then fetches posts.
export async function connectInstagram(rawToken: unknown): Promise<string> {
  const token = String(rawToken ?? "").trim();
  if (!/^[A-Za-z0-9_-]{20,}$/.test(token)) {
    throw new ValidationError("That doesn't look like an Instagram access token. Copy it again from the Meta dashboard.");
  }
  let me: { username?: string };
  try {
    me = await igGet<{ username?: string }>(`${API}/me?fields=user_id,username&access_token=${encodeURIComponent(token)}`);
  } catch (e) {
    throw new ValidationError(`Instagram rejected that token: ${e instanceof Error ? e.message : e}`);
  }
  writeSettings({
    token,
    username: me.username ?? null,
    tokenSavedAt: new Date().toISOString(),
    lastSyncAt: null,
    lastError: null,
  });
  await syncInstagramPosts().catch(() => {}); // outcome is recorded in lastError
  return me.username ?? "your account";
}

export function disconnectInstagram() {
  const db = getDb();
  db.prepare("DELETE FROM meta WHERE key = 'instagram'").run();
  db.prepare("DELETE FROM instagram_posts").run();
  rmSync(DIR, { recursive: true, force: true });
}

// Refreshes the token once it is a week old, well inside its 60 days.
export async function refreshInstagramTokenIfDue(): Promise<boolean> {
  const s = readSettings();
  if (!s) return false;
  if (Date.now() - new Date(s.tokenSavedAt).getTime() < REFRESH_AFTER_MS) return false;
  const data = await igGet<{ access_token: string }>(
    `${REFRESH_URL}?grant_type=ig_refresh_token&access_token=${encodeURIComponent(s.token)}`,
  );
  writeSettings({ ...s, token: data.access_token, tokenSavedAt: new Date().toISOString() });
  return true;
}

// --- Posts ------------------------------------------------------------------

type MediaItem = {
  id: string;
  caption?: string;
  media_type: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
};

const IMAGE_TYPES: { ext: string; mime: string; magic: (b: Buffer) => boolean }[] = [
  { ext: "jpg", mime: "image/jpeg", magic: (b) => b[0] === 0xff && b[1] === 0xd8 },
  { ext: "png", mime: "image/png", magic: (b) => b.subarray(1, 4).toString("latin1") === "PNG" },
  { ext: "webp", mime: "image/webp", magic: (b) => b.subarray(8, 12).toString("latin1") === "WEBP" },
];

async function downloadImage(id: string, url: string): Promise<string> {
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`image download failed (HTTP ${res.status})`);
  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.length > MAX_IMAGE_BYTES) throw new Error("image too large");
  const type = IMAGE_TYPES.find((t) => t.magic(bytes));
  if (!type) throw new Error("not a JPEG, PNG or WebP image");
  mkdirSync(DIR, { recursive: true });
  const file = `${id}.${type.ext}`;
  writeFileSync(path.join(DIR, file), bytes);
  return file;
}

// Pulls the latest posts and mirrors them locally. Returns the number of
// posts, or null when Instagram isn't connected.
export async function syncInstagramPosts(): Promise<number | null> {
  const s = readSettings();
  if (!s) return null;
  const db = getDb();
  try {
    const fields = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp";
    const { data } = await igGet<{ data: MediaItem[] }>(
      `${API}/me/media?fields=${fields}&limit=${MAX_POSTS}&access_token=${encodeURIComponent(s.token)}`,
    );
    const keep = new Set<string>();
    const existing = new Map(
      (db.prepare("SELECT id, image_file FROM instagram_posts").all() as { id: string; image_file: string }[]).map(
        (r) => [r.id, r.image_file],
      ),
    );
    const upsert = db.prepare(
      `INSERT INTO instagram_posts (id, permalink, caption, media_type, image_file, posted_at, synced_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(id) DO UPDATE SET permalink = excluded.permalink, caption = excluded.caption,
         media_type = excluded.media_type, image_file = excluded.image_file, synced_at = excluded.synced_at`,
    );
    for (const item of data.slice(0, MAX_POSTS)) {
      if (!/^\d+$/.test(item.id)) continue;
      const src = item.media_type === "VIDEO" ? item.thumbnail_url : item.media_url;
      if (!src) continue;
      let file = existing.get(item.id);
      if (!file || !existsSync(path.join(DIR, file))) file = await downloadImage(item.id, src);
      upsert.run(item.id, item.permalink, item.caption ?? null, item.media_type, file, item.timestamp);
      keep.add(item.id);
    }
    // Drop posts that are no longer among the latest (or were deleted).
    for (const [id, file] of existing) {
      if (keep.has(id)) continue;
      db.prepare("DELETE FROM instagram_posts WHERE id = ?").run(id);
      try {
        unlinkSync(path.join(DIR, file));
      } catch {
        // Already gone.
      }
    }
    writeSettings({ ...s, lastSyncAt: new Date().toISOString(), lastError: null });
    return keep.size;
  } catch (e) {
    writeSettings({ ...s, lastError: e instanceof Error ? e.message : String(e) });
    throw e;
  }
}

export function listInstagramPosts(limit = 6): InstagramPostRow[] {
  return getDb()
    .prepare("SELECT * FROM instagram_posts ORDER BY posted_at DESC LIMIT ?")
    .all(limit) as InstagramPostRow[];
}

// For app/media/instagram/[file]: only names this module generated.
export function readInstagramImage(name: string): { bytes: Buffer; mime: string } | null {
  const match = /^\d+\.(jpg|png|webp)$/.exec(name);
  if (!match) return null;
  try {
    const mime = IMAGE_TYPES.find((t) => t.ext === match[1])!.mime;
    return { bytes: readFileSync(path.join(DIR, name)), mime };
  } catch {
    return null;
  }
}

export const instagramImageUrl = (file: string) => `/media/instagram/${file}`;
