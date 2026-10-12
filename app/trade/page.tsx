import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/frontend/components/Navbar";
import Footer from "@/frontend/components/Footer";
import Reveal from "@/frontend/components/Reveal";
import { ReadyIllustration } from "@/frontend/components/Illustrations";
import TermsGateLink from "@/frontend/components/TermsGateLink";
import { orbitalConfig } from "@/config/orbital";
import { BankIcon, PhoneIcon, ReceiptIcon, WalletIcon } from "@/frontend/components/Icons";

export const metadata: Metadata = {
  title: "Trade",
  description:
    "Get ready to trade BTC, ETH, USDT, USDC and SOL with ORBITAL, then continue to the official ORBITAL Telegram trading bot.",
};

const checklist = [
  {
    Icon: PhoneIcon,
    title: "Have Telegram ready",
    description: "Install Telegram on your phone or computer and sign in.",
  },
  {
    Icon: WalletIcon,
    title: "Buying? Have your wallet address",
    description: "The bot will ask for the address you want your coins sent to, and the network it uses.",
  },
  {
    Icon: BankIcon,
    title: "Selling? Have your bank details",
    description: "The bot will ask for your account name, account number and bank so we can pay you.",
  },
  {
    Icon: ReceiptIcon,
    title: "Keep your Transaction ID",
    description: "The bot gives you one when you confirm. Use it on our Track page later.",
  },
];

export default function TradePage() {
  return (
    <>
      <Navbar />
      <main className="relative isolate">
        <section className="bg-charcoal pt-40 pb-28 sm:pt-48 sm:pb-36">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:gap-16">
              <div className="max-w-3xl">
                <Reveal>
                  <p className="font-display text-xs font-medium tracking-[0.25em] text-white uppercase">
                    Trade
                  </p>
                </Reveal>
                <Reveal delayMs={80}>
                  <h1 className="mt-5 font-display text-5xl font-medium tracking-tight text-balance text-paper sm:text-6xl lg:text-7xl">
                    Ready to trade with ORBITAL?
                  </h1>
                </Reveal>
                <Reveal delayMs={160}>
                  <p className="mt-6 text-lg leading-relaxed text-white">
                    Orders are placed on Telegram. Have these four things ready and your trade
                    goes through without back and forth.
                  </p>
                </Reveal>
              </div>

              <Reveal from="right" delayMs={200}>
                <ReadyIllustration className="mx-auto h-auto w-full max-w-sm" />
              </Reveal>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_1fr]">
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {checklist.map((item, i) => (
                  <Reveal key={item.title} delayMs={i * 70}>
                    <li className="flex h-full flex-col rounded-2xl border border-line-dark p-6">
                      <item.Icon className="h-7 w-7 text-accent" />
                      <h2 className="mt-4 font-display text-xl font-medium tracking-tight text-paper">
                        {item.title}
                      </h2>
                      <p className="mt-2 text-base leading-relaxed text-white">
                        {item.description}
                      </p>
                    </li>
                  </Reveal>
                ))}
              </ul>

              <Reveal delayMs={200}>
                <div className="flex h-full flex-col justify-between rounded-3xl border border-accent/30 bg-ink p-8 sm:p-10">
                  <div>
                    <p className="font-display text-xs tracking-[0.25em] text-white uppercase">
                      Official trading bot
                    </p>
                    <p className="mt-4 font-display text-3xl font-medium tracking-tight text-paper">
                      {orbitalConfig.telegramHandle}
                    </p>
                    <p className="mt-4 text-base leading-relaxed text-white">
                      Always check the bot&apos;s username before you trade. ORBITAL will never
                      message you first asking for payment, and never trades from any other
                      account.
                    </p>
                  </div>
                  <div className="mt-10 flex flex-col gap-4">
                    <TermsGateLink
                      href={orbitalConfig.telegram}
                      className="inline-flex items-center justify-center rounded-full bg-accent px-8 py-4 text-sm font-medium text-accent-ink transition-colors hover:bg-white"
                    >
                      Continue to Telegram
                    </TermsGateLink>
                    <p className="text-center text-sm text-white">
                      New here?{" "}
                      <Link href="/how-it-works" className="text-paper underline underline-offset-4 hover:text-accent">
                        See how it works
                      </Link>
                      {" "}or{" "}
                      <Link href={orbitalConfig.supportPage} className="text-paper underline underline-offset-4 hover:text-accent">
                        ask support
                      </Link>
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
