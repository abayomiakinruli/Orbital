import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/siteUrl";

// Every public page. Add a path here when a new page is added under app/.
const pages = [
  "",
  "/trade",
  "/how-it-works",
  "/track",
  "/faq",
  "/support",
  "/report-bug",
  "/terms",
  "/privacy",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.map((path) => ({
    url: `${siteUrl}${path}`,
    priority: path === "" ? 1 : 0.7,
  }));
}
