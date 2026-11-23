import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo/metadata";
import { PolicyPage } from "@/components/editorial/PolicyPage";

export const metadata: Metadata = pageMetadata({
  title: "Editorial Policy & Standards",
  description: "How Gloss & Thread researches, writes, reviews and updates its fashion and beauty stories.",
  path: "/editorial-policy/",
});

export default function EditorialPolicyPage() {
  return (
    <PolicyPage
      title="Editorial Policy"
      path="/editorial-policy/"
      intro="The standards every Gloss & Thread story is held to, from first draft to update."
    >
      <h2>Our purpose</h2>
      <p>
        We publish style and beauty journalism that helps readers make decisions — what to wear, what to try, what to skip.
        Every story should leave a reader better informed than a quick search would.
      </p>
      <h2>Research and accuracy</h2>
      <ul>
        <li>We start from the reader&apos;s question and look at what is already available, so our story adds something useful.</li>
        <li>Factual claims — especially about skin, hair, nails and health-adjacent topics — are checked against authoritative sources, which we link where relevant.</li>
        <li>We never fabricate personal testing, quotes, interviews, celebrity statements, trend statistics or credentials.</li>
        <li>We only describe a product as tested when real testing took place, and we explain how.</li>
        <li>Beauty and nail-care content is general information, not medical advice. For skin, scalp or nail concerns, we recommend a board-certified dermatologist.</li>
      </ul>
      <h2>Editorial review</h2>
      <p>
        Every article is reviewed by an editor before publication. The review covers accuracy, sourcing, clarity, fairness,
        image rights and disclosures. Our publishing system will not publish an article until that review is recorded.
      </p>
      <h2>Images</h2>
      <p>
        We use photography we own, have licensed, or have permission to publish, and we credit images as required. We do not
        republish other publications&apos; photography.
      </p>
      <h2>Independence, affiliate links and advertising</h2>
      <p>
        Editors choose what we cover and recommend. Some links may earn us a commission; that never determines whether a product
        is included. Sponsored content is always labeled. See our <Link href="/affiliate-disclosure/">affiliate disclosure</Link> and{" "}
        <Link href="/advertising-policy/">advertising policy</Link>.
      </p>
      <h2>Updates and corrections</h2>
      <p>
        We update evergreen guides when advice or information changes, and show an “Updated” date when we make a meaningful
        change. Errors are corrected promptly and transparently under our <Link href="/corrections-policy/">corrections policy</Link>.
      </p>
      <h2>Use of AI tools</h2>
      <p>
        Any tools used in research or drafting are subject to the same standards as everything else: a human editor is
        responsible for every published word, verifies every fact, and approves every story.
      </p>
    </PolicyPage>
  );
}
