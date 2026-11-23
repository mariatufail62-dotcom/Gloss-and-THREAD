import Link from "next/link";
import { getCategoryTree } from "@/lib/queries/public";
import { getSetting } from "@/lib/settings";
import { categoryPath } from "@/lib/urls";
import { SITE_DESCRIPTION } from "@/lib/site";

export async function Footer() {
  const [tree, general] = await Promise.all([getCategoryTree().catch(() => []), getSetting("general")]);
  const sections = tree.filter((c) => c.showInNav);
  const year = new Date().getFullYear();

  const company = [
    { label: "About Us", href: "/about/" },
    { label: "Contact", href: "/contact/" },
    { label: "Editorial Policy", href: "/editorial-policy/" },
    { label: "Corrections Policy", href: "/corrections-policy/" },
    { label: "All Articles", href: "/blog/" },
  ];
  const legal = [
    { label: "Privacy Policy", href: "/privacy-policy/" },
    { label: "Terms of Use", href: "/terms/" },
    { label: "Affiliate Disclosure", href: "/affiliate-disclosure/" },
    { label: "Advertising Disclosure", href: "/advertising-policy/" },
    { label: "Sitemap", href: "/sitemap/" },
  ];

  return (
    <footer className="mt-24 bg-ink text-white">
      <div className="page-x grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-10">
        <div>
          <Link href="/" className="inline-block font-serif text-[1.6rem] tracking-(--tracking-wordmark)">
            GLOSS <em className="text-[#d4a3ae]">&amp;</em> THREAD
          </Link>
          <p className="mt-5 max-w-sm text-[0.875rem] leading-relaxed text-white/65">{SITE_DESCRIPTION}</p>
          {general.socialLinks.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
              {general.socialLinks.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer me" className="nav-link text-white/80 hover:text-white">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <FooterCol title="Sections" links={sections.map((c) => ({ label: c.name, href: categoryPath(c) }))} />
        <FooterCol title="Gloss & Thread" links={company} />
        <FooterCol title="Policies" links={legal} />
      </div>
      <div className="border-t border-white/10">
        <div className="page-x flex flex-col gap-2 py-6 text-[0.75rem] text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Gloss &amp; Thread. All rights reserved.</p>
          <p>Independent fashion &amp; beauty journalism, written for readers in the United States.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <p className="label text-white/50">{title}</p>
      <ul className="mt-5 space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-[0.875rem] text-white/85 hover:text-white">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
