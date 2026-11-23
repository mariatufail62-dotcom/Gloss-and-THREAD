import type { Metadata } from "next";
import { SITE_LOCALE, SITE_NAME, absoluteUrl } from "@/lib/site";

interface PageMetaInput {
  title: string; // page-specific title; brand is appended by the root template
  description: string;
  path: string; // canonical path
  canonicalOverride?: string | null;
  image?: { url: string; width: number; height: number; alt: string } | null;
  index?: boolean;
  type?: "website" | "article" | "profile";
  publishedTime?: Date | null;
  modifiedTime?: Date | null;
  authors?: string[];
  section?: string;
  absoluteTitle?: boolean;
}

/** Builds consistent, unique page metadata: canonical, robots, Open Graph, Twitter. */
export function pageMetadata(input: PageMetaInput): Metadata {
  const canonical = input.canonicalOverride || absoluteUrl(input.path);
  const description = input.description.slice(0, 300);
  const images = input.image
    ? [{ url: absoluteUrl(input.image.url), width: input.image.width, height: input.image.height, alt: input.image.alt }]
    : [{ url: absoluteUrl("/opengraph-default.png"), width: 1200, height: 630, alt: SITE_NAME }];
  const index = input.index !== false;

  return {
    title: input.absoluteTitle ? { absolute: input.title } : input.title,
    description,
    alternates: { canonical },
    robots: index
      ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } }
      : { index: false, follow: true },
    openGraph: {
      title: input.title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: SITE_LOCALE,
      type: input.type ?? "website",
      images,
      ...(input.type === "article"
        ? {
            publishedTime: input.publishedTime?.toISOString(),
            modifiedTime: (input.modifiedTime ?? input.publishedTime)?.toISOString(),
            authors: input.authors,
            section: input.section,
          }
        : {}),
    },
    twitter: { card: "summary_large_image", title: input.title, description, images: images.map((i) => i.url) },
  };
}
