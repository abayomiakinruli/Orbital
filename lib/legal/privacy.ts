import type { LegalSection } from "@/components/LegalPage";
import { orbitalConfig } from "@/config/orbital";

// The ORBITAL Privacy Policy, rendered by app/privacy/page.tsx. Every data
// practice described here mirrors what the code actually does (see the
// notes beside each section); change them together. This text has not
// been reviewed by a lawyer; have it reviewed before relying on it.

const BOT = orbitalConfig.telegramHandle;
const WA = orbitalConfig.whatsappDisplay;

export const PRIVACY_UPDATED = "27 September 2026";

export const privacyIntro = [
  `This Privacy Policy explains how ORBITAL collects, uses, shares, stores and protects personal information when you use the ORBITAL website, the ORBITAL Telegram trading bot (${BOT}) and ORBITAL customer support on WhatsApp (${WA}).`,
  "ORBITAL handles personal data in line with the Nigeria Data Protection Act 2023 (\"NDPA\") and other data protection laws that apply to it. By accessing, using, or interacting with ORBITAL, you acknowledge that your personal information will be handled as described in this policy. Please read it together with the ORBITAL Terms of Service.",
];

export const privacySections: LegalSection[] = [
  {
    heading: "Introduction",
    body: [
      "Your trust matters to ORBITAL. Trading digital assets requires ORBITAL to handle information such as your name, bank details and wallet addresses, and ORBITAL takes its responsibility for that information seriously.",
      "This policy tells you what information ORBITAL collects, why, the legal basis for using it, who it is shared with, how long it is kept, how it is protected, and the rights you have over it. It also explains the steps you can take to protect yourself.",
    ],
  },
  {
    heading: "Who We Are",
    body: [
      "ORBITAL is a Nigerian digital asset trading business that buys and sells supported digital assets for naira. For the purposes of data protection law, ORBITAL is the data controller of the personal information described in this policy, which means ORBITAL decides why and how it is used.",
      `You can contact ORBITAL about this policy or your personal information through customer support on WhatsApp at ${WA}.`,
    ],
  },
  {
    heading: "Scope of This Policy",
    body: [
      "This policy applies to personal information ORBITAL collects through:",
      "- the ORBITAL website, including the trade tracking page and the email sign up box;",
      `- the ORBITAL Telegram bot, ${BOT};`,
      "- ORBITAL customer support on WhatsApp;",
      "- any other channel ORBITAL publishes as official.",
      "It does not apply to Telegram, WhatsApp, banks, blockchain Networks or any other third party service, which have their own privacy policies. It also does not apply to anyone pretending to be ORBITAL; see section 13.",
    ],
  },
  {
    heading: "Definitions",
    body: [
      `- "Personal information" or "personal data" means any information that identifies you or can reasonably be linked to you.`,
      `- "Processing" means anything done with personal information, including collecting, storing, using, sharing and deleting it.`,
      `- "You" means any person whose personal information ORBITAL processes, including customers and website visitors.`,
      `- "Trade", "Bot", "Official Channels", "Transaction ID" and other capitalised terms have the meanings given in the Terms of Service.`,
    ],
  },
  {
    heading: "Information We Collect",
    body: [
      "### Information from Telegram",
      "When you start the Bot, ORBITAL receives your Telegram user ID, your username (if you have one) and your display name. These identify you as a customer and let the Bot reply to you and tell you when a Trade is completed.",
      "### Information about your trades",
      "For each Trade, ORBITAL records the digital asset, whether you are buying or selling, the amount, the Rate, the naira total, the Quote used, the Transaction ID, the status of the Trade and the dates and times involved.",
      "### Wallet and blockchain information",
      "ORBITAL records the wallet addresses and Networks involved in your Trades, including the address you ask ORBITAL to send digital assets to, and any transaction hashes you or the blockchain provide. Blockchain transactions are public by nature and can be viewed by anyone.",
      "### Bank and payment information",
      "When you sell, ORBITAL collects the account name, account number and bank you give for your payout. When you buy, ORBITAL receives the details of the account that paid ORBITAL, as shown by ORBITAL's bank.",
      "### Verification information",
      "Where ORBITAL asks you to verify your identity, it may collect your full name, date of birth, contact details, government issued identification, Bank Verification Number, proof of address, proof of payment and information about the source of your funds.",
      "### Support communications",
      "When you contact support on WhatsApp, ORBITAL receives your phone number, your WhatsApp name and the messages, images and documents you send. If you report a problem with a Trade from the Bot, ORBITAL records your report.",
      "### Email sign up",
      "If you sign up for ORBITAL updates on the website, ORBITAL stores your email address, the page you signed up on and the date.",
      "### Website usage",
      "ORBITAL counts website visits and clicks on its Trade and Support links, recording only the type of event and the page it happened on. ORBITAL does not use advertising trackers or analytics cookies, and does not store your IP address with these counts.",
      "### Technical information",
      "To protect the website from abuse, ORBITAL briefly holds the IP address of visitors who use the trade tracking page, the email sign up box or the admin login, in memory only, so that it can limit repeated attempts. This information is discarded automatically and is not stored in ORBITAL's database. ORBITAL's hosting provider may also keep standard server logs.",
    ],
  },
  {
    heading: "How We Collect Information",
    body: [
      "ORBITAL collects information:",
      "- directly from you, when you use the Bot, contact support, sign up for updates or provide verification documents;",
      "- automatically, when you use the website or the Bot, as described in section 5;",
      "- from third parties, such as Telegram (your Telegram details), ORBITAL's bank (the details of payments made to ORBITAL) and public blockchains (transaction records).",
      "You are responsible for making sure the information you give ORBITAL is accurate, complete and your own. Giving false information may lead to Trades being declined or cancelled, as explained in the Terms of Service.",
    ],
  },
  {
    heading: "How We Use Your Information",
    body: [
      "ORBITAL uses personal information to:",
      "- provide Quotes and carry out your Trades, including sending digital assets to your wallet and naira to your bank account;",
      "- identify you as a customer and communicate with you about your Trades;",
      "- verify payments, identities and the ownership of bank accounts and wallets;",
      "- prevent, detect and investigate fraud, impersonation, money laundering and other crime;",
      "- keep accurate records of Trades and meet legal and regulatory obligations;",
      "- answer questions, handle complaints and resolve disputes;",
      "- send the ORBITAL updates you signed up for;",
      "- understand how the website is used so ORBITAL can improve it;",
      "- protect the security of ORBITAL's Services, customers and staff.",
      "ORBITAL does not sell your personal information, and does not use it for purposes unrelated to its Services.",
    ],
  },
  {
    heading: "Legal Bases for Processing",
    body: [
      "Under the NDPA, ORBITAL must have a lawful basis for processing personal information. ORBITAL relies on:",
      "- performance of a contract: to provide Quotes and complete the Trades you request;",
      "- legal obligation: to keep records, carry out verification and report where the law requires;",
      "- legitimate interests: to prevent fraud, secure its Services, resolve disputes and improve the website, where these interests are not overridden by your rights;",
      "- consent: to send you ORBITAL updates by email, which you can withdraw at any time.",
    ],
  },
  {
    heading: "Customer Verification",
    body: [
      "ORBITAL may ask you to verify your identity before, during or after a Trade, as explained in the Terms of Service. Verification information is used only to confirm who you are, confirm that bank accounts and wallets belong to you, assess risk, prevent fraud and meet legal obligations.",
      "Verification information is kept securely, is available only to ORBITAL staff who need it, and is kept for as long as the law requires. If you do not provide information ORBITAL reasonably requests, ORBITAL may be unable to complete your Trade.",
    ],
  },
  {
    heading: "Fraud Prevention and Compliance",
    body: [
      "ORBITAL uses personal information to protect customers and itself from fraud and financial crime. This may include checking that payment names match customer names, reviewing unusual Trades, checking wallet addresses against known risks, and keeping records of suspicious activity.",
      "Where ORBITAL is required or permitted by law, it may share information with banks, law enforcement agencies, regulators and other competent authorities to prevent or investigate crime. ORBITAL may not be able to tell you when it does so, where the law does not allow it.",
    ],
  },
  {
    heading: "How We Share Information",
    body: [
      "ORBITAL shares personal information only where it is necessary, and never sells it. ORBITAL may share information with:",
      "- banks and payment providers, to send and receive payments and verify them;",
      "- Telegram and WhatsApp, as the platforms you use to communicate with ORBITAL;",
      "- hosting and technology providers that run ORBITAL's website, Bot and database on ORBITAL's behalf;",
      "- professional advisers, such as lawyers and accountants, where needed;",
      "- law enforcement agencies, regulators, courts and other competent authorities, where the law requires or permits it;",
      "- a successor business, if ORBITAL is reorganised, merged or sold, subject to this policy.",
      "ORBITAL uses market data from third party providers to calculate its Rates. ORBITAL does not share your personal information with those providers.",
    ],
  },
  {
    heading: "Third Party Platforms",
    body: [
      "Telegram and WhatsApp are independent services with their own privacy policies. Information you share through them is also processed by those platforms under their own terms, and ORBITAL does not control how they handle it. Blockchain Networks are public: wallet addresses and transaction details recorded on them can be seen by anyone and cannot be deleted.",
      "Please read the privacy policies of the third party services you use.",
    ],
  },
  {
    heading: "Impersonation and Official Channels",
    body: [
      `ORBITAL only collects personal information through its Official Channels: the ORBITAL website, ${BOT} on Telegram and ${WA} on WhatsApp. Anyone who asks for your information through any other account is not ORBITAL.`,
      "ORBITAL will never ask you for your wallet recovery phrase, private keys, passwords, bank PIN or one time codes. If anyone asks for these, do not share them, and report the request to ORBITAL support.",
    ],
  },
  {
    heading: "International Transfers",
    body: [
      "ORBITAL's own records are kept on servers ORBITAL controls. Some of the third parties ORBITAL relies on, such as Telegram, WhatsApp and hosting providers, may process information outside Nigeria. Where personal information is transferred outside Nigeria, ORBITAL takes reasonable steps to make sure it continues to be protected, in line with the NDPA.",
    ],
  },
  {
    heading: "Data Security",
    body: [
      "ORBITAL uses reasonable technical and organisational measures to protect personal information against loss, misuse, unauthorised access, disclosure and alteration. These include:",
      "- limiting access to customer information to ORBITAL staff who need it for their work;",
      "- protecting the admin panel with a password and secure, signed login sessions;",
      "- limiting repeated attempts on the admin login and the trade tracking page;",
      "- showing only limited trade details on the public tracking page, without names, bank details or wallet addresses;",
      "- storing uploaded files and records outside the public parts of the website;",
      "- keeping software up to date and reviewing security regularly.",
      "No system is completely secure, and ORBITAL cannot guarantee the security of information sent over the internet or through third party platforms. If ORBITAL becomes aware of a personal data breach, it will act in line with section 22.",
    ],
  },
  {
    heading: "Your Security Responsibilities",
    body: [
      "You play an important part in keeping your information safe. You should:",
      "- keep your Telegram account, phone, email, wallets and bank accounts secure, and turn on two step verification;",
      "- never share your recovery phrase, private keys, passwords, PIN or one time codes with anyone;",
      "- use only ORBITAL's Official Channels, and check usernames and numbers carefully;",
      "- keep your Transaction IDs private; anyone with a Transaction ID can see that Trade's status on the tracking page;",
      "- tell ORBITAL immediately if you think your Telegram account or information has been compromised.",
    ],
  },
  {
    heading: "Data Retention",
    body: [
      "ORBITAL keeps personal information only for as long as it is needed for the purposes in this policy, including to meet legal, accounting and record keeping requirements. In general:",
      "- Trade records, payment details and wallet addresses are kept for as long as ORBITAL needs them for its records and to meet legal obligations;",
      "- verification information is kept for the period the law requires;",
      "- support communications are kept for as long as needed to resolve the matter and keep an accurate record;",
      "- your email address is kept until you ask ORBITAL to remove it;",
      "- IP addresses used to limit repeated attempts are held in memory only and discarded automatically, usually within 15 minutes.",
      "When information is no longer needed, ORBITAL deletes it or makes it anonymous.",
    ],
  },
  {
    heading: "Your Rights",
    body: [
      "Under the NDPA, you have the right to:",
      "- be informed about how your personal information is used, which this policy aims to do;",
      "- access the personal information ORBITAL holds about you and receive a copy;",
      "- ask ORBITAL to correct information that is inaccurate or incomplete;",
      "- ask ORBITAL to delete your information, where it is no longer needed and ORBITAL is not required to keep it;",
      "- object to or ask ORBITAL to restrict certain processing;",
      "- withdraw your consent at any time where ORBITAL relies on consent, such as for email updates;",
      "- receive your information in a commonly used format and ask for it to be sent to another organisation, where this applies;",
      "- complain to the Nigeria Data Protection Commission.",
      "Some rights are limited by law. For example, ORBITAL may need to keep Trade records even if you ask for them to be deleted.",
    ],
  },
  {
    heading: "How to Exercise Your Rights",
    body: [
      `To exercise any of your rights, contact ORBITAL support on WhatsApp at ${WA}. To protect your information, ORBITAL may ask you to confirm your identity before acting on your request, for example by confirming a Transaction ID or messaging from the Telegram account linked to your Trades.`,
      "ORBITAL will respond within the time required by law. ORBITAL does not charge for most requests, but may charge a reasonable fee or decline requests that are clearly unfounded or excessive, where the law allows.",
    ],
  },
  {
    heading: "Email Updates",
    body: [
      "If you sign up on the website, ORBITAL may send you updates about new digital assets, trading notices and announcements. ORBITAL only sends these because you asked for them.",
      `You can stop receiving updates at any time by asking ORBITAL support on WhatsApp at ${WA} to remove your email address, or by using any unsubscribe link included in an email. ORBITAL does not share your email address with other businesses for their own marketing.`,
    ],
  },
  {
    heading: "Cookies and Similar Technologies",
    body: [
      "The public ORBITAL website does not use advertising cookies, tracking pixels or third party analytics cookies. Website visits and clicks are counted without cookies, as described in section 5.",
      "The admin panel, which only ORBITAL staff can use, sets one essential cookie to keep staff signed in securely. Your browser may also store small amounts of information needed for the website to work. You can control cookies through your browser settings.",
    ],
  },
  {
    heading: "Personal Data Breaches",
    body: [
      "If ORBITAL becomes aware of a breach of security that affects personal information, it will act promptly to contain it, assess the risk, and notify the Nigeria Data Protection Commission and affected customers where the law requires, telling them what happened and what they can do to protect themselves.",
    ],
  },
  {
    heading: "Automated Processing",
    body: [
      "ORBITAL calculates Rates and Quotes automatically from market data, and the Bot applies trade limits automatically. These calculations do not depend on who you are.",
      "ORBITAL does not make decisions about you that produce legal or similarly significant effects based solely on automated processing of your personal information. Where a Trade is paused or declined for verification or fraud reasons, a member of ORBITAL staff reviews it.",
    ],
  },
  {
    heading: "Children",
    body: [
      "ORBITAL's Services are only for people aged 18 or over. ORBITAL does not knowingly collect personal information from children. If you believe a child has provided ORBITAL with personal information, contact ORBITAL support and ORBITAL will take steps to delete it.",
    ],
  },
  {
    heading: "Links to Other Websites",
    body: [
      "The ORBITAL website contains links to Telegram, WhatsApp and other websites. ORBITAL is not responsible for the content or privacy practices of those websites, and this policy does not apply to them.",
    ],
  },
  {
    heading: "Changes to This Policy",
    body: [
      "ORBITAL may update this policy from time to time, for example to reflect changes to its Services or the law. The updated policy will be published on the website with a new \"Last updated\" date. Where changes are significant, ORBITAL will take reasonable steps to let customers know. Continuing to use ORBITAL after an update means you acknowledge the updated policy.",
    ],
  },
  {
    heading: "Contact and Complaints",
    body: [
      `For questions about this policy, to exercise your rights, or to make a complaint about how ORBITAL has handled your personal information, contact ORBITAL support on WhatsApp at ${WA}. ORBITAL will do its best to resolve your concern.`,
      "If you are not satisfied with ORBITAL's response, you have the right to complain to the Nigeria Data Protection Commission.",
    ],
  },
];
