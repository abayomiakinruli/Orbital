import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Services from "@/components/Services";
import Assets from "@/components/Assets";
import WhyOrbital from "@/components/WhyOrbital";
import OrbitalNotice from "@/components/OrbitalNotice";
import Updates from "@/components/Updates";
import FAQ from "@/components/FAQ";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";
import { getPublicRates } from "@/lib/rates";

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
        <OrbitalNotice />
        <WhyOrbital />
        <Updates />
        <Assets initialRates={getPublicRates()} />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
