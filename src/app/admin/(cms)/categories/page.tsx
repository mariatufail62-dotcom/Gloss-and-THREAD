import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { Badge, Notice, PageHeader, Table } from "@/components/admin/ui";

export const metadata = { title: "Categories & navigation" };

type Props = { searchParams: Promise<{ deleted?: string }> };

export default async function Categories({ searchParams }: Props) {
  await requireUser("EDITOR");
  const { deleted } = await searchParams;
  const cats = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { articles: { where: { status: { in: ["PUBLISHED", "SCHEDULED"] }, robotsIndex: true, isSample: false } } } } },
  });
  const roots = cats.filter((c) => !c.parentId);
  const rows = roots.flatMap((r) => [{ c: r, depth: 0 }, ...cats.filter((c) => c.parentId === r.id).map((c) => ({ c, depth: 1 }))]);

  return (
    <>
      <PageHeader
        title="Categories & navigation"
        description="Pillar categories form the main menu; subcategories form its dropdowns. Sort order and “Show in nav” control the menu. A category page becomes indexable once it has enough published articles."
        actions={<Link href="/admin/categories/new/" className="btn-dark">Add category</Link>}
      />
      {deleted && <div className="mb-4"><Notice tone="green">Category deleted.</Notice></div>}
      <Table head={["Name", "URL", "Order", "Nav", "Indexable articles", "Category indexed"]}>
        {rows.map(({ c, depth }) => {
          const parent = c.parentId ? cats.find((x) => x.id === c.parentId) : null;
          const count = depth === 0 ? c._count.articles + cats.filter((x) => x.parentId === c.id).reduce((s, x) => s + x._count.articles, 0) : c._count.articles;
          return (
            <tr key={c.id}>
              <td className={`px-4 py-2.5 ${depth ? "pl-10 text-[0.8125rem]" : "font-medium"}`}>
                <Link href={`/admin/categories/${c.id}/`} className="hover:underline">{depth ? "↳ " : ""}{c.name}</Link>
              </td>
              <td className="px-4 py-2.5 font-mono text-[0.75rem] text-muted">/{parent ? `${parent.slug}/` : ""}{c.slug}/</td>
              <td className="px-4 py-2.5 text-muted">{c.sortOrder}</td>
              <td className="px-4 py-2.5">{c.showInNav ? <Badge tone="green">Shown</Badge> : <Badge>Hidden</Badge>}</td>
              <td className="px-4 py-2.5 tabular-nums">{count}</td>
              <td className="px-4 py-2.5">{count >= c.minArticlesToIndex ? <Badge tone="green">Yes</Badge> : <Badge tone="amber">Needs {c.minArticlesToIndex - count} more</Badge>}</td>
            </tr>
          );
        })}
      </Table>
    </>
  );
}
