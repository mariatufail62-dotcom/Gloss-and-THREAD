import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo/metadata";
import { getSetting } from "@/lib/settings";
import { Breadcrumbs } from "@/components/editorial/Common";
import { ContactForm } from "@/components/forms/ContactForm";

export const metadata: Metadata = pageMetadata({
  title: "Contact Us",
  description: "Contact the Gloss & Thread editors with feedback, story ideas, correction requests or advertising inquiries.",
  path: "/contact/",
});

type Props = { searchParams: Promise<{ topic?: string }> };

export default async function ContactPage({ searchParams }: Props) {
  const [{ topic }, general] = await Promise.all([searchParams, getSetting("general")]);
  return (
    <div className="page-x pt-6 sm:pt-10">
      <Breadcrumbs items={[{ name: "Contact", path: "/contact/" }]} />
      <div className="mt-10 grid gap-14 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
        <div>
          <h1 className="font-serif text-[2.5rem] leading-[1.05] font-medium sm:text-[3.25rem]">Contact Us</h1>
          <p className="mt-5 text-[1.0625rem] leading-relaxed text-muted">
            Every message is read by our editors. Use the form for feedback, story ideas, advertising, privacy requests — or
            to tell us about an error.
          </p>
          <div className="mt-8 space-y-5 border-t border-line pt-8 text-[0.9375rem] leading-relaxed">
            <p>
              <strong className="font-semibold">Corrections.</strong> Choose “Correction request” and include the page URL.
              See our <Link href="/corrections-policy/" className="underline underline-offset-2">corrections policy</Link>.
            </p>
            {general.contactEmail && (
              <p>
                <strong className="font-semibold">Email.</strong>{" "}
                <a href={`mailto:${general.contactEmail}`} className="underline underline-offset-2">{general.contactEmail}</a>
              </p>
            )}
            {general.businessAddress && (
              <p>
                <strong className="font-semibold">Mailing address.</strong>
                <br />
                <span className="whitespace-pre-line">{general.businessAddress}</span>
              </p>
            )}
          </div>
        </div>
        <ContactForm defaultTopic={topic} />
      </div>
    </div>
  );
}
