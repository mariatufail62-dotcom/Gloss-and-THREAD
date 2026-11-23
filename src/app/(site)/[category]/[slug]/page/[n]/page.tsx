import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getSubcategory } from "@/lib/queries/public";
import { categoryPath } from "@/lib/urls";
import { CategoryLanding, categoryMetadata, resolvePage } from "@/components/category/CategoryLanding";

export const revalidate = 600;
export const generateStaticParams = async () => [];

type Props = { params: Promise<{ category: string; slug: string; n: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, slug, n } = await params;
  const node = await getSubcategory(category, slug);
  const page = resolvePage(n);
  return node && page ? categoryMetadata(node, page) : { title: "Not found", robots: { index: false } };
}

export default async function SubcategoryPaged({ params }: Props) {
  const { category, slug, n } = await params;
  const node = await getSubcategory(category, slug);
  if (!node) notFound();
  if (n === "1") permanentRedirect(categoryPath(node));
  const page = resolvePage(n);
  if (!page) notFound();
  return <CategoryLanding node={node} page={page} />;
}
