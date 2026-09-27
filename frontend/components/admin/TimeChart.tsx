"use client";

import { useState } from "react";

export type ChartSeries = { key: string; label: string; color: string };
export type ChartPoint = { date: string } & Record<string, number | string>;

const W = 720;
const H = 220;
const PAD = { top: 12, right: 12, bottom: 24, left: 44 };

function niceMax(v: number) {
  if (v <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(v));
  const n = v / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
}

const compact = new Intl.NumberFormat("en-US", { notation: "compact" });
const shortDate = (d: string) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
const shortHour = (d: string) =>
  new Date(`${d}Z`).toLocaleTimeString("en-US", {
    hour: "numeric",
    timeZone: "UTC",
  });

export default function TimeChart({
  title,
  data,
  series,
  kind,
  unit = "number",
  granularity = "day",
}: {
  title: string;
  data: ChartPoint[];
  series: ChartSeries[];
  kind: "bar" | "line";
  unit?: "number" | "usd";
  granularity?: "day" | "hour";
}) {
  const formatLabel = granularity === "hour" ? shortHour : shortDate;
  const format = (n: number) =>
    unit === "usd"
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: n >= 1000 ? 0 : 2,
        }).format(n)
      : n.toLocaleString("en-US");
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(
    Math.max(0, ...data.flatMap((p) => series.map((s) => Number(p[s.key])))),
  );
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const step = innerW / data.length;
  const x = (i: number) => PAD.left + step * i + step / 2;
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH;
  const ticks = [0, 0.5, 1].map((t) => t * max);
  const labelEvery = Math.ceil(data.length / 6);
  const empty = data.every((p) => series.every((s) => Number(p[s.key]) === 0));

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.floor((px - PAD.left) / step);
    setHover(i >= 0 && i < data.length ? i : null);
  }

  const point = hover !== null ? data[hover] : null;

  return (
    <figure className="viz relative rounded-2xl border border-line bg-white p-5">
      <figcaption className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="font-display text-sm font-semibold text-ink">
          {title}
        </span>
        {series.length > 1 && (
          <span className="flex gap-4 text-xs text-graphite">
            {series.map((s) => (
              <span key={s.key} className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-sm"
                  style={{ background: s.color }}
                />
                {s.label}
              </span>
            ))}
          </span>
        )}
      </figcaption>

      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={
            granularity === "hour"
              ? `${title}, last 24 hours`
              : `${title}, last ${data.length} days`
          }
          className="block w-full touch-none"
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y(t)}
                y2={y(t)}
                stroke="var(--color-line)"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 8}
                y={y(t) + 4}
                textAnchor="end"
                fontSize={11}
                fill="var(--color-graphite)"
              >
                {compact.format(t)}
              </text>
            </g>
          ))}
          {data.map(
            (p, i) =>
              i % labelEvery === 0 && (
                <text
                  key={p.date}
                  x={x(i)}
                  y={H - 6}
                  textAnchor="middle"
                  fontSize={11}
                  fill="var(--color-graphite)"
                >
                  {formatLabel(p.date)}
                </text>
              ),
          )}

          {hover !== null && (
            <rect
              x={x(hover) - step / 2}
              y={PAD.top}
              width={step}
              height={innerH}
              fill="var(--color-paper-dim)"
              opacity={0.7}
            />
          )}

          {kind === "bar" &&
            series.map((s) =>
              data.map((p, i) => {
                const v = Number(p[s.key]);
                if (v <= 0) return null;
                const bw = Math.max(1, Math.min(step - 2, 18));
                return (
                  <rect
                    key={`${s.key}${p.date}`}
                    x={x(i) - bw / 2}
                    y={y(v)}
                    width={bw}
                    height={PAD.top + innerH - y(v)}
                    rx={Math.min(4, bw / 2)}
                    fill={s.color}
                  />
                );
              }),
            )}

          {kind === "line" &&
            series.map((s) => (
              <g key={s.key}>
                <polyline
                  fill="none"
                  stroke={s.color}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  points={data.map((p, i) => `${x(i)},${y(Number(p[s.key]))}`).join(" ")}
                />
                {hover !== null && (
                  <circle
                    cx={x(hover)}
                    cy={y(Number(data[hover][s.key]))}
                    r={4}
                    fill={s.color}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                )}
              </g>
            ))}
        </svg>

        {empty && (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-graphite">
            No data in this period yet
          </p>
        )}

        {point && hover !== null && (
          <div
            className="pointer-events-none absolute top-2 z-10 min-w-36 rounded-lg border border-line bg-white px-3 py-2 text-xs shadow-md"
            style={{
              left: `${(x(hover) / W) * 100}%`,
              transform: `translateX(${hover > data.length / 2 ? "-105%" : "5%"})`,
            }}
          >
            <p className="mb-1 font-medium text-ink">
              {formatLabel(point.date)}
            </p>
            {series.map((s) => (
              <p key={s.key} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-graphite">
                  <span
                    className="inline-block h-2 w-2 rounded-sm"
                    style={{ background: s.color }}
                  />
                  {s.label}
                </span>
                <span className="font-medium text-ink">
                  {format(Number(point[s.key]))}
                </span>
              </p>
            ))}
          </div>
        )}
      </div>

      <details className="mt-3 text-xs text-graphite">
        <summary className="cursor-pointer select-none">View as table</summary>
        <div className="mt-2 max-h-48 overflow-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="py-1 pr-4 font-medium">Date</th>
                {series.map((s) => (
                  <th key={s.key} className="py-1 pr-4 font-medium">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.date} className="border-t border-line">
                  <td className="py-1 pr-4">{formatLabel(p.date)}</td>
                  {series.map((s) => (
                    <td key={s.key} className="py-1 pr-4">
                      {format(Number(p[s.key]))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
