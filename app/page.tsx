import Navbar from "@/frontend/components/Navbar";
import Hero from "@/frontend/components/Hero";
import About from "@/frontend/components/About";
import Assets from "@/frontend/components/Assets";
import OrbitalNotice from "@/frontend/components/OrbitalNotice";
import Updates from "@/frontend/components/Updates";
import FinalCTA from "@/frontend/components/FinalCTA";
import Footer from "@/frontend/components/Footer";
import { getGlobalMarket } from "@/backend/market";
import { getNoticeSlides, getPublicUpdates } from "@/backend/site";

// The Important Update banner and Updates cards (edited at /admin/announcements)
// are read from the database, and the ticker shows current market prices, so
// render on each request rather than once at build time.
export const dynamic = "force-dynamic";

// Kept deliberately short: what ORBITAL is, what it trades, and anything the
// team has posted. Everything else lives on its own page.
export default function Home() {
  return (
    <>
      <Navbar />
      <main className="relative isolate">
        <Hero />
        <About />
        <Assets initialMarket={getGlobalMarket()} />
        <OrbitalNotice slides={getNoticeSlides()} />
        <Updates updates={getPublicUpdates()} />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
