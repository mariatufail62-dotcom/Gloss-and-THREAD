import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo/metadata";
import { OwnerPlaceholder, PolicyPage } from "@/components/editorial/PolicyPage";

export const metadata: Metadata = pageMetadata({
  title: "Terms of Use",
  description: "The terms that apply when you use the Gloss & Thread website.",
  path: "/terms/",
});

export default function TermsPage() {
  return (
    <PolicyPage title="Terms of Use" path="/terms/" updated="[set on publication]">
      <p>
        <strong>Note for the site owner:</strong> these terms are a starting framework. Have them reviewed by a qualified
        professional and complete the marked details before launch.
      </p>
      <h2>Using this site</h2>
      <p>
        By using Gloss &amp; Thread you agree to these terms. The site is operated by{" "}
        <OwnerPlaceholder>legal entity name</OwnerPlaceholder>. If you do not agree, please do not use the site.
      </p>
      <h2>Our content</h2>
      <p>
        Articles, photographs, illustrations and design on this site are owned by us or used under license, and are protected by
        copyright. You may share links and short quotations with attribution, but you may not republish our content or images
        without permission.
      </p>
      <h2>Not professional advice</h2>
      <p>
        Our beauty, hair and nail content is general information, not medical or professional advice. Consult a qualified
        professional, such as a board-certified dermatologist, about your own situation.
      </p>
      <h2>Products and third-party links</h2>
      <p>
        We link to third-party websites and retailers. We are not responsible for their content, products, prices or policies.
        Some links are affiliate links — see our <Link href="/affiliate-disclosure/">affiliate disclosure</Link>.
      </p>
      <h2>Submissions</h2>
      <p>When you send us a message, you confirm the information is accurate and that you are entitled to share it.</p>
      <h2>Disclaimers and limitation of liability</h2>
      <p>
        The site is provided “as is.” To the fullest extent permitted by law, we disclaim warranties and are not liable for
        indirect or consequential damages arising from your use of the site.
      </p>
      <h2>Governing law</h2>
      <p>These terms are governed by the laws of <OwnerPlaceholder>state</OwnerPlaceholder>, United States.</p>
      <h2>Contact</h2>
      <p>Questions about these terms can be sent through our <Link href="/contact/">contact page</Link>.</p>
    </PolicyPage>
  );
}
