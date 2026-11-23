import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { pageMetadata } from "@/lib/seo/metadata";
import { authorPath } from "@/lib/urls";
import { getSetting } from "@/lib/settings";
import { OwnerPlaceholder, PolicyPage } from "@/components/editorial/PolicyPage";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  title: "About Us",
  description:
    "Gloss & Thread is an independent US fashion and beauty publication. Learn who we are, what we cover and how we work.",
  path: "/about/",
});

export default async function AboutPage() {
  const [authors, general] = await Promise.all([
    db.author.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { slug: true, name: true, jobTitle: true, kind: true } }),
    getSetting("general"),
  ]);
  return (
    <PolicyPage
      title="About Gloss & Thread"
      path="/about/"
      intro="An independent fashion and beauty publication for readers who want style advice that is beautiful, practical and honest."
    >
      <h2>What we cover</h2>
      <p>
        Gloss &amp; Thread covers personal style for everyday life in the United States: outfits for work, weekends and
        weddings; nail ideas and nail care; shoes; hairstyles; handbags and accessories; and the beauty basics that make
        getting ready simpler. We also look closely at fashion trends — and are honest about which ones are worth your time.
      </p>
      <h2>How we work</h2>
      <p>
        Our stories aim to answer real questions readers have. Before we publish, an editor reviews each article for
        accuracy, sourcing, clarity and image rights. We do not invent testing experiences, quotes, statistics or expert
        credentials, and when we recommend products we say so clearly. Read our{" "}
        <Link href="/editorial-policy/">editorial policy</Link>, <Link href="/corrections-policy/">corrections policy</Link>{" "}
        and <Link href="/affiliate-disclosure/">affiliate disclosure</Link> for the details.
      </p>
      <h2>Who we are</h2>
      <p>
        Gloss &amp; Thread is published by <OwnerPlaceholder>legal publisher / company name</OwnerPlaceholder>
        {general.businessName ? ` (${general.businessName})` : ""}, based in <OwnerPlaceholder>city, state</OwnerPlaceholder>.
      </p>
      {authors.length > 0 && (
        <>
          <p>Stories on this site are credited to:</p>
          <ul>
            {authors.map((a) => (
              <li key={a.slug}>
                <Link href={authorPath(a)}>{a.name}</Link>
                {a.jobTitle ? ` — ${a.jobTitle}` : ""}
              </li>
            ))}
          </ul>
        </>
      )}
      <h2>Get in touch</h2>
      <p>
        Story ideas, feedback and correction requests are always welcome. Use our <Link href="/contact/">contact page</Link>
        {general.contactEmail ? <> or email <a href={`mailto:${general.contactEmail}`}>{general.contactEmail}</a></> : null}.
      </p>
    </PolicyPage>
  );
}
