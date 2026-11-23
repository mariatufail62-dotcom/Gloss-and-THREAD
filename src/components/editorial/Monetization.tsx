import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { getSetting } from "@/lib/settings";
import type { ProductItem } from "@/lib/queries/public";
import { formatDate, formatPrice } from "@/lib/format";

/* ───────────── Affiliate disclosure (centralized text from settings) ───────────── */

export async function AffiliateDisclosure({ className = "" }: { className?: string }) {
  const s = await getSetting("affiliate");
  return (
    <aside aria-label="Affiliate disclosure" className={`border-y border-line py-3 text-[0.8125rem] leading-relaxed text-muted ${className}`}>
      {s.disclosureShort}{" "}
      <Link href="/affiliate-disclosure/" className="text-ink underline decoration-line underline-offset-2 hover:decoration-ink">
        Learn more
      </Link>
      .
    </aside>
  );
}

/* ───────────── Ads — render nothing until a real provider is configured ───────────── */

type AdPlacement = "articleIntro" | "articleMid" | "sidebar" | "betweenSections" | "belowRelated";

const reserved: Record<AdPlacement, string> = {
  articleIntro: "min-h-[280px]",
  articleMid: "min-h-[280px]",
  sidebar: "min-h-[600px]",
  betweenSections: "min-h-[250px] sm:min-h-[100px] lg:min-h-[250px]",
  belowRelated: "min-h-[250px]",
};

export async function AdSlot({ placement, className = "" }: { placement: AdPlacement; className?: string }) {
  const ads = await getSetting("ads");
  const slotId = ads.slots[placement];
  if (!ads.enabled || ads.provider !== "adsense" || !ads.adsenseClientId || !slotId) return null;
  return (
    <aside aria-label="Advertisement" className={`mx-auto w-full ${className}`}>
      <p className="label mb-2 text-center text-[0.625rem] text-muted">Advertisement</p>
      {/* Reserved space prevents layout shift while the ad loads. */}
      <div className={`flex w-full items-center justify-center bg-paper-2 ${reserved[placement]}`}>
        <ins
          className="adsbygoogle block w-full"
          data-ad-client={ads.adsenseClientId}
          data-ad-slot={slotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
        <Script id={`ads-${placement}-${slotId}`} strategy="lazyOnload">
          {`(window.adsbygoogle = window.adsbygoogle || []).push({});`}
        </Script>
      </div>
    </aside>
  );
}

/** Loads the AdSense library once, only when ads are enabled with a real client ID. */
export async function AdsLoader() {
  const ads = await getSetting("ads");
  if (!ads.enabled || ads.provider !== "adsense" || !ads.adsenseClientId) return null;
  return (
    <Script
      id="adsense-lib"
      strategy="lazyOnload"
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ads.adsenseClientId}`}
    />
  );
}

/* ───────────── Product cards (CMS-managed, verified links only) ───────────── */

export function ProductCard({ product }: { product: ProductItem }) {
  const link = product.links[0];
  if (!link) return null;
  const href = link.isAffiliate && link.affiliateUrl ? link.affiliateUrl : link.url;
  const rel = link.isAffiliate ? "sponsored noopener noreferrer" : "noopener noreferrer";
  const price = link.priceVerifiedAt ? formatPrice(link.priceCents, link.currency) : null; // unverified prices are never shown
  return (
    <article className="group relative flex flex-col">
      <div className="relative aspect-square overflow-hidden bg-paper-2">
        {product.image ? (
          <Image
            src={product.image.url}
            alt={product.image.alt || `${product.brand} ${product.name}`}
            fill
            sizes="(min-width: 1024px) 22vw, (min-width: 640px) 33vw, 50vw"
            className="object-contain p-4 mix-blend-multiply transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : null}
      </div>
      <div className="mt-4 flex flex-1 flex-col">
        <p className="label text-muted">{product.brand}</p>
        <h3 className="mt-2 font-serif text-[1.125rem] leading-snug font-medium">{product.name}</h3>
        {product.description && <p className="mt-2 text-[0.875rem] leading-relaxed text-muted">{product.description}</p>}
        <div className="mt-auto pt-4">
          {price && (
            <p className="text-[0.875rem]">
              <span className="font-semibold">{price}</span>
              <span className="text-muted"> at {link.merchant}</span>
              {link.priceVerifiedAt && (
                <span className="block text-[0.75rem] text-muted">Price checked {formatDate(link.priceVerifiedAt)}; may change.</span>
              )}
            </p>
          )}
          <a
            href={href}
            target="_blank"
            rel={rel}
            className="mt-3 inline-flex min-h-11 items-center border-b border-ink text-[0.75rem] font-semibold uppercase tracking-(--tracking-nav) after:absolute after:inset-0 after:content-[''] hover:border-rose hover:text-rose-dark"
          >
            Shop at {link.merchant}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, title }: { products: ProductItem[]; title?: string }) {
  if (!products.length) return null;
  return (
    <section aria-label={title ?? "Product picks"} className="not-prose border-y border-line py-8">
      {title && <h2 className="!mt-0 mb-6 font-serif text-[1.5rem] font-medium">{title}</h2>}
      <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
