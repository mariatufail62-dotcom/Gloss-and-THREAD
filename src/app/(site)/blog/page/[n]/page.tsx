import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { pageMetadata } from "@/lib/seo/metadata";
import { blogPath } from "@/lib/urls";
import { BlogIndex } from "@/components/blog/BlogIndex";
import { resolvePage } from "@/components/category/CategoryLanding";

export const revalidate = 600;
export const generateStaticParams = async () => [];

type Props = { params: Promise<{ n: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = resolvePage((await params).n);
  if (!page) return { title: "Not found", robots: { index: false } };
  return pageMetadata({
    title: `All Stories — Page ${page}`,
    description: `Page ${page} of every Gloss & Thread story, newest first.`,
    path: blogPath(page),
  });
}

export default async function BlogPaged({ params }: Props) {
  const { n } = await params;
  if (n === "1") permanentRedirect("/blog/");
  const page = resolvePage(n);
  if (!page) notFound();
  return <BlogIndex page={page} />;
}
