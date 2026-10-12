import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/frontend/components/Navbar";
import Footer from "@/frontend/components/Footer";
import { SupportIllustration } from "@/frontend/components/Illustrations";
import Reveal from "@/frontend/components/Reveal";
import { ChatIcon, CheckIcon, ReceiptIcon, SparkIcon } from "@/frontend/components/Icons";
import { orbitalConfig, supportChoices } from "@/config/orbital";

export const metadata: Metadata = {
  title: "Support",
  description:
    "Get help from ORBITAL customer support on WhatsApp: questions, transaction issues and confirming information.",
};

const topics = [
  {
    Icon: SparkIcon,
    title: "Questions about trading",
    description: "How ORBITAL works, which coins we handle, rates and what to expect.",
  },
  {
    Icon: ReceiptIcon,
    title: "A transaction that needs attention",
    description: "An order taking longer than expected or not going as planned.",
  },
  {
    Icon: CheckIcon,
    title: "Confirming information",
    description: "Double check payment details or an address before you send anything.",
  },
  {
    Icon: ChatIcon,
    title: "Anything else",
    description: "If it concerns ORBITAL, our team is happy to hear from you.",
  },
];

// Unlike the Trade and How It Works pages, only a short dark band sits
// under the navbar here; the content itself is on the light page colour.
export default function SupportPage() {
  return (
    <>
      <Navbar />
      <main className="relative isolate">
        <section className="bg-charcoal pt-40 pb-16 sm:pt-48 sm:pb-20">
          <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-6 lg:grid-cols-[1.3fr_0.7fr] lg:gap-16 lg:px-10">
            <div>
              <Reveal>
                <p className="font-display text-xs font-medium tracking-[0.25em] text-white uppercase">
                  Support
                </p>
              </Reveal>
              <Reveal delayMs={80}>
                <h1 className="mt-5 max-w-3xl font-display text-5xl font-medium tracking-tight text-balance text-paper sm:text-6xl lg:text-7xl">
                  How can we help?
                </h1>
              </Reveal>
            </div>

            <Reveal from="right" delayMs={160}>
              <SupportIllustration className="mx-auto h-auto w-full max-w-sm" />
            </Reveal>
          </div>
        </section>

        <section className="bg-white py-20 sm:py-28">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 lg:grid-cols-[1.3fr_1fr] lg:px-10">
            <div>
              <Reveal>
                <p className="max-w-2xl text-lg leading-relaxed text-graphite">
                  Our support team works on WhatsApp. Choose what you need help with and
                  WhatsApp opens with your message ready to send.
                </p>
              </Reveal>
              <ul className="mt-10 divide-y divide-line border-y border-line">
                {topics.map((item, i) => (
                  <Reveal key={item.title} delayMs={i * 70}>
                    <li className="flex items-start gap-5 py-6">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-paper-dim text-[#1d8a55]">
                        <item.Icon />
                      </span>
                      <div>
                        <h2 className="font-display text-xl font-medium tracking-tight text-ink">
                          {item.title}
                        </h2>
                        <p className="mt-1 text-base leading-relaxed text-graphite">{item.description}</p>
                      </div>
                    </li>
                  </Reveal>
                ))}
              </ul>
              <Reveal delayMs={280}>
                <p className="mt-8 text-base leading-relaxed text-graphite">
                  <span className="font-medium text-ink">About an order?</span> Have its ID
                  ready so we can find it quickly, or{" "}
                  <Link href="/track" className="text-ink underline underline-offset-4 hover:text-[#1d8a55]">
                    check its status yourself
                  </Link>
                  .
                </p>
              </Reveal>
            </div>

            <Reveal delayMs={160}>
              <div className="flex h-full flex-col justify-between rounded-3xl bg-ink p-8 sm:p-10 lg:sticky lg:top-28 lg:h-auto">
                <div>
                  <p className="font-display text-xs tracking-[0.25em] text-white uppercase">
                    WhatsApp support
                  </p>
                  <p className="mt-4 font-display text-3xl font-medium tracking-tight text-paper">
                    Chat with our team.
                  </p>
                  <p className="mt-4 text-base leading-relaxed text-white">
                    What do you need help with? Pick one and WhatsApp opens with your message
                    already written.
                  </p>
                </div>
                <div className="mt-8 flex flex-col gap-4">
                  {/* Each choice opens WhatsApp with a matching message drafted. */}
                  <ul className="flex flex-col gap-3">
                    {supportChoices.map((choice) => (
                      <li key={choice.label}>
                        <a
                          href={choice.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between gap-4 rounded-2xl border border-line-dark px-5 py-4 text-base font-medium text-paper transition-colors hover:border-accent hover:bg-accent hover:text-accent-ink"
                        >
                          {choice.label}
                          <span aria-hidden="true">→</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm leading-relaxed text-white">
                    We will never ask for your recovery phrase, private keys or passwords. Anyone
                    who does is not ORBITAL.
                  </p>
                  <p className="text-center text-sm text-white">
                    Ready to trade instead?{" "}
                    <Link href={orbitalConfig.tradePage} className="text-paper underline underline-offset-4 hover:text-accent">
                      Go to Trade
                    </Link>
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
