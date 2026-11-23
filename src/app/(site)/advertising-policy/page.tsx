import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo/metadata";
import { PolicyPage } from "@/components/editorial/PolicyPage";

export const metadata: Metadata = pageMetadata({
  title: "Advertising Disclosure & Policy",
  description: "How advertising and sponsored content are handled and labeled on Gloss & Thread.",
  path: "/advertising-policy/",
});

export default function AdvertisingPolicyPage() {
  return (
    <PolicyPage title="Advertising Disclosure" path="/advertising-policy/" intro="Advertising helps fund our journalism. It never decides what we write.">
      <h2>Display advertising</h2>
      <p>
        Gloss &amp; Thread may show display ads served by third-party ad networks. Ads are always labeled “Advertisement,”
        are kept visually separate from editorial content, and are placed so they are not easily confused with links or
        buttons. We do not use pop-ups or deceptive ad formats.
      </p>
      <p>
        Ad partners may use cookies or similar technologies to show relevant ads. See our{" "}
        <Link href="/privacy-policy/">privacy policy</Link> for how this works and the choices available to you.
      </p>
      <h2>Sponsored content</h2>
      <p>
        If a brand pays for or commissions a story, it is clearly labeled “Sponsored” with the sponsor&apos;s name, both on the
        article and wherever it appears in lists. Sponsored stories are held to our editorial standards for accuracy.
      </p>
      <h2>Separation from editorial</h2>
      <p>
        Advertisers do not review, approve or influence our editorial coverage. See our{" "}
        <Link href="/editorial-policy/">editorial policy</Link>.
      </p>
      <h2>Advertising inquiries</h2>
      <p>
        To discuss advertising, use our <Link href="/contact/?topic=ADVERTISING">contact form</Link> and choose “Advertising.”
      </p>
    </PolicyPage>
  );
}
