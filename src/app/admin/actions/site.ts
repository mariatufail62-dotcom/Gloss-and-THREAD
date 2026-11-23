"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { hashPassword, passwordProblem } from "@/lib/auth/password";
import { bool, fail, int, ok, parseLabeledLinks, str, type ActionState } from "@/lib/admin/forms";
import { saveSetting } from "@/lib/settings";
import { revalidateEverything } from "@/lib/revalidate";

/* ───────────────────────── Homepage curation ───────────────────────── */

const SECTIONS = ["latest", "nails", "outfits", "shoes", "beautyHair", "accessories", "editorsPicks", "popular", "newsletter"] as const;

export async function saveHomepageAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser("EDITOR");
  const ids = (name: string, max: number) =>
    [...new Set(fd.getAll(name).map(String).map((s) => s.trim()).filter(Boolean))].slice(0, max);
  const hero = ids("hero", 3);
  const popular = ids("popular", 6);
  const picks = ids("picks", 8);

  const [validArticles, validProducts] = await Promise.all([
    db.article.findMany({ where: { id: { in: [...hero, ...popular] } }, select: { id: true } }),
    db.product.findMany({ where: { id: { in: picks } }, select: { id: true } }),
  ]);
  const aOk = new Set(validArticles.map((a) => a.id));
  const pOk = new Set(validProducts.map((p) => p.id));

  const order = fd.getAll("sectionOrder").map(String).filter((s): s is (typeof SECTIONS)[number] => (SECTIONS as readonly string[]).includes(s));
  const fullOrder = [...new Set([...order, ...SECTIONS])];

  await db.$transaction([
    db.homepageFeature.deleteMany({}),
    db.homepageFeature.createMany({
      data: [
        ...hero.filter((id) => aOk.has(id)).map((articleId, position) => ({ slot: "HERO" as const, position, articleId })),
        ...popular.filter((id) => aOk.has(id)).map((articleId, position) => ({ slot: "POPULAR" as const, position, articleId })),
        ...picks.filter((id) => pOk.has(id)).map((productId, position) => ({ slot: "EDITORS_PICKS" as const, position, productId })),
      ],
    }),
  ]);
  await saveSetting("homepage", { sectionOrder: fullOrder });
  await db.activityLog.create({ data: { userId: user.id, action: "homepage.update", entityType: "SiteSetting", summary: "Updated homepage curation" } });
  revalidatePath("/");
  revalidatePath("/admin/homepage/");
  return ok("Homepage updated.");
}

/* ───────────────────────── Site settings (admin) ───────────────────────── */

export async function saveSettingsAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser("ADMIN");
  const group = str(fd, "group");
  try {
    if (group === "general") {
      await saveSetting("general", {
        socialLinks: parseLabeledLinks(str(fd, "socialLinks")),
        contactEmail: str(fd, "contactEmail") ?? "",
        businessName: str(fd, "businessName") ?? "",
        businessAddress: str(fd, "businessAddress") ?? "",
      });
    } else if (group === "newsletter") {
      await saveSetting("newsletter", { heading: str(fd, "heading") ?? undefined, description: str(fd, "description") ?? undefined });
    } else if (group === "affiliate") {
      await saveSetting("affiliate", { disclosureShort: str(fd, "disclosureShort") ?? undefined, disclosureLong: str(fd, "disclosureLong") ?? "" });
    } else if (group === "ads") {
      const enabled = bool(fd, "enabled");
      const provider = str(fd, "provider") === "adsense" ? "adsense" : "none";
      const clientId = str(fd, "adsenseClientId") ?? "";
      if (enabled && (provider !== "adsense" || !clientId)) return fail("To enable ads, choose AdSense and enter your approved publisher ID (ca-pub-…).");
      await saveSetting("ads", {
        enabled,
        provider,
        adsenseClientId: clientId,
        slots: {
          articleIntro: str(fd, "slot_articleIntro") ?? "",
          articleMid: str(fd, "slot_articleMid") ?? "",
          sidebar: str(fd, "slot_sidebar") ?? "",
          betweenSections: str(fd, "slot_betweenSections") ?? "",
          belowRelated: str(fd, "slot_belowRelated") ?? "",
        },
        minWordsForMidArticle: int(fd, "minWordsForMidArticle", 900),
        adsTxt: str(fd, "adsTxt") ?? "",
      });
      revalidatePath("/ads.txt");
    } else {
      return fail("Unknown settings group.");
    }
  } catch (err) {
    if (err instanceof z.ZodError) return fail(err.issues[0].message);
    throw err;
  }
  await db.activityLog.create({ data: { userId: user.id, action: `settings.${group}`, entityType: "SiteSetting", entityId: group, summary: `Updated ${group} settings` } });
  revalidateEverything();
  return ok("Settings saved.");
}

/* ───────────────────────── Users (admin) ───────────────────────── */

const userSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email.").max(254),
  role: z.enum(["ADMIN", "EDITOR", "CONTRIBUTOR"]),
  authorId: z.string().max(40).optional(),
});

export async function saveUserAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireUser("ADMIN");
  const id = str(fd, "id");
  const parsed = userSchema.safeParse({ name: str(fd, "name") ?? "", email: str(fd, "email") ?? "", role: str(fd, "role") ?? "CONTRIBUTOR", authorId: str(fd, "authorId") });
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const f = parsed.data;
  const password = String(fd.get("password") ?? "");
  const isActive = bool(fd, "isActive");

  const emailOwner = await db.user.findUnique({ where: { email: f.email } });
  if (emailOwner && emailOwner.id !== id) return fail("Another user already has that email.");
  if (f.authorId) {
    const linked = await db.user.findFirst({ where: { authorId: f.authorId, NOT: id ? { id } : undefined } });
    if (linked) return fail("That author byline is already linked to another user.");
  }

  if (!id) {
    const problem = passwordProblem(password);
    if (problem) return fail(problem);
    const u = await db.user.create({ data: { ...f, authorId: f.authorId ?? null, isActive, passwordHash: await hashPassword(password) } });
    await db.activityLog.create({ data: { userId: me.id, action: "user.create", entityType: "User", entityId: u.id, summary: `Created ${u.role.toLowerCase()} ${u.email}` } });
    redirect(`/admin/users/?created=1`);
  }

  if (id === me.id && (f.role !== "ADMIN" || !isActive)) return fail("You can't remove your own admin role or deactivate yourself.");
  if (password) {
    const problem = passwordProblem(password);
    if (problem) return fail(problem);
  }
  await db.user.update({
    where: { id },
    data: { ...f, authorId: f.authorId ?? null, isActive, ...(password ? { passwordHash: await hashPassword(password) } : {}) },
  });
  if (!isActive || password) await db.session.deleteMany({ where: { userId: id, ...(id === me.id ? { NOT: { userId: me.id } } : {}) } });
  await db.activityLog.create({ data: { userId: me.id, action: "user.update", entityType: "User", entityId: id, summary: `Updated user ${f.email}` } });
  revalidatePath("/admin/users/");
  return ok(password ? "User saved. Their password was reset and existing sessions were signed out." : "User saved.");
}
