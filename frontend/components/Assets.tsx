"use client";

import SectionHeading from "@/frontend/components/SectionHeading";
import Reveal from "@/frontend/components/Reveal";
import { PayoutIllustration } from "@/frontend/components/Illustrations";
import PriceChange from "@/frontend/components/PriceChange";
import { orbitalConfig } from "@/config/orbital";
import { useLiveRates } from "@/frontend/lib/useLiveRates";
import type { PublicRates } from "@/backend/rates";

// ORBITAL's own rates — the ones set/refreshed in the admin panel and
// quoted by the bot — not a third-party market feed (kept fresh by
// frontend/lib/useLiveRates.ts).

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
  const { data } = useLiveRates(initialRates);

  // ORBITAL's rates are stored in naira; shown here in dollars, converted
  // at the USD/NGN reference. Without that reference there's no honest
  // conversion, so the asset rates are left out rather than guessed.
  const usdNgn = data.usdNgn;
  const tickerItems: TickerItem[] = usdNgn
    ? // One figure per asset: the middle of ORBITAL's buy and sell rates.
      // The USD/NGN reference itself is used for the conversion but not shown.
      data.rates.map((r) => ({
        key: r.symbol,
        code: r.symbol,
        value: dollars((r.buy + r.sell) / 2 / usdNgn),
        change: r.change,
      }))
    : [];

  return (
    <section id="assets" className="bg-white py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
          <SectionHeading
            label="Supported Assets"
            title="Four coins, with more on the way."
          >
            <p>
              Live ORBITAL rates in US dollars, refreshed through the day. The bot
              confirms your exact rate before you pay.
            </p>
          </SectionHeading>

          <Reveal from="right" delayMs={140}>
            <PayoutIllustration className="mx-auto h-auto w-full max-w-sm" />
          </Reveal>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {orbitalConfig.assets.map((asset, i) => (
            <Reveal key={asset.ticker} delayMs={i * 70}>
              <article className="flex h-full flex-col rounded-2xl card-lift border border-line bg-surface p-8 transition-colors duration-300 hover:border-ink">
                <span className="font-display text-sm font-medium text-[#1d8a55]">{asset.ticker}</span>
                <h3 className="mt-6 font-display text-2xl font-medium tracking-tight text-ink">
                  {asset.name}
                </h3>
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
              <p className="px-5 py-6 text-sm text-white">
                Rates are refreshing. The bot always has today&apos;s rate.
              </p>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
