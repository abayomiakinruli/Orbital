import type { Metadata } from "next";
import Navbar from "@/frontend/components/Navbar";
import TrackTransaction from "@/frontend/components/TrackTransaction";
import OrbitalNotice from "@/frontend/components/OrbitalNotice";
import FinalCTA from "@/frontend/components/FinalCTA";
import Footer from "@/frontend/components/Footer";
import { getNoticeSlides } from "@/backend/site";

export const metadata: Metadata = {
  title: "Track Your Transaction",
  description:
    "Check the status of your ORBITAL trade with the Transaction ID you received from the ORBITAL Telegram bot.",
};

// The Important Update adverts are read from the database (edited at
// /admin/announcements), so render on each request.
export const dynamic = "force-dynamic";

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  return (
    <>
      <Navbar />
      <main className="relative isolate">
        <TrackTransaction initialId={typeof id === "string" ? id.slice(0, 40) : ""} />
        <OrbitalNotice slides={getNoticeSlides()} />
        <FinalCTA message="All sorted? Your next trade starts right here." />
      </main>
      <Footer />
    </>
  );
}
