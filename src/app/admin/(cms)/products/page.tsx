import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { formatPrice } from "@/lib/format";
import { Badge, Notice, PageHeader, Table } from "@/components/admin/ui";

export const metadata = { title: "Products" };

type Props = { searchParams: Promise<{ deleted?: string }> };

export default async function Products({ searchParams }: Props) {
  await requireUser("EDITOR");
  const { deleted } = await searchParams;
  const products = await db.product.findMany({
    orderBy: { updatedAt: "desc" },
    include: { links: { orderBy: [{ isPrimary: "desc" }] } },
  });
  return (
    <>
      <PageHeader
        title="Products"
        description="Editorial shopping picks. Only real products with links you have checked appear on the site; prices show only when verified."
        actions={<Link href="/admin/products/new/" className="btn-dark">Add product</Link>}
      />
      {deleted && <div className="mb-4"><Notice tone="green">Product deleted.</Notice></div>}
      <Table head={["Product", "Primary link", "Price", "Status"]} empty="No products yet. Add one when you have a real, verified product to recommend.">
        {products.map((p) => {
          const link = p.links[0];
          const verified = p.links.some((l) => l.linkVerifiedAt);
          return (
            <tr key={p.id}>
              <td className="px-4 py-3">
                <Link href={`/admin/products/${p.id}/`} className="font-medium hover:underline">{p.name}</Link>
                <span className="block text-[0.75rem] text-muted">{p.brand}</span>
              </td>
              <td className="px-4 py-3 text-muted">{link ? `${link.merchant}${link.isAffiliate ? " · affiliate" : ""}` : "—"}</td>
              <td className="px-4 py-3 text-muted">{link?.priceVerifiedAt ? formatPrice(link.priceCents, link.currency) : "—"}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1.5">
                  {!p.isActive && <Badge>Inactive</Badge>}
                  {verified ? <Badge tone="green">Verified link</Badge> : <Badge tone="amber">Hidden — no verified link</Badge>}
                </div>
              </td>
            </tr>
          );
        })}
      </Table>
    </>
  );
}
