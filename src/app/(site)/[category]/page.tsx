import type { Metadata } from "next";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { findRedirect, getCategoryTree, getRootCategory } from "@/lib/queries/public";
import { CategoryLanding, categoryMetadata } from "@/components/category/CategoryLanding";

export const revalidate = 600;

export async function generateStaticParams() {
  try {
    return (await getCategoryTree()).map((c) => ({ category: c.slug }));
  } catch {
    return [];
  }
}

type Props = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const node = await getRootCategory(category);
  return node ? categoryMetadata(node, 1) : { title: "Not found", robots: { index: false } };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const node = await getRootCategory(category);
  if (!node) {
    const r = await findRedirect(`/${category}/`);
    if (r) (r.permanent ? permanentRedirect : redirect)(r.toPath);
    notFound();
  }
  return <CategoryLanding node={node} page={1} />;
}
