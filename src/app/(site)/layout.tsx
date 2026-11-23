import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AdsLoader } from "@/components/editorial/Monetization";
import { JsonLd } from "@/components/editorial/Common";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/jsonld";
import { getSetting } from "@/lib/settings";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const general = await getSetting("general");
  return (
    <>
      <JsonLd data={[organizationJsonLd(general.socialLinks.map((s) => s.url)), websiteJsonLd()]} />
      <Header />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <Footer />
      <AdsLoader />
    </>
  );
}
