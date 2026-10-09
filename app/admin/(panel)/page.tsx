import Link from "next/link";
import { Suspense } from "react";
import { postRatesNow } from "@/app/admin/actions";
import {
  getBotStatus,
  getBybitSystemStatus,
  getRateWorkerStatus,
  getRateChannelStatus,
  getRatesStatus,
  getTelegramStatus,
  type SystemState,
  type SystemStatus,
} from "@/backend/systemStatus";
import { requireAdmin } from "@/backend/auth";
import { getRateSeries, listRates } from "@/backend/repo";
import {
  getAssetBreakdown,
  daysSinceFirstRecord,
  getDailySeries,
  getHourlySeries,
  getOverview,
  getStatusBreakdown,
  listAccounts,
  listTrades,
  type Period,
} from "@/backend/stats";
import { money, naira, when } from "@/frontend/lib/format";
import TimeChart from "@/frontend/components/admin/TimeChart";
import PriceChart from "@/frontend/components/admin/PriceChart";
import Sparkline from "@/frontend/components/admin/Sparkline";
import PriceChange from "@/frontend/components/PriceChange";
import { getRateChange } from "@/backend/rates";
import { AutoRefresh } from "@/frontend/components/admin/ui";

export const dynamic = "force-dynamic";

const PERIODS: { key: Period; label: string }[] = [
  { key: "24h", label: "24hrs" },
  { key: "7d", label: "7d" },
  { key: "30d", label: "30d" },
  { key: "1y", label: "1year" },
  { key: "all", label: "All" },
];
const PERIOD_DAYS: Record<Exclude<Period, "24h" | "all">, number> = {
  "7d": 7,
  "30d": 30,
  "1y": 365,
};

const BLUE = "#2a78d6";
const ORANGE = "#eb6834";
// The dataviz skill's validated 8-slot categorical order (fixed, never
// cycled past 8) — reused as-is since it's already partly in use above.
const CATEGORICAL = [BLUE, ORANGE, "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"];
const STATUS_COLOR: Record<string, string> = {
  successful: "#0ca30c",
  processing: "#fab219",
  failed: "#d03b3b",
};
const STATUS_FALLBACK = "#58564d";

// Assigns each asset symbol a fixed categorical slot (every known asset
// first, in listing order) so an asset keeps its color in the volume-by-
// asset bar even as assets come and go from the period's trades.
function colorMapFor(knownSymbols: string[], extraSymbols: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  const ordered = [...knownSymbols, ...extraSymbols.filter((s) => !knownSymbols.includes(s))];
  ordered.forEach((s, i) => {
    map[s] = CATEGORICAL[i % CATEGORICAL.length];
  });
  return map;
}

function Tile({
  label,
  value,
  hint,
  trend,
}: {
  label: string;
  value: string;
  hint?: string;
  trend?: number[];
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <p className="text-xs uppercase tracking-wide text-graphite">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p className="font-display text-3xl font-semibold text-ink">{value}</p>
        {trend && <Sparkline values={trend} />}
      </div>
      {hint && <p className="mt-1 text-xs text-graphite">{hint}</p>}
    </div>
  );
}

function Breakdown({
  title,
  rows,
  format,
  colorFor,
}: {
  title: string;
  rows: { label: string; value: number }[];
  format: (n: number) => string;
  colorFor?: (label: string) => string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <p className="mb-4 font-display text-sm font-semibold text-ink">{title}</p>
      {rows.length === 0 ? (
        <p className="text-sm text-graphite">Nothing yet</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const color = colorFor ? colorFor(r.label) : BLUE;
            return (
              <li key={r.label}>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 capitalize text-ink">
                    <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                    {r.label}
                  </span>
                  <span className="text-graphite">{format(r.value)}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-paper-dim">
                  <div
                    className="h-2 rounded-full"
                    style={{ width: `${(r.value / max) * 100}%`, background: color }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// Part-to-whole, done as a single stacked bar rather than a donut/pie —
// same "at a glance" job without the donut's close-values misread risk,
// and it holds up past the ~6-segment ceiling a donut would hit here.
function StackedBar({
  title,
  rows,
  format,
  colorFor,
}: {
  title: string;
  rows: { label: string; value: number }[];
  format: (n: number) => string;
  colorFor: Record<string, string>;
}) {
  const total = rows.reduce((sum, r) => sum + r.value, 0);
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <p className="mb-4 font-display text-sm font-semibold text-ink">{title}</p>
      {rows.length === 0 || total === 0 ? (
        <p className="text-sm text-graphite">Nothing yet</p>
      ) : (
        <>
          <div
            className="flex h-4 w-full gap-0.5 overflow-hidden rounded-full bg-paper-dim"
            role="img"
            aria-label={`${title}: ${rows.map((r) => `${r.label} ${format(r.value)}`).join(", ")}`}
          >
            {rows.map((r) => (
              <div
                key={r.label}
                className="h-full"
                style={{ width: `${(r.value / total) * 100}%`, background: colorFor[r.label] }}
              />
            ))}
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
            {rows.map((r) => (
              <li key={r.label} className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ background: colorFor[r.label] }}
                />
                <span className="text-ink">{r.label}</span>
                <span className="ml-auto text-graphite">{format(r.value)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

// --- System status panel (backend/systemStatus.ts) ---------------------------
// One card per system trading depends on, all in the same three colours.
// The two live checks (Bybit, Telegram) stream in behind Suspense so a slow
// outside service never holds up the dashboard.

const SYSTEM_STATE_STYLE: Record<SystemState, { color: string; background: string }> = {
  online: { color: STATUS_COLOR.successful, background: "rgba(12,163,12,0.08)" },
  limited: { color: STATUS_COLOR.processing, background: "rgba(250,178,25,0.1)" },
  offline: { color: STATUS_COLOR.failed, background: "rgba(208,59,59,0.08)" },
};

// Tick = online, warning triangle = limited, cross = offline.
function SystemStateIcon({ state, color }: { state: SystemState; color: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="h-3.5 w-3.5 shrink-0">
      {state === "limited" ? (
        <>
          <path d="M8 1.8 15 14H1L8 1.8Z" fill={color} />
          <path d="M8 6v3.6M8 11.6v.1" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="8" cy="8" r="7" fill={color} />
          <path
            d={state === "online" ? "m4.8 8.2 2.1 2.1 4.3-4.5" : "m5.5 5.5 5 5m0-5-5 5"}
            stroke="white"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
}

function SystemCard({
  name,
  description,
  status,
  action,
}: {
  name: string;
  description: string;
  status: SystemStatus | null;
  action?: React.ReactNode;
}) {
  const style = status ? SYSTEM_STATE_STYLE[status.state] : null;
  return (
    <li className="rounded-xl border border-line px-4 py-3" title={description}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-ink">{name}</p>
        {status && style ? (
          <span
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ color: style.color, background: style.background }}
          >
            <SystemStateIcon state={status.state} color={style.color} />
            {status.label}
          </span>
        ) : (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ink/5 px-2 py-0.5 text-xs font-medium text-graphite">
            <span className="h-3.5 w-3.5 animate-pulse rounded-full bg-graphite/40" />
            checking…
          </span>
        )}
      </div>
      <p className="mt-1.5 text-xs leading-snug text-graphite">
        {status ? status.detail : description}
      </p>
      {action && <div className="mt-2">{action}</div>}
    </li>
  );
}

async function LiveSystemCard({
  name,
  description,
  load,
}: {
  name: string;
  description: string;
  load: () => Promise<SystemStatus>;
}) {
  return <SystemCard name={name} description={description} status={await load()} />;
}

function SystemStatusPanel() {
  const live = [
    { name: "Bybit API", description: "Market prices and P2P rates", load: getBybitSystemStatus },
    { name: "Telegram API", description: "Telegram reachable with the bot's token", load: getTelegramStatus },
  ];
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="font-display text-sm font-semibold text-ink">System status</p>
        <AutoRefresh seconds={60} />
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {live.map((s) => (
          <Suspense
            key={s.name}
            fallback={<SystemCard name={s.name} description={s.description} status={null} />}
          >
            <LiveSystemCard {...s} />
          </Suspense>
        ))}
        <SystemCard
          name="Telegram bot"
          description="The bot program answering customers"
          status={getBotStatus()}
        />
        <SystemCard
          name="Rate worker"
          description="Refreshes coin prices from Bybit every 10 minutes"
          status={getRateWorkerStatus()}
        />
        <SystemCard
          name="Live rates"
          description="Coins with a fresh rate the bot can quote"
          status={getRatesStatus()}
        />
        <SystemCard
          name="Rate channel"
          description="The rate-updates bot posting live rates to the Telegram channel"
          status={getRateChannelStatus()}
          action={
            <form action={postRatesNow}>
              <button className="rounded-full border border-line px-2.5 py-0.5 text-xs text-graphite transition-colors hover:border-ink hover:text-ink">
                Post rates now
              </button>
            </form>
          }
        />
      </ul>
    </div>
  );
}

// A scrolling tape of every active coin's current ORBITAL buy/sell rate —
// the same `ticker-track` animation as the website's Rates strip. The
// dashboard's AutoRefresh re-renders it every 60s, so it follows the rate
// worker and any manual change without a reload.
function RatesTicker() {
  const items = listRates().filter((a) => a.active && a.rate);
  if (items.length === 0) return null;
  // ~24h move of each coin's mid naira rate (backend/rates.ts getRateChange).
  const changes = new Map(items.map((a) => [a.symbol, getRateChange(a.rate!, "ngn")]));
  return (
    <div
      className="overflow-hidden rounded-2xl bg-[#0b1526]"
      role="marquee"
      aria-label={`Current rates: ${items
        .map((a) => `${a.symbol} buy ${naira(a.rate!.buy_rate)}, sell ${naira(a.rate!.sell_rate)}`)
        .join("; ")}`}
    >
      <div className="ticker-track flex w-max items-center gap-10 py-4" aria-hidden="true">
        {[...items, ...items, ...items, ...items].map((a, i) => (
          <span key={`${a.symbol}-${i}`} className="flex items-baseline gap-3 whitespace-nowrap px-2">
            <span className="font-display text-base font-semibold text-white">{a.symbol}</span>
            <PriceChange change={changes.get(a.symbol)} />
            <span className="text-xs text-white/50">Buy</span>
            <span className="font-display text-base tabular-nums text-accent">
              {naira(a.rate!.buy_rate)}
            </span>
            <span className="text-xs text-white/50">Sell</span>
            <span className="font-display text-base tabular-nums text-white/85">
              {naira(a.rate!.sell_rate)}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

function RatesSummary() {
  const rates = listRates().filter((a) => a.active);
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-display text-sm font-semibold text-ink">Assets &amp; rates</p>
        <Link href="/admin/rates" className="text-xs text-graphite hover:text-ink">
          Manage →
        </Link>
      </div>
      <ul className="grid gap-3 sm:grid-cols-3">
        {rates.map((a) => (
          <li key={a.symbol} className="rounded-xl border border-line px-3 py-2">
            <p className="text-sm text-ink">{a.symbol}</p>
            {a.rate ? (
              <p className="mt-1 text-xs text-graphite">
                Buy {naira(a.rate.buy_rate)} · Sell {naira(a.rate.sell_rate)}
                {a.rate.mode === "auto" ? " · auto" : ""}
              </p>
            ) : (
              <p className="mt-1 text-xs text-graphite">No rate set</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  await requireAdmin();
  const { range } = await searchParams;
  const period = PERIODS.some((p) => p.key === range) ? (range as Period) : "30d";
  const periodLabel = PERIODS.find((p) => p.key === period)!.label;
  // "in last 30d", but "all time" rather than "in last All".
  const periodPhrase = period === "all" ? "all time" : `in last ${periodLabel}`;
  const granularity = period === "24h" ? "hour" : "day";

  const o = getOverview(period);
  const series =
    period === "24h"
      ? getHourlySeries()
      : getDailySeries(period === "all" ? daysSinceFirstRecord() : PERIOD_DAYS[period]);
  const trades = listTrades(6);
  const accounts = listAccounts(6);
  const assetBreakdown = getAssetBreakdown(period);
  // Rate history is only kept for 7 days, so the longer ranges show the week.
  const usdtSeries = getRateSeries("USDT", period === "24h" ? "24h" : "7d");

  const allAssets = listRates();
  const colorFor = colorMapFor(
    allAssets.map((a) => a.symbol),
    assetBreakdown.map((r) => r.label),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Company overview</h1>
        </div>
        <div className="flex gap-1 rounded-full border border-line bg-white p-1 text-sm">
          {PERIODS.map((p) => (
            <Link
              key={p.key}
              href={`/admin?range=${p.key}`}
              className={`rounded-full px-3 py-1 ${
                p.key === period ? "bg-ink text-paper" : "text-graphite hover:text-ink"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      <SystemStatusPanel />

      <RatesTicker />

      <RatesSummary />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile
          label="Total accounts"
          value={o.totalAccounts.toLocaleString()}
          hint={`+${o.newAccounts} ${periodPhrase}`}
          trend={series.map((p) => p.accounts)}
        />
        <Tile
          label={`Trades (${periodLabel})`}
          value={o.periodTrades.toLocaleString()}
          hint={`${o.completedTrades} successful · ${o.pendingTrades} processing`}
          trend={series.map((p) => p.trades)}
        />
        <Tile
          label={`Completed volume (${periodLabel})`}
          value={money(o.volume)}
          trend={series.map((p) => p.volume)}
        />
        <Tile
          label="Telegram click rate"
          value={`${(o.clickRate * 100).toFixed(1)}%`}
          hint={`${o.telegramClicks} clicks from ${o.visits} visits`}
          trend={series.map((p) => p.telegramClicks)}
        />
      </section>

      {/* ORBITAL's own USDT/NGN rates over the period (from rate_ticks),
          buy and sell charted separately. */}
      <section className="grid gap-4 lg:grid-cols-2">
        <PriceChart
          title="USDT/NGN Buy"
          data={usdtSeries.map((p) => ({ time: p.time, close: p.buy }))}
          granularity={granularity}
        />
        <PriceChart
          title="USDT/NGN Sell"
          data={usdtSeries.map((p) => ({ time: p.time, close: p.sell }))}
          granularity={granularity}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <TimeChart
          title="Completed trade volume (USD)"
          kind="bar"
          data={series}
          series={[{ key: "volume", label: "Volume", color: BLUE }]}
          unit="usd"
          granularity={granularity}
        />
        <TimeChart
          title="New accounts"
          kind="bar"
          data={series}
          series={[{ key: "accounts", label: "New accounts", color: BLUE }]}
          granularity={granularity}
        />
        <TimeChart
          title="Trades created"
          kind="bar"
          data={series}
          series={[{ key: "trades", label: "Trades", color: BLUE }]}
          granularity={granularity}
        />
        <TimeChart
          title="Website traffic"
          kind="line"
          data={series}
          series={[
            { key: "visits", label: "Visits", color: BLUE },
            { key: "telegramClicks", label: "Telegram clicks", color: ORANGE },
          ]}
          granularity={granularity}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Breakdown
          title="Trades by status"
          rows={getStatusBreakdown(period)}
          format={(n) => n.toLocaleString()}
          colorFor={(label) => STATUS_COLOR[label] ?? STATUS_FALLBACK}
        />
        <StackedBar
          title="Completed volume by asset (₦)"
          rows={assetBreakdown}
          format={(n) => naira(n)}
          colorFor={colorFor}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-white p-5">
          <div className="mb-3 flex justify-between">
            <p className="font-display text-sm font-semibold text-ink">
              Recent trades
            </p>
            <Link href="/admin/trades" className="text-xs text-graphite hover:text-ink">
              View all →
            </Link>
          </div>
          {trades.length === 0 ? (
            <p className="text-sm text-graphite">No trades yet</p>
          ) : (
            <ul className="divide-y divide-line text-sm">
              {trades.map((t) => (
                <li key={t.id} className="flex justify-between gap-3 py-2">
                  <span className="text-ink">
                    {t.customer ?? "—"}{" "}
                    <span className="text-graphite">
                      {t.side} {t.amount} {t.asset}
                    </span>
                  </span>
                  <span className="shrink-0 text-graphite">
                    {money(t.fiat_amount, t.fiat_currency)} · {t.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-2xl border border-line bg-white p-5">
          <div className="mb-3 flex justify-between">
            <p className="font-display text-sm font-semibold text-ink">
              Newest accounts
            </p>
            <Link href="/admin/accounts" className="text-xs text-graphite hover:text-ink">
              View all →
            </Link>
          </div>
          {accounts.length === 0 ? (
            <p className="text-sm text-graphite">No accounts yet</p>
          ) : (
            <ul className="divide-y divide-line text-sm">
              {accounts.map((a) => (
                <li key={a.id} className="flex justify-between gap-3 py-2">
                  <span className="text-ink">
                    {a.full_name ?? a.username ?? a.telegram_id}
                  </span>
                  <span className="text-graphite">{when(a.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
