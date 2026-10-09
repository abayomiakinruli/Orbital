// Input checks for details customers type into the bot (backend/bot/index.ts),
// also applied by the backend when a trade is saved (backend/repo.ts), so a
// stray "(" or pasted sentence never becomes a payout name, bank account
// or wallet address. Pure functions with no imports: the bot loads this
// file directly, outside Next.js.

export type Check = { ok: true; value: string } | { ok: false; error: string };

const BASE58 = "[1-9A-HJ-NP-Za-km-z]";

export function checkPreferredName(input: string): Check {
  const value = input.trim().replace(/\s+/g, " ");
  if (!/^\p{L}[\p{L}\p{M} .'-]{0,59}$/u.test(value)) {
    return { ok: false, error: "Please send a name using letters, spaces, apostrophes, or hyphens (up to 60 characters)." };
  }
  return { ok: true, value };
}

type AddressKind = "bitcoin" | "evm" | "tron" | "solana" | "generic";

const ADDRESS_RULES: Record<AddressKind, { pattern: RegExp; hint: string }> = {
  bitcoin: {
    pattern: new RegExp(`^(bc1[ac-hj-np-z02-9]{11,71}|[13]${BASE58}{25,34})$`),
    hint: "A Bitcoin address starts with bc1, 1 or 3.",
  },
  evm: {
    pattern: /^0x[a-fA-F0-9]{40}$/,
    hint: "It should start with 0x followed by 40 letters and numbers.",
  },
  tron: {
    pattern: new RegExp(`^T${BASE58}{33}$`),
    hint: "A TRON (TRC20) address starts with T and is 34 characters long.",
  },
  solana: {
    pattern: new RegExp(`^${BASE58}{32,44}$`),
    hint: "A Solana address is 32 to 44 letters and numbers.",
  },
  generic: {
    pattern: /^[A-Za-z0-9]{20,100}$/,
    hint: "It should be letters and numbers only, with no spaces or symbols.",
  },
};

// The network names come from the admin (e.g. "TRON(TRC20)", "BSC(BEP20)");
// match on keywords, falling back to the asset when no network is set.
function addressKind(asset: string, network: string | null | undefined): AddressKind {
  const n = (network ?? "").toUpperCase();
  if (/TRC20|TRON/.test(n)) return "tron";
  if (/ERC20|BEP20|BSC|ETHEREUM|\bETH\b|POLYGON|MATIC|ARBITRUM|OPTIMISM|\bBASE\b|AVAX|AVALANCHE/.test(n)) return "evm";
  if (/SOLANA|\bSOL\b|SPL/.test(n)) return "solana";
  if (/BITCOIN|\bBTC\b/.test(n)) return "bitcoin";
  const a = asset.toUpperCase();
  if (a === "BTC") return "bitcoin";
  if (a === "SOL") return "solana";
  return "generic";
}

export function checkWalletAddress(asset: string, network: string | null | undefined, input: string): Check {
  let value = input.trim();
  // Bech32 is case-insensitive but conventionally lowercase.
  if (/^BC1/.test(value)) value = value.toLowerCase();
  const kind = addressKind(asset, network);
  const rule = ADDRESS_RULES[kind];
  if (!rule.pattern.test(value)) {
    const where = network ? ` on ${network}` : "";
    return {
      ok: false,
      error: `That doesn't look like a valid ${asset} address${where}. ${rule.hint} Please copy it again from your wallet and send it here.`,
    };
  }
  return { ok: true, value };
}

// Nigerian bank account numbers (NUBAN) are exactly 10 digits.
export function checkAccountNumber(input: string): Check {
  const value = input.replace(/[\s-]/g, "");
  if (!/^\d{10}$/.test(value)) {
    return { ok: false, error: "Please enter your 10 digit account number, numbers only." };
  }
  return { ok: true, value };
}

// Letters, spaces and the punctuation real names use (. ' - &); must
// start with a letter and contain at least two letters.
export function checkAccountName(input: string): Check {
  const value = input.trim().replace(/\s+/g, " ");
  if (!/^[A-Za-z][A-Za-z .'&-]{1,119}$/.test(value) || (value.match(/[A-Za-z]/g) ?? []).length < 2) {
    return {
      ok: false,
      error: "Please enter the account name exactly as your bank shows it, using letters and spaces only.",
    };
  }
  return { ok: true, value };
}

export function checkBankName(input: string): Check {
  const value = input.trim().replace(/\s+/g, " ");
  if (!/^[A-Za-z0-9][A-Za-z0-9 &.'-]{1,79}$/.test(value) || !/[A-Za-z]{2}/.test(value)) {
    return {
      ok: false,
      error: "Please enter your bank's name using letters, for example Access Bank or Opay.",
    };
  }
  return { ok: true, value };
}

// A coin amount: plain digits with an optional decimal point, up to 8
// decimal places. Rejects things Number() would accept, like "0x10" or "1e5".
export function checkCoinAmount(input: string): Check {
  const value = input.replace(/[,\s]/g, "");
  if (!/^\d+(\.\d{1,8})?$/.test(value) || Number(value) <= 0) {
    return { ok: false, error: "Please send the amount as a number, for example 0.005 or 250." };
  }
  return { ok: true, value };
}

export const TRANSACTION_ID_PATTERN = /^ORBT-\d{8}-[0-9A-F]{5}$/;

export function checkTransactionId(input: string): Check {
  const value = input.trim().toUpperCase();
  if (!TRANSACTION_ID_PATTERN.test(value)) {
    return {
      ok: false,
      error: "That doesn't look like an ORBITAL Transaction ID. It looks like ORBT-20260927-A1B2C.",
    };
  }
  return { ok: true, value };
}
