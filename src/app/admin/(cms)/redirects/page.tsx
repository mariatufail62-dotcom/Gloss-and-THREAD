import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { deleteRedirectAction, saveRedirectAction } from "@/app/admin/actions/structure";
import { formatShortDate } from "@/lib/format";
import { ActionForm, InlineAction, SubmitButton } from "@/components/admin/forms";
import { AdminPagination, Badge, Card, Checkbox, Field, PageHeader, Table } from "@/components/admin/ui";

export const metadata = { title: "Redirects" };
const PER_PAGE = 50;

type Props = { searchParams: Promise<{ q?: string; page?: string }> };

export default async function Redirects({ searchParams }: Props) {
  await requireUser("EDITOR");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const q = (sp.q ?? "").trim().slice(0, 200);
  const where = q ? { OR: [{ fromPath: { contains: q } }, { toPath: { contains: q } }] } : {};
  const [rows, total] = await Promise.all([
    db.redirect.findMany({ where, orderBy: { createdAt: "desc" }, take: PER_PAGE, skip: (page - 1) * PER_PAGE }),
    db.redirect.count({ where }),
  ]);
  return (
    <>
      <PageHeader title="Redirects" description="Redirects apply only to URLs that no longer resolve. Article and category URL changes add permanent (308) redirects automatically." />
      <Card title="Add redirect" className="mb-8">
        <ActionForm action={saveRedirectAction} resetOnSuccess className="grid gap-4 sm:grid-cols-2">
          <Field label="From path" htmlFor="fromPath"><input id="fromPath" name="fromPath" required placeholder="/old-path/" className="field font-mono text-[0.8125rem]" /></Field>
          <Field label="To path or URL" htmlFor="toPath"><input id="toPath" name="toPath" required placeholder="/new-path/" className="field font-mono text-[0.8125rem]" /></Field>
          <Field label="Note" htmlFor="note" className="sm:col-span-2"><input id="note" name="note" maxLength={200} className="field" /></Field>
          <div className="sm:col-span-2"><Checkbox name="temporary" label="Temporary (307) — use only when the old URL will return" /></div>
          <div className="sm:col-span-2"><SubmitButton>Save redirect</SubmitButton></div>
        </ActionForm>
      </Card>
      <form className="mb-4 flex gap-2" role="search">
        <input name="q" defaultValue={q} placeholder="Filter paths" className="field max-w-xs" aria-label="Filter redirects" />
        <button className="btn-outline">Filter</button>
      </form>
      <Table head={["From", "To", "Type", "Hits", "Added", ""]} empty="No redirects.">
        {rows.map((r) => (
          <tr key={r.id}>
            <td className="px-4 py-2.5 font-mono text-[0.75rem]">{r.fromPath}</td>
            <td className="px-4 py-2.5 font-mono text-[0.75rem]">{r.toPath}{r.note && <span className="block font-sans text-[0.6875rem] text-muted">{r.note}</span>}</td>
            <td className="px-4 py-2.5">{r.permanent ? <Badge>Permanent</Badge> : <Badge tone="amber">Temporary</Badge>}</td>
            <td className="px-4 py-2.5 tabular-nums">{r.hits}</td>
            <td className="px-4 py-2.5 text-muted">{formatShortDate(r.createdAt)}</td>
            <td className="px-4 py-2.5 text-right"><InlineAction action={deleteRedirectAction} fields={{ id: r.id }} label="Remove" confirm="Remove this redirect?" /></td>
          </tr>
        ))}
      </Table>
      <AdminPagination page={page} totalPages={Math.max(1, Math.ceil(total / PER_PAGE))} hrefFor={(p) => `/admin/redirects/?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) })}`} />
    </>
  );
}
