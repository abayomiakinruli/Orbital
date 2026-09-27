// Hero artwork: a thin trading/price-line stroke on the black hero — not
// the illustrated wavy bands + hexagon coins from the earlier reference
// screenshot. Sharp zig-zag segments (like a price chart), a marker at each
// point, and a live-pulsing dot at the tip.
//
// The headline and CTAs live in the left column (see Hero.tsx's grid), so
// the line stays clear of it — right column and top edge only.
// preserveAspectRatio="meet" is deliberate: "slice" would crop an unknown
// amount off the sides depending on the hero's runtime height. "meet" never
// crops; any letterboxed margin is invisible — it's the same black as the
// section behind it.

// Ascends left-to-right like a price climbing, with the small pullbacks
// real charts have, arcing around the ring visual rather than through it.
const points: [number, number][] = [
  [700, 620],
  [800, 560],
  [880, 590],
  [960, 470],
  [1060, 500],
  [1150, 340],
  [1230, 380],
  [1320, 200],
  [1400, 150],
];

const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
const [tipX, tipY] = points[points.length - 1];

export default function HeroBackground() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1440 700"
      preserveAspectRatio="xMidYMid meet"
      className="pointer-events-none absolute inset-0 hidden h-full w-full md:block"
    >
      {/* soft glow underlay, then the crisp line on top */}
      <path d={linePath} fill="none" stroke="var(--color-accent)" strokeWidth="7" opacity="0.18" strokeLinejoin="round" />
      <path d={linePath} fill="none" stroke="var(--color-accent)" strokeWidth="1.5" opacity="0.9" strokeLinejoin="round" />

      {points.slice(0, -1).map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="3" fill="var(--color-accent)" opacity="0.7" />
      ))}

      {/* live ticker point at the line's tip */}
      <g transform={`translate(${tipX} ${tipY})`}>
        <circle r="10" className="live-pulse" fill="var(--color-accent)" opacity="0.6" />
        <circle r="4.5" fill="var(--color-accent)" stroke="#ffffff" strokeWidth="1.5" />
      </g>
    </svg>
  );
}
