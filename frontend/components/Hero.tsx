import { orbitalConfig } from "@/config/orbital";
import Link from "next/link";
import OrbitalVisual from "@/frontend/components/OrbitalVisual";
import HeroBackground from "@/frontend/components/HeroBackground";

export default function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden bg-space pt-40 pb-24 sm:pt-48 sm:pb-32"
    >
      {/* Soft brand-green glow behind the ring, standing in for the
          launch-photo backdrop a real rocket site would use here. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 65% at 78% 45%, rgba(52,187,120,0.28), transparent 70%)",
        }}
      />

      <HeroBackground />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8 lg:px-10">
        <div>
          <div className="hero-fade" style={{ animationDelay: "0ms" }}>
            <p className="font-display text-xs font-medium tracking-[0.3em] text-white uppercase">
              Digital Asset Trading
            </p>
          </div>

          <h1 className="mt-6 font-display font-medium text-paper leading-[0.94] text-[clamp(3rem,10vw,7.5rem)] tracking-tight">
            <span className="hero-fade block" style={{ animationDelay: "80ms" }}>
              TRADE
            </span>
            <span className="hero-fade block" style={{ animationDelay: "180ms" }}>
              BEYOND
            </span>
            <span className="hero-fade block" style={{ animationDelay: "280ms" }}>
              BORDERS.
            </span>
          </h1>

          <div className="hero-fade mt-8 max-w-md" style={{ animationDelay: "420ms" }}>
            <p className="text-lg leading-relaxed text-white">
              Buy and sell BTC, ETH, USDT, USDC and SOL at clear naira rates, through a
              fast Telegram bot, with real people on WhatsApp behind it.
            </p>
          </div>

          <div
            className="hero-fade mt-10 flex flex-col gap-4 sm:flex-row sm:items-center"
            style={{ animationDelay: "540ms" }}
          >
            <Link
              href={orbitalConfig.tradePage}
              className="inline-flex items-center justify-center rounded-full bg-accent px-7 py-3.5 text-sm font-medium text-accent-ink transition-colors hover:bg-white"
            >
              Trade with ORBITAL
            </Link>
            <a
              href="#about"
              className="inline-flex items-center justify-center rounded-full border border-line-dark px-7 py-3.5 text-sm font-medium text-paper transition-colors hover:border-paper hover:bg-paper hover:text-ink"
            >
              Discover ORBITAL
            </a>
          </div>
        </div>

        <div className="hero-fade" style={{ animationDelay: "300ms" }}>
          <OrbitalVisual />
        </div>
      </div>
    </section>
  );
}
