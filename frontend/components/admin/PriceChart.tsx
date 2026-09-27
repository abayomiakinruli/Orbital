"use client";

import { useId, useState } from "react";
import type { Candle } from "@/backend/bybit";

// One rate series over time (e.g. ORBITAL's USDT/NGN buy rate from
// rate_ticks), styled after Apple's Stocks chart: the whole line takes the
// period's direction colour (green up / red down), a gradient fades out
// beneath it, a dotted line marks where the period opened, axis labels sit
// quietly on the right, and hovering scrubs the big header value to that
// moment.
const W = 720;
const H = 240;
const PAD = { top: 16, right: 64, bottom: 26, left: 4 };

// Status colours (good / critical) — direction is also spelled out with
// ▲/▼ and a signed %, never colour alone.
const UP = "#0ca30c";
const DOWN = "#d03b3b";

const naira = (n: number) =>
  `₦${n.toLocaleString("en-US", { maximumFractionDigits: n >= 1000 ? 0 : 2 })}`;
const nairaExact = (n: number) =>
  `₦${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const shortHour = (ms: number) =>
  new Date(ms).toLocaleTimeString("en-US", { hour: "numeric", timeZone: "UTC" });
const shortDate = (ms: number) =>
  new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const stamp = (ms: number) =>
  new Date(ms).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }) + " UTC";

export default function PriceChart({
  title,
  data,
  granularity,
}: {
  title: string;
  data: Candle[];
  granularity: "hour" | "day";
}) {
  const [hover, setHover] = useState<number | null>(null);
  const gradientId = useId();
  const formatLabel = granularity === "hour" ? shortHour : shortDate;

  if (data.length < 2) {
    return (
      <figure className="rounded-2xl border border-line bg-white p-5">
        <figcaption className="font-display text-sm font-semibold text-ink">{title}</figcaption>
        <p className="mt-3 text-sm text-graphite">
          Collecting rate history — this chart fills in as the rate worker refreshes (every 10
          minutes).
        </p>
      </figure>
    );
  }

  const closes = data.map((c) => c.close);
  const open = closes[0];
  const last = closes[closes.length - 1];
  const up = last >= open;
  const color = up ? UP : DOWN;

  // Scaled to the data's own range (plus headroom) so a rate that moves by
  // a fraction of a percent still reads as movement, not a flat line.
  const lo = Math.min(...closes);
  const hi = Math.max(...closes);
  const pad = Math.max((hi - lo) * 0.15, hi * 0.002);
  const floor = lo - pad;
  const ceil = hi + pad;

  const t0 = data[0].time;
  const t1 = data[data.length - 1].time;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (t: number) => PAD.left + ((t - t0) / Math.max(1, t1 - t0)) * innerW;
  const y = (v: number) => PAD.top + innerH - ((v - floor) / (ceil - floor)) * innerH;
  const yTicks = [0.15, 0.5, 0.85].map((f) => floor + f * (ceil - floor));
  const xTicks = Array.from({ length: 4 }, (_, i) => t0 + ((t1 - t0) * (i + 0.5)) / 4);

  const linePoints = data.map((c) => `${x(c.time)},${y(c.close)}`).join(" ");
  const areaPoints = `${x(t0)},${PAD.top + innerH} ${linePoints} ${x(t1)},${PAD.top + innerH}`;

  // Header follows the scrubbed point, like Stocks; otherwise the latest.
  const shown = hover !== null ? data[hover] : data[data.length - 1];
  const diff = shown.close - open;
  const pct = open > 0 ? (diff / open) * 100 : 0;
  const shownUp = diff >= 0;

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0;
    for (let i = 1; i < data.length; i++) {
      if (Math.abs(x(data[i].time) - px) < Math.abs(x(data[best].time) - px)) best = i;
    }
    setHover(best);
  }

  return (
    <figure className="viz rounded-2xl border border-line bg-white p-5">
      <figcaption>
        <p className="font-display text-sm font-semibold text-ink">{title}</p>
        <p className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink tabular-nums">
          {nairaExact(shown.close)}
        </p>
        <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2 text-sm tabular-nums">
          <span className="font-medium" style={{ color: shownUp ? UP : DOWN }}>
            {shownUp ? "▲" : "▼"} {shownUp ? "+" : "−"}
            {nairaExact(Math.abs(diff)).slice(1)} ({shownUp ? "+" : "−"}
            {Math.abs(pct).toFixed(2)}%)
          </span>
          <span className="text-graphite">
            {hover !== null ? stamp(shown.time) : `since ${stamp(t0)}`}
          </span>
        </p>
      </figcaption>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${title}, currently ${naira(last)}, ${up ? "up" : "down"} ${Math.abs(((last - open) / open) * 100).toFixed(2)}% over the period`}
        className="mt-3 block w-full touch-none"
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>

        {yTicks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={PAD.left + innerW}
              y1={y(t)}
              y2={y(t)}
              stroke="var(--color-line)"
              strokeWidth={1}
              opacity={0.6}
            />
            <text
              x={W - PAD.right + 8}
              y={y(t) + 4}
              fontSize={11}
              fill="var(--color-graphite)"
            >
              {naira(t)}
            </text>
          </g>
        ))}
        {xTicks.map((t) => (
          <text
            key={t}
            x={x(t)}
            y={H - 6}
            textAnchor="middle"
            fontSize={11}
            fill="var(--color-graphite)"
          >
            {formatLabel(t)}
          </text>
        ))}

        {/* Where the period opened — Stocks' "previous close" line. */}
        <line
          x1={PAD.left}
          x2={PAD.left + innerW}
          y1={y(open)}
          y2={y(open)}
          stroke="var(--color-graphite)"
          strokeWidth={1}
          strokeDasharray="2 4"
          opacity={0.7}
        />

        <polygon points={areaPoints} fill={`url(#${gradientId})`} />
        <polyline
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          points={linePoints}
        />

        {hover !== null ? (
          <>
            <line
              x1={x(data[hover].time)}
              x2={x(data[hover].time)}
              y1={PAD.top}
              y2={PAD.top + innerH}
              stroke="var(--color-graphite)"
              strokeWidth={1}
              opacity={0.5}
            />
            <circle
              cx={x(data[hover].time)}
              cy={y(data[hover].close)}
              r={5}
              fill={color}
              stroke="#fff"
              strokeWidth={2}
            />
          </>
        ) : (
          <circle cx={x(t1)} cy={y(last)} r={4} fill={color} stroke="#fff" strokeWidth={2} />
        )}
      </svg>
    </figure>
  );
}
