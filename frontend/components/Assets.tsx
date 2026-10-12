"use client";

import SectionHeading from "@/frontend/components/SectionHeading";
import Reveal from "@/frontend/components/Reveal";
import { PayoutIllustration } from "@/frontend/components/Illustrations";
import PriceChange from "@/frontend/components/PriceChange";
import { orbitalConfig } from "@/config/orbital";
import { useGlobalMarket } from "@/frontend/lib/useGlobalMarket";
import type { GlobalMarket, MarketCoin } from "@/backend/market";

// Two different things live in this section. The cards are the coins ORBITAL
// trades (config/orbital.ts). The ticker underneath is the wider market: the
// top 20 coins by market cap (backend/market.ts), shown for reference only.
// Being in the ticker does not make a coin tradable here, and its prices are
// not ORBITAL's rates, which only the bot quotes.

// Enough decimals for the size of the price: $83,429.10, $0.3317, $0.00000544.
function usd(price: number) {
  const digits =
    price >= 1
      ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
      : { maximumSignificantDigits: 4 };
  return `$${price.toLocaleString("en-US", digits)}`;
}

// A clock whose hand keeps sweeping round — a quiet "this is live" cue.
function LiveClock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 shrink-0 text-accent" aria-hidden="true">
      <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="1.25" fill="currentColor" />
      <g className="clock-hand">
        <path d="M12 12V6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </g>
    </svg>
  );
}

// One pass of the tape. It is rendered twice so the scroll can loop without a
// gap; the second pass is hidden from screen readers.
function TickerList({ coins, copy = false }: { coins: MarketCoin[]; copy?: boolean }) {
  return (
    <ul
      className={`flex shrink-0 items-center gap-12 pr-12 ${copy ? "ticker-copy" : ""}`}
      aria-hidden={copy || undefined}
    >
      {coins.map((coin) => (
        <li key={coin.id} className="flex items-baseline gap-3 whitespace-nowrap px-2">
          <span className="font-display text-lg font-medium tracking-tight text-paper" title={coin.name}>
            {coin.symbol}
          </span>
          {coin.change24h === null ? (
            <span className="text-sm text-white" title="24-hour change unavailable">
              –
            </span>
          ) : (
            <PriceChange change={coin.change24h} />
          )}
          <span className="font-display text-lg tabular-nums text-accent">
            {coin.price === null ? "Price unavailable" : usd(coin.price)}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function Assets({ initialMarket }: { initialMarket: GlobalMarket }) {
  const { coins, stale, failed } = useGlobalMarket(initialMarket);

  return (
    <section id="assets" className="bg-white py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
          <SectionHeading
            label="Supported Assets"
            title="Five assets to start. More opportunities ahead."
          >
            <p>
              Explore the crypto market with ORBITAL. We currently support BTC, ETH, USDT, USDC,
              and SOL, with more digital assets planned for the future. Trade with clear rates,
              transparent transactions, and support when you need it.
            </p>
          </SectionHeading>

          <Reveal from="right" delayMs={140}>
            <PayoutIllustration className="mx-auto h-auto w-full max-w-sm" />
          </Reveal>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {orbitalConfig.assets.map((asset, i) => (
            <Reveal key={asset.ticker} delayMs={i * 70}>
              <article className="flex h-full flex-col rounded-2xl card-lift border border-line bg-surface p-8 transition-colors duration-300 hover:border-ink lg:p-6 xl:p-8">
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
            <div className="flex shrink-0 items-center gap-3 border-r border-line-dark px-5">
              <LiveClock />
              <span className="hidden font-display text-xs font-medium tracking-[0.2em] text-white uppercase sm:block">
                Global market
              </span>
            </div>
            {coins.length > 0 ? (
              <div
                className="ticker-viewport min-w-0 flex-1 overflow-hidden"
                role="region"
                aria-label="Global crypto market: top 20 coins by market cap, prices in US dollars"
                tabIndex={0}
              >
                <div className="ticker-track flex w-max py-6 pl-6">
                  <TickerList coins={coins} />
                  <TickerList coins={coins} copy />
                </div>
              </div>
            ) : (
              <p className="px-5 py-6 text-sm text-white" role="status">
                {failed
                  ? "Market prices are unavailable right now."
                  : "Loading market prices…"}
              </p>
            )}
          </div>
          {coins.length > 0 && (stale || failed) ? (
            <p className="mt-3 text-sm leading-relaxed text-graphite">
              
            </p>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}
