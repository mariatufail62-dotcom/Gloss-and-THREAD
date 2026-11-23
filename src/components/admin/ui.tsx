import Link from "next/link";

/** Server-safe building blocks for the CMS. Calm, dense, editorial. */

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
      <div className="min-w-0">
        {back && (
          <Link href={back.href} className="label text-muted hover:text-ink">
            ← {back.label}
          </Link>
        )}
        <h1 className={`font-serif text-[1.875rem] leading-tight font-medium ${back ? "mt-3" : ""}`}>{title}</h1>
        {description && <div className="mt-2 max-w-2xl text-[0.9375rem] text-muted">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Card({ title, children, className = "", actions }: { title?: string; children: React.ReactNode; className?: string; actions?: React.ReactNode }) {
  return (
    <section className={`border border-line bg-white ${className}`}>
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <h2 className="label">{title}</h2>
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className = "",
}: {
  label: string;
  htmlFor?: string;
  hint?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[0.8125rem] font-semibold">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-[0.75rem] leading-relaxed text-muted">{hint}</p>}
      {error && (
        <p className="mt-1.5 text-[0.75rem] font-medium text-rose-dark" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function Checkbox({ name, label, defaultChecked, hint, disabled }: { name: string; label: string; defaultChecked?: boolean; hint?: string; disabled?: boolean }) {
  return (
    <label className="flex items-start gap-2.5 text-[0.875rem]">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} disabled={disabled} className="mt-0.5 h-4 w-4 accent-ink" />
      <span>
        {label}
        {hint && <span className="block text-[0.75rem] text-muted">{hint}</span>}
      </span>
    </label>
  );
}

const badgeTone = {
  neutral: "border-line bg-paper-2 text-ink",
  green: "border-emerald-200 bg-emerald-50 text-emerald-800",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  rose: "border-rose/30 bg-rose-wash text-rose-dark",
  blue: "border-sky-200 bg-sky-50 text-sky-800",
} as const;

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof badgeTone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center border px-2 py-0.5 text-[0.6875rem] font-semibold tracking-wide uppercase ${badgeTone[tone]}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ status, publishedAt }: { status: string; publishedAt?: Date | null }) {
  if (status === "PUBLISHED") return <Badge tone="green">Published</Badge>;
  if (status === "SCHEDULED")
    return <Badge tone={publishedAt && publishedAt <= new Date() ? "green" : "blue"}>{publishedAt && publishedAt <= new Date() ? "Live (scheduled)" : "Scheduled"}</Badge>;
  if (status === "ARCHIVED") return <Badge>Archived</Badge>;
  return <Badge tone="amber">Draft</Badge>;
}

export function Table({ head, children, empty }: { head: React.ReactNode[]; children: React.ReactNode; empty?: React.ReactNode }) {
  const hasRows = Array.isArray(children) ? children.length > 0 : !!children;
  return (
    <div className="overflow-x-auto border border-line bg-white">
      <table className="w-full min-w-[640px] border-collapse text-left text-[0.875rem]">
        <thead>
          <tr className="border-b border-line bg-paper-2">
            {head.map((h, i) => (
              <th key={i} scope="col" className="px-4 py-3 text-[0.6875rem] font-semibold tracking-[0.08em] text-muted uppercase">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {hasRows ? (
            children
          ) : (
            <tr>
              <td colSpan={head.length} className="px-4 py-10 text-center text-muted">
                {empty ?? "Nothing here yet."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Notice({ tone = "neutral", children }: { tone?: "neutral" | "amber" | "rose" | "green"; children: React.ReactNode }) {
  const cls =
    tone === "amber"
      ? "border-amber-300 bg-amber-50 text-amber-900"
      : tone === "rose"
        ? "border-rose/40 bg-rose-wash text-rose-dark"
        : tone === "green"
          ? "border-emerald-300 bg-emerald-50 text-emerald-900"
          : "border-line bg-paper-2 text-ink";
  return <div className={`border px-4 py-3 text-[0.875rem] leading-relaxed ${cls}`}>{children}</div>;
}

export function AdminPagination({ page, totalPages, hrefFor }: { page: number; totalPages: number; hrefFor: (p: number) => string }) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-6 flex items-center justify-between text-[0.875rem]">
      {page > 1 ? <Link className="btn-outline" href={hrefFor(page - 1)}>← Previous</Link> : <span />}
      <span className="text-muted">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? <Link className="btn-outline" href={hrefFor(page + 1)}>Next →</Link> : <span />}
    </nav>
  );
}
