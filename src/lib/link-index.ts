import "server-only";
import { db } from "@/lib/db";
import { publishedWhere } from "@/lib/queries/public";
import { articlePath, categoryPath } from "@/lib/urls";
import { RESERVED_SLUGS } from "@/lib/site";

export const STATIC_PATHS = [
  "/",
  "/blog/",
  "/blog/popular/",
  "/search/",
  "/about/",
  "/contact/",
  "/editorial-policy/",
  "/privacy-policy/",
  "/terms/",
  "/affiliate-disclosure/",
  "/advertising-policy/",
  "/corrections-policy/",
  "/sitemap/",
];

/** Set of every resolvable public path — used to detect broken internal links. */
export async function buildKnownPaths(): Promise<Set<string>> {
  const [cats, articles, authors, redirects] = await Promise.all([
    db.category.findMany({ select: { slug: true, parent: { select: { slug: true } } } }),
    db.article.findMany({
      where: publishedWhere(),
      select: { slug: true, category: { select: { slug: true, parent: { select: { slug: true } } } } },
    }),
    db.author.findMany({ where: { isActive: true }, select: { slug: true } }),
    db.redirect.findMany({ select: { fromPath: true } }),
  ]);
  const set = new Set(STATIC_PATHS);
  cats.forEach((c) => set.add(categoryPath(c)));
  articles.forEach((a) => set.add(articlePath(a)));
  authors.forEach((a) => set.add(`/authors/${a.slug}/`));
  redirects.forEach((r) => set.add(r.fromPath));
  return set;
}

/** Slugs an article may not use: reserved route names and any category slug. */
export async function isSlugReserved(slug: string): Promise<boolean> {
  if (RESERVED_SLUGS.has(slug)) return true;
  return (await db.category.count({ where: { slug } })) > 0;
}
