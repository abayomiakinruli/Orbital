import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { orbitalConfig } from "@/config/orbital";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What information ORBITAL collects, why, and how you can control it.",
};

const { whatsappDisplay } = orbitalConfig;

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      updated="27 September 2026"
      intro="This policy explains what ORBITAL collects when you use our website, Telegram bot and WhatsApp support, why we need it, and what you can ask us to do with it. We handle personal data in line with the Nigeria Data Protection Act 2023."
      sections={[
        {
          heading: "What we collect",
          body: [
            "From Telegram: your Telegram ID, username and display name, when you start the bot.",
            "About your trades: the coin, amount, rate, Transaction ID, and the wallet addresses and networks involved.",
            "For payouts: the bank account name, number and bank you give us when you sell.",
            "If you subscribe: your email address and the page you signed up on.",
            "On this website: which pages are visited and clicks on our Trade and Support links, counted without cookies, IP addresses or advertising trackers.",
            "When you contact support: the messages you send us on WhatsApp.",
          ],
        },
        {
          heading: "Why we use it",
          body: [
            "To complete your trades and pay you, keep a record of each transaction, prevent fraud, answer your questions, send the updates you signed up for, improve our service, and meet our legal obligations.",
          ],
        },
        {
          heading: "Who we share it with",
          body: [
            "We do not sell your information. We share only what is needed with banks and payment providers to make transfers, with Telegram and WhatsApp as the platforms you use to reach us, and with authorities where the law requires it.",
          ],
        },
        {
          heading: "How long we keep it",
          body: [
            "Trade records are kept for as long as we need them for our records and the law. Your email stays on our list until you ask us to remove it.",
          ],
        },
        {
          heading: "Keeping it safe",
          body: [
            "Your information is stored on servers we control, and only ORBITAL staff who need it can see it.",
          ],
        },
        {
          heading: "Your choices",
          body: [
            "You can ask us for a copy of the information we hold about you, to correct it, or to delete it (unless we must keep a trade record by law), and to remove your email from our list.",
            `Message us on WhatsApp at ${whatsappDisplay} and we will help.`,
          ],
        },
        {
          heading: "Changes",
          body: ["If we change this policy, we will update the date at the top of this page."],
        },
      ]}
    />
  );
}
