import Reveal from "@/frontend/components/Reveal";
import NoticeCarousel from "@/frontend/components/NoticeCarousel";
import type { NoticeSlide } from "@/backend/site";

// The Important Update: up to 5 posts as a sliding carousel. Content comes
// from the page (backend/site.ts getNoticeSlides), managed at
// /admin/announcements. Renders nothing when there are no slides.
export default function OrbitalNotice({ slides }: { slides: NoticeSlide[] }) {
  if (slides.length === 0) return null;

  return (
    <section aria-label="ORBITAL notice" className="bg-ink py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-6 lg:px-10">
        <Reveal>
          <NoticeCarousel slides={slides} />
        </Reveal>
      </div>
    </section>
  );
}
