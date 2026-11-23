import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { deleteLinkAction, deleteProductAction, saveLinkAction, saveProductAction } from "@/app/admin/actions/products";
import { pickerMedia } from "@/lib/admin/media-options";
import { formatDate } from "@/lib/format";
import { ActionForm, InlineAction, SubmitButton } from "@/components/admin/forms";
import { Card, Checkbox, Field, Notice, PageHeader } from "@/components/admin/ui";
import { StandaloneMediaField } from "@/components/admin/editor/MediaPicker";

export const metadata = { title: "Product" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> };

export default async function ProductPage({ params, searchParams }: Props) {
  await requireUser("EDITOR");
  const { id } = await params;
  const { created } = await searchParams;
  const isNew = id === "new";
  const p = isNew ? null : await db.product.findUnique({ where: { id }, include: { links: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] } } });
  if (!isNew && !p) notFound();
  const media = await pickerMedia(p?.imageId);

  return (
    <>
      <PageHeader title={p ? `${p.brand} — ${p.name}` : "Add product"} back={{ href: "/admin/products/", label: "Products" }} />
      {created && <div className="mb-4"><Notice tone="green">Product created. Add at least one verified merchant link so it can appear on the site.</Notice></div>}
      <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        <Card title="Product">
          <ActionForm action={saveProductAction} className="space-y-4">
            {p && <input type="hidden" name="id" value={p.id} />}
            <Field label="Brand" htmlFor="brand"><input id="brand" name="brand" required defaultValue={p?.brand} maxLength={120} className="field" /></Field>
            <Field label="Product name" htmlFor="name"><input id="name" name="name" required defaultValue={p?.name} maxLength={200} className="field" /></Field>
            <Field label="Editorial note" htmlFor="description" hint="Why it earns a place — an honest, specific reason. Don't claim hands-on testing unless it happened.">
              <textarea id="description" name="description" defaultValue={p?.description ?? ""} rows={3} maxLength={500} className="field" />
            </Field>
            <Field label="Product image" hint="Use an image you're licensed to publish (e.g. merchant press imagery under your affiliate agreement).">
              <StandaloneMediaField name="imageId" media={media} value={p?.imageId ?? null} />
            </Field>
            <Checkbox name="isActive" label="Active (eligible to appear on the site)" defaultChecked={p?.isActive ?? true} />
            <SubmitButton>{p ? "Save product" : "Create product"}</SubmitButton>
          </ActionForm>
          {p && (
            <div className="mt-6 border-t border-line pt-4">
              <InlineAction action={deleteProductAction} fields={{ id: p.id }} label="Delete product" variant="danger" confirm="Delete this product and its links?" />
            </div>
          )}
        </Card>

        {p && (
          <div className="space-y-6">
            {p.links.map((l) => (
              <Card key={l.id} title={`${l.merchant}${l.isPrimary ? " · primary" : ""}`} actions={<InlineAction action={deleteLinkAction} fields={{ id: l.id }} label="Remove" confirm="Remove this link?" />}>
                <p className="mb-4 text-[0.75rem] text-muted">
                  {l.linkVerifiedAt ? `Link checked ${formatDate(l.linkVerifiedAt)}` : "Link not verified — hidden on site"}
                  {l.priceCents != null && (l.priceVerifiedAt ? ` · price checked ${formatDate(l.priceVerifiedAt)}` : " · price unverified — not shown")}
                </p>
                <LinkForm productId={p.id} link={l} />
              </Card>
            ))}
            <Card title="Add merchant link">
              <LinkForm productId={p.id} />
            </Card>
          </div>
        )}
      </div>
    </>
  );
}

type LinkRow = { id: string; merchant: string; url: string; affiliateUrl: string | null; network: string | null; isAffiliate: boolean; priceCents: number | null; currency: string; isPrimary: boolean };

function LinkForm({ productId, link }: { productId: string; link?: LinkRow }) {
  return (
    <ActionForm action={saveLinkAction} resetOnSuccess={!link} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="productId" value={productId} />
      {link && <input type="hidden" name="linkId" value={link.id} />}
      <Field label="Merchant" className="sm:col-span-1"><input name="merchant" required defaultValue={link?.merchant} maxLength={120} className="field" /></Field>
      <Field label="Network" className="sm:col-span-1"><input name="network" defaultValue={link?.network ?? ""} placeholder="e.g. Rakuten, Impact, Direct" maxLength={80} className="field" /></Field>
      <Field label="Merchant product URL" className="sm:col-span-2"><input name="url" type="url" required defaultValue={link?.url} placeholder="https://" className="field font-mono text-[0.8125rem]" /></Field>
      <div className="sm:col-span-2">
        <Checkbox name="isAffiliate" label="This is an affiliate link (adds rel=&quot;sponsored&quot; and the disclosure)" defaultChecked={link?.isAffiliate} />
      </div>
      <Field label="Affiliate URL" className="sm:col-span-2" hint="Only from a real affiliate program you've joined."><input name="affiliateUrl" type="url" defaultValue={link?.affiliateUrl ?? ""} placeholder="https://" className="field font-mono text-[0.8125rem]" /></Field>
      <Field label="Price"><input name="price" inputMode="decimal" defaultValue={link?.priceCents != null ? (link.priceCents / 100).toFixed(2) : ""} placeholder="48.00" className="field" /></Field>
      <Field label="Currency"><input name="currency" defaultValue={link?.currency ?? "USD"} maxLength={3} className="field uppercase" /></Field>
      <div className="space-y-2 sm:col-span-2">
        <Checkbox name="verifyLink" label="I opened this link today and it goes to the right, in-stock product" />
        <Checkbox name="verifyPrice" label="I checked the price today on the merchant's page" />
        <Checkbox name="isPrimary" label="Primary link for this product" defaultChecked={link?.isPrimary ?? true} />
      </div>
      <div className="sm:col-span-2"><SubmitButton>{link ? "Save link" : "Add link"}</SubmitButton></div>
    </ActionForm>
  );
}
