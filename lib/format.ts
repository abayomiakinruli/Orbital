export const money = (n: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: n >= 1000 ? 0 : 2,
  }).format(n);

export const naira = (n: number) =>
  `₦${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

// DB timestamps are UTC "YYYY-MM-DD HH:MM:SS".
export const when = (iso: string) =>
  new Date(`${iso.replace(" ", "T")}Z`).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export function ago(iso: string): string {
  const s = Math.max(
    0,
    (Date.now() - new Date(`${iso.replace(" ", "T")}Z`).getTime()) / 1000,
  );
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}
