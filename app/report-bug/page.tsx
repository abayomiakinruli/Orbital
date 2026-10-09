import type { Metadata } from "next";
import Navbar from "@/frontend/components/Navbar";
import Reveal from "@/frontend/components/Reveal";
import BugReportForm from "@/frontend/components/BugReportForm";
import Footer from "@/frontend/components/Footer";

export const metadata: Metadata = {
  title: "Report a Bug",
  description: "Something not working on the ORBITAL website or bot? Tell us and we'll look into it.",
};

// Linked from the footer. Reports land at /admin/bugs.
export default function ReportBugPage() {
  return (
    <>
      <Navbar />
      <main className="relative isolate">
        {/* Opens the page, so it carries the top padding that clears the fixed navbar. */}
        <section className="bg-charcoal pt-40 pb-28 sm:pt-48 sm:pb-36">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1fr_1fr] lg:gap-8">
              <div className="max-w-3xl">
                <Reveal>
                  <p className="font-display text-xs font-medium tracking-[0.25em] text-white uppercase">
                    Report a bug
                  </p>
                </Reveal>
                <Reveal delayMs={80}>
                  <h1 className="mt-5 font-display text-5xl font-medium tracking-tight text-balance text-paper sm:text-6xl lg:text-7xl">
                    Something not working?
                  </h1>
                </Reveal>
                <Reveal delayMs={160}>
                  <p className="mt-6 text-lg leading-relaxed text-white">
                    Tell us what happened and leave your email. Our team will look into it and
                    may reach out for more detail.
                  </p>
                </Reveal>
              </div>

              <Reveal delayMs={120}>
                <div className="flex flex-col justify-center">
                  <BugReportForm />
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
