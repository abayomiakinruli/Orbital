import { Bot, InlineKeyboard, type Context } from "grammy";
import { supportChoices } from "../../config/orbital";
import { tradeOutcomeMessage } from "../tradeMessages";
import {
  checkAccountName,
  checkAccountNumber,
  checkBankName,
  checkCoinAmount,
  checkPreferredName,
  checkTransactionId,
  checkWalletAddress,
} from "../validate";
import { dbTime } from "../../shared/format";
import { escapeHtml as esc } from "../telegram";

// ORBITAL trading bot — the primary trading interface (the website only
// links here). The bot holds no pricing or business logic of its own: every
// asset, rate, payment account, deposit address and transaction record comes
// from the backend API, which is the single source of truth shared with the
// admin dashboard and the website.

const token = process.env.TELEGRAM_BOT_TOKEN ?? "test-token";
const apiKey = process.env.BOT_API_KEY ?? "";
const apiBase = process.env.API_BASE_URL ?? "http://localhost:3000";
const staffIds = (process.env.STAFF_CHAT_IDS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.warn("TELEGRAM_BOT_TOKEN is not set (get one from @BotFather) — bot startup is disabled for this environment.");
}
if (!process.env.BOT_API_KEY) {
  console.warn("BOT_API_KEY is not set — the ORBITAL bot is disabled for this environment.");
}
if (staffIds.length === 0) {
  console.warn("STAFF_CHAT_IDS is empty: trade alerts will not reach anyone.");
}

const bot = new Bot(token);
// The smallest trade ORBITAL takes. There is deliberately no upper limit.
const MIN_NGN = 5_000;
// Independent of customer activity, so the admin dashboard's online/offline
// indicator reflects the bot process itself. See app/api/bot/ping/route.ts.
// backend/supervisor.ts also reads it to tell whether a bot is running.
const HEARTBEAT_MS = 10_000;

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

// ₦13,875.50, or ₦14,000 when there's no kobo.
const naira = (n: number) => {
  const digits = Math.round(n * 100) % 100 === 0 ? 0 : 2;
  return `₦${n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
};
// Every Naira amount a customer sees or pays is the exact coin amount × rate,
// to the kobo — no rounding to a round figure. (Math.round only strips
// floating-point noise below a kobo.)
const exactNaira = (n: number) => Math.round(n * 100) / 100;
// Told to a customer whose amount comes to less than the smallest trade.
const belowMinimum = (value: number) =>
  `That works out to ${naira(value)}, which is below our minimum of ${naira(MIN_NGN)}. Please enter a larger amount.`;

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
  | "preferredName"
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
  awaitingTerms?: boolean; // the Terms of Service prompt is showing; cleared on the first Accept
  step: Step;
  trackedTradeId?: number;
  trackedAccountId?: number;
  trackedTransactionId?: string;
  savedBanks?: CustomerBank[];
  savedAddresses?: CustomerAddress[]; // the customer's saved receiving addresses for the current buy
  bankFromSaved?: boolean; // the bank account in use was picked from the saved list
  addressFromSaved?: boolean; // the receiving address in use was picked from the saved list
  renaming?: boolean; // the next name entered is a rename, not first-time setup
  tradeAfterName?: boolean; // asked for a name on the way into a trade: show Buy/Sell next
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

// One main menu for every customer, new or returning:
// Trade, Rate, Track ID, View profile, Customer Support.
export const mainMenuKeyboard = () =>
  new InlineKeyboard()
    .text("Trade", "trade")
    .row()
    .text("Rate", "rate")
    .row()
    .text("Track ID", "track")
    .row()
    .text("View profile", "profile")
    .row()
    .text("Customer Support", "support");

// What "Customer Support" opens: the usual reasons plus "Other". Each button
// opens WhatsApp with a matching message already typed (config/orbital.ts).
export const supportKeyboard = () => {
  const keyboard = new InlineKeyboard();
  for (const choice of supportChoices) keyboard.url(choice.label, choice.url).row();
  return keyboard.text("Back", "mainMenu");
};

// Kept as aliases so existing imports keep working.
export const newUserMenu = mainMenuKeyboard;
export const returningCustomerMenu = mainMenuKeyboard;

// Buttons under the profile: Edit details, Customer Support, Back.
export const profileKeyboard = () =>
  new InlineKeyboard()
    .text("Edit details", "profileEdit")
    .row()
    .text("Customer Support", "support")
    .row()
    .text("Back", "mainMenu");

export const editDetailsMenu = () =>
  new InlineKeyboard()
    .text("Change my name", "settingsName")
    .row()
    .text("Remove a bank account", "editBanks")
    .row()
    .text("Remove an address", "editAddresses")
    .row()
    .text("Back", "profile");
export const settingsMenu = editDetailsMenu;

type TelegramUser = { id: number; username?: string; first_name: string; last_name?: string };
type CustomerAccount = { id: number; preferred_name: string | null; terms_accepted_at: string | null };
type CustomerBank = { id: number; accountName: string; accountNumber: string; bankName: string; lastFour: string; isDefault: boolean };
type CustomerAddress = { id: number; asset: string; network: string | null; address: string };

function who(from: { id: number; username?: string; first_name: string }): string {
  return from.username
    ? `@${esc(from.username)} (ID: ${from.id})`
    : `<a href="tg://user?id=${from.id}">${esc(from.first_name)}</a> (ID: ${from.id})`;
}

async function customerApi(from: TelegramUser, action: string, values: Record<string, unknown> = {}) {
  return api("/api/bot/customer", "POST", { action, telegram_id: from.id, ...values });
}
async function lookupCustomer(from: TelegramUser): Promise<CustomerAccount | null> {
  const data = await customerApi(from, "lookup");
  return (data.account as CustomerAccount | null) ?? null;
}
async function registerAccount(from: TelegramUser) {
  const data = await customerApi(from, "register", {
    username: from.username,
    full_name: [from.first_name, from.last_name].filter(Boolean).join(" "),
  });
  return data.account as CustomerAccount;
}

bot.command("start", async (ctx) => {
  const from = ctx.from;
  if (!from) return;
  drafts.delete(from.id);
  let customer: CustomerAccount | null = null;
  try {
    customer = await lookupCustomer(from);
  } catch (e) {
    console.error("Could not look up customer:", e);
    return ctx.reply("I can’t connect to ORBITAL right now. Please try again shortly.");
  }
  if (!customer) {
    try {
      await registerAccount(from);
    } catch (e) {
      console.error("Could not register customer:", e);
      return ctx.reply("I couldn’t set up your account right now. Please try /start again shortly.");
    }
    const draft = draftFor(from.id); draft.step = "preferredName";
    return ctx.reply("Welcome to ORBITAL! We’re glad to have you here. Before we proceed, what would you like us to call you?");
  }
  if (!customer.preferred_name) {
    const draft = draftFor(from.id); draft.step = "preferredName";
    return ctx.reply("Welcome to ORBITAL! What would you like us to call you?");
  }
  await ctx.reply(`Welcome back, ${esc(customer.preferred_name)}! Good to have you back with ORBITAL. What would you like to do?`, {
    reply_markup: returningCustomerMenu(),
  });
});

// Sent as a new message, so whatever the customer was looking at (an error,
// their profile) stays in the chat above it.
bot.callbackQuery("support", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply(
    "CUSTOMER SUPPORT\n\nWhat do you need help with? Choose one and WhatsApp will open with your message ready to send.",
    { reply_markup: supportKeyboard() },
  );
});

bot.callbackQuery("mainMenu", async (ctx) => {
  await ctx.answerCallbackQuery();
  let customer: CustomerAccount | null;
  try {
    customer = await lookupCustomer(ctx.from);
  } catch (e) {
    console.error("Could not load customer menu:", e);
    return ctx.editMessageText("I can’t connect to ORBITAL right now. Please try again shortly.");
  }
  if (!customer?.preferred_name) {
    const draft = draftFor(ctx.from.id);
    draft.step = "preferredName";
    await ctx.editMessageText("Before we continue, what would you like us to call you?");
    return;
  }
  await ctx.editMessageText(`Welcome back, ${esc(customer.preferred_name)}! Good to have you back with ORBITAL. What would you like to do?`, {
    reply_markup: returningCustomerMenu(),
  });
});

// --- Profile ---------------------------------------------------------------
// Everything on the profile comes from the backend: the customer's name, how
// many trades they've placed, and every bank account and receiving address
// they've used in a trade (saved automatically once a trade is placed — see
// rememberUsedDetails).

const MAX_LISTED = 10; // keeps the profile inside Telegram's message-size limit

async function listBanks(from: TelegramUser): Promise<CustomerBank[]> {
  const data = await customerApi(from, "listBanks");
  return Array.isArray(data.banks) ? (data.banks as CustomerBank[]) : [];
}
async function listAddresses(
  from: TelegramUser,
  filter: { asset?: string; network?: string | null } = {},
): Promise<CustomerAddress[]> {
  const data = await customerApi(from, "listAddresses", filter);
  return Array.isArray(data.addresses) ? (data.addresses as CustomerAddress[]) : [];
}
async function countTrades(from: TelegramUser): Promise<number> {
  const data = await customerApi(from, "countTrades");
  return Number(data.count ?? 0);
}

const shortAddress = (a: string) => (a.length > 16 ? `${a.slice(0, 8)}…${a.slice(-6)}` : a);

// Called once a trade has actually been placed, so the profile only ever holds
// accounts and addresses the customer really used. Details picked from the
// saved list are already stored. A failure here never affects the trade.
async function rememberUsedDetails(from: TelegramUser, draft: Draft) {
  try {
    if (draft.side === "buy" && draft.asset && draft.address && !draft.addressFromSaved) {
      await customerApi(from, "saveAddress", {
        asset: draft.asset,
        network: draft.network ?? null,
        address: draft.address,
      });
    }
    if (draft.side === "sell" && draft.accountName && draft.accountNumber && draft.bankName && !draft.bankFromSaved) {
      await customerApi(from, "saveBank", {
        accountName: draft.accountName,
        accountNumber: draft.accountNumber,
        bankName: draft.bankName,
      });
    }
  } catch (e) {
    console.error("Could not save trade details:", e instanceof Error ? e.message : e);
  }
}

async function profileText(from: TelegramUser): Promise<string> {
  const [customer, banks, addresses, tradeCount] = await Promise.all([
    lookupCustomer(from),
    listBanks(from),
    listAddresses(from),
    countTrades(from),
  ]);

  const accountBlocks = banks
    .slice(0, MAX_LISTED)
    .map(
      (b, i) =>
        `Account ${i + 1}\nBank: ${esc(b.bankName)}\nName: ${esc(b.accountName)}\nNumber: ${esc(b.accountNumber)}`,
    );
  const addressBlocks = addresses
    .slice(0, MAX_LISTED)
    .map(
      (a, i) =>
        `Address ${i + 1}\nAsset: ${esc(a.asset)}${a.network ? ` (${esc(a.network)})` : ""}\nAddress: <code>${esc(a.address)}</code>`,
    );
  const more = (total: number) => (total > MAX_LISTED ? `\n\n…and ${total - MAX_LISTED} more` : "");

  return (
    `YOUR PROFILE\n\n` +
    `Name: ${esc(customer?.preferred_name ?? "Not set yet")}\n` +
    `Trades: ${tradeCount}\n\n` +
    `Accounts:\n${accountBlocks.length ? accountBlocks.join("\n\n") + more(banks.length) : "None yet"}\n\n` +
    `Addresses:\n${addressBlocks.length ? addressBlocks.join("\n\n") + more(addresses.length) : "None yet"}`
  );
}

bot.callbackQuery(/^(profile|settingsProfile)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  let text: string;
  try {
    text = await profileText(ctx.from);
  } catch (e) {
    console.error("Could not load customer profile:", e);
    return ctx.editMessageText("I couldn’t load your profile right now. Please try again shortly.", {
      reply_markup: new InlineKeyboard().text("Back", "mainMenu"),
    });
  }
  await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: profileKeyboard() });
});

// --- Edit details ----------------------------------------------------------

bot.callbackQuery("profileEdit", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText("EDIT DETAILS\n\nWhat would you like to change?", { reply_markup: editDetailsMenu() });
});

bot.callbackQuery("settingsName", async (ctx) => {
  const draft = draftFor(ctx.from.id);
  draft.step = "preferredName";
  draft.renaming = true;
  await ctx.answerCallbackQuery();
  await ctx.editMessageText("Send the name you’d like ORBITAL to use for you.");
});

async function showRemoveBanks(ctx: Context, from: TelegramUser) {
  let banks: CustomerBank[];
  try {
    banks = await listBanks(from);
  } catch (e) {
    console.error("Could not list saved banks:", e);
    return ctx.editMessageText("I couldn’t load your saved bank accounts right now. Please try again shortly.", {
      reply_markup: editDetailsMenu(),
    });
  }
  if (banks.length === 0) {
    return ctx.editMessageText("You have no saved bank accounts.", { reply_markup: editDetailsMenu() });
  }
  const kb = new InlineKeyboard();
  banks.forEach((b, i) => kb.text(`Account ${i + 1}: ${b.bankName} ****${b.lastFour}`, `delBank:${b.id}`).row());
  kb.text("Back", "profileEdit");
  return ctx.editMessageText("Tap a bank account to remove it.", { reply_markup: kb });
}

async function showRemoveAddresses(ctx: Context, from: TelegramUser) {
  let addresses: CustomerAddress[];
  try {
    addresses = await listAddresses(from);
  } catch (e) {
    console.error("Could not list saved addresses:", e);
    return ctx.editMessageText("I couldn’t load your saved addresses right now. Please try again shortly.", {
      reply_markup: editDetailsMenu(),
    });
  }
  if (addresses.length === 0) {
    return ctx.editMessageText("You have no saved addresses.", { reply_markup: editDetailsMenu() });
  }
  const kb = new InlineKeyboard();
  addresses.forEach((a, i) =>
    kb.text(`Address ${i + 1}: ${a.asset} ${shortAddress(a.address)}`, `delAddr:${a.id}`).row(),
  );
  kb.text("Back", "profileEdit");
  return ctx.editMessageText("Tap an address to remove it.", { reply_markup: kb });
}

bot.callbackQuery("editBanks", async (ctx) => {
  await ctx.answerCallbackQuery();
  await showRemoveBanks(ctx, ctx.from);
});
bot.callbackQuery("editAddresses", async (ctx) => {
  await ctx.answerCallbackQuery();
  await showRemoveAddresses(ctx, ctx.from);
});

bot.callbackQuery(/^delBank:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  try {
    await customerApi(ctx.from, "deleteBank", { bank_id: Number(ctx.match[1]) });
  } catch (e) {
    console.error("Could not remove bank account:", e instanceof Error ? e.message : e);
    return ctx.editMessageText("Sorry, I couldn’t remove that account. Please try again shortly.", {
      reply_markup: editDetailsMenu(),
    });
  }
  await showRemoveBanks(ctx, ctx.from);
});
bot.callbackQuery(/^delAddr:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  try {
    await customerApi(ctx.from, "deleteAddress", { address_id: Number(ctx.match[1]) });
  } catch (e) {
    console.error("Could not remove address:", e instanceof Error ? e.message : e);
    return ctx.editMessageText("Sorry, I couldn’t remove that address. Please try again shortly.", {
      reply_markup: editDetailsMenu(),
    });
  }
  await showRemoveAddresses(ctx, ctx.from);
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

const buyOrSellKeyboard = () => new InlineKeyboard().text("Buy", "side:buy").text("Sell", "side:sell");

// Starts a trade. Someone new (no account yet, or no name on it) is welcomed
// and asked what to call them first; their Telegram ID and that name are saved
// on the backend, and the trade carries on once the name is in.
async function startTrade(ctx: Context) {
  const from = ctx.from;
  if (!from) return;
  const draft: Draft = { step: null };
  drafts.set(from.id, draft);
  let customer: CustomerAccount | null;
  try {
    customer = (await lookupCustomer(from)) ?? (await registerAccount(from));
  } catch (e) {
    console.error("Could not load customer before a trade:", e);
    return ctx.reply("I can’t connect to ORBITAL right now. Please try again shortly.");
  }
  if (!customer.preferred_name) {
    draft.step = "preferredName";
    draft.tradeAfterName = true;
    return ctx.reply("Welcome to ORBITAL! We’re glad to have you here. Before we start your trade, what would you like us to call you?");
  }
  await ctx.reply("What would you like to do?", { reply_markup: buyOrSellKeyboard() });
}

bot.command("trade", startTrade);
bot.callbackQuery("trade", async (ctx) => {
  await ctx.answerCallbackQuery();
  await startTrade(ctx);
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
      { reply_markup: new InlineKeyboard().text("Customer Support", "support") },
    );
  }
  draft.quoteId = quote.quoteId;
  draft.quoteExpiresAt = quote.expiresAt;
  if (draft.side === "buy") draft.buyRate = quote.rate;
  else draft.sellRate = quote.rate;

  // Buying or selling, the amount comes first. The rate is shown once we know
  // how much is being traded (the "buyAmount" and "sellCoin" steps), since a
  // large trade is priced at the bulk rate.
  if (draft.side === "buy") {
    draft.step = "buyAmount";
    await ctx.editMessageText(
      `Buy ${asset}\n\nHow much ${asset} do you want to buy? Enter the amount in ${asset}, for example 50.`,
    );
  } else {
    draft.step = "sellCoin";
    await ctx.editMessageText(
      `Sell ${asset}\n\nHow much ${asset} do you want to sell? Enter the amount in ${asset}, for example 50.`,
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

// Saved bank accounts as buttons, plus "Add New Bank Account".
function bankChooser(banks: CustomerBank[]) {
  const kb = new InlineKeyboard();
  banks.forEach((bank) => {
    kb.text(`${bank.bankName} – ****${bank.lastFour}${bank.isDefault ? " (default)" : ""}`, `bank:${bank.id}`).row();
  });
  return kb.text("Add New Bank Account", "bankNew");
}

bot.callbackQuery("bankNew", async (ctx) => {
  const draft = draftFor(ctx.from.id);
  draft.step = "sellAccountName";
  draft.bankFromSaved = false;
  await ctx.answerCallbackQuery();
  await ctx.editMessageText("Please enter the account name exactly as your bank shows it.");
});

bot.callbackQuery(/^bank:(\d+)$/, async (ctx) => {
  const draft = drafts.get(ctx.from.id);
  const bank = draft?.savedBanks?.find((item) => item.id === Number(ctx.match[1]));
  await ctx.answerCallbackQuery();
  if (!draft || !bank) return ctx.editMessageText("That saved bank account is no longer available. Please add a new one.");
  draft.accountName = bank.accountName;
  draft.accountNumber = bank.accountNumber;
  draft.bankName = bank.bankName;
  draft.bankFromSaved = true;
  draft.step = null;
  await ctx.editMessageText(sellOrderSummary(draft), { reply_markup: sellSummaryKeyboard() });
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

// "Trade" on the buy summary: the customer has checked their trade details,
// so the Terms of Service come next if they haven't accepted them before
// (see termsThenContinue below).
bot.callbackQuery("confirm", async (ctx) => {
  const draft = drafts.get(ctx.from.id);
  if (!draft?.asset || draft.side !== "buy" || draft.nairaAmount === undefined) {
    return ctx.answerCallbackQuery();
  }
  await ctx.answerCallbackQuery();
  await termsThenContinue(ctx, draft);
});

// After the terms are accepted: network (if needed) -> address.
async function continueBuy(ctx: Context, draft: Draft) {
  let addresses: AddressInfo[] = [];
  try {
    addresses = await getAddresses(draft.asset!);
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
  await promptBuyAddress(ctx, draft);
}

// Offers the customer's saved addresses for this asset and network, or lets
// them type a new one. Typing an address also works while the buttons show.
async function promptBuyAddress(ctx: Context, draft: Draft) {
  draft.step = "buyAddress";
  draft.addressFromSaved = false;
  draft.savedAddresses = undefined;

  let saved: CustomerAddress[] = [];
  if (ctx.from) {
    try {
      const all = await listAddresses(ctx.from, { asset: draft.asset, network: draft.network ?? null });
      saved = all.filter((a) => a.asset === draft.asset && (a.network ?? null) === (draft.network ?? null));
    } catch (e) {
      console.error("Could not load saved addresses:", e);
    }
  }

  if (saved.length === 0) {
    await ctx.editMessageText(`Please enter the ${draft.asset} address you want it sent to.`);
    return;
  }

  draft.savedAddresses = saved;
  const kb = new InlineKeyboard();
  saved.forEach((a, i) => kb.text(`Address ${i + 1}: ${shortAddress(a.address)}`, `addr:${a.id}`).row());
  kb.text("Use a new address", "addrNew");
  await ctx.editMessageText(
    `Where should we send your ${draft.asset}? Choose a saved address or use a new one.`,
    { reply_markup: kb },
  );
}

bot.callbackQuery(/^buyNetwork:(.+)$/, async (ctx) => {
  const draft = drafts.get(ctx.from.id);
  if (!draft?.asset) return ctx.answerCallbackQuery();
  draft.network = ctx.match[1];
  await ctx.answerCallbackQuery();
  await promptBuyAddress(ctx, draft);
});

bot.callbackQuery(/^addr:(\d+)$/, async (ctx) => {
  const draft = drafts.get(ctx.from.id);
  await ctx.answerCallbackQuery();
  if (!draft?.asset) return ctx.editMessageText("This trade has expired. Send /start to begin again.");
  const saved = draft.savedAddresses?.find((a) => a.id === Number(ctx.match[1]));
  if (!saved) {
    draft.step = "buyAddress";
    return ctx.editMessageText(`That saved address is no longer available. Please enter the ${draft.asset} address you want it sent to.`);
  }
  draft.address = saved.address;
  draft.addressFromSaved = true;
  draft.step = null;
  await proceedToBuyPayment(draft, (text, other) => ctx.editMessageText(text, other));
});

bot.callbackQuery("addrNew", async (ctx) => {
  const draft = drafts.get(ctx.from.id);
  if (!draft?.asset) return ctx.answerCallbackQuery();
  draft.step = "buyAddress";
  draft.addressFromSaved = false;
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(`Please enter the ${draft.asset} address you want it sent to.`);
});

type Send = (
  text: string,
  other?: { parse_mode?: "HTML"; reply_markup?: InlineKeyboard },
) => Promise<unknown>;

// Once the receiving address is known (typed or saved): a fresh, authoritative
// quote now that the real ₦ amount is known — regenerates an expired quote and
// triggers a live Bybit re-check for a bulk-sized trade (see
// app/api/bot/quote/route.ts) — then the payment details. No transaction yet:
// it's created only once the customer confirms they've sent payment ("buySent").
async function proceedToBuyPayment(draft: Draft, send: Send) {
  const fresh = await requestQuote(draft.asset!, "buy", draft.nairaAmount).catch(() => null);
  if (!fresh || fresh.rate === null) {
    return send("Sorry, rates are temporarily unavailable right now. Please try again shortly.");
  }
  draft.buyRate = fresh.rate;
  draft.quoteId = fresh.quoteId;
  draft.nairaAmount = exactNaira(draft.coinAmount! * fresh.rate);

  let account: PaymentAccount | null = null;
  try {
    account = await getPaymentAccount();
  } catch (e) {
    console.error("Could not load payment account:", e);
  }
  // The account number is in <code> (tap to copy in Telegram) and has its
  // own copy button, so the customer copies just the number.
  const accountLines = account
    ? `Account Name: ${esc(account.account_name)}\nAccount Number: <code>${esc(account.account_number)}</code>\nBank: ${esc(account.bank_name)}\n`
    : "";
  // Shown back to the customer so they can see exactly where it's going,
  // especially when it was picked from the saved list.
  const networkNote = draft.network ? ` (${esc(draft.network)})` : "";
  const destination = `\n\nYour ${esc(draft.asset!)}${networkNote} will be sent to:\n<code>${esc(draft.address!)}</code>`;

  const kb = new InlineKeyboard();
  if (account) kb.copyText("📋 Copy account number", account.account_number).row();
  kb.text("I've sent the payment", "buySent").text("Cancel", "abort");
  return send(`Payment Details\n${accountLines}Send: ${naira(draft.nairaAmount!)}${destination}`, {
    parse_mode: "HTML",
    reply_markup: kb,
  });
}

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
    `Thank you, your transaction has been logged. Our team will verify your payment before processing it.\n\n` +
      `Transaction ID: ${trade.transaction_id}\n\n` +
      `Keep this ID to track your transaction. You'll be notified here once payment is confirmed and the trade completes.` +
      trackLine(trade.transaction_id),
  );

  await alertStaff(alertText(draft, trade.transaction_id, who(ctx.from)), trade.id, ctx.from.id);
  await rememberUsedDetails(ctx.from, draft);
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

// The customer has seen their rate and payout and wants to go ahead: ask
// where to pay them, offering saved bank accounts first.
bot.callbackQuery("sellAmountOk", async (ctx) => {
  const draft = drafts.get(ctx.from.id);
  if (!draft?.asset || !draft.coinAmount || !draft.sellRate) return ctx.answerCallbackQuery();
  await ctx.answerCallbackQuery();
  try {
    const banks = await listBanks(ctx.from);
    draft.savedBanks = banks;
    if (banks.length) {
      return ctx.editMessageText(
        "How would you like to receive your payment? Choose a saved bank account or add a new one.",
        { reply_markup: bankChooser(banks) },
      );
    }
  } catch (e) {
    console.error("Could not load saved banks:", e);
  }
  draft.step = "sellAccountName";
  await ctx.editMessageText("Please enter the account name exactly as your bank shows it.");
});

bot.callbackQuery("sellAmountEdit", async (ctx) => {
  const draft = drafts.get(ctx.from.id);
  if (!draft?.asset) return ctx.answerCallbackQuery();
  await ctx.answerCallbackQuery();
  draft.step = "sellCoin";
  await ctx.editMessageText(
    `How much ${draft.asset} do you want to sell? Enter the amount in ${draft.asset}, for example 50.`,
  );
});

bot.callbackQuery("sellEdit", async (ctx) => {
  const draft = drafts.get(ctx.from.id);
  if (!draft) return ctx.answerCallbackQuery();
  await ctx.answerCallbackQuery();
  // Offer the saved accounts again before asking for a new one.
  if (draft.savedBanks?.length) {
    return ctx.editMessageText(
      "How would you like to receive your payment? Choose a saved bank account or add a new one.",
      { reply_markup: bankChooser(draft.savedBanks) },
    );
  }
  draft.step = "sellAccountName";
  await ctx.editMessageText("Please enter your account Name");
});


// Shown on /track and in confirmations when the site has a public address.
const siteUrl = process.env.SITE_URL?.replace(/\/$/, "");
const trackLine = (transactionId: string) =>
  siteUrl ? `\nTrack it any time: ${siteUrl}/track?id=${encodeURIComponent(transactionId)}` : "";

async function showSellAddress(
  ctx: {
    editMessageText: (
      text: string,
      other?: { reply_markup?: InlineKeyboard; parse_mode?: "HTML" },
    ) => Promise<unknown>;
  },
  draft: Draft,
  addr: AddressInfo,
) {
  draft.network = addr.network;
  draft.address = addr.address;
  const networkLine = addr.network ? `Network: ${esc(addr.network)}\n` : "";
  const minutes = draft.sellRateLockedUntil
    ? Math.max(1, Math.round((draft.sellRateLockedUntil - Date.now()) / 60000))
    : null;
  const lockLine = minutes
    ? `\n\nThis rate is locked for ${minutes} minutes. Send and tap "I've sent it" within that time to keep it.`
    : "";
  // The address is in <code> (tap to copy in Telegram) and has its own copy
  // button, so the customer copies just the address.
  await ctx.editMessageText(
    `Asset: ${draft.asset}\nAmount: ${draft.coinAmount} ${draft.asset}\nRate: ${naira(draft.sellRate!)}\nYou receive: ${naira(draft.nairaAmount!)}\n${networkLine}✅ <code>${esc(addr.address)}</code>${lockLine}`,
    {
      parse_mode: "HTML",
      reply_markup: new InlineKeyboard()
        .copyText("📋 Copy address", addr.address)
        .row()
        .text("I've sent it", "sellSent")
        .text("Cancel", "abort"),
    },
  );
}

// --- Terms of Service --------------------------------------------------------
// Shown once the customer has checked their trade details (buy: "Trade" on
// the summary; sell: "Continue" on the bank-details summary), before anything
// else happens. Asked once per customer: the acceptance is saved on their
// account, and later trades skip straight past it. Accept carries on with the
// trade; Decline cancels it (and they are asked again next time). "Read Terms" opens the website's /terms page — that
// needs SITE_URL (Telegram won't open a localhost link), so without it the
// button just says where to find them.

const termsUrl = siteUrl ? `${siteUrl}/terms` : null;

const TERMS_MESSAGE =
  `📜 TERMS OF SERVICE\n\n` +
  `Before we continue, please confirm you accept ORBITAL's Terms of Service. ` +
  `They cover how trades, rates, payments and disputes work.\n\n` +
  `Tap "Read Terms" to read them in full, then "Accept" to continue with this trade ` +
  `or "Decline" to cancel it.`;

function termsKeyboard() {
  const kb = new InlineKeyboard().text("✅ Accept", "termsAccept").row();
  if (termsUrl) kb.url("📄 Read Terms", termsUrl);
  else kb.text("📄 Read Terms", "termsRead");
  return kb.row().text("❌ Decline", "termsDecline");
}

async function askTerms(ctx: Context, draft: Draft) {
  draft.awaitingTerms = true;
  await ctx.editMessageText(TERMS_MESSAGE, { reply_markup: termsKeyboard() });
}

function continueTrade(ctx: Context, draft: Draft) {
  return draft.side === "buy" ? continueBuy(ctx, draft) : continueSell(ctx, draft);
}

// Carries on with the trade if this customer has already accepted the terms;
// otherwise shows them. If the account can't be checked, the terms are shown:
// asking twice is better than skipping them.
async function termsThenContinue(ctx: Context, draft: Draft) {
  let accepted = false;
  try {
    accepted = Boolean(ctx.from && (await lookupCustomer(ctx.from))?.terms_accepted_at);
  } catch (e) {
    console.error("Could not check terms acceptance:", e instanceof Error ? e.message : e);
  }
  if (accepted) return continueTrade(ctx, draft);
  return askTerms(ctx, draft);
}

bot.callbackQuery("termsAccept", async (ctx) => {
  const draft = drafts.get(ctx.from.id);
  await ctx.answerCallbackQuery();
  // A second tap on Accept (double-tap, or an old Terms message) is ignored,
  // so the trade doesn't carry on twice — for a sell, locking the rate twice.
  if (draft?.awaitingTerms === false) return;
  if (draft) draft.awaitingTerms = false;
  // Remember the acceptance so they aren't asked on their next trade. If it
  // can't be saved, this trade still goes ahead and they are asked again later.
  try {
    await customerApi(ctx.from, "acceptTerms");
  } catch (e) {
    console.error("Could not save terms acceptance:", e instanceof Error ? e.message : e);
  }
  if (draft?.side === "buy" && draft.asset && draft.nairaAmount !== undefined) {
    return continueBuy(ctx, draft);
  }
  if (draft?.side === "sell" && draft.accountName && draft.accountNumber && draft.bankName) {
    return continueSell(ctx, draft);
  }
  // No trade in progress any more (e.g. the bot restarted in between).
  await ctx.editMessageText("This trade has expired. Send /start to begin again.");
});

bot.callbackQuery("termsDecline", async (ctx) => {
  drafts.delete(ctx.from.id);
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    "You declined ORBITAL's Terms of Service, so this trade has been cancelled. " +
      "You'll need to accept them to trade with us. Send /start whenever you're ready.",
  );
});

// Only used when SITE_URL isn't set (see above).
bot.callbackQuery("termsRead", (ctx) =>
  ctx.answerCallbackQuery({
    text: 'Our Terms of Service are on the ORBITAL website: tap "Terms of Service" at the bottom of any page.',
    show_alert: true,
  }),
);

// "Continue" on the sell summary: same as the buy side, terms first if needed.
bot.callbackQuery("sellContinue", async (ctx) => {
  const draft = drafts.get(ctx.from.id);
  if (!draft?.accountName || !draft.accountNumber || !draft.bankName) {
    return ctx.answerCallbackQuery();
  }
  await ctx.answerCallbackQuery();
  await termsThenContinue(ctx, draft);
});

// After the terms are accepted: lock the rate -> network (if needed) -> address.
async function continueSell(ctx: Context, draft: Draft) {
  // Lock the payout rate now, before the customer sends anything, so the
  // amount they are promised is the amount they get (if they confirm in
  // time). Bulk-sized sells get their bulk price here too.
  const locked = await requestQuote(draft.asset!, "sell", draft.nairaAmount, "sell").catch(() => null);
  if (!locked || locked.rate === null) {
    return ctx.editMessageText("Sorry, rates are temporarily unavailable right now. Please try again shortly.");
  }
  draft.sellRate = locked.rate;
  draft.nairaAmount = exactNaira(draft.coinAmount! * locked.rate);
  draft.quoteId = locked.quoteId;
  draft.quoteExpiresAt = locked.expiresAt;
  draft.sellRateLockedUntil = locked.expiresAt ? dbTime(locked.expiresAt) : undefined;

  let addresses: AddressInfo[] = [];
  try {
    addresses = await getAddresses(draft.asset!);
  } catch (e) {
    console.error("Could not load addresses:", e);
  }

  if (addresses.length === 0) {
    if (ctx.from) drafts.delete(ctx.from.id);
    return ctx.editMessageText(
      `We don't have a deposit address set up for ${draft.asset} right now. Please contact support to complete this sell.`,
      { reply_markup: new InlineKeyboard().text("Customer Support", "support") },
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
}

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
    draft.nairaAmount = exactNaira(draft.coinAmount! * fresh.rate);
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
    `Thank you, your transaction has been logged. Our team will verify your deposit before paying you.\n\n` +
      `Asset: ${draft.asset}\nAmount: ${draft.coinAmount} ${draft.asset}\nRate: ${naira(draft.sellRate!)}\n` +
      `You receive: ${naira(draft.nairaAmount!)}\n\n` +
      `Transaction ID: ${trade.transaction_id}\n\n` +
      `Keep this ID to track your transaction. You'll be notified here once it completes.` +
      trackLine(trade.transaction_id) +
      rateNote,
  );

  await alertStaff(alertText(draft, trade.transaction_id, who(ctx.from)), trade.id, ctx.from.id);
  await rememberUsedDetails(ctx.from, draft);
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

  if (draft.step === "preferredName") {
    const checkedName = checkPreferredName(ctx.message.text);
    if (!checkedName.ok) return ctx.reply(checkedName.error);
    const name = checkedName.value;
    try {
      await customerApi(ctx.from, "setPreferredName", { preferred_name: name });
    } catch (e) {
      console.error("Could not save preferred name:", e);
      return ctx.reply("I couldn’t save that just now. Please try again shortly.");
    }
    draft.step = null;
    if (draft.tradeAfterName) {
      // They were on their way to a trade when we asked: carry on with it.
      draft.tradeAfterName = false;
      return ctx.reply(`Nice to meet you, ${esc(name)}! What would you like to do?`, {
        reply_markup: buyOrSellKeyboard(),
      });
    }
    if (draft.renaming) {
      draft.renaming = false;
      return ctx.reply(`Done! We'll call you ${name} from now on.`, { reply_markup: mainMenuKeyboard() });
    }
    return ctx.reply(`Nice to meet you, ${esc(name)}! How can we help you today?`, { reply_markup: mainMenuKeyboard() });
  }

  if (draft.step === "buyAmount") {
    const amount = checkCoinAmount(ctx.message.text);
    if (!amount.ok) return ctx.reply(amount.error);
    const value = Number(amount.value);
    const nairaValue = exactNaira(value * draft.buyRate!);
    if (nairaValue < MIN_NGN) return ctx.reply(belowMinimum(nairaValue));
    // Now that the amount is known, get the rate for a purchase of this size
    // (the bulk rate for a large one) before showing the summary.
    const sized = await requestQuote(draft.asset!, "buy", nairaValue).catch(() => null);
    if (!sized || sized.rate === null) {
      return ctx.reply(
        `Rates for ${draft.asset} are temporarily unavailable. Please try again shortly or contact support.`,
        { reply_markup: new InlineKeyboard().text("Customer Support", "support") },
      );
    }
    draft.buyRate = sized.rate;
    draft.quoteId = sized.quoteId;
    draft.quoteExpiresAt = sized.expiresAt;
    draft.coinAmount = value;
    draft.nairaAmount = exactNaira(value * sized.rate);
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
    draft.addressFromSaved = false;
    draft.step = null;
    return proceedToBuyPayment(draft, (text, other) => ctx.reply(text, other));
  }

  if (draft.step === "sellCoin") {
    const amount = checkCoinAmount(ctx.message.text);
    if (!amount.ok) return ctx.reply(amount.error);
    const value = Number(amount.value);
    const naira_ = exactNaira(value * draft.sellRate!);
    if (naira_ < MIN_NGN) return ctx.reply(belowMinimum(naira_));
    // Now that the amount is known, get the rate for a sale of this size
    // and show it, with what the customer would receive.
    const sized = await requestQuote(draft.asset!, "sell", naira_).catch(() => null);
    if (!sized || sized.rate === null) {
      return ctx.reply(
        `Rates for ${draft.asset} are temporarily unavailable. Please try again shortly or contact support.`,
        { reply_markup: new InlineKeyboard().text("Customer Support", "support") },
      );
    }
    draft.sellRate = sized.rate;
    draft.quoteId = sized.quoteId;
    draft.quoteExpiresAt = sized.expiresAt;
    draft.coinAmount = value;
    draft.nairaAmount = exactNaira(value * sized.rate);
    draft.step = null;
    return ctx.reply(
      `Sell ${draft.asset}\n\nAmount: ${value} ${draft.asset}\nRate: ${naira(sized.rate)} / ${draft.asset}\n` +
        `You receive: ${naira(draft.nairaAmount)}\n\n` +
        `Your rate is locked in once you confirm your bank details.`,
      {
        reply_markup: new InlineKeyboard()
          .text("Continue", "sellAmountOk")
          .row()
          .text("Change amount", "sellAmountEdit")
          .text("Cancel", "abort"),
      },
    );
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
    draft.bankFromSaved = false;
    draft.step = null;
    // Not saved yet: a bank account goes on the customer's profile only once a
    // trade using it is actually placed (see rememberUsedDetails).
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
        { reply_markup: new InlineKeyboard().text("Customer Support", "support") },
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
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.BOT_API_KEY) {
    console.error("Bot startup requires both TELEGRAM_BOT_TOKEN and BOT_API_KEY.");
    return;
  }
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