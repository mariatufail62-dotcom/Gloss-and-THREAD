import { db } from "@/lib/db";
import { sitemapArticleWhere, xmlEscape } from "@/lib/sitemap";
import { SITE_DESCRIPTION, SITE_NAME, absoluteUrl } from "@/lib/site";
import { articlePath } from "@/lib/urls";

export const revalidate = 1800;

export async function GET() {
  try {
    const items = await db.article.findMany({
      where: sitemapArticleWhere(),
      orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
      take: 30,
      select: {
        slug: true,
        title: true,
        excerpt: true,
        metaDescription: true,
        publishedAt: true,
        category: { select: { name: true, slug: true, parent: { select: { slug: true, name: true } } } },
        author: { select: { name: true } },
      },
    });
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
<channel>
<title>${xmlEscape(SITE_NAME)}</title>
<link>${absoluteUrl("/")}</link>
<description>${xmlEscape(SITE_DESCRIPTION)}</description>
<language>en-us</language>
<atom:link href="${absoluteUrl("/feed.xml")}" rel="self" type="application/rss+xml"/>
${items
  .map((a) => {
    const url = absoluteUrl(articlePath(a));
    return `<item>
<title>${xmlEscape(a.title)}</title>
<link>${url}</link>
<guid isPermaLink="true">${url}</guid>
${a.publishedAt ? `<pubDate>${a.publishedAt.toUTCString()}</pubDate>` : ""}
${a.author ? `<dc:creator>${xmlEscape(a.author.name)}</dc:creator>` : ""}
${a.category ? `<category>${xmlEscape(a.category.parent?.name ?? a.category.name)}</category>` : ""}
<description>${xmlEscape(a.metaDescription || a.excerpt || "")}</description>
</item>`;
  })
  .join("\n")}
</channel>
</rss>
`;
    return new Response(xml, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=0, s-maxage=1800, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    console.error("[feed] failed", err);
    return new Response("Feed temporarily unavailable", { status: 503 });
  }
}
