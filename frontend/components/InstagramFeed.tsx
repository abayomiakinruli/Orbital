import Image from "next/image";
import SectionHeading from "@/frontend/components/SectionHeading";
import Reveal from "@/frontend/components/Reveal";
import { InstagramLogo } from "@/frontend/components/Icons";
import { orbitalConfig } from "@/config/orbital";
import type { InstagramFeedPost } from "@/backend/site";

// The latest posts from ORBITAL's Instagram, passed in by the page
// (backend/site.ts getInstagramFeed). Images are served from this site, not
// Instagram. Hidden until Instagram is connected in the admin.
export default function InstagramFeed({ posts }: { posts: InstagramFeedPost[] }) {
  if (posts.length === 0) return null;
  const profile = orbitalConfig.socials.find((s) => s.label === "Instagram")?.url;
  const handle = profile ? `@${new URL(profile).pathname.replace(/\//g, "")}` : "Instagram";

  return (
    <section id="instagram" className="bg-paper-dim py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading index="07" label="Instagram" title={`Follow ${handle}.`}>
            <p>News, market moments and behind the scenes, as they happen.</p>
          </SectionHeading>
          {profile && (
            <Reveal delayMs={120}>
              <a
                href={profile}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-accent hover:text-accent-ink"
              >
                <InstagramLogo className="h-4 w-4" />
                Follow on Instagram
              </a>
            </Reveal>
          )}
        </div>

        <ul className="mt-14 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
          {posts.map((post, i) => (
            <Reveal key={post.id} delayMs={i * 60}>
              <li>
                <a
                  href={post.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative block aspect-square overflow-hidden rounded-2xl bg-line"
                >
                  <Image
                    src={post.imageUrl}
                    alt={post.caption ? post.caption.slice(0, 120) : "ORBITAL on Instagram"}
                    fill
                    unoptimized
                    sizes="(min-width: 768px) 33vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {post.isVideo && (
                    <span className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-ink/70 text-paper backdrop-blur">
                      <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className="h-3.5 w-3.5">
                        <path d="M4 2.5v11l9-5.5-9-5.5Z" />
                      </svg>
                      <span className="sr-only">Video</span>
                    </span>
                  )}
                  {post.caption && (
                    <span className="absolute inset-0 flex items-end bg-linear-to-t from-ink/85 via-ink/20 to-transparent p-4 text-sm leading-snug text-paper opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                      <span className="line-clamp-3">{post.caption}</span>
                    </span>
                  )}
                </a>
              </li>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
