import { describe, expect, it } from "vitest";
import { auditArticle, auditSummary, type AuditInput } from "@/lib/audit";
import { fromDateTimeLocal, meaningfulUpdate, toDateTimeLocal, formatPrice } from "@/lib/format";
import { normalizePath, slugify, SLUG_PATTERN } from "@/lib/site";
import { articlePath, categoryPath, searchPath } from "@/lib/urls";
import { markdownToBlocks } from "@/lib/blocks/markdown";
import { parseLabeledLinks } from "@/lib/admin/forms";

describe("slugs and paths", () => {
  it("slugifies editorial titles", () => {
    expect(slugify("Short Almond Nails: 12 Ideas & Tips!")).toBe("short-almond-nails-12-ideas-and-tips");
    expect(slugify("Café Crème")).toBe("cafe-creme");
    expect(SLUG_PATTERN.test("good-slug-2")).toBe(true);
    expect(SLUG_PATTERN.test("Bad_Slug")).toBe(false);
  });

  it("normalizes paths to the trailing-slash convention", () => {
    expect(normalizePath("nails")).toBe("/nails/");
    expect(normalizePath("/nails//almond?x=1#top")).toBe("/nails/almond/");
    expect(normalizePath("/feed.xml")).toBe("/feed.xml");
  });

  it("builds canonical URLs", () => {
    expect(categoryPath({ slug: "nails" })).toBe("/nails/");
    expect(categoryPath({ slug: "almond-nails", parent: { slug: "nails" } }, 2)).toBe("/nails/almond-nails/page/2/");
    // Articles always live under their pillar, not their subcategory
    expect(articlePath({ slug: "x", category: { slug: "almond-nails", parent: { slug: "nails" } } })).toBe("/nails/x/");
    expect(searchPath("red nails", 2)).toBe("/search/?q=red+nails&page=2");
  });
});

describe("dates and prices", () => {
  it("round-trips New York wall-clock time", () => {
    const d = fromDateTimeLocal("2026-07-04T09:30")!;
    expect(d.toISOString()).toBe("2026-07-04T13:30:00.000Z"); // EDT = UTC-4
    expect(toDateTimeLocal(d)).toBe("2026-07-04T09:30");
    const w = fromDateTimeLocal("2026-01-15T09:30")!;
    expect(w.toISOString()).toBe("2026-01-15T14:30:00.000Z"); // EST = UTC-5
  });

  it("only treats later updates as meaningful", () => {
    const p = new Date("2026-01-01T00:00:00Z");
    expect(meaningfulUpdate(p, new Date("2026-01-01T05:00:00Z"))).toBeNull();
    expect(meaningfulUpdate(p, new Date("2026-01-05T00:00:00Z"))).not.toBeNull();
  });

  it("formats USD and never invents a price", () => {
    expect(formatPrice(4800)).toBe("$48.00");
    expect(formatPrice(null)).toBeNull();
  });
});

describe("editorial audit", () => {
  const base: AuditInput = {
    title: "How to Wear Loafers",
    slug: "how-to-wear-loafers",
    seoTitle: "How to Wear Loafers With Jeans and Skirts",
    metaDescription: "How to wear loafers with jeans, skirts and tailored trousers, plus what to look for in fit and which socks to wear with them.",
    categoryId: "c1",
    authorId: "a1",
    featuredImage: { alt: "Black loafers" },
    body: markdownToBlocks(`## Fit\n\n${"Words about loafers and how to style them well. ".repeat(60)}\n\nSee [boots](/shoes/boots/).`),
    bodyMediaAlt: new Map(),
    robotsIndex: true,
    reviewStatus: "APPROVED",
    hasProducts: false,
    hasAffiliateLinks: false,
    wordCount: 480,
  };
  const ctx = { slugTakenByOther: false, slugIsReserved: false, isKnownPath: (p: string) => p === "/shoes/boots/", siteOrigin: "https://example.com" };

  it("passes a complete, reviewed article", () => {
    expect(auditSummary(auditArticle(base, ctx)).errors).toBe(0);
  });

  it("blocks publishing for missing essentials", () => {
    const checks = auditArticle({ ...base, metaDescription: "", authorId: null, featuredImage: null, reviewStatus: "NOT_REVIEWED" }, ctx);
    const ids = checks.filter((c) => c.level === "error").map((c) => c.id);
    expect(ids).toEqual(expect.arrayContaining(["meta", "author", "image", "review"]));
  });

  it("detects broken internal links and duplicate slugs", () => {
    const checks = auditArticle(base, { ...ctx, isKnownPath: () => false, slugTakenByOther: true });
    expect(checks.find((c) => c.id === "links")?.level).toBe("error");
    expect(checks.find((c) => c.id === "slug")?.level).toBe("error");
  });

  it("requires alt text on the featured image", () => {
    expect(auditArticle({ ...base, featuredImage: { alt: " " } }, ctx).find((c) => c.id === "image")?.level).toBe("error");
  });
});

describe("CMS form helpers", () => {
  it("parses labeled link lines", () => {
    expect(parseLabeledLinks("Instagram | https://instagram.com/x\n\nPinterest|https://pinterest.com/y")).toEqual([
      { label: "Instagram", url: "https://instagram.com/x" },
      { label: "Pinterest", url: "https://pinterest.com/y" },
    ]);
  });
});
