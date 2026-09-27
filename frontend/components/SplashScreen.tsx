"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// The ORBITAL intro: the mark swings in with a dot orbiting it, the
// wordmark and tagline rise, then the screen fades away and the page's own
// entrance animations start. Shown once per visit (sessionStorage), never
// in the admin, skippable with a tap or key, shortened for reduced motion.
//
// Visibility is driven by the `data-splash-done` attribute on <html>: an
// inline script in app/layout.tsx sets it before first paint when the intro
// was already seen, so returning pages never flash it. The CSS lives in
// frontend/styles/globals.css (.splash), including a failsafe that hides it
// after 5 seconds even if this script never runs.
const SEEN_KEY = "orbital-splash-seen";

export default function SplashScreen() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    const root = document.documentElement;
    if (isAdmin || root.dataset.splashDone) {
      root.dataset.splashDone = "1";
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.body.style.overflow = "hidden";

    const finish = () => {
      root.dataset.splashDone = "1";
      document.body.style.overflow = "";
      try {
        sessionStorage.setItem(SEEN_KEY, "1");
      } catch {
        // Storage blocked: it just plays again next visit.
      }
      window.removeEventListener("keydown", finish);
    };
    const timer = setTimeout(finish, reduce ? 700 : 2400);
    window.addEventListener("keydown", finish);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", finish);
      document.body.style.overflow = "";
    };
  }, [isAdmin]);

  if (isAdmin) return null;

  return (
    <div
      className="splash"
      role="presentation"
      aria-hidden="true"
      onClick={() => {
        document.documentElement.dataset.splashDone = "1";
        document.body.style.overflow = "";
        try {
          sessionStorage.setItem(SEEN_KEY, "1");
        } catch {}
      }}
    >
      <div className="splash-stage">
        <div className="splash-orbit">
          <span className="splash-orbit-dot" />
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- plain img so it paints before hydration */}
        <img src="/logo/orbital-mark-green.png" alt="" width={415} height={384} className="splash-mark" />
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element -- plain img so it paints before hydration */}
      <img
        src="/logo/orbital-wordmark-white.png"
        alt=""
        width={494}
        height={147}
        className="splash-wordmark"
      />
      <p className="splash-tagline">Trade Beyond Borders.</p>
    </div>
  );
}
