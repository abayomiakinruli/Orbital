import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// A section's body is a list of lines:
//   "### Heading"  a numbered subsection (clause 3.1, 3.2 ...)
//   "- text"       a bullet; consecutive bullets form one list
//   anything else  a paragraph
export type LegalSection = { heading: string; body: string[] };

type Block =
  | { kind: "p"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "h3"; text: string; number: string };

function toBlocks(body: string[], sectionNumber: number): Block[] {
  const blocks: Block[] = [];
  let sub = 0;
  for (const line of body) {
    if (line.startsWith("### ")) {
      sub += 1;
      blocks.push({ kind: "h3", text: line.slice(4), number: `${sectionNumber}.${sub}` });
    } else if (line.startsWith("- ")) {
      const last = blocks[blocks.length - 1];
      if (last?.kind === "ul") last.items.push(line.slice(2));
      else blocks.push({ kind: "ul", items: [line.slice(2)] });
    } else {
      blocks.push({ kind: "p", text: line });
    }
  }
  return blocks;
}

// Shared layout for /terms and /privacy: a short dark band under the
// navbar, a collapsible table of contents, then numbered clauses on the
// light page colour.
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
  intro: string[];
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
          <div className="mx-auto max-w-5xl px-6 lg:px-10">
            {intro.map((para) => (
              <p key={para} className="mt-4 first:mt-0 text-lg leading-relaxed text-ink">
                {para}
              </p>
            ))}

            <details className="group mt-10 rounded-2xl border border-line bg-paper-dim/60 p-6">
              <summary className="flex cursor-pointer list-none items-center justify-between font-display text-base font-medium text-ink [&::-webkit-details-marker]:hidden">
                Contents ({sections.length} sections)
                <span aria-hidden="true" className="transition-transform group-open:rotate-45">+</span>
              </summary>
              <ol className="mt-4 grid grid-cols-1 gap-x-8 gap-y-1.5 text-sm sm:grid-cols-2">
                {sections.map((s, i) => (
                  <li key={s.heading}>
                    <a href={`#section-${i + 1}`} className="text-graphite hover:text-ink hover:underline">
                      {i + 1}. {s.heading}
                    </a>
                  </li>
                ))}
              </ol>
            </details>

            {/* One row per section: number, title, then the clause text. On
                phones each row stacks into a card instead of squeezing columns. */}
            <table className="mt-10 w-full border-collapse text-left">
              <thead className="hidden md:table-header-group">
                <tr className="border-b-2 border-ink text-xs tracking-[0.15em] text-graphite uppercase">
                  <th scope="col" className="w-14 py-3 pr-4 font-medium">No.</th>
                  <th scope="col" className="w-52 py-3 pr-6 font-medium">Section</th>
                  <th scope="col" className="py-3 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {sections.map((s, i) => (
                  <tr
                    key={s.heading}
                    id={`section-${i + 1}`}
                    className="block scroll-mt-28 border-b border-line py-6 md:table-row md:py-0"
                  >
                    <td className="block align-top font-display text-sm text-[#1d8a55] md:table-cell md:py-6 md:pr-4">
                      {i + 1}
                    </td>
                    <th
                      scope="row"
                      className="mt-1 block align-top font-display text-lg font-medium tracking-tight text-ink md:mt-0 md:table-cell md:py-6 md:pr-6 md:text-base"
                    >
                      {s.heading}
                    </th>
                    <td className="block align-top md:table-cell md:py-6 [&>*:first-child]:mt-2 md:[&>*:first-child]:mt-0">
                      {toBlocks(s.body, i + 1).map((block, j) =>
                        block.kind === "h3" ? (
                          <h3 key={j} className="mt-5 font-display text-base font-medium text-ink">
                            {block.number} {block.text}
                          </h3>
                        ) : block.kind === "ul" ? (
                          <ul key={j} className="mt-3 list-disc space-y-2 pl-6 text-base leading-relaxed text-graphite marker:text-[#1d8a55]">
                            {block.items.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <p key={j} className="mt-4 text-base leading-relaxed text-graphite">
                            {block.text}
                          </p>
                        ),
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
