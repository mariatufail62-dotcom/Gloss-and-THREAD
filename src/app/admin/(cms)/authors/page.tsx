import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { Badge, Notice, PageHeader, Table } from "@/components/admin/ui";

export const metadata = { title: "Authors" };

type Props = { searchParams: Promise<{ deleted?: string }> };

export default async function Authors({ searchParams }: Props) {
  await requireUser("EDITOR");
  const { deleted } = await searchParams;
  const authors = await db.author.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { articles: { where: { status: "PUBLISHED" } } } }, user: { select: { email: true } } },
  });
  return (
    <>
      <PageHeader
        title="Authors"
        description="Bylines must be real people (with their permission and accurate experience) or the editorial desk. Never invent writers or credentials."
        actions={<Link href="/admin/authors/new/" className="btn-dark">Add author</Link>}
      />
      {deleted && <div className="mb-4"><Notice tone="green">Author deleted.</Notice></div>}
      <Table head={["Name", "Type", "Profile URL", "Published", "Linked user", "Status"]}>
        {authors.map((a) => (
          <tr key={a.id}>
            <td className="px-4 py-3 font-medium"><Link href={`/admin/authors/${a.id}/`} className="hover:underline">{a.name}</Link></td>
            <td className="px-4 py-3 text-muted">{a.kind === "ORGANIZATION" ? "Editorial desk" : "Person"}</td>
            <td className="px-4 py-3 font-mono text-[0.75rem] text-muted">/authors/{a.slug}/</td>
            <td className="px-4 py-3 tabular-nums">{a._count.articles}</td>
            <td className="px-4 py-3 text-muted">{a.user?.email ?? "—"}</td>
            <td className="px-4 py-3">{a.isActive ? <Badge tone="green">Active</Badge> : <Badge>Inactive</Badge>}</td>
          </tr>
        ))}
      </Table>
    </>
  );
}
