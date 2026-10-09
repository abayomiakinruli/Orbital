import SectionHeading from "@/frontend/components/SectionHeading";
import Reveal from "@/frontend/components/Reveal";
import { CheckIcon } from "@/frontend/components/Icons";
import { TradeIllustration } from "@/frontend/components/Illustrations";

const points = [
  "Your rate is shown before you commit",
  "Every trade gets its own Transaction ID",
  "Naira payouts go straight to your bank account",
  "A real person answers on WhatsApp",
];

export default function About() {
  return (
    <section id="about" className="py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        {/* Illustration on the left, text on the right; on phones the text
            comes first and the illustration follows. */}
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div className="lg:order-2">
            <SectionHeading label="About ORBITAL" title="Crypto, without the guesswork.">
              <p>
                ORBITAL is a digital asset trading business for everyday users in Nigeria and
                beyond. We started with one idea: you should always know what you are trading,
                what it costs, and where your money is.
              </p>
            </SectionHeading>

            <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {points.map((point, index) => (
                <Reveal key={point} delayMs={index * 70}>
                  <li className="flex h-full items-start gap-3 rounded-2xl card-lift border border-line bg-surface p-5">
                    <CheckIcon className="pop h-6 w-6 shrink-0 text-[#1d8a55]" />
                    <span className="text-base leading-relaxed text-ink">{point}</span>
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
