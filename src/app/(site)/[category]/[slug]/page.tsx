import type { Metadata } from "next";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  findRedirect,
  getArticleBySlug,
  getCategoryTree,
  getRootCategory,
  getSubcategory,
  publishedWhere,
} from "@/lib/queries/public";
import { articleMetadata, loadArticleView } from "@/lib/queries/article-page";
import { articlePath } from "@/lib/urls";
import { getSetting } from "@/lib/settings";
import { CategoryLanding, categoryMetadata } from "@/components/category/CategoryLanding";
import { ArticleView } from "@/components/article/ArticleView";
import { JsonLd } from "@/components/editorial/Common";

export const revalidate = 600;

/** Pre-render subcategory pages and published articles at build time. */
export async function generateStaticParams() {
  try {
    const [tree, articles] = await Promise.all([
      getCategoryTree(),
      db.article.findMany({
        where: publishedWhere(),
        select: { slug: true, category: { select: { slug: true, parent: { select: { slug: true } } } } },
        take: 500,
        orderBy: { publishedAt: "desc" },
      }),
    ]);
    const subs = tree.flatMap((r) => r.children.map((c) => ({ category: r.slug, slug: c.slug })));
    const arts = articles.filter((a) => a.category).map((a) => ({ category: a.category!.parent?.slug ?? a.category!.slug, slug: a.slug }));
    return [...subs, ...arts];
  } catch {
    return [];
  }
}

type Props = { params: Promise<{ category: string; slug: string }> };

async function resolve(category: string, slug: string) {
  const sub = await getSubcategory(category, slug);
  if (sub) return { kind: "category" as const, node: sub };
  const article = await getArticleBySlug(slug);
  if (article && article.category) return { kind: "article" as const, article };
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, slug } = await params;
  const r = await resolve(category, slug);
  if (!r) return { title: "Not found", robots: { index: false } };
  return r.kind === "category" ? categoryMetadata(r.node, 1) : articleMetadata(r.article);
}

export default async function CategoryOrArticlePage({ params }: Props) {
  const { category, slug } = await params;
  const r = await resolve(category, slug);

  if (!r) {
    const red = await findRedirect(`/${category}/${slug}/`);
    if (red) (red.permanent ? permanentRedirect : redirect)(red.toPath);
    notFound();
  }

  if (r.kind === "category") return <CategoryLanding node={r.node} page={1} />;

  const a = r.article;
  // One preferred URL per article: if it moved category, send readers to the canonical path.
  const canonicalPath = articlePath(a);
  if (canonicalPath !== `/${category}/${slug}/`) permanentRedirect(canonicalPath);
  if (!(await getRootCategory(category))) notFound();

  const [data, ads] = await Promise.all([loadArticleView(a), getSetting("ads")]);
  return (
    <>
      {data.jsonLd && <JsonLd data={data.jsonLd} />}
      <ArticleView
        article={data.view}
        blocks={data.blocks}
        refs={data.refs}
        related={data.related}
        moreFromCategory={data.moreFromCategory}
        ads={ads.enabled ? { minWordsForMidArticle: ads.minWordsForMidArticle } : undefined}
      />
    </>
  );
}
