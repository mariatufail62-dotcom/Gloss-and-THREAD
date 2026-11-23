import Link from "next/link";
import { db } from "@/lib/db";
import { hasRole, requireUser } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format";
import { Card, Notice, PageHeader, StatusBadge } from "@/components/admin/ui";

export const metadata = { title: "Dashboard" };

type Props = { searchParams: Promise<{ denied?: string }> };

export default async function Dashboard({ searchParams }: Props) {
  const user = await requireUser();
  const { denied } = await searchParams;
  const now = new Date();
  const [published, drafts, scheduled, inReview, samplesLive, categories, activity, recent, unread, mediaNoAlt] = await Promise.all([
    db.article.count({ where: { OR: [{ status: "PUBLISHED" }, { status: "SCHEDULED", publishedAt: { lte: now } }] } }),
    db.article.count({ where: { status: "DRAFT" } }),
    db.article.count({ where: { status: "SCHEDULED", publishedAt: { gt: now } } }),
    db.article.count({ where: { status: "DRAFT", reviewStatus: { not: "APPROVED" } } }),
    db.article.count({ where: { isSample: true, status: { in: ["PUBLISHED", "SCHEDULED"] } } }),
    db.category.findMany({
      where: { parentId: null },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        _count: { select: { articles: { where: { status: "PUBLISHED" } } } },
        children: { select: { _count: { select: { articles: { where: { status: "PUBLISHED" } } } } } },
      },
    }),
    db.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 12, include: { user: { select: { name: true } } } }),
    db.article.findMany({
      where: hasRole(user, "EDITOR") ? {} : { createdById: user.id },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: { id: true, title: true, status: true, publishedAt: true, updatedAt: true },
    }),
    hasRole(user, "EDITOR") ? db.contactMessage.count({ where: { isRead: false } }) : 0,
    db.media.count({ where: { alt: "" } }),
  ]);

  const stats = [
    { label: "Published", value: published, href: "/admin/articles/?status=PUBLISHED" },
    { label: "Drafts", value: drafts, href: "/admin/articles/?status=DRAFT" },
    { label: "Scheduled", value: scheduled, href: "/admin/articles/?status=SCHEDULED" },
    { label: "Awaiting review", value: inReview, href: "/admin/articles/?review=pending" },
  ];

  return (
    <>
      <PageHeader
        title={`Hello, ${user.name.split(" ")[0]}`}
        description="Your editorial overview. Counts come straight from the database."
        actions={<Link href="/admin/articles/new/" className="btn-dark">New article</Link>}
      />
      <div className="space-y-4">
        {denied && <Notice tone="rose">You don&apos;t have permission to open that page.</Notice>}
        {samplesLive > 0 && (
          <Notice tone="amber">
            {samplesLive} sample article(s) are live. They are marked noindex and carry a visible notice — replace them with reviewed editorial content before launch.
          </Notice>
        )}
        {unread > 0 && (
          <Notice>
            {unread} unread reader message(s). <Link href="/admin/messages/" className="underline">Open inbox</Link>
          </Notice>
        )}
        {mediaNoAlt > 0 && (
          <Notice>
            {mediaNoAlt} image(s) in the media library have no alt text. <Link href="/admin/media/?filter=noalt" className="underline">Review them</Link>
          </Notice>
        )}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="bg-white p-5 hover:bg-paper-2">
            <p className="label text-muted">{s.label}</p>
            <p className="mt-3 font-serif text-[2.25rem] leading-none">{s.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card title="Recently edited" actions={<Link href="/admin/articles/" className="text-[0.75rem] underline">All articles</Link>}>
          {recent.length === 0 ? (
            <p className="text-[0.875rem] text-muted">No articles yet.</p>
          ) : (
            <ul className="-my-2 divide-y divide-line">
              {recent.map((a) => (
                <li key={a.id} className="flex items-center gap-3 py-2.5">
                  <Link href={`/admin/articles/${a.id}/`} className="min-w-0 flex-1 truncate text-[0.875rem] font-medium hover:underline">
                    {a.title}
                  </Link>
                  <StatusBadge status={a.status} publishedAt={a.publishedAt} />
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Published by category">
          <ul className="-my-2 divide-y divide-line text-[0.875rem]">
            {categories.map((c) => (
              <li key={c.id} className="flex justify-between py-2">
                <span>{c.name}</span>
                <span className="tabular-nums text-muted">{c._count.articles + c.children.reduce((s, ch) => s + ch._count.articles, 0)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="Recent activity" className="mt-6">
        {activity.length === 0 ? (
          <p className="text-[0.875rem] text-muted">No activity recorded yet.</p>
        ) : (
          <ul className="-my-2 divide-y divide-line text-[0.875rem]">
            {activity.map((a) => (
              <li key={a.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span>
                  <span className="font-medium">{a.user?.name ?? "System"}</span> · {a.summary}
                </span>
                <span className="text-[0.75rem] text-muted">{formatDateTime(a.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
