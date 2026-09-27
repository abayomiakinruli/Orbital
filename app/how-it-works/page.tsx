import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import HowItWorks from "@/components/HowItWorks";
import OrbitalNotice from "@/components/OrbitalNotice";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "The six steps of an ORBITAL trade, from choosing a coin to getting your rate and completing your order on Telegram.",
};

// The Important Update adverts are read from the database (edited at
// /admin/announcements), so render on each request.
export const dynamic = "force-dynamic";

export default function HowItWorksPage() {
  return (
    <>
      <Navbar />
      <main className="relative isolate">
        <HowItWorks />
        <OrbitalNotice />
        <FinalCTA message="You know the steps now. The bot is ready when you are." />
      </main>
      <Footer />
    </>
  );
}
