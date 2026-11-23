# Deployment guide

This guide covers taking Gloss & Thread from a local checkout to a production domain. Nothing here is active until you supply real credentials.

## 1. Choose hosting

The app is a standard Next.js Node server (`npm run build` then `npm run start`). It needs:

1. **A Node.js 20.9+ runtime.**
2. **PostgreSQL 15+.** A managed database such as Neon, Supabase, Railway, Render or AWS RDS works.
3. **Persistent storage for uploads.** Uploaded images are written to `UPLOAD_DIR` and served from `/media/…`.

> **Important:** serverless platforms (e.g. Vercel, Netlify Functions) have **ephemeral filesystems**, so uploads would disappear. Either:
> - deploy to a host with a persistent disk or volume (Railway volume, Render disk, Fly.io volume, a VPS), **or**
> - adapt `src/lib/media.ts` (`processUpload`, `readUpload`, `deleteUploadFile`) to an object store such as S3 or Cloudflare R2. Those three functions are the only integration point.

Recommended simple setup: **Render, Railway or Fly.io** web service + managed Postgres + a 1–5 GB persistent volume mounted at, for example, `/data/uploads`.

## 2. Environment variables

Set these in the host dashboard. `.env.example` documents every variable.

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Include `sslmode=require` for managed Postgres |
| `SITE_URL` | Yes | e.g. `https://www.yourdomain.com`, no trailing slash |
| `UPLOAD_DIR` | Yes | Path on the persistent volume |
| `CRON_SECRET` | Yes | Random 32+ byte hex string |
| `SITE_ENV` | Staging only | Set to `staging` so robots.txt blocks crawlers |
| `NEWSLETTER_PROVIDER` + key | Optional | `buttondown` or `mailchimp` |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Optional | GA4 `G-…` ID. It is a build-time variable: rebuild after changing it |
| `GOOGLE_SITE_VERIFICATION` | Optional | Search Console HTML-tag token |
| `DATABASE_POOL_MAX` | Optional | Default 5 per instance |

## 3. Build and migrate

Build command:

```bash
npm ci && npm run db:migrate && npm run build
```

Start command:

```bash
npm run start
```

The build pre-renders public pages from the database, so `DATABASE_URL` must be reachable at build time. Run migrations before the build, as above.

First deploy only, from a machine that can reach the production database:

```bash
npm run media:demo      # only if you want the demo illustrations; commit public/demo or run on the server
npm run db:seed         # categories + desk byline (+ sample articles, noindex)
npm run create-admin -- --email you@yourdomain.com --name "Your Name"
```

If you don't want sample articles in production, seed, then delete them in **Admin → Articles** (filter by the “Sample” badge), or keep them as unpublished drafts for reference.

## 4. Scheduled publishing

Scheduled articles become public at their time automatically, because public queries check `publishedAt`. Pages are cached for up to 10 minutes. To flip their status and refresh caches promptly, call the cron endpoint every 5–15 minutes:

```bash
curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://www.yourdomain.com/api/cron/publish/
```

Use your host's cron feature, GitHub Actions on a schedule, or any uptime or cron service. The endpoint also purges expired sessions and rate-limit rows.

## 5. Domain and HTTPS

1. Add the custom domain in your host dashboard and create the DNS records it gives you (usually a CNAME for `www` plus an A/ALIAS or redirect for the apex).
2. Choose one canonical host, e.g. `https://www.yourdomain.com`. Redirect the other (the apex) to it at the host or DNS level with a 301 or 308.
3. Set `SITE_URL` to exactly that origin and redeploy.
4. HTTPS is provided by the host. HSTS is sent automatically in production (`next.config.ts`). Only submit the domain to the HSTS preload list once you are sure every subdomain serves HTTPS.

## 6. Sitemaps and Search Console

- Sitemap index: `https://www.yourdomain.com/sitemap.xml`. Children: `/sitemaps/pages.xml`, `/sitemaps/categories.xml`, `/sitemaps/authors.xml` and `/sitemaps/articles-N.xml` (5,000 URLs each). Only indexable, self-canonical articles are listed. Sample articles and noindex pages are excluded.
- `robots.txt` references the sitemap automatically when `NODE_ENV=production` and `SITE_ENV` is unset or `production`.

Search Console setup:

1. Open [Google Search Console](https://search.google.com/search-console) and add a **Domain property** (DNS TXT verification, preferred), **or** a URL-prefix property verified by HTML tag: copy the token into `GOOGLE_SITE_VERIFICATION` and redeploy.
2. Under **Sitemaps**, submit `sitemap.xml`.
3. Use **URL Inspection** on the homepage and one article to confirm they can be indexed and that Google selects your canonical.
4. Check **Pages** and **Core Web Vitals** reports after a few weeks of traffic. Structured data can be tested with the [Rich Results Test](https://search.google.com/test/rich-results). Valid markup does not guarantee rich results.

Bing Webmaster Tools can import the property from Search Console.

## 7. Analytics

Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` and rebuild. GA4 loads after the page is interactive, with IP anonymization. If you serve visitors in jurisdictions that require consent before analytics, add a consent-management platform before enabling it. Update the Privacy Policy to name every tool you actually use.

## 8. Advertising

Keep ads disabled until your AdSense (or partner) account is approved. Then go to **Admin → Site settings → Advertising** and:

1. Enter the `ca-pub-…` publisher ID.
2. Add slot IDs for the placements you want.
3. Paste the provider's `ads.txt` line.
4. Enable ads.

Slots reserve space to avoid layout shift. Update the Advertising Disclosure and Privacy Policy pages to reflect the provider.

## 9. Performance verification

Targets (75th percentile of real users): **LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1**. These are goals, not guarantees. After deploying:

1. Run [PageSpeed Insights](https://pagespeed.web.dev/) on the homepage, a category page and a long article, on mobile and desktop.
2. Field data appears in PageSpeed Insights and Search Console once the site has enough traffic.
3. Replace demo illustrations with properly sized photography. Uploads are capped at 2400 px and converted to WebP; Next.js serves AVIF/WebP at responsive sizes.
4. Put a CDN in front of `/media/*` and `/_next/static/*` if traffic grows. Both are sent with long-lived immutable cache headers.

## 10. Security checklist

- [ ] `DATABASE_URL`, `CRON_SECRET` and API keys exist only in host environment settings, never in the repo
- [ ] `.env` is not committed (it is in `.gitignore`)
- [ ] Admin accounts use unique 12+ character passwords; remove unused accounts in **Admin → Users**
- [ ] Contributors have the Contributor role (they cannot publish)
- [ ] HTTPS enforced; one canonical host
- [ ] `SITE_ENV=staging` on any non-production deployment
- [ ] Database user has only the privileges the app needs; database not publicly reachable without TLS
- [ ] Dependencies updated regularly (`npm outdated`, `npm audit`)

Built-in protections:

- bcrypt password hashing; sessions stored as SHA-256 hashes in HttpOnly, SameSite=Lax cookies
- Role checks in every admin page and server action; the `/admin` proxy redirects requests without a session
- Database-backed rate limits on login, contact form, newsletter and uploads
- Server Actions' built-in Origin check (CSRF)
- Zod validation on every input
- Uploads checked by decoded image format and size, re-encoded to WebP and stripped of EXIF/GPS metadata
- CSP, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` and `Permissions-Policy` headers
- `noindex` and `X-Robots-Tag` on admin, preview and API routes

## 11. Backup and recovery

- **Database:** enable your provider's automated daily backups with point-in-time recovery and at least 7 days' retention. Before risky changes, run a manual `pg_dump`:

  ```bash
  pg_dump "$DATABASE_URL" --format=custom --file=gloss-thread-$(date +%F).dump
  # restore:
  pg_restore --clean --no-owner --dbname "$DATABASE_URL" gloss-thread-YYYY-MM-DD.dump
  ```

- **Uploads:** snapshot the persistent volume on a schedule, or sync `UPLOAD_DIR` to object storage, for example with `rclone sync`. Media records in the database reference files by name, so back up both together.
- **Revisions:** each article keeps its 50 most recent revisions, restorable from the editor.
- **Test a restore** into a staging database at least once before launch.

## 12. Launch checklist

- [ ] Replace or remove sample articles. Publish real, reviewed articles (at least 3 per pillar so category pages become indexable)
- [ ] Replace demo illustrations with licensed photography with credits and alt text
- [ ] Fill in **Admin → Site settings → Publication details** (legal name, address, contact email, official social accounts). The About, Contact and Privacy pages show placeholders until you do
- [ ] Add real author profiles with the writers' permission
- [ ] Have the Privacy Policy and Terms reviewed by a qualified professional
- [ ] Configure a newsletter provider, or leave signup hidden
- [ ] Submit the sitemap in Search Console
- [ ] Run `BASE_URL=https://www.yourdomain.com npm run test:smoke`
