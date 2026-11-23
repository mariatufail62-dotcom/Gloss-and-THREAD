import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo/metadata";
import { PolicyPage } from "@/components/editorial/PolicyPage";

export const metadata: Metadata = pageMetadata({
  title: "Corrections Policy",
  description: "How to report an error to Gloss & Thread and how we correct and disclose mistakes.",
  path: "/corrections-policy/",
});

export default function CorrectionsPolicyPage() {
  return (
    <PolicyPage title="Corrections Policy" path="/corrections-policy/" intro="When we get something wrong, we fix it — openly.">
      <h2>How to report an error</h2>
      <p>
        Use our <Link href="/contact/?topic=CORRECTION">correction request form</Link>. Include the page URL, what is
        incorrect, and — where possible — a source for the correct information. Requests go directly to our editors.
      </p>
      <h2>What happens next</h2>
      <ol>
        <li>An editor reviews every request, usually within a few business days.</li>
        <li>If we confirm an error, we correct the article promptly.</li>
        <li>Substantive corrections (facts, figures, attributions, product details) are noted at the end of the article with the date and a short description of what changed.</li>
        <li>Minor fixes such as typos or formatting are made without a note.</li>
      </ol>
      <h2>Updates versus corrections</h2>
      <p>
        When we refresh a guide with new information — not because it was wrong — we show an “Updated” date at the top of the
        article instead of a correction note.
      </p>
    </PolicyPage>
  );
}
