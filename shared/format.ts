// Small pure helpers used on both sides of the frontend/backend boundary
// (eslint.config.mjs keeps those two from importing each other, so anything
// both need lives here, next to config/).

// The database stores timestamps as UTC "YYYY-MM-DD HH:MM:SS" (SQLite's
// datetime('now')). This turns one into epoch milliseconds.
export const dbTime = (value: string) => new Date(`${value.replace(" ", "T")}Z`).getTime();

// ₦1,375.73: naira with up to two decimals.
export const naira = (n: number) => `₦${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
