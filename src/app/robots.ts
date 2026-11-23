import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  // Non-production deployments (previews, staging) must never be indexed.
  const isLive = process.env.SITE_ENV ? process.env.SITE_ENV === "production" : process.env.NODE_ENV === "production";
  if (!isLive) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Search result pages stay crawlable so their noindex directive is seen.
        disallow: ["/admin/", "/api/"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
