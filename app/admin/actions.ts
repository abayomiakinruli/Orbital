"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sendTelegramMessage } from "@/backend/telegram";
import { tradeOutcomeMessage } from "@/backend/tradeMessages";
import { postRatesToChannel } from "@/backend/rateChannel";
import {
  clientIp,
  checkPassword,
  createSession,
  destroySession,
  isAdmin,
  loginBlocked,
  recordLoginFailure,
} from "@/backend/auth";
import {
  ValidationError,
  acquireRateRefreshLease,
  addAssetAddress as repoAddAssetAddress,
  createTrade,
  deleteAssetAddress as repoDeleteAssetAddress,
  deleteAnnouncement,
  deleteSubscriber,
  deleteBugReport,
  setBugReportStatus,
  getTradeNotifyInfo,
  setAssetActive,
  setNoticeEnabled,
  upsertAnnouncement,
  setMarginSettings,
  setCoinMargin,
  clearCoinMargin,
  getRate,
  listAssets,
  setPaymentAccount,
  setRate,
  setRateMode,
  setTradeDurationMinutes,
  updateTradeStatus,
  upsertAccount,
  upsertAsset,
  releaseRateRefreshLease,
} from "@/backend/repo";
import { refreshAssetRateNow, usdtNgnReference } from "@/backend/rateEngine";
import { randomUUID } from "node:crypto";

export type FormState = { error?: string; ok?: string };

export async function login(_: FormState, formData: FormData): Promise<FormState> {
  const key = clientIp(await headers());
  if (loginBlocked(key)) {
    return { error: "Too many attempts. Try again in 15 minutes." };
  }
  if (!checkPassword(String(formData.get("password") ?? ""))) {
    recordLoginFailure(key);
    return { error: "Wrong password." };
  }
  await createSession();
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

async function guard<T>(run: () => T, ok: string): Promise<FormState> {
  if (!(await isAdmin())) return { error: "Session expired. Log in again." };
  try {
    run();
    revalidatePath("/admin", "layout");
    return { ok };
  } catch (error) {
    if (error instanceof ValidationError) return { error: error.message };
    throw error;
  }
}

export async function registerAccount(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  return guard(
    () =>
      upsertAccount({
        telegram_id: formData.get("telegram_id"),
        username: formData.get("username"),
        full_name: formData.get("full_name"),
        phone: formData.get("phone"),
        country: formData.get("country"),
        source: "admin",
      }),
    "Account registered.",
  );
}

export async function recordTrade(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  return guard(
    () =>
      createTrade({
        account_id: formData.get("account_id"),
        asset: formData.get("asset"),
        side: formData.get("side"),
        amount: formData.get("amount"),
        rate: formData.get("rate"),
        fiat_amount: formData.get("fiat_amount"),
        fiat_currency: formData.get("fiat_currency"),
        account_number: formData.get("account_number"),
        account_name: formData.get("account_name"),
        bank_name: formData.get("bank_name"),
        status: formData.get("status"),
      }),
    "Trade recorded.",
  );
}

// Called straight from the Trades table's status dropdown
// (frontend/components/admin/TradeStatusSelect.tsx), which saves on change and
// shows this result inline.
export async function setTradeStatus(id: number, status: string): Promise<FormState> {
  const before = getTradeNotifyInfo(id);
  const result = await guard(() => {
    if (!updateTradeStatus(id, status)) throw new ValidationError("Trade not found.");
  }, "Saved ✓");
  // Tell the customer on Telegram, exactly as the bot's staff buttons do,
  // when a trade is newly marked successful or failed.
  if (
    !result.error &&
    before?.telegram_id &&
    before.status !== status &&
    (status === "successful" || status === "failed")
  ) {
    const sent = await sendTelegramMessage(
      before.telegram_id,
      tradeOutcomeMessage(status, before.transaction_id),
    );
    return { ok: sent ? "Saved ✓ Customer notified on Telegram" : "Saved ✓ (couldn't message the customer)" };
  }
  return result;
}

// Every admin currently shares one login password (see backend/auth.ts), so
// there's no individual identity to attribute a rate change to beyond this.
const ADMIN_LABEL = "admin";

export async function saveRate(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const symbol = String(formData.get("symbol") ?? "");
  return guard(
    () => setRate(symbol, formData.get("buy"), formData.get("sell"), ADMIN_LABEL),
    `${symbol.toUpperCase()} rate saved manually. The bot will show it on the next trade request.`,
  );
}

export async function setAssetRateMode(formData: FormData) {
  const symbol = String(formData.get("symbol") ?? "");
  const mode = formData.get("mode") === "auto" ? "auto" : "manual";
  await guard(
    () => setRateMode(symbol, mode, ADMIN_LABEL),
    mode === "auto"
      ? `${symbol.toUpperCase()} is now priced automatically by the rate-refresh worker.`
      : `${symbol.toUpperCase()} switched to a manual rate.`,
  );
}

// Admin-only manual refresh. It takes the same database lease as the worker,
// so this can never run beside a scheduled refresh against the same rates.
export async function refreshAutoRatesNow(): Promise<FormState> {
  if (!(await isAdmin())) return { error: "Session expired. Log in again." };
  const owner = `admin-${process.pid}-${randomUUID()}`;
  if (!acquireRateRefreshLease(owner, Number(process.env.RATE_REFRESH_LOCK_SECONDS ?? 300))) {
    return { error: "A scheduled refresh is already running. Try again shortly." };
  }
  try {
    const assets = listAssets().filter((asset) => asset.active && getRate(asset.symbol)?.mode === "auto");
    if (assets.length === 0) return { error: "No active assets are set to auto pricing." };
    const usdtNgn = await usdtNgnReference();
    let refreshed = 0;
    for (const asset of assets) {
      try {
        await refreshAssetRateNow(asset.symbol, usdtNgn);
        refreshed += 1;
      } catch (error) {
        console.error(`[admin] ${asset.symbol} manual refresh failed:`, error instanceof Error ? error.message : error);
      }
    }
    revalidatePath("/admin", "layout");
    revalidatePath("/");
    return refreshed > 0
      ? { ok: `Refreshed ${refreshed}/${assets.length} auto-priced asset(s).` }
      : { error: "Bybit did not return a valid rate. Existing customer rates were kept." };
  } catch (error) {
    console.error("[admin] manual rate refresh failed:", error instanceof Error ? error.message : error);
    return { error: "Rate refresh failed. Existing customer rates were kept." };
  } finally {
    releaseRateRefreshLease(owner);
  }
}

export async function refreshAutoRates(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  void formData;
  return refreshAutoRatesNow();
}

export async function saveMarginSettings(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const modeLabel = formData.get("mode") === "fixed" ? "fixed ₦ per $1" : "percentage";
  return guard(
    () =>
      setMarginSettings({
        mode: formData.get("mode"),
        buyMargin: formData.get("buyMargin"),
        sellMargin: formData.get("sellMargin"),
        bulkBuyMargin: formData.get("bulkBuyMargin"),
        bulkSellMargin: formData.get("bulkSellMargin"),
        bulkThresholdNgn: formData.get("bulkThresholdNgn"),
      }),
    `Saved in ${modeLabel} mode. Picked up by the rate-refresh worker on its next tick.`,
  );
}

// Per-coin margin overrides (/admin/margins). Blank fields use the default.
export async function saveCoinMargin(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const symbol = String(formData.get("symbol") ?? "").toUpperCase();
  return guard(
    () =>
      setCoinMargin(symbol, {
        buy: formData.get("buy"),
        sell: formData.get("sell"),
        bulkBuy: formData.get("bulkBuy"),
        bulkSell: formData.get("bulkSell"),
      }),
    `${symbol} margins saved. Its rate updates on the next refresh (within 10 minutes).`,
  );
}

export async function resetCoinMargin(formData: FormData) {
  await guard(() => clearCoinMargin(formData.get("symbol")), "Reset to default.");
}

export async function addAsset(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  return guard(
    () =>
      upsertAsset({
        symbol: formData.get("symbol"),
        name: formData.get("name"),
      }),
    "Asset added.",
  );
}

export async function toggleAsset(formData: FormData) {
  await guard(
    () => setAssetActive(formData.get("symbol"), formData.get("active") === "1"),
    "Updated.",
  );
}

export async function savePaymentAccount(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  return guard(
    () =>
      setPaymentAccount({
        account_name: formData.get("account_name"),
        account_number: formData.get("account_number"),
        bank_name: formData.get("bank_name"),
      }),
    "Payment account saved. Shown to customers buying from ORBITAL.",
  );
}

export async function saveTradeDuration(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  return guard(
    () => setTradeDurationMinutes(formData.get("minutes")),
    "Trade duration saved. Shown to customers in the bot's buy preview.",
  );
}

export async function addAssetAddress(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  return guard(
    () =>
      repoAddAssetAddress({
        symbol: formData.get("symbol"),
        network: formData.get("network"),
        address: formData.get("address"),
      }),
    "Address added.",
  );
}

export async function deleteAssetAddress(formData: FormData) {
  await guard(() => repoDeleteAssetAddress(formData.get("id")), "Removed.");
}

// --- Announcements (/admin/announcements) -----------------------------------
// `guard` refreshes the admin pages; the homepage is refreshed here too so
// visitors see the change on their next load.

export async function saveNoticeVisibility(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const enabled = formData.get("enabled") === "on";
  const result = await guard(
    () => setNoticeEnabled(enabled),
    enabled ? "The Important Update is showing on the website." : "The Important Update is hidden.",
  );
  revalidatePath("/");
  return result;
}

export async function saveUpdate(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const editing = Boolean(formData.get("id"));
  const result = await guard(
    () =>
      upsertAnnouncement({
        id: formData.get("id") || undefined,
        title: formData.get("title"),
        content: formData.get("content"),
        tag: formData.get("tag"),
        date_label: formData.get("date_label"),
        published: formData.get("published") === "on",
      }),
    editing ? "Update saved." : "Update added.",
  );
  revalidatePath("/");
  return result;
}

export async function removeUpdate(formData: FormData) {
  await guard(() => deleteAnnouncement(formData.get("id")), "Removed.");
  revalidatePath("/");
}

export async function removeSubscriber(formData: FormData) {
  await guard(() => deleteSubscriber(formData.get("id")), "Removed.");
}

// The dashboard's "Post now" on the Rate channel card. The outcome shows on
// the card itself (backend/rateChannel.ts records every post).
export async function postRatesNow() {
  if (!(await isAdmin())) return;
  await postRatesToChannel();
  revalidatePath("/admin");
}

export async function markBugReport(formData: FormData) {
  await guard(() => setBugReportStatus(formData.get("id"), formData.get("status")), "Updated.");
}

export async function removeBugReport(formData: FormData) {
  await guard(() => deleteBugReport(formData.get("id")), "Removed.");
}
