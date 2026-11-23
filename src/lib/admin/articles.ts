import "server-only";
import { db } from "@/lib/db";
import { auditArticle, type AuditCheck } from "@/lib/audit";
import type { Block } from "@/lib/blocks/schema";
import { collectRefs } from "@/lib/blocks/text";
import { buildKnownPaths, isSlugReserved } from "@/lib/link-index";
import { siteUrl } from "@/lib/site";
import type { SessionUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/auth/session";

export interface AuditableArticle {
  id?: string;
  title: string;
  slug: string;
  seoTitle: string | null;
  metaDescription: string | null;
  excerpt: string | null;
  categoryId: string | null;
  authorId: string | null;
  featuredImageId: string | null;
  body: Block[];
  canonicalUrl: string | null;
  robotsIndex: boolean;
  reviewStatus: "NOT_REVIEWED" | "CHANGES_REQUESTED" | "APPROVED";
  hasAffiliateLinks: boolean;
  wordCount: number;
}

/** Runs the editorial checklist against the given (possibly unsaved) article state. */
export async function auditArticleData(a: AuditableArticle, knownPaths?: Set<string>): Promise<AuditCheck[]> {
  const refs = collectRefs(a.body);
  const mediaIds = [...new Set([...refs.mediaIds, ...(a.featuredImageId ? [a.featuredImageId] : [])])];
  const [media, slugOwner, reserved, known] = await Promise.all([
    mediaIds.length ? db.media.findMany({ where: { id: { in: mediaIds } }, select: { id: true, alt: true } }) : [],
    a.slug ? db.article.findUnique({ where: { slug: a.slug }, select: { id: true } }) : null,
    a.slug ? isSlugReserved(a.slug) : false,
    knownPaths ? Promise.resolve(knownPaths) : buildKnownPaths(),
  ]);
  const alt = new Map(media.map((m) => [m.id, m.alt]));
  const featured = a.featuredImageId && alt.has(a.featuredImageId) ? { alt: alt.get(a.featuredImageId)! } : null;
  return auditArticle(
    {
      title: a.title,
      slug: a.slug,
      seoTitle: a.seoTitle,
      metaDescription: a.metaDescription,
      excerpt: a.excerpt,
      categoryId: a.categoryId,
      authorId: a.authorId,
      featuredImage: featured,
      body: a.body,
      bodyMediaAlt: alt,
      canonicalUrl: a.canonicalUrl,
      robotsIndex: a.robotsIndex,
      reviewStatus: a.reviewStatus,
      hasProducts: refs.productIds.length > 0,
      hasAffiliateLinks: a.hasAffiliateLinks,
      wordCount: a.wordCount,
    },
    {
      slugTakenByOther: !!slugOwner && slugOwner.id !== a.id,
      slugIsReserved: reserved,
      isKnownPath: (p) => known.has(p),
      siteOrigin: siteUrl(),
    }
  );
}

/** Contributors may only touch their own unpublished drafts. */
export function canEditArticle(user: SessionUser, a: { createdById: string | null; status: string }): boolean {
  if (hasRole(user, "EDITOR")) return true;
  return a.createdById === user.id && (a.status === "DRAFT" || a.status === "ARCHIVED");
}

export const editorInclude = {
  tags: { include: { tag: true } },
  relatedLinks: { orderBy: { position: "asc" as const }, select: { relatedId: true } },
  category: { select: { slug: true, name: true, parent: { select: { slug: true } } } },
  revisions: {
    orderBy: { createdAt: "desc" as const },
    take: 15,
    select: { id: true, note: true, createdAt: true, createdBy: { select: { name: true } } },
  },
  createdBy: { select: { name: true } },
  reviewedBy: { select: { name: true } },
};

/** Options for the editor's selects and pickers. */
export async function loadEditorOptions() {
  const [categories, authors, media, products, articles] = await Promise.all([
    db.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true, parentId: true, parent: { select: { name: true, slug: true } } },
    }),
    db.author.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, kind: true } }),
    db.media.findMany({
      orderBy: { createdAt: "desc" },
      take: 400,
      select: { id: true, url: true, alt: true, width: true, height: true, filename: true, credit: true, caption: true },
    }),
    db.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, brand: true, links: { where: { linkVerifiedAt: { not: null } }, select: { id: true } } },
    }),
    db.article.findMany({
      where: { status: { in: ["PUBLISHED", "SCHEDULED"] } },
      orderBy: { publishedAt: "desc" },
      take: 600,
      select: { id: true, title: true, slug: true, status: true, publishedAt: true, category: { select: { slug: true, parent: { select: { slug: true } } } } },
    }),
  ]);
  // Roots first, each followed by its children.
  const roots = categories.filter((c) => !c.parentId);
  const orderedCategories = roots.flatMap((r) => [
    { id: r.id, label: r.name, path: `/${r.slug}/` },
    ...categories.filter((c) => c.parentId === r.id).map((c) => ({ id: c.id, label: `${r.name} › ${c.name}`, path: `/${r.slug}/${c.slug}/` })),
  ]);
  return {
    categories: orderedCategories,
    authors,
    media,
    products: products.map((p) => ({ id: p.id, label: `${p.brand} — ${p.name}`, verified: p.links.length > 0 })),
    articles: articles.map((a) => ({
      id: a.id,
      title: a.title,
      path: `/${a.category ? (a.category.parent?.slug ?? a.category.slug) : "blog"}/${a.slug}/`,
      live: !!a.publishedAt && a.publishedAt <= new Date(),
    })),
  };
}

export type EditorOptions = Awaited<ReturnType<typeof loadEditorOptions>>;
