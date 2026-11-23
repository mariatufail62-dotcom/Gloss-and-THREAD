import { renderUrlset, sitemapUrls, XML_HEADERS } from "@/lib/sitemap";

export const revalidate = 3600;

type Ctx = { params: Promise<{ file: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { file } = await params;
  const m = file.match(/^([a-z0-9-]+)\.xml$/);
  if (!m) return new Response("Not found", { status: 404 });
  try {
    const urls = await sitemapUrls(m[1]);
    if (!urls) return new Response("Not found", { status: 404 });
    return new Response(renderUrlset(urls), { headers: XML_HEADERS });
  } catch (err) {
    console.error(`[sitemap] ${file} failed`, err);
    return new Response("Sitemap temporarily unavailable", { status: 503, headers: { "Retry-After": "300" } });
  }
}
