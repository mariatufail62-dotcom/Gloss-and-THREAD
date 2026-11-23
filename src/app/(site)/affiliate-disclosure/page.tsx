import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo/metadata";
import { getSetting } from "@/lib/settings";
import { PolicyPage } from "@/components/editorial/PolicyPage";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  title: "Affiliate Disclosure",
  description: "How affiliate links work on Gloss & Thread and how our editors choose the products we recommend.",
  path: "/affiliate-disclosure/",
});

export default async function AffiliateDisclosurePage() {
  const s = await getSetting("affiliate");
  return (
    <PolicyPage title="Affiliate Disclosure" path="/affiliate-disclosure/" intro={s.disclosureShort}>
      {s.disclosureLong ? (
        s.disclosureLong.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)
      ) : (
        <>
          <h2>How affiliate links work</h2>
          <p>
            Some product links on Gloss &amp; Thread may be affiliate links. If you click one and make a purchase, the retailer
            may pay us a small commission at no extra cost to you. Affiliate links are marked in our code with the
            <code> rel=&quot;sponsored&quot;</code> attribute, and articles containing them display a disclosure near the top.
          </p>
          <h2>How we choose products</h2>
          <ul>
            <li>Editors select products independently based on usefulness, quality signals, and fit with the story.</li>
            <li>Whether a link earns a commission does not affect whether a product is included or where it appears.</li>
            <li>We only list products with working links to real merchant pages, and we only show a price when we have checked it. Prices change — the retailer&apos;s price at checkout is the one that applies.</li>
            <li>We never claim to have tested a product unless we actually did.</li>
          </ul>
          <h2>Our affiliate relationships</h2>
          <p>
            We will list the affiliate programs and networks we participate in here once those relationships are active. We
            do not claim partnerships we do not have.
          </p>
        </>
      )}
      <p>
        Questions? <Link href="/contact/">Contact our editors</Link>.
      </p>
    </PolicyPage>
  );
}
