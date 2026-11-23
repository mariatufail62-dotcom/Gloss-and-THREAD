import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCategoryTree, publishedWhere } from "@/lib/queries/public";
import { articlePath, categoryPath } from "@/lib/urls";
import { pageMetadata } from "@/lib/seo/metadata";
import { Breadcrumbs } from "@/components/editorial/Common";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  title: "Sitemap",
  description: "Every section and story on Gloss & Thread.",
  path: "/sitemap/",
});

export default async function HtmlSitemap() {
  const [tree, articles] = await Promise.all([
    getCategoryTree(),
    db.article.findMany({
      where: publishedWhere(),
      orderBy: { title: "asc" },
      select: { id: true, slug: true, title: true, categoryId: true, category: { select: { id: true, slug: true, parentId: true, parent: { select: { slug: true } } } } },
    }),
  ]);

  return (
    <div className="page-x pt-6 sm:pt-10">
      <Breadcrumbs items={[{ name: "Sitemap", path: "/sitemap/" }]} />
      <h1 className="mt-10 font-serif text-[2.5rem] font-medium sm:text-[3.25rem]">Sitemap</h1>
      <div className="mt-12 grid gap-12 md:grid-cols-2 lg:grid-cols-3">
        {tree.map((root) => {
          const ids = new Set([root.id, ...root.children.map((c) => c.id)]);
          const list = articles.filter((a) => a.categoryId && ids.has(a.categoryId));
          return (
            <section key={root.id}>
              <h2 className="border-b border-ink pb-2 font-serif text-[1.5rem]">
                <Link href={categoryPath(root)} className="hover:text-rose-dark">{root.name}</Link>
              </h2>
              {root.children.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[0.8125rem] text-muted">
                  {root.children.map((c) => (
                    <li key={c.id}>
                      <Link href={categoryPath({ slug: c.slug, parent: { slug: root.slug } })} className="hover:text-ink">{c.name}</Link>
                    </li>
                  ))}
                </ul>
              )}
              <ul className="mt-4 space-y-2 text-[0.9375rem]">
                {list.map((a) => (
                  <li key={a.id}>
                    <Link href={articlePath(a)} className="hover:text-rose-dark">{a.title}</Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
        <section>
          <h2 className="border-b border-ink pb-2 font-serif text-[1.5rem]">Gloss &amp; Thread</h2>
          <ul className="mt-4 space-y-2 text-[0.9375rem]">
            {[
              ["All Stories", "/blog/"],
              ["Popular Guides", "/blog/popular/"],
              ["About Us", "/about/"],
              ["Contact", "/contact/"],
              ["Editorial Policy", "/editorial-policy/"],
              ["Corrections Policy", "/corrections-policy/"],
              ["Privacy Policy", "/privacy-policy/"],
              ["Terms of Use", "/terms/"],
              ["Affiliate Disclosure", "/affiliate-disclosure/"],
              ["Advertising Disclosure", "/advertising-policy/"],
            ].map(([l, h]) => (
              <li key={h}>
                <Link href={h} className="hover:text-rose-dark">{l}</Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
