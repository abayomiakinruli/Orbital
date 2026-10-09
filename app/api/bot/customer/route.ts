import { botHandler } from "@/backend/api";
import {
  ValidationError,
  acceptTerms,
  countCustomerTrades,
  deleteCustomerBank,
  deleteCustomerWallet,
  getAccountByTelegramId,
  listCustomerBanks,
  listCustomerWallets,
  saveCustomerBank,
  saveCustomerWallet,
  setPreferredName,
  upsertAccount,
} from "@/backend/repo";

// Internal API used only by the trading bot. Customer destinations are
// encrypted in the database and are returned only to the bot process holding
// BOT_API_KEY for the Telegram user currently in its conversation.
export async function POST(request: Request) {
  return botHandler(request, (body) => {
    const action = String(body.action ?? "");
    const telegramId = body.telegram_id;
    switch (action) {
      case "lookup":
        return { account: getAccountByTelegramId(telegramId) };
      case "register":
        return { account: upsertAccount({ ...body, source: "bot" }) };
      case "acceptTerms":
        return { account: acceptTerms(telegramId) };
      case "setPreferredName":
        return { account: setPreferredName(telegramId, body.preferred_name) };
      case "listBanks":
        return { banks: listCustomerBanks(telegramId) };
      case "saveBank": {
        // The same account used again is not saved twice.
        const known = listCustomerBanks(telegramId).find(
          (bank) =>
            bank.accountNumber === String(body.accountNumber ?? "").trim() &&
            bank.bankName.toLowerCase() === String(body.bankName ?? "").trim().toLowerCase(),
        );
        if (known) return { bank: known };
        return {
          bank: saveCustomerBank(telegramId, {
            accountName: body.accountName,
            accountNumber: body.accountNumber,
            bankName: body.bankName,
            makeDefault: body.makeDefault,
          }),
        };
      }
      case "deleteBank":
        deleteCustomerBank(telegramId, body.bank_id);
        return { ok: true };
      // The bot calls saved wallets "addresses" (backend/bot/index.ts).
      case "listAddresses":
        return {
          addresses: listCustomerWallets(telegramId, body.asset, body.network).map((wallet) => ({
            id: wallet.id,
            asset: wallet.asset,
            network: wallet.network,
            address: wallet.address,
          })),
        };
      case "saveAddress": {
        // The same address used again is not saved twice.
        const known = listCustomerWallets(telegramId, body.asset, body.network).find(
          (wallet) => wallet.address === String(body.address ?? "").trim(),
        );
        if (known) return { address: known };
        return {
          address: saveCustomerWallet(telegramId, {
            asset: body.asset,
            network: body.network,
            address: body.address,
          }),
        };
      }
      case "deleteAddress":
        deleteCustomerWallet(telegramId, body.address_id);
        return { ok: true };
      case "countTrades":
        return { count: countCustomerTrades(telegramId) };
      case "listWallets":
        return { wallets: listCustomerWallets(telegramId, body.asset, body.network) };
      case "saveWallet":
        return {
          wallet: saveCustomerWallet(telegramId, {
            asset: body.asset,
            network: body.network,
            address: body.address,
            label: body.label,
            makeDefault: body.makeDefault,
          }),
        };
      default:
        throw new ValidationError("Unsupported customer action");
    }
  });
}
