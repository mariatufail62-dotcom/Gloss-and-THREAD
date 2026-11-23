import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { categoryIds, getCategoryTree, publishedWhere } from "@/lib/queries/public";
import { articlePath, categoryPath } from "@/lib/urls";

export interface NavLink {
  label: string;
  href: string;
}

export interface NavItem extends NavLink {
  children: NavLink[];
  latest: NavLink[];
}

/** Primary navigation: Home | categories (CMS-ordered) | Blog. */
export const getNavigation = cache(async (): Promise<NavItem[]> => {
  let tree: Awaited<ReturnType<typeof getCategoryTree>> = [];
  try {
    tree = await getCategoryTree();
  } catch (err) {
    console.error("[nav] failed to load categories", err);
  }
  const roots = tree.filter((c) => c.showInNav);

  const latest = await Promise.all(
    roots.map((r) =>
      db.article
        .findMany({
          where: { ...publishedWhere(), categoryId: { in: categoryIds(r) } },
          orderBy: { publishedAt: "desc" },
          take: 3,
          select: { slug: true, title: true, category: { select: { slug: true, parent: { select: { slug: true } } } } },
        })
        .catch(() => [])
    )
  );

  const items: NavItem[] = roots.map((r, i) => ({
    label: r.navLabel || r.name,
    href: categoryPath(r),
    children: r.children
      .filter((c) => c.showInNav)
      .map((c) => ({ label: c.navLabel || c.name, href: categoryPath({ slug: c.slug, parent: { slug: r.slug } }) })),
    latest: latest[i].map((a) => ({ label: a.title, href: articlePath(a) })),
  }));

  return [
    { label: "Home", href: "/", children: [], latest: [] },
    ...items,
    {
      label: "Blog",
      href: "/blog/",
      children: [
        { label: "All Articles", href: "/blog/" },
        { label: "Latest Stories", href: "/blog/#latest" },
        { label: "Popular Guides", href: "/blog/popular/" },
      ],
      latest: [],
    },
  ];
});
