import { orbitalConfig } from "../config/orbital";

// What a customer is told on Telegram when their trade is marked done.
// Shared by the bot's staff buttons (backend/bot/index.ts) and the admin Trades
// page (app/admin/actions.ts), so both say exactly the same thing.
// Relative import: the bot runs outside Next.js's "@/" path alias.
export function tradeOutcomeMessage(status: "successful" | "failed", transactionId?: string | null) {
  const ref = transactionId ? ` (${transactionId})` : "";
  return status === "successful"
    ? `Your ORBITAL transaction${ref} has been completed successfully. Thank you for choosing ${orbitalConfig.brand.name}.`
    : `Your ORBITAL transaction${ref} could not be completed. Please contact ORBITAL support.`;
}
