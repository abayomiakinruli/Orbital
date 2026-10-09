import Reveal from "@/frontend/components/Reveal";
import Link from "next/link";
import { orbitalConfig } from "@/config/orbital";

// The closing band shared by several pages; each passes its own line so
// the same sentence does not repeat across the site.
export default function FinalCTA({
  message = "Open the bot, pick a coin and see your rate before you commit.",
}: {
  message?: string;
}) {
  return (
    <section className="bg-ink py-28 sm:py-40">
      <div className="mx-auto max-w-5xl px-6 text-center lg:px-10">
        <Reveal>
          <h2 className="font-display font-medium text-paper leading-[0.96] text-[clamp(2.5rem,7vw,5.5rem)] tracking-tight">
            Trade beyond borders.
          </h2>
        </Reveal>

        <Reveal delayMs={80}>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-white">
            {message}
          </p>
        </Reveal>

        <Reveal delayMs={120}>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href={orbitalConfig.tradePage}
              className="inline-flex items-center justify-center rounded-full bg-accent px-8 py-4 text-sm font-medium text-accent-ink transition-colors hover:bg-white"
            >
              Trade with ORBITAL
            </Link>
            <Link
              href={orbitalConfig.supportPage}
              className="inline-flex items-center justify-center rounded-full border border-line-dark px-8 py-4 text-sm font-medium text-paper transition-colors hover:border-paper hover:bg-paper hover:text-ink"
            >
              Customer Support
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
