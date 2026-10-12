// Central configuration for ORBITAL contact links and dynamic content.
// This object is the single source of truth for every CTA on the site —
// update it here and the whole site updates with it.

export type OrbitalUpdate = {
  tag: string;
  date: string;
  title: string;
  description: string;
};

export type OrbitalAsset = {
  ticker: string;
  name: string;
  description: string;
};

export const orbitalConfig = {
  brand: {
    name: "ORBITAL",
    tagline: "Trade Beyond Borders.",
  },

  // Telegram is the official ORBITAL trading channel.
  telegram: "https://t.me/orbitaltradebot",
  telegramHandle: "@orbitaltradebot",

  // WhatsApp is the official ORBITAL customer-support channel.
  whatsapp: "https://wa.me/2348153978826",
  whatsappDisplay: "+234 815 397 8826",

  // Why people usually contact support. The website's Support page and the
  // bot's Customer Support menu both list these; choosing one opens WhatsApp
  // with `message` already typed, ready for the customer to finish and send.
  supportReasons: [
    {
      label: "My payment hasn't arrived",
      message: "Hello ORBITAL Support, I completed a trade but my payment hasn't arrived. My Transaction ID is: ",
    },
    {
      label: "My trade is taking too long",
      message: "Hello ORBITAL Support, my trade is taking longer than expected. My Transaction ID is: ",
    },
    {
      label: "I sent the wrong amount or details",
      message: "Hello ORBITAL Support, I made a mistake with the amount or details on my trade. My Transaction ID is: ",
    },
    {
      label: "I have a question about rates",
      message: "Hello ORBITAL Support, I have a question about your rates.",
    },
    {
      label: "I need help using the bot",
      message: "Hello ORBITAL Support, I need help using the Telegram bot.",
    },
  ],
  // The "Other" choice, for anything not on the list.
  supportOtherMessage: "Hello ORBITAL Support, I need your help with: ",

  // The site's own Trade and Support pages. Every Trade / Support button on
  // the website leads here first; only these pages link out to Telegram
  // and WhatsApp.
  tradePage: "/trade",
  supportPage: "/support",

  // Official social accounts, shown in the footer. Add entries like
  // { label: "Instagram", url: "https://instagram.com/yourhandle" }; the
  // footer shows nothing here until at least one is added.
  socials: [
    { label: "X", url: "https://x.com/orbitalglobal" },
    { label: "Instagram", url: "https://www.instagram.com/orbitalglobal" },
  ] as { label: string; url: string }[],

  // The ORBITAL Notice section. Toggle `enabled` to show or hide it
  // without touching any component code. Structured so it can later be
  // populated from an admin dashboard or database instead of this file.
  notice: {
    enabled: true,
    tag: "IMPORTANT UPDATE",
    title: "ORBITAL is now live.",
    message:
      "You can now buy and sell BTC, ETH, USDT, USDC and SOL through the official ORBITAL Telegram trading bot, with clear rates, simple steps, and support on WhatsApp whenever you need it.",
    buttonText: "Trade with ORBITAL",
    buttonUrl: "/trade",
  },

  // Digital assets ORBITAL currently supports. No prices are listed here —
  // markets move constantly, so live rates are only ever quoted directly
  // on the Telegram trading desk, never baked into the static website.
  assets: [
    {
      ticker: "BTC",
      name: "Bitcoin",
      description:
        "A decentralized digital asset and one of the primary cryptocurrencies ORBITAL supports.",
    },
    {
      ticker: "ETH",
      name: "Ethereum",
      description: "The native cryptocurrency of the Ethereum blockchain.",
    },
    {
      ticker: "USDT",
      name: "Tether",
      description:
        "A stablecoin designed to hold a value close to the US dollar, especially useful for transfers and trading.",
    },
    {
      ticker: "USDC",
      name: "USD Coin",
      description:
        "A fully reserved US dollar stablecoin issued by Circle, widely used for payments and transfers.",
    },
    {
      ticker: "SOL",
      name: "Solana",
      description: "The native cryptocurrency of the Solana blockchain.",
    },
  ] satisfies OrbitalAsset[],

  // Update cards for the Updates section. Replace with real announcements,
  // trading notices, or support updates as they happen.
  updates: [
    {
      tag: "Coming Soon",
      date: "Roadmap",
      title: "The ORBITAL app.",
      description:
        "A dedicated ORBITAL mobile app is on the way, so you can trade and track from your phone.",
    },
    {
      tag: "Coming Soon",
      date: "Roadmap",
      title: "User login.",
      description:
        "Sign in to your own ORBITAL account to see your trades and details in one place.",
    },
    {
      tag: "Coming Soon",
      date: "Roadmap",
      title: "Community chat.",
      description:
        "A space to talk with other ORBITAL customers and hear from the team.",
    },
  ] satisfies OrbitalUpdate[],
} as const;

// A WhatsApp support link that opens the chat with `message` already typed.
export const supportLink = (message: string) =>
  `${orbitalConfig.whatsapp}?text=${encodeURIComponent(message)}`;

// Every support choice in order: the listed reasons, then "Other".
export const supportChoices = [
  ...orbitalConfig.supportReasons,
  { label: "Other", message: orbitalConfig.supportOtherMessage },
].map((choice) => ({ label: choice.label, url: supportLink(choice.message) }));
