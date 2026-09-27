import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { TERMS_UPDATED, termsIntro, termsSections } from "@/lib/legal/terms";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms that apply when you use ORBITAL's website, Telegram trading bot and support, including trades, rates, verification and risks.",
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Service"
      updated={TERMS_UPDATED}
      intro={termsIntro}
      sections={termsSections}
    />
  );
}
