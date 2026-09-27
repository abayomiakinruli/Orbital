import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import TrackTransaction from "@/components/TrackTransaction";
import OrbitalNotice from "@/components/OrbitalNotice";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";

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
        <OrbitalNotice />
        <FinalCTA message="All sorted? Your next trade starts right here." />
      </main>
      <Footer />
    </>
  );
}
