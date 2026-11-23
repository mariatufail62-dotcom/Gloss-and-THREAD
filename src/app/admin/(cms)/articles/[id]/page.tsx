import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { hasRole, requireUser } from "@/lib/auth/session";
import { parseBody } from "@/lib/blocks/schema";
import { auditArticleData, canEditArticle, editorInclude, loadEditorOptions } from "@/lib/admin/articles";
import { formatLabeledLinks } from "@/lib/admin/forms";
import { toDateTimeLocal } from "@/lib/format";
import { articlePath } from "@/lib/urls";
import { Notice, PageHeader, StatusBadge } from "@/components/admin/ui";
import { ArticleEditor, ArticleSecondaryActions } from "@/components/admin/editor/ArticleEditor";

export const metadata = { title: "Edit article" };

type Props = { params: Promise<{ id: string }> };

export default async function EditArticle({ params }: Props) {
  const user = await requireUser();
  const { id } = await params;
  const a = await db.article.findUnique({ where: { id }, include: editorInclude });
  if (!a) notFound();

  const editable = canEditArticle(user, a);
  if (!editable) {
    return (
      <>
        <PageHeader title={a.title} back={{ href: "/admin/articles/", label: "Articles" }} />
        <Notice tone="amber">This article is no longer editable by contributors once it has been published or handed to an editor. Ask an editor for changes.</Notice>
      </>
    );
  }

  const body = parseBody(a.body);
  const [options, checks] = await Promise.all([
    loadEditorOptions(),
    auditArticleData({ ...a, body, reviewStatus: a.reviewStatus }),
  ]);
  // Make sure images referenced by this article are in the picker list even if older than the recent window.
  const refIds = [a.featuredImageId, ...body.flatMap((b) => (b.type === "image" ? [b.mediaId] : b.type === "gallery" ? b.items.map((i) => i.mediaId) : []))].filter(
    (x): x is string => !!x && !options.media.some((m) => m.id === x)
  );
  if (refIds.length) {
    const extra = await db.media.findMany({ where: { id: { in: refIds } }, select: { id: true, url: true, alt: true, width: true, height: true, filename: true, credit: true, caption: true } });
    options.media.push(...extra);
  }

  const now = new Date();
  const isLive = (a.status === "PUBLISHED" || a.status === "SCHEDULED") && !!a.publishedAt && a.publishedAt <= now;
  const revisions = a.revisions.map((r) => ({ id: r.id, note: r.note, createdAt: r.createdAt.toISOString(), by: r.createdBy?.name ?? null }));

  return (
    <>
      <PageHeader
        title={a.title || "Untitled"}
        back={{ href: "/admin/articles/", label: "Articles" }}
        actions={<StatusBadge status={a.status} publishedAt={a.publishedAt} />}
      />
      {a.isSample && (
        <div className="mb-6">
          <Notice tone="amber">Sample content. It shows a notice to readers and should be replaced with reviewed editorial work before launch.</Notice>
        </div>
      )}
      <ArticleEditor
        article={{
          id: a.id,
          title: a.title,
          slug: a.slug,
          subtitle: a.subtitle ?? "",
          excerpt: a.excerpt ?? "",
          body,
          categoryId: a.categoryId ?? "",
          authorId: a.authorId ?? "",
          featuredImageId: a.featuredImageId,
          seoTitle: a.seoTitle ?? "",
          metaDescription: a.metaDescription ?? "",
          canonicalUrl: a.canonicalUrl ?? "",
          robotsIndex: a.robotsIndex,
          inSitemap: a.inSitemap,
          isFeatured: a.isFeatured,
          isSponsored: a.isSponsored,
          sponsorName: a.sponsorName ?? "",
          hasAffiliateLinks: a.hasAffiliateLinks,
          showToc: a.showToc,
          isSample: a.isSample,
          contentType: a.contentType,
          sources: formatLabeledLinks(a.sources, "title"),
          tags: a.tags.map((t) => t.tag.name).join(", "),
          relatedIds: a.relatedLinks.map((r) => r.relatedId),
          reviewStatus: a.reviewStatus,
          reviewNotes: a.reviewNotes ?? "",
          publishedAtLocal: toDateTimeLocal(a.publishedAt),
          status: a.status,
          isLive,
          publicPath: a.category ? articlePath(a) : null,
          createdBy: a.createdBy?.name ?? null,
          reviewedBy: a.reviewedBy?.name ?? null,
        }}
        options={options}
        checks={checks}
        revisions={revisions}
        isEditor={hasRole(user, "EDITOR")}
      />
      <ArticleSecondaryActions id={a.id} revisions={revisions} canDelete={a.status === "DRAFT" || a.status === "ARCHIVED"} />
    </>
  );
}
