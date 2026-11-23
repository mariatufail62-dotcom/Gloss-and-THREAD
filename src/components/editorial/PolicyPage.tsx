import { Breadcrumbs } from "./Common";

export function PolicyPage({
  title,
  path,
  intro,
  updated,
  children,
}: {
  title: string;
  path: string;
  intro?: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="page-x pt-6 sm:pt-10">
      <Breadcrumbs items={[{ name: title, path }]} />
      <div className="mx-auto max-w-(--container-read)">
        <header className="mt-10 border-b border-line pb-8">
          <h1 className="font-serif text-[2.5rem] leading-[1.05] font-medium sm:text-[3.25rem]">{title}</h1>
          {intro && <p className="mt-5 text-[1.125rem] leading-relaxed text-muted">{intro}</p>}
          {updated && <p className="meta mt-4">Last updated: {updated}</p>}
        </header>
        <div className="article-body mt-10">{children}</div>
      </div>
    </div>
  );
}

/** Clearly marked placeholder for business details only the owner can supply. */
export function OwnerPlaceholder({ children }: { children: React.ReactNode }) {
  return (
    <mark className="border border-dashed border-rose bg-rose-wash px-1.5 py-0.5 text-[0.9em] text-rose-dark">
      [Owner to supply: {children}]
    </mark>
  );
}
