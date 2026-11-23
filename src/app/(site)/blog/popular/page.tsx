import type { Metadata } from "next";
import { getEvergreenGuides, getPopularArticles } from "@/lib/queries/public";
import { pageMetadata } from "@/lib/seo/metadata";
import { Breadcrumbs, EmptyState } from "@/components/editorial/Common";
import { StoryRow } from "@/components/editorial/StoryCards";

export const revalidate = 600;

export const metadata: Metadata = pageMetadata({
  title: "Popular Guides: Essential Style & Beauty How-Tos",
  description:
    "The Gloss & Thread guides readers return to: how to build work outfits, choose nail shapes, style loafers and more.",
  path: "/blog/popular/",
});

export default async function PopularGuidesPage() {
  const [popular, guides] = await Promise.all([getPopularArticles(10), getEvergreenGuides(24)]);
  const shown = new Set(popular.curated ? popular.items.map((a) => a.id) : []);
  const rest = guides.filter((g) => !shown.has(g.id));

  return (
    <div className="page-x pt-6 sm:pt-10">
      <Breadcrumbs items={[{ name: "Blog", path: "/blog/" }, { name: "Popular Guides", path: "/blog/popular/" }]} />
      <header className="mt-8 max-w-3xl border-b border-line pb-10 sm:mt-10">
        <h1 className="font-serif text-[2.75rem] leading-[1.02] font-medium sm:text-[4rem]">Popular Guides</h1>
        <p className="mt-5 text-[1.125rem] leading-relaxed text-muted">
          Practical, evergreen how-tos — the outfit formulas, nail explainers and shoe guides worth bookmarking.
          {popular.curated ? " Our editors' most-recommended picks come first." : ""}
        </p>
      </header>

      {popular.curated && popular.items.length > 0 && (
        <section aria-labelledby="editors-picks" className="mt-12">
          <h2 id="editors-picks" className="label mb-6 text-muted">Editors&apos; most recommended</h2>
          <ol className="divide-y divide-line border-y border-line">
            {popular.items.map((a) => (
              <li key={a.id} className="py-6">
                <StoryRow article={a} as="h3" />
              </li>
            ))}
          </ol>
        </section>
      )}

      <section aria-labelledby="all-guides" className="mt-12">
        <h2 id="all-guides" className="label mb-6 text-muted">All guides</h2>
        {rest.length ? (
          <ul className="divide-y divide-line border-y border-line">
            {rest.map((a) => (
              <li key={a.id} className="py-6">
                <StoryRow article={a} as="h3" />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Guides are on the way" />
        )}
      </section>
    </div>
  );
}
