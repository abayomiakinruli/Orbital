"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { orbitalConfig } from "@/config/orbital";

// Explore -> the About section (the first stop right after the hero).
// Rates -> the Assets section, which is the live BTC/USDT/USDC/SOL price ticker.
// Section links are prefixed with "/" so they also work from other pages
// (e.g. /how-it-works), not just the homepage.
const navLinks = [
  { label: "Explore", href: "/#about" },
  { label: "Updates", href: "/#updates" },
  { label: "Rates", href: "/#assets" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Track ID", href: "/track" },
];

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M3 9.5 10 3l7 6.5M5 8v8.5h10V8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  // The nav overlays the black hero until the page scrolls (or the mobile
  // menu opens), then sits on the cream header. Text, borders and the menu
  // icon all flip between light-on-dark and dark-on-light accordingly.
  const solid = scrolled || open;
  // Home icon: hidden only at the top of the homepage (you are already
  // home there); on every other page, or once scrolled, it stays visible.
  const pathname = usePathname();
  const showHome = solid || pathname !== "/";
  const textColor = solid ? "text-ink/70" : "text-white";
  const textHover = solid ? "hover:text-[#1d8a55]" : "hover:text-accent";
  const borderColor = solid ? "border-ink/30" : "border-paper/30";
  const barColor = solid ? "bg-ink" : "bg-white";
  const barHover = solid ? "group-hover:bg-[#1d8a55]" : "group-hover:bg-accent";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        scrolled || open
          ? "border-b border-line bg-white/90 backdrop-blur-md"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
        <Link
          href="/#top"
          aria-label="ORBITAL home"
          className="relative block h-7 w-31 shrink-0 transition-opacity hover:opacity-75"
        >
          <Image
            src="/logo/orbital-wordmark-white.png"
            alt=""
            fill
            priority
            sizes="124px"
            className={`object-contain object-left transition-opacity duration-500 ${
              solid ? "opacity-0" : "opacity-100"
            }`}
          />
          <Image
            src="/logo/orbital-wordmark-green.png"
            alt=""
            fill
            priority
            sizes="124px"
            className={`object-contain object-left transition-opacity duration-500 ${
              solid ? "opacity-100" : "opacity-0"
            }`}
          />
        </Link>

        <nav className="hidden items-center gap-10 md:flex">
          <Link
            href="/#top"
            aria-label="Home"
            aria-hidden={!showHome}
            tabIndex={showHome ? 0 : -1}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-[opacity,color] duration-500 ${
              solid ? "text-ink hover:bg-ink/10" : "text-paper hover:bg-paper/10"
            } ${showHome ? "opacity-100" : "pointer-events-none opacity-0"}`}
          >
            <HomeIcon />
          </Link>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm transition-colors ${textColor} ${textHover}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href={orbitalConfig.supportPage}
            className={`rounded-full border px-5 py-2.5 text-sm transition-colors ${borderColor} ${textColor} ${textHover}`}
          >
            Support
          </Link>
          <Link
            href={orbitalConfig.tradePage}
            className="rounded-full bg-ink px-5 py-2.5 text-sm text-paper transition-colors hover:text-accent"
          >
            Trade
          </Link>
        </div>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="group flex h-10 w-10 items-center justify-center md:hidden"
        >
          <span className="relative block h-4 w-6">
            <span
              className={`absolute left-0 top-0 h-[1.5px] w-full transition-[transform,background-color] duration-300 ${barColor} ${barHover} ${
                open ? "translate-y-1.75 rotate-45" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-1.75 h-[1.5px] w-full transition-[opacity,background-color] duration-300 ${barColor} ${barHover} ${
                open ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute left-0 top-3.5 h-[1.5px] w-full transition-[transform,background-color] duration-300 ${barColor} ${barHover} ${
                open ? "-translate-y-1.75 -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </div>

      <div
        className={`overflow-hidden transition-[max-height,opacity] duration-500 md:hidden ${
          open ? "max-h-152 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="flex flex-col gap-1 border-t border-line bg-white px-6 pb-8 pt-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="border-b border-line/70 py-4 text-lg text-ink transition-colors hover:text-[#1d8a55]"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href={orbitalConfig.supportPage}
              className="rounded-full border border-line px-5 py-3 text-center text-sm text-ink transition-colors hover:text-[#1d8a55]"
            >
              Support
            </Link>
            <Link
              href={orbitalConfig.tradePage}
              className="rounded-full bg-ink px-5 py-3 text-center text-sm text-paper transition-colors hover:text-accent"
            >
              Trade
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
