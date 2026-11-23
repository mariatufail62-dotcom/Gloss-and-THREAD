import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import type { Block } from "@/lib/blocks/schema";
import { parseInline, type InlineNode } from "@/lib/blocks/inline";
import { headingAnchors } from "@/lib/blocks/text";
import type { BodyRefMaps, MediaItem } from "@/lib/queries/public";
import { articlePath } from "@/lib/urls";
import { siteUrl } from "@/lib/site";
import { AffiliateDisclosure, AdSlot, ProductGrid } from "@/components/editorial/Monetization";
import { EditorialImage } from "@/components/editorial/EditorialImage";

/* ───────────── inline ───────────── */

function renderInline(nodes: InlineNode[], key = "i"): React.ReactNode {
  return nodes.map((n, i) => {
    const k = `${key}-${i}`;
    if (n.type === "text") return <Fragment key={k}>{n.value}</Fragment>;
    if (n.type === "strong") return <strong key={k}>{renderInline(n.children, k)}</strong>;
    if (n.type === "em") return <em key={k}>{renderInline(n.children, k)}</em>;
    const origin = siteUrl();
    const isOwn = n.external && n.href.startsWith(origin);
    if (!n.external || isOwn) {
      const href = isOwn ? n.href.slice(origin.length) || "/" : n.href;
      return (
        <Link key={k} href={href}>
          {renderInline(n.children, k)}
        </Link>
      );
    }
    return (
      <a key={k} href={n.href} target="_blank" rel="noopener noreferrer">
        {renderInline(n.children, k)}
      </a>
    );
  });
}

export function Inline({ text }: { text: string }) {
  return <>{renderInline(parseInline(text))}</>;
}

/* ───────────── media helpers ───────────── */

function Credit({ media }: { media: MediaItem }) {
  if (!media.credit) return null;
  return (
    <span className="text-muted/90">
      {" "}
      {media.creditUrl ? (
        <a href={media.creditUrl} target="_blank" rel="noopener noreferrer" className="!no-underline hover:!underline">
          {media.credit}
        </a>
      ) : (
        media.credit
      )}
    </span>
  );
}

function Figure({ media, caption, wide }: { media: MediaItem; caption?: string; wide?: boolean }) {
  const cap = caption ?? media.caption ?? undefined;
  return (
    <figure className={wide ? "lg:-mx-24" : ""}>
      <div className="overflow-hidden bg-paper-2">
        <Image
          src={media.url}
          alt={media.alt}
          width={media.width}
          height={media.height}
          sizes={wide ? "(min-width: 1024px) 870px, 100vw" : "(min-width: 768px) 680px, 100vw"}
          className="h-auto w-full"
        />
      </div>
      {(cap || media.credit) && (
        <figcaption className="mt-3 text-[0.8125rem] leading-relaxed text-muted">
          {cap && <Inline text={cap} />}
          <Credit media={media} />
        </figcaption>
      )}
    </figure>
  );
}

/* ───────────── body ───────────── */

interface Props {
  blocks: Block[];
  refs: BodyRefMaps;
  /** Insert in-content ad slots (only rendered when ads are configured). */
  withAds?: boolean;
  wordCount?: number;
  minWordsForMidAd?: number;
}

export function ArticleBody({ blocks, refs, withAds, wordCount = 0, minWordsForMidAd = 900 }: Props) {
  const anchors = headingAnchors(blocks);
  const paragraphIdx: number[] = [];
  blocks.forEach((b, i) => b.type === "paragraph" && paragraphIdx.push(i));
  // Intro ad after the 2nd paragraph; mid ad roughly halfway through long articles.
  const introAt = withAds ? paragraphIdx[1] : undefined;
  const midAt =
    withAds && wordCount >= minWordsForMidAd && paragraphIdx.length >= 8
      ? paragraphIdx[Math.floor(paragraphIdx.length / 2)]
      : undefined;

  return (
    <div className="article-body">
      {blocks.map((b, i) => (
        <Fragment key={b.id}>
          <BlockView block={b} refs={refs} anchorId={anchors.get(b.id)?.id} />
          {i === introAt && <AdSlot placement="articleIntro" className="!my-10" />}
          {i === midAt && <AdSlot placement="articleMid" className="!my-10" />}
        </Fragment>
      ))}
    </div>
  );
}

function BlockView({ block: b, refs, anchorId }: { block: Block; refs: BodyRefMaps; anchorId?: string }) {
  switch (b.type) {
    case "paragraph":
      return (
        <p>
          <Inline text={b.text} />
        </p>
      );

    case "heading":
      return b.level === 2 ? (
        <h2 id={anchorId}>
          <Inline text={b.text} />
        </h2>
      ) : (
        <h3 id={anchorId}>
          <Inline text={b.text} />
        </h3>
      );

    case "list": {
      const items = b.items.map((it, i) => (
        <li key={i}>
          <Inline text={it} />
        </li>
      ));
      return b.style === "number" ? <ol>{items}</ol> : <ul>{items}</ul>;
    }

    case "quote":
      return (
        <figure className="!my-12 border-y border-ink py-8 text-center">
          <blockquote className="font-serif text-[1.5rem] leading-[1.35] text-ink italic sm:text-[1.75rem]">
            <p>
              <Inline text={b.text} />
            </p>
          </blockquote>
          {b.attribution && <figcaption className="label mt-5 text-muted">{b.attribution}</figcaption>}
        </figure>
      );

    case "image": {
      const media = refs.media.get(b.mediaId);
      if (!media) return null;
      return <Figure media={media} caption={b.caption} wide={b.size === "wide"} />;
    }

    case "gallery": {
      const items = b.items.map((it) => ({ ...it, media: refs.media.get(it.mediaId) })).filter((it) => it.media);
      if (!items.length) return null;
      return (
        <section aria-label={b.title ?? "Gallery"} className="lg:-mx-24">
          {b.title && <h3 className="!mt-0 mb-5 font-serif text-[1.375rem] font-medium">{b.title}</h3>}
          <div className={`grid gap-4 ${items.length === 1 ? "" : "grid-cols-2"} ${items.length >= 3 ? "lg:grid-cols-3" : ""}`}>
            {items.map((it, i) => (
              <figure key={i}>
                <EditorialImage media={it.media} ratio="4/5" sizes="(min-width: 1024px) 290px, 50vw" />
                {(it.caption || it.media!.caption) && (
                  <figcaption className="mt-2 text-[0.8125rem] leading-snug text-muted">
                    <Inline text={it.caption ?? it.media!.caption ?? ""} />
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
          {items.some((it) => it.media!.credit) && (
            <p className="mt-3 text-[0.75rem] text-muted">
              Images: {[...new Set(items.map((it) => it.media!.credit).filter(Boolean))].join("; ")}
            </p>
          )}
        </section>
      );
    }

    case "table":
      return (
        <figure className="!my-10">
          <div className="overflow-x-auto border-y border-ink" tabIndex={0} role="region" aria-label={b.caption ?? "Comparison table"}>
            <table className="w-full min-w-[32rem] border-collapse text-left text-[0.9375rem]">
              {b.caption && <caption className="sr-only">{b.caption}</caption>}
              <thead>
                <tr className="border-b border-line">
                  {b.headers.map((h, i) => (
                    <th key={i} scope="col" className="label px-3 py-3.5 align-bottom text-ink first:pl-0">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.rows.map((row, r) => (
                  <tr key={r} className="border-b border-line last:border-0">
                    {row.map((cell, c) =>
                      c === 0 ? (
                        <th key={c} scope="row" className="px-3 py-3.5 align-top font-semibold first:pl-0">
                          <Inline text={cell} />
                        </th>
                      ) : (
                        <td key={c} className="px-3 py-3.5 align-top text-[#3a3a3a]">
                          <Inline text={cell} />
                        </td>
                      )
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {b.caption && <figcaption className="mt-3 text-[0.8125rem] text-muted">{b.caption}</figcaption>}
        </figure>
      );

    case "callout": {
      const label = b.title ?? (b.variant === "tip" ? "Editor's tip" : b.variant === "note" ? "Good to know" : "Quick guide");
      return (
        <aside className={`callout !my-10 px-6 py-6 sm:px-8 ${b.variant === "tip" ? "bg-rose-wash/70" : "bg-paper-2"}`}>
          <p className="label mb-3 text-rose-dark">{label}</p>
          <p className="text-[1rem] leading-relaxed">
            <Inline text={b.text} />
          </p>
        </aside>
      );
    }

    case "products": {
      const products = b.productIds.map((id) => refs.products.get(id)).filter((p): p is NonNullable<typeof p> => !!p);
      return <ProductGrid products={products} title={b.title} />;
    }

    case "related": {
      const items = b.articleIds.map((id) => refs.articles.get(id)).filter((a): a is NonNullable<typeof a> => !!a);
      if (!items.length) return null;
      return (
        <aside className="!my-10 border-l-2 border-ink pl-5">
          <p className="label mb-3 text-muted">{b.title ?? "Related reading"}</p>
          <ul className="!pl-0 space-y-2" style={{ listStyle: "none" }}>
            {items.map((a) => (
              <li key={a.id} className="before:!hidden">
                <Link href={articlePath(a)} className="font-serif text-[1.125rem] leading-snug !no-underline hover:!text-rose-dark">
                  {a.title}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      );
    }

    case "disclosure":
      return <AffiliateDisclosure />;

    case "embed": {
      const src =
        b.provider === "youtube"
          ? `https://www.youtube-nocookie.com/embed/${b.videoId}`
          : `https://player.vimeo.com/video/${b.videoId}?dnt=1`;
      return (
        <figure className="!my-10">
          <div className="relative aspect-video bg-paper-2">
            <iframe
              src={src}
              title={b.title}
              loading="lazy"
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              className="absolute inset-0 h-full w-full"
            />
          </div>
          {b.caption && (
            <figcaption className="mt-3 text-[0.8125rem] text-muted">
              <Inline text={b.caption} />
            </figcaption>
          )}
        </figure>
      );
    }

    case "faq":
      // Rendered as visible Q&A for readers. No FAQPage schema is emitted.
      return (
        <section aria-label={b.title ?? "Frequently asked questions"} className="!mt-14">
          <h2 id={anchorId ?? "faq"} className="!mt-0">
            {b.title ?? "Your questions, answered"}
          </h2>
          <div className="mt-6 divide-y divide-line border-y border-line">
            {b.items.map((it, i) => (
              <details key={i} className="group py-1" open={i === 0}>
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-3 font-semibold text-ink [&::-webkit-details-marker]:hidden">
                  {it.question}
                  <span aria-hidden className="text-xl leading-none text-muted transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="pb-4 text-[1rem]">
                  <Inline text={it.answer} />
                </p>
              </details>
            ))}
          </div>
        </section>
      );

    case "divider":
      return (
        <div aria-hidden className="!my-12 text-center font-serif text-xl tracking-[0.6em] text-rose">
          ✦ ✦ ✦
        </div>
      );

    default:
      return null;
  }
}
