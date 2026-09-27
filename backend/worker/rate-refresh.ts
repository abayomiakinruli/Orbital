import { listAssets, getRate } from "@/backend/repo";
import { refreshAssetRateNow } from "@/backend/rateEngine";
import { refreshInstagramTokenIfDue, syncInstagramPosts } from "@/backend/instagram";

// Standalone process — deliberately NOT part of the Next.js server or the
// Telegram bot. Keeps every 'auto' asset's rate fresh on a fixed schedule
// so neither the bot nor the API server ever has to reach Bybit inside a
// request; both just read whatever this worker last stored (see
// backend/rates.ts). Run alongside the server and bot (`npm run rate-worker`),
// on any host — nothing here assumes localhost.
//
// A per-asset failure is caught and logged; it never stops the loop, and
// it never touches the previously cached rate (see backend/rateEngine.ts's
// refreshAssetRateNow / backend/repo.ts's recordRateRefreshFailure) — the old
// rate stands until a refresh actually succeeds.

const REFRESH_INTERVAL_MS = Number(process.env.RATE_REFRESH_INTERVAL ?? 600) * 1000;

async function tick() {
  const assets = listAssets().filter((a) => a.active && getRate(a.symbol)?.mode === "auto");
  if (assets.length === 0) {
    console.log("[rate-worker] no active auto-priced assets — nothing to refresh");
    return;
  }
  for (const a of assets) {
    try {
      const rate = await refreshAssetRateNow(a.symbol);
      console.log(`[rate-worker] ${a.symbol}: buy ${rate.buy_rate} / sell ${rate.sell_rate}`);
    } catch (e) {
      console.error(`[rate-worker] ${a.symbol} refresh failed:`, e instanceof Error ? e.message : e);
    }
  }
}

console.log(`[rate-worker] starting — refreshing every ${REFRESH_INTERVAL_MS / 1000}s`);
tick();
setInterval(tick, REFRESH_INTERVAL_MS);

// Instagram feed (backend/instagram.ts): keep the access token alive and
// mirror the latest posts, hourly. A no-op until an admin connects Instagram.
const INSTAGRAM_SYNC_MS = 60 * 60 * 1000;

async function instagramTick() {
  try {
    if (await refreshInstagramTokenIfDue()) console.log("[instagram] access token refreshed");
    const count = await syncInstagramPosts();
    if (count !== null) console.log(`[instagram] synced ${count} posts`);
  } catch (e) {
    console.error("[instagram] sync failed:", e instanceof Error ? e.message : e);
  }
}

instagramTick();
setInterval(instagramTick, INSTAGRAM_SYNC_MS);
