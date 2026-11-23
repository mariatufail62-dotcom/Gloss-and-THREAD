import { SITE_DESCRIPTION, SITE_LANG, SITE_NAME, absoluteUrl, siteUrl } from "@/lib/site";

/**
 * JSON-LD builders. Every property describes information that is visible on
 * the page. No ratings, reviews, prices or credentials are ever invented.
 */

export function organizationId() {
  return `${siteUrl()}/#organization`;
}

export function organizationJsonLd(socialUrls: string[] = []) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": organizationId(),
    name: SITE_NAME,
    url: absoluteUrl("/"),
    logo: { "@type": "ImageObject", url: absoluteUrl("/logo-square.png"), width: 512, height: 512 },
    description: SITE_DESCRIPTION,
    ...(socialUrls.length ? { sameAs: socialUrls } : {}),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl()}/#website`,
    name: SITE_NAME,
    url: absoluteUrl("/"),
    inLanguage: SITE_LANG,
    publisher: { "@id": organizationId() },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}

export function articleJsonLd(a: {
  path: string;
  canonical?: string | null;
  headline: string;
  description: string;
  image?: { url: string; width: number; height: number } | null;
  datePublished: Date;
  dateModified?: Date | null;
  author?: { name: string; path: string; kind: "PERSON" | "ORGANIZATION" } | null;
  section?: string;
  keywords?: string[];
  wordCount?: number;
}) {
  const url = a.canonical || absoluteUrl(a.path);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    headline: a.headline.slice(0, 110),
    description: a.description,
    inLanguage: SITE_LANG,
    ...(a.image ? { image: [{ "@type": "ImageObject", url: absoluteUrl(a.image.url), width: a.image.width, height: a.image.height }] } : {}),
    datePublished: a.datePublished.toISOString(),
    dateModified: (a.dateModified ?? a.datePublished).toISOString(),
    ...(a.author
      ? {
          author: [
            {
              "@type": a.author.kind === "ORGANIZATION" ? "Organization" : "Person",
              name: a.author.name,
              url: absoluteUrl(a.author.path),
            },
          ],
        }
      : {}),
    publisher: { "@id": organizationId() },
    ...(a.section ? { articleSection: a.section } : {}),
    ...(a.keywords?.length ? { keywords: a.keywords.join(", ") } : {}),
    ...(a.wordCount ? { wordCount: a.wordCount } : {}),
  };
}

export function profilePageJsonLd(p: {
  path: string;
  name: string;
  kind: "PERSON" | "ORGANIZATION";
  description?: string | null;
  jobTitle?: string | null;
  image?: string | null;
  sameAs?: string[];
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: absoluteUrl(p.path),
    dateCreated: p.createdAt.toISOString(),
    dateModified: p.updatedAt.toISOString(),
    mainEntity: {
      "@type": p.kind === "ORGANIZATION" ? "Organization" : "Person",
      name: p.name,
      url: absoluteUrl(p.path),
      ...(p.description ? { description: p.description } : {}),
      ...(p.jobTitle && p.kind === "PERSON" ? { jobTitle: p.jobTitle } : {}),
      ...(p.image ? { image: absoluteUrl(p.image) } : {}),
      ...(p.sameAs?.length ? { sameAs: p.sameAs } : {}),
    },
  };
}

export function collectionPageJsonLd(p: { path: string; name: string; description: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    url: absoluteUrl(p.path),
    name: p.name,
    description: p.description,
    isPartOf: { "@id": `${siteUrl()}/#website` },
  };
}
