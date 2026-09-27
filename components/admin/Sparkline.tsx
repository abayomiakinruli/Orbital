const W = 64;
const H = 20;

// Decorative trend indicator inside a stat tile — no axes, no interactivity,
// per the stat-tile figure spec (value + optional sparkline in the
// de-emphasis hue).
export default function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2 || values.every((v) => v === values[0])) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = W / (values.length - 1);
  const points = values
    .map((v, i) => `${i * step},${H - ((v - min) / range) * H}`)
    .join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-5 w-16 shrink-0" aria-hidden="true">
      <polyline
        fill="none"
        stroke="var(--color-graphite)"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  );
}
