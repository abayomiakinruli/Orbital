import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export type LegalSection = { heading: string; body: string[] };

// Shared layout for /terms and /privacy: a short dark band under the
// navbar, then plain, readable text on the light page colour.
export default function LegalPage({
  eyebrow,
  title,
  updated,
  intro,
  sections,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <>
      <Navbar />
      <main className="relative isolate">
        <section className="bg-charcoal pt-40 pb-16 sm:pt-48">
          <div className="mx-auto max-w-3xl px-6 lg:px-10">
            <p className="font-display text-xs font-medium tracking-[0.25em] text-paper/50 uppercase">
              {eyebrow}
            </p>
            <h1 className="mt-5 font-display text-5xl font-medium tracking-tight text-paper sm:text-6xl">
              {title}
            </h1>
            <p className="mt-4 text-sm text-paper/50">Last updated {updated}</p>
          </div>
        </section>
        <article className="bg-paper py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-6 lg:px-10">
            <p className="text-lg leading-relaxed text-ink">{intro}</p>
            {sections.map((s, i) => (
              <section key={s.heading} className="mt-12">
                <h2 className="font-display text-2xl font-medium tracking-tight text-ink">
                  {i + 1}. {s.heading}
                </h2>
                {s.body.map((para) => (
                  <p key={para} className="mt-4 text-base leading-relaxed text-graphite">
                    {para}
                  </p>
                ))}
              </section>
            ))}
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
