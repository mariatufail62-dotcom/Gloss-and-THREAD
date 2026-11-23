import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

/* ─────────────────────────── selects & types ─────────────────────────── */

export const mediaSelect = {
  id: true,
  url: true,
  width: true,
  height: true,
  alt: true,
  caption: true,
  credit: true,
  creditUrl: true,
  license: true,
  isDemo: true,
} satisfies Prisma.MediaSelect;

export type MediaItem = Prisma.MediaGetPayload<{ select: typeof mediaSelect }>;

const categoryRefSelect = {
  id: true,
  slug: true,
  name: true,
  parent: { select: { id: true, slug: true, name: true } },
} satisfies Prisma.CategorySelect;

export const articleCardSelect = {
  id: true,
  slug: true,
  title: true,
  subtitle: true,
  excerpt: true,
  publishedAt: true,
  contentUpdatedAt: true,
  contentType: true,
  isSample: true,
  isSponsored: true,
  category: { select: categoryRefSelect },
  author: { select: { slug: true, name: true } },
  featuredImage: { select: mediaSelect },
} satisfies Prisma.ArticleSelect;

export type ArticleCard = Prisma.ArticleGetPayload<{ select: typeof articleCardSelect }>;

export const productSelect = {
  id: true,
  name: true,
  brand: true,
  description: true,
  image: { select: mediaSelect },
  links: {
    where: { linkVerifiedAt: { not: null } },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      merchant: true,
      url: true,
      affiliateUrl: true,
      isAffiliate: true,
      priceCents: true,
      currency: true,
      priceVerifiedAt: true,
    },
  },
} satisfies Prisma.ProductSelect;

export type ProductItem = Prisma.ProductGetPayload<{ select: typeof productSelect }>;

/** An article is public when published, or scheduled and its time has passed. */
export function publishedWhere(now = new Date()): Prisma.ArticleWhereInput {
  return { status: { in: ["PUBLISHED", "SCHEDULED"] }, publishedAt: { lte: now } };
}

const newestFirst: Prisma.ArticleOrderByWithRelationInput[] = [{ publishedAt: "desc" }, { id: "desc" }];

/* ─────────────────────────── categories ─────────────────────────── */

export type CategoryNode = {
  id: string;
  slug: string;
  name: string;
  navLabel: string | null;
  description: string | null;
  intro: string | null;
  seoTitle: string | null;
  metaDescription: string | null;
  showInNav: boolean;
  minArticlesToIndex: number;
  parent: { id: string; slug: string; name: string } | null;
  children: CategoryNode[];
  publishedCount: number; // includes children for roots
  /** Live, indexable, non-sample articles — decides whether the page may be indexed. */
  indexableCount: number;
};

export const getCategoryTree = cache(async (): Promise<CategoryNode[]> => {
  const [cats, counts, indexable] = await Promise.all([
    db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    db.article.groupBy({ by: ["categoryId"], where: publishedWhere(), _count: { _all: true } }),
    db.article.groupBy({ by: ["categoryId"], where: { ...publishedWhere(), robotsIndex: true, isSample: false }, _count: { _all: true } }),
  ]);
  const countMap = new Map(counts.map((c) => [c.categoryId, c._count._all]));
  const indexMap = new Map(indexable.map((c) => [c.categoryId, c._count._all]));
  const nodes = new Map<string, CategoryNode>();
  for (const c of cats) {
    nodes.set(c.id, {
      id: c.id,
      slug: c.slug,
      name: c.name,
      navLabel: c.navLabel,
      description: c.description,
      intro: c.intro,
      seoTitle: c.seoTitle,
      metaDescription: c.metaDescription,
      showInNav: c.showInNav,
      minArticlesToIndex: c.minArticlesToIndex,
      parent: null,
      children: [],
      publishedCount: countMap.get(c.id) ?? 0,
      indexableCount: indexMap.get(c.id) ?? 0,
    });
  }
  const roots: CategoryNode[] = [];
  for (const c of cats) {
    const node = nodes.get(c.id)!;
    const parent = c.parentId ? nodes.get(c.parentId) : undefined;
    if (parent) {
      node.parent = { id: parent.id, slug: parent.slug, name: parent.name };
      parent.children.push(node);
    } else roots.push(node);
  }
  for (const r of roots) {
    r.publishedCount += r.children.reduce((s, ch) => s + ch.publishedCount, 0);
    r.indexableCount += r.children.reduce((s, ch) => s + ch.indexableCount, 0);
  }
  return roots;
});

export async function getRootCategory(slug: string) {
  const tree = await getCategoryTree();
  return tree.find((c) => c.slug === slug) ?? null;
}

export async function getSubcategory(rootSlug: string, slug: string) {
  const root = await getRootCategory(rootSlug);
  return root?.children.find((c) => c.slug === slug) ?? null;
}

export function categoryIds(node: CategoryNode): string[] {
  return [node.id, ...node.children.map((c) => c.id)];
}

export function isCategoryIndexable(node: CategoryNode): boolean {
  return node.indexableCount >= node.minArticlesToIndex;
}

/* ─────────────────────────── article lists ─────────────────────────── */

export async function getLatestArticles(opts: { take: number; skip?: number; excludeIds?: string[] }) {
  return db.article.findMany({
    where: { ...publishedWhere(), id: opts.excludeIds?.length ? { notIn: opts.excludeIds } : undefined },
    orderBy: newestFirst,
    take: opts.take,
    skip: opts.skip,
    select: articleCardSelect,
  });
}

export async function countPublished(where: Prisma.ArticleWhereInput = {}) {
  return db.article.count({ where: { ...publishedWhere(), ...where } });
}

export async function getArticlesInCategories(
  ids: string[],
  opts: { take: number; skip?: number; excludeIds?: string[] }
) {
  return db.article.findMany({
    where: {
      ...publishedWhere(),
      categoryId: { in: ids },
      id: opts.excludeIds?.length ? { notIn: opts.excludeIds } : undefined,
    },
    orderBy: newestFirst,
    take: opts.take,
    skip: opts.skip,
    select: articleCardSelect,
  });
}

export async function getSectionArticles(rootSlug: string, take: number, excludeIds: string[] = []) {
  const root = await getRootCategory(rootSlug);
  if (!root) return [];
  return getArticlesInCategories(categoryIds(root), { take, excludeIds });
}

/** Evergreen guides — used for "Popular Guides" fallbacks (never presented as view-count rankings). */
export async function getEvergreenGuides(take: number, categoryIdsFilter?: string[]) {
  return db.article.findMany({
    where: {
      ...publishedWhere(),
      contentType: { in: ["HOW_TO", "EXPLAINER", "OUTFIT_GUIDE", "COMPARISON"] },
      categoryId: categoryIdsFilter ? { in: categoryIdsFilter } : undefined,
    },
    orderBy: newestFirst,
    take,
    select: articleCardSelect,
  });
}

/* ─────────────────────────── homepage curation ─────────────────────────── */

export async function getHeroArticles(): Promise<ArticleCard[]> {
  const curated = await db.homepageFeature.findMany({
    where: { slot: "HERO", article: publishedWhere() },
    orderBy: { position: "asc" },
    take: 3,
    select: { article: { select: articleCardSelect } },
  });
  const picked = curated.map((c) => c.article!).filter(Boolean);
  if (picked.length >= 3) return picked;
  const fill = await db.article.findMany({
    where: { ...publishedWhere(), id: { notIn: picked.map((p) => p.id) } },
    orderBy: [{ isFeatured: "desc" }, ...newestFirst],
    take: 3 - picked.length,
    select: articleCardSelect,
  });
  return [...picked, ...fill];
}

/** Curated "Most Popular". Returns curated=false when editors have not chosen a list. */
export async function getPopularArticles(take = 5): Promise<{ curated: boolean; items: ArticleCard[] }> {
  const curated = await db.homepageFeature.findMany({
    where: { slot: "POPULAR", article: publishedWhere() },
    orderBy: { position: "asc" },
    take,
    select: { article: { select: articleCardSelect } },
  });
  if (curated.length) return { curated: true, items: curated.map((c) => c.article!).filter(Boolean) };
  return { curated: false, items: await getEvergreenGuides(take) };
}

export async function getEditorsPicks(take = 8): Promise<ProductItem[]> {
  const rows = await db.homepageFeature.findMany({
    where: { slot: "EDITORS_PICKS", product: { isActive: true, links: { some: { linkVerifiedAt: { not: null } } } } },
    orderBy: { position: "asc" },
    take,
    select: { product: { select: productSelect } },
  });
  return rows.map((r) => r.product!).filter((p) => p && p.links.length > 0);
}

/* ─────────────────────────── single article ─────────────────────────── */

export const getArticleBySlug = cache(async (slug: string) => {
  return db.article.findFirst({
    where: { slug, ...publishedWhere() },
    include: {
      category: { include: { parent: true } },
      author: { include: { avatar: { select: mediaSelect } } },
      featuredImage: { select: mediaSelect },
      tags: { include: { tag: true } },
      relatedLinks: { orderBy: { position: "asc" }, select: { relatedId: true } },
    },
  });
});

export type FullArticle = NonNullable<Awaited<ReturnType<typeof getArticleBySlug>>>;

/** Related reading: manual overrides first, then scored by category & shared tags. */
export async function getRelatedArticles(
  article: { id: string; categoryId: string | null; tagIds: string[]; manualIds: string[]; rootCategoryId: string | null },
  take = 4
): Promise<ArticleCard[]> {
  const manual = article.manualIds.length
    ? await db.article.findMany({
        where: { ...publishedWhere(), id: { in: article.manualIds } },
        select: articleCardSelect,
      })
    : [];
  const manualOrdered = article.manualIds
    .map((id) => manual.find((m) => m.id === id))
    .filter((m): m is ArticleCard => !!m);
  if (manualOrdered.length >= take) return manualOrdered.slice(0, take);

  const tree = await getCategoryTree();
  const root = tree.find((r) => r.id === article.rootCategoryId);
  const sameRootIds = root ? categoryIds(root) : [];
  const exclude = [article.id, ...manualOrdered.map((m) => m.id)];

  const candidates = await db.article.findMany({
    where: {
      ...publishedWhere(),
      id: { notIn: exclude },
      OR: [
        ...(sameRootIds.length ? [{ categoryId: { in: sameRootIds } }] : []),
        ...(article.tagIds.length ? [{ tags: { some: { tagId: { in: article.tagIds } } } }] : []),
      ],
    },
    orderBy: newestFirst,
    take: 40,
    select: { ...articleCardSelect, categoryId: true, tags: { select: { tagId: true } } },
  });

  const scored = candidates
    .map((c) => {
      let score = 0;
      if (c.categoryId === article.categoryId) score += 3;
      else if (sameRootIds.includes(c.categoryId ?? "")) score += 1;
      score += c.tags.filter((t) => article.tagIds.includes(t.tagId)).length * 2;
      return { c, score };
    })
    .sort((a, b) => b.score - a.score);

  const auto = scored.slice(0, take - manualOrdered.length).map(({ c }) => {
    const { categoryId: _c, tags: _t, ...card } = c;
    return card as ArticleCard;
  });
  return [...manualOrdered, ...auto];
}

/** Batch-loads everything referenced by body blocks. */
export async function resolveBodyRefs(refs: { mediaIds: string[]; productIds: string[]; articleIds: string[] }) {
  const [media, products, articles] = await Promise.all([
    refs.mediaIds.length ? db.media.findMany({ where: { id: { in: refs.mediaIds } }, select: mediaSelect }) : [],
    refs.productIds.length
      ? db.product.findMany({ where: { id: { in: refs.productIds }, isActive: true }, select: productSelect })
      : [],
    refs.articleIds.length
      ? db.article.findMany({ where: { id: { in: refs.articleIds }, ...publishedWhere() }, select: articleCardSelect })
      : [],
  ]);
  return {
    media: new Map(media.map((m) => [m.id, m])),
    products: new Map(products.filter((p) => p.links.length > 0).map((p) => [p.id, p])),
    articles: new Map(articles.map((a) => [a.id, a])),
  };
}

export type BodyRefMaps = Awaited<ReturnType<typeof resolveBodyRefs>>;

/* ─────────────────────────── authors ─────────────────────────── */

export const getAuthorBySlug = cache(async (slug: string) => {
  return db.author.findFirst({
    where: { slug, isActive: true },
    include: { avatar: { select: mediaSelect } },
  });
});

export async function getAuthorArticles(authorId: string, take: number, skip = 0) {
  return db.article.findMany({
    where: { ...publishedWhere(), authorId },
    orderBy: newestFirst,
    take,
    skip,
    select: articleCardSelect,
  });
}

/* ─────────────────────────── search ─────────────────────────── */

export async function searchArticles(query: string, page: number, perPage = 12): Promise<{ items: ArticleCard[]; total: number }> {
  const q = query.trim().slice(0, 120);
  if (!q) return { items: [] as ArticleCard[], total: 0 };
  const offset = (page - 1) * perPage;
  const like = `%${q.replace(/[%_\\]/g, (m) => "\\" + m)}%`;

  // Weighted full-text search: title (A) > excerpt/subtitle/category/tags (B) > body (C).
  const rows = await db.$queryRaw<{ id: string; rank: number; total: bigint }[]>`
    WITH docs AS (
      SELECT a.id, a."publishedAt",
        setweight(to_tsvector('english', coalesce(a.title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(a.subtitle, '') || ' ' || coalesce(a.excerpt, '') || ' ' ||
          coalesce(c.name, '') || ' ' || coalesce(p.name, '') || ' ' ||
          coalesce((SELECT string_agg(t.name, ' ') FROM "ArticleTag" at JOIN "Tag" t ON t.id = at."tagId" WHERE at."articleId" = a.id), '')), 'B') ||
        setweight(to_tsvector('english', coalesce(a."searchText", '')), 'C') AS doc,
        a.title
      FROM "Article" a
      LEFT JOIN "Category" c ON c.id = a."categoryId"
      LEFT JOIN "Category" p ON p.id = c."parentId"
      WHERE a.status IN ('PUBLISHED', 'SCHEDULED') AND a."publishedAt" <= now()
    ), matched AS (
      SELECT id, "publishedAt",
        ts_rank(doc, websearch_to_tsquery('english', ${q})) + CASE WHEN title ILIKE ${like} THEN 0.5 ELSE 0 END AS rank
      FROM docs
      WHERE doc @@ websearch_to_tsquery('english', ${q}) OR title ILIKE ${like}
    )
    SELECT id, rank, count(*) OVER () AS total
    FROM matched
    ORDER BY rank DESC, "publishedAt" DESC
    LIMIT ${perPage} OFFSET ${offset}
  `;
  if (!rows.length) {
    if (page > 1) {
      const any = await searchArticles(q, 1, 1);
      return { items: [], total: any.total };
    }
    return { items: [], total: 0 };
  }
  const cards = await db.article.findMany({ where: { id: { in: rows.map((r) => r.id) } }, select: articleCardSelect });
  const byId = new Map(cards.map((c) => [c.id, c]));
  return {
    items: rows.map((r) => byId.get(r.id)).filter((c): c is ArticleCard => !!c),
    total: Number(rows[0].total),
  };
}

export async function searchByTag(tagSlug: string, page: number, perPage = 12) {
  const tag = await db.tag.findUnique({ where: { slug: tagSlug } });
  if (!tag) return { tag: null, items: [] as ArticleCard[], total: 0 };
  const where = { ...publishedWhere(), tags: { some: { tagId: tag.id } } };
  const [items, total] = await Promise.all([
    db.article.findMany({ where, orderBy: newestFirst, take: perPage, skip: (page - 1) * perPage, select: articleCardSelect }),
    db.article.count({ where }),
  ]);
  return { tag, items, total };
}

/* ─────────────────────────── redirects ─────────────────────────── */

export async function findRedirect(path: string) {
  const r = await db.redirect.findUnique({ where: { fromPath: path } });
  if (r) {
    db.redirect.update({ where: { id: r.id }, data: { hits: { increment: 1 } } }).catch(() => {});
  }
  return r;
}
