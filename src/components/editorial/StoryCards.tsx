import Link from "next/link";
import type { ArticleCard } from "@/lib/queries/public";
import { articlePath, categoryPath } from "@/lib/urls";
import { formatDate, isoDate } from "@/lib/format";
import { EditorialImage } from "./EditorialImage";

type H = "h2" | "h3" | "h4";

export function CategoryLabel({ article, className = "" }: { article: ArticleCard; className?: string }) {
  if (article.isSponsored) return <span className={`label text-muted ${className}`}>Sponsored</span>;
  if (!article.category) return null;
  return (
    <Link href={categoryPath(article.category)} className={`label-rose relative z-10 ${className}`}>
      {article.category.name}
    </Link>
  );
}

export function Byline({ article, showDate = true, className = "" }: { article: ArticleCard; showDate?: boolean; className?: string }) {
  return (
    <p className={`meta ${className}`}>
      {article.author && (
        <>
          By <span className="text-ink">{article.author.name}</span>
        </>
      )}
      {article.author && showDate && article.publishedAt && <span aria-hidden> · </span>}
      {showDate && article.publishedAt && <time dateTime={isoDate(article.publishedAt)}>{formatDate(article.publishedAt)}</time>}
    </p>
  );
}

/** Headline link whose pseudo-element covers the whole card (accessible block-link pattern). */
function HeadlineLink({ article, className = "" }: { article: ArticleCard; className?: string }) {
  return (
    <Link href={articlePath(article)} className={`after:absolute after:inset-0 after:content-[''] ${className}`}>
      <span className="story-link">{article.title}</span>
    </Link>
  );
}

/* Large lead story — headline below image, big serif. */
export function StoryLead({ article, priority, as: Tag = "h2" }: { article: ArticleCard; priority?: boolean; as?: H }) {
  return (
    <article className="group relative">
      <EditorialImage
        media={article.featuredImage}
        ratio="4/5"
        sizes="(min-width: 1024px) 58vw, 100vw"
        priority={priority}
        quality={85}
        className="sm:aspect-[4/3] lg:aspect-[5/4]"
        hoverZoom
      />
      <div className="mt-5 max-w-3xl">
        <CategoryLabel article={article} />
        <Tag className="mt-3 font-serif text-[2rem] leading-[1.08] font-medium tracking-[-0.01em] sm:text-[2.6rem] lg:text-[3.1rem]">
          <HeadlineLink article={article} />
        </Tag>
        {article.excerpt && <p className="mt-4 max-w-2xl text-[1.0625rem] leading-relaxed text-muted">{article.excerpt}</p>}
        <Byline article={article} className="mt-4" />
      </div>
    </article>
  );
}

/* Supporting story — image on top, serif headline. */
export function StoryStack({
  article,
  ratio = "3/2",
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  showExcerpt = false,
  showByline = true,
  priority,
  as: Tag = "h3",
  size = "md",
}: {
  article: ArticleCard;
  ratio?: "4/5" | "3/4" | "1/1" | "3/2" | "4/3" | "16/9";
  sizes?: string;
  showExcerpt?: boolean;
  showByline?: boolean;
  priority?: boolean;
  as?: H;
  size?: "sm" | "md" | "lg";
}) {
  const headline =
    size === "lg"
      ? "text-[1.75rem] sm:text-[2rem] leading-[1.12]"
      : size === "sm"
        ? "text-[1.125rem] leading-snug"
        : "text-[1.375rem] sm:text-[1.5rem] leading-[1.18]";
  return (
    <article className="group relative">
      <EditorialImage media={article.featuredImage} ratio={ratio} sizes={sizes} priority={priority} hoverZoom />
      <div className="mt-4">
        <CategoryLabel article={article} />
        <Tag className={`mt-2.5 font-serif font-medium ${headline}`}>
          <HeadlineLink article={article} />
        </Tag>
        {showExcerpt && article.excerpt && <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-muted">{article.excerpt}</p>}
        {showByline && <Byline article={article} className="mt-2.5" />}
      </div>
    </article>
  );
}

/* Horizontal row — thumbnail left, text right. */
export function StoryRow({
  article,
  showExcerpt = true,
  as: Tag = "h3",
  ratio = "4/3",
}: {
  article: ArticleCard;
  showExcerpt?: boolean;
  as?: H;
  ratio?: "4/3" | "1/1" | "4/5" | "3/2";
}) {
  return (
    <article className="group relative grid grid-cols-[7.5rem_1fr] gap-4 sm:grid-cols-[13rem_1fr] sm:gap-6 lg:grid-cols-[15rem_1fr]">
      <EditorialImage media={article.featuredImage} ratio={ratio} sizes="(min-width: 1024px) 240px, (min-width: 640px) 208px, 120px" hoverZoom />
      <div className="min-w-0 self-center">
        <CategoryLabel article={article} />
        <Tag className="mt-2 font-serif text-[1.1875rem] leading-snug font-medium sm:text-[1.5rem] sm:leading-[1.2]">
          <HeadlineLink article={article} />
        </Tag>
        {showExcerpt && article.excerpt && (
          <p className="mt-2 hidden text-[0.9375rem] leading-relaxed text-muted sm:line-clamp-2">{article.excerpt}</p>
        )}
        <Byline article={article} className="mt-2" />
      </div>
    </article>
  );
}

/* Text-only headline for lists and sidebars. */
export function StoryHeadline({ article, as: Tag = "h3", showLabel = true }: { article: ArticleCard; as?: H; showLabel?: boolean }) {
  return (
    <article className="group relative">
      {showLabel && <CategoryLabel article={article} />}
      <Tag className={`${showLabel ? "mt-2" : ""} font-serif text-[1.125rem] leading-snug font-medium`}>
        <HeadlineLink article={article} />
      </Tag>
    </article>
  );
}

/* Photography-first tile with the headline on a soft scrim for legibility. */
export function StoryOverlay({ article, sizes, ratio = "4/5", as: Tag = "h3" }: { article: ArticleCard; sizes: string; ratio?: "4/5" | "3/4" | "1/1"; as?: H }) {
  return (
    <article className="group relative">
      <EditorialImage media={article.featuredImage} ratio={ratio} sizes={sizes} hoverZoom />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-5 pt-24 pb-5">
        <Tag className="font-serif text-[1.25rem] leading-snug font-medium text-white sm:text-[1.375rem]">
          <Link href={articlePath(article)} className="pointer-events-auto after:absolute after:inset-0 after:content-['']">
            <span className="story-link">{article.title}</span>
          </Link>
        </Tag>
      </div>
    </article>
  );
}
