import { getDb } from "./db";
import { listAssets } from "./repo";
import { getEffectiveRates, getRateChange } from "./rates";
import { orbitalConfig } from "../config/orbital";
import { escapeHtml as esc } from "./telegram";
import { naira } from "../shared/format";

// The ORBITAL rate-updates channel: a second Telegram bot
// (TELEGRAM_RATE_BOT_TOKEN), an admin of the channel (RATE_CHANNEL_ID), posts
// the live rates there at fixed times each day (RATE_POST_TIMES, Nigerian
// time). Scheduled by backend/rateBot/index.ts; also posted on demand from
// the dashboard. Uses the same fresh, quotable rates the trading bot and
// website show — a coin without one is left out, and nothing is posted when
// no coin has one.

export const RATE_POST_TIMEZONE = "Africa/Lagos";
const DEFAULT_POST_TIMES = "00:00,12:00";
const REQUIRED_RATE_SYMBOLS = ["USDT", "ETH", "BTC"] as const;
// A post missed by a restart is still sent if it's no later than this.
const CATCH_UP_MS = 60 * 60_000;

export function rateChannelConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_RATE_BOT_TOKEN && rateChannelIds().length > 0);
}

export function rateChannelIds(): string[] {
  return (process.env.RATE_CHANNEL_ID ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

// "HH:MM" times, in order.
export function postTimes(): string[] {
  return (process.env.RATE_POST_TIMES || DEFAULT_POST_TIMES)
    .split(",")
    .map((t) => t.trim())
    .filter((t) => /^\d{1,2}:\d{2}$/.test(t))
    .map((t) => t.padStart(5, "0"))
    .sort();
}

// --- Last post record (meta table, shared with the dashboard) --------------

// `slot` is the last scheduled post handled ("YYYY-MM-DD HH:MM"); a manual
// post from the dashboard carries it over, so it never causes a repeat.
export type LastPost = { at: string; ok: boolean; error: string | null; slot: string | null };

export function getLastPost(): LastPost | null {
  const row = getDb().prepare("SELECT value FROM meta WHERE key = 'rate_channel_last_post'").get() as
    | { value: string }
    | undefined;
  return row ? (JSON.parse(row.value) as LastPost) : null;
}

function recordPost(post: LastPost) {
  getDb()
    .prepare(
      `INSERT INTO meta (key, value) VALUES ('rate_channel_last_post', ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    )
    .run(JSON.stringify(post));
}

// --- The post ----------------------------------------------------------------


// The 24-hour move, shown as an arrow and a percentage with no coloured dot.
// Telegram can't colour ordinary text, so colour can only come from an emoji:
// 🔻 is a red down arrow, but no green up-arrow emoji exists, so a rise uses
// the plain ▲.
function changeTag(change: number | null): string {
  if (change === null || !Number.isFinite(change)) return "";
  const pct = Math.abs(change).toFixed(2);
  if (Math.abs(change) < 0.005) return " 0.00%";
  return change > 0 ? ` ▲${pct}%` : ` 🔻${pct}%`;
}

export function buildRatesPost(now = new Date()): string | null {
  const assets = listAssets().filter((a) => a.active && REQUIRED_RATE_SYMBOLS.includes(a.symbol as (typeof REQUIRED_RATE_SYMBOLS)[number]));
  const nameOf = new Map(assets.map((a) => [a.symbol, a.name]));
  const rates = getEffectiveRates(assets.map((a) => a.symbol));
  // A partial daily market post is misleading, so all three coins must have
  // a fresh rate. (The middle one is Ethereum, ETH — it was once wrongly
  // listed as Ethereum Classic, ETC, which never had a rate.)
  if (rates.length !== REQUIRED_RATE_SYMBOLS.length) return null;

  const when = new Intl.DateTimeFormat("en-GB", {
    timeZone: RATE_POST_TIMEZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(now);

  const rateBySymbol = new Map(rates.map((rate) => [rate.asset_symbol, rate]));
  const lines = REQUIRED_RATE_SYMBOLS.map((symbol) => {
    const rate = rateBySymbol.get(symbol)!;
    return (
      `<b>${symbol}/NGN</b> · ${esc(nameOf.get(symbol) ?? symbol)}${changeTag(getRateChange(rate, "ngn"))}\n` +
      `Buy: ${naira(rate.buy_rate)}\nSell: ${naira(rate.sell_rate)}`
    );
  });

  return (
    `📊 <b>ORBITAL LIVE RATES</b>\n${esc(when)} (WAT)\n\n` +
    `${lines.join("\n\n")}\n\n` +
    `💱 Trade now: ${esc(orbitalConfig.telegramHandle)}`
  );
}

// Posts the current rates to the channel and records the outcome for the
// dashboard. Never throws.
export async function postRatesToChannel(slot: string | null = null): Promise<LastPost> {
  const at = new Date().toISOString();
  const done = (ok: boolean, error: string | null) => {
    const post = { at, ok, error, slot: slot ?? getLastPost()?.slot ?? null };
    recordPost(post);
    return post;
  };

  const channels = rateChannelIds();
  if (!rateChannelConfigured()) {
    return done(false, "TELEGRAM_RATE_BOT_TOKEN / RATE_CHANNEL_ID not set");
  }
  const text = buildRatesPost();
  if (!text) return done(false, "No fresh rates to post");

  try {
    const outcomes = await Promise.all(channels.map(async (channel) => {
      const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_RATE_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: channel,
          text,
          parse_mode: "HTML",
          link_preview_options: { is_disabled: true },
        }),
        signal: AbortSignal.timeout(10_000),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; description?: string };
      return data.ok ? null : `${channel}: ${data.description ?? res.status}`;
    }));
    const failures = outcomes.filter((outcome): outcome is string => outcome !== null);
    return failures.length ? done(false, `Telegram: ${failures.join("; ")}`) : done(true, null);
  } catch (e) {
    return done(false, `Telegram not reachable: ${e instanceof Error ? e.message : e}`);
  }
}

// --- Schedule ------------------------------------------------------------------

// Current date and time in Nigeria as "YYYY-MM-DD" and "HH:MM".
function lagosNow(now: Date): { date: string; time: string } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: RATE_POST_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

const toMinutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

// The scheduled post that's due right now, as "YYYY-MM-DD HH:MM", or null.
// Due = the latest scheduled time today that has passed, within the catch-up
// window, and not already posted (successfully or not, so a failure isn't
// retried every minute — the next slot tries again).
export function duePostSlot(now = new Date()): string | null {
  const { date, time } = lagosNow(now);
  const passed = postTimes().filter((t) => toMinutes(t) <= toMinutes(time));
  const latest = passed[passed.length - 1];
  if (!latest) return null;
  if ((toMinutes(time) - toMinutes(latest)) * 60_000 > CATCH_UP_MS) return null;
  const slot = `${date} ${latest}`;
  return getLastPost()?.slot === slot ? null : slot;
}

// Next scheduled post, for the dashboard, e.g. "13:00 WAT".
export function nextPostTime(now = new Date()): string | null {
  const times = postTimes();
  if (times.length === 0) return null;
  const { time } = lagosNow(now);
  const next = times.find((t) => toMinutes(t) > toMinutes(time)) ?? times[0];
  return `${next} WAT`;
}
