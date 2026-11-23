import { z } from "zod";

/**
 * Structured article body. Articles persist an array of typed blocks (JSON),
 * validated on every save and rendered server-side as React elements — no raw
 * HTML is ever stored or injected.
 *
 * Inline text fields support a small, safe markup subset (see ./inline.ts):
 *   **bold**, *italic*, [link text](/internal/path/ or https://external)
 */

const id = z.string().min(1).max(40);
const text = (max = 6000) => z.string().max(max);
const cuid = z.string().min(1).max(40);

export const paragraphBlock = z.object({ id, type: z.literal("paragraph"), text: text(8000) });

export const headingBlock = z.object({
  id,
  type: z.literal("heading"),
  level: z.union([z.literal(2), z.literal(3)]),
  text: text(200),
});

export const listBlock = z.object({
  id,
  type: z.literal("list"),
  style: z.enum(["bullet", "number"]),
  items: z.array(text(1500)).max(60),
});

export const quoteBlock = z.object({
  id,
  type: z.literal("quote"),
  text: text(600),
  // Only for genuine, verifiable quotes. Editorial pull quotes leave this empty.
  attribution: text(160).optional(),
});

export const imageBlock = z.object({
  id,
  type: z.literal("image"),
  mediaId: cuid,
  caption: text(400).optional(),
  size: z.enum(["inline", "wide"]).default("inline"),
});

export const galleryBlock = z.object({
  id,
  type: z.literal("gallery"),
  title: text(160).optional(),
  items: z
    .array(z.object({ mediaId: cuid, caption: text(300).optional() }))
    .min(1)
    .max(24),
});

export const tableBlock = z.object({
  id,
  type: z.literal("table"),
  caption: text(200).optional(),
  headers: z.array(text(120)).min(1).max(8),
  rows: z.array(z.array(text(400)).max(8)).max(40),
});

export const calloutBlock = z.object({
  id,
  type: z.literal("callout"),
  variant: z.enum(["tip", "note", "info"]),
  title: text(120).optional(),
  text: text(2000),
});

export const productsBlock = z.object({
  id,
  type: z.literal("products"),
  title: text(160).optional(),
  productIds: z.array(cuid).min(1).max(12),
});

export const relatedBlock = z.object({
  id,
  type: z.literal("related"),
  title: text(160).optional(),
  articleIds: z.array(cuid).min(1).max(4),
});

export const disclosureBlock = z.object({ id, type: z.literal("disclosure") });

export const embedBlock = z.object({
  id,
  type: z.literal("embed"),
  provider: z.enum(["youtube", "vimeo"]),
  videoId: z.string().regex(/^[A-Za-z0-9_-]{4,32}$/, "Invalid video ID"),
  title: text(200),
  caption: text(300).optional(),
  // Editors confirm the embed is licensed / published by the rights holder.
  licensed: z.literal(true),
});

export const faqBlock = z.object({
  id,
  type: z.literal("faq"),
  title: text(160).optional(),
  items: z
    .array(z.object({ question: text(300), answer: text(3000) }))
    .min(1)
    .max(15),
});

export const dividerBlock = z.object({ id, type: z.literal("divider") });

export const blockSchema = z.discriminatedUnion("type", [
  paragraphBlock,
  headingBlock,
  listBlock,
  quoteBlock,
  imageBlock,
  galleryBlock,
  tableBlock,
  calloutBlock,
  productsBlock,
  relatedBlock,
  disclosureBlock,
  embedBlock,
  faqBlock,
  dividerBlock,
]);

export const bodySchema = z.array(blockSchema).max(400);

export type Block = z.infer<typeof blockSchema>;
export type BlockType = Block["type"];
export type BlockOf<T extends BlockType> = Extract<Block, { type: T }>;

/** Parses stored JSON defensively: invalid blocks are dropped instead of crashing a page. */
export function parseBody(value: unknown): Block[] {
  if (!Array.isArray(value)) return [];
  const out: Block[] = [];
  for (const raw of value) {
    const r = blockSchema.safeParse(raw);
    if (r.success) out.push(r.data);
  }
  return out;
}

export const BLOCK_LABELS: Record<BlockType, string> = {
  paragraph: "Paragraph",
  heading: "Heading",
  list: "List",
  quote: "Pull quote",
  image: "Image",
  gallery: "Gallery",
  table: "Comparison table",
  callout: "Callout",
  products: "Product picks",
  related: "Related articles",
  disclosure: "Affiliate disclosure",
  embed: "Video embed",
  faq: "FAQ",
  divider: "Divider",
};
