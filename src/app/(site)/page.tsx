import type { Metadata } from "next";
import {
  type ArticleCard,
  getEditorsPicks,
  getHeroArticles,
  getLatestArticles,
  getPopularArticles,
  getRootCategory,
  getSectionArticles,
} from "@/lib/queries/public";
import { getSetting } from "@/lib/settings";
import { pageMetadata } from "@/lib/seo/metadata";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import { AdSlot } from "@/components/editorial/Monetization";
import { NewsletterBand } from "@/components/editorial/NewsletterBand";
import { EmptyState } from "@/components/editorial/Common";
import {
  AccessoriesSection,
  BeautyHairSection,
  EditorsPicksSection,
  HeroSection,
  LatestSection,
  NailsSection,
  OutfitsSection,
  PopularSection,
  ShoesSection,
} from "@/components/home/HomeSections";

export const revalidate = 600;

export const metadata: Metadata = pageMetadata({
  title: `${SITE_NAME} — ${SITE_TAGLINE}`,
  absoluteTitle: true,
  description: SITE_DESCRIPTION,
  path: "/",
});

/** Prefer stories not already shown higher on the page; fall back to repeats only if needed. */
function preferUnused(items: ArticleCard[], used: Set<string>, want: number) {
  const fresh = items.filter((a) => !used.has(a.id));
  const picked = fresh.length >= want ? fresh.slice(0, want) : [...fresh, ...items.filter((a) => used.has(a.id))].slice(0, want);
  picked.forEach((a) => used.add(a.id));
  return picked;
}

export default async function HomePage() {
  const [hero, settings] = await Promise.all([getHeroArticles(), getSetting("homepage")]);
  const used = new Set(hero.map((a) => a.id));

  const [latestRaw, nailsRaw, outfitsRaw, shoesRaw, beautyRaw, hairRaw, accRaw, popular, picks, roots] = await Promise.all([
    getLatestArticles({ take: 6, excludeIds: [...used] }),
    getSectionArticles("nails", 8),
    getSectionArticles("outfits", 9),
    getSectionArticles("shoes", 8),
    getSectionArticles("beauty", 6),
    getSectionArticles("hairstyles", 6),
    getSectionArticles("accessories", 6),
    getPopularArticles(6),
    getEditorsPicks(8),
    Promise.all(["nails", "outfits", "shoes", "beauty", "hairstyles", "accessories"].map(getRootCategory)),
  ]);
  const [nailsRoot, outfitsRoot, shoesRoot, beautyRoot, hairRoot, accRoot] = roots;

  latestRaw.forEach((a) => used.add(a.id));
  const nails = preferUnused(nailsRaw, used, 4);
  const outfits = preferUnused(outfitsRaw, used, 5);
  const shoes = preferUnused(shoesRaw, used, 4);
  const beauty = preferUnused(beautyRaw, used, 3);
  const hair = preferUnused(hairRaw, used, 3);
  const acc = preferUnused(accRaw, used, 4);

  if (!hero.length) {
    return (
      <div className="page-x py-24">
        <h1 className="sr-only">{SITE_NAME}</h1>
        <EmptyState title="Stories are on their way">
          Our editors are preparing the first issue. Please check back soon.
        </EmptyState>
      </div>
    );
  }

  const sections: Record<string, React.ReactNode> = {
    latest: (
      <>
        <LatestSection stories={latestRaw} />
        <AdSlot placement="betweenSections" className="page-x mt-16" />
      </>
    ),
    nails: <NailsSection stories={nails} root={nailsRoot} />,
    outfits: <OutfitsSection stories={outfits} root={outfitsRoot} />,
    shoes: <ShoesSection stories={shoes} root={shoesRoot} />,
    beautyHair: <BeautyHairSection beauty={beauty} hair={hair} beautyRoot={beautyRoot} hairRoot={hairRoot} />,
    accessories: <AccessoriesSection stories={acc} root={accRoot} />,
    editorsPicks: <EditorsPicksSection products={picks} />,
    popular: <PopularSection curated={popular.curated} stories={popular.items} />,
    newsletter: (
      <div className="mt-24">
        <NewsletterBand source="home" />
      </div>
    ),
  };

  return (
    <>
      <h1 className="sr-only">
        {SITE_NAME}: {SITE_TAGLINE}
      </h1>
      <HeroSection stories={hero} />
      {settings.sectionOrder.map((key) => (
        <div key={key}>{sections[key]}</div>
      ))}
    </>
  );
}
