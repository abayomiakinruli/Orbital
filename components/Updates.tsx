import SectionHeading from "@/components/SectionHeading";
import Reveal from "@/components/Reveal";
import { listAnnouncements } from "@/lib/repo";

// The newest published updates, managed from the admin panel (/admin/announcements).
const MAX_CARDS = 6;

export default function Updates() {
  const updates = listAnnouncements(true).slice(0, MAX_CARDS);
  if (updates.length === 0) return null;

  return (
    <section id="updates" className="py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <SectionHeading index="04" label="Updates" title="Stay in the ORBITAL." />

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {updates.map((update, i) => (
            <Reveal key={update.id} delayMs={(i % 3) * 100}>
              <article className="flex h-full flex-col rounded-2xl border border-line bg-paper-dim p-8 transition-colors duration-300 hover:border-ink">
                <div className="flex items-center justify-between gap-4 text-xs tracking-[0.15em] text-graphite uppercase">
                  <span>{update.tag}</span>
                  <span>{update.date_label}</span>
                </div>
                <h3 className="mt-6 font-display text-xl font-medium tracking-tight text-ink">
                  {update.title}
                </h3>
                <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-graphite">
                  {update.content}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
