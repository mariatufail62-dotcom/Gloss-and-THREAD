"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { Block } from "@/lib/blocks/schema";
import type { AuditCheck } from "@/lib/audit";
import type { ActionState } from "@/lib/admin/forms";
import { saveArticleAction, importMarkdownAction, deleteArticleAction, restoreRevisionAction } from "@/app/admin/actions/articles";
import type { PickerMedia } from "@/app/admin/actions/media";
import { FormMessage, InlineAction, SubmitButton } from "@/components/admin/forms";
import { BlockEditor } from "./BlockEditor";
import { MediaField, useMediaLibrary } from "./MediaPicker";
import { MultiPick } from "./MultiPick";
import { slugify } from "@/lib/site";

export interface EditorArticle {
  id: string;
  title: string;
  slug: string;
  subtitle: string;
  excerpt: string;
  body: Block[];
  categoryId: string;
  authorId: string;
  featuredImageId: string | null;
  seoTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  robotsIndex: boolean;
  inSitemap: boolean;
  isFeatured: boolean;
  isSponsored: boolean;
  sponsorName: string;
  hasAffiliateLinks: boolean;
  showToc: boolean;
  isSample: boolean;
  contentType: string;
  sources: string;
  tags: string;
  relatedIds: string[];
  reviewStatus: string;
  reviewNotes: string;
  publishedAtLocal: string;
  status: string;
  isLive: boolean;
  publicPath: string | null;
  createdBy: string | null;
  reviewedBy: string | null;
}

export interface EditorProps {
  article: EditorArticle;
  options: {
    categories: { id: string; label: string; path: string }[];
    authors: { id: string; name: string; kind: string }[];
    media: PickerMedia[];
    products: { id: string; label: string; verified: boolean }[];
    articles: { id: string; title: string; path: string; live: boolean }[];
  };
  checks: AuditCheck[];
  revisions: { id: string; note: string | null; createdAt: string; by: string | null }[];
  isEditor: boolean;
}

const CONTENT_TYPES: [string, string][] = [
  ["FEATURE", "Editorial feature"],
  ["INSPIRATION_GALLERY", "Inspiration gallery"],
  ["HOW_TO", "How-to guide"],
  ["EXPLAINER", "Evergreen explainer"],
  ["TREND_ANALYSIS", "Seasonal trend analysis"],
  ["OUTFIT_GUIDE", "Outfit guide"],
  ["COMPARISON", "Product comparison"],
  ["SHOPPING_ROUNDUP", "Shopping roundup"],
];

export function ArticleEditor({ article: a, options, checks, revisions, isEditor }: EditorProps) {
  const [state, formAction] = useActionState<ActionState, FormData>(saveArticleAction, null);
  const library = useMediaLibrary(options.media);
  const [blocks, setBlocks] = useState<Block[]>(a.body);
  const [featured, setFeatured] = useState<string | null>(a.featuredImageId);
  const [related, setRelated] = useState<string[]>(a.relatedIds);
  const [title, setTitle] = useState(a.title);
  const [slug, setSlug] = useState(a.slug);
  const [seoTitle, setSeoTitle] = useState(a.seoTitle);
  const [meta, setMeta] = useState(a.metaDescription);
  const [sponsored, setSponsored] = useState(a.isSponsored);
  const [dirty, setDirty] = useState(false);
  const lastAt = useRef<number | undefined>(undefined);

  // Re-sync when the server sends a fresh article (after restore / save).
  useEffect(() => {
    setBlocks(a.body);
  }, [a.body]);

  useEffect(() => {
    if (state?.ok && state.at !== lastAt.current) {
      lastAt.current = state.at;
      setDirty(false);
    }
  }, [state]);

  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const articleOptions = useMemo(
    () => options.articles.filter((x) => x.id !== a.id).map((x) => ({ id: x.id, label: x.title, hint: x.live ? x.path : "scheduled" })),
    [options.articles, a.id]
  );
  const productOptions = useMemo(() => options.products.map((p) => ({ id: p.id, label: p.label, hint: p.verified ? undefined : "unverified — hidden" })), [options.products]);
  const ctx = { library, products: productOptions, articles: articleOptions };

  const errors = checks.filter((c) => c.level === "error");
  const warnings = checks.filter((c) => c.level === "warning");
  const err = state?.errors ?? {};

  return (
    <form action={formAction} onChange={() => setDirty(true)} className="grid gap-8 xl:grid-cols-[1fr_22rem]">
      <input type="hidden" name="id" value={a.id} />
      <input type="hidden" name="body" value={JSON.stringify(blocks)} />
      <input type="hidden" name="relatedIds" value={related.join(",")} />

      {/* ── Main column ── */}
      <div className="min-w-0 space-y-6">
        <div className="sticky top-0 z-30 -mx-1 border-b border-line bg-paper-2/95 px-1 py-3 backdrop-blur">
          <FormMessage state={state} />
          <div className={`flex flex-wrap items-center gap-2 ${state ? "mt-3" : ""}`}>
            <SubmitButton name="intent" value="save" variant="outline" pendingLabel="Saving…">
              {a.status === "PUBLISHED" ? "Update live article" : "Save draft"}
            </SubmitButton>
            {isEditor && a.status !== "PUBLISHED" && (
              <SubmitButton name="intent" value="publish" pendingLabel="Publishing…" confirm="Publish this article now? It will be public immediately.">
                Publish now
              </SubmitButton>
            )}
            {isEditor && a.status !== "PUBLISHED" && (
              <SubmitButton name="intent" value="schedule" variant="outline" pendingLabel="Scheduling…">
                Schedule
              </SubmitButton>
            )}
            {isEditor && (a.status === "PUBLISHED" || a.status === "SCHEDULED") && (
              <SubmitButton name="intent" value="unpublish" variant="danger" pendingLabel="…" confirm="Unpublish? The article will disappear from the site.">
                Unpublish
              </SubmitButton>
            )}
            <Link href={`/admin/preview/${a.id}/`} target="_blank" className="btn-outline">
              Preview ↗
            </Link>
            {a.isLive && a.publicPath && (
              <Link href={a.publicPath} target="_blank" className="text-[0.8125rem] underline">
                View live ↗
              </Link>
            )}
            {dirty && <span className="ml-auto text-[0.75rem] text-amber-800">Unsaved changes</span>}
          </div>
          {!isEditor && <p className="mt-2 text-[0.75rem] text-muted">Contributors save drafts; an editor reviews and publishes.</p>}
        </div>

        <div className="space-y-4 border border-line bg-white p-5">
          <div>
            <label htmlFor="title" className="label text-muted">Headline (H1)</label>
            <textarea
              id="title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value.replace(/\n/g, " "))}
              rows={2}
              maxLength={200}
              required
              className="mt-2 w-full resize-none border-0 border-b border-line bg-transparent pb-2 font-serif text-[1.875rem] leading-tight outline-none focus:border-ink"
            />
            {err.title && <p className="text-[0.75rem] text-rose-dark">{err.title}</p>}
          </div>
          <div>
            <label htmlFor="subtitle" className="label text-muted">Subtitle / dek (optional)</label>
            <textarea id="subtitle" name="subtitle" defaultValue={a.subtitle} rows={2} maxLength={300} className="field mt-2" />
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <div>
              <label htmlFor="slug" className="label text-muted">URL slug</label>
              <input id="slug" name="slug" value={slug} onChange={(e) => setSlug(e.target.value)} className="field mt-2 font-mono text-[0.8125rem]" maxLength={90} />
              <p className="mt-1 text-[0.6875rem] text-muted">
                {a.isLive ? "Changing the slug of a live article creates a permanent redirect automatically." : "Lowercase words separated by hyphens."}
                {err.slug && <span className="ml-1 font-semibold text-rose-dark">{err.slug}</span>}
              </p>
            </div>
            <button type="button" className="self-center text-[0.8125rem] underline sm:mt-5" onClick={() => { setSlug(slugify(title)); setDirty(true); }}>
              From headline
            </button>
          </div>
        </div>

        <section aria-label="Article body">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="label">Body</h2>
            <MarkdownImport onImport={(b, mode) => { setBlocks(mode === "replace" ? b : [...blocks, ...b]); setDirty(true); }} />
          </div>
          <BlockEditor blocks={blocks} onChange={(b) => { setBlocks(b); setDirty(true); }} ctx={ctx} />
        </section>

        <LinkFinder articles={options.articles} categories={options.categories} />

        <section className="space-y-4 border border-line bg-white p-5">
          <h2 className="label">Search & sharing</h2>
          <div>
            <label htmlFor="seoTitle" className="mb-1.5 block text-[0.8125rem] font-semibold">SEO title <Counter n={seoTitle.length} good={[30, 65]} /></label>
            <input id="seoTitle" name="seoTitle" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} maxLength={120} placeholder={title} className="field" />
          </div>
          <div>
            <label htmlFor="metaDescription" className="mb-1.5 block text-[0.8125rem] font-semibold">Meta description <Counter n={meta.length} good={[120, 160]} /></label>
            <textarea id="metaDescription" name="metaDescription" value={meta} onChange={(e) => setMeta(e.target.value)} maxLength={320} rows={3} className="field" />
          </div>
          <SearchPreview title={seoTitle || title} description={meta} path={a.publicPath ?? `/…/${slug}/`} />
          <div>
            <label htmlFor="excerpt" className="mb-1.5 block text-[0.8125rem] font-semibold">Card excerpt</label>
            <textarea id="excerpt" name="excerpt" defaultValue={a.excerpt} maxLength={400} rows={2} className="field" placeholder="Shown on cards and listings. Leave empty to use the first paragraph." />
          </div>
          {isEditor && (
            <div>
              <label htmlFor="canonicalUrl" className="mb-1.5 block text-[0.8125rem] font-semibold">Canonical override</label>
              <input id="canonicalUrl" name="canonicalUrl" defaultValue={a.canonicalUrl} className="field font-mono text-[0.8125rem]" placeholder="Leave empty — a self-referencing canonical is generated" />
              {err.canonicalUrl && <p className="mt-1 text-[0.75rem] text-rose-dark">{err.canonicalUrl}</p>}
            </div>
          )}
          <div>
            <label htmlFor="sources" className="mb-1.5 block text-[0.8125rem] font-semibold">Sources</label>
            <textarea id="sources" name="sources" defaultValue={a.sources} rows={3} className="field font-mono text-[0.8125rem]" placeholder={"One per line:  Title | https://source.example/page"} />
          </div>
        </section>
      </div>

      {/* ── Sidebar ── */}
      <aside className="space-y-5">
        <Panel title="Status">
          <p className="text-[0.875rem]">
            <span className="font-semibold">{statusLabel(a.status, a.isLive)}</span>
            {a.createdBy && <span className="block text-[0.75rem] text-muted">Created by {a.createdBy}</span>}
          </p>
          <div className="mt-3">
            <label htmlFor="publishedAt" className="mb-1.5 block text-[0.8125rem] font-semibold">Publish date (New York time)</label>
            <input id="publishedAt" type="datetime-local" name="publishedAt" defaultValue={a.publishedAtLocal} className="field" />
            <p className="mt-1 text-[0.6875rem] text-muted">Required for scheduling. Leave empty to publish now.</p>
            {err.publishedAt && <p className="text-[0.75rem] text-rose-dark">{err.publishedAt}</p>}
          </div>
          {isEditor && a.isLive && (
            <label className="mt-3 flex items-start gap-2 text-[0.8125rem]">
              <input type="checkbox" name="markUpdated" className="mt-0.5 accent-ink" />
              Meaningful update — show “Updated” date to readers
            </label>
          )}
        </Panel>

        <Panel title={`Checklist · ${errors.length} blocking · ${warnings.length} advisory`}>
          <p className="mb-2 text-[0.6875rem] text-muted">Reflects the last saved version. Editorial checks, not ranking scores.</p>
          <ul className="space-y-1.5 text-[0.8125rem]">
            {checks.map((c) => (
              <li key={c.id} className="flex gap-2">
                <span aria-hidden className={c.level === "error" ? "text-rose-dark" : c.level === "warning" ? "text-amber-700" : "text-emerald-700"}>
                  {c.level === "error" ? "●" : c.level === "warning" ? "▲" : "✓"}
                </span>
                <span>
                  <span className="font-semibold">{c.label}.</span> <span className="text-muted">{c.message}</span>
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Editorial review">
          <select name="reviewStatus" defaultValue={a.reviewStatus} className="field" aria-label="Review status">
            <option value="NOT_REVIEWED">Not reviewed</option>
            <option value="CHANGES_REQUESTED">Changes requested</option>
            <option value="APPROVED" disabled={!isEditor}>Approved — fact-checked, sourced, image rights cleared</option>
          </select>
          <textarea name="reviewNotes" defaultValue={a.reviewNotes} rows={3} maxLength={2000} placeholder="Notes for the writer / editor" className="field mt-2" />
          {a.reviewedBy && <p className="mt-1 text-[0.6875rem] text-muted">Last review by {a.reviewedBy}</p>}
        </Panel>

        <Panel title="Placement">
          <label className="mb-1.5 block text-[0.8125rem] font-semibold" htmlFor="categoryId">Category</label>
          <select id="categoryId" name="categoryId" defaultValue={a.categoryId} className="field">
            <option value="">— Choose —</option>
            {options.categories.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
          <label className="mt-3 mb-1.5 block text-[0.8125rem] font-semibold" htmlFor="authorId">Author byline</label>
          <select id="authorId" name="authorId" defaultValue={a.authorId} className="field">
            <option value="">— Choose —</option>
            {options.authors.map((x) => (
              <option key={x.id} value={x.id}>{x.name}{x.kind === "ORGANIZATION" ? " (desk)" : ""}</option>
            ))}
          </select>
          <label className="mt-3 mb-1.5 block text-[0.8125rem] font-semibold" htmlFor="contentType">Format</label>
          <select id="contentType" name="contentType" defaultValue={a.contentType} className="field">
            {CONTENT_TYPES.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <label className="mt-3 mb-1.5 block text-[0.8125rem] font-semibold" htmlFor="tags">Tags</label>
          <input id="tags" name="tags" defaultValue={a.tags} className="field" placeholder="Comma separated, e.g. almond nails, neutrals" />
        </Panel>

        <Panel title="Featured image">
          <MediaField name="featuredImageId" library={library} value={featured} onChange={(id) => { setFeatured(id); setDirty(true); }} />
        </Panel>

        <Panel title="Related reading (manual)">
          <MultiPick options={articleOptions} value={related} onChange={(v) => { setRelated(v); setDirty(true); }} max={4} placeholder="Search published articles…" />
          <p className="mt-1 text-[0.6875rem] text-muted">Leave empty to recommend automatically by category and tags.</p>
        </Panel>

        <Panel title="Options">
          <div className="space-y-2.5 text-[0.8125rem]">
            <Check name="showToc" label="Show table of contents" defaultChecked={a.showToc} />
            <Check name="hasAffiliateLinks" label="Contains affiliate links (shows disclosure)" defaultChecked={a.hasAffiliateLinks} />
            <label className="flex items-start gap-2">
              <input type="checkbox" name="isSponsored" checked={sponsored} onChange={(e) => setSponsored(e.target.checked)} className="mt-0.5 accent-ink" />
              Sponsored content (labeled for readers)
            </label>
            {sponsored && <input name="sponsorName" defaultValue={a.sponsorName} placeholder="Sponsor name (required)" className="field" maxLength={120} />}
            {isEditor && (
              <>
                <Check name="isFeatured" label="Featured (eligible for homepage hero)" defaultChecked={a.isFeatured} />
                <Check name="robotsIndex" label="Allow search engines to index" defaultChecked={a.robotsIndex} />
                <Check name="inSitemap" label="Include in XML sitemap" defaultChecked={a.inSitemap} />
                <Check name="isSample" label="Sample / demo content (shows a notice)" defaultChecked={a.isSample} />
              </>
            )}
            {!isEditor && (
              <>
                {a.robotsIndex && <input type="hidden" name="robotsIndex" value="on" />}
                {a.inSitemap && <input type="hidden" name="inSitemap" value="on" />}
              </>
            )}
          </div>
        </Panel>

        {revisions.length > 0 && (
          <Panel title="Revisions">
            <ul className="space-y-2 text-[0.8125rem]">
              {revisions.map((r) => (
                <li key={r.id} className="flex items-start justify-between gap-2">
                  <span>
                    {r.note ?? "Saved"}
                    <span className="block text-[0.6875rem] text-muted">
                      {new Date(r.createdAt).toLocaleString("en-US", { timeZone: "America/New_York", dateStyle: "medium", timeStyle: "short" })}
                      {r.by ? ` · ${r.by}` : ""}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[0.6875rem] text-muted">Restore a revision from the list below the editor.</p>
          </Panel>
        )}
      </aside>
    </form>
  );
}

/** Rendered outside the main <form> (nested forms are invalid HTML). */
export function ArticleSecondaryActions({ id, revisions, canDelete }: { id: string; revisions: EditorProps["revisions"]; canDelete: boolean }) {
  return (
    <div className="mt-10 grid gap-6 border-t border-line pt-8 lg:grid-cols-2">
      {revisions.length > 0 && (
        <div>
          <h2 className="label mb-3">Restore a revision</h2>
          <ul className="divide-y divide-line border border-line bg-white text-[0.8125rem]">
            {revisions.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span>
                  {r.note ?? "Saved"} · {new Date(r.createdAt).toLocaleString("en-US", { timeZone: "America/New_York", dateStyle: "medium", timeStyle: "short" })}
                  {r.by ? ` · ${r.by}` : ""}
                </span>
                <InlineAction action={restoreRevisionAction} fields={{ revisionId: r.id }} label="Restore" confirm="Replace the current content with this revision? Unsaved edits will be lost." />
              </li>
            ))}
          </ul>
        </div>
      )}
      {canDelete && (
        <div>
          <h2 className="label mb-3">Danger zone</h2>
          <p className="mb-3 text-[0.8125rem] text-muted">Deleting removes the article and its revisions permanently. Published articles must be unpublished first.</p>
          <InlineAction action={deleteArticleAction} fields={{ id }} label="Delete article" variant="danger" confirm="Permanently delete this article?" />
        </div>
      )}
    </div>
  );
}

function statusLabel(status: string, live: boolean) {
  if (status === "PUBLISHED") return "Published";
  if (status === "SCHEDULED") return live ? "Live (scheduled time passed)" : "Scheduled";
  if (status === "ARCHIVED") return "Archived";
  return "Draft";
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-line bg-white">
      <h2 className="label border-b border-line px-4 py-3">{title}</h2>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Check({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-start gap-2">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-0.5 accent-ink" />
      {label}
    </label>
  );
}

function Counter({ n, good }: { n: number; good: [number, number] }) {
  const okLen = n >= good[0] && n <= good[1];
  return <span className={`ml-1 text-[0.6875rem] font-normal ${n === 0 ? "text-muted" : okLen ? "text-emerald-700" : "text-amber-700"}`}>{n} chars</span>;
}

function SearchPreview({ title, description, path }: { title: string; description: string; path: string }) {
  return (
    <div className="border border-line bg-paper-2 p-4" aria-label="Approximate search result preview">
      <p className="text-[0.6875rem] text-muted">Approximate result preview</p>
      <p className="mt-1 truncate text-[0.75rem] text-muted">yoursite.com{path}</p>
      <p className="truncate text-[1.0625rem] text-[#1a0dab]">{title} | Gloss &amp; Thread</p>
      <p className="line-clamp-2 text-[0.8125rem] text-ink/80">{description || "No meta description — search engines will pick text from the page."}</p>
    </div>
  );
}

function MarkdownImport({ onImport }: { onImport: (b: Block[], mode: "append" | "replace") => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const run = (mode: "append" | "replace") =>
    start(async () => {
      setError(null);
      const r = await importMarkdownAction(text);
      if (!r.ok) return setError(r.error);
      if (mode === "replace" && !window.confirm("Replace the entire body?")) return;
      onImport(r.blocks, mode);
      setText("");
      ref.current?.close();
    });
  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()} className="text-[0.8125rem] underline">
        Import Markdown
      </button>
      <dialog ref={ref} className="m-auto w-[min(48rem,calc(100vw-2rem))] border border-line bg-white p-5 backdrop:bg-ink/40">
        <p className="label">Import Markdown</p>
        <p className="mt-2 text-[0.75rem] leading-relaxed text-muted">
          Supports ## / ### headings, lists, &gt; quotes, tables, :::tip / :::note / :::faq blocks, ---, and inline **bold**, *italic*, [links](/path/).
        </p>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={14} className="field mt-3 font-mono text-[0.8125rem]" />
        {error && <p role="alert" className="mt-2 text-[0.75rem] text-rose-dark">{error}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" disabled={pending || !text.trim()} onClick={() => run("append")} className="btn-dark disabled:opacity-50">Append</button>
          <button type="button" disabled={pending || !text.trim()} onClick={() => run("replace")} className="btn-outline disabled:opacity-50">Replace body</button>
          <button type="button" onClick={() => ref.current?.close()} className="ml-auto text-[0.8125rem] underline">Cancel</button>
        </div>
      </dialog>
    </>
  );
}

function LinkFinder({ articles, categories }: { articles: EditorProps["options"]["articles"]; categories: EditorProps["options"]["categories"] }) {
  const [q, setQ] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const targets = useMemo(
    () => [
      ...categories.map((c) => ({ key: `c-${c.id}`, label: c.label, path: c.path, kind: "Category" })),
      ...articles.filter((x) => x.live).map((x) => ({ key: `a-${x.id}`, label: x.title, path: x.path, kind: "Article" })),
    ],
    [articles, categories]
  );
  const t = q.trim().toLowerCase();
  const matches = t ? targets.filter((x) => x.label.toLowerCase().includes(t)).slice(0, 8) : [];
  return (
    <section className="border border-line bg-white p-5">
      <h2 className="label">Internal link finder</h2>
      <p className="mt-1 text-[0.75rem] text-muted">Search live articles and categories, then paste the copied Markdown link into any paragraph.</p>
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. loafers" className="field mt-3" aria-label="Find internal link" />
      {matches.length > 0 && (
        <ul className="mt-2 divide-y divide-line border border-line">
          {matches.map((m) => {
            const md = `[${m.label}](${m.path})`;
            return (
              <li key={m.key} className="flex items-center gap-3 px-3 py-2 text-[0.8125rem]">
                <span className="label w-16 shrink-0 text-muted">{m.kind}</span>
                <span className="min-w-0 flex-1 truncate">{m.label}</span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(md).then(() => { setCopied(m.key); setTimeout(() => setCopied(null), 1500); })}
                  className="shrink-0 underline"
                >
                  {copied === m.key ? "Copied" : "Copy link"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
