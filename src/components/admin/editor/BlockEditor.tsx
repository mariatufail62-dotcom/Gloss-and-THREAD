"use client";

import { useState } from "react";
import { BLOCK_LABELS, type Block, type BlockOf, type BlockType } from "@/lib/blocks/schema";
import { newBlockId } from "@/lib/blocks/text";
import { MediaField, MediaPickerButton, MediaThumb, type MediaLibrary } from "./MediaPicker";
import { MultiPick, type PickOption } from "./MultiPick";

const ADDABLE: BlockType[] = ["paragraph", "heading", "list", "image", "gallery", "quote", "callout", "table", "products", "related", "faq", "embed", "disclosure", "divider"];

export function emptyBlock(type: BlockType): Block | null {
  const id = newBlockId();
  switch (type) {
    case "paragraph": return { id, type, text: "" };
    case "heading": return { id, type, level: 2, text: "" };
    case "list": return { id, type, style: "bullet", items: [] };
    case "quote": return { id, type, text: "" };
    case "callout": return { id, type, variant: "tip", text: "" };
    case "table": return { id, type, headers: ["", ""], rows: [] };
    case "faq": return { id, type, items: [{ question: "", answer: "" }] };
    case "disclosure": return { id, type };
    case "divider": return { id, type };
    // These need a selection first; created by their pickers.
    default: return null;
  }
}

interface Ctx {
  library: MediaLibrary;
  products: PickOption[];
  articles: PickOption[];
}

export function BlockEditor({ blocks, onChange, ctx }: { blocks: Block[]; onChange: (b: Block[]) => void; ctx: Ctx }) {
  const update = (i: number, b: Block) => onChange(blocks.map((x, j) => (j === i ? b : x)));
  const remove = (i: number) => onChange(blocks.filter((_, j) => j !== i));
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const insert = (at: number, b: Block) => {
    const next = [...blocks];
    next.splice(at, 0, b);
    onChange(next);
  };

  return (
    <div>
      {blocks.length === 0 && (
        <p className="border border-dashed border-line px-5 py-10 text-center text-[0.875rem] text-muted">
          The body is empty. Add a block below, or import Markdown.
        </p>
      )}
      <ol className="space-y-3">
        {blocks.map((b, i) => (
          <li key={b.id} className="border border-line bg-white">
            <div className="flex items-center gap-2 border-b border-line bg-paper-2 px-3 py-1.5">
              <span className="label text-muted">{i + 1} · {BLOCK_LABELS[b.type]}</span>
              <div className="ml-auto flex items-center gap-1">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move block up" className="px-1.5 text-muted hover:text-ink disabled:opacity-30">↑</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === blocks.length - 1} aria-label="Move block down" className="px-1.5 text-muted hover:text-ink disabled:opacity-30">↓</button>
                <button
                  type="button"
                  onClick={() => {
                    if (blockHasContent(b) && !window.confirm("Remove this block?")) return;
                    remove(i);
                  }}
                  aria-label="Remove block"
                  className="px-1.5 text-muted hover:text-rose-dark"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-3">
              <BlockFields block={b} onChange={(nb) => update(i, nb)} ctx={ctx} />
            </div>
            <AddBar ctx={ctx} onAdd={(nb) => insert(i + 1, nb)} compact />
          </li>
        ))}
      </ol>
      <div className="mt-4 border border-line bg-white p-3">
        <p className="label mb-2 text-muted">Add block</p>
        <AddBar ctx={ctx} onAdd={(nb) => insert(blocks.length, nb)} />
      </div>
    </div>
  );
}

function blockHasContent(b: Block): boolean {
  if ("text" in b && b.text) return true;
  if (b.type === "list") return b.items.length > 0;
  if (b.type === "table") return b.rows.length > 0;
  if (b.type === "gallery" || b.type === "faq") return b.items.length > 0;
  return b.type !== "divider" && b.type !== "disclosure";
}

function AddBar({ onAdd, ctx, compact }: { onAdd: (b: Block) => void; ctx: Ctx; compact?: boolean }) {
  const [open, setOpen] = useState(!compact);
  if (compact && !open)
    return (
      <div className="border-t border-line px-3 py-1">
        <button type="button" onClick={() => setOpen(true)} className="text-[0.75rem] text-muted hover:text-ink">
          + Insert below
        </button>
      </div>
    );
  return (
    <div className={`flex flex-wrap gap-1.5 ${compact ? "border-t border-line px-3 py-2" : ""}`}>
      {ADDABLE.map((t) =>
        t === "image" ? (
          <MediaPickerButton
            key={t}
            library={ctx.library}
            label="Image"
            className="border border-line px-2.5 py-1 text-[0.75rem] hover:border-ink"
            onPick={(m) => {
              onAdd({ id: newBlockId(), type: "image", mediaId: m.id, size: "inline" });
              setOpen(!compact);
            }}
          />
        ) : t === "gallery" ? (
          <MediaPickerButton
            key={t}
            library={ctx.library}
            label="Gallery"
            className="border border-line px-2.5 py-1 text-[0.75rem] hover:border-ink"
            onPick={(m) => {
              onAdd({ id: newBlockId(), type: "gallery", items: [{ mediaId: m.id }] });
              setOpen(!compact);
            }}
          />
        ) : (
          <button
            key={t}
            type="button"
            className="border border-line px-2.5 py-1 text-[0.75rem] hover:border-ink"
            onClick={() => {
              const b =
                emptyBlock(t) ??
                (t === "products"
                  ? ({ id: newBlockId(), type: "products", productIds: [] } as unknown as Block)
                  : t === "related"
                    ? ({ id: newBlockId(), type: "related", articleIds: [] } as unknown as Block)
                    : ({ id: newBlockId(), type: "embed", provider: "youtube", videoId: "", title: "", licensed: false } as unknown as Block));
              onAdd(b);
              setOpen(!compact);
            }}
          >
            {BLOCK_LABELS[t]}
          </button>
        )
      )}
      {compact && (
        <button type="button" onClick={() => setOpen(false)} className="px-2 text-[0.75rem] text-muted underline">
          Cancel
        </button>
      )}
    </div>
  );
}

const INLINE_HINT = "Inline: **bold**, *italic*, [link text](/nails/some-article/)";

function BlockFields({ block: b, onChange, ctx }: { block: Block; onChange: (b: Block) => void; ctx: Ctx }) {
  switch (b.type) {
    case "paragraph":
      return (
        <div>
          <AutoText value={b.text} onChange={(text) => onChange({ ...b, text })} rows={4} placeholder="Write a paragraph…" />
          <p className="mt-1 text-[0.6875rem] text-muted">{INLINE_HINT}</p>
        </div>
      );
    case "heading":
      return (
        <div className="flex gap-2">
          <select value={b.level} onChange={(e) => onChange({ ...b, level: Number(e.target.value) as 2 | 3 })} className="field w-24" aria-label="Heading level">
            <option value={2}>H2</option>
            <option value={3}>H3</option>
          </select>
          <input value={b.text} onChange={(e) => onChange({ ...b, text: e.target.value })} placeholder="Section heading" maxLength={200} className={`field ${b.level === 2 ? "font-serif text-[1.125rem]" : "font-semibold"}`} />
        </div>
      );
    case "list":
      return (
        <div className="space-y-2">
          <select value={b.style} onChange={(e) => onChange({ ...b, style: e.target.value as "bullet" | "number" })} className="field w-40" aria-label="List style">
            <option value="bullet">Bulleted</option>
            <option value="number">Numbered</option>
          </select>
          <LinesField value={b.items} onChange={(items) => onChange({ ...b, items })} placeholder="One item per line" />
          <p className="text-[0.6875rem] text-muted">One item per line. {INLINE_HINT}</p>
        </div>
      );
    case "quote":
      return (
        <div className="space-y-2">
          <AutoText value={b.text} onChange={(text) => onChange({ ...b, text })} rows={2} placeholder="Pull quote text" className="font-serif italic" />
          <input value={b.attribution ?? ""} onChange={(e) => onChange({ ...b, attribution: e.target.value || undefined })} placeholder="Attribution — only for genuine, verifiable quotes" className="field" maxLength={160} />
        </div>
      );
    case "callout":
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <select value={b.variant} onChange={(e) => onChange({ ...b, variant: e.target.value as BlockOf<"callout">["variant"] })} className="field w-32" aria-label="Callout style">
              <option value="tip">Tip</option>
              <option value="note">Note</option>
              <option value="info">Info</option>
            </select>
            <input value={b.title ?? ""} onChange={(e) => onChange({ ...b, title: e.target.value || undefined })} placeholder="Title (optional)" className="field" maxLength={120} />
          </div>
          <AutoText value={b.text} onChange={(text) => onChange({ ...b, text })} rows={3} placeholder="Callout text" />
        </div>
      );
    case "image": {
      return (
        <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
          <MediaField library={ctx.library} value={b.mediaId} onChange={(id) => id && onChange({ ...b, mediaId: id })} />
          <div className="space-y-2">
            <input value={b.caption ?? ""} onChange={(e) => onChange({ ...b, caption: e.target.value || undefined })} placeholder="Caption (optional; credit is added automatically)" className="field" maxLength={400} />
            <select value={b.size} onChange={(e) => onChange({ ...b, size: e.target.value as "inline" | "wide" })} className="field w-48" aria-label="Image width">
              <option value="inline">Text width</option>
              <option value="wide">Wide</option>
            </select>
          </div>
        </div>
      );
    }
    case "gallery":
      return (
        <div className="space-y-3">
          <input value={b.title ?? ""} onChange={(e) => onChange({ ...b, title: e.target.value || undefined })} placeholder="Gallery title (optional)" className="field" maxLength={160} />
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {b.items.map((it, i) => (
              <li key={`${it.mediaId}-${i}`} className="space-y-1">
                <MediaThumb media={ctx.library.byId.get(it.mediaId)} className="aspect-[4/5]" />
                <input
                  value={it.caption ?? ""}
                  onChange={(e) => onChange({ ...b, items: b.items.map((x, j) => (j === i ? { ...x, caption: e.target.value || undefined } : x)) })}
                  placeholder="Caption"
                  className="field !py-1.5 text-[0.8125rem]"
                  maxLength={300}
                />
                <div className="flex justify-between text-[0.75rem]">
                  <button type="button" disabled={i === 0} onClick={() => { const items = [...b.items]; [items[i - 1], items[i]] = [items[i], items[i - 1]]; onChange({ ...b, items }); }} className="text-muted disabled:opacity-30">←</button>
                  <button type="button" disabled={b.items.length === 1} onClick={() => onChange({ ...b, items: b.items.filter((_, j) => j !== i) })} className="text-muted underline disabled:opacity-30">Remove</button>
                  <button type="button" disabled={i === b.items.length - 1} onClick={() => { const items = [...b.items]; [items[i + 1], items[i]] = [items[i], items[i + 1]]; onChange({ ...b, items }); }} className="text-muted disabled:opacity-30">→</button>
                </div>
              </li>
            ))}
          </ul>
          {b.items.length < 24 && <MediaPickerButton library={ctx.library} label="+ Add image" className="btn-outline" onPick={(m) => onChange({ ...b, items: [...b.items, { mediaId: m.id }] })} />}
        </div>
      );
    case "table":
      return <TableFields block={b} onChange={onChange} />;
    case "products":
      return (
        <div className="space-y-2">
          <input value={b.title ?? ""} onChange={(e) => onChange({ ...b, title: e.target.value || undefined })} placeholder="Module title, e.g. “Shop the look”" className="field" maxLength={160} />
          <MultiPick options={ctx.products} value={b.productIds} onChange={(productIds) => onChange({ ...b, productIds })} max={12} placeholder="Search products…" />
          <p className="text-[0.6875rem] text-muted">Only products with a verified merchant link appear on the site. Manage them under Products.</p>
        </div>
      );
    case "related":
      return (
        <div className="space-y-2">
          <input value={b.title ?? ""} onChange={(e) => onChange({ ...b, title: e.target.value || undefined })} placeholder="Module title, e.g. “Read next”" className="field" maxLength={160} />
          <MultiPick options={ctx.articles} value={b.articleIds} onChange={(articleIds) => onChange({ ...b, articleIds })} max={4} placeholder="Search published articles…" />
        </div>
      );
    case "embed":
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <select value={b.provider} onChange={(e) => onChange({ ...b, provider: e.target.value as "youtube" | "vimeo" })} className="field w-36" aria-label="Video provider">
              <option value="youtube">YouTube</option>
              <option value="vimeo">Vimeo</option>
            </select>
            <input value={b.videoId} onChange={(e) => onChange({ ...b, videoId: extractVideoId(e.target.value) })} placeholder="Video ID or URL" className="field" />
          </div>
          <input value={b.title} onChange={(e) => onChange({ ...b, title: e.target.value })} placeholder="Accessible video title (required)" className="field" maxLength={200} />
          <input value={b.caption ?? ""} onChange={(e) => onChange({ ...b, caption: e.target.value || undefined })} placeholder="Caption (optional)" className="field" maxLength={300} />
          <label className="flex items-start gap-2 text-[0.8125rem]">
            <input type="checkbox" checked={b.licensed === true} onChange={(e) => onChange({ ...b, licensed: e.target.checked } as unknown as Block)} className="mt-0.5 accent-ink" />
            The rights holder published this video and allows embedding (or we own it).
          </label>
        </div>
      );
    case "faq":
      return (
        <div className="space-y-3">
          <input value={b.title ?? ""} onChange={(e) => onChange({ ...b, title: e.target.value || undefined })} placeholder="Section title (default: Questions, answered)" className="field" maxLength={160} />
          {b.items.map((it, i) => (
            <div key={i} className="space-y-1.5 border-l-2 border-line pl-3">
              <input value={it.question} onChange={(e) => onChange({ ...b, items: b.items.map((x, j) => (j === i ? { ...x, question: e.target.value } : x)) })} placeholder={`Question ${i + 1}`} className="field font-semibold" maxLength={300} />
              <AutoText value={it.answer} onChange={(answer) => onChange({ ...b, items: b.items.map((x, j) => (j === i ? { ...x, answer } : x)) })} rows={2} placeholder="Answer" />
              {b.items.length > 1 && (
                <button type="button" onClick={() => onChange({ ...b, items: b.items.filter((_, j) => j !== i) })} className="text-[0.75rem] text-muted underline">
                  Remove question
                </button>
              )}
            </div>
          ))}
          {b.items.length < 15 && (
            <button type="button" onClick={() => onChange({ ...b, items: [...b.items, { question: "", answer: "" }] })} className="text-[0.8125rem] font-semibold underline">
              + Add question
            </button>
          )}
          <p className="text-[0.6875rem] text-muted">Use FAQs only for questions readers genuinely ask. No FAQ schema is emitted.</p>
        </div>
      );
    case "disclosure":
      return <p className="text-[0.8125rem] text-muted">Shows the site&apos;s affiliate disclosure (edit the wording in Site settings).</p>;
    case "divider":
      return <hr className="my-2 border-line" />;
  }
}

function extractVideoId(input: string): string {
  const t = input.trim();
  const yt = t.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{6,20})/);
  if (yt) return yt[1];
  const vm = t.match(/vimeo\.com\/(?:video\/)?(\d{5,12})/);
  if (vm) return vm[1];
  return t.slice(0, 32);
}

function AutoText({ value, onChange, rows = 3, placeholder, className = "" }: { value: string; onChange: (v: string) => void; rows?: number; placeholder?: string; className?: string }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={Math.max(rows, Math.min(16, Math.ceil(value.length / 90) + 1))}
      placeholder={placeholder}
      className={`field resize-y leading-relaxed ${className}`}
    />
  );
}

/** Line-based editing that preserves blank lines while typing. */
function LinesField({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [raw, setRaw] = useState(value.join("\n"));
  return (
    <textarea
      value={raw}
      onChange={(e) => {
        setRaw(e.target.value);
        onChange(e.target.value.split("\n").map((l) => l.trim()).filter(Boolean));
      }}
      rows={Math.max(3, Math.min(14, raw.split("\n").length + 1))}
      placeholder={placeholder}
      className="field resize-y leading-relaxed"
    />
  );
}

function TableFields({ block: b, onChange }: { block: BlockOf<"table">; onChange: (b: Block) => void }) {
  const [rawHeaders, setRawHeaders] = useState(b.headers.join(" | "));
  const [rawRows, setRawRows] = useState(b.rows.map((r) => r.join(" | ")).join("\n"));
  const split = (l: string) => l.split("|").map((c) => c.trim());
  return (
    <div className="space-y-2">
      <input value={b.caption ?? ""} onChange={(e) => onChange({ ...b, caption: e.target.value || undefined })} placeholder="Table caption (describes the comparison)" className="field" maxLength={200} />
      <input
        value={rawHeaders}
        onChange={(e) => {
          setRawHeaders(e.target.value);
          onChange({ ...b, headers: split(e.target.value).slice(0, 8) });
        }}
        placeholder="Column headers separated by |   e.g.  Shape | Best for | Upkeep"
        className="field font-semibold"
      />
      <textarea
        value={rawRows}
        onChange={(e) => {
          setRawRows(e.target.value);
          onChange({ ...b, rows: e.target.value.split("\n").filter((l) => l.trim()).map((l) => split(l).slice(0, 8)).slice(0, 40) });
        }}
        rows={Math.max(3, rawRows.split("\n").length + 1)}
        placeholder={"One row per line, cells separated by |\nAlmond | Elongating short fingers | Medium"}
        className="field font-mono text-[0.8125rem]"
      />
    </div>
  );
}
