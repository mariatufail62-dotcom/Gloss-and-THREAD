"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { bool, fail, ok, str, type ActionState } from "@/lib/admin/forms";
import { revalidateEverything } from "@/lib/revalidate";

const productSchema = z.object({
  name: z.string().trim().min(1, "Product name is required.").max(200),
  brand: z.string().trim().min(1, "Brand is required.").max(120),
  description: z.string().trim().max(500).optional(),
  imageId: z.string().max(40).optional(),
});

export async function saveProductAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser("EDITOR");
  const id = str(fd, "id");
  const parsed = productSchema.safeParse({ name: str(fd, "name") ?? "", brand: str(fd, "brand") ?? "", description: str(fd, "description"), imageId: str(fd, "imageId") });
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  if (parsed.data.imageId && !(await db.media.findUnique({ where: { id: parsed.data.imageId }, select: { id: true } }))) return fail("Selected image not found.");
  const data = { ...parsed.data, description: parsed.data.description ?? null, imageId: parsed.data.imageId ?? null, isActive: bool(fd, "isActive") };
  if (id) {
    await db.product.update({ where: { id }, data });
    await db.activityLog.create({ data: { userId: user.id, action: "product.update", entityType: "Product", entityId: id, summary: `Updated product ${data.brand} ${data.name}` } });
    revalidatePath(`/admin/products/${id}/`);
    revalidateEverything();
    return ok("Product saved.");
  }
  const p = await db.product.create({ data });
  await db.activityLog.create({ data: { userId: user.id, action: "product.create", entityType: "Product", entityId: p.id, summary: `Added product ${p.brand} ${p.name}` } });
  redirect(`/admin/products/${p.id}/?created=1`);
}

const linkSchema = z.object({
  merchant: z.string().trim().min(1, "Merchant is required.").max(120),
  url: z.string().trim().url("Merchant URL must be a full https:// URL.").max(1000).refine((u) => u.startsWith("https://"), "Use an https:// link."),
  affiliateUrl: z.string().trim().url("Affiliate URL must be a full URL.").max(1500).optional(),
  network: z.string().trim().max(80).optional(),
  price: z.string().trim().regex(/^\d{1,6}(\.\d{1,2})?$/, "Price must look like 48 or 48.00").optional(),
  currency: z.string().trim().regex(/^[A-Z]{3}$/, "Use a 3-letter currency code").default("USD"),
});

export async function saveLinkAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser("EDITOR");
  const productId = str(fd, "productId");
  const linkId = str(fd, "linkId");
  if (!productId || !(await db.product.findUnique({ where: { id: productId }, select: { id: true } }))) return fail("Product not found.");
  const parsed = linkSchema.safeParse({
    merchant: str(fd, "merchant") ?? "",
    url: str(fd, "url") ?? "",
    affiliateUrl: str(fd, "affiliateUrl"),
    network: str(fd, "network"),
    price: str(fd, "price"),
    currency: (str(fd, "currency") ?? "USD").toUpperCase(),
  });
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const isAffiliate = bool(fd, "isAffiliate");
  if (isAffiliate && !parsed.data.affiliateUrl) return fail("An affiliate link needs the affiliate URL from your network. Leave “affiliate” unchecked for plain merchant links.");
  const now = new Date();
  const priceCents = parsed.data.price ? Math.round(Number(parsed.data.price) * 100) : null;
  const existing = linkId ? await db.affiliateLink.findUnique({ where: { id: linkId } }) : null;
  const data = {
    merchant: parsed.data.merchant,
    url: parsed.data.url,
    affiliateUrl: isAffiliate ? parsed.data.affiliateUrl! : null,
    network: parsed.data.network ?? null,
    isAffiliate,
    priceCents,
    currency: parsed.data.currency,
    isPrimary: bool(fd, "isPrimary"),
    // Verification stamps are set only when the editor confirms they checked today.
    linkVerifiedAt: bool(fd, "verifyLink") ? now : existing?.url === parsed.data.url ? existing.linkVerifiedAt : null,
    priceVerifiedAt: priceCents == null ? null : bool(fd, "verifyPrice") ? now : existing?.priceCents === priceCents ? existing.priceVerifiedAt : null,
  };
  if (data.isPrimary) await db.affiliateLink.updateMany({ where: { productId, NOT: linkId ? { id: linkId } : undefined }, data: { isPrimary: false } });
  if (existing) await db.affiliateLink.update({ where: { id: existing.id }, data });
  else await db.affiliateLink.create({ data: { ...data, productId } });
  await db.activityLog.create({ data: { userId: user.id, action: "product.link", entityType: "Product", entityId: productId, summary: `${existing ? "Updated" : "Added"} ${data.merchant} link` } });
  revalidatePath(`/admin/products/${productId}/`);
  revalidateEverything();
  return ok(data.linkVerifiedAt ? "Link saved." : "Link saved, but it is unverified — it won't appear on the site until you confirm you checked it.");
}

export async function deleteLinkAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireUser("EDITOR");
  const id = str(fd, "id");
  const link = id ? await db.affiliateLink.findUnique({ where: { id } }) : null;
  if (!link) return fail("Link not found.");
  await db.affiliateLink.delete({ where: { id: link.id } });
  revalidatePath(`/admin/products/${link.productId}/`);
  revalidateEverything();
  return ok("Link removed.");
}

export async function deleteProductAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser("EDITOR");
  const id = str(fd, "id");
  const p = id ? await db.product.findUnique({ where: { id } }) : null;
  if (!p) return fail("Product not found.");
  const inBody = await db.$queryRaw<{ id: string }[]>`SELECT id FROM "Article" WHERE body::text LIKE ${"%" + p.id + "%"} LIMIT 1`;
  if (inBody.length) return fail("This product is used in an article's product picks. Remove it there first, or mark it inactive.");
  await db.product.delete({ where: { id: p.id } });
  await db.activityLog.create({ data: { userId: user.id, action: "product.delete", entityType: "Product", entityId: p.id, summary: `Deleted product ${p.brand} ${p.name}` } });
  revalidateEverything();
  redirect("/admin/products/?deleted=1");
}
