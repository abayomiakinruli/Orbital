import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { PRIVACY_UPDATED, privacyIntro, privacySections } from "@/lib/legal/privacy";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What personal information ORBITAL collects, why, who it is shared with, how it is protected and the rights you have.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      updated={PRIVACY_UPDATED}
      intro={privacyIntro}
      sections={privacySections}
    />
  );
}
