import Link from "next/link";
import { getSetting } from "@/lib/settings";
import { isNewsletterConfigured } from "@/lib/newsletter";
import { NewsletterForm } from "@/components/forms/NewsletterForm";

/**
 * Newsletter band. The signup form only renders when a real provider is
 * configured — otherwise readers see an honest "coming soon" note, never a
 * form that pretends to work.
 */
export async function NewsletterBand({ source = "home" }: { source?: string }) {
  const s = await getSetting("newsletter");
  const live = isNewsletterConfigured();
  return (
    <section id="newsletter" aria-labelledby="newsletter-heading" className="bg-ink text-white">
      <div className="page-x grid gap-8 py-16 sm:py-20 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-16">
        <div>
          <p className="label text-white/60">Newsletter</p>
          <h2 id="newsletter-heading" className="mt-4 font-serif text-[2.25rem] leading-[1.05] font-medium sm:text-[3rem]">
            {s.heading}
          </h2>
        </div>
        <div>
          <p className="mb-6 max-w-lg text-[1rem] leading-relaxed text-white/75">{s.description}</p>
          {live ? (
            <>
              <NewsletterForm source={source} tone="dark" />
              <p className="mt-4 text-[0.75rem] text-white/55">
                Unsubscribe anytime. See our{" "}
                <Link href="/privacy-policy/" className="underline underline-offset-2 hover:text-white">
                  privacy policy
                </Link>
                .
              </p>
            </>
          ) : (
            <p className="border-l border-white/30 pl-4 text-[0.9375rem] text-white/75">
              Our newsletter is launching soon. In the meantime, new stories appear first on the{" "}
              <Link href="/blog/" className="text-white underline underline-offset-4">
                latest stories page
              </Link>
              .
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
