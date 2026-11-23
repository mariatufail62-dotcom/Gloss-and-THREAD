import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { hasRole, requireUser } from "@/lib/auth/session";
import { deleteMediaAction, updateMediaAction } from "@/app/admin/actions/media";
import { mediaUsage } from "@/lib/admin/media-usage";
import { formatDateTime } from "@/lib/format";
import { ActionForm, InlineAction, SubmitButton } from "@/components/admin/forms";
import { Card, Field, Notice, PageHeader } from "@/components/admin/ui";

export const metadata = { title: "Image details" };

type Props = { params: Promise<{ id: string }> };

export default async function MediaDetail({ params }: Props) {
  const user = await requireUser();
  const { id } = await params;
  const m = await db.media.findUnique({ where: { id }, include: { uploadedBy: { select: { name: true } } } });
  if (!m) notFound();
  const usage = await mediaUsage(m.id);
  const usedCount = usage.featured.length + usage.inBody.length + usage.avatars.length + usage.products.length;

  return (
    <>
      <PageHeader title={m.filename} back={{ href: "/admin/media/", label: "Media library" }} />
      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <div className="border border-line bg-white p-3">
            <Image src={m.url} alt={m.alt} width={m.width} height={m.height} sizes="(min-width: 1024px) 50vw, 100vw" className="h-auto w-full" />
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-[0.8125rem]">
            <dt className="text-muted">Dimensions</dt><dd>{m.width} × {m.height}</dd>
            <dt className="text-muted">File size</dt><dd>{Math.round(m.sizeBytes / 1024)} KB · {m.mimeType}</dd>
            <dt className="text-muted">Original name</dt><dd className="truncate">{m.originalName ?? "—"}</dd>
            <dt className="text-muted">Uploaded</dt><dd>{formatDateTime(m.createdAt)}{m.uploadedBy ? ` by ${m.uploadedBy.name}` : ""}</dd>
            <dt className="text-muted">URL</dt><dd className="truncate font-mono text-[0.75rem]">{m.url}</dd>
          </dl>
        </div>
        <div className="space-y-6">
          {m.isDemo && <Notice tone="amber">Original demo illustration bundled with the project. Replace it with licensed photography before launch.</Notice>}
          <Card title="Details">
            <ActionForm action={updateMediaAction} className="space-y-4">
              <input type="hidden" name="id" value={m.id} />
              <Field label="Alt text" htmlFor="alt" hint="Describe what the image shows for readers who can't see it. Leave empty only for purely decorative images.">
                <textarea id="alt" name="alt" defaultValue={m.alt} rows={2} maxLength={300} className="field" />
              </Field>
              <Field label="Default caption" htmlFor="caption">
                <input id="caption" name="caption" defaultValue={m.caption ?? ""} maxLength={400} className="field" />
              </Field>
              <Field label="Credit" htmlFor="credit" hint="Shown with the image, e.g. “Photo: Jane Doe for Gloss & Thread”.">
                <input id="credit" name="credit" defaultValue={m.credit ?? ""} maxLength={200} className="field" />
              </Field>
              <Field label="Credit link" htmlFor="creditUrl">
                <input id="creditUrl" name="creditUrl" defaultValue={m.creditUrl ?? ""} maxLength={500} className="field" placeholder="https://" />
              </Field>
              <Field label="License" htmlFor="license" hint="Record the basis on which we may publish this image.">
                <input id="license" name="license" defaultValue={m.license ?? ""} maxLength={200} className="field" />
              </Field>
              <SubmitButton>Save details</SubmitButton>
            </ActionForm>
          </Card>
          <Card title={`Used in ${usedCount} place(s)`}>
            {usedCount === 0 ? (
              <p className="text-[0.875rem] text-muted">Not used anywhere.</p>
            ) : (
              <ul className="space-y-1.5 text-[0.875rem]">
                {usage.featured.map((a) => <li key={`f${a.id}`}>Featured image · <Link className="underline" href={`/admin/articles/${a.id}/`}>{a.title}</Link></li>)}
                {usage.inBody.map((a) => <li key={`b${a.id}`}>Article body · <Link className="underline" href={`/admin/articles/${a.id}/`}>{a.title}</Link></li>)}
                {usage.avatars.map((a) => <li key={`a${a.id}`}>Author photo · <Link className="underline" href={`/admin/authors/${a.id}/`}>{a.name}</Link></li>)}
                {usage.products.map((p) => <li key={`p${p.id}`}>Product · <Link className="underline" href={`/admin/products/${p.id}/`}>{p.name}</Link></li>)}
              </ul>
            )}
            {hasRole(user, "EDITOR") && (
              <div className="mt-5 border-t border-line pt-4">
                {usedCount > 0 ? (
                  <p className="text-[0.75rem] text-muted">Deletion is disabled while the image is in use.</p>
                ) : (
                  <InlineAction action={deleteMediaAction} fields={{ id: m.id }} label="Delete image" variant="danger" confirm="Delete this image permanently?" />
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
