import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  type CategoryNode,
  categoryIds,
  countPublished,
  getArticlesInCategories,
  getCategoryTree,
  getEvergreenGuides,
  isCategoryIndexable,
} from "@/lib/queries/public";
import { categoryPath } from "@/lib/urls";
import { pageMetadata } from "@/lib/seo/metadata";
import { collectionPageJsonLd } from "@/lib/seo/jsonld";
import { Breadcrumbs, EmptyState, JsonLd, Pagination } from "@/components/editorial/Common";
import { StoryHeadline, StoryLead, StoryStack } from "@/components/editorial/StoryCards";
import { AdSlot } from "@/components/editorial/Monetization";

export const CATEGORY_PER_PAGE = 13; // 1 featured + 12 grid on page 1

/** Editorially related sections for cross-linking (by root slug). */
const RELATED_TOPICS: Record<string, string[]> = {
  nails: ["beauty", "accessories", "outfits"],
  outfits: ["shoes", "accessories", "fashion"],
  shoes: ["outfits", "fashion", "accessories"],
  beauty: ["nails", "hairstyles"],
  hairstyles: ["beauty", "nails"],
  accessories: ["outfits", "shoes", "fashion"],
  fashion: ["outfits", "shoes", "accessories"],
};

export function resolvePage(raw?: string): number | null {
  if (raw === undefined) return 1;
  if (!/^\d{1,4}$/.test(raw)) return null;
  const n = Number(raw);
  return n >= 2 ? n : null; // /page/1/ and /page/0/ are not valid URLs
}

export async function categoryMetadata(node: CategoryNode, page: number): Promise<Metadata> {
  const path = categoryPath(node, page);
  const base = node.seoTitle || (node.parent ? `${node.name} — ${node.parent.name}` : node.name);
  return pageMetadata({
    title: page > 1 ? `${base} — Page ${page}` : base,
    description: (node.metaDescription || node.description || `${node.name} stories from Gloss & Thread.`) + (page > 1 ? ` Page ${page}.` : ""),
    path,
    index: isCategoryIndexable(node),
  });
}

export async function CategoryLanding({ node, page }: { node: CategoryNode; page: number }) {
  const ids = node.parent ? [node.id] : categoryIds(node);
  const tree = await getCategoryTree();
  const root = node.parent ? tree.find((r) => r.id === node.parent!.id) ?? null : node;
  const total = await countPublished({ categoryId: { in: ids } });
  const totalPages = Math.max(1, Math.ceil(total / CATEGORY_PER_PAGE));
  if (page > totalPages) notFound();
  const items = await getArticlesInCategories(ids, { take: CATEGORY_PER_PAGE, skip: (page - 1) * CATEGORY_PER_PAGE });
  const guides = page === 1 ? await getEvergreenGuides(5, ids) : [];
  const related = (RELATED_TOPICS[root?.slug ?? ""] ?? [])
    .map((s) => tree.find((t) => t.slug === s))
    .filter((t): t is CategoryNode => !!t && t.publishedCount > 0);

  const crumbs = node.parent
    ? [
        { name: node.parent.name, path: categoryPath({ slug: node.parent.slug }) },
        { name: node.name, path: categoryPath(node) },
      ]
    : [{ name: node.name, path: categoryPath(node) }];
  if (page > 1) crumbs.push({ name: `Page ${page}`, path: categoryPath(node, page) });

  const featured = page === 1 ? items[0] : undefined;
  const grid = page === 1 ? items.slice(1) : items;
  const subnav = root?.children ?? [];
  const thin = !isCategoryIndexable(node);

  return (
    <div className="page-x pt-6 sm:pt-10">
      <JsonLd data={collectionPageJsonLd({ path: categoryPath(node, page), name: node.name, description: node.description ?? node.name })} />
      <Breadcrumbs items={crumbs} />

      <header className="mt-8 border-b border-line pb-10 sm:mt-10">
        {node.parent && (
          <Link href={categoryPath({ slug: node.parent.slug })} className="label-rose">
            {node.parent.name}
          </Link>
        )}
        <h1 className="mt-3 font-serif text-[2.75rem] leading-[1.02] font-medium sm:text-[4rem] lg:text-[4.75rem]">
          {node.name}
          {page > 1 && <span className="sr-only"> — page {page}</span>}
        </h1>
        {node.description && <p className="mt-5 max-w-2xl text-[1.125rem] leading-relaxed text-muted sm:text-[1.25rem]">{node.description}</p>}
        {page === 1 && node.intro && (
          <div className="mt-6 max-w-3xl space-y-4 text-[1rem] leading-relaxed text-[#3a3a3a]">
            {node.intro.split(/\n{2,}/).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        )}
        {subnav.length > 0 && (
          <nav aria-label={`${root?.name} topics`} className="mt-8">
            <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
              <li className="shrink-0">
                <Link
                  href={categoryPath(root!)}
                  aria-current={!node.parent ? "page" : undefined}
                  className={`flex min-h-10 items-center border px-4 text-[0.8125rem] whitespace-nowrap ${!node.parent ? "border-ink bg-ink text-white" : "border-line hover:border-ink"}`}
                >
                  All {root?.name}
                </Link>
              </li>
              {subnav.map((c) => {
                const active = c.id === node.id;
                return (
                  <li key={c.id} className="shrink-0">
                    <Link
                      href={categoryPath({ slug: c.slug, parent: { slug: root!.slug } })}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-10 items-center border px-4 text-[0.8125rem] whitespace-nowrap ${active ? "border-ink bg-ink text-white" : "border-line hover:border-ink"}`}
                    >
                      {c.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
      </header>

      {items.length === 0 ? (
        <div className="mt-12">
          <EmptyState title={`Our ${node.name.toLowerCase()} coverage is in progress`}>
            <p>
              Our editors are reporting new stories for this section. Until then, explore{" "}
              {root && node.id !== root.id ? (
                <Link href={categoryPath(root)} className="text-ink underline underline-offset-2">all {root.name.toLowerCase()} stories</Link>
              ) : (
                <Link href="/blog/" className="text-ink underline underline-offset-2">our latest stories</Link>
              )}
              .
            </p>
          </EmptyState>
        </div>
      ) : (
        <>
          {featured && (
            <section aria-label={`Featured ${node.name} story`} className="mt-12 grid gap-12 lg:grid-cols-12">
              <div className={guides.length ? "lg:col-span-8" : "lg:col-span-12"}>
                <StoryLead article={featured} priority as="h2" />
              </div>
              {guides.length > 0 && (
                <aside aria-labelledby="guides-heading" className="lg:col-span-4">
                  <h2 id="guides-heading" className="label border-b border-ink pb-3">
                    Popular {node.name} Guides
                  </h2>
                  <ul className="divide-y divide-line">
                    {guides.map((g) => (
                      <li key={g.id} className="py-5">
                        <StoryHeadline article={g} as="h3" showLabel={false} />
                      </li>
                    ))}
                  </ul>
                </aside>
              )}
            </section>
          )}

          {grid.length > 0 && (
            <section aria-labelledby="cat-latest" className="mt-16">
              <h2 id="cat-latest" className="section-rule pt-4 pb-8 font-serif text-[1.75rem] font-medium">
                {page === 1 ? `Latest in ${node.name}` : `${node.name}: page ${page}`}
              </h2>
              <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {grid.map((a) => (
                  <StoryStack key={a.id} article={a} ratio="4/3" showExcerpt sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
                ))}
              </div>
            </section>
          )}

          <Pagination page={page} totalPages={totalPages} hrefFor={(p) => categoryPath(node, p)} label={`${node.name} pages`} />
        </>
      )}

      {thin && items.length > 0 && (
        <p className="mt-10 text-center text-[0.8125rem] text-muted">More {node.name.toLowerCase()} stories are on the way.</p>
      )}

      <AdSlot placement="betweenSections" className="mt-16" />

      {related.length > 0 && page === 1 && (
        <section aria-labelledby="related-topics" className="mt-20 border-t border-line pt-8">
          <h2 id="related-topics" className="label text-muted">Related topics</h2>
          <ul className="mt-5 grid gap-6 sm:grid-cols-3">
            {related.map((r) => (
              <li key={r.id}>
                <Link href={categoryPath(r)} className="group block">
                  <span className="font-serif text-[1.5rem] group-hover:text-rose-dark">{r.name} →</span>
                  {r.description && <span className="mt-1 block text-[0.875rem] leading-relaxed text-muted">{r.description}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
