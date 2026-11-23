import type { Metadata } from "next";
import Link from "next/link";
import { searchArticles, searchByTag } from "@/lib/queries/public";
import { searchPath } from "@/lib/urls";
import { EmptyState, Pagination } from "@/components/editorial/Common";
import { StoryRow } from "@/components/editorial/StoryCards";
import { SearchIcon } from "@/components/layout/Icons";

// Search results are never indexed (prevents unlimited thin pages); links are still followed.
export const metadata: Metadata = {
  title: "Search",
  description: "Search Gloss & Thread stories.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/search/" },
};

const PER_PAGE = 12;

type Props = { searchParams: Promise<{ q?: string; tag?: string; page?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 120);
  const tagSlug = typeof sp.tag === "string" && /^[a-z0-9-]{1,80}$/.test(sp.tag) ? sp.tag : "";
  const page = Math.min(Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1), 50);

  let items: Awaited<ReturnType<typeof searchArticles>>["items"] = [];
  let total = 0;
  let tagName = "";
  if (tagSlug && !q) {
    const r = await searchByTag(tagSlug, page, PER_PAGE);
    items = r.items;
    total = r.total;
    tagName = r.tag?.name ?? "";
  } else if (q) {
    const r = await searchArticles(q, page, PER_PAGE);
    items = r.items;
    total = r.total;
  }
  const totalPages = Math.ceil(total / PER_PAGE);
  const hasQuery = !!q || !!tagSlug;

  return (
    <div className="page-x pt-10 sm:pt-14">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-serif text-[2.5rem] leading-none font-medium sm:text-[3.5rem]">
          {tagName ? `Topic: ${tagName}` : "Search"}
        </h1>
        <form action="/search/" method="get" role="search" className="mt-8">
          <label htmlFor="q" className="label text-muted">
            Search stories, topics and categories
          </label>
          <div className="mt-3 flex items-center border-b-2 border-ink">
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={q}
              autoFocus={!hasQuery}
              placeholder="Try “almond nails” or “work outfits”"
              className="min-h-14 flex-1 bg-transparent font-serif text-[1.5rem] outline-none placeholder:text-muted/60 sm:text-[1.75rem]"
            />
            <button type="submit" className="flex h-12 w-12 items-center justify-center">
              <SearchIcon className="h-6 w-6" />
              <span className="sr-only">Search</span>
            </button>
          </div>
        </form>

        <div className="mt-10" aria-live="polite">
          {hasQuery && (
            <p className="meta mb-6">
              {total === 0
                ? "No stories found."
                : `${total} ${total === 1 ? "story" : "stories"}${q ? ` for “${q}”` : ""}${totalPages > 1 ? ` · page ${page} of ${totalPages}` : ""}`}
            </p>
          )}

          {hasQuery && items.length === 0 ? (
            <EmptyState title="Nothing matched your search">
              <p>
                Check the spelling or try a broader term — for example “nails”, “loafers” or “capsule wardrobe”. You can
                also browse <Link href="/blog/" className="text-ink underline underline-offset-2">all stories</Link>.
              </p>
            </EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {items.map((a) => (
                <li key={a.id} className="py-6 first:pt-0">
                  <StoryRow article={a} as="h2" />
                </li>
              ))}
            </ul>
          )}

          {!hasQuery && (
            <div className="mt-6">
              <p className="label text-muted">Popular searches</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {["Almond nails", "French manicure", "Work outfits", "Loafers", "Capsule wardrobe", "Handbags"].map((s) => (
                  <li key={s}>
                    <Link href={searchPath(s)} rel="nofollow" className="flex min-h-10 items-center border border-line px-4 text-[0.875rem] hover:border-ink">
                      {s}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Pagination
            page={page}
            totalPages={totalPages}
            hrefFor={(p) => (tagSlug && !q ? `/search/?tag=${tagSlug}${p > 1 ? `&page=${p}` : ""}` : searchPath(q, p))}
            label="Search result pages"
          />
        </div>
      </div>
    </div>
  );
}
