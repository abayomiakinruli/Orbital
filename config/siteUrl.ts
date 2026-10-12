// The public address, set per deployment (SITE_URL in the environment).
// Used for link previews, robots.txt and the sitemap; the placeholder only
// matters locally. Read at build time, so set SITE_URL before `npm run build`.
export const siteUrl = (process.env.SITE_URL ?? "https://orbital.example.com").replace(/\/$/, "");
