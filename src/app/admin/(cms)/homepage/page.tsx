import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { getSetting } from "@/lib/settings";
import { publishedWhere } from "@/lib/queries/public";
import { saveHomepageAction } from "@/app/admin/actions/site";
import { ActionForm, SubmitButton } from "@/components/admin/forms";
import { Card, PageHeader } from "@/components/admin/ui";

export const metadata = { title: "Homepage" };

const SECTION_LABELS: Record<string, string> = {
  latest: "Latest stories",
  nails: "Trending nail ideas",
  outfits: "Outfit inspiration",
  shoes: "The shoe edit",
  beautyHair: "Beauty & hair",
  accessories: "Accessories",
  editorsPicks: "Editor's picks (products)",
  popular: "Most popular",
  newsletter: "Newsletter",
};

export default async function HomepageCuration() {
  await requireUser("EDITOR");
  const [features, articles, products, home] = await Promise.all([
    db.homepageFeature.findMany({ orderBy: { position: "asc" } }),
    db.article.findMany({ where: publishedWhere(), orderBy: { publishedAt: "desc" }, take: 300, select: { id: true, title: true, isSample: true } }),
    db.product.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, brand: true, links: { where: { linkVerifiedAt: { not: null } }, select: { id: true } } } }),
    getSetting("homepage"),
  ]);
  const slot = (s: string) => features.filter((f) => f.slot === s);
  const hero = slot("HERO").map((f) => f.articleId ?? "");
  const popular = slot("POPULAR").map((f) => f.articleId ?? "");
  const picks = slot("EDITORS_PICKS").map((f) => f.productId ?? "");

  const ArticleSelect = ({ name, value, label }: { name: string; value?: string; label: string }) => (
    <label className="block">
      <span className="mb-1 block text-[0.75rem] text-muted">{label}</span>
      <select name={name} defaultValue={value ?? ""} className="field">
        <option value="">— Automatic —</option>
        {articles.map((a) => <option key={a.id} value={a.id}>{a.title}{a.isSample ? " (sample)" : ""}</option>)}
      </select>
    </label>
  );

  return (
    <>
      <PageHeader title="Homepage" description="Choose the hero stories, the “Most popular” list and product picks. Empty slots fall back to featured and latest stories. Popular is editor-curated — we never display invented view counts." />
      <ActionForm action={saveHomepageAction} className="space-y-6">
        <Card title="Hero">
          <div className="grid gap-4 md:grid-cols-3">
            <ArticleSelect name="hero" value={hero[0]} label="Lead story (large)" />
            <ArticleSelect name="hero" value={hero[1]} label="Supporting story 1" />
            <ArticleSelect name="hero" value={hero[2]} label="Supporting story 2" />
          </div>
        </Card>
        <Card title="Most popular (curated)">
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 6 }, (_, i) => <ArticleSelect key={i} name="popular" value={popular[i]} label={`#${i + 1}`} />)}
          </div>
          <p className="mt-3 text-[0.75rem] text-muted">Leave all empty to show evergreen guides under the heading “Popular guides”.</p>
        </Card>
        <Card title="Editor's picks">
          {products.length === 0 ? (
            <p className="text-[0.875rem] text-muted">No products yet. The section stays hidden until real products with verified links are added.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 8 }, (_, i) => (
                <label key={i} className="block">
                  <span className="mb-1 block text-[0.75rem] text-muted">Pick {i + 1}</span>
                  <select name="picks" defaultValue={picks[i] ?? ""} className="field">
                    <option value="">— None —</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.brand} — {p.name}{p.links.length ? "" : " (unverified, hidden)"}</option>)}
                  </select>
                </label>
              ))}
            </div>
          )}
        </Card>
        <Card title="Section order">
          <ol className="grid gap-3 md:grid-cols-3">
            {home.sectionOrder.map((s, i) => (
              <li key={i}>
                <label className="block">
                  <span className="mb-1 block text-[0.75rem] text-muted">Position {i + 1}</span>
                  <select name="sectionOrder" defaultValue={s} className="field">
                    {Object.entries(SECTION_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                  </select>
                </label>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-[0.75rem] text-muted">The hero always opens the page. Duplicate choices are collapsed; missing sections are appended at the end.</p>
        </Card>
        <SubmitButton>Save homepage</SubmitButton>
      </ActionForm>
    </>
  );
}
