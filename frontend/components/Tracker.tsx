"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function send(type: string, path: string) {
  const body = new Blob([JSON.stringify({ type, path })], {
    type: "application/json",
  });
  navigator.sendBeacon("/api/track", body);
}

// Counts page views and clicks on the Telegram / WhatsApp buttons so the
// admin dashboard can show how the website is performing.
export default function Tracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname.startsWith("/admin")) send("pageview", pathname);
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element).closest?.("a");
      if (!link) return;
      const href = link.getAttribute("href") ?? "";
      if (href.includes("t.me/")) send("telegram_click", location.pathname);
      else if (href.includes("wa.me/")) send("whatsapp_click", location.pathname);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
