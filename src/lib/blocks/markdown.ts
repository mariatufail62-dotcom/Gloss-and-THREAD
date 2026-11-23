import type { Block } from "./schema";
import { newBlockId } from "./text";

/**
 * Converts a constrained Markdown dialect into body blocks. Used by the seed
 * script and by the CMS "Import from Markdown" helper.
 *
 *   ## Heading / ### Subheading
 *   - bullet / 1. numbered
 *   > Pull quote          (optional final line: > — Attribution)
 *   ![Caption](media:<mediaId>)   image  ·  ![Caption](media:<id> wide)
 *   :::tip Title … :::    callout (tip | note | info)
 *   :::faq Title  Q: …  A: … :::
 *   | a | b |  table (first row = headers; optional "Table: caption" line before)
 *   [[products:id1,id2 | Title]]  [[related:id1,id2 | Title]]  [[disclosure]]
 *   ---                    divider
 */
export function markdownToBlocks(md: string): Block[] {
  const lines = md.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let para: string[] = [];
  let i = 0;

  const flushPara = () => {
    const t = para.join(" ").replace(/\s+/g, " ").trim();
    if (t) blocks.push({ id: newBlockId(), type: "paragraph", text: t });
    para = [];
  };

  while (i < lines.length) {
    const trimmed = lines[i].trim();

    if (!trimmed) {
      flushPara();
      i++;
      continue;
    }

    let m: RegExpMatchArray | null;

    if ((m = trimmed.match(/^(#{2,3})\s+(.+)$/))) {
      flushPara();
      blocks.push({ id: newBlockId(), type: "heading", level: m[1].length === 2 ? 2 : 3, text: m[2].trim() });
      i++;
      continue;
    }

    if (/^-{3,}$/.test(trimmed)) {
      flushPara();
      blocks.push({ id: newBlockId(), type: "divider" });
      i++;
      continue;
    }

    if ((m = trimmed.match(/^!\[([^\]]*)\]\(media:([A-Za-z0-9_-]+)(\s+wide)?\)$/))) {
      flushPara();
      blocks.push({
        id: newBlockId(),
        type: "image",
        mediaId: m[2],
        caption: m[1] || undefined,
        size: m[3] ? "wide" : "inline",
      });
      i++;
      continue;
    }

    if ((m = trimmed.match(/^\[\[(products|related):([^|\]]+)(?:\|([^\]]+))?\]\]$/))) {
      flushPara();
      const ids = m[2].split(",").map((s) => s.trim()).filter(Boolean);
      const title = m[3]?.trim() || undefined;
      if (m[1] === "products") blocks.push({ id: newBlockId(), type: "products", productIds: ids, title });
      else blocks.push({ id: newBlockId(), type: "related", articleIds: ids.slice(0, 4), title });
      i++;
      continue;
    }

    if (trimmed === "[[disclosure]]") {
      flushPara();
      blocks.push({ id: newBlockId(), type: "disclosure" });
      i++;
      continue;
    }

    if ((m = trimmed.match(/^:::(tip|note|info|faq)\s*(.*)$/))) {
      flushPara();
      const kind = m[1];
      const title = m[2].trim() || undefined;
      const inner: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== ":::") inner.push(lines[i++]);
      i++; // closing :::
      if (kind === "faq") {
        const items: { question: string; answer: string }[] = [];
        for (const l of inner) {
          const t = l.trim();
          if (t.startsWith("Q:")) items.push({ question: t.slice(2).trim(), answer: "" });
          else if (t.startsWith("A:") && items.length) items[items.length - 1].answer = t.slice(2).trim();
          else if (t && items.length) items[items.length - 1].answer += " " + t;
        }
        if (items.length) blocks.push({ id: newBlockId(), type: "faq", title, items });
      } else {
        blocks.push({
          id: newBlockId(),
          type: "callout",
          variant: kind as "tip" | "note" | "info",
          title,
          text: inner.join(" ").replace(/\s+/g, " ").trim(),
        });
      }
      continue;
    }

    if (trimmed.startsWith(">")) {
      flushPara();
      const q: string[] = [];
      let attribution: string | undefined;
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        const t = lines[i].trim().replace(/^>\s?/, "");
        if (/^[—–-]\s/.test(t)) attribution = t.replace(/^[—–-]\s*/, "");
        else q.push(t);
        i++;
      }
      blocks.push({ id: newBlockId(), type: "quote", text: q.join(" ").trim(), attribution });
      continue;
    }

    if (/^([-*]|\d+\.)\s+/.test(trimmed)) {
      flushPara();
      const numbered = /^\d+\./.test(trimmed);
      const items: string[] = [];
      while (i < lines.length && /^([-*]|\d+\.)\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^([-*]|\d+\.)\s+/, ""));
        i++;
      }
      blocks.push({ id: newBlockId(), type: "list", style: numbered ? "number" : "bullet", items });
      continue;
    }

    if (trimmed.startsWith("Table:") || trimmed.startsWith("|")) {
      flushPara();
      let caption: string | undefined;
      if (trimmed.startsWith("Table:")) {
        caption = trimmed.slice(6).trim();
        i++;
      }
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const cells = lines[i].trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
        if (!cells.every((c) => /^:?-{2,}:?$/.test(c))) rows.push(cells);
        i++;
      }
      if (rows.length) blocks.push({ id: newBlockId(), type: "table", caption, headers: rows[0], rows: rows.slice(1) });
      continue;
    }

    para.push(trimmed);
    i++;
  }
  flushPara();
  return blocks;
}
