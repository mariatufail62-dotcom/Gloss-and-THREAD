import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { requireUser } from "@/lib/auth/session";
import { uploadMediaAction } from "@/app/admin/actions/media";
import { ActionForm, SubmitButton } from "@/components/admin/forms";
import { AdminPagination, Card, Notice, PageHeader } from "@/components/admin/ui";

export const metadata = { title: "Media library" };
const PER_PAGE = 48;

type Props = { searchParams: Promise<{ q?: string; page?: string; filter?: string; deleted?: string }> };

export default async function MediaLibrary({ searchParams }: Props) {
  await requireUser();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const q = (sp.q ?? "").trim().slice(0, 100);
  const where: Prisma.MediaWhereInput = {
    ...(sp.filter === "noalt" ? { alt: "" } : {}),
    ...(q
      ? { OR: [{ alt: { contains: q, mode: "insensitive" } }, { filename: { contains: q, mode: "insensitive" } }, { credit: { contains: q, mode: "insensitive" } }] }
      : {}),
  };
  const [items, total] = await Promise.all([
    db.media.findMany({ where, orderBy: { createdAt: "desc" }, take: PER_PAGE, skip: (page - 1) * PER_PAGE }),
    db.media.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <>
      <PageHeader title="Media library" description={`${total} image(s). Every image needs descriptive alt text, a credit and a known license.`} />
      {sp.deleted && <div className="mb-4"><Notice tone="green">Image deleted.</Notice></div>}
      <Card title="Upload images" className="mb-8">
        <ActionForm action={uploadMediaAction} resetOnSuccess className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <input type="file" name="files" multiple required accept="image/jpeg,image/png,image/webp,image/avif" className="block w-full text-[0.875rem]" />
            <p className="mt-1.5 text-[0.75rem] text-muted">Up to 12 at a time · JPEG, PNG, WebP, AVIF · max 10 MB · min 400×300. Converted to WebP; EXIF/GPS metadata removed.</p>
          </div>
          <input name="credit" placeholder="Credit for this batch (photographer / source)" className="field" maxLength={200} />
          <input name="license" placeholder="License (e.g. Owned, Licensed — Agency X)" className="field" maxLength={200} />
          <label className="flex items-start gap-2 text-[0.8125rem] md:col-span-2">
            <input type="checkbox" name="rights" required className="mt-0.5 accent-ink" />
            I confirm we own these images or are licensed to publish them. (Never upload images copied from other publications.)
          </label>
          <div className="md:col-span-2">
            <SubmitButton pendingLabel="Uploading…">Upload</SubmitButton>
          </div>
        </ActionForm>
      </Card>

      <form className="mb-5 flex flex-wrap gap-2" role="search">
        <input name="q" defaultValue={q} placeholder="Search alt text, filename, credit" className="field max-w-xs" aria-label="Search media" />
        <select name="filter" defaultValue={sp.filter ?? ""} className="field w-48" aria-label="Filter">
          <option value="">All images</option>
          <option value="noalt">Missing alt text</option>
        </select>
        <button className="btn-outline">Filter</button>
      </form>

      {items.length === 0 ? (
        <p className="border border-line bg-white px-5 py-12 text-center text-muted">No images found.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {items.map((m) => (
            <li key={m.id}>
              <Link href={`/admin/media/${m.id}/`} className="group block">
                <div className="relative aspect-square overflow-hidden border border-line bg-white">
                  <Image src={m.url} alt={m.alt} fill sizes="200px" className="object-cover transition-opacity group-hover:opacity-85" />
                  {m.isDemo && <span className="label absolute top-1.5 left-1.5 bg-white/90 px-1.5 py-1 text-[0.5625rem]">Demo</span>}
                </div>
                <p className={`mt-1.5 truncate text-[0.75rem] ${m.alt ? "text-muted" : "font-semibold text-rose-dark"}`}>{m.alt || "Missing alt text"}</p>
                <p className="text-[0.6875rem] text-muted">{m.width}×{m.height} · {Math.round(m.sizeBytes / 1024)} KB</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <AdminPagination
        page={page}
        totalPages={totalPages}
        hrefFor={(p) => {
          const u = new URLSearchParams();
          if (q) u.set("q", q);
          if (sp.filter) u.set("filter", sp.filter);
          if (p > 1) u.set("page", String(p));
          return `/admin/media/${u.size ? `?${u}` : ""}`;
        }}
      />
    </>
  );
}
