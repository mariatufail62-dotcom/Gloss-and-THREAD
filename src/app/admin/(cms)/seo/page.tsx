import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { parseBody } from "@/lib/blocks/schema";
import { auditArticleData } from "@/lib/admin/articles";
import { buildKnownPaths } from "@/lib/link-index";
import { Badge, PageHeader, StatusBadge, Table } from "@/components/admin/ui";

export const metadata = { title: "SEO checklist" };

type Props = { searchParams: Promise<{ show?: string }> };

export default async function SeoChecklist({ searchParams }: Props) {
  await requireUser("EDITOR");
  const { show } = await searchParams;
  const [articles, known] = await Promise.all([
    db.article.findMany({ where: { status: { not: "ARCHIVED" } }, orderBy: { updatedAt: "desc" }, take: 300 }),
    buildKnownPaths(),
  ]);
  const rows = await Promise.all(
    articles.map(async (a) => {
      const checks = await auditArticleData({ ...a, body: parseBody(a.body), reviewStatus: a.reviewStatus }, known);
      return { a, errors: checks.filter((c) => c.level === "error"), warnings: checks.filter((c) => c.level === "warning") };
    })
  );
  const visible = show === "all" ? rows : rows.filter((r) => r.errors.length || r.warnings.length);
  const totals = { errors: rows.reduce((s, r) => s + r.errors.length, 0), clean: rows.filter((r) => !r.errors.length && !r.warnings.length).length };

  return (
    <>
      <PageHeader
        title="SEO checklist"
        description="Editorial quality checks across articles: titles, descriptions, slugs, headings, images & alt text, authorship, internal links, canonical and review status. These are not ranking scores."
        actions={<Link href={show === "all" ? "/admin/seo/" : "/admin/seo/?show=all"} className="btn-outline">{show === "all" ? "Only with issues" : "Show all"}</Link>}
      />
      <p className="mb-5 text-[0.875rem] text-muted">{rows.length} articles checked · {totals.errors} blocking issue(s) · {totals.clean} fully clean</p>
      <Table head={["Article", "Status", "Blocking", "Advisory"]} empty="No issues found. 🎉">
        {visible.map(({ a, errors, warnings }) => (
          <tr key={a.id} className="align-top">
            <td className="max-w-sm px-4 py-3">
              <Link href={`/admin/articles/${a.id}/`} className="font-medium hover:underline">{a.title}</Link>
              {a.isSample && <span className="ml-2"><Badge tone="amber">Sample</Badge></span>}
            </td>
            <td className="px-4 py-3"><StatusBadge status={a.status} publishedAt={a.publishedAt} /></td>
            <td className="px-4 py-3 text-[0.8125rem]">
              {errors.length ? <ul className="space-y-1 text-rose-dark">{errors.map((c) => <li key={c.id}>{c.label}: {c.message}</li>)}</ul> : <span className="text-emerald-700">None</span>}
            </td>
            <td className="px-4 py-3 text-[0.8125rem] text-muted">
              {warnings.length ? <ul className="space-y-1">{warnings.map((c) => <li key={c.id}>{c.label}: {c.message}</li>)}</ul> : "—"}
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}
