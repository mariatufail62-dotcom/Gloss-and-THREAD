import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { deleteCategoryAction, saveCategoryAction } from "@/app/admin/actions/structure";
import { ActionForm, InlineAction, SubmitButton } from "@/components/admin/forms";
import { Card, Checkbox, Field, Notice, PageHeader } from "@/components/admin/ui";

export const metadata = { title: "Category" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> };

export default async function CategoryEdit({ params, searchParams }: Props) {
  await requireUser("EDITOR");
  const { id } = await params;
  const { created } = await searchParams;
  const isNew = id === "new";
  const c = isNew ? null : await db.category.findUnique({ where: { id }, include: { _count: { select: { articles: true, children: true } } } });
  if (!isNew && !c) notFound();
  const roots = await db.category.findMany({ where: { parentId: null, NOT: c ? { id: c.id } : undefined }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } });

  return (
    <>
      <PageHeader title={c ? c.name : "Add category"} back={{ href: "/admin/categories/", label: "Categories" }} />
      {created && <div className="mb-4"><Notice tone="green">Category created.</Notice></div>}
      <Card className="max-w-3xl">
        <ActionForm action={saveCategoryAction} className="grid gap-4 sm:grid-cols-2">
          {c && <input type="hidden" name="id" value={c.id} />}
          <Field label="Name" htmlFor="name"><input id="name" name="name" required defaultValue={c?.name} maxLength={80} className="field" /></Field>
          <Field label="URL slug" htmlFor="slug" hint={c ? "Changing it creates permanent redirects automatically." : "Defaults to the name."}>
            <input id="slug" name="slug" defaultValue={c?.slug} maxLength={60} className="field font-mono text-[0.8125rem]" />
          </Field>
          <Field label="Parent (pillar)" htmlFor="parentId">
            <select id="parentId" name="parentId" defaultValue={c?.parentId ?? ""} className="field" disabled={!!c?._count.children}>
              <option value="">None — this is a pillar</option>
              {roots.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </Field>
          <Field label="Menu label" htmlFor="navLabel" hint="Optional shorter label for the menu.">
            <input id="navLabel" name="navLabel" defaultValue={c?.navLabel ?? ""} maxLength={40} className="field" />
          </Field>
          <Field label="Short description (dek under the H1)" htmlFor="description" className="sm:col-span-2">
            <textarea id="description" name="description" defaultValue={c?.description ?? ""} rows={2} maxLength={300} className="field" />
          </Field>
          <Field label="Editorial introduction" htmlFor="intro" className="sm:col-span-2" hint="Original, useful framing for this section — what readers will find and how we approach it. Paragraphs separated by a blank line. Avoid keyword-stuffed boilerplate.">
            <textarea id="intro" name="intro" defaultValue={c?.intro ?? ""} rows={7} maxLength={5000} className="field" />
          </Field>
          <Field label="SEO title" htmlFor="seoTitle"><input id="seoTitle" name="seoTitle" defaultValue={c?.seoTitle ?? ""} maxLength={120} className="field" /></Field>
          <Field label="Meta description" htmlFor="metaDescription"><textarea id="metaDescription" name="metaDescription" defaultValue={c?.metaDescription ?? ""} rows={2} maxLength={320} className="field" /></Field>
          <Field label="Sort order" htmlFor="sortOrder" hint="Lower numbers appear first in menus."><input id="sortOrder" name="sortOrder" type="number" defaultValue={c?.sortOrder ?? 0} className="field" /></Field>
          <Field label="Articles needed before indexing" htmlFor="minArticlesToIndex" hint="Thin category pages stay noindex until they reach this many live articles.">
            <input id="minArticlesToIndex" name="minArticlesToIndex" type="number" min={1} max={50} defaultValue={c?.minArticlesToIndex ?? 3} className="field" />
          </Field>
          <div className="sm:col-span-2"><Checkbox name="showInNav" label="Show in navigation" defaultChecked={c?.showInNav ?? true} /></div>
          <div className="sm:col-span-2"><SubmitButton>{c ? "Save category" : "Create category"}</SubmitButton></div>
        </ActionForm>
        {c && (
          <div className="mt-6 border-t border-line pt-4 text-[0.8125rem] text-muted">
            {c._count.articles || c._count.children ? (
              <p>This category has {c._count.articles} article(s) and {c._count.children} subcategories, so it can&apos;t be deleted.</p>
            ) : (
              <InlineAction action={deleteCategoryAction} fields={{ id: c.id }} label="Delete category" variant="danger" confirm="Delete this category?" />
            )}
          </div>
        )}
      </Card>
    </>
  );
}
