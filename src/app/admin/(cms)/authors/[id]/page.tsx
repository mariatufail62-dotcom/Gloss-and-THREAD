import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { deleteAuthorAction, saveAuthorAction } from "@/app/admin/actions/structure";
import { formatLabeledLinks } from "@/lib/admin/forms";
import { pickerMedia } from "@/lib/admin/media-options";
import { ActionForm, InlineAction, SubmitButton } from "@/components/admin/forms";
import { Card, Checkbox, Field, Notice, PageHeader } from "@/components/admin/ui";
import { StandaloneMediaField } from "@/components/admin/editor/MediaPicker";

export const metadata = { title: "Author" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> };

export default async function AuthorEdit({ params, searchParams }: Props) {
  await requireUser("EDITOR");
  const { id } = await params;
  const { created } = await searchParams;
  const isNew = id === "new";
  const a = isNew ? null : await db.author.findUnique({ where: { id }, include: { _count: { select: { articles: true } } } });
  if (!isNew && !a) notFound();
  const media = await pickerMedia(a?.avatarId);

  return (
    <>
      <PageHeader title={a ? a.name : "Add author"} back={{ href: "/admin/authors/", label: "Authors" }} />
      {created && <div className="mb-4"><Notice tone="green">Author created.</Notice></div>}
      <Card className="max-w-3xl">
        <ActionForm action={saveAuthorAction} className="grid gap-4 sm:grid-cols-2">
          {a && <input type="hidden" name="id" value={a.id} />}
          <Field label="Name" htmlFor="name"><input id="name" name="name" required defaultValue={a?.name} maxLength={120} className="field" /></Field>
          <Field label="Profile slug" htmlFor="slug"><input id="slug" name="slug" defaultValue={a?.slug} maxLength={80} className="field font-mono text-[0.8125rem]" /></Field>
          <Field label="Byline type" htmlFor="kind">
            <select id="kind" name="kind" defaultValue={a?.kind ?? "PERSON"} className="field">
              <option value="PERSON">Person</option>
              <option value="ORGANIZATION">Editorial desk / organization</option>
            </select>
          </Field>
          <Field label="Role / job title" htmlFor="jobTitle"><input id="jobTitle" name="jobTitle" defaultValue={a?.jobTitle ?? ""} maxLength={120} className="field" placeholder="e.g. Contributing Editor" /></Field>
          <Field label="Short bio" htmlFor="shortBio" className="sm:col-span-2" hint="One or two sentences shown under articles.">
            <textarea id="shortBio" name="shortBio" defaultValue={a?.shortBio ?? ""} rows={2} maxLength={300} className="field" />
          </Field>
          <Field label="Full biography" htmlFor="bio" className="sm:col-span-2">
            <textarea id="bio" name="bio" defaultValue={a?.bio ?? ""} rows={6} maxLength={5000} className="field" />
          </Field>
          <Field label="Editorial experience" htmlFor="experience" className="sm:col-span-2" hint="Only real, verifiable experience supplied by the author. Leave empty if none provided.">
            <textarea id="experience" name="experience" defaultValue={a?.experience ?? ""} rows={3} maxLength={3000} className="field" />
          </Field>
          <Field label="Social profiles" htmlFor="socialLinks" className="sm:col-span-2" hint="Verified profiles only, one per line: Label | https://url">
            <textarea id="socialLinks" name="socialLinks" defaultValue={formatLabeledLinks(a?.socialLinks)} rows={3} className="field font-mono text-[0.8125rem]" />
          </Field>
          <Field label="Photo" className="sm:col-span-2" hint="Only with the person's permission.">
            <div className="max-w-56"><StandaloneMediaField name="avatarId" media={media} value={a?.avatarId ?? null} /></div>
          </Field>
          <div className="sm:col-span-2"><Checkbox name="isActive" label="Active (profile page is public)" defaultChecked={a?.isActive ?? true} /></div>
          <div className="sm:col-span-2"><SubmitButton>{a ? "Save author" : "Create author"}</SubmitButton></div>
        </ActionForm>
        {a && (
          <div className="mt-6 border-t border-line pt-4 text-[0.8125rem] text-muted">
            {a._count.articles ? (
              <p>Attributed on {a._count.articles} article(s); mark inactive instead of deleting.</p>
            ) : (
              <InlineAction action={deleteAuthorAction} fields={{ id: a.id }} label="Delete author" variant="danger" confirm="Delete this author?" />
            )}
          </div>
        )}
      </Card>
    </>
  );
}
