import "server-only";
import { db } from "@/lib/db";

/** Where an image is used. Deletion is blocked while any reference exists. */
export async function mediaUsage(id: string) {
  const [featured, avatars, products, inBody] = await Promise.all([
    db.article.findMany({ where: { featuredImageId: id }, select: { id: true, title: true } }),
    db.author.findMany({ where: { avatarId: id }, select: { id: true, name: true } }),
    db.product.findMany({ where: { imageId: id }, select: { id: true, name: true } }),
    db.$queryRaw<{ id: string; title: string }[]>`SELECT id, title FROM "Article" WHERE body::text LIKE ${"%" + id + "%"}`,
  ]);
  return { featured, avatars, products, inBody };
}
