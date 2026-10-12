import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Space_Grotesk, DM_Sans } from "next/font/google";
import { orbitalConfig } from "@/config/orbital";
import { siteUrl } from "@/config/siteUrl";
import Tracker from "@/frontend/components/Tracker";
import SiteMotion from "@/frontend/components/SiteMotion";
import SplashScreen from "@/frontend/components/SplashScreen";
import "@/frontend/styles/globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const title = "ORBITAL | Trade Beyond Borders";
const description =
  "ORBITAL is a digital asset trading business offering a simple, transparent way to buy and sell BTC, ETH, USDT, USDC and SOL. Trade on Telegram, get support on WhatsApp.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: `%s | ${orbitalConfig.brand.name}`,
  },
  description,
  keywords: [
    "ORBITAL",
    "digital assets",
    "crypto trading",
    "Telegram trading desk",
    "crypto customer support",
  ],
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: orbitalConfig.brand.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

// Runs before first paint: skips the intro splash when it was already seen
// this visit (or storage is unavailable), so it never flashes on reloads or
// later pages. See frontend/components/SplashScreen.tsx.
const SPLASH_CHECK = `try{if(sessionStorage.getItem("orbital-splash-seen"))document.documentElement.dataset.splashDone="1"}catch(e){document.documentElement.dataset.splashDone="1"}`;

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${dmSans.variable} scroll-smooth`}
      // Tells Next.js the smooth scrolling is intentional, so it switches it
      // off only while changing pages.
      data-scroll-behavior="smooth"
      // SPLASH_CHECK may add data-splash-done before React hydrates.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: SPLASH_CHECK }} />
        <noscript>
          <style>{`.splash{display:none}.hero-fade{animation-play-state:running!important}`}</style>
        </noscript>
      </head>
      <body className="min-h-screen bg-white font-sans text-ink antialiased">
        <SplashScreen />
        {children}
        <Tracker />
        <SiteMotion />
      </body>
    </html>
  );
}
