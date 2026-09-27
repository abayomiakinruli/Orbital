import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The agent guidance files (CLAUDE.md, AGENTS.md) live in .claude/;
  // stop `next dev` from recreating copies in the project root.
  agentRules: false,
};

export default nextConfig;
