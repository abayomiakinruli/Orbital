"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/admin/actions";

export type NavLink = { href: string; label: string };

const ICONS: Record<string, React.ReactNode> = {
  Dashboard: (
    <svg viewBox="0 0 20 20" fill="none" className="h-4.5 w-4.5">
      <rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="2.5" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2.5" y="11" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="11" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  Accounts: (
    <svg viewBox="0 0 20 20" fill="none" className="h-4.5 w-4.5">
      <circle cx="10" cy="6.5" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M3.5 17c0-3.038 2.91-5.5 6.5-5.5s6.5 2.462 6.5 5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  Trades: (
    <svg viewBox="0 0 20 20" fill="none" className="h-4.5 w-4.5">
      <path
        d="M4 7h9m0 0-2.5-2.5M13 7l-2.5 2.5M16 13H7m0 0 2.5-2.5M7 13l2.5 2.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  "Assets & Rates": (
    <svg viewBox="0 0 20 20" fill="none" className="h-4.5 w-4.5">
      <path
        d="M11 3 3 11v4a2 2 0 0 0 2 2h4l8-8a2 2 0 0 0 0-2.83l-3.17-3.17A2 2 0 0 0 11 3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="13" cy="7" r="1" fill="currentColor" />
    </svg>
  ),
  Subscribers: (
    <svg viewBox="0 0 20 20" fill="none" className="h-4.5 w-4.5">
      <rect x="2.5" y="4.5" width="15" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="m3 5.5 7 5.5 7-5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Margins: (
    <svg viewBox="0 0 20 20" fill="none" className="h-4.5 w-4.5">
      <path d="M15.5 4.5 4.5 15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="6" cy="6" r="2.25" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="14" cy="14" r="2.25" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  "Bug reports": (
    <svg viewBox="0 0 20 20" fill="none" className="h-4.5 w-4.5">
      <rect x="6" y="6" width="8" height="11" rx="4" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M7.5 6.5 6 4m6.5 2.5L14 4M6 10H3m14 0h-3M6 14H3.5m13 0H14M10 9v8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  Announcements: (
    <svg viewBox="0 0 20 20" fill="none" className="h-4.5 w-4.5">
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M2.5 10h15M10 2.5c2 2.2 3 4.7 3 7.5s-1 5.3-3 7.5c-2-2.2-3-4.7-3-7.5s1-5.3 3-7.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

function NavItems({ links, pathname }: { links: NavLink[]; pathname: string }) {
  return (
    <>
      {links.map((l) => {
        const active = l.href === "/admin" ? pathname === l.href : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-accent text-accent-ink"
                : "text-white/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            {ICONS[l.label]}
            <span className="whitespace-nowrap">{l.label}</span>
          </Link>
        );
      })}
    </>
  );
}

export default function Sidebar({ links }: { links: NavLink[] }) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop: full-height dark sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col bg-[#0b1526] px-4 py-6 md:flex">
        <p className="mb-6 px-3 font-display text-lg font-semibold text-white">
          ORBITAL
        </p>
        <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wide text-white/35">
          Main
        </p>
        <nav className="flex flex-1 flex-col gap-1">
          <NavItems links={links} pathname={pathname} />
        </nav>
        <form action={logout}>
          <button className="mt-4 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white">
            Log out
          </button>
        </form>
      </aside>

      {/* Mobile: compact top bar */}
      <div className="flex items-center justify-between gap-3 bg-[#0b1526] px-4 py-3 md:hidden">
        <p className="font-display text-base font-semibold text-white">ORBITAL</p>
        <form action={logout}>
          <button className="text-sm text-white/60 hover:text-white">Log out</button>
        </form>
      </div>
      <nav className="flex gap-1 overflow-x-auto bg-[#0b1526] px-3 pb-3 md:hidden">
        <NavItems links={links} pathname={pathname} />
      </nav>
    </>
  );
}
