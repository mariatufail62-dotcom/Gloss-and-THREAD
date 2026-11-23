"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { hasRole, requireUser } from "@/lib/auth/session";
import { bodySchema, type Block } from "@/lib/blocks/schema";
import { autoExcerpt, blocksToPlainText, countWords } from "@/lib/blocks/text";
import { markdownToBlocks } from "@/lib/blocks/markdown";
import { auditSummary } from "@/lib/audit";
import { auditArticleData, canEditArticle } from "@/lib/admin/articles";
import { recordPathChange } from "@/lib/admin/redirects";
import { bool, fail, ok, parseLabeledLinks, str, type ActionState } from "@/lib/admin/forms";
import { fromDateTimeLocal } from "@/lib/format";
import { isSlugReserved } from "@/lib/link-index";
import { revalidateArticle } from "@/lib/revalidate";
import { SLUG_PATTERN, slugify } from "@/lib/site";
import { articlePath } from "@/lib/urls";

const CONTENT_TYPES = ["INSPIRATION_GALLERY", "HOW_TO", "EXPLAINER", "TREND_ANALYSIS", "OUTFIT_GUIDE", "COMPARISON", "SHOPPING_ROUNDUP", "FEATURE"] as const;
const REVIEW = ["NOT_REVIEWED", "CHANGES_REQUESTED", "APPROVED"] as const;
const optId = z.string().max(40).optional();

const fieldsSchema = z.object({
  title: z.string().trim().min(1, "Headline is required.").max(200),
  slug: z.string().trim().max(90).optional(),
  subtitle: z.string().trim().max(300).optional(),
  excerpt: z.string().trim().max(400).optional(),
  categoryId: optId,
  authorId: optId,
  featuredImageId: optId,
  seoTitle: z.string().trim().max(120).optional(),
  metaDescription: z.string().trim().max(320).optional(),
  canonicalUrl: z.string().trim().url("Canonical override must be an absolute URL.").max(500).optional(),
  contentType: z.enum(CONTENT_TYPES),
  sponsorName: z.string().trim().max(120).optional(),
  reviewStatus: z.enum(REVIEW),
  reviewNotes: z.string().trim().max(2000).optional(),
  publishedAt: z.string().max(40).optional(),
});

const sourcesSchema = z.array(z.object({ title: z.string().min(1).max(200), url: z.string().url().max(500) })).max(30);

const snapshotKeys = [
  "title", "slug", "subtitle", "excerpt", "body", "categoryId", "authorId", "featuredImageId", "seoTitle",
  "metaDescription", "canonicalUrl", "robotsIndex", "inSitemap", "isFeatured", "isSponsored", "sponsorName",
  "hasAffiliateLinks", "showToc", "contentType", "sources",
] as const;

function blockError(err: z.ZodError): string {
  const i = err.issues[0];
  const idx = typeof i.path[0] === "number" ? i.path[0] + 1 : null;
  return `${idx ? `Block ${idx}: ` : ""}${i.message}${i.path.length > 1 ? ` (${i.path.slice(1).join(".")})` : ""}`;
}

type Intent = "save" | "publish" | "schedule" | "unpublish" | "archive";

/** Create a new draft from the "New article" form and open it in the editor. */
export async function createArticleAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const title = str(fd, "title");
  if (!title) return fail("Give the article a working headline.");
  let base = slugify(title) || "untitled";
  if (await isSlugReserved(base)) base = `${base}-article`;
  let slug = base;
  for (let n = 2; await db.article.findUnique({ where: { slug }, select: { id: true } }); n++) slug = `${base}-${n}`;

  const authorId = str(fd, "authorId") ?? user.authorId ?? undefined;
  const created = await db.article.create({
    data: {
      title: title.slice(0, 200),
      slug,
      categoryId: str(fd, "categoryId"),
      authorId,
      contentType: CONTENT_TYPES.includes(str(fd, "contentType") as never) ? (str(fd, "contentType") as (typeof CONTENT_TYPES)[number]) : "FEATURE",
      createdById: user.id,
    },
  });
  await db.activityLog.create({
    data: { userId: user.id, action: "article.create", entityType: "Article", entityId: created.id, summary: `Created draft “${created.title}”` },
  });
  redirect(`/admin/articles/${created.id}/`);
}

export async function saveArticleAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const id = str(fd, "id");
  const intent = (str(fd, "intent") ?? "save") as Intent;
  if (!id) return fail("Missing article id.");

  const existing = await db.article.findUnique({
    where: { id },
    include: { category: { select: { slug: true, parent: { select: { slug: true } } } } },
  });
  if (!existing) return fail("This article no longer exists.");
  if (!canEditArticle(user, existing)) return fail("You don't have permission to edit this article.");
  if (intent !== "save" && !hasRole(user, "EDITOR")) return fail("Only editors can publish, schedule or unpublish.");

  const parsed = fieldsSchema.safeParse({
    title: fd.get("title") ?? "",
    slug: str(fd, "slug"),
    subtitle: str(fd, "subtitle"),
    excerpt: str(fd, "excerpt"),
    categoryId: str(fd, "categoryId"),
    authorId: str(fd, "authorId"),
    featuredImageId: str(fd, "featuredImageId"),
    seoTitle: str(fd, "seoTitle"),
    metaDescription: str(fd, "metaDescription"),
    canonicalUrl: str(fd, "canonicalUrl"),
    contentType: str(fd, "contentType") ?? "FEATURE",
    sponsorName: str(fd, "sponsorName"),
    reviewStatus: str(fd, "reviewStatus") ?? existing.reviewStatus,
    reviewNotes: str(fd, "reviewNotes"),
    publishedAt: str(fd, "publishedAt"),
  });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message;
    return fail("Please fix the highlighted fields.", { errors });
  }
  const f = parsed.data;

  let rawBody: unknown;
  try {
    rawBody = JSON.parse(String(fd.get("body") ?? "[]"));
  } catch {
    return fail("The article body could not be read. Reload the editor and try again.");
  }
  const bodyParsed = bodySchema.safeParse(rawBody);
  if (!bodyParsed.success) return fail(`Body problem — ${blockError(bodyParsed.error)}`);
  const body: Block[] = bodyParsed.data;

  // Slug
  const slug = f.slug ? slugify(f.slug) : slugify(f.title);
  if (!slug || !SLUG_PATTERN.test(slug)) return fail("The URL slug may only use lowercase letters, numbers and hyphens.", { errors: { slug: "Invalid slug" } });
  if (await isSlugReserved(slug)) return fail("That slug is reserved by a site route or category name.", { errors: { slug: "Reserved" } });
  const owner = await db.article.findUnique({ where: { slug }, select: { id: true } });
  if (owner && owner.id !== id) return fail("Another article already uses that slug.", { errors: { slug: "Already in use" } });

  // References must exist
  const [cat, author, image] = await Promise.all([
    f.categoryId ? db.category.findUnique({ where: { id: f.categoryId }, select: { id: true, slug: true, parent: { select: { slug: true } } } }) : null,
    f.authorId ? db.author.findUnique({ where: { id: f.authorId }, select: { id: true } }) : null,
    f.featuredImageId ? db.media.findUnique({ where: { id: f.featuredImageId }, select: { id: true } }) : null,
  ]);
  if (f.categoryId && !cat) return fail("The selected category no longer exists.");
  if (f.authorId && !author) return fail("The selected author no longer exists.");
  if (f.featuredImageId && !image) return fail("The selected featured image no longer exists.");

  const sources = sourcesSchema.safeParse(parseLabeledLinks(str(fd, "sources")).map((s) => ({ title: s.label, url: s.url })));
  if (!sources.success) return fail("Sources must be one per line as “Title | https://url”.", { errors: { sources: "Invalid source line" } });

  const tagNames = [...new Set((str(fd, "tags") ?? "").split(",").map((t) => t.trim()).filter(Boolean))].slice(0, 15);
  const relatedIds = [...new Set((str(fd, "relatedIds") ?? "").split(",").map((t) => t.trim()).filter((t) => t && t !== id))].slice(0, 4);

  const plain = blocksToPlainText(body);
  const wordCount = countWords(plain);
  const editor = hasRole(user, "EDITOR");
  const reviewStatus = editor ? f.reviewStatus : existing.reviewStatus === "APPROVED" ? "APPROVED" : f.reviewStatus === "APPROVED" ? existing.reviewStatus : f.reviewStatus;

  const data = {
    title: f.title,
    slug,
    subtitle: f.subtitle ?? null,
    excerpt: f.excerpt ?? (autoExcerpt(body) || null),
    body: body as object[],
    searchText: plain.slice(0, 100_000),
    wordCount,
    contentType: f.contentType,
    categoryId: f.categoryId ?? null,
    authorId: f.authorId ?? null,
    featuredImageId: f.featuredImageId ?? null,
    seoTitle: f.seoTitle ?? null,
    metaDescription: f.metaDescription ?? null,
    canonicalUrl: editor ? (f.canonicalUrl ?? null) : existing.canonicalUrl,
    robotsIndex: editor ? bool(fd, "robotsIndex") : existing.robotsIndex,
    inSitemap: editor ? bool(fd, "inSitemap") : existing.inSitemap,
    isFeatured: editor ? bool(fd, "isFeatured") : existing.isFeatured,
    isSponsored: bool(fd, "isSponsored"),
    sponsorName: f.sponsorName ?? null,
    hasAffiliateLinks: bool(fd, "hasAffiliateLinks"),
    showToc: bool(fd, "showToc"),
    isSample: editor ? bool(fd, "isSample") : existing.isSample,
    sources: sources.data,
    reviewStatus,
    reviewNotes: f.reviewNotes ?? null,
  };

  if (data.isSponsored && !data.sponsorName) return fail("Sponsored articles must name the sponsor.", { errors: { sponsorName: "Required" } });

  // Status transitions
  const now = new Date();
  let status = existing.status;
  let publishedAt = existing.publishedAt;
  const requested = f.publishedAt ? fromDateTimeLocal(f.publishedAt) : null;

  if (intent === "publish" || intent === "schedule") {
    const checks = await auditArticleData({ id, ...data, body, featuredImageId: data.featuredImageId, reviewStatus: data.reviewStatus });
    const blocking = checks.filter((c) => c.level === "error");
    if (blocking.length) {
      return fail("Fix these checklist items before publishing. Your changes were not saved.", {
        details: blocking.map((c) => `${c.label}: ${c.message}`),
      });
    }
    if (intent === "publish") {
      status = "PUBLISHED";
      // Re-publishing keeps the original date; a past date chosen by the editor is honored; otherwise now.
      publishedAt = existing.publishedAt && existing.publishedAt <= now ? existing.publishedAt : requested && requested <= now ? requested : now;
    } else {
      if (!requested || requested <= now) return fail("Choose a future date and time to schedule publication.", { errors: { publishedAt: "Must be in the future" } });
      status = "SCHEDULED";
      publishedAt = requested;
    }
  } else if (intent === "unpublish") {
    status = "DRAFT";
  } else if (intent === "archive") {
    status = "ARCHIVED";
  } else if (editor && requested && existing.status === "PUBLISHED") {
    // Editors may correct the displayed publication date of a live article.
    publishedAt = requested <= now ? requested : existing.publishedAt;
  }

  const wasLive = (existing.status === "PUBLISHED" || existing.status === "SCHEDULED") && !!existing.publishedAt && existing.publishedAt <= now;
  const markUpdated = editor && bool(fd, "markUpdated") && wasLive;
  const isReviewChange = editor && reviewStatus !== existing.reviewStatus;

  const oldPath = articlePath(existing);
  const newPath = articlePath({ slug, category: cat });

  await db.$transaction(async (tx) => {
    // Tags
    const tagIds: string[] = [];
    for (const name of tagNames) {
      const tslug = slugify(name);
      if (!tslug) continue;
      const tag = await tx.tag.upsert({ where: { slug: tslug }, update: {}, create: { slug: tslug, name: name.slice(0, 60) } });
      tagIds.push(tag.id);
    }
    await tx.articleTag.deleteMany({ where: { articleId: id } });
    if (tagIds.length) await tx.articleTag.createMany({ data: tagIds.map((tagId) => ({ articleId: id, tagId })), skipDuplicates: true });

    // Manual related reading
    const validRelated = relatedIds.length ? await tx.article.findMany({ where: { id: { in: relatedIds } }, select: { id: true } }) : [];
    await tx.articleRelation.deleteMany({ where: { articleId: id } });
    const okIds = relatedIds.filter((r) => validRelated.some((v) => v.id === r));
    if (okIds.length) await tx.articleRelation.createMany({ data: okIds.map((relatedId, position) => ({ articleId: id, relatedId, position })) });

    await tx.article.update({
      where: { id },
      data: {
        ...data,
        status,
        publishedAt,
        ...(markUpdated ? { contentUpdatedAt: now } : {}),
        ...(isReviewChange ? { reviewedById: user.id, reviewedAt: now } : {}),
      },
    });

    if (wasLive && oldPath !== newPath) await recordPathChange(tx, oldPath, newPath, `Auto: article URL changed (${existing.slug} → ${slug})`);

    const snapshot = Object.fromEntries(snapshotKeys.map((k) => [k, (data as Record<string, unknown>)[k]]));
    await tx.articleRevision.create({
      data: { articleId: id, snapshot: { ...snapshot, tags: tagNames, relatedIds: okIds } as object, note: intent === "save" ? "Saved" : intent[0].toUpperCase() + intent.slice(1), createdById: user.id },
    });
    // Keep the 50 most recent revisions.
    const old = await tx.articleRevision.findMany({ where: { articleId: id }, orderBy: { createdAt: "desc" }, skip: 50, select: { id: true } });
    if (old.length) await tx.articleRevision.deleteMany({ where: { id: { in: old.map((o) => o.id) } } });

    await tx.activityLog.create({
      data: {
        userId: user.id,
        action: `article.${intent}`,
        entityType: "Article",
        entityId: id,
        summary: `${{ save: "Saved", publish: "Published", schedule: "Scheduled", unpublish: "Unpublished", archive: "Archived" }[intent]} “${data.title}”`,
      },
    });
  });

  revalidateArticle({ slug, category: cat }, { slug: existing.slug, category: existing.category });
  revalidatePath(`/admin/articles/${id}/`);

  const checks = await auditArticleData({ id, ...data, body, reviewStatus: data.reviewStatus });
  const { errors, warnings } = auditSummary(checks);
  const msg =
    intent === "publish"
      ? "Published. The article is live."
      : intent === "schedule"
        ? "Scheduled. It will go live at the chosen time."
        : intent === "unpublish"
          ? "Unpublished. The article is now a draft and no longer public."
          : intent === "archive"
            ? "Archived."
            : status === "PUBLISHED"
              ? "Live article updated."
              : "Draft saved.";
  return ok(msg, { details: intent === "save" && (errors || warnings) ? [`Checklist: ${errors} blocking, ${warnings} advisory.`] : undefined });
}

export async function deleteArticleAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const id = str(fd, "id");
  const a = id ? await db.article.findUnique({ where: { id } }) : null;
  if (!a) return fail("Article not found.");
  if (!canEditArticle(user, a)) return fail("You don't have permission to delete this article.");
  if (a.status === "PUBLISHED" || a.status === "SCHEDULED") return fail("Unpublish the article before deleting it.");
  await db.article.delete({ where: { id: a.id } });
  await db.activityLog.create({ data: { userId: user.id, action: "article.delete", entityType: "Article", entityId: a.id, summary: `Deleted “${a.title}”` } });
  revalidatePath("/admin/articles/");
  redirect("/admin/articles/?deleted=1");
}

export async function restoreRevisionAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const revId = str(fd, "revisionId");
  const rev = revId ? await db.articleRevision.findUnique({ where: { id: revId }, include: { article: true } }) : null;
  if (!rev) return fail("Revision not found.");
  if (!canEditArticle(user, rev.article)) return fail("You don't have permission to edit this article.");
  if (rev.article.status !== "DRAFT" && !hasRole(user, "EDITOR")) return fail("Only editors can change live articles.");
  const s = rev.snapshot as Record<string, unknown>;
  const body = bodySchema.safeParse(s.body);
  if (!body.success) return fail("This revision's body is no longer valid and can't be restored.");
  const slugTaken = typeof s.slug === "string" ? await db.article.findFirst({ where: { slug: s.slug, NOT: { id: rev.articleId } }, select: { id: true } }) : null;
  const plain = blocksToPlainText(body.data);
  await db.article.update({
    where: { id: rev.articleId },
    data: {
      title: String(s.title ?? rev.article.title),
      subtitle: (s.subtitle as string | null) ?? null,
      excerpt: (s.excerpt as string | null) ?? null,
      body: body.data as object[],
      searchText: plain,
      wordCount: countWords(plain),
      seoTitle: (s.seoTitle as string | null) ?? null,
      metaDescription: (s.metaDescription as string | null) ?? null,
      // Slug is only restored when free, and never for live articles (would break URLs silently).
      ...(rev.article.status === "DRAFT" && !slugTaken && typeof s.slug === "string" ? { slug: s.slug } : {}),
    },
  });
  await db.articleRevision.create({ data: { articleId: rev.articleId, snapshot: rev.snapshot as object, note: `Restored revision from ${rev.createdAt.toISOString().slice(0, 16).replace("T", " ")} UTC`, createdById: user.id } });
  await db.activityLog.create({ data: { userId: user.id, action: "article.restore", entityType: "Article", entityId: rev.articleId, summary: `Restored a revision of “${rev.article.title}”` } });
  revalidatePath(`/admin/articles/${rev.articleId}/`);
  if (rev.article.status !== "DRAFT") {
    const full = await db.article.findUnique({ where: { id: rev.articleId }, select: { slug: true, category: { select: { slug: true, parent: { select: { slug: true } } } } } });
    if (full) revalidateArticle(full);
  }
  return ok("Revision restored into the editor. Review it, then save or publish.");
}

/** Converts pasted Markdown into blocks for the editor (does not save). */
export async function importMarkdownAction(markdown: string): Promise<{ ok: true; blocks: Block[] } | { ok: false; error: string }> {
  await requireUser();
  if (markdown.length > 200_000) return { ok: false, error: "That text is too long to import at once." };
  const blocks = markdownToBlocks(markdown);
  const parsed = bodySchema.safeParse(blocks);
  if (!parsed.success) return { ok: false, error: blockError(parsed.error) };
  return { ok: true, blocks: parsed.data };
}
