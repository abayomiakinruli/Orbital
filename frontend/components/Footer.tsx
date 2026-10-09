import Image from "next/image";
import Link from "next/link";
import NewsletterSignup from "@/frontend/components/NewsletterSignup";
import { InstagramLogo, XLogo } from "@/frontend/components/Icons";
import { orbitalConfig } from "@/config/orbital";

// Icon for each social network in config/orbital.ts `socials`, by label.
const SOCIAL_ICONS: Record<string, (p: { className?: string }) => React.ReactNode> = {
  X: XLogo,
  Instagram: InstagramLogo,
};

const footerLinks = [
  { label: "About", href: "/#about" },
  { label: "Updates", href: "/#updates" },
  { label: "Rates", href: "/#assets" },
  { label: "Track ID", href: "/track" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "FAQ", href: "/faq" },
  { label: "Trade", href: orbitalConfig.tradePage },
  { label: "Support", href: orbitalConfig.supportPage },
  { label: "Report a Bug", href: "/report-bug" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line-dark bg-charcoal py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        {/* Logo and links on the left, email sign-up on the right. */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_auto] lg:gap-16">
          <div>
            <Image
              src="/logo/orbital-wordmark-white.png"
              alt={orbitalConfig.brand.name}
              width={493}
              height={145}
              className="h-8 w-auto"
            />
            <p className="mt-3 text-sm text-white">{orbitalConfig.brand.tagline}</p>
            <nav
              aria-label="Footer"
              className="mt-10 grid grid-cols-2 gap-x-10 gap-y-3 sm:grid-cols-3"
            >
              {footerLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm text-white transition-colors hover:text-accent"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            {orbitalConfig.socials.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-3">
                {orbitalConfig.socials.map((s) => {
                  const Icon = SOCIAL_ICONS[s.label];
                  return (
                    <a
                      key={s.url}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`ORBITAL on ${s.label}`}
                      title={s.label}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-line-dark text-white transition-colors hover:border-accent hover:bg-accent hover:text-accent-ink"
                    >
                      {Icon ? <Icon /> : <span className="text-xs">{s.label}</span>}
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          <div className="lg:w-104 lg:border-l lg:border-line-dark lg:pl-16">
            <NewsletterSignup />
          </div>
        </div>

        <div className="mt-14 border-t border-line-dark pt-8">
          <div className="flex flex-col gap-3 text-xs text-white sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {year} {orbitalConfig.brand.name}. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="/terms" className="transition-colors hover:text-paper">
                Terms of Service
              </Link>
              <Link href="/privacy" className="transition-colors hover:text-paper">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
