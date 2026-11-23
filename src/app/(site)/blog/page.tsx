import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/metadata";
import { BlogIndex } from "@/components/blog/BlogIndex";

export const revalidate = 600;

export const metadata: Metadata = pageMetadata({
  title: "All Stories: Fashion, Nails, Outfits & Beauty",
  description:
    "Browse every Gloss & Thread story — outfit ideas, nail designs, shoe guides, hairstyles, handbags and beauty basics, newest first.",
  path: "/blog/",
});

export default function BlogPage() {
  return <BlogIndex page={1} />;
}
