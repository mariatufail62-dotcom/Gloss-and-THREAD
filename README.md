# Gloss & Thread

A US fashion and beauty editorial publication with its own editorial CMS. Built with Next.js 16 (App Router, React Server Components), TypeScript, Tailwind CSS 4, PostgreSQL + Prisma 7 and Zod.

- **Public site:** magazine homepage, category and subcategory pages, long-form articles, blog index with crawlable pagination, search, author pages, policy pages, HTML sitemap.
- **CMS at `/admin`:** article block editor with drafts, scheduling, revisions, preview, an SEO checklist and a publish gate; media library; products and affiliate links; homepage curation; categories and navigation; authors; redirects; reader messages; site settings; users and roles.
- **SEO:** unique metadata, canonicals, Open Graph, JSON-LD (Organization, WebSite, Article, BreadcrumbList, ProfilePage, CollectionPage), XML sitemap index, image sitemap entries, RSS, robots.txt, automatic 308 redirects when URLs change.

> **Before launch:** the seeded articles are **samples**. They are marked noindex, left out of sitemaps, show a notice to readers and use original demo illustrations. Review or replace them, and replace the demo illustrations with licensed photography.

## Requirements

- Node.js 20.9 or newer (developed on Node 24)
- PostgreSQL 15 or newer in production. For local work, no install is needed — an embedded database (PGlite) runs on port 5433.

## Local development

```bash
npm install                 # also generates the Prisma client
cp .env.example .env        # defaults work for local development

npm run db:local            # terminal 1: embedded Postgres on :5433 (keep running)

npm run db:migrate          # terminal 2: create tables
npm run media:demo          # generate demo illustrations + logo/OG images
npm run db:seed             # categories, editorial desk byline, sample articles
npm run create-admin -- --email you@example.com --name "Your Name"   # prompts for a password

npm run dev                 # http://localhost:3000 — CMS at /admin/login/
```

The folder name contains `&`, which breaks npm's Windows `.cmd` shims, so every script calls `node node_modules/...` directly. Run them through `npm run`.

To start the local database over: stop `db:local`, then `npm run db:reset-local`, then repeat the steps above.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm run start` | Production build / server |
| `npm run typecheck` | TypeScript check |
| `npm test` | Unit tests (Vitest): block parser, link safety, audit rules, URLs, time zones |
| `npm run test:smoke` | End-to-end checks against a running server (see below) |
| `npm run db:migrate` | Apply migrations (`prisma migrate deploy`) |
| `npm run db:migrate:dev` | Create a new migration after editing `prisma/schema.prisma` |
| `npm run db:seed` | Seed taxonomy and sample content (safe to re-run; never overwrites edits) |
| `npm run media:demo` | Regenerate the demo illustrations and brand images |
| `npm run create-admin` | Create or reset an administrator |

### Smoke test

With a server running (`npm run dev` or `npm run start`):

```bash
npm run test:smoke                                  # localhost: public checks + full CMS flow
BASE_URL=https://staging.example.com npm run test:smoke   # remote: read-only checks
```

Against localhost it creates a temporary admin, then through real HTTP form posts it creates an article, saves a draft, confirms publishing is blocked until editorial review, publishes, renames the slug and checks the 308 redirect, unpublishes, checks the 404, and deletes everything it created.

When building against the local PGlite database, limit concurrency: `DATABASE_POOL_MAX=1 BUILD_CPUS=1 npm run build`. A real PostgreSQL server doesn't need this.

## Project structure

```
prisma/                 schema, migrations, seed (taxonomy + sample articles)
scripts/                demo images, create-admin, smoke test, local DB reset
src/proxy.ts            optimistic /admin guard (real auth checks run server-side)
src/app/(site)/         public pages
src/app/admin/          CMS: (cms) pages, login, preview, server actions
src/app/sitemap.xml, sitemaps/[file], feed.xml, ads.txt, robots.ts, media/[file], api/
src/components/         editorial UI, article renderer, CMS editor
src/lib/                db, auth, blocks (content model), SEO, queries, settings, audit
tests/unit/             Vitest
docs/                   deployment guide, content roadmap
```

## Content model

Article bodies are stored as validated JSON **blocks** (paragraph, heading, list, quote, image, gallery, table, callout, product picks, related articles, affiliate disclosure, licensed video embed, FAQ, divider). No raw HTML is stored or injected; inline text supports `**bold**`, `*italic*` and `[links](/path/)` with unsafe URLs rejected. The editor can also import Markdown.

## Roles

| Role | Can |
| --- | --- |
| Contributor | Write and edit their own drafts, upload images |
| Editor | Review, publish, schedule, unpublish; media, products, homepage, categories, authors, redirects, messages, SEO checklist |
| Admin | Everything, plus site settings and users |

## Editorial integrity built in

- Publishing is blocked until an editor marks the article **Approved** (fact-checked, sourced, image rights cleared) and blocking checklist items are fixed.
- Products appear only with a merchant link an editor confirmed; prices show only when verified, with the check date. Affiliate links get `rel="sponsored"`.
- "Most popular" is editor-curated. No view counts are shown or invented.
- Newsletter signups are only shown as successful when the provider confirms them; with no provider, the form is replaced by an honest note.
- Ads are off until an approved AdSense ID is entered; no empty ad boxes are shown.
- Category pages stay noindex until they have enough real, indexable articles.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for production setup and [docs/CONTENT-ROADMAP.md](docs/CONTENT-ROADMAP.md) for the 60-article editorial plan.
