import SectionHeading from "@/components/SectionHeading";
import Reveal from "@/components/Reveal";
import { EyeIcon, GlobeIcon, PulseIcon, RocketIcon, ShieldIcon, SparkIcon } from "@/components/Icons";

const rows = [
  {
    Icon: EyeIcon,
    title: "Transparency",
    description: "You should always understand the rate and the transaction you are receiving.",
  },
  {
    Icon: SparkIcon,
    title: "Simplicity",
    description: "Trading should be easy to understand and easy to navigate.",
  },
  {
    Icon: GlobeIcon,
    title: "Accessibility",
    description: "Trade and get help through apps you already use every day.",
  },
  {
    Icon: ShieldIcon,
    title: "Security",
    description:
      "Careful security procedures, clear transaction instructions and customer verification where appropriate.",
  },
  {
    Icon: PulseIcon,
    title: "Reliability",
    description: "Consistent access to our trading services and support channels.",
  },
  {
    Icon: RocketIcon,
    title: "Innovation",
    description: "We keep improving our technology as the digital asset industry evolves.",
  },
];

export default function WhyOrbital() {
  return (
    <section id="why-orbital" className="bg-charcoal py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <SectionHeading index="03" label="Trust & Security" title="Built on trust." tone="dark">
          <p>
            The crypto market has legitimate services and fraudulent ones.
            ORBITAL earns your confidence through clear communication,
            identifiable channels and transparent transaction procedures.
          </p>
          <p className="mt-4 text-paper">
            Only deal with ORBITAL through our official Telegram bot and
            WhatsApp support channel linked on this website. We will never
            ask you to trade anywhere else.
          </p>
        </SectionHeading>

        <div className="mt-16 border-t border-line-dark">
          {rows.map((row, i) => (
            <Reveal key={row.title} delayMs={i * 70}>
              <div className="group grid grid-cols-1 gap-3 border-b border-line-dark py-8 transition-colors sm:grid-cols-[6rem_1fr_2fr] sm:items-center sm:gap-8">
                <span className="text-accent/80">
                  <row.Icon className="h-7 w-7" />
                </span>
                <h3 className="font-display text-2xl font-medium tracking-tight text-paper transition-colors group-hover:text-accent sm:text-3xl">
                  {row.title}
                </h3>
                <p className="text-base leading-relaxed text-paper/60">{row.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
