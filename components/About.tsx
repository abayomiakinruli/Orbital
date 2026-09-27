import SectionHeading from "@/components/SectionHeading";
import Reveal from "@/components/Reveal";
import { CheckIcon } from "@/components/Icons";

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
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1fr_1fr] lg:gap-8">
          <SectionHeading index="01" label="About ORBITAL" title="Crypto, without the guesswork.">
            <p>
              ORBITAL is a digital asset trading business for everyday users in Nigeria and
              beyond. We started with one idea: you should always know what you are trading,
              what it costs, and where your money is.
            </p>
            <p className="mt-4">
              So every order comes with an upfront rate, clear instructions and a record you
              can check at any time.
            </p>
          </SectionHeading>

          <div className="flex flex-col justify-center">
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {points.map((point, index) => (
                <Reveal key={point} delayMs={index * 80}>
                  <li className="flex h-full items-start gap-3 rounded-2xl bg-paper-dim p-5">
                    <CheckIcon className="h-6 w-6 shrink-0 text-[#1d8a55]" />
                    <span className="text-base leading-relaxed text-ink">{point}</span>
                  </li>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
