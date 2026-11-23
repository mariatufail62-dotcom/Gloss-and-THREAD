/**
 * Seeds the category structure, the editorial desk byline, demo media records
 * and clearly labeled sample articles. Safe to re-run: existing records that
 * editors may have changed are never overwritten.
 *
 *   npm run media:demo   # generate public/demo/*.webp first
 *   npm run db:seed
 */
import "dotenv/config";
import { existsSync } from "node:fs";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { markdownToBlocks } from "../src/lib/blocks/markdown";
import { bodySchema } from "../src/lib/blocks/schema";
import { autoExcerpt, blocksToPlainText, countWords } from "../src/lib/blocks/text";
import { DEMO_CREDIT, DEMO_IMAGES, DEMO_LICENSE } from "../scripts/demo-manifest";
import { TAXONOMY } from "./seed-taxonomy";
import { SAMPLE_ARTICLES } from "./seed-articles";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

async function seedCategories() {
  const ids = new Map<string, string>();
  for (const [i, root] of TAXONOMY.entries()) {
    let r = await db.category.findFirst({ where: { slug: root.slug, parentId: null } });
    r ??= await db.category.create({
      data: {
        slug: root.slug,
        name: root.name,
        navLabel: root.navLabel,
        description: root.description,
        intro: root.intro,
        seoTitle: root.seoTitle,
        metaDescription: root.metaDescription,
        sortOrder: (i + 1) * 10,
      },
    });
    ids.set(root.slug, r.id);
    for (const [j, ch] of (root.children ?? []).entries()) {
      let c = await db.category.findFirst({ where: { slug: ch.slug, parentId: r.id } });
      c ??= await db.category.create({
        data: { slug: ch.slug, name: ch.name, description: ch.description, parentId: r.id, sortOrder: (j + 1) * 10 },
      });
      ids.set(`${root.slug}/${ch.slug}`, c.id);
    }
  }
  return ids;
}

async function seedMedia() {
  const ids = new Map<string, string>();
  for (const img of DEMO_IMAGES) {
    const file = path.resolve(process.cwd(), "public/demo", img.file);
    if (!existsSync(file)) throw new Error(`Missing ${file}. Run "npm run media:demo" first.`);
    const url = `/demo/${img.file}`;
    const m = await db.media.upsert({
      where: { url },
      update: {},
      create: {
        url,
        filename: img.file,
        mimeType: "image/webp",
        width: img.width,
        height: img.height,
        sizeBytes: 0,
        alt: img.alt,
        credit: DEMO_CREDIT,
        license: DEMO_LICENSE,
        isDemo: true,
      },
    });
    ids.set(img.key, m.id);
  }
  return ids;
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set.");
  const categories = await seedCategories();
  const media = await seedMedia();

  const desk = await db.author.upsert({
    where: { slug: "gloss-and-thread-editors" },
    update: {},
    create: {
      slug: "gloss-and-thread-editors",
      name: "Gloss & Thread Editors",
      kind: "ORGANIZATION",
      shortBio: "Stories credited to the Gloss & Thread editorial desk are researched, written and edited collaboratively by our editors.",
      bio: "The Gloss & Thread editors byline is used for desk-produced guides and for sample content that demonstrates the site. Individual writers are credited by name when an article is their work.\n\nQuestions or corrections? Use the contact page and choose “Correction”.",
    },
  });

  let created = 0;
  const now = Date.now();
  for (const [i, a] of SAMPLE_ARTICLES.entries()) {
    if (await db.article.findUnique({ where: { slug: a.slug }, select: { id: true } })) continue;
    const md = a.body.replace(/@@([a-z0-9-]+)@@/g, (_, key: string) => {
      const id = media.get(key);
      if (!id) throw new Error(`Unknown demo image key "${key}" in ${a.slug}`);
      return id;
    });
    // The featured image already opens the article; never repeat it inline.
    const featuredId = media.get(a.image);
    const blocks = bodySchema.parse(markdownToBlocks(md)).filter((b) => !(b.type === "image" && b.mediaId === featuredId));
    const plain = blocksToPlainText(blocks);
    const categoryId = categories.get(a.category);
    if (!categoryId) throw new Error(`Unknown category ${a.category}`);
    const publishedAt = new Date(now - (i * 2 + 1) * 86_400_000 - i * 3_600_000);

    const tagIds: string[] = [];
    for (const name of a.tags) {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const t = await db.tag.upsert({ where: { slug }, update: {}, create: { slug, name } });
      tagIds.push(t.id);
    }

    await db.article.create({
      data: {
        slug: a.slug,
        title: a.title,
        subtitle: a.subtitle,
        excerpt: autoExcerpt(blocks),
        body: blocks as object[],
        searchText: plain,
        wordCount: countWords(plain),
        status: "PUBLISHED",
        contentType: a.contentType,
        categoryId,
        authorId: desk.id,
        featuredImageId: media.get(a.image),
        seoTitle: a.seoTitle,
        metaDescription: a.metaDescription,
        // Sample content must never be indexed or submitted in sitemaps.
        robotsIndex: false,
        inSitemap: false,
        isSample: true,
        isFeatured: !!a.featured,
        showToc: !!a.toc,
        reviewStatus: "NOT_REVIEWED",
        reviewNotes: "Sample article created by the seed script. Review, fact-check and replace demo illustrations before launch — or delete.",
        publishedAt,
        tags: { create: tagIds.map((tagId) => ({ tagId })) },
      },
    });
    created++;
  }

  console.log(`Seed complete: ${categories.size} categories, ${media.size} demo images, ${created} new sample article(s).`);
  console.log('Create your first admin with:  npm run create-admin -- --email you@example.com --name "Your Name"');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
