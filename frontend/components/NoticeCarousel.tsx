"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";

import type { NoticeSlide } from "@/backend/site";

// The Important Update: one card per post, every slide the same card size
// whatever its image. Posts travel left to right: the newest sits on the
// right and each next post comes in from the left. It's a real scroll
// container (swipe, drag or trackpad), and advances on its own only while
// on screen, not hovered or recently touched, and never for visitors who
// ask for reduced motion.
const INTERVAL_MS = 6000;
const HOLD_AFTER_TOUCH_MS = 8000;

const REDUCED = "(prefers-reduced-motion: reduce)";
function subscribeReducedMotion(onChange: () => void) {
  const media = window.matchMedia(REDUCED);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function Tag({ tag }: { tag: string }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {tag && (
        <span className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-xs font-semibold tracking-[0.2em] text-accent-ink uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-ink" />
          {tag}
        </span>
      )}
      <span className="font-display text-xs tracking-[0.25em] text-white uppercase">
        ORBITAL Notice
      </span>
    </div>
  );
}

function SlideButton({ slide }: { slide: NoticeSlide }) {
  if (!slide.buttonText || !slide.buttonUrl) return null;
  const external = /^https?:/i.test(slide.buttonUrl);
  return (
    <a
      href={slide.buttonUrl}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="inline-flex w-fit items-center justify-center rounded-full bg-accent px-7 py-3.5 text-sm font-medium text-accent-ink transition-colors hover:bg-white"
    >
      {slide.buttonText}
    </a>
  );
}

function Slide({ slide, label }: { slide: NoticeSlide; label: string }) {
  const hasText = Boolean(slide.title || slide.message);
  const alt = slide.title || "ORBITAL important update";
  return (
    <article
      role="group"
      aria-roledescription="slide"
      aria-label={label}
      className="h-full w-full shrink-0 snap-center px-px"
    >
      <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-accent/30 bg-charcoal md:flex-row">
        {slide.imageUrl && (
          <div
            className={`relative bg-ink ${
              hasText ? "aspect-video md:aspect-auto md:w-1/2" : "aspect-video flex-1 md:aspect-auto"
            }`}
          >
            <Image src={slide.imageUrl} alt={alt} fill unoptimized className="object-contain" />
            {/* An image-only post is usually a finished flyer with its own
                call to action, so nothing is drawn over it; the whole image
                links to the post's button link instead. */}
            {!hasText && slide.buttonUrl && (
              <a
                href={slide.buttonUrl}
                target={/^https?:/i.test(slide.buttonUrl) ? "_blank" : undefined}
                rel={/^https?:/i.test(slide.buttonUrl) ? "noopener noreferrer" : undefined}
                aria-label={slide.buttonText || alt}
                className="absolute inset-0"
              />
            )}
          </div>
        )}
        {hasText && (
          <div
            className={`flex flex-1 flex-col justify-center gap-5 px-8 py-10 sm:px-12 ${
              slide.imageUrl ? "md:w-1/2" : ""
            }`}
          >
            <Tag tag={slide.tag} />
            {slide.title && (
              <h3 className="max-w-2xl font-display text-3xl font-medium tracking-tight text-paper sm:text-4xl">
                {slide.title}
              </h3>
            )}
            {slide.message && (
              <p className="max-w-2xl whitespace-pre-line text-lg leading-relaxed text-white">
                {slide.message}
              </p>
            )}
            <SlideButton slide={slide} />
          </div>
        )}
      </div>
    </article>
  );
}

export default function NoticeCarousel({ slides }: { slides: NoticeSlide[] }) {
  const count = slides.length;
  // DOM order is oldest → newest, so the newest (slides[0]) sits on the
  // right; logical index i (0 = newest) lives at scroll position count-1-i.
  const ordered = [...slides].reverse();
  const scroller = useRef<HTMLDivElement>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [held, setHeld] = useState(false);
  const reduceMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED).matches,
    () => false,
  );

  // Start on the newest post (the right end), then reveal.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTo({ left: el.scrollWidth, behavior: "instant" });
    el.dataset.ready = "true";
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0.4,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const goTo = (i: number) => {
    const el = scroller.current;
    if (!el) return;
    const target = (((i % count) + count) % count);
    // Set the dot straight away rather than waiting for scroll events,
    // which some browsers fire late or not at all for smooth scrolling.
    setIndex(target);
    el.scrollTo({
      left: (count - 1 - target) * el.clientWidth,
      behavior: reduceMotion ? "instant" : "smooth",
    });
  };

  useEffect(() => {
    if (count < 2 || !visible || hovered || held || reduceMotion) return;
    const id = setTimeout(() => goTo(index + 1), INTERVAL_MS);
    return () => clearTimeout(id);
    // goTo only reads refs and props already listed here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, visible, hovered, held, reduceMotion, index]);

  const onScroll = () => {
    const el = scroller.current;
    if (!el || el.clientWidth === 0) return;
    const pos = Math.round(el.scrollLeft / el.clientWidth);
    setIndex(Math.min(count - 1, Math.max(0, count - 1 - pos)));
  };

  // Someone swiped or scrolled it themselves: let them read before moving on.
  const hold = () => {
    setHeld(true);
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = setTimeout(() => setHeld(false), HOLD_AFTER_TOUCH_MS);
  };

  const arrow = "absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-ink/80 text-paper backdrop-blur transition-colors hover:bg-accent hover:text-accent-ink sm:flex";

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Important updates"
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      <div
        ref={scroller}
        onScroll={onScroll}
        onPointerDown={hold}
        onWheel={hold}
        onTouchStart={hold}
        className={`no-scrollbar flex snap-x snap-mandatory items-stretch overflow-x-auto overscroll-x-contain md:h-104 ${
          count > 1 ? "opacity-0 transition-opacity duration-300 data-[ready=true]:opacity-100" : ""
        }`}
      >
        {ordered.map((slide, pos) => (
          <Slide key={slide.id} slide={slide} label={`${count - pos} of ${count}`} />
        ))}
      </div>

      {count > 1 && (
        <>
          {/* Older posts sit to the left (they come in from the left); newer to the right. */}
          <button type="button" onClick={() => { hold(); goTo(index + 1); }} aria-label="Older update" className={`${arrow} -left-5`}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button type="button" onClick={() => { hold(); goTo(index - 1); }} aria-label="Newer update" className={`${arrow} -right-5`}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="m6 3 5 5-5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="mt-6 flex justify-center gap-2">
            {ordered.map((slide, pos) => {
              const i = count - 1 - pos;
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => { hold(); goTo(i); }}
                  aria-label={`Show update ${i + 1} of ${count}`}
                  aria-current={i === index}
                  className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-accent" : "w-2 bg-paper/30 hover:bg-paper/60"}`}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
