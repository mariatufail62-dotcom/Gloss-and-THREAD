import type { Block } from "./schema";
import { inlineLinks, inlineToText } from "./inline";
import { slugify } from "@/lib/site";

export function newBlockId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

/** Plain-text projection used for search indexing, word counts and excerpts. */
export function blocksToPlainText(blocks: Block[]): string {
  const parts: string[] = [];
  for (const b of blocks) {
    switch (b.type) {
      case "paragraph":
      case "heading":
      case "quote":
        parts.push(inlineToText(b.text));
        break;
      case "list":
        parts.push(...b.items.map(inlineToText));
        break;
      case "callout":
        if (b.title) parts.push(b.title);
        parts.push(inlineToText(b.text));
        break;
      case "table":
        if (b.caption) parts.push(b.caption);
        parts.push(b.headers.join(" "), ...b.rows.map((r) => r.map(inlineToText).join(" ")));
        break;
      case "faq":
        for (const it of b.items) parts.push(it.question, inlineToText(it.answer));
        break;
      case "image":
        if (b.caption) parts.push(inlineToText(b.caption));
        break;
      case "gallery":
        for (const it of b.items) if (it.caption) parts.push(inlineToText(it.caption));
        break;
      default:
        break;
    }
  }
  return parts.join("\n").replace(/[ \t]+/g, " ").trim();
}

export function countWords(text: string): number {
  const m = text.match(/[A-Za-z0-9’'-]+/g);
  return m ? m.length : 0;
}

export function readingMinutes(words: number): number {
  return Math.max(1, Math.round(words / 230));
}

export interface TocEntry {
  id: string;
  text: string;
  level: 2 | 3;
}

/** Stable heading anchors, deduplicated in document order. Keyed by block id. */
export function headingAnchors(blocks: Block[]): Map<string, TocEntry> {
  const seen = new Map<string, number>();
  const out = new Map<string, TocEntry>();
  for (const b of blocks) {
    if (b.type !== "heading") continue;
    const plain = inlineToText(b.text);
    let anchor = slugify(plain) || "section";
    const n = seen.get(anchor) ?? 0;
    seen.set(anchor, n + 1);
    if (n > 0) anchor = `${anchor}-${n + 1}`;
    out.set(b.id, { id: anchor, text: plain, level: b.level });
  }
  return out;
}

/** Every link written inside the body (inline text, lists, callouts, tables, FAQ answers). */
export function bodyLinks(blocks: Block[]): { href: string; external: boolean }[] {
  const out: { href: string; external: boolean }[] = [];
  const add = (s?: string) => {
    if (s) out.push(...inlineLinks(s));
  };
  for (const b of blocks) {
    switch (b.type) {
      case "paragraph":
      case "heading":
      case "quote":
      case "callout":
        add(b.text);
        break;
      case "list":
        b.items.forEach(add);
        break;
      case "table":
        b.rows.forEach((r) => r.forEach(add));
        break;
      case "faq":
        b.items.forEach((it) => add(it.answer));
        break;
      case "image":
        add(b.caption);
        break;
      default:
        break;
    }
  }
  return out;
}

export interface BodyRefs {
  mediaIds: string[];
  productIds: string[];
  articleIds: string[];
}

export function collectRefs(blocks: Block[]): BodyRefs {
  const media = new Set<string>();
  const products = new Set<string>();
  const articles = new Set<string>();
  for (const b of blocks) {
    if (b.type === "image") media.add(b.mediaId);
    if (b.type === "gallery") b.items.forEach((i) => media.add(i.mediaId));
    if (b.type === "products") b.productIds.forEach((p) => products.add(p));
    if (b.type === "related") b.articleIds.forEach((a) => articles.add(a));
  }
  return { mediaIds: [...media], productIds: [...products], articleIds: [...articles] };
}

/** Builds an excerpt from the first paragraph when the editor has not written one. */
export function autoExcerpt(blocks: Block[], max = 180): string {
  const first = blocks.find((b) => b.type === "paragraph");
  if (!first || first.type !== "paragraph") return "";
  const t = inlineToText(first.text);
  if (t.length <= max) return t;
  return t.slice(0, t.lastIndexOf(" ", max)).replace(/[,;:.\s]+$/, "") + "…";
}
