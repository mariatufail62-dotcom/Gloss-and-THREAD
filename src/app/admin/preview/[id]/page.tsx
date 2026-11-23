import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { canEditArticle } from "@/lib/admin/articles";
import { mediaSelect } from "@/lib/queries/public";
import { loadArticleView } from "@/lib/queries/article-page";
import { ArticleView } from "@/components/article/ArticleView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Preview", robots: { index: false, follow: false } };

type Props = { params: Promise<{ id: string }> };

/** Private preview of any article state. Never cached, never indexable. */
export default async function PreviewPage({ params }: Props) {
  const user = await requireUser();
  const { id } = await params;
  const a = await db.article.findUnique({
    where: { id },
    include: {
      category: { include: { parent: true } },
      author: { include: { avatar: { select: mediaSelect } } },
      featuredImage: { select: mediaSelect },
      tags: { include: { tag: true } },
      relatedLinks: { orderBy: { position: "asc" }, select: { relatedId: true } },
    },
  });
  if (!a || !canEditArticle(user, a)) notFound();
  const data = await loadArticleView({ ...a, publishedAt: a.publishedAt ?? new Date() });

  return (
    <div className="bg-white">
      <div className="sticky top-0 z-50 flex items-center justify-between gap-4 bg-ink px-4 py-2.5 text-[0.8125rem] text-white">
        <span>
          <strong className="font-semibold">Preview</strong> · {a.status.toLowerCase()} · not public, not indexed
        </span>
        <Link href={`/admin/articles/${a.id}/`} className="underline">Back to editor</Link>
      </div>
      <ArticleView article={data.view} blocks={data.blocks} refs={data.refs} related={data.related} moreFromCategory={data.moreFromCategory} preview />
    </div>
  );
}
