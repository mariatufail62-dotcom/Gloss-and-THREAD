import Link from "next/link";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { hasRole, requireUser } from "@/lib/auth/session";
import { formatShortDate } from "@/lib/format";
import { AdminPagination, Badge, Notice, PageHeader, StatusBadge, Table } from "@/components/admin/ui";

export const metadata = { title: "Articles" };
const PER_PAGE = 30;

type Props = { searchParams: Promise<Record<string, string | undefined>> };

export default async function ArticlesList({ searchParams }: Props) {
  const user = await requireUser();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const q = (sp.q ?? "").trim().slice(0, 100);
  const status = ["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"].includes(sp.status ?? "") ? (sp.status as "DRAFT") : undefined;

  const where: Prisma.ArticleWhereInput = {
    ...(hasRole(user, "EDITOR") ? {} : { createdById: user.id }),
    ...(status ? { status } : {}),
    ...(sp.category ? { OR: [{ categoryId: sp.category }, { category: { parentId: sp.category } }] } : {}),
    ...(sp.review === "pending" ? { reviewStatus: { not: "APPROVED" }, status: "DRAFT" } : {}),
    ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { slug: { contains: q.toLowerCase() } }] } : {}),
  };

  const [items, total, roots] = await Promise.all([
    db.article.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: PER_PAGE,
      skip: (page - 1) * PER_PAGE,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        publishedAt: true,
        updatedAt: true,
        isSample: true,
        reviewStatus: true,
        category: { select: { name: true, parent: { select: { name: true } } } },
        author: { select: { name: true } },
      },
    }),
    db.article.count({ where }),
    db.category.findMany({ where: { parentId: null }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const qs = (p: number) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (v && k !== "page") u.set(k, v);
    if (p > 1) u.set("page", String(p));
    const s = u.toString();
    return `/admin/articles/${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <PageHeader
        title="Articles"
        description={`${total} article${total === 1 ? "" : "s"}${status ? ` · ${status.toLowerCase()}` : ""}`}
        actions={<Link href="/admin/articles/new/" className="btn-dark">New article</Link>}
      />
      {sp.deleted && <div className="mb-4"><Notice tone="green">Article deleted.</Notice></div>}
      <form className="mb-5 flex flex-wrap gap-2" role="search">
        <input name="q" defaultValue={q} placeholder="Search headline or slug" className="field max-w-xs" aria-label="Search articles" />
        <select name="status" defaultValue={status ?? ""} className="field w-40" aria-label="Status">
          <option value="">All statuses</option>
          <option value="DRAFT">Drafts</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <select name="category" defaultValue={sp.category ?? ""} className="field w-44" aria-label="Category">
          <option value="">All categories</option>
          {roots.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <button className="btn-outline">Filter</button>
        {(q || status || sp.category || sp.review) && <Link href="/admin/articles/" className="self-center text-[0.8125rem] underline">Clear</Link>}
      </form>
      <Table head={["Headline", "Category", "Author", "Status", "Date"]} empty="No articles match these filters.">
        {items.map((a) => (
          <tr key={a.id} className="hover:bg-paper-2/60">
            <td className="max-w-md px-4 py-3">
              <Link href={`/admin/articles/${a.id}/`} className="font-medium hover:underline">{a.title}</Link>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {a.isSample && <Badge tone="amber">Sample</Badge>}
                {a.reviewStatus === "APPROVED" ? <Badge tone="green">Reviewed</Badge> : a.reviewStatus === "CHANGES_REQUESTED" ? <Badge tone="rose">Changes requested</Badge> : null}
              </div>
            </td>
            <td className="px-4 py-3 text-muted">{a.category ? (a.category.parent ? `${a.category.parent.name} › ${a.category.name}` : a.category.name) : "—"}</td>
            <td className="px-4 py-3 text-muted">{a.author?.name ?? "—"}</td>
            <td className="px-4 py-3"><StatusBadge status={a.status} publishedAt={a.publishedAt} /></td>
            <td className="px-4 py-3 whitespace-nowrap text-muted">
              {a.publishedAt ? formatShortDate(a.publishedAt) : `Edited ${formatShortDate(a.updatedAt)}`}
            </td>
          </tr>
        ))}
      </Table>
      <AdminPagination page={page} totalPages={totalPages} hrefFor={qs} />
    </>
  );
}
