import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/frontend/components/Navbar";
import Footer from "@/frontend/components/Footer";
import Reveal from "@/frontend/components/Reveal";
import { orbitalConfig } from "@/config/orbital";
import { BankIcon, PhoneIcon, ReceiptIcon, WalletIcon } from "@/frontend/components/Icons";

export const metadata: Metadata = {
  title: "Trade",
  description:
    "Get ready to trade BTC, USDT, USDC and SOL with ORBITAL, then continue to the official ORBITAL Telegram trading bot.",
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
            <div className="max-w-3xl">
              <Reveal>
                <p className="font-display text-xs font-medium tracking-[0.25em] text-paper/50 uppercase">
                  Trade
                </p>
              </Reveal>
              <Reveal delayMs={80}>
                <h1 className="mt-5 font-display text-5xl font-medium tracking-tight text-balance text-paper sm:text-6xl lg:text-7xl">
                  Ready to trade with ORBITAL?
                </h1>
              </Reveal>
              <Reveal delayMs={160}>
                <p className="mt-6 text-lg leading-relaxed text-paper/70">
                  Orders are placed on Telegram. Have these four things ready and your trade
                  goes through without back and forth.
                </p>
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
                      <p className="mt-2 text-base leading-relaxed text-paper/60">
                        {item.description}
                      </p>
                    </li>
                  </Reveal>
                ))}
              </ul>

              <Reveal delayMs={200}>
                <div className="flex h-full flex-col justify-between rounded-3xl border border-accent/30 bg-ink p-8 sm:p-10">
                  <div>
                    <p className="font-display text-xs tracking-[0.25em] text-paper/40 uppercase">
                      Official trading bot
                    </p>
                    <p className="mt-4 font-display text-3xl font-medium tracking-tight text-paper">
                      {orbitalConfig.telegramHandle}
                    </p>
                    <p className="mt-4 text-base leading-relaxed text-paper/60">
                      Always check the bot&apos;s username before you trade. ORBITAL will never
                      message you first asking for payment, and never trades from any other
                      account.
                    </p>
                  </div>
                  <div className="mt-10 flex flex-col gap-4">
                    <a
                      href={orbitalConfig.telegram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-full bg-accent px-8 py-4 text-sm font-medium text-accent-ink transition-colors hover:bg-white"
                    >
                      Continue to Telegram
                    </a>
                    <p className="text-center text-sm text-paper/50">
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
