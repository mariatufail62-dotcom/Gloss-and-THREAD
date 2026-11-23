import type { Block } from "@/lib/blocks/schema";
import { bodyLinks } from "@/lib/blocks/text";
import { normalizePath } from "@/lib/site";

/**
 * Editorial SEO checklist. These are quality checks for editors — they are not
 * ranking scores and make no claims about Google's algorithms.
 * Errors block publishing; warnings are advisory.
 */

export type CheckLevel = "error" | "warning" | "ok";

export interface AuditCheck {
  id: string;
  label: string;
  level: CheckLevel;
  message: string;
}

export interface AuditInput {
  title: string;
  slug: string;
  seoTitle?: string | null;
  metaDescription?: string | null;
  excerpt?: string | null;
  categoryId?: string | null;
  authorId?: string | null;
  featuredImage?: { alt: string } | null;
  body: Block[];
  bodyMediaAlt: Map<string, string>; // mediaId → alt
  canonicalUrl?: string | null;
  robotsIndex: boolean;
  reviewStatus: "NOT_REVIEWED" | "CHANGES_REQUESTED" | "APPROVED";
  hasProducts: boolean;
  hasAffiliateLinks: boolean;
  wordCount: number;
}

export interface AuditContext {
  slugTakenByOther: boolean;
  slugIsReserved: boolean;
  isKnownPath: (path: string) => boolean;
  siteOrigin: string;
}

export function auditArticle(a: AuditInput, ctx: AuditContext): AuditCheck[] {
  const checks: AuditCheck[] = [];
  const add = (id: string, label: string, level: CheckLevel, message: string) =>
    checks.push({ id, label, level, message });

  // Title / H1 — the article title renders as the page's only H1.
  const title = a.title.trim();
  if (!title) add("title", "Headline (H1)", "error", "Add a headline. It renders as the page H1.");
  else if (title.length > 110) add("title", "Headline (H1)", "warning", `Headline is ${title.length} characters; consider tightening.`);
  else add("title", "Headline (H1)", "ok", "Headline present.");

  const seoTitle = (a.seoTitle || title).trim();
  if (!a.seoTitle?.trim()) add("seoTitle", "SEO title", "warning", "No custom SEO title — the headline will be used.");
  else if (seoTitle.length > 65) add("seoTitle", "SEO title", "warning", `SEO title is ${seoTitle.length} characters and may be truncated in results.`);
  else add("seoTitle", "SEO title", "ok", "SEO title set.");

  const md = a.metaDescription?.trim() ?? "";
  if (!md) add("meta", "Meta description", "error", "Write a unique meta description (about 120–160 characters).");
  else if (md.length < 70 || md.length > 170)
    add("meta", "Meta description", "warning", `Meta description is ${md.length} characters; 120–160 usually displays well.`);
  else add("meta", "Meta description", "ok", "Meta description set.");

  if (!a.slug) add("slug", "URL slug", "error", "Add a URL slug.");
  else if (ctx.slugTakenByOther) add("slug", "URL slug", "error", "This slug is already used by another article.");
  else if (ctx.slugIsReserved) add("slug", "URL slug", "error", "This slug is reserved by a site route or category.");
  else add("slug", "URL slug", "ok", "Slug is unique.");

  if (!a.categoryId) add("category", "Category", "error", "Assign a category.");
  else add("category", "Category", "ok", "Category assigned.");

  if (!a.authorId) add("author", "Author", "error", "Attribute the article to an author.");
  else add("author", "Author", "ok", "Author attributed.");

  if (!a.featuredImage) add("image", "Featured image", "error", "Add a featured image.");
  else if (!a.featuredImage.alt.trim()) add("image", "Featured image", "error", "The featured image needs alt text.");
  else add("image", "Featured image", "ok", "Featured image with alt text.");

  const missingAlt: number[] = [];
  let idx = 0;
  for (const b of a.body) {
    const ids = b.type === "image" ? [b.mediaId] : b.type === "gallery" ? b.items.map((i) => i.mediaId) : [];
    for (const id of ids) {
      idx++;
      if (!(a.bodyMediaAlt.get(id) ?? "").trim()) missingAlt.push(idx);
    }
  }
  if (missingAlt.length) add("alt", "Image alt text", "warning", `${missingAlt.length} body image(s) have no alt text. Add it in the media library.`);
  else add("alt", "Image alt text", "ok", "All body images have alt text.");

  const headings = a.body.filter((b) => b.type === "heading");
  if (a.body.some((b) => b.type === "heading" && b.level === 3) && !a.body.some((b) => b.type === "heading" && b.level === 2))
    add("headings", "Heading structure", "warning", "H3 headings appear without any H2 section headings.");
  else if (!headings.length && a.wordCount > 500) add("headings", "Heading structure", "warning", "Long article without H2 section headings.");
  else add("headings", "Heading structure", "ok", "Heading structure looks logical.");

  if (a.wordCount < 300) add("length", "Body content", "warning", `Body has ${a.wordCount} words. Make sure it fully answers the reader's question.`);
  else add("length", "Body content", "ok", `${a.wordCount} words.`);

  const broken: string[] = [];
  let internalCount = 0;
  for (const l of bodyLinks(a.body)) {
    let path: string | null = null;
    if (!l.external && l.href.startsWith("/")) path = l.href;
    else if (l.external && l.href.startsWith(ctx.siteOrigin)) path = l.href.slice(ctx.siteOrigin.length) || "/";
    if (!path) continue;
    internalCount++;
    const p = normalizePath(path);
    if (!ctx.isKnownPath(p)) broken.push(p);
  }
  if (broken.length) add("links", "Internal links", "error", `Broken internal link(s): ${[...new Set(broken)].join(", ")}`);
  else if (!internalCount) add("links", "Internal links", "warning", "No contextual internal links yet.");
  else add("links", "Internal links", "ok", `${internalCount} internal link(s), all resolve.`);

  if (a.canonicalUrl && !/^https?:\/\//.test(a.canonicalUrl))
    add("canonical", "Canonical URL", "error", "Canonical override must be an absolute URL.");
  else if (a.canonicalUrl) add("canonical", "Canonical URL", "warning", "Canonical override set — confirm it is intentional.");
  else add("canonical", "Canonical URL", "ok", "Self-referencing canonical will be generated.");

  if (!a.robotsIndex) add("robots", "Indexing", "warning", "Article is set to noindex.");
  else add("robots", "Indexing", "ok", "Indexable.");

  if ((a.hasProducts || a.hasAffiliateLinks) && !a.hasAffiliateLinks)
    add("disclosure", "Affiliate disclosure", "warning", "Article contains product picks — enable the affiliate disclosure if any links are affiliate links.");

  if (a.reviewStatus !== "APPROVED")
    add("review", "Editorial review", "error", "An editor must approve this article (fact-check, sourcing, image rights) before publishing.");
  else add("review", "Editorial review", "ok", "Editorial review approved.");

  return checks;
}

export function auditSummary(checks: AuditCheck[]) {
  return {
    errors: checks.filter((c) => c.level === "error").length,
    warnings: checks.filter((c) => c.level === "warning").length,
  };
}
