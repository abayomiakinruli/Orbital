import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/siteUrl";

// Search engines may read the public pages; the admin panel and the API
// are kept out.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
