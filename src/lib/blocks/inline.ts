/**
 * Minimal, safe inline markup parser.
 * Supports **bold**, *italic* and [text](href). Everything else is literal text.
 * Produces a token tree that the renderer maps to React elements (no HTML strings).
 */

export type InlineNode =
  | { type: "text"; value: string }
  | { type: "strong"; children: InlineNode[] }
  | { type: "em"; children: InlineNode[] }
  | { type: "link"; href: string; external: boolean; children: InlineNode[] };

/** Returns a safe href or null. Internal links must be root-relative paths. */
export function safeHref(raw: string): { href: string; external: boolean } | null {
  const href = raw.trim();
  if (href.startsWith("/") && !href.startsWith("//")) return { href, external: false };
  if (href.startsWith("#")) return { href, external: false };
  if (/^https?:\/\/[^\s]+$/i.test(href)) return { href, external: true };
  if (/^mailto:[^\s]+$/i.test(href)) return { href, external: true };
  return null;
}

export function parseInline(input: string, depth = 0): InlineNode[] {
  const nodes: InlineNode[] = [];
  let buf = "";
  let i = 0;
  const flush = () => {
    if (buf) nodes.push({ type: "text", value: buf });
    buf = "";
  };

  while (i < input.length) {
    const ch = input[i];

    // Escaped character
    if (ch === "\\" && i + 1 < input.length && "*[]()\\".includes(input[i + 1])) {
      buf += input[i + 1];
      i += 2;
      continue;
    }

    if (depth < 4 && ch === "*" && input[i + 1] === "*") {
      const end = input.indexOf("**", i + 2);
      if (end > i + 2) {
        flush();
        nodes.push({ type: "strong", children: parseInline(input.slice(i + 2, end), depth + 1) });
        i = end + 2;
        continue;
      }
    }

    if (depth < 4 && ch === "*" && input[i + 1] !== "*" && input[i + 1] !== " ") {
      const end = findSingleStar(input, i + 1);
      if (end > i + 1) {
        flush();
        nodes.push({ type: "em", children: parseInline(input.slice(i + 1, end), depth + 1) });
        i = end + 1;
        continue;
      }
    }

    if (depth < 4 && ch === "[") {
      const close = input.indexOf("](", i + 1);
      const end = close > -1 ? input.indexOf(")", close + 2) : -1;
      if (close > i + 1 && end > close + 2) {
        const label = input.slice(i + 1, close);
        const target = safeHref(input.slice(close + 2, end));
        if (target && !label.includes("[")) {
          flush();
          nodes.push({ type: "link", ...target, children: parseInline(label, depth + 1) });
          i = end + 1;
          continue;
        }
      }
    }

    buf += ch;
    i++;
  }
  flush();
  return nodes;
}

function findSingleStar(s: string, from: number): number {
  for (let j = from; j < s.length; j++) {
    if (s[j] === "\\") {
      j++;
      continue;
    }
    if (s[j] === "*" && s[j + 1] !== "*" && s[j - 1] !== " ") return j;
    if (s[j] === "*" && s[j + 1] === "*") j++;
  }
  return -1;
}

/** Strips inline markup to plain text (for excerpts, search, meta). */
export function inlineToText(input: string): string {
  const walk = (nodes: InlineNode[]): string =>
    nodes.map((n) => (n.type === "text" ? n.value : walk(n.children))).join("");
  return walk(parseInline(input));
}

/** All link hrefs in an inline string. */
export function inlineLinks(input: string): { href: string; external: boolean }[] {
  const out: { href: string; external: boolean }[] = [];
  const walk = (nodes: InlineNode[]) => {
    for (const n of nodes) {
      if (n.type === "link") out.push({ href: n.href, external: n.external });
      if (n.type !== "text") walk(n.children);
    }
  };
  walk(parseInline(input));
  return out;
}
