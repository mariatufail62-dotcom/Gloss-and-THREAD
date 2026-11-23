import Image from "next/image";
import Link from "next/link";
import type { Block } from "@/lib/blocks/schema";
import { headingAnchors, readingMinutes } from "@/lib/blocks/text";
import type { ArticleCard, BodyRefMaps, MediaItem } from "@/lib/queries/public";
import { authorPath, categoryPath } from "@/lib/urls";
import { formatDate, isoDate, meaningfulUpdate } from "@/lib/format";
import { Breadcrumbs, SampleNotice } from "@/components/editorial/Common";
import { AdSlot, AffiliateDisclosure } from "@/components/editorial/Monetization";
import { StoryHeadline, StoryStack } from "@/components/editorial/StoryCards";
import { ArticleBody } from "./ArticleBody";

export interface ArticleViewData {
  title: string;
  subtitle: string | null;
  slug: string;
  publishedAt: Date | null;
  contentUpdatedAt: Date | null;
  wordCount: number;
  isSample: boolean;
  isSponsored: boolean;
  sponsorName: string | null;
  hasAffiliateLinks: boolean;
  showToc: boolean;
  sources: { title: string; url: string }[];
  category: { name: string; slug: string; parent: { name: string; slug: string } | null } | null;
  author: {
    name: string;
    slug: string;
    jobTitle: string | null;
    shortBio: string | null;
    avatar: MediaItem | null;
  } | null;
  featuredImage: MediaItem | null;
  tags: { name: string; slug: string }[];
}

interface Props {
  article: ArticleViewData;
  blocks: Block[];
  refs: BodyRefMaps;
  related: ArticleCard[];
  moreFromCategory: ArticleCard[];
  ads?: { minWordsForMidArticle: number };
  preview?: boolean;
}

export function ArticleView({ article: a, blocks, refs, related, moreFromCategory, ads, preview }: Props) {
  const root = a.category?.parent ?? a.category;
  const crumbs = [
    ...(root ? [{ name: root.name, path: categoryPath({ slug: root.slug }) }] : []),
    ...(a.category?.parent ? [{ name: a.category.name, path: categoryPath({ slug: a.category.slug, parent: a.category.parent }) }] : []),
    { name: a.title, path: `/${root?.slug ?? "blog"}/${a.slug}/` },
  ];
  const updated = meaningfulUpdate(a.publishedAt, a.contentUpdatedAt);
  const toc = a.showToc ? [...headingAnchors(blocks).values()].filter((h) => h.level === 2) : [];
  const withAds = !preview && !!ads;

  return (
    <article className="pb-8">
      {/* ── Header ── */}
      <header className="page-x pt-6 sm:pt-10">
        {!preview && <Breadcrumbs items={crumbs} className="mb-8" />}
        <div className="mx-auto max-w-[52rem] text-center">
          {a.isSponsored ? (
            <p className="label text-muted">Sponsored{a.sponsorName ? ` · Paid for by ${a.sponsorName}` : ""}</p>
          ) : (
            a.category && (
              <Link href={categoryPath(a.category)} className="label-rose">
                {a.category.name}
              </Link>
            )
          )}
          <h1 className="mt-5 font-serif text-[2.25rem] leading-[1.08] font-medium tracking-[-0.01em] sm:text-[3rem] lg:text-[3.6rem]">
            {a.title}
          </h1>
          {a.subtitle && <p className="mx-auto mt-5 max-w-[42rem] text-[1.125rem] leading-relaxed text-muted sm:text-[1.25rem]">{a.subtitle}</p>}
          <div className="meta mt-7 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            {a.author && (
              <span>
                By{" "}
                <Link href={authorPath(a.author)} rel="author" className="font-medium text-ink underline decoration-line underline-offset-4 hover:decoration-ink">
                  {a.author.name}
                </Link>
              </span>
            )}
            {a.publishedAt && (
              <>
                <span aria-hidden className="text-line">|</span>
                <span>
                  Published <time dateTime={isoDate(a.publishedAt)}>{formatDate(a.publishedAt)}</time>
                </span>
              </>
            )}
            {updated && (
              <>
                <span aria-hidden className="text-line">|</span>
                <span>
                  Updated <time dateTime={isoDate(updated)}>{formatDate(updated)}</time>
                </span>
              </>
            )}
            <span aria-hidden className="text-line">|</span>
            <span>{readingMinutes(a.wordCount)} min read</span>
          </div>
        </div>
      </header>

      {a.featuredImage && (
        <figure className="page-x mt-10 sm:mt-12">
          <div className="relative mx-auto aspect-[4/5] max-w-[72rem] overflow-hidden bg-paper-2 sm:aspect-[3/2]">
            <Image
              src={a.featuredImage.url}
              alt={a.featuredImage.alt}
              fill
              priority
              quality={85}
              sizes="(min-width: 1152px) 1152px, 100vw"
              className="object-cover"
            />
          </div>
          {(a.featuredImage.caption || a.featuredImage.credit) && (
            <figcaption className="mx-auto mt-3 max-w-[72rem] text-[0.8125rem] text-muted">
              {a.featuredImage.caption}
              {a.featuredImage.credit && <span className={a.featuredImage.caption ? "ml-1 text-muted/80" : ""}>{a.featuredImage.credit}</span>}
            </figcaption>
          )}
        </figure>
      )}

      {/* ── Body + sidebar ── */}
      <div className="page-x mt-10 sm:mt-14">
        <div className="mx-auto grid max-w-[72rem] grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-16">
          <div className="mx-auto w-full max-w-(--container-read) lg:mx-0 lg:justify-self-end">
            {a.isSample && <SampleNotice className="mb-8" />}
            {a.hasAffiliateLinks && <AffiliateDisclosure className="mb-8" />}

            {toc.length >= 3 && (
              <nav aria-labelledby="toc-heading" className="mb-10 border border-line px-6 py-5">
                <p id="toc-heading" className="label text-muted">In this article</p>
                <ol className="mt-4 space-y-2.5 text-[0.9375rem]">
                  {toc.map((h, i) => (
                    <li key={h.id} className="flex gap-3">
                      <span className="w-5 font-serif text-rose">{i + 1}</span>
                      <a href={`#${h.id}`} className="hover:text-rose-dark">
                        {h.text}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            )}

            <ArticleBody
              blocks={blocks}
              refs={refs}
              withAds={withAds}
              wordCount={a.wordCount}
              minWordsForMidAd={ads?.minWordsForMidArticle}
            />

            {a.sources.length > 0 && (
              <section aria-labelledby="sources-heading" className="mt-14 border-t border-line pt-6">
                <h2 id="sources-heading" className="label text-muted">Sources</h2>
                <ul className="mt-4 space-y-2 text-[0.875rem] leading-relaxed">
                  {a.sources.map((s) => (
                    <li key={s.url}>
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline decoration-line underline-offset-2 hover:decoration-ink">
                        {s.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {a.tags.length > 0 && (
              <ul className="mt-10 flex flex-wrap gap-2" aria-label="Topics">
                {a.tags.map((t) => (
                  <li key={t.slug}>
                    <Link
                      href={`/search/?tag=${t.slug}`}
                      rel="nofollow"
                      className="inline-flex min-h-9 items-center border border-line px-3 text-[0.75rem] tracking-[0.04em] text-muted hover:border-ink hover:text-ink"
                    >
                      {t.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {/* Author bio */}
            {a.author && (
              <section aria-label="About the author" className="mt-12 flex gap-5 border-y border-ink py-8">
                {a.author.avatar ? (
                  <Image src={a.author.avatar.url} alt="" width={72} height={72} className="h-18 w-18 shrink-0 rounded-full object-cover" />
                ) : (
                  <span aria-hidden className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-paper-2 font-serif text-xl">
                    {a.author.name.charAt(0)}
                  </span>
                )}
                <div>
                  <p className="label text-muted">Written by</p>
                  <p className="mt-2 font-serif text-[1.375rem]">
                    <Link href={authorPath(a.author)} className="hover:text-rose-dark">
                      {a.author.name}
                    </Link>
                  </p>
                  {a.author.jobTitle && <p className="text-[0.875rem] text-muted">{a.author.jobTitle}</p>}
                  {a.author.shortBio && <p className="mt-3 text-[0.9375rem] leading-relaxed text-[#3a3a3a]">{a.author.shortBio}</p>}
                </div>
              </section>
            )}

            {/* Corrections */}
            <p className="mt-6 text-[0.8125rem] leading-relaxed text-muted">
              Accuracy matters to us. If you spot an error, please{" "}
              <Link href={`/contact/?topic=CORRECTION`} className="text-ink underline underline-offset-2">
                request a correction
              </Link>
              . Read our{" "}
              <Link href="/corrections-policy/" className="text-ink underline underline-offset-2">
                corrections policy
              </Link>{" "}
              and{" "}
              <Link href="/editorial-policy/" className="text-ink underline underline-offset-2">
                editorial standards
              </Link>
              .
            </p>
          </div>

          {/* Restrained desktop sidebar */}
          <aside aria-label="More stories" className="hidden lg:block">
            <div className="sticky top-20 space-y-10">
              {related.length > 0 && (
                <div>
                  <p className="label border-b border-ink pb-3">Related Reading</p>
                  <ul className="divide-y divide-line">
                    {related.slice(0, 4).map((r) => (
                      <li key={r.id} className="py-5">
                        <StoryHeadline article={r} as="h3" />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {withAds && <AdSlot placement="sidebar" />}
            </div>
          </aside>
        </div>
      </div>

      {/* ── After article ── */}
      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="page-x mt-20">
          <div className="section-rule pt-4 pb-8">
            <h2 id="related-heading" className="font-serif text-[1.75rem] font-medium sm:text-[2rem]">
              Keep Reading
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4 lg:gap-x-8">
            {related.slice(0, 4).map((r) => (
              <StoryStack key={r.id} article={r} ratio="3/4" size="sm" sizes="(min-width: 1024px) 25vw, 50vw" as="h3" />
            ))}
          </div>
        </section>
      )}

      {withAds && <AdSlot placement="belowRelated" className="page-x mt-16" />}

      {moreFromCategory.length > 0 && root && (
        <section aria-labelledby="more-heading" className="page-x mt-20">
          <div className="section-rule flex items-end justify-between pt-4 pb-8">
            <h2 id="more-heading" className="font-serif text-[1.75rem] font-medium sm:text-[2rem]">
              More in {root.name}
            </h2>
            <Link href={categoryPath({ slug: root.slug })} className="nav-link border-b border-ink pb-1">
              View all
            </Link>
          </div>
          <div className="grid gap-10 sm:grid-cols-3 sm:gap-8">
            {moreFromCategory.slice(0, 3).map((r) => (
              <StoryStack key={r.id} article={r} ratio="3/2" sizes="(min-width: 640px) 33vw, 100vw" as="h3" />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
