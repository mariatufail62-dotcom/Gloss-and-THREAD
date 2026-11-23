import { renderSitemapIndex, sitemapIndexEntries, XML_HEADERS } from "@/lib/sitemap";

export const revalidate = 3600;

export async function GET() {
  try {
    return new Response(renderSitemapIndex(await sitemapIndexEntries()), { headers: XML_HEADERS });
  } catch (err) {
    console.error("[sitemap] index failed", err);
    return new Response("Sitemap temporarily unavailable", { status: 503, headers: { "Retry-After": "300" } });
  }
}
