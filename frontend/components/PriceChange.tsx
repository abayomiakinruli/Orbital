// Direction indicator for the rate tickers: arrow + signed percentage, so
// direction never depends on colour alone. `change` is the ~24h % move
// (see backend/rates.ts getRateChange).
export default function PriceChange({ change }: { change: number | null | undefined }) {
  if (change === null || change === undefined) return null;
  const flat = Math.abs(change) < 0.005;
  const up = change > 0;
  const label = `${flat ? "" : up ? "+" : "−"}${Math.abs(change).toFixed(2)}%`;
  return (
    <span
      className={`inline-flex items-center gap-1 text-sm tabular-nums ${
        flat ? "text-paper/60" : up ? "text-accent" : "text-[#e66767]"
      }`}
      title="Change over the last 24 hours"
    >
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
        {flat ? (
          <rect x="1" y="4" width="8" height="2" rx="1" fill="currentColor" />
        ) : up ? (
          <path d="M5 1 9.5 9h-9z" fill="currentColor" />
        ) : (
          <path d="M5 9 .5 1h9z" fill="currentColor" />
        )}
      </svg>
      <span className="sr-only">{flat ? "Unchanged" : up ? "Up" : "Down"}</span>
      {label}
    </span>
  );
}
