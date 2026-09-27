"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SectionHeading from "@/frontend/components/SectionHeading";
import Reveal from "@/frontend/components/Reveal";
import PriceChange from "@/frontend/components/PriceChange";
import { orbitalConfig } from "@/config/orbital";
import type { PublicRates } from "@/backend/rates";

// ORBITAL's own rates — the ones set/refreshed in the admin panel and
// quoted by the bot — not a third-party market feed. Rendered on the server
// first, then re-polled so an open page keeps up with the rate worker.
const REFRESH_MS = 60_000;

function naira(value: number) {
  return `₦${value.toLocaleString("en-US", {
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  })}`;
}

function dollars(value: number) {
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// A clock whose hand keeps sweeping round — a quiet "this is live" cue.
function LiveClock() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-6 w-6 text-accent"
      role="img"
      aria-label="Live rates, updated automatically"
    >
      <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="1.25" fill="currentColor" />
      <g className="clock-hand">
        <path d="M12 12V6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </g>
    </svg>
  );
}

type TickerItem = { key: string; code: string; value: string; change?: number | null };

export default function Assets({ initialRates }: { initialRates: PublicRates }) {
  const [data, setData] = useState(initialRates);

  useEffect(() => {
    let cancelled = false;
    const id = setInterval(async () => {
      try {
        const res = await fetch("/api/rates", { cache: "no-store" });
        if (!res.ok) return;
        const next = (await res.json()) as PublicRates;
        if (!cancelled) setData(next);
      } catch {
        // Keep showing the last good rates on a failed refresh.
      }
    }, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // ORBITAL's rates are stored in naira; shown here in dollars, converted
  // at the USD/NGN reference. Without that reference there's no honest
  // conversion, so the asset rates are left out rather than guessed.
  const usdNgn = data.usdNgn;
  const tickerItems: TickerItem[] = usdNgn
    ? [
        { key: "USDNGN", code: "USD/NGN", value: naira(usdNgn) },
        // One figure per asset: the middle of ORBITAL's buy and sell rates.
        ...data.rates.map((r) => ({
          key: r.symbol,
          code: r.symbol,
          value: dollars((r.buy + r.sell) / 2 / usdNgn),
          change: r.change,
        })),
      ]
    : [];

  return (
    <section id="assets" className="bg-paper-dim py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <SectionHeading
          index="05"
          label="Supported Assets"
          title="Four coins, with more on the way."
        >
          <p>
            Live ORBITAL rates in US dollars, refreshed through the day. The bot
            confirms your exact rate before you pay.
          </p>
        </SectionHeading>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {orbitalConfig.assets.map((asset, i) => (
            <Reveal key={asset.ticker} delayMs={i * 80}>
              <article className="flex h-full flex-col rounded-2xl border border-line bg-paper p-8 transition-colors duration-300 hover:border-ink">
                <span className="font-display text-sm text-graphite">{asset.ticker}</span>
                <h3 className="mt-6 font-display text-2xl font-medium tracking-tight text-ink">
                  {asset.name}
                </h3>
                <p className="mt-4 text-base leading-relaxed text-graphite">{asset.description}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delayMs={160}>
          <div className="mt-8 flex items-stretch overflow-hidden rounded-2xl border border-line bg-charcoal">
            <div className="flex shrink-0 items-center border-r border-line-dark px-5">
              <LiveClock />
            </div>
            {tickerItems.length > 0 ? (
              <div className="min-w-0 flex-1 overflow-hidden">
                <div className="ticker-track flex w-max items-center gap-12 py-6">
                  {[...tickerItems, ...tickerItems, ...tickerItems, ...tickerItems].map(
                    (item, i) => (
                      <span
                        key={`${item.key}-${i}`}
                        className="flex items-baseline gap-3 whitespace-nowrap px-2"
                      >
                        <span className="font-display text-lg font-medium tracking-tight text-paper">
                          {item.code}
                        </span>
                        <PriceChange change={item.change} />
                        <span className="font-display text-lg tabular-nums text-accent">
                          {item.value}
                        </span>
                      </span>
                    ),
                  )}
                </div>
              </div>
            ) : (
              <p className="px-5 py-6 text-sm text-paper/60">
                Rates are refreshing. The bot always has today&apos;s rate.
              </p>
            )}
          </div>
        </Reveal>

        <Reveal delayMs={220}>
          <div className="mt-8">
            <Link
              href={orbitalConfig.tradePage}
              className="inline-flex items-center justify-center rounded-full bg-ink px-7 py-3.5 text-sm font-medium text-paper transition-colors hover:bg-accent hover:text-accent-ink"
            >
              Trade with ORBITAL
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
