import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { deleteMessageAction, markMessageAction } from "@/app/admin/actions/structure";
import { formatDateTime } from "@/lib/format";
import { InlineAction } from "@/components/admin/forms";
import { AdminPagination, Badge, PageHeader } from "@/components/admin/ui";

export const metadata = { title: "Messages" };
const PER_PAGE = 25;
const TOPICS = ["GENERAL", "CORRECTION", "EDITORIAL", "ADVERTISING", "PRIVACY"] as const;

type Props = { searchParams: Promise<{ topic?: string; page?: string; unread?: string }> };

export default async function Messages({ searchParams }: Props) {
  await requireUser("EDITOR");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const topic = TOPICS.find((t) => t === sp.topic);
  const where = { ...(topic ? { topic } : {}), ...(sp.unread ? { isRead: false } : {}) };
  const [rows, total] = await Promise.all([
    db.contactMessage.findMany({ where, orderBy: { createdAt: "desc" }, take: PER_PAGE, skip: (page - 1) * PER_PAGE }),
    db.contactMessage.count({ where }),
  ]);
  return (
    <>
      <PageHeader title="Messages" description="Reader messages from the contact form, including correction requests. Respond from your own email client." />
      <form className="mb-5 flex flex-wrap gap-2">
        <select name="topic" defaultValue={topic ?? ""} className="field w-48" aria-label="Topic">
          <option value="">All topics</option>
          {TOPICS.map((t) => <option key={t} value={t}>{t.toLowerCase()}</option>)}
        </select>
        <label className="flex items-center gap-2 text-[0.875rem]"><input type="checkbox" name="unread" value="1" defaultChecked={!!sp.unread} className="accent-ink" /> Unread only</label>
        <button className="btn-outline">Filter</button>
      </form>
      {rows.length === 0 ? (
        <p className="border border-line bg-white px-5 py-12 text-center text-muted">No messages.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((m) => (
            <li key={m.id} className={`border bg-white p-5 ${m.isRead ? "border-line" : "border-ink"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {m.subject || "(no subject)"} {!m.isRead && <Badge tone="rose">New</Badge>} <Badge tone={m.topic === "CORRECTION" ? "amber" : "neutral"}>{m.topic.toLowerCase()}</Badge>
                  </p>
                  <p className="mt-1 text-[0.8125rem] text-muted">
                    {m.name} · <a href={`mailto:${m.email}`} className="underline">{m.email}</a> · {formatDateTime(m.createdAt)}
                  </p>
                  {m.pageUrl && <p className="mt-1 text-[0.75rem] text-muted">About: <span className="font-mono">{m.pageUrl}</span></p>}
                </div>
                <div className="flex gap-4">
                  <InlineAction action={markMessageAction} fields={{ id: m.id, read: m.isRead ? "0" : "1" }} label={m.isRead ? "Mark unread" : "Mark read"} />
                  <InlineAction action={deleteMessageAction} fields={{ id: m.id }} label="Delete" confirm="Delete this message?" />
                </div>
              </div>
              <p className="mt-4 text-[0.9375rem] leading-relaxed whitespace-pre-line">{m.message}</p>
            </li>
          ))}
        </ul>
      )}
      <AdminPagination page={page} totalPages={Math.max(1, Math.ceil(total / PER_PAGE))} hrefFor={(p) => `/admin/messages/?${new URLSearchParams({ ...(topic ? { topic } : {}), ...(sp.unread ? { unread: "1" } : {}), page: String(p) })}`} />
    </>
  );
}
