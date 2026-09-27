import type { Metadata } from "next";
import Navbar from "@/frontend/components/Navbar";
import HowItWorks from "@/frontend/components/HowItWorks";
import OrbitalNotice from "@/frontend/components/OrbitalNotice";
import FinalCTA from "@/frontend/components/FinalCTA";
import Footer from "@/frontend/components/Footer";
import { getNoticeSlides } from "@/backend/site";

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
        <OrbitalNotice slides={getNoticeSlides()} />
        <FinalCTA message="You know the steps now. The bot is ready when you are." />
      </main>
      <Footer />
    </>
  );
}
