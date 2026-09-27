import type { LegalSection } from "@/components/LegalPage";
import { orbitalConfig } from "@/config/orbital";

// The ORBITAL Terms of Service, rendered by app/terms/page.tsx. Operational
// details here (limits, quote and rate lock timings, statuses, channels)
// mirror how the bot and backend actually behave; keep them in step with
// bot/index.ts and app/api/bot/quote/route.ts. This text has not been
// reviewed by a lawyer; have it reviewed before relying on it.

const BOT = orbitalConfig.telegramHandle;
const WA = orbitalConfig.whatsappDisplay;

export const TERMS_UPDATED = "27 September 2026";

export const termsIntro = [
  `These Terms of Service ("Terms") govern your access to and use of ORBITAL, including the ORBITAL website, the ORBITAL Telegram trading bot (${BOT}), ORBITAL customer support on WhatsApp (${WA}), and every trade, quote, payment and communication made through them.`,
  "Please read these Terms carefully. They contain important information about how trades work, the risks of digital assets, your responsibilities, the limits of ORBITAL's liability and how disputes are resolved. By accessing, using, or interacting with ORBITAL in any way, you confirm that you have read, understood and agree to be bound by these Terms. If you do not agree, you must not use ORBITAL.",
];

export const termsSections: LegalSection[] = [
  {
    heading: "Introduction",
    body: [
      "ORBITAL provides a simple way for customers to buy and sell selected digital assets using Nigerian naira. These Terms form a legally binding agreement between you and ORBITAL and apply every time you visit the website, start or use the Telegram bot, contact customer support, or place a trade.",
      "These Terms should be read together with the ORBITAL Privacy Policy, which explains how ORBITAL collects and uses personal information, and with any instructions, notices, limits or procedures shown to you in the Telegram bot at the time of a trade. Where the bot shows you specific instructions for a particular trade, those instructions form part of the agreement for that trade.",
      "Nothing in these Terms is intended to remove any right you have that cannot lawfully be excluded under the laws that apply to you.",
    ],
  },
  {
    heading: "About ORBITAL",
    body: [
      "ORBITAL is a Nigerian digital asset trading business. ORBITAL buys digital assets from customers and sells digital assets to customers at rates that ORBITAL quotes, with payments made in naira by bank transfer.",
      "### The website",
      "The ORBITAL website is an information and customer service platform. It explains who ORBITAL is and how its services work, shows indicative rates, publishes announcements and updates, lets customers check the status of a trade using a Transaction ID, and links to ORBITAL's official channels.",
      "The website does not itself execute trades. Rates shown on the website are for information only and may differ from the rate you are quoted in the Telegram bot.",
      "### The trading channel",
      `Actual trading is carried out only through ORBITAL's designated trading channel, which is the ORBITAL Telegram bot (${BOT}). Every quote, order, payment instruction and deposit address you rely on must come from that bot.`,
      "### Customer support",
      `ORBITAL provides customer support on WhatsApp at ${WA}. Support can answer questions and help with transactions, but support staff will not ask you to trade outside the official bot, will not send you a different payment account or deposit address from the one shown in the bot, and will never ask for your wallet recovery phrase, private keys or passwords.`,
      "### No claim of licences or approvals",
      "ORBITAL does not claim to hold any banking licence, securities licence, virtual asset service provider registration, insurance, deposit protection, or regulatory approval unless ORBITAL expressly tells you so in writing. Digital assets you buy from or sell to ORBITAL are not bank deposits and are not protected by any deposit insurance scheme.",
    ],
  },
  {
    heading: "Definitions and Interpretation",
    body: [
      "In these Terms, the following words have the meanings below:",
      `- "ORBITAL", "we", "us" and "our" mean the ORBITAL digital asset trading business and the people who operate it.`,
      `- "You", "your" and "Customer" mean any person who accesses the website, uses the Telegram bot, contacts support or places a trade.`,
      `- "Services" means everything ORBITAL provides, including the website, the Telegram bot, quotes, trades, trade tracking, announcements and customer support.`,
      `- "Telegram Bot" or "Bot" means the official ORBITAL Telegram bot, ${BOT}, and no other account.`,
      `- "Official Channels" means the ORBITAL website, the Telegram Bot and ORBITAL WhatsApp support at ${WA}, and any other channel ORBITAL publishes on its website as official.`,
      `- "Digital Asset" means a cryptocurrency or stablecoin that ORBITAL supports from time to time, such as BTC, USDT, USDC and SOL.`,
      `- "Trade" means a transaction in which you buy a Digital Asset from ORBITAL or sell a Digital Asset to ORBITAL.`,
      `- "Quote" means a rate the Bot gives you for a proposed Trade, together with its expiry time.`,
      `- "Rate" means the naira price per unit of a Digital Asset at which ORBITAL is willing to buy or sell, including ORBITAL's margin.`,
      `- "Transaction ID" means the unique reference ORBITAL assigns to a Trade, beginning with "ORBT".`,
      `- "Wallet Address" means a blockchain address to which Digital Assets can be sent.`,
      `- "Network" means the blockchain on which a Digital Asset is sent, such as a particular token standard or chain.`,
      `- "Blockchain Confirmation" means the recording of a transfer on the relevant Network to the degree ORBITAL requires before treating it as received.`,
      "In these Terms, headings are for convenience only; the words \"including\" and \"for example\" do not limit what comes before them; the singular includes the plural; and a reference to a law includes that law as amended or replaced.",
    ],
  },
  {
    heading: "Acceptance of These Terms",
    body: [
      "By accessing, using, or interacting with ORBITAL, including by browsing the website, starting the Bot, requesting a Quote, confirming a Trade, sending a payment or Digital Asset, or contacting support, you accept these Terms.",
      "You acknowledge and agree that:",
      "- you have read and understood these Terms and the Privacy Policy;",
      "- you are entering into these Terms for yourself and not on behalf of anyone else, unless ORBITAL has agreed otherwise in writing;",
      "- the version of these Terms published on the website at the time you confirm a Trade applies to that Trade;",
      "- you will follow the instructions the Bot gives you for each Trade.",
      "If you do not accept these Terms, or any later changes to them, you must stop using ORBITAL.",
    ],
  },
  {
    heading: "Eligibility to Use ORBITAL",
    body: [
      "To use ORBITAL you must:",
      "- be at least 18 years old and have full legal capacity to enter into a binding contract;",
      "- use a Nigerian bank account held in your own name for any naira payment to or from ORBITAL;",
      "- use Digital Assets and funds that lawfully belong to you;",
      "- not be subject to any sanctions, court order or legal restriction that prevents you from trading;",
      "- not have been previously suspended or barred from using ORBITAL.",
      "ORBITAL may, where reasonably necessary, ask you to prove that you meet these requirements. ORBITAL reserves the right to refuse, pause or cancel any Trade, or to stop providing Services to anyone, where eligibility is in doubt.",
    ],
  },
  {
    heading: "Geographic Availability",
    body: [
      "ORBITAL is designed for customers in Nigeria who can send and receive naira by bank transfer. Customers outside Nigeria may view the website, but ORBITAL can only complete a Trade where the naira side of the Trade uses a Nigerian bank account in the customer's own name.",
      "You are responsible for making sure that using ORBITAL is lawful where you are. ORBITAL does not offer its Services in any place where doing so would be unlawful, and may decline Trades connected to any location it reasonably believes presents legal or compliance risk.",
    ],
  },
  {
    heading: "Description of ORBITAL Services",
    body: [
      "ORBITAL provides the following Services:",
      "- quotes for buying and selling supported Digital Assets in naira;",
      "- buying Digital Assets from ORBITAL, paid for by naira bank transfer;",
      "- selling Digital Assets to ORBITAL, paid out in naira to your bank account;",
      "- a Transaction ID for every Trade, and trade status tracking on the website;",
      "- announcements, updates and educational information on the website;",
      "- customer support on WhatsApp.",
      "ORBITAL is a trading counterparty, not a custodian. ORBITAL does not hold Digital Assets or naira on your behalf between Trades, does not operate customer accounts or wallets, and does not provide lending, staking, margin trading, derivatives or investment management.",
    ],
  },
  {
    heading: "Supported Digital Assets",
    body: [
      "ORBITAL currently supports Bitcoin (BTC), Tether (USDT), USD Coin (USDC) and Solana (SOL). The Bot shows the Digital Assets available at any given time, and that list is the authoritative one.",
      "ORBITAL may add, suspend or remove a Digital Asset or Network at any time, for example because of market conditions, liquidity, Network problems, security concerns or legal requirements. Removing a Digital Asset does not affect a Trade that ORBITAL has already confirmed, unless completing it has become unlawful or technically impossible, in which case section 34 applies.",
      "Each Digital Asset may only be sent on the Networks the Bot lists for it. A Digital Asset sent on any other Network may be permanently lost.",
    ],
  },
  {
    heading: "Buying Digital Assets",
    body: [
      "When you buy a Digital Asset from ORBITAL, the process is:",
      "- you choose Buy and the Digital Asset in the Bot;",
      "- you enter the amount of the Digital Asset you want, and the Bot shows the Rate and the total naira amount;",
      "- you choose the Network and provide the Wallet Address where you want to receive the Digital Asset;",
      "- the Bot shows ORBITAL's payment account and the exact naira amount to pay;",
      "- you pay that exact amount by bank transfer from a bank account in your own name, and then confirm in the Bot that you have paid;",
      "- ORBITAL verifies your payment and sends the Digital Asset to your Wallet Address.",
      "You are responsible for the Wallet Address and Network you provide. ORBITAL sends the Digital Asset to exactly the address you give. ORBITAL is not responsible for Digital Assets sent to a Wallet Address or Network you provided incorrectly.",
      "A buy Trade is not complete until ORBITAL has verified your payment. ORBITAL may pause a buy Trade while it verifies payment, and section 18 applies.",
    ],
  },
  {
    heading: "Selling Digital Assets",
    body: [
      "When you sell a Digital Asset to ORBITAL, the process is:",
      "- you choose Sell and the Digital Asset in the Bot and enter the amount you want to sell;",
      "- you give the account name, account number and bank of your own Nigerian bank account;",
      "- the Bot locks your Rate, shows the naira amount you will receive and shows ORBITAL's deposit address and Network;",
      "- you send the exact amount of the Digital Asset to that deposit address on that Network, and then confirm in the Bot that you have sent it;",
      "- once ORBITAL has received the Digital Asset with the required Blockchain Confirmations, ORBITAL pays the naira amount into your bank account.",
      "### Rate lock for sellers",
      "When the Bot shows you the deposit address for a sell Trade, your Rate is locked for 15 minutes. If you send and confirm within that time, ORBITAL pays you at the locked Rate. If you confirm after the lock has expired, the Rate at the time you confirm applies, and the Bot tells you that your payout was updated.",
      "Always send only to the deposit address the Bot shows for that Trade. Deposit addresses may change between Trades, and ORBITAL is not responsible for Digital Assets sent to an address that was not shown to you by the Bot for that Trade.",
    ],
  },
  {
    heading: "Trading Through the ORBITAL Telegram Bot",
    body: [
      `The Telegram Bot is the only channel through which ORBITAL accepts Trades. The official Bot is ${BOT}. Before every Trade, check that you are talking to that exact username.`,
      "You acknowledge and agree that:",
      "- ORBITAL does not accept Trades by WhatsApp, SMS, email, social media messages or phone calls;",
      "- ORBITAL will never message you first asking you to pay or to send Digital Assets;",
      "- any payment account or deposit address that does not come from the Bot during your Trade must not be used;",
      "- you are responsible for the security of your own Telegram account, and ORBITAL may act on instructions given from it (see section 37).",
      "Telegram is a third party service. ORBITAL does not control Telegram and is not responsible for its availability, security or behaviour (see sections 38 and 39).",
    ],
  },
  {
    heading: "How Orders and Trade Requests Work",
    body: [
      "### Requesting a Trade",
      "Choosing a Digital Asset and amount in the Bot is a request for a Quote. It is not a binding Trade.",
      "### Quotes",
      "A Quote shows the Rate and the naira total for your request, and is valid only for a short time. Normal Quotes are valid for about 60 seconds; the rate lock for sellers described in section 10 lasts 15 minutes. After a Quote expires, a new Quote at the current Rate is needed.",
      "### Confirming a Trade",
      "A Trade is created when you confirm in the Bot that you have paid (for a buy) or sent the Digital Asset (for a sell). At that point ORBITAL issues a Transaction ID and the Trade is shown as Processing.",
      "### Trade statuses",
      "- Processing: ORBITAL has recorded your Trade and is verifying and completing it.",
      "- Successful: ORBITAL has completed its side of the Trade.",
      "- Failed: the Trade could not be completed; section 25 and section 34 explain what happens next.",
      "You can check the status of any Trade on the website using your Transaction ID, and the Bot messages you when a Trade is completed or fails.",
      "### ORBITAL's right to decline",
      "ORBITAL reserves the right to decline any request for a Quote or Trade, at any stage and without giving reasons, where it reasonably believes this is necessary, including for fraud prevention, compliance, pricing errors, technical problems or liquidity.",
    ],
  },
  {
    heading: "Rate Calculations",
    body: [
      "ORBITAL calculates its Rates automatically. In summary:",
      "- ORBITAL takes a naira reference price for USDT from market data;",
      "- for other Digital Assets, ORBITAL multiplies that reference by the Digital Asset's market price in USDT;",
      "- ORBITAL then applies its trading margin to produce a buy Rate and a sell Rate.",
      "ORBITAL may also set a Rate manually. ORBITAL may use different margins for larger Trades. The Rate that applies to your Trade is always the Rate shown to you in the Bot for that Trade, not a Rate shown elsewhere, including on the website or in announcements.",
      "ORBITAL does not show a Rate when its market data is too old to be reliable. If Rates are unavailable, the Bot will tell you and you will not be able to trade until Rates are available again.",
    ],
  },
  {
    heading: "Real Time and Variable Cryptocurrency Prices",
    body: [
      "Digital Asset prices change continuously, sometimes very quickly and by large amounts. You acknowledge and agree that:",
      "- the Rate may change between the moment you look at it and the moment you confirm a Trade;",
      "- Rates shown on the website are indicative only and are refreshed periodically, not continuously;",
      "- a Quote is only valid until its expiry time, and a new Quote may be higher or lower;",
      "- ORBITAL is not responsible for any loss you suffer because a Rate moved before your Trade was confirmed, or because the market price moved after your Trade was completed.",
    ],
  },
  {
    heading: "ORBITAL Trading Margins and Fees",
    body: [
      "ORBITAL earns revenue from the margin built into its Rates, meaning the difference between the market reference price and ORBITAL's buy or sell Rate. The margin may vary by Digital Asset, by the size of the Trade and over time.",
      "ORBITAL does not charge a separate service fee unless the Bot shows it to you before you confirm the Trade.",
      "Fees charged by third parties are separate and are your responsibility, including:",
      "- fees your bank charges for sending or receiving a transfer;",
      "- Network fees for Digital Assets you send to ORBITAL;",
      "- fees charged by your own wallet or exchange.",
      "Where ORBITAL has to return funds or Digital Assets to you (see section 34), any bank or Network fees for the return may be deducted from the amount returned.",
    ],
  },
  {
    heading: "Minimum and Maximum Transaction Limits",
    body: [
      "Each Trade must be worth at least ₦5,000 and no more than ₦50,000,000, calculated at the Rate quoted for the Trade. The Bot will not accept a Trade outside these limits.",
      "ORBITAL may change these limits at any time, set different limits for different Digital Assets or customers, or set daily or other cumulative limits, including where verification (section 31) has not been completed. The limits shown by the Bot at the time of your Trade apply.",
      "Splitting one Trade into several smaller Trades to avoid a limit or verification requirement is not allowed and may lead to the Trades being paused or cancelled.",
    ],
  },
  {
    heading: "Payment Procedures",
    body: [
      "For a buy Trade, you must:",
      "- pay only to the ORBITAL payment account shown by the Bot for that Trade;",
      "- pay the exact naira amount shown, in a single transfer;",
      "- pay from a bank account held in your own name;",
      "- confirm in the Bot only after you have actually made the payment.",
      "For a sell Trade, ORBITAL pays the naira amount only to the bank account you provide in the Bot, which must be in your own name. ORBITAL is not responsible for payments made to an account you provided incorrectly.",
      "ORBITAL does not accept cash, cheques, card payments, third party payments or payments from business accounts that do not belong to you, unless ORBITAL has agreed otherwise in writing before the Trade.",
    ],
  },
  {
    heading: "Payment Verification",
    body: [
      "ORBITAL must verify every payment before completing a Trade. Verification may include checking that:",
      "- the payment has arrived in ORBITAL's account and has cleared;",
      "- the amount matches the Trade exactly;",
      "- the name on the sending account matches the customer;",
      "- the payment is not connected to fraud, a reversal request or a suspicious pattern.",
      "ORBITAL reserves the right to delay completing a Trade until it is satisfied with the verification, and to ask you for further information. A payment that does not match the Trade may be returned rather than accepted, and section 34 applies.",
    ],
  },
  {
    heading: "Proof of Payment",
    body: [
      "ORBITAL may ask you for proof of payment, such as a bank transfer receipt or statement showing the transfer, the amount, the date, and the sending account name.",
      "You agree to provide genuine, unedited proof of payment when asked. Providing false, altered or misleading proof of payment is prohibited, will lead to the Trade being cancelled, and may be reported to the relevant authorities.",
      "Proof of payment helps ORBITAL investigate a delayed or missing payment, but a receipt alone does not complete a Trade. ORBITAL completes a Trade only once the payment has actually been received and verified.",
    ],
  },
  {
    heading: "Cryptocurrency Transfer Procedures",
    body: [
      "When you send a Digital Asset to ORBITAL, you must:",
      "- send only the Digital Asset and amount agreed in the Trade;",
      "- send only to the deposit address the Bot showed you for that Trade;",
      "- use only the Network the Bot showed you for that address;",
      "- send from a wallet or exchange account you control.",
      "When ORBITAL sends a Digital Asset to you, ORBITAL sends it to the Wallet Address and Network you provided in the Bot. Once ORBITAL has broadcast the transfer to the Network, the transfer is outside ORBITAL's control.",
    ],
  },
  {
    heading: "Wallet Addresses",
    body: [
      "You are solely responsible for every Wallet Address you give ORBITAL. Before submitting a Wallet Address, you must check that:",
      "- the address is correct, complete and copied exactly;",
      "- the address belongs to you or to a wallet you control;",
      "- the address supports the Digital Asset and the Network you selected;",
      "- any memo, tag or similar field required by your wallet or exchange is correct.",
      "ORBITAL may refuse a Wallet Address that appears invalid, belongs to a service that ORBITAL reasonably considers high risk, or is linked to fraud or sanctions.",
    ],
  },
  {
    heading: "Incorrect Wallet Addresses",
    body: [
      "You acknowledge and agree that Digital Assets sent to an incorrect Wallet Address, or on the wrong Network, are usually lost permanently and cannot be recovered by ORBITAL or anyone else.",
      "If you provide an incorrect Wallet Address or choose the wrong Network, ORBITAL is not responsible for the loss, and the Trade is treated as completed once ORBITAL has sent the Digital Asset as you instructed.",
      "If you send a Digital Asset to ORBITAL on the wrong Network, to an old or incorrect ORBITAL address, or in an amount that does not match your Trade, ORBITAL may be unable to identify or recover it. ORBITAL will make reasonable efforts to help where recovery is technically possible, but does not promise recovery, and may charge the reasonable cost of any recovery attempt.",
    ],
  },
  {
    heading: "Blockchain Confirmations",
    body: [
      "A Digital Asset transfer is not treated as received until it has the number of Blockchain Confirmations ORBITAL requires for that Digital Asset and Network. The time this takes depends on the Network, not on ORBITAL.",
      "ORBITAL completes the naira side of a sell Trade only after the required confirmations. A transaction hash or screenshot from your wallet is helpful for investigation but does not replace confirmation on the Network.",
    ],
  },
  {
    heading: "Network Fees and Blockchain Delays",
    body: [
      "Blockchain Networks charge fees and can become congested. You acknowledge and agree that:",
      "- you must pay any Network fee needed for Digital Assets you send to ORBITAL, and ORBITAL receives only the amount that arrives;",
      "- if the amount that arrives is less than the amount in the Trade, ORBITAL may pay out based on the amount actually received;",
      "- Network congestion, outages, forks or upgrades can delay transfers, and ORBITAL is not responsible for such delays;",
      "- ORBITAL may pause transfers on a Network while it is experiencing problems.",
    ],
  },
  {
    heading: "Failed, Pending, or Delayed Transactions",
    body: [
      "A Trade may remain Processing for longer than usual, or may fail, for reasons including incomplete payment, verification checks, Network delays, bank delays, incorrect details or technical problems.",
      "Where a Trade is delayed, ORBITAL will work to complete it as soon as reasonably possible. Where a Trade fails, the Bot will tell you and ORBITAL will return what it received from you in line with section 34.",
      "You can check the status of a Trade on the website at any time using its Transaction ID, and you can contact support on WhatsApp. Please have your Transaction ID ready.",
    ],
  },
  {
    heading: "Irreversible Transactions",
    body: [
      "You acknowledge and agree that Digital Asset transfers are generally irreversible. Once a transfer has been broadcast to a Network, neither ORBITAL nor you can cancel, reverse or recall it.",
      "For this reason, ORBITAL cannot reverse a Digital Asset transfer made to the Wallet Address you provided, and cannot recover Digital Assets you sent to the wrong address or Network. Bank transfers may also be difficult or impossible to reverse once made. Check every detail before you send anything.",
    ],
  },
  {
    heading: "Customer Responsibilities",
    body: [
      "You are responsible for:",
      "- providing accurate, complete and current information, including your name, bank details and Wallet Addresses;",
      "- checking every detail of a Trade before confirming it;",
      "- paying the exact amount, to the exact account, from your own bank account;",
      "- sending the exact Digital Asset, amount and Network to the exact deposit address shown by the Bot;",
      "- using only ORBITAL's Official Channels;",
      "- keeping your Telegram account, phone, email, wallets and bank accounts secure;",
      "- keeping your Transaction IDs and payment receipts;",
      "- responding promptly and truthfully to verification requests;",
      "- complying with all laws that apply to you, including tax obligations on your Trades.",
      "ORBITAL is not responsible for losses caused by your failure to meet these responsibilities.",
    ],
  },
  {
    heading: "Prohibited Activities",
    body: [
      "You must not use ORBITAL to:",
      "- trade with funds or Digital Assets that are stolen, obtained by fraud, or otherwise unlawful;",
      "- launder money, finance terrorism, evade sanctions or commit any other crime;",
      "- trade on behalf of another person without ORBITAL's written agreement;",
      "- use someone else's bank account, identity or Telegram account;",
      "- provide false information, fake proof of payment or altered documents;",
      "- split Trades to avoid limits or verification;",
      "- impersonate ORBITAL or its staff, or create accounts or channels that appear to be ORBITAL;",
      "- interfere with, attack, test or overload ORBITAL's website, Bot or systems, or attempt to access them without permission;",
      "- exploit a pricing error, bug or technical problem for your benefit;",
      "- harass, threaten or abuse ORBITAL staff.",
      "ORBITAL reserves the right to cancel Trades, withhold completion while it investigates, stop providing Services and report activity to the relevant authorities where it reasonably suspects a prohibited activity.",
    ],
  },
  {
    heading: "Fraud Prevention",
    body: [
      "Protecting customers and ORBITAL from fraud is a priority. ORBITAL may, where reasonably necessary:",
      "- delay a Trade while it checks a payment, a Wallet Address or a customer's identity;",
      "- ask for proof of payment, identification or an explanation of the source of funds;",
      "- decline or cancel Trades that show signs of fraud;",
      "- refuse Services to customers linked to fraud;",
      "- share information with banks, other businesses and authorities where needed to prevent or investigate fraud, in line with the Privacy Policy.",
      `To protect yourself, remember that ORBITAL will never ask for your wallet recovery phrase, private keys, passwords, bank PIN or one time codes, never messages you first asking for payment, and only trades through ${BOT}.`,
    ],
  },
  {
    heading: "Anti Money Laundering Requirements",
    body: [
      "ORBITAL is committed to preventing its Services from being used for money laundering, terrorist financing or other financial crime, and to complying with the anti money laundering laws that apply to it.",
      "To support this, ORBITAL may:",
      "- verify customers' identities and the ownership of bank accounts and wallets;",
      "- monitor Trades for unusual size, frequency or patterns;",
      "- ask customers about the source of their funds or Digital Assets;",
      "- keep records of Trades and verification checks;",
      "- decline, delay or cancel Trades, and report suspicious activity to the relevant authorities where required or permitted by law.",
      "ORBITAL may not be able to tell you that it has made a report or is carrying out a check, where the law does not allow it.",
    ],
  },
  {
    heading: "Know Your Customer and Customer Verification",
    body: [
      "ORBITAL may ask you to verify your identity before, during or after a Trade, and may require verification before allowing Trades above certain amounts. Verification may include:",
      "- your full name, date of birth and contact details;",
      "- a valid government issued photo identification;",
      "- your Bank Verification Number or proof that a bank account is in your name;",
      "- proof of address;",
      "- information about the source of your funds or Digital Assets.",
      "You agree to provide accurate and genuine information and documents when asked. ORBITAL reserves the right to decline or pause Trades until verification is complete, and to stop providing Services where verification cannot be completed. ORBITAL handles verification information in line with the Privacy Policy.",
    ],
  },
  {
    heading: "Suspicious Transactions",
    body: [
      "A Trade may be treated as suspicious where, for example, the payment comes from a third party, the names do not match, the amount or pattern is unusual for the customer, the Wallet Address is linked to fraud, scams or sanctioned parties, or the customer will not answer reasonable verification questions.",
      "Where ORBITAL reasonably considers a Trade suspicious, ORBITAL may hold, decline or cancel it, ask for more information, return funds only to their source, and report it to the relevant authorities. ORBITAL is not liable for any loss or delay that results from acting in good faith on a reasonable suspicion.",
    ],
  },
  {
    heading: "Transaction Cancellation",
    body: [
      "### Cancellation by you",
      "You may cancel a Trade in the Bot at any time before you pay or send a Digital Asset. Once you have paid or sent a Digital Asset, you cannot cancel a Trade yourself; contact support and ORBITAL will consider your request, but ORBITAL is not obliged to cancel a Trade it has started to process.",
      "### Cancellation by ORBITAL",
      "ORBITAL may cancel a Trade, including one that has been confirmed, where:",
      "- the payment or Digital Asset received does not match the Trade;",
      "- verification cannot be completed;",
      "- ORBITAL reasonably suspects fraud, a prohibited activity or a legal risk;",
      "- the Trade was quoted at an obviously wrong Rate because of an error (see section 49);",
      "- completing the Trade has become unlawful or technically impossible.",
      "Where ORBITAL cancels a Trade after receiving your payment or Digital Asset, section 34 applies.",
    ],
  },
  {
    heading: "Refunds and Reversals",
    body: [
      "Where a Trade is cancelled or fails after ORBITAL has received your payment or Digital Asset, ORBITAL will return what it received, as follows:",
      "- naira payments are returned to the bank account they came from;",
      "- Digital Assets are returned to the sending address where possible, or to an address you prove you control;",
      "- any bank charges or Network fees for the return may be deducted;",
      "- the amount returned is the amount received, not a recalculated value, so market movements in the meantime do not change it.",
      "ORBITAL will not return funds to a different person or account from the one that paid. Where the law or an investigation requires ORBITAL to hold funds, ORBITAL may do so until it is allowed to release them. Completed Trades are final and are not refunded because the market price changed afterwards.",
    ],
  },
  {
    heading: "Disputes",
    body: [
      "If you believe something has gone wrong with a Trade, contact ORBITAL support on WhatsApp as soon as possible and give your Transaction ID, a description of the problem and any proof you have, such as a payment receipt or transaction hash.",
      "ORBITAL will review your complaint, may ask for more information, and will aim to respond within a reasonable time. ORBITAL's records of Quotes, Trades, payments and Blockchain transfers will be used to resolve the dispute. Section 61 explains what happens if a dispute cannot be resolved this way.",
    ],
  },
  {
    heading: "Chargebacks",
    body: [
      "You must not ask your bank to reverse, recall or dispute a payment you made to ORBITAL for a Trade that ORBITAL completed or is processing in line with these Terms.",
      "If you do, ORBITAL may suspend your use of the Services, recover the amount and any costs from you, provide your Trade records to your bank to contest the reversal, and report the matter as potential fraud. If a reversed payment relates to a Trade in which ORBITAL has already sent you a Digital Asset, you remain liable to pay ORBITAL for it.",
    ],
  },
  {
    heading: "Account, Telegram, and Communication Security",
    body: [
      "You are responsible for the security of your Telegram account, phone, email, wallets and bank accounts. In particular you should:",
      "- turn on two step verification in Telegram and your bank and wallet apps;",
      "- never share passwords, PINs, one time codes, recovery phrases or private keys with anyone, including anyone claiming to be ORBITAL;",
      `- check that you are talking to ${BOT} and to ${WA} before sharing any information;`,
      "- tell ORBITAL immediately if you think your Telegram account has been compromised.",
      "ORBITAL may treat instructions given from your Telegram account as coming from you. ORBITAL is not responsible for losses caused by someone else using your Telegram account, phone or bank account, or by your dealing with someone pretending to be ORBITAL.",
    ],
  },
  {
    heading: "Third Party Platforms and Services",
    body: [
      "ORBITAL relies on third parties to provide its Services, including Telegram, WhatsApp, banks and payment networks, blockchain Networks, market data providers and hosting providers.",
      "You acknowledge and agree that ORBITAL does not control these third parties and is not responsible for their availability, errors, delays, security incidents, fees or policies. Your use of a third party service is also governed by that third party's own terms. Links to third party websites are provided for convenience only and are not endorsements.",
    ],
  },
  {
    heading: "Telegram Disclaimer",
    body: [
      "Telegram is an independent messaging service and is not owned, operated or controlled by ORBITAL. ORBITAL does not guarantee that Telegram will be available, will deliver messages, or will be free from interruptions, errors or security problems.",
      "If Telegram is unavailable, you may be unable to start or complete a Trade until it is restored. ORBITAL is not responsible for losses caused by Telegram outages, account restrictions, message delays or changes to Telegram's service. Anyone can create a Telegram account with a name similar to ORBITAL's; only the exact username shown in these Terms is official.",
    ],
  },
  {
    heading: "Website Disclaimer",
    body: [
      "The website provides information about ORBITAL and its Services. It does not execute Trades, and nothing on it is an offer to trade at a particular Rate.",
      "ORBITAL tries to keep the website accurate and up to date, but the information on it, including Rates, rate changes, announcements and trade status, is provided as is and may be delayed, incomplete or changed without notice. The Rate that applies to a Trade is the one shown in the Bot for that Trade. ORBITAL does not guarantee that the website will always be available or free from errors.",
    ],
  },
  {
    heading: "Cryptocurrency Risk Disclosure",
    body: [
      "Digital Assets involve significant risk, and you should only trade amounts you can afford to lose. Risks include:",
      "- prices can fall or rise sharply and quickly, and may fall to zero;",
      "- stablecoins such as USDT and USDC can lose their intended value;",
      "- transfers are usually irreversible and mistakes are usually permanent;",
      "- Networks can suffer delays, outages, forks and attacks;",
      "- laws and regulations about Digital Assets can change and may affect their value or use;",
      "- Digital Assets are not legal tender, are not bank deposits and are not protected by deposit insurance;",
      "- scams and impersonation are common in the Digital Asset market.",
      "By using ORBITAL you confirm that you understand these risks and accept them.",
    ],
  },
  {
    heading: "Market Volatility",
    body: [
      "Digital Asset markets are open all the time and can move sharply at any hour, including because of news, regulation, market events or technical problems. Volatility can mean that the Rate for a new Quote differs significantly from an earlier one, that ORBITAL temporarily stops quoting a Digital Asset, or that ORBITAL applies different Rates to larger Trades.",
      "ORBITAL is not responsible for any loss you suffer because of market volatility, whether before, during or after a Trade.",
    ],
  },
  {
    heading: "No Investment Advice",
    body: [
      "ORBITAL provides a trading service only. Nothing ORBITAL says or publishes, including on the website, in the Bot, in announcements, in adverts or in support conversations, is investment, financial, legal or tax advice, or a recommendation to buy, sell or hold any Digital Asset.",
      "You are solely responsible for deciding whether a Trade is right for you. You should seek independent professional advice if you are unsure.",
    ],
  },
  {
    heading: "No Guarantee of Profit",
    body: [
      "ORBITAL does not promise or guarantee that any Digital Asset will keep or increase its value, or that you will make a profit from any Trade. Past price movements are not a guide to future prices. You may lose some or all of the value of Digital Assets you buy.",
    ],
  },
  {
    heading: "Technology and Blockchain Risks",
    body: [
      "ORBITAL's Services depend on software, internet connections, third party platforms and blockchain Networks, all of which can fail. Risks include software bugs, Network forks, changes to Network rules, smart contract problems, congestion and loss of connectivity.",
      "ORBITAL works to reduce these risks but cannot remove them, and is not responsible for losses caused by failures of technology it does not control.",
    ],
  },
  {
    heading: "Cybersecurity Risks",
    body: [
      "No online service can be made completely secure. Risks include hacking, phishing, malware, SIM swap attacks, fake websites and fake Telegram or WhatsApp accounts pretending to be ORBITAL.",
      "ORBITAL takes reasonable technical and organisational measures to protect its systems and customer information, as described in the Privacy Policy. You are responsible for protecting your own devices and accounts, and for only using ORBITAL's Official Channels. ORBITAL will never ask for your recovery phrase, private keys, passwords or one time codes.",
    ],
  },
  {
    heading: "Service Availability",
    body: [
      "ORBITAL aims to make its Services available as much as possible but does not guarantee that they will be available at any particular time, or without interruption.",
      "Services may be unavailable or limited, for example because Rates cannot be calculated reliably, a Digital Asset or Network is suspended, a third party service is down, ORBITAL has reached a liquidity limit, or for maintenance. ORBITAL may limit the number or size of Trades at any time.",
    ],
  },
  {
    heading: "Maintenance and Downtime",
    body: [
      "ORBITAL may carry out planned maintenance on its website, Bot or systems. Where practical, ORBITAL will announce planned maintenance in advance on the website.",
      "Unplanned downtime can also happen. ORBITAL will work to restore Services as soon as reasonably possible. Trades already in progress during downtime will be completed or returned in line with these Terms once Services resume.",
    ],
  },
  {
    heading: "Errors, Bugs, and Technical Problems",
    body: [
      "If a Quote, Rate or Trade is affected by an obvious error, such as a Rate far from the market price because of a technical fault or incorrect data, ORBITAL reserves the right to cancel or correct the affected Trade. Where ORBITAL cancels, section 34 applies.",
      "If ORBITAL sends you more Digital Assets or naira than you were due because of an error, you must tell ORBITAL and return the excess promptly. You must not take advantage of any bug or error, and doing so is a prohibited activity under section 28.",
    ],
  },
  {
    heading: "Intellectual Property",
    body: [
      "The website, the Bot and all their content, including text, graphics, designs, adverts, software and the arrangement of information, belong to ORBITAL or its licensors and are protected by intellectual property laws.",
      "You may view and use them only to learn about and use ORBITAL's Services for your own personal purposes. You must not copy, modify, distribute, sell or create works based on them, or use automated tools to extract data from them, without ORBITAL's written permission.",
    ],
  },
  {
    heading: "ORBITAL Branding and Trademarks",
    body: [
      "The ORBITAL name, logo, the tagline \"Trade Beyond Borders\" and ORBITAL's visual identity are used by ORBITAL to identify its Services. You must not use them in a way that suggests you are ORBITAL, are connected to ORBITAL, or are endorsed by ORBITAL, including in Telegram or WhatsApp accounts, social media profiles, domain names or adverts.",
      "Using ORBITAL's branding to impersonate ORBITAL is a serious matter that ORBITAL may report to platforms and the relevant authorities.",
    ],
  },
  {
    heading: "User Generated Content and Communications",
    body: [
      "Messages, images, documents and other information you send ORBITAL, including in the Bot and on WhatsApp, must be accurate, lawful and not abusive, and must not contain malware.",
      "You allow ORBITAL to store and use your communications to provide the Services, keep records, resolve disputes, prevent fraud and meet legal obligations, in line with the Privacy Policy. Communications may be kept as part of ORBITAL's records even after a Trade is completed.",
    ],
  },
  {
    heading: "Customer Privacy",
    body: [
      "ORBITAL respects your privacy. The ORBITAL Privacy Policy explains what personal information ORBITAL collects, including your Telegram details, Trade records, bank details and verification information, why ORBITAL uses it, who it is shared with and the rights you have. By using ORBITAL you acknowledge that your information will be handled as described in the Privacy Policy.",
    ],
  },
  {
    heading: "Data Protection",
    body: [
      "ORBITAL processes personal data in line with the Nigeria Data Protection Act 2023 and other data protection laws that apply to it. ORBITAL uses reasonable technical and organisational measures to protect personal data against loss, misuse and unauthorised access.",
      `You can ask ORBITAL for access to, correction of or deletion of your personal data, subject to ORBITAL's legal record keeping obligations, by contacting support on WhatsApp at ${WA}. Details are in the Privacy Policy.`,
    ],
  },
  {
    heading: "Suspension or Termination of Services",
    body: [
      "ORBITAL reserves the right to suspend or stop providing Services to you, with or without notice, where ORBITAL reasonably believes that:",
      "- you have broken these Terms;",
      "- you are involved in fraud, a prohibited activity or suspicious transactions;",
      "- you have not completed verification when asked;",
      "- continuing would expose ORBITAL or others to legal, financial or reputational risk;",
      "- ORBITAL is required to do so by law or a competent authority.",
      "You may stop using ORBITAL at any time. Suspension or termination does not affect Trades already completed, or any amount either of us owes the other. Where a Trade is in progress, ORBITAL will complete it or return what it received in line with section 34, unless the law requires otherwise.",
    ],
  },
  {
    heading: "Limitation of Liability",
    body: [
      "To the maximum extent permitted by applicable law:",
      "- ORBITAL is not liable for any indirect, incidental, special or consequential loss, or for loss of profit, opportunity, goodwill or data;",
      "- ORBITAL is not liable for losses caused by market movements, your own errors, incorrect information you provided, third party services, Network failures, or events outside ORBITAL's reasonable control;",
      "- ORBITAL's total liability to you for any claim relating to a Trade is limited to the naira value of that Trade at the Rate quoted for it.",
      "Nothing in these Terms limits or excludes liability for fraud, for death or personal injury caused by negligence, or for any other liability that cannot lawfully be limited or excluded.",
    ],
  },
  {
    heading: "Indemnification",
    body: [
      "You agree to compensate ORBITAL for any loss, liability, cost or expense, including reasonable legal fees, that ORBITAL suffers because of:",
      "- your breach of these Terms;",
      "- your use of the Services in breach of any law;",
      "- a chargeback, reversal or dispute you raise without good reason;",
      "- false information or documents you provided;",
      "- any claim by a third party connected to funds or Digital Assets you traded.",
    ],
  },
  {
    heading: "Changes to the Terms",
    body: [
      "ORBITAL may change these Terms from time to time, for example to reflect changes to its Services, the law or its procedures. The updated Terms will be published on the website with a new \"Last updated\" date.",
      "Changes apply from the date they are published. The version in force when you confirm a Trade applies to that Trade. If you do not agree to the changes, you must stop using ORBITAL. Continuing to use ORBITAL after changes are published means you accept them.",
    ],
  },
  {
    heading: "Changes to ORBITAL Services",
    body: [
      "ORBITAL may change, add to or remove any part of its Services at any time, including supported Digital Assets, Networks, limits, margins, procedures, the website and the Bot. ORBITAL will try to announce significant changes on the website. Changes do not affect Trades that have already been completed.",
    ],
  },
  {
    heading: "Governing Law",
    body: [
      "These Terms, and any dispute or claim arising out of or in connection with them or the Services, are governed by the laws of the Federal Republic of Nigeria.",
    ],
  },
  {
    heading: "Dispute Resolution",
    body: [
      "If you have a complaint or dispute, you agree to follow these steps:",
      "- first, contact ORBITAL support on WhatsApp with your Transaction ID and the details of the problem, and allow ORBITAL a reasonable time to investigate and respond;",
      "- if the dispute is not resolved, either of us may give the other written notice, and we will both try in good faith to settle it by negotiation within 30 days;",
      "- if it is still not resolved, either of us may refer it to mediation, or to the courts of competent jurisdiction in Nigeria.",
      "Nothing in this section stops either of us from seeking urgent relief from a court, or stops you from contacting any consumer protection authority that has jurisdiction.",
    ],
  },
  {
    heading: "Severability",
    body: [
      "If any part of these Terms is found to be invalid, unlawful or unenforceable, that part will be limited or removed to the minimum extent necessary, and the rest of these Terms will remain in full force and effect.",
    ],
  },
  {
    heading: "Waiver",
    body: [
      "If ORBITAL does not enforce, or delays enforcing, any right under these Terms, that does not mean ORBITAL has given up that right. A waiver is only effective if it is in writing, and applies only to the specific matter it covers.",
    ],
  },
  {
    heading: "Entire Agreement",
    body: [
      "These Terms, the Privacy Policy and the instructions shown to you in the Bot for a particular Trade are the entire agreement between you and ORBITAL about the Services. They replace any earlier statements, adverts or discussions, whether written or spoken. Nothing said by anyone claiming to act for ORBITAL outside the Official Channels changes these Terms.",
    ],
  },
  {
    heading: "Contact Information",
    body: [
      "You can contact ORBITAL through its Official Channels:",
      `- customer support on WhatsApp: ${WA};`,
      `- trading on Telegram: ${BOT};`,
      "- the Support page on the ORBITAL website.",
      "Please include your Transaction ID when contacting ORBITAL about a Trade.",
    ],
  },
  {
    heading: "Final Customer Acknowledgement",
    body: [
      "By accessing, using, or interacting with ORBITAL, you acknowledge and agree that:",
      "- you have read, understood and accepted these Terms and the Privacy Policy;",
      "- the website provides information only, and all Trades are carried out through the official Telegram Bot;",
      "- you will use only ORBITAL's Official Channels;",
      "- Digital Asset prices and ORBITAL's Rates can change rapidly, and the Rate shown in the Bot for your Trade is the one that applies;",
      "- you are responsible for the accuracy of every detail you provide, including Wallet Addresses, Networks and bank details;",
      "- Digital Asset transfers are generally irreversible;",
      "- every Trade is subject to ORBITAL's procedures, verification requirements, limits and availability;",
      "- trading Digital Assets involves risk, ORBITAL does not give investment advice, and you trade at your own risk.",
    ],
  },
];
