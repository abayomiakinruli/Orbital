import { dbTime, naira } from "@/shared/format";

export { naira };

export const money = (n: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: n >= 1000 ? 0 : 2,
  }).format(n);

// For large figures where kobo is noise: whole naira from ₦1,000 up.
export const nairaShort = (n: number) =>
  `₦${n.toLocaleString("en-US", { maximumFractionDigits: n >= 1000 ? 0 : 2 })}`;

// DB timestamps are UTC "YYYY-MM-DD HH:MM:SS".
export const when = (iso: string) =>
  new Date(dbTime(iso)).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export function ago(iso: string): string {
  const s = Math.max(
    0,
    (Date.now() - dbTime(iso)) / 1000,
  );
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}
