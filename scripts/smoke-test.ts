/**
 * End-to-end smoke test against a running server (dev or production build).
 *
 *   npm run test:smoke                       # BASE_URL defaults to http://localhost:3000
 *   BASE_URL=https://staging.example.com npm run test:smoke   # read-only checks only
 *
 * Against localhost it also exercises the CMS through real HTTP form posts
 * (progressive-enhancement server actions): create → save draft → blocked
 * publish → publish → slug change + redirect → unpublish → delete.
 * It creates a temporary admin + session directly in the database and removes
 * everything it created at the end.
 */
import "dotenv/config";
import { createHash, randomBytes } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const BASE = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const isLocal = /localhost|127\.0\.0\.1/.test(BASE);

let passed = 0;
const failures: string[] = [];
function check(name: string, ok: boolean, detail = "") {
  if (ok) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function get(path: string, cookie?: string) {
  const res = await fetch(BASE + path, { redirect: "manual", headers: cookie ? { cookie } : {} });
  const text = res.status === 200 ? await res.text() : "";
  return { status: res.status, location: res.headers.get("location") ?? "", text, headers: res.headers };
}

/** Extracts the hidden React server-action fields from the form containing `marker`. */
function actionFields(html: string, marker: string): [string, string][] {
  const forms = html.split("<form").slice(1).map((f) => f.slice(0, f.indexOf("</form>")));
  const form = forms.find((f) => f.includes(marker));
  if (!form) throw new Error(`No form containing ${marker}`);
  const out: [string, string][] = [];
  const re = /<input([^>]*?)\/?>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(form))) {
    const attrs = m[1];
    const name = attrs.match(/name="([^"]*)"/)?.[1];
    if (!name || !name.startsWith("$ACTION")) continue;
    const value = (attrs.match(/value="([^"]*)"/)?.[1] ?? "").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
    out.push([name, value]);
  }
  if (!out.length) throw new Error(`Form with ${marker} has no server action fields`);
  return out;
}

async function postAction(pagePath: string, marker: string, fields: Record<string, string>, cookie: string) {
  const page = await get(pagePath, cookie);
  if (page.status !== 200) throw new Error(`GET ${pagePath} → ${page.status}`);
  const fd = new FormData();
  for (const [k, v] of actionFields(page.text, marker)) fd.append(k, v);
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  const res = await fetch(BASE + pagePath, { method: "POST", body: fd, redirect: "manual", headers: { cookie, Origin: BASE } });
  return { status: res.status, location: res.headers.get("location") ?? "", text: await res.text() };
}

async function publicChecks() {
  console.log("\nPublic pages");
  const pages = ["/", "/blog/", "/nails/", "/nails/almond-nails/", "/outfits/", "/shoes/", "/beauty/", "/hairstyles/", "/accessories/", "/fashion/", "/blog/popular/",
    "/about/", "/contact/", "/editorial-policy/", "/privacy-policy/", "/terms/", "/affiliate-disclosure/", "/advertising-policy/", "/corrections-policy/", "/sitemap/",
    "/authors/gloss-and-thread-editors/", "/search/?q=nails"];
  for (const p of pages) {
    const r = await get(p);
    check(`GET ${p} → 200`, r.status === 200, `got ${r.status}`);
  }

  const art = await get("/nails/short-almond-nail-designs/");
  check("article renders", art.status === 200 && art.text.includes("Short Almond Nails"));
  check("article has canonical", /<link rel="canonical" href="[^"]*\/nails\/short-almond-nail-designs\/"/.test(art.text));
  check("article has Article JSON-LD", art.text.includes('"@type":"Article"'));
  check("article has BreadcrumbList JSON-LD", art.text.includes('"@type":"BreadcrumbList"'));
  check("sample article is noindex", /<meta name="robots" content="noindex/.test(art.text));
  check("exactly one <h1>", (art.text.match(/<h1[\s>]/g) ?? []).length === 1);

  const home = await get("/");
  check("homepage has Organization + WebSite JSON-LD", home.text.includes('"@type":"Organization"') && home.text.includes('"@type":"WebSite"'));
  check("homepage hero image is not lazy", /<img[^>]*fetchpriority="high"/i.test(home.text));

  const search = await get("/search/?q=loafers");
  check("search finds loafers guide", search.text.includes("How to Wear Loafers"));
  check("search page is noindex", /<meta name="robots" content="noindex/.test(search.text));

  console.log("\nStatus codes & redirects");
  check("unknown page → 404", (await get("/no-such-page/")).status === 404);
  check("unknown article → 404", (await get("/nails/no-such-article/")).status === 404);
  check("deep unknown path → 404", (await get("/nails/a/b/c/")).status === 404);
  const wrongCat = await get("/shoes/short-almond-nail-designs/");
  check("article under wrong category → 308 to canonical", wrongCat.status === 308 && wrongCat.location.endsWith("/nails/short-almond-nail-designs/"), `${wrongCat.status} ${wrongCat.location}`);
  const noSlash = await get("/nails");
  check("missing trailing slash → 308", noSlash.status === 308, String(noSlash.status));
  check("page 999 of blog → 404", (await get("/blog/page/999/")).status === 404);

  console.log("\nCrawl files");
  const robots = await get("/robots.txt");
  check("robots.txt", robots.status === 200 && /User-Agent/i.test(robots.text));
  const sm = await get("/sitemap.xml");
  check("sitemap index", sm.status === 200 && sm.text.includes("<sitemapindex") && sm.text.includes("/sitemaps/articles-1.xml"));
  const smArticles = await get("/sitemaps/articles-1.xml");
  check("article sitemap excludes noindex sample content", smArticles.status === 200 && !smArticles.text.includes("short-almond-nail-designs"));
  check("pages sitemap", (await get("/sitemaps/pages.xml")).text.includes("/about/"));
  check("unknown sitemap → 404", (await get("/sitemaps/nope.xml")).status === 404);
  const feed = await get("/feed.xml");
  check("RSS feed", feed.status === 200 && feed.text.includes("<rss"));
  check("demo image served", (await get("/demo/almond-nails-neutral-illustration.webp")).status === 200);
  check("health endpoint", (await get("/api/health/")).status === 200);
  check("cron rejects unauthenticated calls", (await get("/api/cron/publish/")).status === 401);

  console.log("\nAdmin protection");
  const adm = await get("/admin/articles/");
  check("admin without session → login redirect", adm.status === 307 && adm.location.includes("/admin/login/"), `${adm.status} ${adm.location}`);
  const login = await get("/admin/login/");
  check("login page renders + noindex", login.status === 200 && /noindex/.test(login.text));
  check("admin responses carry X-Robots-Tag", (login.headers.get("x-robots-tag") ?? "").includes("noindex"));
}

async function cmsFlow() {
  console.log("\nCMS flow (local database)");
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
  const email = `smoke-${Date.now()}@example.invalid`;
  const token = randomBytes(32).toString("base64url");
  let articleId: string | undefined;
  const user = await db.user.create({ data: { email, name: "Smoke Test", role: "ADMIN", passwordHash: "x" } });
  try {
    await db.session.create({ data: { id: createHash("sha256").update(token).digest("hex"), userId: user.id, expiresAt: new Date(Date.now() + 3600_000) } });
    const cookie = `gt_session=${token}`;

    for (const p of ["/admin/", "/admin/articles/", "/admin/media/", "/admin/products/", "/admin/homepage/", "/admin/categories/", "/admin/authors/", "/admin/redirects/", "/admin/seo/", "/admin/messages/", "/admin/settings/", "/admin/users/", "/admin/account/", "/admin/articles/new/", "/admin/products/new/", "/admin/categories/new/", "/admin/authors/new/"]) {
      const r = await get(p, cookie);
      check(`GET ${p} → 200`, r.status === 200, `got ${r.status}`);
    }

    const [nails, desk, image] = await Promise.all([
      db.category.findFirstOrThrow({ where: { slug: "almond-nails" } }),
      db.author.findFirstOrThrow({ where: { slug: "gloss-and-thread-editors" } }),
      db.media.findFirstOrThrow({ where: { isDemo: true } }),
    ]);

    const created = await postAction("/admin/articles/new/", 'name="title"', { title: "Smoke Test Almond Nail Article" }, cookie);
    const m = created.location.match(/\/admin\/articles\/([^/]+)\//);
    check("create draft → redirect to editor", created.status === 303 && !!m, `${created.status} ${created.location}`);
    if (!m) return;
    articleId = m[1];

    const editor = `/admin/articles/${articleId}/`;
    const body = JSON.stringify([
      { id: "h1", type: "heading", level: 2, text: "Why this shape works" },
      { id: "p1", type: "paragraph", text: "A test paragraph with an [internal link](/nails/short-almond-nail-designs/) and enough words to count. ".repeat(30) },
    ]);
    const base = {
      id: articleId,
      title: "Smoke Test Almond Nail Article",
      slug: "smoke-test-almond-nails",
      body,
      categoryId: nails.id,
      authorId: desk.id,
      featuredImageId: image.id,
      contentType: "HOW_TO",
      metaDescription: "A smoke-test article used to verify the publishing workflow end to end. It is deleted automatically when the test finishes.",
      robotsIndex: "on",
      inSitemap: "on",
      reviewStatus: "NOT_REVIEWED",
    };

    await postAction(editor, 'name="intent"', { ...base, intent: "save" }, cookie);
    let a = await db.article.findUniqueOrThrow({ where: { id: articleId } });
    check("save draft persists body + slug", a.status === "DRAFT" && a.slug === "smoke-test-almond-nails" && a.wordCount > 100, `${a.status} ${a.slug} ${a.wordCount}`);

    const blocked = await postAction(editor, 'name="intent"', { ...base, intent: "publish" }, cookie);
    a = await db.article.findUniqueOrThrow({ where: { id: articleId } });
    check("publish blocked until editorial review approved", a.status === "DRAFT" && blocked.text.includes("Editorial review"), a.status);

    await postAction(editor, 'name="intent"', { ...base, reviewStatus: "APPROVED", intent: "publish" }, cookie);
    a = await db.article.findUniqueOrThrow({ where: { id: articleId } });
    check("publish after approval", a.status === "PUBLISHED" && !!a.publishedAt, a.status);

    const live = await get("/nails/smoke-test-almond-nails/");
    check("published article is public", live.status === 200 && live.text.includes("Smoke Test Almond Nail Article"), String(live.status));
    check("published article is indexable", live.status === 200 && !/<meta name="robots" content="noindex/.test(live.text));
    check("published article appears in sitemap", (await get("/sitemaps/articles-1.xml")).text.includes("/nails/smoke-test-almond-nails/"));

    await postAction(editor, 'name="intent"', { ...base, reviewStatus: "APPROVED", slug: "smoke-test-almond-nails-renamed", intent: "save" }, cookie);
    const old = await get("/nails/smoke-test-almond-nails/");
    check("slug change → old URL 308 to new URL", old.status === 308 && old.location.endsWith("/nails/smoke-test-almond-nails-renamed/"), `${old.status} ${old.location}`);
    check("new URL is live", (await get("/nails/smoke-test-almond-nails-renamed/")).status === 200);

    await postAction(editor, 'name="intent"', { ...base, reviewStatus: "APPROVED", slug: "smoke-test-almond-nails-renamed", intent: "unpublish" }, cookie);
    a = await db.article.findUniqueOrThrow({ where: { id: articleId } });
    check("unpublish → draft", a.status === "DRAFT");
    check("unpublished article → 404", (await get("/nails/smoke-test-almond-nails-renamed/")).status === 404);

    const revs = await db.articleRevision.count({ where: { articleId } });
    check("revisions recorded", revs >= 4, String(revs));

    const preview = await get(`/admin/preview/${articleId}/`, cookie);
    check("private preview renders draft", preview.status === 200 && preview.text.includes("Smoke Test Almond Nail Article"));
    check("preview without session → login", (await get(`/admin/preview/${articleId}/`)).status === 307);

    const del = await postAction(editor, '>Delete article<', { id: articleId }, cookie).catch(() => null);
    const gone = !(await db.article.findUnique({ where: { id: articleId } }));
    check("delete draft", gone, del ? String(del.status) : "no delete form");
    if (gone) articleId = undefined;
  } finally {
    if (articleId) await db.article.delete({ where: { id: articleId } }).catch(() => {});
    await db.redirect.deleteMany({ where: { fromPath: { startsWith: "/nails/smoke-test-almond-nails" } } });
    await db.activityLog.deleteMany({ where: { userId: user.id } });
    await db.user.delete({ where: { id: user.id } });
    await db.$disconnect();
  }
}

async function main() {
  console.log(`Smoke testing ${BASE}`);
  await publicChecks();
  if (isLocal && process.env.DATABASE_URL) await cmsFlow();
  else console.log("\n(Skipping CMS write flow: not a local target.)");
  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) {
    console.log("\nFailures:\n- " + failures.join("\n- "));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
