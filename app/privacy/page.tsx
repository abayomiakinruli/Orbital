import type { Metadata } from "next";
import LegalPage from "@/frontend/components/LegalPage";
import { PRIVACY_UPDATED, privacyIntro, privacySections } from "@/frontend/content/legal/privacy";

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
