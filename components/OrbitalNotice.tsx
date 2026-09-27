import Reveal from "@/components/Reveal";
import NoticeCarousel from "@/components/NoticeCarousel";
import { getNoticeEnabled, listNoticePosts } from "@/lib/repo";
import { noticeImageUrl } from "@/lib/noticeImages";

// The Important Update: up to 5 posts as a sliding carousel, managed from
// the admin panel (/admin/announcements).
export default function OrbitalNotice() {
  if (!getNoticeEnabled()) return null;
  const posts = listNoticePosts();
  if (posts.length === 0) return null;

  return (
    <section aria-label="ORBITAL notice" className="bg-ink py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-6 lg:px-10">
        <Reveal>
          <NoticeCarousel
            slides={posts.map((p) => ({
              id: p.id,
              imageUrl: p.image ? noticeImageUrl(p.image) : null,
              tag: p.tag,
              title: p.title,
              message: p.message,
              buttonText: p.button_text,
              buttonUrl: p.button_url,
            }))}
          />
        </Reveal>
      </div>
    </section>
  );
}
