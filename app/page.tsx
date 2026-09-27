import Navbar from "@/frontend/components/Navbar";
import Hero from "@/frontend/components/Hero";
import About from "@/frontend/components/About";
import Services from "@/frontend/components/Services";
import Assets from "@/frontend/components/Assets";
import WhyOrbital from "@/frontend/components/WhyOrbital";
import OrbitalNotice from "@/frontend/components/OrbitalNotice";
import Updates from "@/frontend/components/Updates";
import FAQ from "@/frontend/components/FAQ";
import FinalCTA from "@/frontend/components/FinalCTA";
import Footer from "@/frontend/components/Footer";
import { getPublicRates } from "@/backend/rates";
import { getNoticeSlides, getPublicUpdates } from "@/backend/site";

// The Important Update banner, Updates cards (edited at /admin/announcements) and
// ORBITAL rates are read from the database, so render on each request rather
// than once at build time.
export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="relative isolate">
        <Hero />
        <About />
        <Services />
        <OrbitalNotice slides={getNoticeSlides()} />
        <WhyOrbital />
        <Updates updates={getPublicUpdates()} />
        <Assets initialRates={getPublicRates()} />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
