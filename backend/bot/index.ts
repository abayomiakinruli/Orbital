import { Bot, InlineKeyboard } from "grammy";
import { orbitalConfig } from "../../config/orbital";
import { tradeOutcomeMessage } from "../tradeMessages";
import {
  checkAccountName,
  checkAccountNumber,
  checkBankName,
  checkCoinAmount,
  checkTransactionId,
  checkWalletAddress,
} from "../validate";

// ORBITAL trading bot — the primary trading interface (the website only
// links here). The bot holds no pricing or business logic of its own: every
// asset, rate, payment account, deposit address and transaction record comes
// from the backend API, which is the single source of truth shared with the
// admin dashboard and the website.

const token = process.env.TELEGRAM_BOT_TOKEN;
const apiKey = process.env.BOT_API_KEY;
const apiBase = process.env.API_BASE_URL ?? "http://localhost:3000";
const staffIds = (process.env.STAFF_CHAT_IDS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set (get one from @BotFather)");
if (!apiKey) throw new Error("BOT_API_KEY is not set");
if (staffIds.length === 0) {
  console.warn("STAFF_CHAT_IDS is empty: trade alerts will not reach anyone.");
}

const bot = new Bot(token);
const MIN_NGN = 5_000;
const MAX_NGN = 50_000_000;
// Independent of customer activity, so the admin dashboard's online/offline
// indicator reflects the bot process itself. See app/api/bot/ping/route.ts.
const HEARTBEAT_MS = 30_000;

async function api(path: string, method: "POST" | "PATCH", body: unknown) {
  const res = await fetch(`${apiBase}${path}`, {
    method,
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new Error(String(data.error ?? res.status));
  return data;
}

async function getApi(path: string) {
  const res = await fetch(`${apiBase}${path}`, {
    headers: { authorization: `Bearer ${apiKey}` },
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new Error(String(data.error ?? res.status));
  return data;
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const naira = (n: number) =>
  `₦${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
// Every Naira amount a customer sees or pays is rounded to the nearest 100 —
// no kobo anywhere.
const roundNaira = (n: number) => Math.round(n / 100) * 100;

// --- Backend reads (assets, rates, payment account, addresses) -------------
// Never hard-coded and never trusted from a customer's message — the bot
// only ever displays/echoes what the backend returns.

type AssetInfo = { symbol: string; name: string };
async function getAssets(): Promise<AssetInfo[]> {
  const data = await getApi("/api/bot/assets");
  return (data.assets as AssetInfo[]) ?? [];
}

type RateInfo = { symbol: string; name: string; buy: number; sell: number };
async function getRates(): Promise<RateInfo[]> {
  const data = await getApi("/api/bot/rate");
  return (data.rates as RateInfo[]) ?? [];
}
async function getTradeDuration(): Promise<number | null> {
  const data = await getApi("/api/bot/rate");
  return (data.durationMinutes as number | null) ?? null;
}

// A trade quote — an id, a rate, and an expiry — rather than a bare
// number (see app/api/bot/quote/route.ts). Passing `ngnAmount` lets the
// backend decide whether this is a bulk-sized trade (its own margin tier,
// plus a live Bybit re-check performed there, not by the bot). `rate` is
// null when the backend has nothing safe to quote right now (stale/
// unavailable) — every caller must handle that before using this.
type Quote = {
  quoteId: string | null;
  rate: number | null;
  status: string;
  expiresAt: string | null;
};
// hold="sell" asks the backend for a longer-lived quote: the rate a seller
// is shown before sending crypto, honoured if they confirm in time.
async function requestQuote(
  symbol: string,
  side: "buy" | "sell",
  ngnAmount?: number,
  hold?: "sell",
): Promise<Quote> {
  const qs = new URLSearchParams({ symbol, side });
  if (ngnAmount !== undefined) qs.set("ngn_amount", String(Math.round(ngnAmount)));
  if (hold) qs.set("hold", hold);
  const data = await getApi(`/api/bot/quote?${qs.toString()}`);
  return {
    quoteId: (data.quoteId as string | undefined) ?? null,
    rate: (data.rate as number | undefined) ?? null,
    status: String(data.status ?? "unavailable"),
    expiresAt: (data.expiresAt as string | undefined) ?? null,
  };
}

type AddressInfo = { network: string | null; address: string };
async function getAddresses(symbol: string): Promise<AddressInfo[]> {
  const data = await getApi(`/api/bot/addresses?symbol=${encodeURIComponent(symbol)}`);
  return (data.addresses as AddressInfo[]) ?? [];
}

type PaymentAccount = { account_name: string; account_number: string; bank_name: string };
async function getPaymentAccount(): Promise<PaymentAccount | null> {
  const data = await getApi("/api/bot/payment-account");
  return (data.account as PaymentAccount | null) ?? null;
}

async function rateMessage(): Promise<string> {
  const rates = await getRates();
  if (rates.length === 0) {
    return "Rates aren't available right now — please try again shortly or contact support.";
  }
  const lines = rates.map((r) => `${r.symbol}\nBuy: ${naira(r.buy)}\nSell: ${naira(r.sell)}`);
  return `ORBITAL RATES\n\n${lines.join("\n\n")}\n\nRates can move during the day — confirmed again when you place your order.`;
}

// --- Trade draft state -------------------------------------------------
// In-memory per customer while they work through the steps. `step` says
// what text reply the bot is currently waiting for; nothing here is ever
// trusted as final — the backend recalculates and validates on submit.

type Step =
  | "buyAmount"
  | "buyAddress"
  | "sellCoin"
  | "sellAccountName"
  | "sellAccountNumber"
  | "sellBankName"
  | "trackId"
  | "reportMessage"
  | null;

type Draft = {
  asset?: string;
  side?: "buy" | "sell";
  buyRate?: number;
  sellRate?: number;
  nairaAmount?: number; // buy: calculated from coinAmount; sell: calculated too
  coinAmount?: number; // buy: entered by customer; sell: entered by customer
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
  network?: string | null; // buy: customer's receiving network; sell: sending network
  address?: string; // buy: customer's receiving address; sell: ORBITAL's shown address
  quoteId?: string | null; // the informational quote taken at asset-selection time
  quoteExpiresAt?: string | null;
  sellRateLockedUntil?: number; // ms; the locked sell rate is honoured until then
  step: Step;
  trackedTradeId?: number;
  trackedAccountId?: number;
  trackedTransactionId?: string;
};
const drafts = new Map<number, Draft>();
const draftFor = (id: number) => {
  let d = drafts.get(id);
  if (!d) {
    d = { step: null };
    drafts.set(id, d);
  }
  return d;
};

const mainMenu = () =>
  new InlineKeyboard()
    .text("Trade", "trade")
    .row()
    .text("Rate", "rate")
    .row()
    .text("Track ID", "track")
    .row()
    .url("Customer Support", orbitalConfig.whatsapp);

type TelegramUser = { id: number; username?: string; first_name: string; last_name?: string };

function who(from: { id: number; username?: string; first_name: string }): string {
  return from.username
    ? `@${esc(from.username)} (ID: ${from.id})`
    : `<a href="tg://user?id=${from.id}">${esc(from.first_name)}</a> (ID: ${from.id})`;
}

async function registerAccount(from: TelegramUser) {
  try {
    await api("/api/bot/accounts", "POST", {
      telegram_id: from.id,
      username: from.username,
      full_name: [from.first_name, from.last_name].filter(Boolean).join(" "),
    });
  } catch (e) {
    console.error("Could not register account:", e);
  }
}

bot.command("start", async (ctx) => {
  const from = ctx.from;
  if (!from) return;
  drafts.delete(from.id);
  await registerAccount(from);
  await ctx.reply("Hello, welcome to orbital trading bot. What would you like to do?", {
    reply_markup: mainMenu(),
  });
});

bot.command("cancel", async (ctx) => {
  if (ctx.from) drafts.delete(ctx.from.id);
  await ctx.reply("Cancelled. Send /start to begin again.");
});

async function replyRate(ctx: { reply: (t: string) => Promise<unknown> }) {
  await ctx.reply(await rateMessage());
}
bot.command("rate", replyRate);
bot.callbackQuery("rate", async (ctx) => {
  await ctx.answerCallbackQuery();
  await replyRate(ctx);
});

// --- Trade: asset --------------------------------------------------------

bot.command("trade", async (ctx) => {
  if (!ctx.from) return;
  drafts.set(ctx.from.id, { step: null });
  await ctx.reply("What would you like to do?", {
    reply_markup: new InlineKeyboard().text("Buy", "side:buy").text("Sell", "side:sell"),
  });
});
bot.callbackQuery("trade", async (ctx) => {
  drafts.set(ctx.from.id, { step: null });
  await ctx.answerCallbackQuery();
  await ctx.reply("What would you like to do?", {
    reply_markup: new InlineKeyboard().text("Buy", "side:buy").text("Sell", "side:sell"),
  });
});

bot.callbackQuery(/^side:(buy|sell)$/, async (ctx) => {
  const draft = draftFor(ctx.from.id);
  draft.side = ctx.match[1] as "buy" | "sell";
  await ctx.answerCallbackQuery();

  let assets: AssetInfo[];
  try {
    assets = await getAssets();
  } catch (e) {
    console.error("Could not load assets:", e);
    return ctx.editMessageText("Sorry, something went wrong loading assets. Please try again shortly.");
  }
  if (assets.length === 0) {
    return ctx.editMessageText("No assets are available to trade right now. Please try again later.");
  }
  const kb = new InlineKeyboard();
  assets.forEach((a, i) => {
    kb.text(a.symbol, `asset:${a.symbol}`);
    if (i % 3 === 2) kb.row();
  });
  await ctx.editMessageText("Which asset?", { reply_markup: kb });
});

bot.callbackQuery(/^asset:(\w+)$/, async (ctx) => {
  const asset = ctx.match[1];
  const draft = draftFor(ctx.from.id);
  draft.asset = asset;
  await ctx.answerCallbackQuery();

  let quote: Quote;
  try {
    quote = await requestQuote(asset, draft.side!);
  } catch (e) {
    console.error("Could not load quote:", e);
    return ctx.editMessageText("Sorry, something went wrong fetching the rate. Please try again shortly.");
  }
  if (quote.rate === null) {
    draft.step = null;
    return ctx.editMessageText(
      `Rates for ${asset} are temporarily unavailable. Please try again shortly or contact support.`,
      { reply_markup: new InlineKeyboard().url("Customer Support", orbitalConfig.whatsapp) },
    );
  }
  draft.quoteId = quote.quoteId;
  draft.quoteExpiresAt = quote.expiresAt;
  if (draft.side === "buy") draft.buyRate = quote.rate;
  else draft.sellRate = quote.rate;

  if (draft.side === "buy") {
    draft.step = "buyAmount";
    await ctx.editMessageText(
      `Buy ${asset}\n\nRate: ${naira(quote.rate)} / ${asset}\n\nHow much ${asset} do you want to buy?`,
    );
  } else {
    draft.step = "sellCoin";
    await ctx.editMessageText(
      `Sell ${asset}\n\nRate: ${naira(quote.rate)} / ${asset}\n\nHow much ${asset} do you want to sell?`,
    );
  }
});

// --- Buy: trade summary ----------------------------------------------------

function tradeSummary(draft: Draft, durationMinutes: number | null): string {
  const asset = draft.asset!;
  const durationLine = durationMinutes ? `\nComplete within: ${durationMinutes} minutes` : "";
  return (
    `ORBITAL TRADE\n\n` +
    `Type: Buy\nAsset: ${asset}\nRate: ${naira(draft.buyRate!)} / ${asset}\n` +
    `You pay: ${naira(draft.nairaAmount!)}\nYou receive: ${draft.coinAmount} ${asset}${durationLine}`
  );
}

const summaryKeyboard = () => new InlineKeyboard().text("Trade", "confirm").text("Cancel", "abort");

bot.callbackQuery("abort", async (ctx) => {
  drafts.delete(ctx.from.id);
  await ctx.answerCallbackQuery();
  await ctx.editMessageText("Cancelled. Send /start to begin again.");
});

// --- Buy: confirm -> network (if needed) -> address -> transaction created -

async function createTransaction(
  ctx: { from: { id: number; username?: string; first_name: string } },
  draft: Draft,
): Promise<{ id: number; transaction_id: string }> {
  const trade = (await api("/api/bot/trades", "POST", {
    telegram_id: ctx.from.id,
    asset: draft.asset,
    side: draft.side,
    amount: draft.coinAmount,
    fiat_amount: draft.nairaAmount,
    fiat_currency: "NGN",
    rate: draft.side === "buy" ? draft.buyRate : draft.sellRate,
    account_number: draft.accountNumber,
    account_name: draft.accountName,
    bank_name: draft.bankName,
    network: draft.network,
    dest_address: draft.address,
    status: "processing",
  })) as { id: number; transaction_id: string };
  return trade;
}

function alertText(draft: Draft, transactionId: string, whoLine: string): string {
  const payoutLine = draft.accountNumber
    ? `\nPay out to: <b>${esc(draft.accountNumber)}</b> (${esc(draft.accountName ?? "")}, ${esc(draft.bankName ?? "")})`
    : "";
  const addressLine = draft.address
    ? `\n${draft.side === "buy" ? "Send to" : "Received at"}: <b>${esc(draft.address)}</b>${
        draft.network ? ` (${esc(draft.network)})` : ""
      }`
    : "";
  return (
    `<b>NEW ORBITAL TRANSACTION</b>\n\n` +
    `Transaction ID: ${transactionId}\n` +
    `Type: ${draft.side?.toUpperCase()}\n` +
    `Asset: ${draft.asset}\n` +
    `Amount: ${draft.coinAmount} ${draft.asset}\n` +
    `Rate: ${naira((draft.side === "buy" ? draft.buyRate : draft.sellRate)!)}\n` +
    `${draft.side === "buy" ? "Payable" : "Payout"}: ${naira(draft.nairaAmount!)}\n\n` +
    `Customer: ${whoLine}${payoutLine}${addressLine}\n\n` +
    `Status: PROCESSING`
  );
}

async function alertStaff(text: string, tradeId: number, customerId: number) {
  const kb = new InlineKeyboard()
    .text("Mark Successful", `done:${tradeId}:${customerId}`)
    .text("Mark Failed", `fail:${tradeId}:${customerId}`);
  for (const id of staffIds) {
    bot.api
      .sendMessage(id, text, { parse_mode: "HTML", reply_markup: kb })
      .catch((e) => console.error(`Could not alert staff ${id}:`, e.description ?? e));
  }
}

bot.callbackQuery("confirm", async (ctx) => {
  const draft = drafts.get(ctx.from.id);
  if (!draft?.asset || draft.side !== "buy" || draft.nairaAmount === undefined) {
    return ctx.answerCallbackQuery();
  }
  await ctx.answerCallbackQuery();

  let addresses: AddressInfo[] = [];
  try {
    addresses = await getAddresses(draft.asset);
  } catch (e) {
    console.error("Could not load addresses:", e);
  }

  if (addresses.length > 1) {
    const kb = new InlineKeyboard();
    addresses.forEach((a, i) => {
      if (a.network) kb.text(a.network, `buyNetwork:${a.network}`);
      if (i % 2 === 1) kb.row();
    });
    await ctx.editMessageText(
      `‼️ Please choose the network you want to receive ${draft.asset} on. Choosing the wrong network can result in permanent loss of funds.`,
      { reply_markup: kb },
    );
    return;
  }

  draft.network = addresses[0]?.network ?? null;
  draft.step = "buyAddress";
  await ctx.editMessageText(`Please enter the ${draft.asset} address you want it sent to.`);
});

bot.callbackQuery(/^buyNetwork:(.+)$/, async (ctx) => {
  const draft = drafts.get(ctx.from.id);
  if (!draft?.asset) return ctx.answerCallbackQuery();
  draft.network = ctx.match[1];
  await ctx.answerCallbackQuery();
  draft.step = "buyAddress";
  await ctx.editMessageText(`Please enter the ${draft.asset} address you want it sent to.`);
});

// Only created once the customer confirms they've actually sent payment —
// nothing exists on the backend before this, same as the sell side below.
bot.callbackQuery("buySent", async (ctx) => {
  const draft = drafts.get(ctx.from.id);
  if (!draft?.asset) return ctx.answerCallbackQuery();
  await ctx.answerCallbackQuery();

  let trade: { id: number; transaction_id: string };
  try {
    trade = await createTransaction(ctx, draft);
  } catch (e) {
    console.error("Could not record trade:", e);
    await ctx.editMessageText("Sorry, something went wrong. Please try again with /start.");
    return;
  }

  await ctx.editMessageText(
    `Your transaction has been received and is currently being processed.\n\n` +
      `Transaction ID: ${trade.transaction_id}\n\n` +
      `Keep this ID to track your transaction. You'll be notified here once payment is confirmed and the trade completes.` +
      trackLine(trade.transaction_id),
  );

  await alertStaff(alertText(draft, trade.transaction_id, who(ctx.from)), trade.id, ctx.from.id);
  drafts.delete(ctx.from.id);
});

// --- Sell: bank details -> network (if needed) -> address -> confirm sent --

const sellSummaryKeyboard = () =>
  new InlineKeyboard().text("Continue", "sellContinue").text("Edit Details", "sellEdit");

function sellOrderSummary(draft: Draft): string {
  return (
    `SELL ORDER SUMMARY\n\n` +
    `Asset: ${draft.asset}\nAmount: ${draft.coinAmount} ${draft.asset}\n` +
    `Rate: ${naira(draft.sellRate!)}\nYou receive: ${naira(draft.nairaAmount!)}\n\n` +
    `Bank Details\nAccount Name: ${draft.accountName}\nAccount Number: ${draft.accountNumber}\nBank Name: ${draft.bankName}`
  );
}

bot.callbackQuery("sellEdit", async (ctx) => {
  const draft = drafts.get(ctx.from.id);
  if (!draft) return ctx.answerCallbackQuery();
  draft.step = "sellAccountName";
  await ctx.answerCallbackQuery();
  await ctx.editMessageText("Please enter your account Name");
});

// Quote timestamps are "YYYY-MM-DD HH:MM:SS" UTC.
const quoteTime = (s: string) => new Date(`${s.replace(" ", "T")}Z`).getTime();

// Shown on /track and in confirmations when the site has a public address.
const siteUrl = process.env.SITE_URL?.replace(/\/$/, "");
const trackLine = (transactionId: string) =>
  siteUrl ? `\nTrack it any time: ${siteUrl}/track?id=${encodeURIComponent(transactionId)}` : "";

async function showSellAddress(
  ctx: { editMessageText: (text: string, other?: { reply_markup?: InlineKeyboard }) => Promise<unknown> },
  draft: Draft,
  addr: AddressInfo,
) {
  draft.network = addr.network;
  draft.address = addr.address;
  const networkLine = addr.network ? `Network: ${addr.network}\n` : "";
  const minutes = draft.sellRateLockedUntil
    ? Math.max(1, Math.round((draft.sellRateLockedUntil - Date.now()) / 60000))
    : null;
  const lockLine = minutes
    ? `\n\nThis rate is locked for ${minutes} minutes. Send and tap "I've sent it" within that time to keep it.`
    : "";
  await ctx.editMessageText(
    `Asset: ${draft.asset}\nAmount: ${draft.coinAmount} ${draft.asset}\nRate: ${naira(draft.sellRate!)}\nYou receive: ${naira(draft.nairaAmount!)}\n${networkLine}✅${addr.address}${lockLine}`,
    { reply_markup: new InlineKeyboard().text("I've sent it", "sellSent").text("Cancel", "abort") },
  );
}

bot.callbackQuery("sellContinue", async (ctx) => {
  const draft = drafts.get(ctx.from.id);
  if (!draft?.accountName || !draft.accountNumber || !draft.bankName) {
    return ctx.answerCallbackQuery();
  }
  await ctx.answerCallbackQuery();

  // Lock the payout rate now, before the customer sends anything, so the
  // amount they are promised is the amount they get (if they confirm in
  // time). Bulk-sized sells get their bulk price here too.
  const locked = await requestQuote(draft.asset!, "sell", draft.nairaAmount, "sell").catch(() => null);
  if (!locked || locked.rate === null) {
    return ctx.editMessageText("Sorry, rates are temporarily unavailable right now. Please try again shortly.");
  }
  draft.sellRate = locked.rate;
  draft.nairaAmount = roundNaira(draft.coinAmount! * locked.rate);
  draft.quoteId = locked.quoteId;
  draft.quoteExpiresAt = locked.expiresAt;
  draft.sellRateLockedUntil = locked.expiresAt ? quoteTime(locked.expiresAt) : undefined;

  let addresses: AddressInfo[] = [];
  try {
    addresses = await getAddresses(draft.asset!);
  } catch (e) {
    console.error("Could not load addresses:", e);
  }

  if (addresses.length === 0) {
    drafts.delete(ctx.from.id);
    return ctx.editMessageText(
      `We don't have a deposit address set up for ${draft.asset} right now. Please contact support to complete this sell.`,
      { reply_markup: new InlineKeyboard().url("Customer Support", orbitalConfig.whatsapp) },
    );
  }

  if (addresses.length > 1) {
    const kb = new InlineKeyboard();
    addresses.forEach((a, i) => {
      if (a.network) kb.text(a.network, `sellNetwork:${a.network}`);
      if (i % 2 === 1) kb.row();
    });
    await ctx.editMessageText(
      `‼️ Please choose the network you're sending ${draft.asset} from. Choosing the wrong network can result in permanent loss of funds.`,
      { reply_markup: kb },
    );
    return;
  }

  await showSellAddress(ctx, draft, addresses[0]);
});

bot.callbackQuery(/^sellNetwork:(.+)$/, async (ctx) => {
  const draft = drafts.get(ctx.from.id);
  if (!draft?.asset) return ctx.answerCallbackQuery();
  await ctx.answerCallbackQuery();

  const network = ctx.match[1];
  let addresses: AddressInfo[] = [];
  try {
    addresses = await getAddresses(draft.asset);
  } catch (e) {
    console.error("Could not load addresses:", e);
  }
  const chosen = addresses.find((a) => a.network === network);
  if (!chosen) {
    return ctx.editMessageText("Sorry, that network isn't available anymore. Please try again with /start.");
  }
  await showSellAddress(ctx, draft, chosen);
});

bot.callbackQuery("sellSent", async (ctx) => {
  const draft = drafts.get(ctx.from.id);
  if (!draft?.asset) return ctx.answerCallbackQuery();
  await ctx.answerCallbackQuery();

  // The rate locked before they sent is honoured if they confirm in time.
  // Only after the lock has run out is the payout re-priced, and then the
  // customer is told so in the confirmation below.
  let rateNote = "";
  if (!draft.sellRateLockedUntil || Date.now() > draft.sellRateLockedUntil) {
    const fresh = await requestQuote(draft.asset, "sell", draft.nairaAmount).catch(() => null);
    if (!fresh || fresh.rate === null) {
      await ctx.editMessageText("Sorry, rates are temporarily unavailable right now. Please try again shortly.");
      return;
    }
    if (fresh.rate !== draft.sellRate) {
      rateNote = "\n\nYour rate lock had run out, so today's rate was applied to your payout.";
    }
    draft.sellRate = fresh.rate;
    draft.nairaAmount = roundNaira(draft.coinAmount! * fresh.rate);
  }

  let trade: { id: number; transaction_id: string };
  try {
    trade = await createTransaction(ctx, draft);
  } catch (e) {
    console.error("Could not record trade:", e);
    await ctx.editMessageText("Sorry, something went wrong. Please try again with /start.");
    return;
  }

  await ctx.editMessageText(
    `Your transaction has been received and is currently being processed.\n\n` +
      `Asset: ${draft.asset}\nAmount: ${draft.coinAmount} ${draft.asset}\nRate: ${naira(draft.sellRate!)}\n` +
      `You receive: ${naira(draft.nairaAmount!)}\n\n` +
      `Transaction ID: ${trade.transaction_id}\n\n` +
      `Keep this ID to track your transaction. You'll be notified here once it completes.` +
      trackLine(trade.transaction_id) +
      rateNote,
  );

  await alertStaff(alertText(draft, trade.transaction_id, who(ctx.from)), trade.id, ctx.from.id);
  drafts.delete(ctx.from.id);
});

// --- Staff: mark a transaction's outcome -----------------------------------
// Edits the alert in place (status appended, buttons removed) rather than
// replacing it, so the full transaction summary stays on record.

bot.callbackQuery(/^(done|fail):(\d+):(\d+)$/, async (ctx) => {
  if (!staffIds.includes(String(ctx.from.id))) {
    return ctx.answerCallbackQuery({ text: "Staff only.", show_alert: true });
  }
  const [, action, tradeId, customerId] = ctx.match;
  const status = action === "done" ? "successful" : "failed";
  try {
    await api(`/api/bot/trades/${tradeId}`, "PATCH", { status });
  } catch (e) {
    return ctx.answerCallbackQuery({ text: (e as Error).message, show_alert: true });
  }
  await ctx.answerCallbackQuery();
  const original = ctx.msg?.text ?? "";
  // Reusing the original message's entities (bold/link ranges) keeps the
  // HTML-formatted parts intact — they stay valid since we only append text
  // after them. Omitting reply_markup here is what drops the buttons,
  // same as the "abort" handler above already relies on.
  await ctx.editMessageText(`${original}\n\n— Marked ${status.toUpperCase()} by ${ctx.from.first_name} —`, {
    entities: ctx.msg?.entities,
  });
  bot.api
    .sendMessage(
      Number(customerId),
      tradeOutcomeMessage(status),
    )
    .catch(() => {});
});

// --- Track ID ---------------------------------------------------------

bot.command("track", async (ctx) => {
  if (!ctx.from) return;
  draftFor(ctx.from.id).step = "trackId";
  await ctx.reply("Please enter your Transaction ID.");
});
bot.callbackQuery("track", async (ctx) => {
  draftFor(ctx.from.id).step = "trackId";
  await ctx.answerCallbackQuery();
  await ctx.reply("Please enter your Transaction ID.");
});

type TrackedTrade = {
  trade_id: number;
  account_id: number;
  transaction_id: string;
  side: string;
  asset: string;
  amount: number | null;
  fiat_amount: number;
  fiat_currency: string;
  status: string;
  created_at: string;
};

bot.callbackQuery("report", async (ctx) => {
  const draft = drafts.get(ctx.from.id);
  if (!draft?.trackedTradeId) return ctx.answerCallbackQuery();
  draft.step = "reportMessage";
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    `Transaction ID: ${draft.trackedTransactionId}\n\nPlease describe the issue with this transaction.`,
  );
});

// --- Text input: routed by draft.step ---------------------------------

bot.on("message:text", async (ctx) => {
  const draft = drafts.get(ctx.from.id);
  if (!draft?.step) {
    return ctx.reply("Send /start to open the menu.");
  }

  if (draft.step === "buyAmount") {
    const amount = checkCoinAmount(ctx.message.text);
    if (!amount.ok) return ctx.reply(amount.error);
    const value = Number(amount.value);
    const nairaValue = roundNaira(value * draft.buyRate!);
    if (nairaValue < MIN_NGN || nairaValue > MAX_NGN) {
      return ctx.reply(
        `That works out to ${naira(nairaValue)}, which is outside our range of ${naira(MIN_NGN)} to ${naira(MAX_NGN)}. Please adjust the amount.`,
      );
    }
    draft.coinAmount = value;
    draft.nairaAmount = nairaValue;
    draft.step = null;
    let durationMinutes: number | null = null;
    try {
      durationMinutes = await getTradeDuration();
    } catch (e) {
      console.error("Could not load trade duration:", e);
    }
    return ctx.reply(tradeSummary(draft, durationMinutes), { reply_markup: summaryKeyboard() });
  }

  if (draft.step === "buyAddress") {
    // Checked against the chosen network's address format; the step
    // stays open so the customer can simply send a corrected address.
    const address = checkWalletAddress(draft.asset!, draft.network, ctx.message.text);
    if (!address.ok) return ctx.reply(address.error);
    draft.address = address.value;
    draft.step = null;

    // A fresh, authoritative quote now that the real ₦ amount is known —
    // regenerates an expired quote and triggers a live Bybit re-check for
    // a bulk-sized trade (see app/api/bot/quote/route.ts). Recomputes the
    // ₦ total from the (possibly updated) rate; the coin amount the
    // customer asked for doesn't change.
    const fresh = await requestQuote(draft.asset!, "buy", draft.nairaAmount).catch(() => null);
    if (!fresh || fresh.rate === null) {
      return ctx.reply("Sorry, rates are temporarily unavailable right now. Please try again shortly.");
    }
    draft.buyRate = fresh.rate;
    draft.quoteId = fresh.quoteId;
    draft.nairaAmount = roundNaira(draft.coinAmount! * fresh.rate);

    // No transaction yet — created only once the customer confirms they've
    // actually sent payment (the "buySent" callback below).
    let account: PaymentAccount | null = null;
    try {
      account = await getPaymentAccount();
    } catch (e) {
      console.error("Could not load payment account:", e);
    }
    const accountLines = account
      ? `Account Name: ${account.account_name}\nAccount Number: ${account.account_number}\nBank: ${account.bank_name}\n`
      : "";

    const kb = new InlineKeyboard().text("I've sent the payment", "buySent").text("Cancel", "abort");
    return ctx.reply(`Payment Details\n${accountLines}Send: ${naira(draft.nairaAmount!)}`, {
      reply_markup: kb,
    });
  }

  if (draft.step === "sellCoin") {
    const amount = checkCoinAmount(ctx.message.text);
    if (!amount.ok) return ctx.reply(amount.error);
    const value = Number(amount.value);
    const naira_ = roundNaira(value * draft.sellRate!);
    if (naira_ < MIN_NGN || naira_ > MAX_NGN) {
      return ctx.reply(
        `That works out to ${naira(naira_)}, which is outside our range of ${naira(MIN_NGN)} to ${naira(MAX_NGN)}. Please adjust the amount.`,
      );
    }
    draft.coinAmount = value;
    draft.nairaAmount = naira_;
    draft.step = "sellAccountName";
    return ctx.reply("Please enter the account name exactly as your bank shows it.");
  }

  if (draft.step === "sellAccountName") {
    const name = checkAccountName(ctx.message.text);
    if (!name.ok) return ctx.reply(name.error);
    draft.accountName = name.value;
    draft.step = "sellAccountNumber";
    return ctx.reply("Please enter your 10 digit account number.");
  }

  if (draft.step === "sellAccountNumber") {
    const number = checkAccountNumber(ctx.message.text);
    if (!number.ok) return ctx.reply(number.error);
    draft.accountNumber = number.value;
    draft.step = "sellBankName";
    return ctx.reply("Please enter your bank name");
  }

  if (draft.step === "sellBankName") {
    const bank = checkBankName(ctx.message.text);
    if (!bank.ok) return ctx.reply(bank.error);
    draft.bankName = bank.value;
    draft.step = null;
    return ctx.reply(sellOrderSummary(draft), { reply_markup: sellSummaryKeyboard() });
  }

  if (draft.step === "trackId") {
    const checked = checkTransactionId(ctx.message.text);
    if (!checked.ok) return ctx.reply(checked.error);
    const id = checked.value;
    draft.step = null;
    let trade: TrackedTrade | null;
    try {
      const data = await getApi(`/api/bot/track?id=${encodeURIComponent(id)}`);
      trade = (data.trade as TrackedTrade | null) ?? null;
    } catch (e) {
      console.error("Track lookup failed:", e);
      return ctx.reply("Sorry, something went wrong looking that up. Please try again shortly.");
    }
    if (!trade) {
      return ctx.reply(
        "We couldn't find a transaction with that ID. Please check it and try again, or contact support.",
        { reply_markup: new InlineKeyboard().url("Customer Support", orbitalConfig.whatsapp) },
      );
    }
    draft.trackedTradeId = trade.trade_id;
    draft.trackedAccountId = trade.account_id;
    draft.trackedTransactionId = trade.transaction_id;
    return ctx.reply(
      `Transaction ID: ${trade.transaction_id}\n` +
        `Type: ${trade.side.toUpperCase()}\n` +
        `Asset: ${trade.asset}\n` +
        `Amount: ${trade.amount ?? "—"} ${trade.asset}\n` +
        `Date: ${trade.created_at}\n` +
        `Status: ${trade.status.toUpperCase()}`,
      { reply_markup: new InlineKeyboard().text("Report Transaction", "report") },
    );
  }

  if (draft.step === "reportMessage") {
    const message = ctx.message.text.trim();
    if (message.length < 3) {
      return ctx.reply("Please describe the issue in a bit more detail.");
    }
    draft.step = null;
    try {
      await api("/api/bot/reports", "POST", {
        trade_id: draft.trackedTradeId,
        account_id: draft.trackedAccountId,
        message,
      });
    } catch (e) {
      console.error("Could not submit report:", e);
      return ctx.reply("Sorry, something went wrong submitting your report. Please contact support.");
    }
    return ctx.reply("Thank you — your report has been submitted. Our team will follow up.");
  }

  return ctx.reply("Send /start to open the menu.");
});

bot.catch((err) => console.error("Bot error:", err.error));

async function main() {
  await bot.api.setMyCommands([
    { command: "start", description: "Open the ORBITAL menu" },
    { command: "trade", description: "Buy or sell a digital asset" },
    { command: "rate", description: "See today's rates" },
    { command: "track", description: "Track a transaction by ID" },
    { command: "cancel", description: "Cancel your current request" },
  ]);

  const heartbeat = () => getApi("/api/bot/ping").catch(() => {});
  heartbeat();
  setInterval(heartbeat, HEARTBEAT_MS);

  await bot.start({
    onStart: (me) => console.log(`ORBITAL bot running as @${me.username}`),
  });
}

main();
