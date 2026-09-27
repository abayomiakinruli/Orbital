import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Space_Grotesk, DM_Sans } from "next/font/google";
import { orbitalConfig } from "@/config/orbital";
import Tracker from "@/components/Tracker";
import "./globals.css";

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

// The public address, set per deployment (SITE_URL in the environment).
// Used for link previews and search; the placeholder only matters locally.
const siteUrl = process.env.SITE_URL ?? "https://orbital.example.com";
const title = "ORBITAL | Trade Beyond Borders";
const description =
  "ORBITAL is a digital asset trading business offering a simple, transparent way to buy and sell BTC, USDT, USDC and SOL. Trade on Telegram, get support on WhatsApp.";

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

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${dmSans.variable} scroll-smooth`}
    >
      <body className="min-h-screen bg-paper font-sans text-ink antialiased">
        {children}
        <Tracker />
      </body>
    </html>
  );
}
