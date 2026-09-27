import Link from "next/link";
import Reveal from "@/components/Reveal";
import { orbitalConfig } from "@/config/orbital";

const steps = [
  {
    index: "01",
    title: "Discover ORBITAL",
    description:
      "Browse this site to see what we trade, today's rates and the latest news.",
  },
  {
    index: "02",
    title: "Start a trade",
    description: "Tap Trade, check what to have ready, then continue to our bot on Telegram.",
  },
  {
    index: "03",
    title: "Buy or sell",
    description: "Tell the bot whether you want to buy or sell.",
  },
  {
    index: "04",
    title: "Choose your asset",
    description: "Pick the cryptocurrency you want to trade: BTC, USDT, USDC or SOL.",
  },
  {
    index: "05",
    title: "Get your rate",
    description:
      "Enter an amount and see your rate and total straight away. Rates follow live market data plus a small ORBITAL margin.",
  },
  {
    index: "06",
    title: "Complete the trade",
    description:
      "Confirm, follow the payment steps and we process your order. Keep the ID you receive to follow its progress.",
  },
];

// The body of the /how-it-works page — it opens the page, so it carries the
// page's h1 and the top padding that clears the fixed navbar.
export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-charcoal pt-40 pb-28 sm:pt-48 sm:pb-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="max-w-3xl">
          <Reveal>
            <p className="font-display text-xs font-medium tracking-[0.25em] text-paper/50 uppercase">
              How It Works
            </p>
          </Reveal>
          <Reveal delayMs={80}>
            <h1 className="mt-5 font-display text-5xl font-medium tracking-tight text-balance text-paper sm:text-6xl lg:text-7xl">
              From first look to finished trade.
            </h1>
          </Reveal>
          <Reveal delayMs={160}>
            <p className="mt-6 text-lg leading-relaxed text-paper/70">
              Six steps, start to finish. Stuck at any point? Our team is a
              message away.
            </p>
          </Reveal>
        </div>

        {/* A vertical timeline: the one list on the site where order matters,
            so the only one that keeps its numbers. */}
        <ol className="relative mt-16 max-w-3xl">
          <span aria-hidden="true" className="absolute top-2 bottom-2 left-6 w-px bg-linear-to-b from-accent via-accent/40 to-transparent" />
          {steps.map((step, i) => (
            <Reveal key={step.index} delayMs={i * 70}>
              <li className="group relative flex gap-6 pb-10 last:pb-0">
                <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-accent/50 bg-charcoal font-display text-sm text-accent transition-colors group-hover:bg-accent group-hover:text-accent-ink">
                  {step.index}
                </span>
                <div className="pt-2.5">
                  <h2 className="font-display text-2xl font-medium tracking-tight text-paper">
                    {step.title}
                  </h2>
                  <p className="mt-2 max-w-xl text-base leading-relaxed text-paper/60">{step.description}</p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>

        <Reveal delayMs={200}>
          <div className="mt-12 pl-18">
            <Link
              href={orbitalConfig.tradePage}
              className="inline-flex w-fit items-center justify-center rounded-full bg-accent px-7 py-3.5 text-sm font-medium text-accent-ink transition-colors hover:bg-white"
            >
              Start your first trade
            </Link>
          </div>
        </Reveal>

        <Reveal delayMs={240}>
          <div className="mt-16 grid grid-cols-1 gap-6 border-t border-line-dark pt-10 md:grid-cols-2">
            <p className="text-base leading-relaxed text-paper/60">
              <span className="font-medium text-paper">Already traded?</span> Check your
              transaction&apos;s status with the ID the bot gave you.{" "}
              <Link href="/track" className="border-b border-paper/40 pb-0.5 text-paper hover:border-accent hover:text-accent">
                Track your transaction
              </Link>
            </p>
            <p className="text-base leading-relaxed text-paper/60">
              <span className="font-medium text-paper">Need help?</span> Our support team is on
              WhatsApp for questions and transaction issues.{" "}
              <Link
                href={orbitalConfig.supportPage}
                className="border-b border-paper/40 pb-0.5 text-paper hover:border-accent hover:text-accent"
              >
                Contact support
              </Link>
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
