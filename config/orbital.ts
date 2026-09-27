// Central configuration for ORBITAL contact links and dynamic content.
// Replace the placeholder values below with real ORBITAL channels.
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

  // The site's own Trade and Support pages. Every Trade / Support button on
  // the website leads here first; only these pages link out to Telegram
  // and WhatsApp.
  tradePage: "/trade",
  supportPage: "/support",

  // Official social accounts, shown in the footer. Add entries like
  // { label: "Instagram", url: "https://instagram.com/yourhandle" }; the
  // footer shows nothing here until at least one is added.
  socials: [] as { label: string; url: string }[],

  // The ORBITAL Notice section. Toggle `enabled` to show or hide it
  // without touching any component code. Structured so it can later be
  // populated from an admin dashboard or database instead of this file.
  notice: {
    enabled: true,
    tag: "IMPORTANT UPDATE",
    title: "ORBITAL is now live.",
    message:
      "You can now buy and sell BTC, USDT, USDC and SOL through the official ORBITAL Telegram trading bot, with clear rates, simple steps, and support on WhatsApp whenever you need it.",
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
      tag: "Announcement",
      date: "2026.09",
      title: "ORBITAL is now live.",
      description:
        "Buy and sell BTC, USDT, USDC and SOL through the ORBITAL Telegram trading bot, with support on WhatsApp whenever you need it.",
    },
    {
      tag: "Coming Soon",
      date: "Roadmap",
      title: "The ORBITAL web platform & app.",
      description:
        "A customer dashboard for your transactions, rates, trade history and account, followed by a dedicated ORBITAL mobile app.",
    },
    {
      tag: "Coming Soon",
      date: "Roadmap",
      title: "More assets & referrals.",
      description:
        "Support for more cryptocurrencies beyond BTC, USDT, USDC and SOL, plus a referral program for introducing new customers to ORBITAL.",
    },
  ] satisfies OrbitalUpdate[],
} as const;
