import Link from "next/link";
import SectionHeading from "@/components/SectionHeading";
import Reveal from "@/components/Reveal";
import { orbitalConfig } from "@/config/orbital";
import { ChatIcon, GlobeIcon, SendIcon } from "@/components/Icons";

const cards = [
  {
    Icon: SendIcon,
    title: "Trade on Telegram.",
    description:
      "Pick buy or sell, choose a coin and enter an amount. The bot shows your rate and total before anything is confirmed.",
    ctaLabel: "Start a trade",
    href: orbitalConfig.tradePage,
  },
  {
    Icon: ChatIcon,
    title: "Get support on WhatsApp.",
    description:
      "A question, a trade that needs attention, or details to double check: message the team and a person replies.",
    ctaLabel: "Get support",
    href: orbitalConfig.supportPage,
  },
  {
    Icon: GlobeIcon,
    title: "Learn about ORBITAL.",
    description:
      "Live rates, news, trade tracking and our official links, gathered in one place.",
    ctaLabel: "See how it works →",
    href: "/how-it-works",
  },
];

export default function Services() {
  return (
    <section id="what-we-do" className="bg-paper-dim py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <SectionHeading index="02" label="What We Do" title="Trading on Telegram. Support on WhatsApp.">
          <p>
            Each channel has one job, so you always know where to go: one for trading,
            one for talking to us, and this site for everything else.
          </p>
        </SectionHeading>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {cards.map((card, i) => {
            const external = card.href.startsWith("http");
            return (
              <Reveal key={card.title} delayMs={i * 100}>
                <article className="group flex h-full flex-col justify-between rounded-2xl border border-line bg-paper p-8 transition-colors duration-300 hover:border-ink">
                  <div>
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink text-accent">
                      <card.Icon />
                    </span>
                    <h3 className="mt-6 font-display text-2xl font-medium tracking-tight text-ink">
                      {card.title}
                    </h3>
                    <p className="mt-4 text-base leading-relaxed text-graphite">
                      {card.description}
                    </p>
                  </div>
                  <Link
                    href={card.href}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noopener noreferrer" : undefined}
                    className="mt-8 inline-flex w-fit items-center gap-2 text-sm font-medium text-ink transition-colors group-hover:text-graphite"
                  >
                    <span className="border-b border-ink pb-0.5 transition-colors group-hover:border-graphite">
                      {card.ctaLabel}
                    </span>
                  </Link>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
