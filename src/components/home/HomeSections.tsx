import Link from "next/link";
import type { ArticleCard, CategoryNode, ProductItem } from "@/lib/queries/public";
import { articlePath, categoryPath } from "@/lib/urls";
import { SectionHeader } from "@/components/editorial/Common";
import { ProductCard } from "@/components/editorial/Monetization";
import { EditorialImage } from "@/components/editorial/EditorialImage";
import {
  Byline,
  CategoryLabel,
  StoryHeadline,
  StoryLead,
  StoryOverlay,
  StoryRow,
  StoryStack,
} from "@/components/editorial/StoryCards";

export function SubcategoryChips({ root, className = "" }: { root: CategoryNode | null; className?: string }) {
  if (!root || !root.children.length) return null;
  return (
    <ul className={`no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0 ${className}`}>
      {root.children.map((c) => (
        <li key={c.id} className="shrink-0">
          <Link
            href={categoryPath({ slug: c.slug, parent: { slug: root.slug } })}
            className="flex min-h-10 items-center border border-line bg-white px-4 text-[0.8125rem] whitespace-nowrap hover:border-ink"
          >
            {c.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/* A — Hero: one dominant story, two supporting stories */
export function HeroSection({ stories }: { stories: ArticleCard[] }) {
  if (!stories.length) return null;
  const [lead, ...rest] = stories;
  return (
    <section aria-label="Featured stories" className="page-x pt-6 sm:pt-10">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-7">
          <StoryLead article={lead} priority as="h2" />
        </div>
        <div className="grid content-start gap-10 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1 lg:gap-0 lg:divide-y lg:divide-line">
          {rest.map((a, i) => (
            <div key={a.id} className={i > 0 ? "lg:pt-8" : "lg:pb-8"}>
              <StoryStack
                article={a}
                ratio="3/2"
                size="md"
                showExcerpt
                sizes="(min-width: 1024px) 38vw, (min-width: 640px) 50vw, 100vw"
                priority={i === 0}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* C — Latest stories */
export function LatestSection({ stories }: { stories: ArticleCard[] }) {
  if (!stories.length) return null;
  const top = stories.slice(0, 2);
  const rest = stories.slice(2, 6);
  return (
    <section aria-labelledby="latest-heading" className="page-x mt-20 sm:mt-24">
      <SectionHeader id="latest-heading" title="Latest Stories" href="/blog/" linkLabel="All stories" />
      <div className="grid gap-10 md:grid-cols-2">
        {top.map((a) => (
          <StoryStack key={a.id} article={a} ratio="3/2" size="lg" showExcerpt sizes="(min-width: 768px) 50vw, 100vw" />
        ))}
      </div>
      {rest.length > 0 && (
        <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-10 border-t border-line pt-10 lg:grid-cols-4 lg:gap-x-8">
          {rest.map((a) => (
            <StoryStack key={a.id} article={a} ratio="1/1" size="sm" sizes="(min-width: 1024px) 25vw, 50vw" />
          ))}
        </div>
      )}
    </section>
  );
}

/* D — Trending nail ideas (photography-first) */
export function NailsSection({ stories, root }: { stories: ArticleCard[]; root: CategoryNode | null }) {
  if (!stories.length || !root) return null;
  return (
    <section aria-labelledby="nails-heading" className="page-x mt-20 sm:mt-24">
      <SectionHeader id="nails-heading" kicker="The Nail Edit" title="Trending Nail Ideas" href={categoryPath(root)} linkLabel="All nails" />
      <SubcategoryChips root={root} className="mb-8" />
      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        {stories.slice(0, 4).map((a) => (
          <div key={a.id} className="w-[72vw] shrink-0 snap-start sm:w-auto">
            <StoryOverlay article={a} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 72vw" />
          </div>
        ))}
      </div>
    </section>
  );
}

/* E — Outfit inspiration (asymmetric) */
export function OutfitsSection({ stories, root }: { stories: ArticleCard[]; root: CategoryNode | null }) {
  if (!stories.length || !root) return null;
  const [lead, ...rest] = stories;
  return (
    <section aria-labelledby="outfits-heading" className="page-x mt-20 sm:mt-24">
      <SectionHeader id="outfits-heading" kicker="What to Wear" title="Outfit Inspiration" href={categoryPath(root)} linkLabel="All outfits" />
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-6">
          <StoryStack article={lead} ratio="4/5" size="lg" showExcerpt sizes="(min-width: 1024px) 50vw, 100vw" />
        </div>
        <div className="grid grid-cols-2 content-start gap-x-5 gap-y-10 lg:col-span-6 lg:gap-x-8">
          {rest.slice(0, 4).map((a) => (
            <StoryStack key={a.id} article={a} ratio="3/4" size="sm" sizes="(min-width: 1024px) 25vw, 50vw" />
          ))}
        </div>
      </div>
      <SubcategoryChips root={root} className="mt-10" />
    </section>
  );
}

/* F — The Shoe Edit */
export function ShoesSection({ stories, root }: { stories: ArticleCard[]; root: CategoryNode | null }) {
  if (!stories.length || !root) return null;
  return (
    <section aria-labelledby="shoes-heading" className="mt-20 bg-paper-2 py-16 sm:mt-24 sm:py-20">
      <div className="page-x">
        <SectionHeader id="shoes-heading" kicker="Footwear" title="The Shoe Edit" href={categoryPath(root)} linkLabel="All shoes" />
        <SubcategoryChips root={root} className="mb-10" />
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {stories.slice(0, 4).map((a) => (
            <StoryStack key={a.id} article={a} ratio="1/1" size="md" sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" />
          ))}
        </div>
      </div>
    </section>
  );
}

/* G — Beauty & Hair */
export function BeautyHairSection({
  beauty,
  hair,
  beautyRoot,
  hairRoot,
}: {
  beauty: ArticleCard[];
  hair: ArticleCard[];
  beautyRoot: CategoryNode | null;
  hairRoot: CategoryNode | null;
}) {
  if (!beauty.length && !hair.length) return null;
  const col = (title: string, items: ArticleCard[], root: CategoryNode | null) =>
    items.length > 0 && root ? (
      <div>
        <div className="mb-6 flex items-baseline justify-between border-b border-line pb-3">
          <h3 className="font-serif text-[1.5rem] font-medium">{title}</h3>
          <Link href={categoryPath(root)} className="nav-link hover:text-rose-dark">
            More<span className="sr-only"> {title}</span>
          </Link>
        </div>
        <StoryStack article={items[0]} ratio="3/2" size="md" showExcerpt sizes="(min-width: 768px) 50vw, 100vw" />
        {items.length > 1 && (
          <ul className="mt-8 divide-y divide-line border-t border-line">
            {items.slice(1, 4).map((a) => (
              <li key={a.id} className="py-5">
                <StoryHeadline article={a} showLabel={false} as="h4" />
              </li>
            ))}
          </ul>
        )}
      </div>
    ) : null;
  return (
    <section aria-labelledby="beauty-heading" className="page-x mt-20 sm:mt-24">
      <SectionHeader id="beauty-heading" kicker="Beauty & Hair" title="Looking Good, Simply" />
      <div className="grid gap-14 md:grid-cols-2 md:gap-10 lg:gap-16">
        {col("Beauty", beauty, beautyRoot)}
        {col("Hairstyles", hair, hairRoot)}
      </div>
    </section>
  );
}

/* H — Accessories (wide feature + list) */
export function AccessoriesSection({ stories, root }: { stories: ArticleCard[]; root: CategoryNode | null }) {
  if (!stories.length || !root) return null;
  const [lead, ...rest] = stories;
  return (
    <section aria-labelledby="acc-heading" className="page-x mt-20 sm:mt-24">
      <SectionHeader id="acc-heading" kicker="Bags, Jewelry & More" title="Accessories" href={categoryPath(root)} linkLabel="All accessories" />
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
        <article className="group relative lg:col-span-7">
          <EditorialImage media={lead.featuredImage} ratio="3/2" sizes="(min-width: 1024px) 58vw, 100vw" hoverZoom />
        </article>
        <div className="lg:col-span-5 lg:self-center">
          <CategoryLabel article={lead} />
          <h3 className="mt-3 font-serif text-[1.875rem] leading-[1.1] font-medium sm:text-[2.4rem]">
            <Link href={articlePath(lead)} className="hover:text-rose-dark">
              {lead.title}
            </Link>
          </h3>
          {lead.excerpt && <p className="mt-4 text-[1rem] leading-relaxed text-muted">{lead.excerpt}</p>}
          <Byline article={lead} className="mt-4" />
          {rest.length > 0 && (
            <ul className="mt-8 divide-y divide-line border-t border-line">
              {rest.slice(0, 3).map((a) => (
                <li key={a.id} className="py-4">
                  <StoryHeadline article={a} as="h4" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <SubcategoryChips root={root} className="mt-10" />
    </section>
  );
}

/* I — Editor's Picks (CMS products with verified links only) */
export function EditorsPicksSection({ products }: { products: ProductItem[] }) {
  if (!products.length) return null;
  return (
    <section aria-labelledby="picks-heading" className="page-x mt-20 sm:mt-24">
      <SectionHeader id="picks-heading" kicker="Shop the Edit" title="Editor's Picks" />
      <p className="-mt-2 mb-8 text-[0.8125rem] text-muted">
        We may earn a commission from some links. <Link href="/affiliate-disclosure/" className="underline underline-offset-2">How we choose products</Link>.
      </p>
      <div className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-8">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

/* J — Most Popular (curated) or Essential Guides (fallback — never fake rankings) */
export function PopularSection({ curated, stories }: { curated: boolean; stories: ArticleCard[] }) {
  if (!stories.length) return null;
  return (
    <section aria-labelledby="popular-heading" className="page-x mt-20 sm:mt-24">
      <SectionHeader
        id="popular-heading"
        kicker={curated ? "Reader Favorites" : "Start Here"}
        title={curated ? "Most Popular" : "Essential Guides"}
        href="/blog/popular/"
        linkLabel="All guides"
      />
      <ol className="grid gap-x-12 md:grid-cols-2">
        {stories.slice(0, 6).map((a, i) => (
          <li key={a.id} className="group relative flex gap-5 border-b border-line py-6">
            <span aria-hidden className="w-10 shrink-0 font-serif text-[2.25rem] leading-none text-rose italic">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <CategoryLabel article={a} />
              <h3 className="mt-2 font-serif text-[1.25rem] leading-snug font-medium">
                <Link href={articlePath(a)} className="after:absolute after:inset-0 after:content-['']">
                  <span className="story-link">{a.title}</span>
                </Link>
              </h3>
            </div>
            <div className="hidden w-24 shrink-0 sm:block">
              <EditorialImage media={a.featuredImage} ratio="1/1" sizes="96px" altOverride="" />
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export { StoryRow };
