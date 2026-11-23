/** Canonical URL builders. Every public URL in the app is produced here. */

export interface CategoryRef {
  slug: string;
  parent?: { slug: string } | null;
}

export function categoryPath(cat: CategoryRef, page = 1): string {
  const base = cat.parent ? `/${cat.parent.slug}/${cat.slug}/` : `/${cat.slug}/`;
  return page > 1 ? `${base}page/${page}/` : base;
}

/** Articles live under their top-level (pillar) category: /nails/short-almond-nail-designs/ */
export function articlePath(a: { slug: string; category?: CategoryRef | null }): string {
  const root = a.category ? (a.category.parent?.slug ?? a.category.slug) : "blog";
  return `/${root}/${a.slug}/`;
}

export function authorPath(a: { slug: string }): string {
  return `/authors/${a.slug}/`;
}

export function blogPath(page = 1): string {
  return page > 1 ? `/blog/page/${page}/` : "/blog/";
}

export function searchPath(q?: string, page = 1): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return `/search/${qs ? `?${qs}` : ""}`;
}
