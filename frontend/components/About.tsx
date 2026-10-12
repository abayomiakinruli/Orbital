import SectionHeading from "@/frontend/components/SectionHeading";
import Reveal from "@/frontend/components/Reveal";
import { CheckIcon } from "@/frontend/components/Icons";
import { TradeIllustration } from "@/frontend/components/Illustrations";

const points = [
  {
    title: "Know your rate upfront",
    description: "See your exchange rate before confirming your trade.",
  },
  {
    title: "Every trade is traceable",
    description: "Receive a unique transaction ID to help you track your trade.",
  },
  {
    title: "Straightforward naira payouts",
    description:
      "Receive naira payments directly into your designated bank account when your sell transaction is completed.",
  },
  {
    title: "Real people. Direct support.",
    description: "Get assistance from our team through WhatsApp whenever you need help.",
  },
];

export default function About() {
  return (
    <section id="about" className="py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        {/* Illustration on the left, text on the right; on phones the text
            comes first and the illustration follows. */}
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div className="lg:order-2">
            <SectionHeading label="About ORBITAL" title="Crypto trading, made clearer.">
              <p>
                ORBITAL is a digital asset trading brand built around clarity, transparency, and
                human support. We&rsquo;re making crypto trading simpler by helping you understand
                your rates, track your transactions, and know what to expect at every step with
                support that keeps you connected.
              </p>
            </SectionHeading>

            <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {points.map((point, index) => (
                <Reveal key={point.title} delayMs={index * 70}>
                  <li className="flex h-full items-start gap-3 rounded-2xl card-lift border border-line bg-surface p-5">
                    <CheckIcon className="pop h-6 w-6 shrink-0 text-[#1d8a55]" />
                    <div className="min-w-0">
                      <h3 className="text-base font-medium leading-snug text-ink">{point.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-graphite">
                        {point.description}
                      </p>
                    </div>
                  </li>
                </Reveal>
              ))}
            </ul>
          </div>

          <Reveal from="left" className="lg:order-1">
            <TradeIllustration className="mx-auto h-auto w-full max-w-md" />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
