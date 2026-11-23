"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { bool, fail, int, ok, parseLabeledLinks, str, type ActionState } from "@/lib/admin/forms";
import { recordPathChange } from "@/lib/admin/redirects";
import { revalidateEverything } from "@/lib/revalidate";
import { RESERVED_SLUGS, SLUG_PATTERN, normalizePath, slugify } from "@/lib/site";
import { articlePath, categoryPath } from "@/lib/urls";

/* ───────────────────────── Categories ───────────────────────── */

const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(80),
  slug: z.string().trim().max(60).optional(),
  navLabel: z.string().trim().max(40).optional(),
  parentId: z.string().max(40).optional(),
  description: z.string().trim().max(300).optional(),
  intro: z.string().trim().max(5000).optional(),
  seoTitle: z.string().trim().max(120).optional(),
  metaDescription: z.string().trim().max(320).optional(),
});

export async function saveCategoryAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser("EDITOR");
  const id = str(fd, "id");
  const parsed = categorySchema.safeParse({
    name: str(fd, "name") ?? "",
    slug: str(fd, "slug"),
    navLabel: str(fd, "navLabel"),
    parentId: str(fd, "parentId"),
    description: str(fd, "description"),
    intro: str(fd, "intro"),
    seoTitle: str(fd, "seoTitle"),
    metaDescription: str(fd, "metaDescription"),
  });
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const f = parsed.data;
  const slug = slugify(f.slug ?? f.name);
  if (!SLUG_PATTERN.test(slug)) return fail("Slug may only use lowercase letters, numbers and hyphens.");

  const existing = id ? await db.category.findUnique({ where: { id }, include: { parent: true, children: true } }) : null;
  if (id && !existing) return fail("Category not found.");

  const parentId = f.parentId ?? null;
  if (parentId) {
    const parent = await db.category.findUnique({ where: { id: parentId } });
    if (!parent) return fail("Parent category not found.");
    if (parent.parentId) return fail("Categories can only be nested one level deep (pillar › subcategory).");
    if (existing && (parentId === existing.id || existing.children.length)) return fail("A category with subcategories can't become a subcategory.");
  } else {
    // Top-level slugs share the URL root with site pages and articles.
    if (RESERVED_SLUGS.has(slug)) return fail("That slug is reserved by a site page.");
    if (await db.article.findUnique({ where: { slug }, select: { id: true } })) return fail("An article already uses that slug.");
  }
  const clash = await db.category.findFirst({ where: { slug, parentId, NOT: id ? { id } : undefined } });
  if (clash) return fail("Another category at this level already uses that slug.");

  const data = {
    name: f.name,
    slug,
    navLabel: f.navLabel ?? null,
    parentId,
    description: f.description ?? null,
    intro: f.intro ?? null,
    seoTitle: f.seoTitle ?? null,
    metaDescription: f.metaDescription ?? null,
    sortOrder: int(fd, "sortOrder", 0),
    showInNav: bool(fd, "showInNav"),
    minArticlesToIndex: Math.max(1, Math.min(50, int(fd, "minArticlesToIndex", 3))),
  };

  if (!existing) {
    const c = await db.category.create({ data });
    await db.activityLog.create({ data: { userId: user.id, action: "category.create", entityType: "Category", entityId: c.id, summary: `Created category ${c.name}` } });
    revalidateEverything();
    redirect(`/admin/categories/${c.id}/?created=1`);
  }

  const parentSlug = parentId ? (await db.category.findUnique({ where: { id: parentId }, select: { slug: true } }))?.slug : undefined;
  const oldPath = categoryPath(existing);
  const newPath = categoryPath({ slug, parent: parentSlug ? { slug: parentSlug } : null });
  const isRoot = !existing.parentId;

  await db.$transaction(async (tx) => {
    // Articles live under their pillar's slug; capture their URLs before the change.
    const affected =
      isRoot && existing.slug !== slug
        ? await tx.article.findMany({
            where: { status: { in: ["PUBLISHED", "SCHEDULED"] }, OR: [{ categoryId: existing.id }, { category: { parentId: existing.id } }] },
            select: { slug: true, category: { select: { slug: true, parent: { select: { slug: true } } } } },
          })
        : [];
    await tx.category.update({ where: { id: existing.id }, data });
    if (oldPath !== newPath) {
      await recordPathChange(tx, oldPath, newPath, `Auto: category URL changed`);
      for (const ch of existing.children) {
        await recordPathChange(tx, `/${existing.slug}/${ch.slug}/`, `/${slug}/${ch.slug}/`, "Auto: parent category URL changed");
      }
      for (const a of affected) {
        await recordPathChange(tx, articlePath(a), `/${slug}/${a.slug}/`, "Auto: pillar category URL changed");
      }
    }
    await tx.activityLog.create({ data: { userId: user.id, action: "category.update", entityType: "Category", entityId: existing.id, summary: `Updated category ${data.name}` } });
  });
  revalidateEverything();
  return ok(oldPath !== newPath ? `Saved. Permanent redirects were created from ${oldPath} to ${newPath}.` : "Category saved.");
}

export async function deleteCategoryAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser("EDITOR");
  const id = str(fd, "id");
  const c = id ? await db.category.findUnique({ where: { id }, include: { _count: { select: { articles: true, children: true } } } }) : null;
  if (!c) return fail("Category not found.");
  if (c._count.children) return fail("Delete or move its subcategories first.");
  if (c._count.articles) return fail(`Move its ${c._count.articles} article(s) to another category first.`);
  await db.category.delete({ where: { id: c.id } });
  await db.activityLog.create({ data: { userId: user.id, action: "category.delete", entityType: "Category", entityId: c.id, summary: `Deleted category ${c.name}` } });
  revalidateEverything();
  redirect("/admin/categories/?deleted=1");
}

/* ───────────────────────── Authors ───────────────────────── */

const authorSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
  slug: z.string().trim().max(80).optional(),
  kind: z.enum(["PERSON", "ORGANIZATION"]),
  jobTitle: z.string().trim().max(120).optional(),
  shortBio: z.string().trim().max(300).optional(),
  bio: z.string().trim().max(5000).optional(),
  experience: z.string().trim().max(3000).optional(),
  avatarId: z.string().max(40).optional(),
});

export async function saveAuthorAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser("EDITOR");
  const id = str(fd, "id");
  const parsed = authorSchema.safeParse({
    name: str(fd, "name") ?? "",
    slug: str(fd, "slug"),
    kind: str(fd, "kind") ?? "PERSON",
    jobTitle: str(fd, "jobTitle"),
    shortBio: str(fd, "shortBio"),
    bio: str(fd, "bio"),
    experience: str(fd, "experience"),
    avatarId: str(fd, "avatarId"),
  });
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const f = parsed.data;
  const slug = slugify(f.slug ?? f.name);
  if (!SLUG_PATTERN.test(slug)) return fail("Slug may only use lowercase letters, numbers and hyphens.");
  const clash = await db.author.findFirst({ where: { slug, NOT: id ? { id } : undefined } });
  if (clash) return fail("Another author already uses that slug.");
  const socials = parseLabeledLinks(str(fd, "socialLinks"));
  const socialsOk = z.array(z.object({ label: z.string().min(1).max(40), url: z.string().url().max(500) })).max(10).safeParse(socials);
  if (!socialsOk.success) return fail("Social links must be one per line as “Label | https://url”.");

  const data = {
    name: f.name,
    slug,
    kind: f.kind,
    jobTitle: f.jobTitle ?? null,
    shortBio: f.shortBio ?? null,
    bio: f.bio ?? null,
    experience: f.experience ?? null,
    avatarId: f.avatarId ?? null,
    socialLinks: socialsOk.data,
    isActive: bool(fd, "isActive"),
  };
  const existing = id ? await db.author.findUnique({ where: { id } }) : null;
  if (id && !existing) return fail("Author not found.");
  if (!existing) {
    const a = await db.author.create({ data });
    await db.activityLog.create({ data: { userId: user.id, action: "author.create", entityType: "Author", entityId: a.id, summary: `Added author ${a.name}` } });
    redirect(`/admin/authors/${a.id}/?created=1`);
  }
  await db.$transaction(async (tx) => {
    await tx.author.update({ where: { id: existing.id }, data });
    if (existing.slug !== slug) await recordPathChange(tx, `/authors/${existing.slug}/`, `/authors/${slug}/`, "Auto: author URL changed");
  });
  await db.activityLog.create({ data: { userId: user.id, action: "author.update", entityType: "Author", entityId: existing.id, summary: `Updated author ${data.name}` } });
  revalidateEverything();
  return ok("Author saved.");
}

export async function deleteAuthorAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser("EDITOR");
  const id = str(fd, "id");
  const a = id ? await db.author.findUnique({ where: { id }, include: { _count: { select: { articles: true } } } }) : null;
  if (!a) return fail("Author not found.");
  if (a._count.articles) return fail(`Reassign this author's ${a._count.articles} article(s) first, or mark the author inactive.`);
  await db.author.delete({ where: { id: a.id } });
  await db.activityLog.create({ data: { userId: user.id, action: "author.delete", entityType: "Author", entityId: a.id, summary: `Deleted author ${a.name}` } });
  redirect("/admin/authors/?deleted=1");
}

/* ───────────────────────── Redirects ───────────────────────── */

function cleanPath(raw: string | undefined): string | null {
  if (!raw) return null;
  let p = raw.trim();
  try {
    if (/^https?:\/\//i.test(p)) p = new URL(p).pathname;
  } catch {
    return null;
  }
  if (!p.startsWith("/") || p.startsWith("//") || p.startsWith("/admin") || p.startsWith("/api/") || p.startsWith("/_next")) return null;
  return normalizePath(p);
}

export async function saveRedirectAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser("EDITOR");
  const from = cleanPath(str(fd, "fromPath"));
  const toRaw = str(fd, "toPath");
  if (!from) return fail("“From” must be a site path such as /old-article/.");
  if (from === "/") return fail("The homepage can't be redirected.");
  let to: string | null = null;
  if (toRaw && /^https:\/\//i.test(toRaw)) to = toRaw;
  else to = cleanPath(toRaw);
  if (!to) return fail("“To” must be a site path or a full https:// URL.");
  if (to === from) return fail("A redirect can't point to itself.");
  const back = await db.redirect.findUnique({ where: { fromPath: to } });
  if (back) return fail(`“To” is itself redirected to ${back.toPath}. Point straight at the final destination instead.`);
  await db.redirect.upsert({
    where: { fromPath: from },
    update: { toPath: to, permanent: !bool(fd, "temporary"), note: str(fd, "note") ?? null },
    create: { fromPath: from, toPath: to, permanent: !bool(fd, "temporary"), note: str(fd, "note") ?? null },
  });
  await db.redirect.updateMany({ where: { toPath: from }, data: { toPath: to } });
  await db.activityLog.create({ data: { userId: user.id, action: "redirect.save", entityType: "Redirect", summary: `Redirect ${from} → ${to}` } });
  revalidatePath("/admin/redirects/");
  revalidatePath(from);
  return ok(`Redirect saved: ${from} → ${to}`);
}

export async function deleteRedirectAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser("EDITOR");
  const id = str(fd, "id");
  const r = id ? await db.redirect.findUnique({ where: { id } }) : null;
  if (!r) return fail("Redirect not found.");
  await db.redirect.delete({ where: { id: r.id } });
  await db.activityLog.create({ data: { userId: user.id, action: "redirect.delete", entityType: "Redirect", summary: `Removed redirect ${r.fromPath}` } });
  revalidatePath("/admin/redirects/");
  return ok("Redirect removed.");
}

/* ───────────────────────── Messages ───────────────────────── */

export async function markMessageAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireUser("EDITOR");
  const id = str(fd, "id");
  if (!id) return fail("Missing message.");
  await db.contactMessage.update({ where: { id }, data: { isRead: str(fd, "read") === "1" } }).catch(() => null);
  revalidatePath("/admin/messages/");
  return ok("Updated.");
}

export async function deleteMessageAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireUser("EDITOR");
  const id = str(fd, "id");
  if (!id) return fail("Missing message.");
  await db.contactMessage.delete({ where: { id } }).catch(() => null);
  revalidatePath("/admin/messages/");
  return ok("Message deleted.");
}
