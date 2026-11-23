import "server-only";
import { revalidatePath } from "next/cache";
import { articlePath, categoryPath, type CategoryRef } from "@/lib/urls";

/**
 * Cache invalidation after CMS writes. Public pages use ISR (revalidate = 600),
 * so these calls make edits visible immediately instead of within 10 minutes.
 */

export function revalidateSiteChrome() {
  // Header mega menu, footer and homepage depend on almost everything.
  revalidatePath("/", "layout");
}

export function revalidateArticle(a: { slug: string; category?: CategoryRef | null }, previous?: { slug: string; category?: CategoryRef | null }) {
  revalidatePath(articlePath(a));
  if (previous) revalidatePath(articlePath(previous));
  for (const c of [a.category, previous?.category]) {
    if (!c) continue;
    revalidatePath(categoryPath(c));
    if (c.parent) revalidatePath(categoryPath({ slug: c.parent.slug }));
  }
  revalidatePath("/blog/");
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
  revalidatePath("/feed.xml");
}

export function revalidateEverything() {
  revalidatePath("/", "layout");
}
