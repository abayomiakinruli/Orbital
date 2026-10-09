import type { Metadata } from "next";
import Navbar from "@/frontend/components/Navbar";
import FAQ from "@/frontend/components/FAQ";
import FinalCTA from "@/frontend/components/FinalCTA";
import Footer from "@/frontend/components/Footer";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers to common questions about trading with ORBITAL: supported coins, rates, limits, payments and staying safe.",
};

export default function FAQPage() {
  return (
    <>
      <Navbar />
      <main className="relative isolate">
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
