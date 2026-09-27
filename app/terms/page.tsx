import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { orbitalConfig } from "@/config/orbital";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that apply when you trade with ORBITAL.",
};

const { telegramHandle, whatsappDisplay } = orbitalConfig;

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Service"
      updated="27 September 2026"
      intro={`These terms apply whenever you use ORBITAL: this website, our Telegram trading bot (${telegramHandle}) and our WhatsApp support line. By placing a trade with us, you agree to them.`}
      sections={[
        {
          heading: "Who can trade",
          body: [
            "You must be at least 18 years old and able to enter into a binding agreement. Payments to and from ORBITAL must come from, and go to, a bank account in your own name.",
            "We may ask you to confirm your identity before or after a trade, and may decline to trade if we cannot.",
          ],
        },
        {
          heading: "How trades work",
          body: [
            "The bot shows your rate and the total before you confirm. When you buy, you pay the exact amount shown by bank transfer to the ORBITAL account the bot gives you, and we send the crypto to the wallet address you provide. When you sell, you send the crypto to the address the bot shows, and we pay naira into the bank account you provide.",
            "Each trade must be worth between ₦5,000 and ₦50,000,000.",
            "When you sell, your rate is held for 15 minutes from when the deposit address is shown. If you confirm after that, the rate at the time you confirm applies, and the bot tells you.",
          ],
        },
        {
          heading: "Your responsibilities",
          body: [
            "Check every wallet address, network and bank detail before you send. Crypto sent to the wrong address or network usually cannot be recovered, and ORBITAL cannot reverse it.",
            "Only trade with money and crypto that are lawfully yours. Do not use ORBITAL on behalf of someone else without telling us.",
          ],
        },
        {
          heading: "Declined, delayed and returned trades",
          body: [
            "We may pause, decline or cancel a trade, for example if details do not match, a payment comes from a third party, we suspect fraud, or a technical problem stops us completing it safely.",
            "If we cannot complete a trade after receiving your payment or crypto, we return it to where it came from. Any bank or network fees for the return may be deducted.",
          ],
        },
        {
          heading: "Rates and fees",
          body: [
            "Our rates follow live market prices and include ORBITAL's margin. There is no separate service fee unless the bot shows one before you confirm.",
          ],
        },
        {
          heading: "Risks",
          body: [
            "Crypto prices can rise and fall sharply. Nothing ORBITAL says is investment advice, and you trade at your own risk.",
            "Blockchain transactions are final once confirmed on the network.",
          ],
        },
        {
          heading: "Official channels",
          body: [
            `ORBITAL only trades through ${telegramHandle} on Telegram and only offers support on WhatsApp at ${whatsappDisplay}. We are not responsible for losses from dealing with anyone pretending to be ORBITAL. We will never ask for your recovery phrase, private keys or passwords.`,
          ],
        },
        {
          heading: "Our responsibility",
          body: [
            "As far as the law allows, ORBITAL is not liable for indirect losses, or for losses caused by events outside our reasonable control, such as bank, network or platform outages. Nothing in these terms limits rights you have under Nigerian consumer protection law.",
          ],
        },
        {
          heading: "Changes and governing law",
          body: [
            "We may update these terms. The version on this page when you confirm a trade is the one that applies to it.",
            "These terms are governed by the laws of the Federal Republic of Nigeria.",
          ],
        },
        {
          heading: "Contact",
          body: [`Questions about these terms? Message us on WhatsApp at ${whatsappDisplay}.`],
        },
      ]}
    />
  );
}
