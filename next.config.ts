import type { NextConfig } from "next";

// Sent with every response. HSTS only in production, where the site is
// always behind HTTPS (see .claude/DEPLOY.md); it deliberately leaves out
// includeSubDomains so it can't break another service on a subdomain.
const securityHeaders = [
  // The site is never meant to be shown inside another site's frame.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000" }]
    : []),
];

const nextConfig: NextConfig = {
  // The agent guidance files (CLAUDE.md, AGENTS.md) live in .claude/;
  // stop `next dev` from recreating copies in the project root.
  agentRules: false,
  poweredByHeader: false,
  headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
