/**
 * Brand constants and URL helpers. Safe for both server and client.
 * SITE_URL is configured per environment — never hardcode a domain.
 */
export const SITE_NAME = "Gloss & Thread";
export const SITE_WORDMARK = "GLOSS & THREAD";
export const SITE_TAGLINE = "Fashion. Beauty. Style.";
export const SITE_DESCRIPTION =
  "Gloss & Thread is an independent US fashion and beauty publication covering everyday outfits, nail ideas, shoes, hairstyles, handbags and the trends worth your attention.";
export const SITE_LOCALE = "en_US";
export const SITE_LANG = "en-US";
export const DEFAULT_CURRENCY = "USD";
export const DISPLAY_TIMEZONE = "America/New_York";

export function siteUrl(): string {
  const raw = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

/** Absolute URL for a site path. Paths are normalized to the trailing-slash convention. */
export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) return path;
  return siteUrl() + normalizePath(path);
}

/** Normalizes an internal path: leading slash, trailing slash (unless it is a file), no query/hash. */
export function normalizePath(input: string): string {
  let p = input.trim().split("#")[0].split("?")[0];
  if (!p.startsWith("/")) p = "/" + p;
  p = p.replace(/\/{2,}/g, "/");
  const last = p.split("/").pop() ?? "";
  if (!p.endsWith("/") && !last.includes(".")) p += "/";
  return p;
}

/** Top-level route names that categories and articles may never use. */
export const RESERVED_SLUGS = new Set([
  "admin", "api", "blog", "search", "about", "contact", "authors", "author", "media", "demo",
  "editorial-policy", "privacy-policy", "terms", "affiliate-disclosure", "advertising-policy",
  "corrections-policy", "sitemap", "sitemaps", "sitemap.xml", "robots.txt", "feed", "feed.xml",
  "ads.txt", "page", "tag", "tags", "preview", "login", "logout", "_next", "static", "favicon.ico",
]);

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90)
    .replace(/-+$/g, "");
}
