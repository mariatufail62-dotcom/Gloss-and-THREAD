import "server-only";
import type { Metadata } from "next";
import { parseBody } from "@/lib/blocks/schema";
import { collectRefs } from "@/lib/blocks/text";
import {
  type FullArticle,
  getArticlesInCategories,
  getRelatedArticles,
  resolveBodyRefs,
} from "@/lib/queries/public";
import { articlePath, authorPath } from "@/lib/urls";
import { pageMetadata } from "@/lib/seo/metadata";
import { articleJsonLd } from "@/lib/seo/jsonld";
import type { ArticleViewData } from "@/components/article/ArticleView";

type Source = { title: string; url: string };

function parseSources(v: unknown): Source[] {
  if (!Array.isArray(v)) return [];
  return v.filter(
    (s): s is Source => !!s && typeof s.title === "string" && typeof s.url === "string" && /^https?:\/\//.test(s.url)
  );
}

export function articleMetadata(a: FullArticle): Metadata {
  const root = a.category?.parent ?? a.category;
  return pageMetadata({
    title: a.seoTitle || a.title,
    description: a.metaDescription || a.excerpt || a.subtitle || a.title,
    path: articlePath(a),
    canonicalOverride: a.canonicalUrl,
    image: a.featuredImage
      ? { url: a.featuredImage.url, width: a.featuredImage.width, height: a.featuredImage.height, alt: a.featuredImage.alt }
      : null,
    index: a.robotsIndex,
    type: "article",
    publishedTime: a.publishedAt,
    modifiedTime: a.contentUpdatedAt ?? a.publishedAt,
    authors: a.author ? [authorPath(a.author)] : undefined,
    section: root?.name,
  });
}

/** Everything the article template needs, loaded in parallel. */
export async function loadArticleView(a: FullArticle) {
  const blocks = parseBody(a.body);
  const rootId = a.category?.parentId ?? a.categoryId;
  const [refs, related, more] = await Promise.all([
    resolveBodyRefs(collectRefs(blocks)),
    getRelatedArticles({
      id: a.id,
      categoryId: a.categoryId,
      rootCategoryId: rootId,
      tagIds: a.tags.map((t) => t.tagId),
      manualIds: a.relatedLinks.map((r) => r.relatedId),
    }),
    a.category
      ? getArticlesInCategories([a.categoryId!, ...(a.category.parentId ? [a.category.parentId] : [])], { take: 6, excludeIds: [a.id] })
      : Promise.resolve([]),
  ]);
  const relatedIds = new Set(related.map((r) => r.id));
  const moreFromCategory = more.filter((m) => !relatedIds.has(m.id)).slice(0, 3);

  const view: ArticleViewData = {
    title: a.title,
    subtitle: a.subtitle,
    slug: a.slug,
    publishedAt: a.publishedAt,
    contentUpdatedAt: a.contentUpdatedAt,
    wordCount: a.wordCount,
    isSample: a.isSample,
    isSponsored: a.isSponsored,
    sponsorName: a.sponsorName,
    hasAffiliateLinks: a.hasAffiliateLinks,
    showToc: a.showToc,
    sources: parseSources(a.sources),
    category: a.category
      ? { name: a.category.name, slug: a.category.slug, parent: a.category.parent ? { name: a.category.parent.name, slug: a.category.parent.slug } : null }
      : null,
    author: a.author
      ? { name: a.author.name, slug: a.author.slug, jobTitle: a.author.jobTitle, shortBio: a.author.shortBio, avatar: a.author.avatar }
      : null,
    featuredImage: a.featuredImage,
    tags: a.tags.map((t) => ({ name: t.tag.name, slug: t.tag.slug })),
  };

  const root = a.category?.parent ?? a.category;
  const jsonLd = a.publishedAt
    ? articleJsonLd({
        path: articlePath(a),
        canonical: a.canonicalUrl,
        headline: a.title,
        description: a.metaDescription || a.excerpt || a.title,
        image: a.featuredImage,
        datePublished: a.publishedAt,
        dateModified: a.contentUpdatedAt,
        author: a.author ? { name: a.author.name, path: authorPath(a.author), kind: a.author.kind } : null,
        section: root?.name,
        keywords: a.tags.map((t) => t.tag.name),
        wordCount: a.wordCount,
      })
    : null;

  return { view, blocks, refs, related, moreFromCategory, jsonLd };
}
