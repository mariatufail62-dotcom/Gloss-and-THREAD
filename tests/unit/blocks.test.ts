import { describe, expect, it } from "vitest";
import { inlineLinks, inlineToText, parseInline, safeHref } from "@/lib/blocks/inline";
import { markdownToBlocks } from "@/lib/blocks/markdown";
import { bodySchema, parseBody } from "@/lib/blocks/schema";
import { autoExcerpt, blocksToPlainText, bodyLinks, collectRefs, countWords, headingAnchors } from "@/lib/blocks/text";

describe("inline markup", () => {
  it("parses bold, italic and links", () => {
    const nodes = parseInline("A **bold** and *italic* [link](/nails/)");
    expect(nodes.map((n) => n.type)).toEqual(["text", "strong", "text", "em", "text", "link"]);
    expect(inlineToText("A **bold** and *italic* [link](/nails/)")).toBe("A bold and italic link");
  });

  it("rejects unsafe link targets", () => {
    expect(safeHref("javascript:alert(1)")).toBeNull();
    expect(safeHref("//evil.example/")).toBeNull();
    expect(safeHref("data:text/html,x")).toBeNull();
    expect(safeHref("/shoes/")).toEqual({ href: "/shoes/", external: false });
    expect(safeHref("https://example.com/a")).toEqual({ href: "https://example.com/a", external: true });
    // An unsafe link degrades to literal text, never an anchor
    expect(inlineLinks("[x](javascript:alert(1))")).toEqual([]);
  });

  it("supports escaping", () => {
    expect(inlineToText("2 \\* 3")).toBe("2 * 3");
  });
});

describe("markdownToBlocks", () => {
  const md = `Intro paragraph with a [link](/nails/).

## Section
### Sub

- one
- two

1. first
2. second

> A pull quote
> — Real Person

:::tip Title
Tip text here.
:::

:::faq FAQ
Q: Question?
A: Answer.
:::

Table: Caption
| A | B |
| --- | --- |
| 1 | 2 |

![Cap](media:abc123 wide)

[[products:p1,p2 | Shop]]
[[disclosure]]

---`;

  const blocks = markdownToBlocks(md);

  it("produces every block type in order", () => {
    expect(blocks.map((b) => b.type)).toEqual([
      "paragraph", "heading", "heading", "list", "list", "quote", "callout", "faq", "table", "image", "products", "disclosure", "divider",
    ]);
  });

  it("captures details", () => {
    const quote = blocks.find((b) => b.type === "quote");
    expect(quote).toMatchObject({ text: "A pull quote", attribution: "Real Person" });
    const table = blocks.find((b) => b.type === "table");
    expect(table).toMatchObject({ caption: "Caption", headers: ["A", "B"], rows: [["1", "2"]] });
    const img = blocks.find((b) => b.type === "image");
    expect(img).toMatchObject({ mediaId: "abc123", size: "wide", caption: "Cap" });
    expect(blocks.find((b) => b.type === "list" && b.style === "number")).toBeTruthy();
  });

  it("validates against the body schema", () => {
    expect(bodySchema.safeParse(blocks).success).toBe(true);
  });

  it("collects references and links", () => {
    expect(collectRefs(blocks)).toEqual({ mediaIds: ["abc123"], productIds: ["p1", "p2"], articleIds: [] });
    expect(bodyLinks(blocks).map((l) => l.href)).toContain("/nails/");
  });
});

describe("text helpers", () => {
  it("counts words and builds excerpts", () => {
    const blocks = markdownToBlocks("First **paragraph** here.\n\n## Heading\n\nSecond.");
    expect(blocksToPlainText(blocks)).toContain("First paragraph here.");
    expect(countWords("Don't stop — it's fine")).toBe(4);
    expect(autoExcerpt(blocks)).toBe("First paragraph here.");
  });

  it("deduplicates heading anchors", () => {
    const blocks = markdownToBlocks("## Care\n\n## Care\n\n## Nail & Care");
    expect([...headingAnchors(blocks).values()].map((h) => h.id)).toEqual(["care", "care-2", "nail-and-care"]);
  });

  it("drops invalid stored blocks instead of crashing", () => {
    const parsed = parseBody([{ id: "a", type: "paragraph", text: "ok" }, { id: "b", type: "script", text: "x" }, null]);
    expect(parsed).toHaveLength(1);
  });

  it("rejects unlicensed embeds", () => {
    const r = bodySchema.safeParse([{ id: "e", type: "embed", provider: "youtube", videoId: "abcdEFG1234", title: "t", licensed: false }]);
    expect(r.success).toBe(false);
  });
});
