import SectionHeading from "@/frontend/components/SectionHeading";
import Reveal from "@/frontend/components/Reveal";
import { orbitalConfig } from "@/config/orbital";

// Answers reflect how the bot actually behaves (limits from backend/bot/index.ts,
// the seller rate lock from app/api/bot/quote/route.ts). Update both
// together. An accordion, so the section stays short until opened.
const faqs = [
  {
    q: "How do I start a trade?",
    a: "Tap Trade on this site, check what to have ready, then continue to our bot on Telegram. It walks you through choosing buy or sell, a coin and an amount.",
  },
  {
    q: "Which coins can I trade?",
    a: "Bitcoin (BTC), Tether (USDT), USD Coin (USDC) and Solana (SOL). More are on the roadmap.",
  },
  {
    q: "How is my rate worked out?",
    a: "Rates follow live market prices plus a small ORBITAL margin. The bot shows your exact rate and total before you confirm anything.",
  },
  {
    q: "What if the rate moves while I am sending crypto?",
    a: "When you sell, your rate is locked for 15 minutes once you see the deposit address. Send and tap “I've sent it” within that window and you receive the payout you were shown.",
  },
  {
    q: "Is there a limit on how much I can trade?",
    a: "The smallest trade is ₦5,000. There is no upper limit: trade as much as you need.",
  },
  {
    q: "How do I pay, and how do I get paid?",
    a: "When buying, you pay by bank transfer to the ORBITAL account the bot shows you. When selling, we pay naira into the bank account you give the bot.",
  },
  {
    q: "How will I know my trade is done?",
    a: "The bot messages you on Telegram as soon as your trade is completed. You can also enter your Transaction ID on our Track page at any time.",
  },
  {
    q: "How do I avoid scams?",
    a: `Only trade with ${orbitalConfig.telegramHandle} on Telegram and only contact support on ${orbitalConfig.whatsappDisplay}. ORBITAL will never message you first asking for payment, and never asks for your recovery phrase or private keys.`,
  },
];

export default function FAQ() {
  return (
    <section id="faq" className="py-28 sm:py-36">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 lg:grid-cols-[1fr_1.4fr] lg:gap-16 lg:px-10">
        <SectionHeading label="FAQ" title="Questions, answered.">
          <p>
            Something not covered here?{" "}
            <a href={orbitalConfig.supportPage} className="text-ink underline underline-offset-4 hover:text-[#1d8a55]">
              Ask our support team
            </a>
            .
          </p>
        </SectionHeading>

        <div className="divide-y divide-line border-y border-line">
          {faqs.map((item, i) => (
            <Reveal key={item.q} delayMs={i * 50}>
              <details className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-display text-lg font-medium tracking-tight text-ink [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span
                    aria-hidden="true"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-graphite transition-[transform,background-color,border-color,color] duration-300 group-hover:border-accent group-hover:text-[#1d8a55] group-open:rotate-45 group-open:border-accent group-open:bg-accent group-open:text-accent-ink"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-graphite">{item.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
