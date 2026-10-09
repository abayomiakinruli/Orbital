"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const SECTION_FADE_MS = 220;

// Site-wide motion: the green reading-progress bar under the top edge, and a
// quick fade when a link jumps to another section of the same page (styles in
// frontend/styles/globals.css).
export default function SiteMotion() {
  const pathname = usePathname();
  const bar = useRef<HTMLDivElement>(null);
  const hidden = pathname.startsWith("/admin");

  useEffect(() => {
    if (hidden) return;
    let frame = 0;

    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      if (bar.current) bar.current.style.transform = `scaleX(${progress})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    // Capture phase, so the jump is claimed before next/link handles the click.
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const link = (event.target as Element).closest?.("a");
      if (!link || link.getAttribute("target")) return;
      const url = new URL(link.getAttribute("href") ?? "", window.location.href);
      if (url.origin !== window.location.origin || url.pathname !== window.location.pathname) return;
      const target = url.hash ? document.getElementById(decodeURIComponent(url.hash.slice(1))) : null;
      if (!target) return;

      event.preventDefault();
      const root = document.documentElement;
      if (root.classList.contains("section-fading")) return;
      root.classList.add("section-fading");
      window.setTimeout(() => {
        const previous = root.style.scrollBehavior;
        root.style.scrollBehavior = "auto";
        target.scrollIntoView({ behavior: "auto", block: "start" });
        window.history.pushState(null, "", url.hash);
        requestAnimationFrame(() => {
          root.style.scrollBehavior = previous;
          root.classList.remove("section-fading");
        });
      }, SECTION_FADE_MS);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    document.addEventListener("click", onClick, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      document.removeEventListener("click", onClick, true);
      document.documentElement.classList.remove("section-fading");
    };
  }, [hidden, pathname]);

  if (hidden) return null;

  return (
    <div
      ref={bar}
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[3px] origin-left bg-accent"
      style={{ transform: "scaleX(0)" }}
    />
  );
}
