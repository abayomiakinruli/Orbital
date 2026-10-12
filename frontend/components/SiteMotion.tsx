"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const SECTION_FADE_MS = 220;

// Site-wide motion: a quick fade when a link jumps to another section of the
// same page (styles in frontend/styles/globals.css). Renders nothing itself.
export default function SiteMotion() {
  const pathname = usePathname();
  const hidden = pathname.startsWith("/admin");

  useEffect(() => {
    if (hidden) return;

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

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.documentElement.classList.remove("section-fading");
    };
  }, [hidden, pathname]);

  return null;
}
