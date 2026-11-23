import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { articleCardSelect, countPublished, getCategoryTree, getLatestArticles, publishedWhere } from "@/lib/queries/public";
import { blogPath, categoryPath } from "@/lib/urls";
import { Breadcrumbs, EmptyState, Pagination } from "@/components/editorial/Common";
import { StoryLead, StoryStack } from "@/components/editorial/StoryCards";
import { SearchIcon } from "@/components/layout/Icons";

const FIRST_PAGE = 13; // 1 featured + 12
const PER_PAGE = 12;

export function blogTotalPages(total: number) {
  return 1 + Math.ceil(Math.max(0, total - FIRST_PAGE) / PER_PAGE);
}

export async function BlogIndex({ page }: { page: number }) {
  const total = await countPublished();
  const totalPages = blogTotalPages(total);
  if (page > totalPages) notFound();

  const skip = page === 1 ? 0 : FIRST_PAGE + (page - 2) * PER_PAGE;
  const take = page === 1 ? FIRST_PAGE : PER_PAGE;
  const [items, tree] = await Promise.all([getLatestArticles({ take, skip }), getCategoryTree()]);
  const featured = page === 1 ? items[0] : undefined;
  const grid = page === 1 ? items.slice(1) : items;
  const editorsFeatured =
    page === 1 && featured
      ? await db.article.findMany({
          where: { ...publishedWhere(), isFeatured: true, id: { not: featured.id } },
          orderBy: { publishedAt: "desc" },
          take: 3,
          select: articleCardSelect,
        })
      : [];

  return (
    <div className="page-x pt-6 sm:pt-10">
      <Breadcrumbs items={page > 1 ? [{ name: "Blog", path: "/blog/" }, { name: `Page ${page}`, path: blogPath(page) }] : [{ name: "Blog", path: "/blog/" }]} />

      <header className="mt-8 grid gap-8 border-b border-line pb-10 sm:mt-10 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="label text-muted">The Journal</p>
          <h1 className="mt-3 font-serif text-[2.75rem] leading-[1.02] font-medium sm:text-[4rem] lg:text-[4.75rem]">
            {page > 1 ? `All Stories — Page ${page}` : "All Stories"}
          </h1>
          {page === 1 && (
            <p className="mt-5 max-w-2xl text-[1.125rem] leading-relaxed text-muted">
              Every Gloss &amp; Thread story in one place — outfit formulas, nail ideas, shoe guides, beauty basics and the
              trends we think are worth your time, newest first.
            </p>
          )}
        </div>
        <form action="/search/" method="get" role="search" className="w-full lg:w-80">
          <label htmlFor="blog-search" className="sr-only">Search stories</label>
          <div className="flex items-center border-b border-ink">
            <input id="blog-search" name="q" type="search" placeholder="Search stories" className="min-h-11 flex-1 bg-transparent text-[0.9375rem] outline-none" />
            <button type="submit" className="flex h-11 w-11 items-center justify-center">
              <SearchIcon />
              <span className="sr-only">Search</span>
            </button>
          </div>
        </form>
      </header>

      <nav aria-label="Browse by category" className="mt-6">
        <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          {tree
            .filter((c) => c.showInNav)
            .map((c) => (
              <li key={c.id} className="shrink-0">
                <Link href={categoryPath(c)} className="flex min-h-10 items-center border border-line px-4 text-[0.8125rem] whitespace-nowrap hover:border-ink">
                  {c.name}
                </Link>
              </li>
            ))}
          <li className="shrink-0">
            <Link href="/blog/popular/" className="flex min-h-10 items-center border border-line px-4 text-[0.8125rem] whitespace-nowrap hover:border-ink">
              Popular Guides
            </Link>
          </li>
        </ul>
      </nav>

      {items.length === 0 ? (
        <div className="mt-12">
          <EmptyState title="No stories published yet">Our first stories are being edited now.</EmptyState>
        </div>
      ) : (
        <>
          {featured && (
            <section aria-label="Newest story" className="mt-12">
              <StoryLead article={featured} priority as="h2" />
            </section>
          )}

          {editorsFeatured.length > 0 && (
            <section aria-labelledby="featured-heading" className="mt-16 bg-paper-2 px-5 py-10 sm:px-10">
              <h2 id="featured-heading" className="label mb-8 text-muted">Featured Stories</h2>
              <div className="grid gap-10 md:grid-cols-3 md:gap-8">
                {editorsFeatured.map((a) => (
                  <StoryStack key={a.id} article={a} ratio="4/3" sizes="(min-width: 768px) 33vw, 100vw" showByline={false} />
                ))}
              </div>
            </section>
          )}

          {grid.length > 0 && (
            <section aria-labelledby="latest" className="mt-16">
              <h2 id="latest" className="section-rule pt-4 pb-8 font-serif text-[1.75rem] font-medium">
                {page === 1 ? "Latest Stories" : `Stories, page ${page}`}
              </h2>
              <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {grid.map((a) => (
                  <StoryStack key={a.id} article={a} ratio="4/3" showExcerpt sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
                ))}
              </div>
            </section>
          )}

          <Pagination page={page} totalPages={totalPages} hrefFor={blogPath} label="Blog pages" />
        </>
      )}
    </div>
  );
}
