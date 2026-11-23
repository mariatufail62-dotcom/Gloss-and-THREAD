import Link from "next/link";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";

export function JsonLd({ data }: { data: object | object[] }) {
  // JSON.stringify output is escaped for "<" so it can never close the script tag.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

export function SectionHeader({
  title,
  href,
  linkLabel = "View all",
  kicker,
  id,
  as: Tag = "h2",
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  kicker?: string;
  id?: string;
  as?: "h1" | "h2";
}) {
  return (
    <div className="section-rule flex items-end justify-between gap-6 pt-4 pb-6 sm:pb-8">
      <div>
        {kicker && <p className="label mb-2.5 text-muted">{kicker}</p>}
        <Tag id={id} className="font-serif text-[1.75rem] leading-none font-medium sm:text-[2.25rem]">
          {title}
        </Tag>
      </div>
      {href && (
        <Link href={href} className="nav-link shrink-0 border-b border-ink pb-1 hover:border-rose hover:text-rose-dark">
          {linkLabel}
          <span className="sr-only"> — {title}</span>
        </Link>
      )}
    </div>
  );
}

export interface Crumb {
  name: string;
  path: string;
}

/** Visible breadcrumb trail plus matching BreadcrumbList JSON-LD. */
export function Breadcrumbs({ items, className = "" }: { items: Crumb[]; className?: string }) {
  const all = [{ name: "Home", path: "/" }, ...items];
  return (
    <>
      <nav aria-label="Breadcrumb" className={className}>
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.75rem] tracking-[0.04em] text-muted">
          {all.map((c, i) => (
            <li key={c.path} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden className="text-line">/</span>}
              {i === all.length - 1 ? (
                <span aria-current="page" className="text-ink">{c.name}</span>
              ) : (
                <Link href={c.path} className="hover:text-ink">{c.name}</Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd data={breadcrumbJsonLd(all)} />
    </>
  );
}

/** Crawlable numbered pagination using real URLs. */
export function Pagination({
  page,
  totalPages,
  hrefFor,
  label = "Pagination",
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
  label?: string;
}) {
  if (totalPages <= 1) return null;
  const pages: (number | "gap")[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) pages.push(p);
    else if (pages[pages.length - 1] !== "gap") pages.push("gap");
  }
  const cell = "flex h-11 min-w-11 items-center justify-center px-3 text-[0.875rem]";
  return (
    <nav aria-label={label} className="mt-14 flex items-center justify-center gap-1 border-t border-line pt-8">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} rel="prev" className={`${cell} nav-link hover:text-rose-dark`}>
          ← Prev
        </Link>
      ) : (
        <span className={`${cell} nav-link text-line`} aria-hidden>← Prev</span>
      )}
      <ol className="flex items-center gap-1">
        {pages.map((p, i) =>
          p === "gap" ? (
            <li key={`g${i}`} className={`${cell} text-muted`} aria-hidden>…</li>
          ) : (
            <li key={p}>
              {p === page ? (
                <span aria-current="page" className={`${cell} bg-ink text-white`}>{p}</span>
              ) : (
                <Link href={hrefFor(p)} className={`${cell} hover:bg-paper-2`}>
                  <span className="sr-only">Page </span>{p}
                </Link>
              )}
            </li>
          )
        )}
      </ol>
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} rel="next" className={`${cell} nav-link hover:text-rose-dark`}>
          Next →
        </Link>
      ) : (
        <span className={`${cell} nav-link text-line`} aria-hidden>Next →</span>
      )}
    </nav>
  );
}

export function SampleNotice({ className = "" }: { className?: string }) {
  return (
    <p className={`border-l-2 border-rose bg-rose-wash/60 px-4 py-3 text-[0.8125rem] leading-relaxed text-ink ${className}`}>
      <strong className="font-semibold">Sample article.</strong> This piece demonstrates the Gloss &amp; Thread publishing system and
      uses original demo illustrations. It must be reviewed by an editor before launch.
    </p>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="border border-line bg-paper-2 px-6 py-14 text-center">
      <p className="font-serif text-2xl">{title}</p>
      {children && <div className="mx-auto mt-3 max-w-md text-[0.9375rem] leading-relaxed text-muted">{children}</div>}
    </div>
  );
}
