import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { createArticleAction } from "@/app/admin/actions/articles";
import { ActionForm, SubmitButton } from "@/components/admin/forms";
import { Card, Field, PageHeader } from "@/components/admin/ui";

export const metadata = { title: "New article" };

export default async function NewArticle() {
  const user = await requireUser();
  const [cats, authors] = await Promise.all([
    db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true, parentId: true } }),
    db.author.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const roots = cats.filter((c) => !c.parentId);
  return (
    <>
      <PageHeader title="New article" back={{ href: "/admin/articles/", label: "Articles" }} description="Start with a working headline. You can change everything in the editor." />
      <Card className="max-w-2xl">
        <ActionForm action={createArticleAction} className="space-y-5">
          <Field label="Working headline" htmlFor="title">
            <input id="title" name="title" required maxLength={200} className="field" autoFocus />
          </Field>
          <Field label="Category" htmlFor="categoryId">
            <select id="categoryId" name="categoryId" className="field">
              <option value="">Choose later</option>
              {roots.map((r) => [
                <option key={r.id} value={r.id}>{r.name}</option>,
                ...cats.filter((c) => c.parentId === r.id).map((c) => (
                  <option key={c.id} value={c.id}>{r.name} › {c.name}</option>
                )),
              ])}
            </select>
          </Field>
          <Field label="Author" htmlFor="authorId">
            <select id="authorId" name="authorId" defaultValue={user.authorId ?? ""} className="field">
              <option value="">Choose later</option>
              {authors.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Format" htmlFor="contentType">
            <select id="contentType" name="contentType" className="field">
              <option value="FEATURE">Editorial feature</option>
              <option value="INSPIRATION_GALLERY">Inspiration gallery</option>
              <option value="HOW_TO">How-to guide</option>
              <option value="EXPLAINER">Evergreen explainer</option>
              <option value="TREND_ANALYSIS">Seasonal trend analysis</option>
              <option value="OUTFIT_GUIDE">Outfit guide</option>
              <option value="COMPARISON">Product comparison</option>
              <option value="SHOPPING_ROUNDUP">Shopping roundup</option>
            </select>
          </Field>
          <SubmitButton pendingLabel="Creating…">Create draft</SubmitButton>
        </ActionForm>
      </Card>
    </>
  );
}
