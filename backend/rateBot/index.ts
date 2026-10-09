import { touchRateBot } from "@/backend/repo";
import {
  duePostSlot,
  postRatesToChannel,
  postTimes,
  rateChannelConfigured,
} from "@/backend/rateChannel";

// ORBITAL rate-updates bot — standalone process (`npm run rate-bot`). Posts
// the live rates to the rate-updates channel at the times in RATE_POST_TIMES
// (Nigerian time); see backend/rateChannel.ts for the post itself. It never
// reads messages, so it doesn't poll Telegram and can't conflict with the
// trading bot. Reads rates straight from the shared database, like the rate
// worker, so it must run on the same machine.

const CHECK_MS = 60_000;
// So the dashboard and backend/supervisor.ts can tell this process is alive.
const HEARTBEAT_MS = 30_000;

async function check() {
  const slot = duePostSlot();
  if (!slot) return;
  const post = await postRatesToChannel(slot);
  console.log(
    post.ok
      ? `[rate-bot] Posted rates for ${slot}`
      : `[rate-bot] Could not post rates for ${slot}: ${post.error}`,
  );
}

console.log(
  rateChannelConfigured()
    ? `[rate-bot] starting — posting at ${postTimes().join(", ")} WAT`
    : "[rate-bot] starting — TELEGRAM_RATE_BOT_TOKEN / RATE_CHANNEL_ID not set, so nothing will be posted",
);
touchRateBot();
setInterval(touchRateBot, HEARTBEAT_MS);
check().catch((e) => console.error("[rate-bot] check failed:", e));
setInterval(() => check().catch((e) => console.error("[rate-bot] check failed:", e)), CHECK_MS);
