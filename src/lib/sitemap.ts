import "server-only";
import { db } from "@/lib/db";
import { getCategoryTree, isCategoryIndexable, publishedWhere } from "@/lib/queries/public";
import { STATIC_PATHS } from "@/lib/link-index";
import { absoluteUrl } from "@/lib/site";
import { articlePath, authorPath, categoryPath } from "@/lib/urls";

export const ARTICLES_PER_SITEMAP = 5000;

/** Only pages that are indexable and self-canonical belong in sitemaps. */
export function sitemapArticleWhere() {
  return { ...publishedWhere(), robotsIndex: true, inSitemap: true, canonicalUrl: null };
}

export async function sitemapIndexEntries() {
  const count = await db.article.count({ where: sitemapArticleWhere() });
  const pages = Math.max(1, Math.ceil(count / ARTICLES_PER_SITEMAP));
  const latest = await db.article.findFirst({
    where: sitemapArticleWhere(),
    orderBy: { updatedAt: "desc" },
    select: { updatedAt: true },
  });
  const names = ["pages", "categories", "authors", ...Array.from({ length: pages }, (_, i) => `articles-${i + 1}`)];
  return names.map((n) => ({ loc: absoluteUrl(`/sitemaps/${n}.xml`), lastmod: n.startsWith("articles") ? latest?.updatedAt : undefined }));
}

export interface UrlEntry {
  loc: string;
  lastmod?: Date | null;
  images?: { loc: string; title?: string }[];
}

const NOINDEX_STATIC = new Set(["/search/"]);

export async function sitemapUrls(name: string): Promise<UrlEntry[] | null> {
  if (name === "pages") {
    return STATIC_PATHS.filter((p) => !NOINDEX_STATIC.has(p)).map((p) => ({ loc: absoluteUrl(p) }));
  }
  if (name === "categories") {
    const tree = await getCategoryTree();
    const out: UrlEntry[] = [];
    for (const root of tree) {
      if (isCategoryIndexable(root)) out.push({ loc: absoluteUrl(categoryPath(root)) });
      for (const c of root.children) {
        if (isCategoryIndexable(c)) out.push({ loc: absoluteUrl(categoryPath({ slug: c.slug, parent: root })) });
      }
    }
    return out;
  }
  if (name === "authors") {
    const authors = await db.author.findMany({
      where: { isActive: true, articles: { some: sitemapArticleWhere() } },
      select: { slug: true, updatedAt: true },
      orderBy: { name: "asc" },
    });
    return authors.map((a) => ({ loc: absoluteUrl(authorPath(a)), lastmod: a.updatedAt }));
  }
  const m = name.match(/^articles-(\d{1,4})$/);
  if (m) {
    const page = Number(m[1]);
    if (page < 1) return null;
    const rows = await db.article.findMany({
      where: sitemapArticleWhere(),
      orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * ARTICLES_PER_SITEMAP,
      take: ARTICLES_PER_SITEMAP,
      select: {
        slug: true,
        title: true,
        publishedAt: true,
        contentUpdatedAt: true,
        category: { select: { slug: true, parent: { select: { slug: true } } } },
        featuredImage: { select: { url: true } },
      },
    });
    if (!rows.length && page > 1) return null;
    return rows.map((a) => ({
      loc: absoluteUrl(articlePath(a)),
      lastmod: a.contentUpdatedAt ?? a.publishedAt,
      images: a.featuredImage ? [{ loc: absoluteUrl(a.featuredImage.url), title: a.title }] : undefined,
    }));
  }
  return null;
}

export function xmlEscape(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);
}

export function renderUrlset(entries: UrlEntry[]): string {
  const body = entries
    .map((e) => {
      const parts = [`<loc>${xmlEscape(e.loc)}</loc>`];
      if (e.lastmod) parts.push(`<lastmod>${e.lastmod.toISOString()}</lastmod>`);
      for (const img of e.images ?? []) parts.push(`<image:image><image:loc>${xmlEscape(img.loc)}</image:loc></image:image>`);
      return `<url>${parts.join("")}</url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${body}\n</urlset>\n`;
}

export function renderSitemapIndex(entries: { loc: string; lastmod?: Date | null }[]): string {
  const body = entries
    .map((e) => `<sitemap><loc>${xmlEscape(e.loc)}</loc>${e.lastmod ? `<lastmod>${e.lastmod.toISOString()}</lastmod>` : ""}</sitemap>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>\n`;
}

export const XML_HEADERS = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
};
