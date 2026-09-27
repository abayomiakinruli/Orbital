import Image from "next/image";
import Link from "next/link";
import NewsletterSignup from "@/components/NewsletterSignup";
import { orbitalConfig } from "@/config/orbital";

const footerLinks = [
  { label: "About", href: "/#about" },
  { label: "What We Do", href: "/#what-we-do" },
  { label: "Trust & Security", href: "/#why-orbital" },
  { label: "Updates", href: "/#updates" },
  { label: "Rates", href: "/#assets" },
  { label: "Track ID", href: "/track" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "FAQ", href: "/#faq" },
  { label: "Trade", href: orbitalConfig.tradePage },
  { label: "Support", href: orbitalConfig.supportPage },
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
            <p className="mt-3 text-sm text-paper/50">{orbitalConfig.brand.tagline}</p>
            <nav
              aria-label="Footer"
              className="mt-10 grid grid-cols-2 gap-x-10 gap-y-3 sm:grid-cols-3"
            >
              {footerLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm text-paper/60 transition-colors hover:text-paper"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            {orbitalConfig.socials.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-3">
                {orbitalConfig.socials.map((s) => (
                  <a
                    key={s.url}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-line-dark px-4 py-2 text-xs text-paper/70 transition-colors hover:border-paper hover:text-paper"
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="lg:w-[26rem] lg:border-l lg:border-line-dark lg:pl-16">
            <NewsletterSignup />
          </div>
        </div>

        <div className="mt-14 border-t border-line-dark pt-8">
          <div className="flex flex-col gap-3 text-xs text-paper/40 sm:flex-row sm:items-center sm:justify-between">
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
